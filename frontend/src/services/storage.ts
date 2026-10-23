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
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveHistory(url: string): void {
    try {
      const list = this.getHistory().filter((item) => item !== url);
      list.unshift(url);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list.slice(0, 10)));
    } catch {
      // ignore storage errors
    }
  },
};
