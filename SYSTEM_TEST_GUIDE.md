# Hướng Dẫn Kiểm Thử Toàn Hệ Thống & Quản Trị (System & QA Testing Guide)

Tài liệu này mô tả **cấu hình biến môi trường bảo mật**, **hướng dẫn kiểm thử từng kịch bản nghiệp vụ (Manual QA)** trên giao diện web và **cách chạy bộ Automation Test (`143 tests`)** cho toàn bộ hệ thống **LensAI Video Pro**.

> [!IMPORTANT]
> **Nguyên tắc Bảo mật (Zero Hardcoded Secrets)**:
> Không bao giờ lưu mật khẩu Admin, khóa SePay, thông tin tài khoản ngân hàng hoặc mã VIP thực tế vào mã nguồn (Frontend/Backend) hay tài liệu Git. Mọi khóa bảo mật đều được đọc từ biến môi trường (`.env` / Render Environment Variables) hoặc xác thực qua băm mật mã `PBKDF2-HMAC-SHA256` trong collection nội bộ của Firebase Cloud Firestore (đã khóa hoàn toàn quyền truy cập client qua `firestore.rules`).

---

## 1. Các Biến Môi Trường Bảo Mật Cần Cấu Hình (`.env` / Render)

| Biến môi trường | Giá trị mẫu (Placeholder) | Mục đích sử dụng |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `<YOUR_GEMINI_API_KEY>` | Khóa Gemini API chính trên máy chủ |
| `FIREBASE_CREDENTIALS_JSON` | `{"type":"service_account",...}` | Service Account JSON của Firebase Admin SDK (dạng 1 dòng) |
| `LENSAI_ADMIN_SECRET` | `<YOUR_STRONG_ADMIN_SECRET>` | Mật khẩu mở **Admin & QA Test Center** (truyền qua header `X-Admin-Secret`) |
| `SEPAY_WEBHOOK_API_KEY` | `<YOUR_SEPAY_WEBHOOK_SECRET>` | Khóa xác thực SePay Webhook (`Authorization: Apikey <secret>`) |
| `VIETQR_BANK_ID` | `<BANK_CODE>` | Mã ngân hàng nhận thanh toán VietQR |
| `VIETQR_ACCOUNT_NO` | `<ACCOUNT_NUMBER>` | Số tài khoản nhận thanh toán VietQR |
| `VIETQR_ACCOUNT_NAME` | `<ACCOUNT_HOLDER_NAME>` | Tên chủ tài khoản ngân hàng |

---

## 2. Cách Mở Trang Quản Trị Riêng Biệt (Dedicated Admin Page — `/admin`)

Từ phiên bản 6.0, bảng điều khiển Admin đã được nâng cấp thành **Trang Quản Trị Độc Lập Toàn Màn Hình (`AdminPage`)** thay vì hộp thoại popup cũ. Quản trị viên có thể mở trang Admin theo một trong 4 cách sau:

1. **Truy cập trực tiếp đường dẫn**: `https://your-domain.com/admin` (hoặc `https://your-domain.com/?admin=1`).
2. **Phím tắt bàn phím**: Nhấn tổ hợp phím **`Ctrl + Shift + A`** (hoặc **`Cmd + Shift + A`** trên macOS) để chuyển đổi nhanh giữa ứng dụng chính và trang `/admin`.
3. **Từ Tài Khoản Người Dùng**: Nhấn nút **Đăng nhập** trên thanh Navbar -> chọn **Mở Trang Admin (`/admin`)**.
4. **Tự động hiển thị**: Khi đăng nhập bằng tài khoản có vai trò `ADMIN`, biểu tượng khiên vàng trên Navbar sẽ dẫn thẳng tới `/admin`.

### Hai Phương Thức Đăng Nhập Trang Admin:
- **Phương thức 1 — Mã Bảo Mật Khẩn Cấp (`X-Admin-Secret`)**: Nhập mã bảo mật Admin (lưu trong biến môi trường `LENSAI_ADMIN_SECRET` hoặc băm `PBKDF2-HMAC-SHA256` trong Firestore `_system_config/admin_auth`). Hệ thống tự động `.trim()` khoảng trắng thừa khi sao chép/dán.
- **Phương thức 2 — Tài Khoản Admin (`Email & Mật khẩu`)**: Đăng nhập bằng tài khoản người dùng đã được nâng quyền `ADMIN` trong tab **Quản Lý Người Dùng** hoặc nằm trong danh sách `LENSAI_ADMIN_EMAILS`.

### 4 Phân Khu Quản Trị Trên Trang `/admin`:
- **Tab 1 — Tổng Quan & Biểu Đồ KPI**: 4 thẻ KPI (Tổng User, VIP Pass, Đơn VietQR, Lợi nhuận ròng sau thuế), biểu đồ đăng ký 30 ngày, doanh thu 6 tháng và khu vực **QA Test Center** (1-click Reset hạn mức thiết bị & tạo mã VIP test).
- **Tab 2 — Quản Lý Người Dùng (`lensai_users`)**: Tìm kiếm theo email, nâng/hạ quyền `ADMIN`, khóa/mở khóa tài khoản, thu hồi phiên đăng nhập và cấp trực tiếp mã VIP Pass vào tài khoản người dùng.
- **Tab 3 — VIP Pass, Đơn Hàng VietQR & Báo Cáo Thuế**: Tạo mã VIP tùy chỉnh, duyệt đơn VietQR 1-click, khóa/mở khóa mã VIP và xem báo cáo thuế HKD VN (GTGT 5% + TNCN 2%).
- **Tab 4 — Nhật Ký Bảo Mật ISO/IEC 27001 (`lensai_audit_logs`)**: Theo dõi thời gian thực mọi hành động nhạy cảm (`auth.signup`, `admin.login`, `pass.create`, `pass.grant`, `user.suspend`, `user.role_change`, `account.export`, `account.delete`).

---

## 3. Kịch Bản Kiểm Thử Chi Tiết Từng Case Nghiệp Vụ (Test Scenarios)

### Case 1: Người Dùng Mới (Free Trial) — Tặng 3 Lượt Dán Link + 1 Lượt Xuất SRT CapCut
1. Mở **Admin Center (`Ctrl + Shift + A`)** -> Nhấn **Reset 3 Link + 1 SRT Dùng Thử (Về Chế Độ Free)**.
2. Tại màn hình chính, nhấn vào 1 trong 3 gợi ý mẫu dưới thanh tìm kiếm hoặc dán link video bất kỳ -> Nhấn **Giải thích ngay**.
3. Quan sát kết quả trả về dạng **Bento Grid 6 ô** (Video Player, Tóm tắt cốt lõi, Điểm chính, Hành động gợi ý, Phân đoạn vàng, Sơ đồ tư duy Mindmap & Bản dịch theo mốc thời gian).
4. Kiểm tra badge lượt dùng miễn phí giảm từ `3` xuống `2`.
5. Nhấn nút **Xuất file .SRT (CapCut)** -> Tải về file `.srt` chuẩn timecode CapCut. Lượt xuất SRT miễn phí giảm từ `1` xuống `0`.
6. Nhấn **Xuất file .SRT** lần thứ 2 -> Hệ thống thông báo hết lượt SRT miễn phí và mở bảng nâng cấp **Pro Pass**.

### Case 2: Tự Động Hoàn Lượt / Hoàn Credit Khi AI Hoặc Video Lỗi (Refund on Failure)
1. Ghi nhớ số lượt Free còn lại (hoặc số Credit trong mã VIP).
2. Dán URL kiểm thử lỗi hệ thống vào ô phân tích:
   ```text
   https://demo.lensai.vn/error-refund
   ```
3. Nhấn **Giải thích ngay**.
4. Hệ thống trả về thông báo lỗi nhưng **số lượt Free Trial / số Credit VIP được hoàn trả nguyên vẹn 100%**.

### Case 3: Chống Lạm Dụng Free Trial (Device ID + IP Quota Bucket)
- Định danh thiết bị lưu tại collection `trials/dev_<hash>_<YYYY-MM>` (tối đa 3 link + 1 SRT/tháng).
- Địa chỉ IP mạng lưu tại `trials/ip_<hash>_<YYYY-MM>` (tối đa `4x` hạn mức thiết bị).

### Case 4: Tạo Đơn Hàng VietQR & Thanh Toán Tự Động Qua SePay Webhook
1. Nhấn **Nâng cấp** trên thanh Navbar -> Chọn gói cước -> Nhấn **Tạo mã QR thanh toán**.
2. Hệ thống sinh mã đơn hàng định dạng `LENSxxxxxx` kèm mã QR chuyển khoản.
3. Mở **Admin Center (`Ctrl + Shift + A`)** -> Tab **Đơn VietQR** -> Nhấn **Duyệt & Cấp VIP** tại đơn hàng `pending`.
4. Cửa sổ VietQR tự động nhận trạng thái `paid`, sinh mã `VIP-XXXX-XXXX` và kích hoạt ngay vào trình duyệt.

### Case 5: Sử Dụng Gói VIP Pro & Kiểm Tra Trừ Credit Nguyên Tử (Atomic Firestore Transaction)
1. Kích hoạt mã VIP `VIP-XXXX-XXXX`.
2. Phân tích 1 video bằng link hoặc tải file video MP4 lên ở khu vực **Studio CapCut** (`-1 Credit`).
3. Kiểm tra số dư Credit giảm đúng `1 CR`.
4. Trong **Admin Center** -> Tab **Mã VIP** -> Thử nhấn **Khóa** mã VIP: mọi thao tác dùng mã đó sẽ bị chặn (`402/403`) cho tới khi nhấn **Mở khóa**.

---

## 4. Hướng Dẫn Chạy Bộ Automation Test (`143 Tests`)

Chạy toàn bộ 143 bài kiểm thử tự động (Unit, Concurrency, Dual-Repo, E2E Fullstack, Frontend TypeScript & Vitest):

```bash
cd /home/iamhuuthien/project/lensai-video
./run_all_tests.sh
```

---

## 5. Tài Liệu Kiến Trúc & Sơ Đồ Hệ Thống

- [README.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/README.md) — Tổng quan kiến trúc hệ thống
- [ARCHITECTURE.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/ARCHITECTURE.md) — Kiến trúc phân tầng MVC + Repository + Service
- [DATABASE.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/DATABASE.md) — Thiết kế Firestore Schema, Indexes & Security Rules (`firestore.rules`)
- [BUSINESS_RULES.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/BUSINESS_RULES.md) — Quy tắc tính phí, AI Model Tiering, chống lạm dụng & hoàn tiền tự động
- [API.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/API.md) — Đặc tả chi tiết toàn bộ RESTful API
- [DEPLOYMENT.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/DEPLOYMENT.md) — Hướng dẫn cấu hình biến môi trường trên Render & Firebase
- [TESTING.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/TESTING.md) — Tài liệu chiến lược kiểm thử
