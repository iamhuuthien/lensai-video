# 🎬 LensAI — AI giải thích video TikTok, Facebook Reels & YouTube Shorts

[English](README.md) | **Tiếng Việt**

LensAI để AI **xem** video ngắn (hình ảnh, chữ trên màn hình) và **nghe** (lời thoại, nhạc), rồi giải thích, tìm đúng đoạn thực sự hướng dẫn đúng tiêu đề và mở rộng kiến thức về chủ đề đó. Đây là web app (PWA) ưu tiên di động, backend FastAPI, dùng được trên iPhone, Android và máy tính.

🌐 **Dùng thử:** https://lensai-video.onrender.com

## ✨ Tính năng

- **Phân tích đa phương thức gốc** – gửi cả video (hình + tiếng) cho Google Gemini; ưu tiên model Pro mạnh nhất mà key của bạn truy cập được, tự lùi về Flash nếu cần.
- **Tìm đoạn trọng tâm** – xác định khoảng `[MM:SS - MM:SS]` mà tác giả thực sự hướng dẫn (bỏ qua phần mở đầu), bấm 1 chạm để tua tới. Mọi mốc thời gian trong câu trả lời đều bấm được.
- **Mở rộng chuyên sâu** – bổ sung nguyên lý, các bước bị lược bỏ và công cụ thay thế mà video ngắn không nói tới.
- **4 chế độ** – giải thích toàn diện, lời thoại + chữ trên hình (OCR), giải thích meme/trend, kiểm chứng thông tin.
- **Chat hỏi tiếp** về chính video đó.
- **Lưu trữ gọn gàng** – video lưu dạng `<Ten_Video>__<session_id>.mp4` kèm file `.md` phân tích cùng tên, dễ tìm lại.
- **Thân thiện với iOS** – cài như app (PWA) hoặc gọi từ nút Chia sẻ bằng Phím tắt (`/api/shortcut`).
- **Tự mang API Key (BYOK)** – mỗi người tự nhập Gemini API Key trong app; key chỉ lưu trên trình duyệt của họ (`localStorage`).

## 🚀 Chạy nhanh

```bash
git clone https://github.com/iamhuuthien/lensai-video.git
cd lensai-video
pip install -r requirements.txt     # cần cài thêm ffmpeg trên máy
python app.py                       # http://localhost:8000
```

Mở app, bấm **⚙️ API Key** và dán key lấy từ [Google AI Studio](https://aistudio.google.com/apikey).

### Cấu hình

| Biến | Công dụng |
| :--- | :--- |
| `GEMINI_API_KEY` | *(tuỳ chọn)* Key mặc định phía server. Bỏ trống để bắt buộc người dùng tự nhập key. |
| `PORT` | Cổng HTTP (mặc định `8000`; Dockerfile dùng `7860`). |
| `LENSAI_PRO_MODULE` | *(tuỳ chọn)* Tên module mở rộng cần nạp (mặc định `lensai_pro`). |

### Docker / đám mây

Repo có sẵn `Dockerfile` (kèm `ffmpeg`) và `render.yaml`. Nền tảng nào chạy được Docker đều dùng được (Render, Koyeb, Railway, Fly.io…).

> Lưu ý: gói miễn phí thường có ổ đĩa tạm, nên video đã lưu sẽ mất khi deploy lại hoặc khi server ngủ.

## 🍎 Phím tắt iOS

Trong app, mở **📱 Phím tắt iOS** để xem hướng dẫn từng bước. Tóm tắt: `POST /api/shortcut` với `{"url": "<link chia sẻ>"}` (có thể thêm `"api_key"`) rồi hiển thị trường `plain_text`.

## 🧩 Kiến trúc & mở rộng

```
app.py                     FastAPI app + routes
backend/video_service.py   tải video bằng yt-dlp, đặt tên, metadata
backend/ai_service.py      gọi Gemini, chọn model, tách đoạn trọng tâm
backend/extensions.py      hook mở rộng tuỳ chọn (xem dưới)
static/                    giao diện PWA (HTML/CSS/JS)
```

Phần lõi cố ý không chứa logic thanh toán hay tài khoản. Nó chỉ cung cấp một API hook nhỏ (`backend/extensions.py`): một module Python tuỳ chọn có thể đăng ký hook `before`/`after` quanh `analyze` và `chat`, bật feature flag và thêm một script giao diện. Nếu không cài module đó, app chạy ở chế độ cộng đồng (BYOK). Nhờ vậy bản triển khai riêng có thể thêm kiểm soát truy cập mà không đụng tới mã nguồn mở.

## 🔒 Lưu ý bảo mật

- Không commit API key, file service-account hay `.env`; các file này đã được git bỏ qua.
- Key của người dùng chỉ được gửi tới server để gọi Gemini cho lần yêu cầu đó và không được lưu phía server.

## 🤝 Đóng góp

Hoan nghênh issue và pull request.
