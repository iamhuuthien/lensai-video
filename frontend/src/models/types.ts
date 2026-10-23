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
