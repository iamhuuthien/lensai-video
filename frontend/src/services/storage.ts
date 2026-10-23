const STORAGE_KEY_API = "lensai_gemini_api_key";
const STORAGE_KEY_VIP = "lensai_vip_code";
const STORAGE_KEY_DEVICE = "lensai_device_id";
const STORAGE_KEY_HISTORY = "lensai_video_history";

export const StorageService = {
  getDeviceId(): string {
    let id = localStorage.getItem(STORAGE_KEY_DEVICE);
    if (!id || id.length < 8) {
      const rand = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      id = "DEV-" + rand.toUpperCase();
      localStorage.setItem(STORAGE_KEY_DEVICE, id);
    }
    return id;
  },

  getApiKey(): string {
    return localStorage.getItem(STORAGE_KEY_API) || "";
  },

  setApiKey(key: string): void {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY_API, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_API);
    }
  },

  getVipCode(): string {
    return localStorage.getItem(STORAGE_KEY_VIP) || "";
  },

  setVipCode(code: string): void {
    if (code.trim()) {
      localStorage.setItem(STORAGE_KEY_VIP, code.trim().toUpperCase());
    } else {
      localStorage.removeItem(STORAGE_KEY_VIP);
    }
  },

  getHistory(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const cleanList: string[] = [];
      for (const item of parsed) {
        if (typeof item === "string" && item.trim()) {
          cleanList.push(item.trim());
        } else if (item && typeof item === "object") {
          // Backward compatibility with legacy { video: { url: ... }, session_id: ... }
          const urlCandidate = (item as { video?: { url?: string }; url?: string }).video?.url || (item as { url?: string }).url;
          if (typeof urlCandidate === "string" && urlCandidate.trim()) {
            cleanList.push(urlCandidate.trim());
          }
        }
      }

      // Auto-migrate legacy format in storage
      if (cleanList.length !== parsed.length || (parsed.length > 0 && typeof parsed[0] !== "string")) {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(cleanList.slice(0, 10)));
      }

      return cleanList.slice(0, 10);
    } catch {
      return [];
    }
  },

  saveHistory(url: string): void {
    try {
      const cleanUrl = String(url || "").trim();
      if (!cleanUrl) return;
      const list = this.getHistory().filter((item) => item !== cleanUrl);
      list.unshift(cleanUrl);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list.slice(0, 10)));
    } catch {
      // ignore storage errors
    }
  },

  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
      localStorage.removeItem(STORAGE_KEY_API);
    } catch {
      // ignore
    }
  },
};
