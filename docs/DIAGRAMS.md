# Diagrams — Use Case / Sequence / ERD / Architecture

## 1) Architecture diagram (prototype)
```mermaid
flowchart TD
  RN["Mobile App (React Native)"] --> GW["API Gateway (Nginx)"]
  WEB["Web Admin/Manager (Next.js)"] --> GW
  GW --> API["Backend (NestJS - modular monolith)"]

  API --> PG[(PostgreSQL)]
  API --> REDIS[(Redis)]
  API --> S3[(Object Storage - S3)]
  API --> FCM["Firebase Cloud Messaging"]

  subgraph Modules["NestJS Modules"]
    AUTH["Auth + RBAC"]
    TENANT["Tenant Context"]
    ATT["Attendance (GPS)"]
    PROD["Production"]
    PAY["Payroll Engine"]
    UP["Uploads"]
    AUD["Audit Log"]
  end

  API --> Modules
```

## 2) Service breakdown (future-ready)
- `auth-service`: login/refresh/logout + RBAC
- `tenant-service`: company config, policies
- `attendance-service`: GPS check-in + anti-fake
- `production-service`: production entries + approval workflow
- `payroll-service`: payroll run + calculate/lock + exports
- `upload-service`: S3 upload + signed URLs
- `notification-service`: FCM push
- `audit-service`: event/audit log

Prototype hiện tại có thể đi theo “microservices-ready monolith” và tách dần.

## 3) Use case diagram (high level)
```mermaid
flowchart LR
  subgraph Employee
    E1[Login]
    E2[GPS Check-in]
    E3[Upload production + evidence]
    E4[Submit production]
    E5[View payslip]
  end

  subgraph Manager
    M1[View submitted production]
    M2[Approve/Reject]
    M3[View evidence]
  end

  subgraph Admin
    A1[Manage product types]
    A2[Manage piece rates]
    A3[Manage allowances]
    A4[Create payroll run]
    A5[Calculate payroll]
    A6[Lock payroll]
  end

  E4 --> M1 --> M2
  M2 --> A5
  A6 --> M2
```

## 4) Sequence — Upload sản lượng → Duyệt → Tính lương
```mermaid
sequenceDiagram
  autonumber
  participant RN as Mobile (Employee)
  participant API as NestJS API
  participant S3 as Object Storage
  participant DB as PostgreSQL
  participant M as Mobile/Web (Manager)
  participant A as Web (Admin)

  RN->>API: POST /auth/login (X-Tenant-Id)
  API->>DB: validate user + roles
  API-->>RN: access_token + refresh_token

  RN->>API: POST /uploads (multipart)
  API->>S3: upload file (prod)
  API-->>RN: evidence_url

  RN->>API: POST /production-entries (DRAFT)
  API->>DB: upsert unique (employee, date, product)
  API-->>RN: entry_id

  RN->>API: POST /production-entries/:id/submit
  API->>DB: set status=SUBMITTED
  API-->>RN: ok

  M->>API: GET /production-entries?status=SUBMITTED
  API->>DB: list submitted
  API-->>M: entries

  M->>API: POST /production-entries/:id/approve
  API->>DB: status=APPROVED + approved_by
  API-->>M: ok

  A->>API: POST /payroll-runs (year, month)
  API->>DB: create payroll_run
  API-->>A: payroll_run_id

  A->>API: POST /payroll-runs/:id/calculate
  API->>DB: fetch approved entries + rates + allowances
  API->>DB: write payroll_lines + payroll_line_items (snapshot)
  API-->>A: calculated

  A->>API: POST /payroll-runs/:id/lock
  API->>DB: status=LOCKED
  API-->>A: locked
```

## 5) Sequence — GPS Check-in
```mermaid
sequenceDiagram
  autonumber
  participant RN as Mobile (Employee)
  participant API as NestJS API
  participant DB as PostgreSQL

  RN->>API: POST /attendance/check-in (lat,lng,device_meta)
  API->>DB: load branch location + radius policy
  API->>API: haversine distance + validate
  alt in radius
    API->>DB: insert AttendanceEvent(IN)
    API-->>RN: ok + distance
  else out of radius
    API-->>RN: 400 "Out of radius" + distance
  end
```

## 6) ERD (core)
```mermaid
erDiagram
  companies ||--o{ branches : has
  companies ||--o{ employees : has
  employees ||--|| users : has

  companies ||--o{ roles : has
  roles ||--o{ role_permissions : has
  permissions ||--o{ role_permissions : has
  users ||--o{ user_roles : has
  roles ||--o{ user_roles : has

  companies ||--o{ product_types : has
  product_types ||--o{ piece_rates : has

  employees ||--o{ production_entries : logs
  product_types ||--o{ production_entries : type

  employees ||--o{ employee_allowances : has

  companies ||--o{ payroll_runs : has
  payroll_runs ||--o{ payroll_lines : has
  payroll_lines ||--o{ payroll_line_items : has
  product_types ||--o{ payroll_line_items : ref

  employees ||--o{ attendance_events : has
  branches ||--o{ attendance_events : at

  users ||--o{ refresh_tokens : has
  companies ||--o{ refresh_tokens : has
```

