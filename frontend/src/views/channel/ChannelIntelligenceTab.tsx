import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Collapse,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import BoltIcon from "@mui/icons-material/Bolt";
import KeyIcon from "@mui/icons-material/Key";
import MovieCreationIcon from "@mui/icons-material/MovieCreation";
import { SpotlightCard } from "../common/SpotlightCard";
import { APPLE_PALETTE } from "../../theme/theme";
import { ApiService } from "../../services/api";
import { ExportService } from "../../services/export";
import type { ChannelAuditResult, ChannelScorecardItem } from "../../models/types";

interface ChannelIntelligenceTabProps {
  onOpenPricing?: () => void;
  onSwitchToStudio?: () => void;
  onRefreshTrial?: () => void;
}

const PRESETS = [
  {
    id: "tiktok_ai_creator",
    badge: "🎵 1 Kênh TikTok",
    platform: "tiktok" as const,
    primary_url: "https://www.tiktok.com/@vtv24news_creator",
    secondary_url: "",
    desc: "Phân tích định hướng kênh, 5 trụ cột nội dung, Hook 3s đầu & TikTok SEO",
  },
  {
    id: "fb_head_to_head",
    badge: "📘 Đối Đầu 2 Trang Facebook",
    platform: "facebook" as const,
    primary_url: "https://www.facebook.com/TechStudioVN",
    secondary_url: "https://www.facebook.com/DigitalCreatorLabVN",
    desc: "So sánh trực diện 2 Fanpage theo khung REACH Framework & tìm khoảng trống chủ đề",
  },
  {
    id: "youtube_creator_academy",
    badge: "▶️ 1 Kênh YouTube",
    platform: "youtube" as const,
    primary_url: "https://www.youtube.com/@CreatorAcademyVN",
    secondary_url: "",
    desc: "Phân tích phễu Shorts -> Video dài, Title/Thumbnail CTR & Hidden Gems",
  },
];

export const ChannelIntelligenceTab: React.FC<ChannelIntelligenceTabProps> = ({
  onOpenPricing,
  onSwitchToStudio,
  onRefreshTrial,
}) => {
  const [platform, setPlatform] = useState<"tiktok" | "facebook" | "youtube">("tiktok");
  const [primaryUrl, setPrimaryUrl] = useState<string>("");
  const [secondaryUrl, setSecondaryUrl] = useState<string>("");
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [showBatchUrls, setShowBatchUrls] = useState<boolean>(false);
  const [batchUrlsPrimary, setBatchUrlsPrimary] = useState<string>("");
  const [batchUrlsSecondary, setBatchUrlsSecondary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audit, setAudit] = useState<ChannelAuditResult | null>(null);
  const [keyPlatformTab, setKeyPlatformTab] = useState<"tiktok" | "facebook" | "youtube">("tiktok");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSelectPlatform = (newPlat: "tiktok" | "facebook" | "youtube") => {
    setPlatform(newPlat);
    setKeyPlatformTab(newPlat);
    if (newPlat === "facebook") {
      // Allow easy toggle for 2-page comparison on Facebook
    } else {
      setCompareMode(false);
      setSecondaryUrl("");
    }
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[number]) => {
    setPlatform(preset.platform);
    setKeyPlatformTab(preset.platform);
    setPrimaryUrl(preset.primary_url);
    setSecondaryUrl(preset.secondary_url);
    setCompareMode(Boolean(preset.secondary_url));
    setError(null);
  };

  const handleRunAudit = async (overridePrimary?: string, overrideSecondary?: string, overridePlat?: "tiktok" | "facebook" | "youtube") => {
    const targetPrimary = (overridePrimary ?? primaryUrl).trim();
    const targetSecondary = (overrideSecondary ?? (compareMode ? secondaryUrl : "")).trim();
    const targetPlat = overridePlat ?? platform;

    if (!targetPrimary) {
      setError("Vui lòng nhập đường link kênh hoặc tên @handle cần phân tích.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sampleList1 = batchUrlsPrimary
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const sampleList2 = batchUrlsSecondary
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await ApiService.analyzeChannel({
        primary_url: targetPrimary,
        secondary_url: targetSecondary || undefined,
        platform: targetPlat,
        sample_urls: sampleList1.length >= 2 ? sampleList1 : undefined,
        secondary_sample_urls: sampleList2.length >= 2 ? sampleList2 : undefined,
        sample_limit: 20,
      });
      setAudit(res);
      setKeyPlatformTab(res.platform);
      if (onRefreshTrial) onRefreshTrial();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể phân tích kênh lúc này.";
      setError(msg);
      if (msg.includes("VIP") || msg.includes("dùng thử")) {
        onOpenPricing?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const handleDownloadReport = () => {
    if (!audit) return;
    const handleClean = (audit.primary_channel.handle || "Channel").replace(/[^A-Za-z0-9_-]/g, "_");
    ExportService.downloadFile(
      `LensAI_Channel_Strategy_${handleClean}.md`,
      audit.strategy.raw_markdown,
      "text/markdown;charset=utf-8"
    );
  };

  const activeScorecards: ChannelScorecardItem[] = audit
    ? audit.primary_channel.platform_scorecards[keyPlatformTab] || []
    : [];

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header Banner */}
      <Box sx={{ textAlign: "center", mb: 4, mt: 1 }}>
        <Chip
          icon={<InsightsIcon sx={{ fontSize: "16px !important", color: "#30d158 !important" }} />}
          label="TÌNH BÁO KÊNH & ĐỐI THỦ ĐA NỀN TẢNG 4.0"
          sx={{
             mb: 1.5,
            bgcolor: "rgba(48, 209, 88, 0.12)",
            color: "#30d158",
            border: "1px solid rgba(48, 209, 88, 0.3)",
            fontWeight: 700,
            fontSize: "0.75rem",
            letterSpacing: "0.04em",
          }}
        />
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.03em",
            fontSize: { xs: "1.75rem", sm: "2.4rem" },
            mb: 1,
            background: "linear-gradient(135deg, #ffffff 0%, #a1a1a6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Phân Tích Định Hướng Kênh & So Sánh Đối Thủ
        </Typography>
        <Typography variant="body1" sx={{ color: APPLE_PALETTE.inkMuted, maxWidth: 760, mx: "auto" }}>
          Bóc tách toàn diện <strong>1 kênh TikTok</strong>, <strong>1 hoặc 2 Fanpage Facebook đối đầu trực diện</strong>, hoặc{" "}
          <strong>1 kênh YouTube</strong>: Định vị trụ cột nội dung, xu hướng tăng trưởng, chấm điểm Key 3 nền tảng và xuất
          Playbook 5 kịch bản video tiếp theo.
        </Typography>
      </Box>

      {/* Input & Platform Control Card */}
      <SpotlightCard sx={{ p: { xs: 2.5, sm: 3.5 }, mb: 4 }}>
        {/* Platform Tabs */}
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 3 }}>
          <Tabs
            value={platform}
            onChange={(_, val) => handleSelectPlatform(val)}
            sx={{
              minHeight: 42,
              "& .MuiTab-root": {
                minHeight: 42,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
              },
            }}
          >
            <Tab value="tiktok" label="🎵 Kênh TikTok (1 Kênh)" />
            <Tab value="facebook" label="📘 Trang Facebook (1 hoặc 2 Trang)" />
            <Tab value="youtube" label="▶️ Kênh YouTube (Shorts + Dài)" />
          </Tabs>

          <Button
            size="small"
            variant={compareMode ? "contained" : "outlined"}
            startIcon={<CompareArrowsIcon />}
            onClick={() => setCompareMode((prev) => !prev)}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              fontWeight: 600,
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            {compareMode ? "Đang bật: Đối đầu 2 Trang (A vs B)" : "Bật chế độ So sánh 2 Trang / Kênh"}
          </Button>
        </Box>

        {/* Primary & Secondary Channel Inputs */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, md: compareMode ? 6 : 12 }}>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 600, mb: 0.75, display: "block" }}>
              {compareMode
                ? "TRANG / KÊNH A (Kênh của bạn hoặc Trang chính)"
                : platform === "tiktok"
                ? "ĐƯỜNG LINK KÊNH TIKTOK HOẶC @HANDLE"
                : platform === "facebook"
                ? "ĐƯỜNG LINK FANPAGE / PROFILE FACEBOOK"
                : "ĐƯỜNG LINK KÊNH YOUTUBE HOẶC @HANDLE"}
            </Typography>
            <TextField
              fullWidth
              placeholder={
                platform === "tiktok"
                  ? "Ví dụ: https://www.tiktok.com/@vtv24news_creator hoặc @handle"
                  : platform === "facebook"
                  ? "Ví dụ: https://www.facebook.com/TechStudioVN"
                  : "Ví dụ: https://www.youtube.com/@CreatorAcademyVN"
              }
              value={primaryUrl}
              onChange={(e) => setPrimaryUrl(e.target.value)}
              size="medium"
            />
          </Grid>

          {compareMode && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" sx={{ color: "#ff9f0a", fontWeight: 700, mb: 0.75, display: "block" }}>
                ⚔️ TRANG / KÊNH B (Đối thủ cạnh tranh trực tiếp cần so sánh)
              </Typography>
              <TextField
                fullWidth
                placeholder="Ví dụ: https://www.facebook.com/DigitalCreatorLabVN"
                value={secondaryUrl}
                onChange={(e) => setSecondaryUrl(e.target.value)}
                size="medium"
              />
            </Grid>
          )}
        </Grid>

        {/* Optional Smart Batch URLs (Anti-Login Wall Hybrid Mode) */}
        <Box sx={{ mb: 2.5 }}>
          <Button
            size="small"
            onClick={() => setShowBatchUrls((prev) => !prev)}
            endIcon={showBatchUrls ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ color: APPLE_PALETTE.skyLink, textTransform: "none", fontSize: "0.8125rem", px: 0 }}
          >
            Nâng cao: Dán danh sách 3–10 link bài đăng/Reels tiêu biểu (Vượt tường lửa đăng nhập Facebook)
          </Button>
          <Collapse in={showBatchUrls}>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, md: compareMode ? 6 : 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Mỗi dòng 1 link video/Reels của Trang A (Tùy chọn)..."
                  value={batchUrlsPrimary}
                  onChange={(e) => setBatchUrlsPrimary(e.target.value)}
                />
              </Grid>
              {compareMode && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Mỗi dòng 1 link video/Reels của Trang B (Tùy chọn)..."
                    value={batchUrlsSecondary}
                    onChange={(e) => setBatchUrlsSecondary(e.target.value)}
                  />
                </Grid>
              )}
            </Grid>
          </Collapse>
        </Box>

        {/* Quick 1-Click Benchmark Presets */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 1 }}>
            ⚡ Trải nghiệm nhanh với Kênh Mẫu Chuẩn (1-Click Demo):
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            {PRESETS.map((p) => (
              <Box
                key={p.id}
                onClick={() => {
                  handleApplyPreset(p);
                  handleRunAudit(p.primary_url, p.secondary_url, p.platform);
                }}
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: "12px",
                  border: `1px solid ${APPLE_PALETTE.hairline}`,
                  bgcolor: "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: APPLE_PALETTE.actionBlue,
                    bgcolor: "rgba(0, 113, 227, 0.08)",
                  },
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ffffff", mb: 0.25 }}>
                  {p.badge}
                </Typography>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
                  {p.desc}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={<AutoAwesomeIcon />}
          onClick={() => handleRunAudit()}
          sx={{
            py: 1.6,
            borderRadius: "999px",
            fontWeight: 700,
            fontSize: "1rem",
            background: `linear-gradient(135deg, ${APPLE_PALETTE.actionBlue}, #5856d6)`,
          }}
        >
          {loading
            ? "Đang quét dữ liệu kênh, tính toán Outlier & tổng hợp chiến lược AI..."
            : compareMode
            ? "⚔️ Phân Tích & So Sánh Đối Đầu 2 Trang Ngay"
            : "📊 Phân Tích Định Hướng Kênh & Giải Phẫu Key 3 Nền Tảng"}
        </Button>

        {loading && <LinearProgress sx={{ mt: 2, borderRadius: 2 }} />}
      </SpotlightCard>

      {/* =================================================================== */}
      {/* RESULTS BENTO DASHBOARD                                             */}
      {/* =================================================================== */}
      {audit && (
        <Box>
          {/* Top Action & Metadata Bar */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Chip
                label={`Nền tảng: ${audit.platform.toUpperCase()}`}
                sx={{ bgcolor: "rgba(0, 113, 227, 0.16)", color: APPLE_PALETTE.skyLink, fontWeight: 700 }}
              />
              <Chip
                label={`Đã quét: ${audit.primary_channel.sample_size} bài đăng/video`}
                sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#fff" }}
              />
              <Chip
                label={`Engine: ${audit.strategy.model_used}`}
                sx={{ bgcolor: "rgba(48, 209, 88, 0.14)", color: "#30d158", fontWeight: 600 }}
              />
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() => handleCopyText("full_md", audit.strategy.raw_markdown)}
                sx={{ borderRadius: "999px", textTransform: "none" }}
              >
                {copiedId === "full_md" ? "Đã sao chép Báo cáo!" : "Sao chép Báo cáo"}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadReport}
                sx={{ borderRadius: "999px", textTransform: "none" }}
              >
                Tải Báo Cáo Chiến Lược (.MD)
              </Button>
            </Stack>
          </Box>

          {/* ROW 1: 4 Executive KPI Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SpotlightCard sx={{ p: 2.5, height: "100%" }}>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 600 }}>
                  ĐIỂM SỨC KHỎE KÊNH (CHANNEL SCORE)
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: "#30d158", my: 0.5 }}>
                  {audit.primary_channel.channel_health_score}
                  <Typography component="span" variant="h6" sx={{ color: APPLE_PALETTE.inkMuted }}>
                    /100
                  </Typography>
                </Typography>
                <Chip
                  size="small"
                  icon={<TrendingUpIcon sx={{ fontSize: "14px !important" }} />}
                  label={audit.primary_channel.momentum_label}
                  sx={{
                    mt: 0.5,
                    bgcolor:
                      audit.primary_channel.momentum_status === "rising"
                        ? "rgba(48, 209, 88, 0.15)"
                        : "rgba(41, 151, 255, 0.15)",
                    color:
                      audit.primary_channel.momentum_status === "rising" ? "#30d158" : APPLE_PALETTE.skyLink,
                    fontWeight: 600,
                  }}
                />
              </SpotlightCard>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SpotlightCard sx={{ p: 2.5, height: "100%" }}>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 600 }}>
                  TRUNG VỊ LƯỢT XEM (MEDIAN VIEWS)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#ffffff", my: 0.5 }}>
                  {audit.primary_channel.median_views.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: "#ffd60a", display: "block", fontWeight: 600 }}>
                  🔥 Đỉnh Viral: {audit.primary_channel.max_views.toLocaleString()} views (
                  {Math.round((audit.primary_channel.max_views / Math.max(audit.primary_channel.median_views, 1)) * 10) /
                    10}
                  x)
                </Typography>
              </SpotlightCard>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SpotlightCard sx={{ p: 2.5, height: "100%" }}>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 600 }}>
                  TƯƠNG TÁC TRỌNG SỐ (WEIGHTED ER%)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: APPLE_PALETTE.skyLink, my: 0.5 }}>
                  {audit.primary_channel.avg_weighted_engagement_rate}%
                </Typography>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
                  Share/Like: <strong>{audit.primary_channel.avg_share_to_like_pct}%</strong> · Comment/Like:{" "}
                  <strong>{audit.primary_channel.avg_comment_to_like_pct}%</strong>
                </Typography>
              </SpotlightCard>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SpotlightCard sx={{ p: 2.5, height: "100%" }}>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 600 }}>
                  NHỊP ĐĂNG & THỜI LƯỢNG VÀNG
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#ffffff", my: 0.5 }}>
                  {audit.primary_channel.posting_cadence_per_week}{" "}
                  <Typography component="span" variant="subtitle1" sx={{ color: APPLE_PALETTE.inkMuted }}>
                    bài/tuần
                  </Typography>
                </Typography>
                <Typography variant="caption" sx={{ color: "#30d158", display: "block", fontWeight: 600 }}>
                  ⏱️ Khung tối ưu: {audit.primary_channel.optimal_duration_tier}
                </Typography>
              </SpotlightCard>
            </Grid>
          </Grid>

          {/* ROW 2: HEAD-TO-HEAD COMPARISON MATRIX (When 2 Pages/Channels are analyzed) */}
          {audit.head_to_head && (
            <SpotlightCard
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                mb: 3,
                border: "1px solid rgba(255, 159, 10, 0.35)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <EmojiEventsIcon sx={{ color: "#ffd60a", fontSize: 28 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    ⚔️ Bảng Đối Đầu Trực Diện: {audit.head_to_head.page_a_name} vs. {audit.head_to_head.page_b_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
                    {audit.head_to_head.verdict.replace(/\*\*/g, "")}
                  </Typography>
                </Box>
              </Box>

              <TableContainer sx={{ mt: 2, mb: 2.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 700 }}>Chỉ số so sánh</TableCell>
                      <TableCell sx={{ color: APPLE_PALETTE.skyLink, fontWeight: 700 }}>
                        {audit.head_to_head.page_a_name} (Trang A)
                      </TableCell>
                      <TableCell sx={{ color: "#ff9f0a", fontWeight: 700 }}>
                        {audit.head_to_head.page_b_name} (Trang B)
                      </TableCell>
                      <TableCell sx={{ color: "#30d158", fontWeight: 700 }}>Ưu thế</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {audit.head_to_head.metrics_table.map((row) => (
                      <TableRow key={row.metric}>
                        <TableCell sx={{ fontWeight: 600 }}>{row.metric}</TableCell>
                        <TableCell
                          sx={{
                            fontWeight: row.winner === "A" ? 700 : 400,
                            color: row.winner === "A" ? "#30d158" : "#fff",
                          }}
                        >
                          {row.page_a_value}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: row.winner === "B" ? 700 : 400,
                            color: row.winner === "B" ? "#ffd60a" : "#fff",
                          }}
                        >
                          {row.page_b_value}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.winner_name}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              bgcolor:
                                row.winner === "A"
                                  ? "rgba(48, 209, 88, 0.16)"
                                  : row.winner === "B"
                                  ? "rgba(255, 214, 10, 0.16)"
                                  : "rgba(255,255,255,0.08)",
                              color:
                                row.winner === "A" ? "#30d158" : row.winner === "B" ? "#ffd60a" : "#fff",
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {audit.strategy.competitor_strategy && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: "rgba(255, 159, 10, 0.08)",
                    border: "1px solid rgba(255, 159, 10, 0.25)",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ffd60a", mb: 1 }}>
                    🎯 Chiến Thuật Vượt Mặt Đối Thủ (Counter-Strategy cho {audit.head_to_head.page_a_name}):
                  </Typography>
                  <Stack spacing={0.75}>
                    {audit.strategy.competitor_strategy.page_a_counter_attack.map((step, i) => (
                      <Typography key={i} variant="body2" sx={{ color: "#fff" }}>
                        • {step}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}
            </SpotlightCard>
          )}

          {/* ROW 3: Channel Positioning + Content Pillar Distribution */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SpotlightCard sx={{ p: 3, height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <BoltIcon sx={{ color: APPLE_PALETTE.skyLink }} />
                  1. Định Hướng Kênh & Xu Hướng Nội Dung
                </Typography>

                <Stack spacing={1.75}>
                  <Box>
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.skyLink, fontWeight: 700 }}>
                      ĐỊNH VỊ NGÁCH CỐT LÕI (CORE NICHE)
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#fff", mt: 0.25 }}>
                      {audit.strategy.positioning.core_niche.replace(/\*\*/g, "")}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: "#30d158", fontWeight: 700 }}>
                      CHÂN DUNG KHÁN GIẢ MỤC TIÊU (AUDIENCE PERSONA)
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#fff", mt: 0.25 }}>
                      {audit.strategy.positioning.audience_persona}
                    </Typography>
                  </Box>

                  <Divider sx={{ borderColor: APPLE_PALETTE.hairline }} />

                  <Box>
                    <Typography variant="caption" sx={{ color: "#ffd60a", fontWeight: 700 }}>
                      XU HƯỚNG ĐANG THẮNG LỚN (WINNING CONTENT TRENDS)
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#fff", mt: 0.25 }}>
                      {audit.strategy.content_trends.winning_topics.replace(/\*\*/g, "")}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: "#ff453a", fontWeight: 700 }}>
                      CẢNH BÁO NỘI DUNG BÃO HÒA / TỤT VIEW
                    </Typography>
                    <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted, mt: 0.25 }}>
                      {audit.strategy.content_trends.fatigue_warning}
                    </Typography>
                  </Box>
                </Stack>
              </SpotlightCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SpotlightCard sx={{ p: 3, height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  📊 Phân Bổ 5 Trụ Cột Nội Dung (Content Pillars Mix)
                </Typography>

                <Stack spacing={2}>
                  {audit.primary_channel.pillar_distribution.map((pil) => (
                    <Box key={pil.pillar}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {pil.label} ({pil.count} bài)
                        </Typography>
                        <Typography variant="caption" sx={{ color: APPLE_PALETTE.skyLink, fontWeight: 700 }}>
                          {pil.percentage}% · TB {pil.avg_views.toLocaleString()} views ({pil.lift_vs_median}x)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, pil.percentage)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "rgba(255,255,255,0.08)",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 4,
                            background:
                              pil.lift_vs_median >= 1.15
                                ? "linear-gradient(90deg, #30d158, #0071e3)"
                                : APPLE_PALETTE.actionBlue,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>

                {/* Top Hashtags */}
                {audit.primary_channel.top_hashtags.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 600, display: "block", mb: 1 }}>
                      TỪ KHÓA & HASHTAG MANG LẠI NHIỀU VIEW NHẤT:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {audit.primary_channel.top_hashtags.slice(0, 8).map((h) => (
                        <Chip
                          key={h.tag}
                          size="small"
                          label={`${h.tag} (${h.lift_ratio}x)`}
                          sx={{
                            bgcolor: "rgba(41, 151, 255, 0.12)",
                            color: APPLE_PALETTE.skyLink,
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </SpotlightCard>
            </Grid>
          </Grid>

          {/* ROW 4: PLATFORM-SPECIFIC KEY DRIVERS (TikTok · Facebook REACH · YouTube) */}
          <SpotlightCard sx={{ p: { xs: 2.5, sm: 3.5 }, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                mb: 2.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <KeyIcon sx={{ color: "#ffd60a" }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  2. Giải Phẫu Key Thành Công Ở 3 Nền Tảng (TikTok · Facebook · YouTube)
                </Typography>
              </Box>

              <Tabs
                value={keyPlatformTab}
                onChange={(_, val) => setKeyPlatformTab(val)}
                sx={{
                  minHeight: 38,
                  "& .MuiTab-root": { minHeight: 38, textTransform: "none", fontWeight: 600, fontSize: "0.85rem" },
                }}
              >
                <Tab value="tiktok" label="🎵 Key TikTok" />
                <Tab value="facebook" label="📘 Key Facebook (REACH)" />
                <Tab value="youtube" label="▶️ Key YouTube" />
              </Tabs>
            </Box>

            {/* Strategic summary for the selected platform */}
            <Alert
              icon={<AutoAwesomeIcon fontSize="inherit" />}
              severity="info"
              sx={{
                mb: 2.5,
                bgcolor: "rgba(0, 113, 227, 0.1)",
                color: "#ffffff",
                border: "1px solid rgba(0, 113, 227, 0.3)",
                borderRadius: "12px",
              }}
            >
              {keyPlatformTab === "tiktok" && audit.strategy.platform_keys_analysis.tiktok_key.replace(/\*\*/g, "")}
              {keyPlatformTab === "facebook" && audit.strategy.platform_keys_analysis.facebook_key.replace(/\*\*/g, "")}
              {keyPlatformTab === "youtube" && audit.strategy.platform_keys_analysis.youtube_key.replace(/\*\*/g, "")}
            </Alert>

            <Grid container spacing={2}>
              {activeScorecards.map((item) => (
                <Grid size={{ xs: 12, md: 6 }} key={item.key}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "14px",
                      border: `1px solid ${APPLE_PALETTE.hairline}`,
                      bgcolor: "rgba(255,255,255,0.02)",
                      height: "100%",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#fff" }}>
                        {item.key}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${item.score}/100`}
                        sx={{
                          fontWeight: 700,
                          bgcolor: item.score >= 80 ? "rgba(48, 209, 88, 0.16)" : "rgba(255, 214, 10, 0.16)",
                          color: item.score >= 80 ? "#30d158" : "#ffd60a",
                        }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={item.score}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        mb: 1.25,
                        bgcolor: "rgba(255,255,255,0.08)",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: item.score >= 80 ? "#30d158" : "#ffd60a",
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.skyLink, display: "block", fontWeight: 600 }}>
                      Hiện tại: {item.current} · Chuẩn: {item.benchmark}
                    </Typography>
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mt: 0.5 }}>
                      {item.insight}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </SpotlightCard>

          {/* ROW 5: Strengths, Weaknesses & 30-Day Improvement Plan + Top Outliers */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SpotlightCard sx={{ p: 3, height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  🏆 Top Video Viral Đột Biến (Outliers) Của Kênh
                </Typography>
                <Stack spacing={1.5}>
                  {audit.primary_channel.viral_outliers.map((v, idx) => (
                    <Box
                      key={v.id}
                      sx={{
                        p: 1.75,
                        borderRadius: "12px",
                        bgcolor: "rgba(255,255,255,0.03)",
                        border: `1px solid ${APPLE_PALETTE.hairline}`,
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
                        <Chip
                          size="small"
                          label={`#${idx + 1} · ${v.outlier_ratio}x Trung vị`}
                          sx={{ bgcolor: "rgba(255, 214, 10, 0.16)", color: "#ffd60a", fontWeight: 700 }}
                        />
                        <Typography variant="caption" sx={{ color: "#30d158", fontWeight: 700 }}>
                          {v.views.toLocaleString()} views · ER {v.weighted_engagement_rate}%
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#fff", mb: 0.5 }}>
                        {v.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                        Trụ cột: {v.pillar_label} · Thời lượng: {v.duration}s ({v.duration_tier})
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </SpotlightCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SpotlightCard sx={{ p: 3, height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  🛠️ Chẩn Đoán Điểm Nghẽn & Lời Khuyên Cải Thiện
                </Typography>

                <Typography variant="subtitle2" sx={{ color: "#30d158", fontWeight: 700, mb: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.5 }} />
                  Điểm mạnh cốt lõi cần nhân bản:
                </Typography>
                <Stack spacing={0.75} sx={{ mb: 2 }}>
                  {audit.strategy.strengths.map((s, idx) => (
                    <Typography key={idx} variant="body2" sx={{ color: "#fff" }}>
                      • {s.replace(/\*\*/g, "")}
                    </Typography>
                  ))}
                </Stack>

                <Typography variant="subtitle2" sx={{ color: "#ff9f0a", fontWeight: 700, mb: 1 }}>
                  <WarningAmberIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.5 }} />
                  Điểm nghẽn cần khắc phục ngay:
                </Typography>
                <Stack spacing={0.75} sx={{ mb: 2 }}>
                  {audit.strategy.weaknesses.map((w, idx) => (
                    <Typography key={idx} variant="body2" sx={{ color: "#fff" }}>
                      • {w.replace(/\*\*/g, "")}
                    </Typography>
                  ))}
                </Stack>

                <Divider sx={{ borderColor: APPLE_PALETTE.hairline, my: 1.5 }} />

                <Typography variant="subtitle2" sx={{ color: APPLE_PALETTE.skyLink, fontWeight: 700, mb: 1 }}>
                  🚀 Lộ trình 30 ngày bứt phá:
                </Typography>
                <Stack spacing={0.75}>
                  {audit.strategy.action_plan_30d.map((act, idx) => (
                    <Typography key={idx} variant="body2" sx={{ color: "#fff" }}>
                      {act.replace(/\*\*/g, "")}
                    </Typography>
                  ))}
                </Stack>
              </SpotlightCard>
            </Grid>
          </Grid>

          {/* ROW 6: NEXT 5 VIDEO SCRIPTS PLAYBOOK */}
          <SpotlightCard sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
                  <MovieCreationIcon sx={{ color: APPLE_PALETTE.skyLink }} />
                  3. Playbook 5 Kịch Bản Video Tiếp Theo (Đo Ni Đóng Giày Cho Kênh)
                </Typography>
                <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
                  Mỗi kịch bản đã được thiết kế sẵn Hook 3 giây đầu, cấu trúc giữ chân và lời thoại chuẩn nhịp đọc cho Studio CapCut.
                </Typography>
              </Box>
              {onSwitchToStudio && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onSwitchToStudio}
                  sx={{ borderRadius: "999px", textTransform: "none" }}
                >
                  Mở Studio CapCut Tạo .SRT →
                </Button>
              )}
            </Box>

            <Grid container spacing={2}>
              {audit.strategy.next_5_video_scripts.map((sc) => (
                <Grid size={{ xs: 12, md: 6 }} key={sc.episode}>
                  <Box
                    sx={{
                      p: 2.25,
                      borderRadius: "14px",
                      border: `1px solid ${APPLE_PALETTE.hairline}`,
                      bgcolor: "rgba(255,255,255,0.025)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1 }}>
                        <Chip
                          size="small"
                          label={`Kịch bản #${sc.episode} · ${sc.pillar}`}
                          sx={{ bgcolor: "rgba(0, 113, 227, 0.18)", color: APPLE_PALETTE.skyLink, fontWeight: 700 }}
                        />
                        <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                          {sc.platform_fit}
                        </Typography>
                      </Box>

                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#fff", mb: 1 }}>
                        {sc.title}
                      </Typography>

                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: "10px",
                          bgcolor: "rgba(48, 209, 88, 0.08)",
                          border: "1px solid rgba(48, 209, 88, 0.25)",
                          mb: 1.25,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "#30d158", fontWeight: 700, display: "block" }}>
                          ⚡ HOOK 3 GIÂY ĐẦU:
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#fff", fontStyle: "italic" }}>
                          "{sc.hook_3s}"
                        </Typography>
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{ color: APPLE_PALETTE.inkMuted, whiteSpace: "pre-line", display: "block", mb: 1 }}
                      >
                        {sc.body_outline}
                      </Typography>

                      <Typography variant="caption" sx={{ color: "#ffd60a", display: "block", mb: 1.5 }}>
                        🎯 CTA: {sc.cta}
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={() => handleCopyText(`sc_${sc.episode}`, sc.capcut_script)}
                      sx={{ borderRadius: "999px", textTransform: "none", alignSelf: "flex-start" }}
                    >
                      {copiedId === `sc_${sc.episode}`
                        ? "Đã copy lời thoại chuẩn CapCut!"
                        : "Copy lời thoại cho Máy Nhắc Chữ CapCut"}
                    </Button>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </SpotlightCard>
        </Box>
      )}
    </Box>
  );
};
