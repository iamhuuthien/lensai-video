import type {
  AnalysisMode,
  AnalysisResult,
  Order,
  Plan,
  SystemFeatures,
  TrialStatus,
} from "../models/types";
import { StorageService } from "./storage";

type TrialExhaustedListener = (message: string) => void;
const trialListeners = new Set<TrialExhaustedListener>();

export function onTrialExhausted(listener: TrialExhaustedListener): () => void {
  trialListeners.add(listener);
  return () => trialListeners.delete(listener);
}

function notifyTrialExhausted(message: string): void {
  trialListeners.forEach((l) => l(message));
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const deviceId = StorageService.getDeviceId();
  const vipCode = StorageService.getVipCode();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Device-Id", deviceId);
  if (vipCode) {
    headers.set("X-VIP-Code", vipCode);
  }

  // Sync with global window.LensAI
  if (typeof window !== "undefined") {
    const win = window as unknown as { LensAI?: { headers?: Record<string, string>; proEnabled?: boolean } };
    win.LensAI = win.LensAI || { headers: {} };
    win.LensAI.headers = win.LensAI.headers || {};
    win.LensAI.headers["X-Device-Id"] = deviceId;
    if (vipCode) win.LensAI.headers["X-VIP-Code"] = vipCode;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 402) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData.detail ||
      "Bạn đã dùng hết lượt dùng thử miễn phí trong tháng này. Vui lòng kích hoạt gói VIP để tiếp tục.";
    notifyTrialExhausted(message);
    throw new Error(message);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Yêu cầu thất bại (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export const ApiService = {
  async getFeatures(): Promise<SystemFeatures> {
    return request<SystemFeatures>("/api/features");
  },

  async checkHealth(): Promise<{ status: string; version: string; has_server_api_key: boolean }> {
    return request<{ status: string; version: string; has_server_api_key: boolean }>("/api/health");
  },

  async getModels(): Promise<{ status: string; models: Record<string, any>; default_free: string; default_vip: string }> {
    return request<{ status: string; models: Record<string, any>; default_free: string; default_vip: string }>("/api/models");
  },

  async analyzeVideo(url: string, mode: AnalysisMode): Promise<AnalysisResult> {
    const apiKey = StorageService.getApiKey();
    const model = StorageService.getSelectedModel();
    return request<AnalysisResult>("/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        url,
        mode,
        api_key: apiKey || undefined,
        model: model || undefined,
      }),
    });
  },

  async chatVideo(sessionId: string, question: string): Promise<{ answer: string }> {
    const apiKey = StorageService.getApiKey();
    const model = StorageService.getSelectedModel();
    return request<{ answer: string }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        question,
        api_key: apiKey || undefined,
        model: model || undefined,
      }),
    });
  },

  async getPlans(): Promise<Plan[]> {
    interface BackendPlansResponse {
      plans?: Array<{
        id: string;
        name: string;
        price_vnd: number;
        duration_days: number;
        badge?: string;
        popular?: boolean;
        features?: string[];
        model_tier?: string;
      }>;
    }
    const data = await request<BackendPlansResponse>("/api/pro/plans");
    if (!data.plans || !Array.isArray(data.plans)) return [];

    return data.plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price_vnd,
      duration_days: p.duration_days,
      description: p.features && p.features[0] ? p.features[0] : "",
      badge: p.badge,
      popular: p.popular,
      features: p.features || [],
      model_tier: p.model_tier,
    }));
  },

  async getTrialStatus(): Promise<TrialStatus> {
    interface BackendTrialResponse {
      is_vip?: boolean;
      trial_status?: {
        month: string;
        link_limit: number;
        link_used: number;
        link_remaining: number;
        srt_limit: number;
        srt_used: number;
        srt_remaining: number;
      };
    }
    const data = await request<BackendTrialResponse>("/api/pro/trial-status");
    const ts = data.trial_status || {
      month: new Date().toISOString().slice(0, 7),
      link_limit: 3,
      link_used: 0,
      link_remaining: 3,
      srt_limit: 1,
      srt_used: 0,
      srt_remaining: 1,
    };
    const isVip = Boolean(data.is_vip);

    return {
      month: ts.month,
      link_limit: ts.link_limit,
      link_used: ts.link_used,
      link_remaining: ts.link_remaining,
      srt_limit: ts.srt_limit,
      srt_used: ts.srt_used,
      srt_remaining: ts.srt_remaining,
      is_vip: isVip,
      can_analyze: isVip || ts.link_remaining > 0,
      can_export_srt: isVip || ts.srt_remaining > 0,
    };
  },

  async verifyVipPass(code: string): Promise<{ valid: boolean; plan?: string; expires_at?: string; message?: string }> {
    return request<{ valid: boolean; plan?: string; expires_at?: string; message?: string }>(
      `/api/pro/pass/${encodeURIComponent(code)}`
    );
  },

  async createOrder(planId: string): Promise<Order> {
    interface BackendOrderResponse {
      order: {
        order_code: string;
        plan_id: string;
        amount_vnd: number;
        status: "pending" | "paid" | "expired";
        bank_info: {
          bank_id: string;
          account_no: string;
          account_name: string;
          transfer_content: string;
          qr_url: string;
        };
      };
    }
    const data = await request<BackendOrderResponse>("/api/pro/order", {
      method: "POST",
      body: JSON.stringify({ plan_id: planId }),
    });
    const o = data.order;
    return {
      order_code: o.order_code,
      plan_id: o.plan_id,
      amount: o.amount_vnd,
      qr_url: o.bank_info.qr_url,
      bank_id: o.bank_info.bank_id,
      account_no: o.bank_info.account_no,
      account_name: o.bank_info.account_name,
      memo: o.bank_info.transfer_content,
      status: o.status,
    };
  },

  async checkOrder(orderCode: string): Promise<Order> {
    interface BackendOrderResponse {
      order: {
        order_code: string;
        plan_id: string;
        amount_vnd: number;
        status: "pending" | "paid" | "expired";
        bank_info: {
          bank_id: string;
          account_no: string;
          account_name: string;
          transfer_content: string;
          qr_url: string;
        };
      };
    }
    const data = await request<BackendOrderResponse>(`/api/pro/order/${encodeURIComponent(orderCode)}`);
    const o = data.order;
    return {
      order_code: o.order_code,
      plan_id: o.plan_id,
      amount: o.amount_vnd,
      qr_url: o.bank_info.qr_url,
      bank_id: o.bank_info.bank_id,
      account_no: o.bank_info.account_no,
      account_name: o.bank_info.account_name,
      memo: o.bank_info.transfer_content,
      status: o.status,
    };
  },

  async exportCapcutSrt(title: string, rawSummary: string): Promise<{ filename: string; content: string }> {
    return request<{ filename: string; content: string }>("/api/pro/capcut-srt", {
      method: "POST",
      body: JSON.stringify({ title, raw_summary: rawSummary }),
    });
  },

  async uploadStudioVideo(
    file: File,
    lang: string = "vi",
    tone: string = "viral",
    note: string = ""
  ): Promise<{
    status: string;
    session_id: string;
    stream_url: string;
    video_filename: string;
    title: string;
    model_used: string;
    editing_advice: string;
    srt_filename: string;
    srt_content: string;
    pro_status?: any;
    trial_status?: any;
  }> {
    const deviceId = StorageService.getDeviceId();
    const vipCode = StorageService.getVipCode();
    const headers: Record<string, string> = {
      "X-Device-Id": deviceId,
      "X-Filename": encodeURIComponent(file.name),
      "X-Target-Lang": lang,
      "X-Voice-Tone": tone,
      "X-Custom-Note": encodeURIComponent(note),
    };
    if (vipCode) headers["X-VIP-Code"] = vipCode;

    const res = await fetch("/api/pro/upload-studio", {
      method: "POST",
      headers,
      body: file,
    });
    if (res.status === 402) {
      const err = await res.json().catch(() => ({}));
      const msg = err.detail || "Bạn đã hết lượt xuất file .SRT miễn phí trong tháng này.";
      notifyTrialExhausted(msg);
      throw new Error(msg);
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Tải video lên thất bại (${res.status})`);
    }
    return res.json();
  },

  async downloadCleanVideo(url: string): Promise<{
    status: string;
    session_id: string;
    title: string;
    filename: string;
    platform: string;
    duration: number;
    thumbnail: string;
    stream_url: string;
    download_url: string;
    message: string;
  }> {
    return request("/api/clean-download", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },

  async getCloudHistory(): Promise<Array<{
    session_id: string;
    url: string;
    title: string;
    thumbnail: string;
    platform: string;
    duration: number;
    days_remaining: number;
    is_expiring_soon: boolean;
    stream_url: string;
    download_url: string;
  }>> {
    const res = await request<{ status: string; items: any[] }>("/api/history");
    return res.items || [];
  },

  async saveCloudHistory(item: {
    session_id: string;
    url: string;
    title?: string;
    thumbnail?: string;
    platform?: string;
    duration?: number;
    has_srt?: boolean;
  }): Promise<void> {
    try {
      await request("/api/history", {
        method: "POST",
        body: JSON.stringify(item),
      });
    } catch {
      // ignore history background sync errors
    }
  },

  async deleteCloudHistory(sessionId: string): Promise<void> {
    try {
      await request(`/api/history/${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
      });
    } catch {
      // ignore
    }
  },
};
