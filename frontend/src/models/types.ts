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

export interface ChannelPostItem {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  upload_date: string;
  hashtags: string[];
  pillar: string;
  pillar_label: string;
  duration_tier: string;
  engagement_rate: number;
  weighted_engagement_rate: number;
  outlier_ratio: number;
  share_to_like_pct: number;
  comment_to_like_pct: number;
}

export interface ChannelPillarItem {
  pillar: string;
  label: string;
  count: number;
  percentage: number;
  avg_views: number;
  avg_engagement_rate: number;
  lift_vs_median: number;
}

export interface ChannelScorecardItem {
  key: string;
  score: number;
  benchmark: string;
  current: string;
  insight: string;
}

export interface ChannelQuantMetrics {
  platform: "tiktok" | "facebook" | "youtube";
  handle: string;
  channel_title: string;
  subscribers: number;
  bio: string;
  data_source: string;
  sample_size: number;
  total_views: number;
  mean_views: number;
  median_views: number;
  max_views: number;
  min_views: number;
  avg_engagement_rate: number;
  avg_weighted_engagement_rate: number;
  avg_share_to_like_pct: number;
  avg_comment_to_like_pct: number;
  posting_cadence_per_week: number;
  momentum_pct: number;
  momentum_status: "rising" | "stable" | "declining";
  momentum_label: string;
  channel_health_score: number;
  optimal_duration_tier: string;
  best_pillar: ChannelPillarItem | null;
  short_form_ratio_pct: number;
  external_link_violations: number;
  pillar_distribution: ChannelPillarItem[];
  duration_breakdown: Array<{
    tier: string;
    count: number;
    percentage: number;
    avg_views: number;
    avg_engagement_rate: number;
  }>;
  viral_outliers: ChannelPostItem[];
  hidden_gems: ChannelPostItem[];
  underperforming_flops: ChannelPostItem[];
  top_hashtags: Array<{
    tag: string;
    count: number;
    avg_views: number;
    lift_ratio: number;
  }>;
  platform_scorecards: {
    tiktok: ChannelScorecardItem[];
    facebook: ChannelScorecardItem[];
    youtube: ChannelScorecardItem[];
  };
  posts: ChannelPostItem[];
}

export interface HeadToHeadComparison {
  page_a_name: string;
  page_b_name: string;
  page_a_handle: string;
  page_b_handle: string;
  wins_a: number;
  wins_b: number;
  overall_winner: string;
  verdict: string;
  metrics_table: Array<{
    metric: string;
    page_a_value: string;
    page_b_value: string;
    winner: "A" | "B" | "tie";
    winner_name: string;
    gap_pct: number;
  }>;
  content_gaps: Array<{
    pillar: string;
    label: string;
    page_a_share_pct: number;
    page_b_share_pct: number;
    page_a_avg_views: number;
    page_b_avg_views: number;
    advantage: string;
  }>;
}

export interface NextVideoScriptItem {
  episode: number;
  title: string;
  pillar: string;
  platform_fit: string;
  hook_3s: string;
  body_outline: string;
  cta: string;
  capcut_script: string;
}

export interface ChannelAuditResult {
  audit_id: string;
  created_at: string;
  platform: "tiktok" | "facebook" | "youtube";
  mode: "single_channel" | "head_to_head";
  cached?: boolean;
  resource_status: {
    youtube_api_configured: boolean;
    apify_token_configured: boolean;
    ytdlp_enabled: boolean;
    data_source_used: string;
  };
  primary_channel: ChannelQuantMetrics;
  secondary_channel?: ChannelQuantMetrics | null;
  head_to_head?: HeadToHeadComparison | null;
  strategy: {
    positioning: {
      core_niche: string;
      audience_persona: string;
      brand_voice: string;
      pillar_assessment: string;
    };
    content_trends: {
      momentum_diagnosis: string;
      winning_topics: string;
      fatigue_warning: string;
    };
    platform_keys_analysis: {
      tiktok_key: string;
      facebook_key: string;
      youtube_key: string;
    };
    strengths: string[];
    weaknesses: string[];
    action_plan_30d: string[];
    competitor_strategy?: {
      headline: string;
      why_winner_leads: string;
      page_a_counter_attack: string[];
    } | null;
    next_5_video_scripts: NextVideoScriptItem[];
    model_used: string;
    raw_markdown: string;
  };
}


