-- PostgreSQL schema (multi-tenant single-schema)
-- Money: VND integer (no decimals)

-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type production_status as enum ('DRAFT','SUBMITTED','APPROVED','REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payroll_status as enum ('DRAFT','CALCULATED','LOCKED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_type as enum ('IN','OUT');
exception when duplicate_object then null; end $$;

-- Common updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================
-- 1) Tenancy / Org
-- =========================
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subdomain text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_companies_updated_at before update on companies
for each row execute function set_updated_at();

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  gps_radius_m integer not null default 200,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branches_gps_radius_positive check (gps_radius_m > 0)
);
create index if not exists idx_branches_company on branches(company_id);
create trigger trg_branches_updated_at before update on branches
for each row execute function set_updated_at();

-- =========================
-- 2) Users / RBAC
-- =========================
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  code text,
  full_name text not null,
  email text,
  phone text,
  status text not null default 'ACTIVE',
  joined_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_company_code_unique unique (company_id, code)
);
create index if not exists idx_employees_company on employees(company_id);
create index if not exists idx_employees_company_branch on employees(company_id, branch_id);
create trigger trg_employees_updated_at before update on employees
for each row execute function set_updated_at();

-- Store company_id on users to speed up tenant filters and enforce cross-tenant FK.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  email text,
  username text not null,
  password_hash text not null,
  employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_company_username_unique unique (company_id, username),
  constraint users_company_email_unique unique (company_id, email),
  constraint users_company_employee_unique unique (company_id, employee_id),
  constraint users_employee_fk foreign key (employee_id) references employees(id) deferrable initially deferred
);
create index if not exists idx_users_company on users(company_id);
create trigger trg_users_updated_at before update on users
for each row execute function set_updated_at();

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_company_name_unique unique (company_id, name)
);
create index if not exists idx_roles_company on roles(company_id);
create trigger trg_roles_updated_at before update on roles
for each row execute function set_updated_at();

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  primary key (user_id, role_id)
);

create table if not exists role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_refresh_tokens_company_user on refresh_tokens(company_id, user_id);
create index if not exists idx_refresh_tokens_expires on refresh_tokens(expires_at);

-- =========================
-- 3) Attendance (GPS check-in)
-- =========================
create table if not exists attendance_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  type attendance_type not null,
  occurred_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  distance_m integer,
  device_meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_attendance_company_employee_time on attendance_events(company_id, employee_id, occurred_at desc);
create index if not exists idx_attendance_company_time on attendance_events(company_id, occurred_at desc);

-- =========================
-- 4) Product + Production logs (piece-rate)
-- =========================
create table if not exists product_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  unit text not null default 'pcs',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_types_company_name_unique unique (company_id, name)
);
create index if not exists idx_product_types_company on product_types(company_id);
create trigger trg_product_types_updated_at before update on product_types
for each row execute function set_updated_at();

create table if not exists piece_rates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  product_type_id uuid not null references product_types(id) on delete cascade,
  rate_vnd integer not null,
  effective_from date not null,
  created_at timestamptz not null default now(),
  constraint piece_rates_rate_positive check (rate_vnd >= 0),
  constraint piece_rates_unique unique (company_id, product_type_id, effective_from)
);
create index if not exists idx_piece_rates_company_product_effective_desc
  on piece_rates(company_id, product_type_id, effective_from desc);

create table if not exists production_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  product_type_id uuid not null references product_types(id) on delete cascade,
  work_date date not null,
  quantity integer not null,
  status production_status not null default 'DRAFT',
  evidence_url text,
  note text,
  submitted_at timestamptz,
  approved_by uuid references users(id) on delete set null,
  approved_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_entries_quantity_nonneg check (quantity >= 0),
  constraint production_entries_unique unique (company_id, employee_id, work_date, product_type_id)
);
create index if not exists idx_production_company_work_date on production_entries(company_id, work_date);
create index if not exists idx_production_company_employee_work_date on production_entries(company_id, employee_id, work_date);
create index if not exists idx_production_company_status on production_entries(company_id, status);
create trigger trg_production_entries_updated_at before update on production_entries
for each row execute function set_updated_at();

-- Allowances (fixed per month; no prorate in prototype)
create table if not exists employee_allowances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  name text not null,
  amount_vnd integer not null,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint allowances_amount_nonneg check (amount_vnd >= 0),
  constraint allowances_effective_range check (effective_to is null or effective_to >= effective_from)
);
create index if not exists idx_allowances_company_employee_from on employee_allowances(company_id, employee_id, effective_from);
create trigger trg_employee_allowances_updated_at before update on employee_allowances
for each row execute function set_updated_at();

-- =========================
-- 5) Payroll
-- =========================
create table if not exists payroll_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  year integer not null,
  month integer not null,
  status payroll_status not null default 'DRAFT',
  calculated_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_runs_year_month check (month between 1 and 12),
  constraint payroll_runs_unique unique (company_id, year, month)
);
create index if not exists idx_payroll_runs_company_year_month on payroll_runs(company_id, year, month);
create trigger trg_payroll_runs_updated_at before update on payroll_runs
for each row execute function set_updated_at();

create table if not exists payroll_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  payroll_run_id uuid not null references payroll_runs(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  production_pay_vnd integer not null default 0,
  allowances_vnd integer not null default 0,
  total_vnd integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_lines_unique unique (company_id, payroll_run_id, employee_id),
  constraint payroll_lines_money_nonneg check (production_pay_vnd >= 0 and allowances_vnd >= 0 and total_vnd >= 0)
);
create index if not exists idx_payroll_lines_company_run on payroll_lines(company_id, payroll_run_id);
create trigger trg_payroll_lines_updated_at before update on payroll_lines
for each row execute function set_updated_at();

create table if not exists payroll_line_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  payroll_line_id uuid not null references payroll_lines(id) on delete cascade,
  product_type_id uuid not null references product_types(id) on delete cascade,
  quantity_total integer not null,
  rate_effective_from date not null,
  rate_vnd integer not null,
  amount_vnd integer not null,
  created_at timestamptz not null default now(),
  constraint payroll_line_items_nonneg check (quantity_total >= 0 and rate_vnd >= 0 and amount_vnd >= 0)
);
create index if not exists idx_payroll_line_items_company_line on payroll_line_items(company_id, payroll_line_id);

-- =========================
-- 6) Audit log (security-critical)
-- =========================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  ip inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_company_time on audit_logs(company_id, created_at desc);
create index if not exists idx_audit_actor_time on audit_logs(actor_user_id, created_at desc);

