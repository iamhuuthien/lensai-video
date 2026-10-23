# Stage 1: Build React + Material-UI Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend Runtime
FROM python:3.12-slim

# Cài đặt ffmpeg (cho yt-dlp) và git (hỗ trợ cài đặt plugin mở rộng nếu cấu hình)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Đảm bảo frontend/dist chứa bản build hoàn chỉnh
COPY --from=frontend-builder /build/dist /app/frontend/dist

# Tạo thư mục lưu trữ video
RUN mkdir -p /app/saved_videos && chmod -R 777 /app/saved_videos

ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "if [ -n \"$LENSAI_PRO_GIT_URL\" ]; then pip install --no-cache-dir \"$LENSAI_PRO_GIT_URL\"; fi && uvicorn app:app --host 0.0.0.0 --port ${PORT:-7860}"]
