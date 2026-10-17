---
title: LensAI Video
emoji: 🎬
colorFrom: indigo
colorTo: pink
sdk: docker
app_port: 7860
pinned: false
---

# LensAI — Giải thích Video TikTok, Facebook Reels & YouTube Shorts

Ứng dụng Web App (PWA) đa nền tảng và Backend API giúp AI **xem trực tiếp hình ảnh (frames + chữ trên màn hình)** kết hợp **nghe âm thanh/lời thoại** để giải thích mọi video ngắn trên TikTok, Facebook Reels, YouTube Shorts và Instagram Reels.

## Tính năng nổi bật
- **Xem trực tiếp Hình ảnh + Âm thanh (Native Multimodal):** Sử dụng Google Gemini Pro / Flash để đọc cả hành động trong video, chữ chạy trên màn hình (OCR) và lời thoại.
- **Thuật toán tìm Đoạn hướng dẫn trọng tâm (`[MM:SS - MM:SS]`):** Tự động xác định mốc thời gian giá trị nhất khớp với tiêu đề và cho phép bấm tua nhanh 1 chạm.
- **Tự động mở rộng kiến thức chuyên sâu (Deep-Dive Expansion):** Bổ sung nguyên lý, công cụ và các bước bị lược bỏ trong video ngắn.
- **Lưu video theo Tên + Mã phiên (`<Ten_Video>__<session_id>.mp4`):** Kèm file bài phân tích `.md` cùng tên trong thư mục `saved_videos/`.
- **Hỗ trợ PWA & Apple Shortcuts (iOS Share Sheet):** Có thể cài ra màn hình chính iPhone hoặc tích hợp thẳng vào nút **Chia sẻ (Share)** khi đang lướt TikTok/Reels.
