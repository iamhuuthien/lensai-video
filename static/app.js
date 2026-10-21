const STORAGE_KEY_API = "lensai_gemini_api_key";
const STORAGE_KEY_HISTORY = "lensai_video_history";

// Extension surface: an optional add-on script (loaded from /api/features) can set
// window.LensAI.headers (e.g. an access pass) which are merged into every API call,
// and window.LensAI.onApiResponse(url, response) to react to responses (e.g. HTTP 402).
window.LensAI = window.LensAI || { headers: {} };

async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}), ...window.LensAI.headers };
  const res = await fetch(url, { ...options, headers });
  if (typeof window.LensAI.onApiResponse === "function") {
    try {
      window.LensAI.onApiResponse(url, res.clone());
    } catch (err) {
      console.warn("LensAI.onApiResponse failed:", err);
    }
  }
  return res;
}

async function loadExtensionScript() {
  try {
    const res = await fetch("/api/features");
    if (!res.ok) return;
    const data = await res.json();
    if (data.frontend_script) {
      await new Promise((resolve) => {
        const s = document.createElement("script");
        const sep = data.frontend_script.includes("?") ? "&" : "?";
        s.src = `${data.frontend_script}${sep}v=2.5`;
        s.onload = resolve;
        s.onerror = resolve; // never block the app if the add-on fails to load
        document.body.appendChild(s);
      });
    }
  } catch (err) {
    console.warn("Extension script not loaded:", err);
  }
}

let currentMode = "explain";
let currentSessionId = null;
let currentExplanationRaw = "";
let currentSavedFilename = "";
let currentKeySegmentSeconds = 0;
let serverHasApiKey = false;

// DOM Elements
const videoUrlInput = document.getElementById("videoUrlInput");
const clearInputBtn = document.getElementById("clearInputBtn");
const pasteBtn = document.getElementById("pasteBtn");
const platformBadge = document.getElementById("platformBadge");
const modeSelector = document.getElementById("modeSelector");
const customPromptInput = document.getElementById("customPromptInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const loadingBox = document.getElementById("loadingBox");
const loadingStepText = document.getElementById("loadingStepText");
const errorBanner = document.getElementById("errorBanner");

const resultLayout = document.getElementById("resultLayout");
const videoPlayer = document.getElementById("videoPlayer");
const videoTitle = document.getElementById("videoTitle");
const videoPlatformTag = document.getElementById("videoPlatformTag");
const videoUploaderTag = document.getElementById("videoUploaderTag");
const videoDurationTag = document.getElementById("videoDurationTag");
const originalVideoLink = document.getElementById("originalVideoLink");
const savedFileName = document.getElementById("savedFileName");
const copyFilenameBtn = document.getElementById("copyFilenameBtn");

const modelUsedBadge = document.getElementById("modelUsedBadge");
const keySegmentBanner = document.getElementById("keySegmentBanner");
const keySegmentTime = document.getElementById("keySegmentTime");
const keySegmentDesc = document.getElementById("keySegmentDesc");
const jumpSegmentBtn = document.getElementById("jumpSegmentBtn");

const explanationContent = document.getElementById("explanationContent");
const copyExplanationBtn = document.getElementById("copyExplanationBtn");

const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

const historyCard = document.getElementById("historyCard");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// Modals
const settingsModal = document.getElementById("settingsModal");
const openSettingsModalBtn = document.getElementById("openSettingsModalBtn");
const closeSettingsModalBtn = document.getElementById("closeSettingsModalBtn");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
const apiKeyStatusDot = document.getElementById("apiKeyStatusDot");

const shortcutModal = document.getElementById("shortcutModal");
const openShortcutModalBtn = document.getElementById("openShortcutModalBtn");
const closeShortcutModalBtn = document.getElementById("closeShortcutModalBtn");
const shortcutWebUrlExample = document.getElementById("shortcutWebUrlExample");
const shortcutApiUrlExample = document.getElementById("shortcutApiUrlExample");

function parseTimestampToSeconds(ts) {
  const parts = ts.split(":").map((n) => parseInt(n, 10));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function seekVideoTo(seconds) {
  if (!videoPlayer) return;
  videoPlayer.currentTime = seconds;
  videoPlayer.play().catch(() => {});
  videoPlayer.scrollIntoView({ behavior: "smooth", block: "center" });
}

window.seekVideoTo = seekVideoTo;

function renderMarkdownWithTimestamps(mdText) {
  let html = "";
  if (window.marked && typeof window.marked.parse === "function") {
    html = window.marked.parse(mdText);
  } else {
    html = mdText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");
  }

  // Biến các mốc thời gian dạng [00:15] hoặc 01:25 thành nút bấm tua video trực tiếp
  return html.replace(/\[?(\b\d{1,2}:\d{2}(?::\d{2})?\b)\]?/g, (match, ts) => {
    const secs = parseTimestampToSeconds(ts);
    return `<button type="button" class="timestamp-link" onclick="seekVideoTo(${secs})" title="Tua video tới ${ts}">⏱️ ${ts}</button>`;
  });
}

function detectPlatformLabel(text) {
  const lower = (text || "").toLowerCase();
  if (lower.includes("tiktok.com")) return "🎵 TikTok";
  if (lower.includes("facebook.com") || lower.includes("fb.watch") || lower.includes("fb.com")) return "📘 FB Reels";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "▶️ YouTube";
  if (lower.includes("instagram.com")) return "📸 IG Reels";
  return "🔗 Link";
}

function updateInputUI() {
  const val = videoUrlInput.value.trim();
  platformBadge.textContent = detectPlatformLabel(val);
  clearInputBtn.style.display = val ? "block" : "none";
}

function showError(msg) {
  if (!msg) {
    errorBanner.style.display = "none";
    errorBanner.textContent = "";
    return;
  }
  errorBanner.textContent = "⚠️ " + msg;
  errorBanner.style.display = "block";
}

function getStoredApiKey() {
  return (localStorage.getItem(STORAGE_KEY_API) || "").trim();
}

function updateApiKeyStatusUI() {
  const hasKey = serverHasApiKey || Boolean(getStoredApiKey());
  if (hasKey) {
    apiKeyStatusDot.classList.add("ready");
  } else {
    apiKeyStatusDot.classList.remove("ready");
  }
}

async function checkServerHealth() {
  try {
    const res = await fetch("/api/health");
    if (res.ok) {
      const data = await res.json();
      serverHasApiKey = Boolean(data.has_server_api_key);
      updateApiKeyStatusUI();
    }
  } catch (err) {
    console.warn("Không thể kiểm tra trạng thái server:", err);
  }
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || "[]");
  } catch {
    return [];
  }
}

function saveToHistory(entry) {
  const list = getHistory().filter((item) => item.video.url !== entry.video.url);
  list.unshift(entry);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list.slice(0, 15)));
  renderHistory();
}

function renderHistory() {
  const list = getHistory();
  if (!list.length) {
    historyCard.style.display = "none";
    return;
  }
  historyCard.style.display = "block";
  historyList.innerHTML = "";
  list.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    const fname = item.video.filename || `${item.session_id}.mp4`;
    div.innerHTML = `
      <div class="history-item-title">${item.video.title || "Video đã phân tích"}</div>
      <div class="history-item-sub">${item.video.platform} • 📁 <code>${fname}</code></div>
    `;
    div.addEventListener("click", () => {
      displayAnalysisResult(item, false);
      window.scrollTo({ top: resultLayout.offsetTop - 20, behavior: "smooth" });
    });
    historyList.appendChild(div);
  });
}

function displayAnalysisResult(data, saveRecord = true) {
  currentSessionId = data.session_id;
  currentExplanationRaw = data.explanation;
  currentSavedFilename = data.video.filename || `${data.session_id}.mp4`;

  videoTitle.textContent = data.video.title || "Video";
  videoPlatformTag.textContent = data.video.platform || "Video";
  videoUploaderTag.textContent = data.video.uploader || "Tác giả";
  videoDurationTag.textContent = data.video.duration ? `${Math.round(data.video.duration)}s` : "Ngắn";
  originalVideoLink.href = data.video.url || "#";
  savedFileName.textContent = currentSavedFilename;

  if (data.model_used) {
    modelUsedBadge.textContent = `🧠 ${data.model_used}`;
  }

  // Hiển thị hộp Đoạn hướng dẫn trọng tâm nếu có
  if (data.key_segment && data.key_segment.start_time) {
    keySegmentBanner.style.display = "flex";
    keySegmentTime.textContent = `${data.key_segment.start_time} - ${data.key_segment.end_time}`;
    keySegmentDesc.textContent = data.key_segment.summary || "";
    currentKeySegmentSeconds = data.key_segment.start_seconds || 0;
    jumpSegmentBtn.textContent = `▶️ Xem ngay (${data.key_segment.start_time})`;
  } else {
    keySegmentBanner.style.display = "none";
  }

  if (data.video.stream_url) {
    videoPlayer.src = data.video.stream_url;
    videoPlayer.poster = data.video.thumbnail || "";
  }

  explanationContent.innerHTML = renderMarkdownWithTimestamps(data.explanation);
  chatMessages.innerHTML = "";
  resultLayout.classList.add("active");

  if (saveRecord) {
    saveToHistory(data);
  }
}

async function handleAnalyzeVideo() {
  const rawUrl = videoUrlInput.value.trim();
  if (!rawUrl) {
    showError("Vui lòng dán đường link TikTok, Facebook Reels hoặc YouTube Shorts vào ô bên trên.");
    videoUrlInput.focus();
    return;
  }

  const apiKey = getStoredApiKey();
  if (!serverHasApiKey && !apiKey) {
    settingsModal.classList.add("open");
    showError("Bạn cần nhập Gemini API Key trong phần Cài đặt trước khi phân tích.");
    return;
  }

  showError("");
  analyzeBtn.disabled = true;
  loadingBox.style.display = "block";
  loadingStepText.textContent = "Đang tải & lưu video theo Tên + Mã phiên vào thư mục saved_videos/...";

  const stepTimer = setTimeout(() => {
    loadingStepText.textContent = "Model Gemini Pro đang tìm đoạn hướng dẫn trọng tâm & mở rộng kiến thức chuyên sâu...";
  }, 2600);

  try {
    const res = await apiFetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: rawUrl,
        mode: currentMode,
        prompt: customPromptInput.value.trim() || null,
        api_key: apiKey || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Không thể phân tích video này.");
    }

    displayAnalysisResult(data, true);
    window.scrollTo({ top: resultLayout.offsetTop - 16, behavior: "smooth" });
  } catch (err) {
    showError(err.message);
  } finally {
    clearTimeout(stepTimer);
    analyzeBtn.disabled = false;
    loadingBox.style.display = "none";
  }
}

async function handleSendChat(questionText) {
  const question = (questionText || chatInput.value || "").trim();
  if (!question) return;
  if (!currentSessionId) {
    showError("Hãy phân tích một video trước khi đặt câu hỏi.");
    return;
  }

  chatInput.value = "";
  const userBubble = document.createElement("div");
  userBubble.className = "chat-bubble user";
  userBubble.textContent = question;
  chatMessages.appendChild(userBubble);

  const botBubble = document.createElement("div");
  botBubble.className = "chat-bubble assistant markdown-body";
  botBubble.textContent = "🤖 Model Pro đang phân tích sâu để trả lời...";
  chatMessages.appendChild(botBubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await apiFetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: currentSessionId,
        question,
        api_key: getStoredApiKey() || null,
        context_fallback: {
          title: videoTitle ? videoTitle.textContent : "",
          platform: videoPlatformTag ? videoPlatformTag.textContent : "",
          uploader: videoUploaderTag ? videoUploaderTag.textContent : "",
          url: originalVideoLink ? originalVideoLink.href : "",
          explanation: currentExplanationRaw || "",
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Lỗi khi gửi câu hỏi.");
    }
    botBubble.innerHTML = renderMarkdownWithTimestamps(data.answer);
  } catch (err) {
    botBubble.textContent = "⚠️ " + err.message;
  } finally {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Event Listeners
videoUrlInput.addEventListener("input", updateInputUI);

clearInputBtn.addEventListener("click", () => {
  videoUrlInput.value = "";
  updateInputUI();
  videoUrlInput.focus();
});

pasteBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      videoUrlInput.value = text.trim();
      updateInputUI();
    }
  } catch {
    videoUrlInput.focus();
    showError("Trình duyệt yêu cầu bạn chạm giữ vào ô nhập và bấm 'Dán' (Paste).");
  }
});

modeSelector.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    modeSelector.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
  });
});

analyzeBtn.addEventListener("click", handleAnalyzeVideo);

videoUrlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleAnalyzeVideo();
});

customPromptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleAnalyzeVideo();
});

jumpSegmentBtn.addEventListener("click", () => {
  seekVideoTo(currentKeySegmentSeconds);
});

copyFilenameBtn.addEventListener("click", async () => {
  if (!currentSavedFilename) return;
  await navigator.clipboard.writeText(currentSavedFilename);
  const old = copyFilenameBtn.textContent;
  copyFilenameBtn.textContent = "✅ Đã chép tên file";
  setTimeout(() => {
    copyFilenameBtn.textContent = old;
  }, 1600);
});

copyExplanationBtn.addEventListener("click", async () => {
  if (!currentExplanationRaw) return;
  await navigator.clipboard.writeText(currentExplanationRaw);
  const oldText = copyExplanationBtn.textContent;
  copyExplanationBtn.textContent = "✅ Đã chép";
  setTimeout(() => {
    copyExplanationBtn.textContent = oldText;
  }, 1800);
});

chatSendBtn.addEventListener("click", () => handleSendChat());
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSendChat();
});

document.querySelectorAll(".chip-btn[data-question]").forEach((chip) => {
  chip.addEventListener("click", () => {
    handleSendChat(chip.dataset.question);
  });
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY_HISTORY);
  renderHistory();
});

// Settings & Shortcut Modals
openSettingsModalBtn.addEventListener("click", () => {
  apiKeyInput.value = getStoredApiKey();
  settingsModal.classList.add("open");
});

closeSettingsModalBtn.addEventListener("click", () => {
  settingsModal.classList.remove("open");
});

saveApiKeyBtn.addEventListener("click", () => {
  const val = apiKeyInput.value.trim();
  if (val) {
    localStorage.setItem(STORAGE_KEY_API, val);
  } else {
    localStorage.removeItem(STORAGE_KEY_API);
  }
  updateApiKeyStatusUI();
  settingsModal.classList.remove("open");
  showError("");
});

openShortcutModalBtn.addEventListener("click", () => {
  const origin = window.location.origin;
  shortcutWebUrlExample.textContent = `${origin}/?url=[Đầu vào Phím tắt]`;
  shortcutApiUrlExample.textContent = `${origin}/api/shortcut`;
  shortcutModal.classList.add("open");
});

closeShortcutModalBtn.addEventListener("click", () => {
  shortcutModal.classList.remove("open");
});

window.addEventListener("DOMContentLoaded", async () => {
  await checkServerHealth();
  await loadExtensionScript();
  renderHistory();

  const params = new URLSearchParams(window.location.search);
  const sharedUrl = params.get("url") || params.get("text");
  const sharedMode = params.get("mode");

  if (sharedMode) {
    const targetBtn = modeSelector.querySelector(`[data-mode="${sharedMode}"]`);
    if (targetBtn) targetBtn.click();
  }

  if (sharedUrl) {
    videoUrlInput.value = sharedUrl;
    updateInputUI();
    handleAnalyzeVideo();
  }
});
