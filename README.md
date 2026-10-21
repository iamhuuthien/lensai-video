# 🎬 LensAI — AI Video Explainer for TikTok, Facebook Reels & YouTube Shorts

**English** | [Tiếng Việt](README.vi.md)

LensAI lets an AI **watch** a short video (frames, on-screen text) and **listen** to it (speech, music), then explains it, finds the part that actually delivers on the title, and expands the topic. It is a mobile-first web app (PWA) with a FastAPI backend, so it works on iPhone, Android and desktop.

🌐 **Live demo:** https://lensai-video.onrender.com

## ✨ Features

- **Native multimodal analysis** – the whole video (visuals + audio) is sent to Google Gemini; it prefers the strongest Pro model your key can access and falls back to Flash.
- **Key-segment detection** – finds the `[MM:SS - MM:SS]` range where the creator really teaches the topic (skipping the intro) and lets you jump there in one tap. All timestamps in the answer are clickable.
- **Deep-dive expansion** – fills in principles, missing steps and alternative tools that a short video skips.
- **4 analysis modes** – full explanation, transcript + on-screen text (OCR), meme/trend explainer, fact-check.
- **Follow-up chat** about the same video.
- **Organized storage** – videos are saved as `<Clean_Title>__<session_id>.mp4` next to a same-named `.md` analysis, so they are easy to find.
- **iOS friendly** – install as a PWA, or trigger it from the Share Sheet with Apple Shortcuts (`/api/shortcut`).
- **Bring your own key (BYOK)** – each user pastes their own Gemini API key in the app; it is stored only in their browser (`localStorage`).

## 🚀 Quick start

```bash
git clone https://github.com/iamhuuthien/lensai-video.git
cd lensai-video
pip install -r requirements.txt     # also install ffmpeg on your system
python app.py                       # http://localhost:8000
```

Open the app, click **⚙️ API Key**, and paste a key from [Google AI Studio](https://aistudio.google.com/apikey).

### Configuration

| Variable | Purpose |
| :--- | :--- |
| `GEMINI_API_KEY` | *(optional)* Server-side default key. Leave it unset to force BYOK. |
| `PORT` | HTTP port (default `8000`; the Dockerfile uses `7860`). |
| `LENSAI_PRO_MODULE` | *(optional)* Name of an extension module to load (default `lensai_pro`). |

### Docker / cloud

A `Dockerfile` (with `ffmpeg`) and a `render.yaml` blueprint are included. Any platform that runs Docker works (Render, Koyeb, Railway, Fly.io…).

> Note: free tiers usually have an ephemeral disk, so saved videos disappear on redeploy or sleep.

## 🍎 iOS Shortcut

In the app, open **📱 iOS Shortcut** for step-by-step instructions. In short, `POST /api/shortcut` with `{"url": "<shared link>"}` (and optionally `"api_key"`) and show the `plain_text` field.

## 🧩 Architecture & extensions

```
app.py                     FastAPI app + routes
backend/video_service.py   yt-dlp download, naming, metadata
backend/ai_service.py      Gemini calls, model selection, key-segment parsing
backend/extensions.py      optional plug-in hooks (see below)
static/                    PWA front end (HTML/CSS/JS)
```

The core is intentionally free of any billing or account logic. It exposes a tiny hook API (`backend/extensions.py`): an optional Python module can register `before`/`after` hooks around `analyze` and `chat`, set feature flags and ship an extra front-end script. If no such module is installed the app runs in community mode (BYOK). This lets hosted deployments add their own access control without changing the open-source code.

## 🔒 Security notes

- Never commit API keys, service-account files or `.env`; they are git-ignored.
- User keys are sent to your server only to call Gemini for that request and are not stored server-side.

## 🤝 Contributing

Issues and pull requests are welcome.
