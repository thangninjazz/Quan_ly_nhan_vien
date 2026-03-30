# PRD — Hệ thống SaaS Quản lý Nhân sự & Sản xuất (HR + Production)

## 1) Mục tiêu sản phẩm
Xây hệ thống SaaS cho doanh nghiệp sản xuất, hỗ trợ:
- Chấm công **GPS check-in** theo chi nhánh.
- Nhân viên **upload sản lượng theo ngày** (kèm ảnh minh chứng).
- Quản lý **duyệt/từ chối** sản lượng.
- Admin **tính lương theo sản lượng + phụ cấp cố định**, theo **kỳ tháng** (timezone `Asia/Saigon`).
- Multi-tenant: mỗi công ty (tenant) cô lập dữ liệu.

## 2) Phạm vi (Prototype v1)
Bao gồm:
- Auth (JWT + refresh token rotation)
- RBAC (role + permission)
- Product Type + Piece Rate (version theo `effective_from`)
- Production log workflow: DRAFT → SUBMITTED → APPROVED/REJECTED
- Payroll: tạo kỳ → calculate → lock; snapshot line + line items
- Upload ảnh minh chứng (local disk; tenant-scoped)

Chưa bao gồm (để lên production):
- Attendance GPS validation (haversine + anti-fake)
- Push notification (Firebase)
- Object storage (S3)
- Redis cache + queue/batch jobs chuẩn
- Audit log đầy đủ, rate-limit, monitoring
- Mobile app React Native

## 3) Roles & phân quyền (locked)
### Roles
- **Employee**: khai báo sản lượng, xem phiếu lương của mình, check-in.
- **Manager**: duyệt sản lượng, theo dõi hiệu suất nhóm.
- **Admin**: quản trị dữ liệu công ty (nhân viên, sản phẩm/đơn giá, phụ cấp), chạy kỳ lương.
- **Super Admin** (SaaS owner): quản trị tenant (tạo công ty, billing, policy), truy cập audit tổng.

### Permission model
Kiểm tra theo quyền dạng string code (VD `production.approve`) thay vì hard-code `isAdmin`.

Đề xuất permission codes tối thiểu:
- `auth.login`, `auth.refresh`, `auth.logout`
- `company.read`, `company.manage`
- `employee.read`, `employee.manage`
- `attendance.checkin`, `attendance.manage`
- `product.manage`, `rate.manage`
- `production.submit`, `production.approve`
- `employee.allowance.manage`
- `payroll.run`, `payroll.lock`
- `payslip.view_self`
- `audit.read`

## 4) Use cases (theo role)
### Employee
- Login
- Check-in GPS (in/out)
- Upload sản lượng (theo ngày, theo loại sản phẩm, kèm ảnh)
- Gửi duyệt sản lượng
- Xem lịch sử sản lượng & trạng thái
- Xem payslip theo tháng

### Manager
- Login
- Danh sách sản lượng đang chờ duyệt
- Approve/Reject (có lý do)
- Xem ảnh minh chứng (zoom)
- (v2) Dashboard hiệu suất team

### Admin
- Login
- CRUD nhân viên (v1 đang list + allowance)
- Quản lý ProductType
- Append-only PieceRate theo `effective_from`
- Quản lý phụ cấp theo nhân viên
- Tạo kỳ lương tháng → calculate → lock
- Xem chi tiết payroll (line + line items)

### Super Admin
- Tạo/suspend tenant
- Quản lý gói dịch vụ
- Xem audit log toàn hệ thống

## 5) Flow nghiệp vụ (core)
### 5.1 Check-in GPS
1. App lấy GPS + device metadata → gọi API check-in.
2. Backend lấy tọa độ chi nhánh + radius tenant config.
3. Backend tính khoảng cách (haversine) và quyết định:
   - OK → ghi AttendanceEvent (IN/OUT)
   - FAIL → trả lỗi “Ngoài bán kính” + distance
4. (Nâng cao) Anti-fake: signal device integrity + throttling.

### 5.2 Upload sản phẩm (Production log)
1. Employee chụp/tải ảnh → upload lên storage (S3 ở production).
2. Employee tạo/ghi đè bản ghi (unique theo ngày + loại sản phẩm).
3. Employee submit để chuyển sang SUBMITTED.
4. Manager duyệt:
   - Approve → vào Payroll
   - Reject → yêu cầu sửa, kèm lý do

### 5.3 Tính lương theo tháng (Payroll)
1. Admin tạo PayrollRun (year/month).
2. Calculate:
   - Lấy tất cả ProductionEntry **APPROVED** trong kỳ
   - Resolve đơn giá theo `effective_from <= work_date` gần nhất
   - Cộng theo nhân viên + theo product type → PayrollLineItem
   - Cộng phụ cấp active “giao với kỳ”
   - Snapshot kết quả vào PayrollLine + PayrollLineItem
3. Lock:
   - Chặn sửa/duyệt lại production trong kỳ
   - Chặn thêm rate có `effective_from <= period_end` (prototype guard)

## 6) Non-functional requirements (Enterprise-ish)
- Multi-tenant isolation: bắt buộc header `X-Tenant-Id` và filter theo `company_id` ở mọi query.
- Auditability: payroll snapshot + line items, audit log cho actions quan trọng.
- Correctness: idempotent calculate, locking guards, append-only rates.
- Security: refresh token rotation + revoke; password hash (bcrypt).
- Performance: index theo `company_id`, `work_date`, `employee_id`.

