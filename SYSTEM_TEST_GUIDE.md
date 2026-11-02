# Hướng Dẫn Kiểm Thử Toàn Hệ Thống & Tài Khoản Admin (System & QA Testing Guide)

Tài liệu này cung cấp **thông tin tài khoản Admin**, **mã VIP test**, **hướng dẫn kiểm thử từng kịch bản nghiệp vụ (Manual QA)** trên giao diện web cũng như **cách chạy bộ Automation Test (`143 tests`)** cho toàn bộ hệ thống **LensAI Video Pro**.

---

## 1. Thông Tin Đăng Nhập Admin & Mã VIP Kiểm Thử

Bạn có thể sử dụng trực tiếp các thông tin dưới đây trên giao diện Web (`http://localhost:8000`) hoặc qua API:

| Hạng mục | Giá trị (Key / Code) | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Web App URL** | `http://localhost:8000` | Giao diện chính của ứng dụng (Landing Page + Studio + Admin Center) |
| **Graphify Knowledge Graph** | `http://localhost:8088/graph.html` | Bản đồ kiến trúc tương tác của toàn bộ source code |
| **Admin Secret Key** | `LENSAI-ADMIN-2026` | Đăng nhập **Admin & QA Test Center** (biểu tượng Khiên trên thanh Navbar) |
| **SePay Webhook API Key** | `SEPAY-SECRET-2026` | Header `Authorization: Apikey SEPAY-SECRET-2026` để giả lập SePay Webhook |
| **Mã VIP Test 1 (Sẵn trên Firebase)** | `VIP-THIEN-2026` | Gói Pro 30 ngày (`50 credits`, Gemini 2.5 Pro, lưu lịch sử Cloud 30 ngày) |
| **Mã VIP Test 2 (Admin QA)** | `VIP-ADMIN-2026` | Gói Pro 30 ngày (`100 credits`, dùng để test trừ credit & khóa/mở khóa mã) |

---

## 2. Cách Mở Bảng Điều Khiển Admin (Admin & QA Test Center) Trên Web

1. Truy cập `http://localhost:8000`.
2. Trên thanh điều hướng trên cùng (**Navbar**), nhấn vào biểu tượng **Khiên Bảo Mật (Admin & QA Test Center)** nằm cạnh nút chuyển đổi ngôn ngữ/giao diện.
3. Nhập Admin Secret:
   ```text
   LENSAI-ADMIN-2026
   ```
4. Nhấn **Kết nối**. Hệ thống sẽ mở ra 4 khu vực quản trị & kiểm thử trực quan:
   - **4 Thẻ Chỉ Số Thời Gian Thực**: Backend Lưu Trữ (`FIRESTORE` / `LOCAL_FILE`), Tổng Mã VIP, Đơn Hàng VietQR, và Doanh Thu Thuế.
   - **Tab 1 — Quản lý Mã VIP (`Passes`)**: Xem danh sách toàn bộ mã VIP, số credit còn lại, ngày hết hạn; Tạo mã VIP mới; Click **1 nút để nạp ngay mã VIP vào phiên trình duyệt hiện tại để test**; hoặc **Khóa / Mở khóa** mã VIP.
   - **Tab 2 — Đơn hàng VietQR & Giả lập SePay (`Orders`)**: Xem các đơn hàng `pending`/`paid`, click **Duyệt & Cấp VIP** để giả lập SePay Webhook thanh toán thành công ngay lập tức mà không cần chuyển khoản thật.
   - **Tab 3 — Công cụ Test QA & Reset Quota (`QA Tools`)**:
     - Click 1 nút **Reset 3 Link + 1 SRT** cho thiết bị & IP hiện tại để test lại luồng người dùng mới (Free Trial) bao nhiêu lần tùy thích.
     - Danh sách **Link Test mẫu** có nút nạp nhanh vào ô phân tích (bao gồm cả link giả lập lỗi AI để kiểm tra hoàn tiền/hoàn lượt tự động).

---

## 3. Kịch Bản Kiểm Thử Chi Tiết Từng Case Nghiệp Vụ (Test Scenarios)

### Case 1: Người Dùng Mới (Free Trial) — Tặng 3 Lượt Dán Link + 1 Lượt Xuất SRT CapCut
- **Chuẩn bị**:
  - Mở **Admin Center** -> Tab **Công cụ Test QA** -> Nhấn **Reset 3 Link + 1 SRT (Thiết bị này)**.
  - Nếu đang kích hoạt mã VIP trên Navbar, nhấn vào chip VIP -> chọn xóa/đăng xuất mã VIP để về chế độ khách (Free).
- **Thực hiện**:
  1. Tại màn hình chính, nhấn vào 1 trong 3 gợi ý mẫu dưới thanh tìm kiếm (`TikTok Hook`, `YouTube AI`, hoặc `Shorts Growth`) hoặc dán link `https://demo.lensai.vn/tiktok-viral-hook`.
  2. Nhấn **Giải thích ngay**.
  3. Quan sát kết quả trả về dạng **Bento Grid 6 ô**:
     - **Video Player / Embed** kèm thông tin kênh, thời lượng.
     - **Tóm tắt cốt lõi (Executive Summary)**.
     - **Điểm chính (Key Takeaways)**.
     - **Hành động gợi ý (Action Items)**.
     - **Phân đoạn vàng (Golden Segment highlight)**.
     - **Sơ đồ tư duy (Mindmap Mermaid)** & **Bản dịch chi tiết theo mốc thời gian (Chapters)**.
  4. Kiểm tra badge lượt dùng miễn phí giảm từ `3` xuống `2`.
  5. Nhấn nút **Xuất file .SRT (CapCut)** -> Hệ thống tải về file `.srt` chuẩn timecode CapCut. Lượt xuất SRT miễn phí giảm từ `1` xuống `0`.
  6. Nhấn **Xuất file .SRT** lần thứ 2 -> Hệ thống hiển thị thông báo hết lượt SRT miễn phí và tự động mở bảng nâng cấp **Pro Pass**.

### Case 2: Cơ Chế Bảo Vệ Người Dùng — Tự Động Hoàn Lượt / Hoàn Credit Khi AI Hoặc Video Lỗi (Refund on Failure)
- **Mục tiêu**: Đảm bảo user **không bao giờ bị mất oan lượt Free hoặc Credit VIP** nếu link video hỏng hoặc AI xử lý thất bại.
- **Thực hiện**:
  1. Ghi nhớ số lượt Free còn lại (hoặc số Credit trong mã VIP).
  2. Dán URL đặc biệt dùng để giả lập lỗi hệ thống AI vào ô phân tích:
     ```text
     https://demo.lensai.vn/error-refund
     ```
  3. Nhấn **Giải thích ngay**.
  4. Hệ thống trả về thông báo lỗi (`HTTP 502 - Simulated downstream AI failure`) nhưng **số lượt Free Trial / số Credit VIP được hoàn trả nguyên vẹn 100%**.

### Case 3: Chống Lạm Dụng Free Trial (Device ID + IP Quota Bucket)
- **Mục tiêu**: Ngăn người dùng xóa `localStorage` hoặc mở tab ẩn danh để xài chùa vô hạn.
- **Logic kiểm chứng**:
  - Định danh thiết bị lưu tại collection `trials/dev_<hash>_<YYYY-MM>` (tối đa 3 link + 1 SRT/tháng).
  - Đồng thời địa chỉ IP mạng lưu tại `trials/ip_<hash>_<YYYY-MM>` (tối đa `4 x` hạn mức thiết bị cho mạng văn phòng/gia đình).
  - Sau khi dùng hết 3 lượt link, mở Modal nâng cấp VIP.

### Case 4: Tạo Đơn Hàng VietQR & Thanh Toán Tự Động Qua SePay Webhook (Hoặc Duyệt 1-Click Từ Admin)
- **Thực hiện**:
  1. Nhấn vào nút **Mở khóa Pro Pass (`29.000đ`)** trên thanh Navbar.
  2. Chuyển sang tab **Mua Gói Pro (VietQR 24/7)** -> Nhấn **Tạo mã QR thanh toán**.
  3. Hệ thống sinh mã đơn hàng định dạng `LENSxxxxxx` (ví dụ `LENS8A9B2C`) kèm mã QR chuyển khoản ngân hàng MB Bank.
  4. **Cách test không cần chuyển tiền thật**:
     - Mở **Admin Center** (biểu tượng Khiên trên Navbar).
     - Vào tab **Đơn hàng VietQR** -> Tìm đơn `LENSxxxxxx` đang ở trạng thái `pending`.
     - Nhấn nút **Duyệt & Cấp VIP**.
  5. Quay lại cửa sổ VietQR (hoặc chờ 2 giây): Hệ thống tự động phát hiện đơn hàng đã `paid`, **tự động sinh mã `VIP-xxxx-xxxx` và kích hoạt ngay vào trình duyệt** mà người dùng không cần copy/paste thủ công!

### Case 5: Sử Dụng Gói VIP Pro (`VIP-THIEN-2026`) & Kiểm Tra Trừ Credit Nguyên Tử (Atomic Firestore Transaction)
- **Thực hiện**:
  1. Nhấn vào nút **Pro Pass** trên Navbar -> Nhập mã `VIP-THIEN-2026` -> Nhấn **Kích hoạt**.
  2. Thanh Navbar hiển thị trạng thái **VIP PRO** kèm số dư Credit hiện tại (ví dụ: `50 CR`).
  3. Phân tích 1 video bằng link hoặc tải file video MP4 lên ở khu vực **Pro Studio** (`-1 Credit`).
  4. Kiểm tra số dư Credit trên Navbar giảm đi đúng `1 CR`, thông tin model trả về hiển thị `gemini-2.5-pro`.
  5. Mở **Admin Center** -> Tab **Quản lý Mã VIP** -> Thử nhấn **Khóa** mã `VIP-THIEN-2026`. Khi mã bị khóa, mọi thao tác dùng VIP sẽ bị từ chối (`403 Forbidden`) cho tới khi Admin nhấn **Mở khóa**.

### Case 6: Lưu Trữ Lịch Sử Đám Mây (Cloud History 15 Ngày / 30 Ngày) & Cảnh Báo Dọn Dẹp
- **Thực hiện**:
  1. Sau khi phân tích video (ở cả chế độ Khách hoặc chế độ VIP), mở phần **Lịch sử phân tích (Cloud History)** ở cuối trang hoặc thanh bên.
  2. Tải lại trang (`F5`) -> Lịch sử vẫn được giữ nguyên từ Firestore (`history` collection) theo `owner_key` (`pass:VIP-...` cho Pro lưu 30 ngày, `device:...` cho Free lưu 15 ngày).
  3. Nhấn vào 1 mục lịch sử cũ để xem lại toàn bộ Bento Grid, Mindmap và xuất SRT mà không tốn thêm Credit.

### Case 7: Tải Video Không Logo (No-Watermark Video Downloader)
- **Thực hiện**:
  1. Nhập link video TikTok / YouTube / mẫu thử và nhấn nút **Tải video không logo**.
  2. Hệ thống trích xuất luồng MP4 trực tiếp không dính watermark để người dùng tải về máy miễn phí (chiến lược thu hút người dùng phễu đầu vào).

### Case 8: Báo Cáo Thuế & Doanh Thu Hộ Kinh Doanh Cá Thể (Tax Report)
- **Thực hiện**:
  1. Mở **Admin Center** -> Xem ô **Doanh thu / Thuế** hoặc gọi API `GET /api/pro/admin/tax-report?year=2026` với header `X-Admin-Secret: LENSAI-ADMIN-2026`.
  2. Hệ thống tự động tổng hợp tổng doanh thu từ các đơn hàng `paid`, tính ngưỡng miễn thuế `500.000.000 VNĐ/năm` và ước tính thuế GTGT (5%) + TNCN (2%) theo quy định.

---

## 4. Hướng Dẫn Chạy Bộ Automation Test (`143 Tests`)

Toàn bộ hệ thống đã được trang bị bộ kiểm thử tự động bao phủ từ **Unit Test**, **Service/Repository Concurrency Test**, **API Controller Test**, **Frontend TypeScript/Vitest**, cho tới **End-to-End Fullstack Flow Test**.

### Chạy toàn bộ 143 bài test bằng 1 lệnh duy nhất:
```bash
cd /home/iamhuuthien/project/lensai-video
./run_all_tests.sh
```

### Cấu trúc các tầng kiểm thử tự động:
1. **Backend Core & Firestore Architecture (`lensai-video-pro/tests/` — 119 passed)**:
   - `test_passes.py`: Kiểm tra tạo mã VIP, kích hoạt ngày hết hạn 30 ngày, trừ credit nguyên tử (chống race condition khi gọi song song), hoàn credit (`refund_credit`), khóa mã.
   - `test_trials.py`: Kiểm tra hạn mức 3 link + 1 SRT theo tháng, chống lạm dụng qua IP (`4x` multiplier), hoàn lượt khi lỗi (`refund_trial_link`, `refund_trial_srt`).
   - `test_orders.py`: Kiểm tra tạo đơn VietQR, xác thực chữ ký SePay Webhook (`Apikey`), chống cộng trùng đơn (`idempotency`), tự động cấp mã VIP khi thanh toán.
   - `test_history.py`: Kiểm tra lưu/xóa lịch sử đám mây, phân tách `owner_key`, cảnh báo hết hạn 15/30 ngày.
   - `test_controllers.py` & `test_admin.py`: Kiểm tra toàn bộ HTTP status codes, bảo mật header `X-Admin-Secret`, và đầy đủ các API Admin.
2. **Main Web Server & E2E Fullstack (`video-explainer/tests/` — 18 passed)**:
   - `test_e2e_fullstack.py`: Giả lập luồng người dùng thực tế từ đầu đến cuối:
     - Luồng Free Trial (dùng 3 link + 1 SRT -> chạm trần 402 -> Admin reset -> dùng lại).
     - Luồng Auto-Refund khi AI lỗi (`https://demo.lensai.vn/error-refund` -> hoàn lại đúng số lượt).
     - Luồng Mua gói VietQR -> SePay Webhook -> Nhận mã VIP -> Phân tích bằng Gemini 2.5 Pro -> Trừ 1 credit.
     - Luồng Admin tạo mã VIP, khóa mã VIP (`403`), mở khóa mã VIP (`200`).
     - Luồng xuất phụ đề chuẩn `.SRT` CapCut.
3. **Frontend TypeScript & Component Tests (`video-explainer/frontend/` — TypeScript + 6 passed)**:
   - Kiểm tra chặt chẽ kiểu dữ liệu (`tsc --noEmit`) và render giao diện (`vitest`).

---

## 5. Tài Liệu Kiến Trúc & Sơ Đồ Hệ Thống Đầy Đủ

Toàn bộ tài liệu thiết kế kiến trúc Backend, Cơ sở dữ liệu Firestore, Quy tắc nghiệp vụ và Sơ đồ Mermaid nằm tại thư mục `lensai-video-pro/docs/`:

- [README.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/README.md) — Tổng quan kiến trúc hệ thống
- [ARCHITECTURE.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/ARCHITECTURE.md) — Kiến trúc phân tầng MVC + Repository + Service
- [DATABASE.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/DATABASE.md) — Thiết kế Firestore Schema, Indexes & Security Rules (`firestore.rules`)
- [BUSINESS_RULES.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/BUSINESS_RULES.md) — Quy tắc tính phí, AI Model Tiering, chống lạm dụng & hoàn tiền tự động
- [API.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/API.md) — Đặc tả chi tiết toàn bộ RESTful API
- [DEPLOYMENT.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/DEPLOYMENT.md) — Hướng dẫn cấu hình biến môi trường trên Render & Firebase
- [TESTING.md](file:///home/iamhuuthien/project/lensai-video/lensai-video-pro/docs/TESTING.md) — Tài liệu chiến lược kiểm thử
