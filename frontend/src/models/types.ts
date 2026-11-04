export type AnalysisMode = "quick" | "deep" | "study" | "clip_ideas";

export interface KeySegment {
  start_seconds: number;
  end_seconds: number;
  start_time: string;
  end_time: string;
  title?: string;
  reason: string;
  hook_score?: number;
}

export interface Chapter {
  time: string;
  seconds: number;
  title: string;
  summary?: string;
}

export interface VideoInfo {
  title: string;
  duration: number;
  author?: string;
  thumbnail?: string;
  url: string;
  video_path?: string;
}

export interface AnalysisResult {
  session_id: string;
  video_info: VideoInfo;
  key_segment?: KeySegment;
  summary: string;
  chapters: Chapter[];
  takeaways: string[];
  action_items: string[];
  mindmap: string[];
  raw_markdown: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  description: string;
  badge?: string;
  popular?: boolean;
  features: string[];
  model_tier?: string;
}

export interface ModelInfo {
  name: string;
  tier: string;
  badge: string;
  description: string;
}

export interface TrialStatus {
  month: string;
  link_limit: number;
  link_used: number;
  link_remaining: number;
  srt_limit: number;
  srt_used: number;
  srt_remaining: number;
  is_vip: boolean;
  can_analyze: boolean;
  can_export_srt: boolean;
}

export interface Order {
  order_code: string;
  plan_id: string;
  amount: number;
  qr_url: string;
  bank_id: string;
  account_no: string;
  account_name: string;
  memo: string;
  status: "pending" | "paid" | "expired";
  /** VIP code issued for this order; only present once the order is paid. */
  pass_code?: string;
}

export interface SystemFeatures {
  pro: boolean;
  version: string;
  has_server_api_key: boolean;
  frontend_script?: string;
}

export interface ViralHookTemplate {
  category: string;
  hook: string;
  framework: string;
  example: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  email_verified: boolean;
  display_name: string;
  photo_url?: string;
  role: "user" | "admin";
  status: "active" | "suspended";
  locale?: string;
  providers?: string[];
  created_iso?: string;
  last_login_iso?: string;
  login_count?: number;
  is_admin?: boolean;
}

export interface AuthConfig {
  enabled: boolean;
  providers: string[];
  web: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
  } | null;
}

