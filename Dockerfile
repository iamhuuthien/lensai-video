FROM python:3.12-slim

# Cài đặt ffmpeg để yt-dlp xử lý video và âm thanh mượt mà
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Tạo thư mục lưu trữ video và phân quyền cho cả môi trường Hugging Face Spaces (user 1000)
RUN mkdir -p /app/saved_videos && chmod -R 777 /app/saved_videos

ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-7860}"]
