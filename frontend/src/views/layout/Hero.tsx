import React from "react";
import { Box, Typography, Chip, Stack, Button, Grid } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import PsychologyIcon from "@mui/icons-material/Psychology";
import GitHubIcon from "@mui/icons-material/GitHub";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import BoltIcon from "@mui/icons-material/Bolt";
import VideocamIcon from "@mui/icons-material/Videocam";
import { APPLE_PALETTE } from "../../theme/theme";
import { SpotlightCard } from "../common/SpotlightCard";

interface HeroProps {
  onSelectSampleUrl?: (url: string) => void;
  onScrollToTool?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectSampleUrl, onScrollToTool }) => {
  const SAMPLES = [
    {
      label: "TikTok Mẹo AI Viral",
      url: "https://www.tiktok.com/@vtv24news/video/7339182390123456789",
      icon: <BoltIcon sx={{ fontSize: 14, color: "#30d158" }} />,
    },
    {
      label: "Reels Review Công Nghệ",
      url: "https://www.facebook.com/reel/1234567890123456",
      icon: <VideocamIcon sx={{ fontSize: 14, color: APPLE_PALETTE.skyLink }} />,
    },
    {
      label: "Shorts Xây Kênh Triệu View",
      url: "https://youtube.com/shorts/dQw4w9WgXcQ",
      icon: <AutoAwesomeIcon sx={{ fontSize: 14, color: "#ffd60a" }} />,
    },
  ];

  return (
    <Box sx={{ pt: { xs: 3, sm: 5 }, pb: { xs: 3, sm: 4 }, textAlign: "center", maxWidth: 980, mx: "auto", px: 2 }}>
      {/* Eyebrow Badge */}
      <Chip
        icon={<AutoAwesomeIcon sx={{ fontSize: "14px !important", color: `${APPLE_PALETTE.skyLink} !important` }} />}
        label="LensAI 4.0 — Nền tảng AI Thị Giác Đa Tầng Cho Content Creator"
        size="small"
        sx={{
          mb: 2.5,
          backgroundColor: "rgba(0, 113, 227, 0.12)",
          color: APPLE_PALETTE.skyLink,
          border: `1px solid rgba(41, 151, 255, 0.3)`,
          fontSize: "0.8125rem",
          fontWeight: 600,
          py: 2,
          px: 1.5,
          boxShadow: "0 4px 20px rgba(0, 113, 227, 0.2)",
        }}
      />

      {/* Main Headline */}
      <Typography
        variant="h1"
        sx={{
          color: "#ffffff",
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: 1.15,
          fontSize: { xs: "2rem", sm: "2.75rem", md: "3.25rem" },
          mb: 2,
        }}
      >
        Biến Video Ngắn Thành <br />
        <Box
          component="span"
          sx={{
            background: "linear-gradient(135deg, #2997ff 0%, #af52de 50%, #30d158 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Kịch Bản Viral & Doanh Thu
        </Box>
      </Typography>

      {/* Subtitle */}
      <Typography
        variant="body1"
        sx={{
          color: APPLE_PALETTE.inkMuted,
          fontSize: { xs: "0.95rem", sm: "1.125rem" },
          lineHeight: 1.6,
          maxWidth: 720,
          mx: "auto",
          mb: 3,
        }}
      >
        Tải video không logo 100% miễn phí · AI Gemini 2.5 đọc chữ OCR từng frame · Dò tìm đoạn giữ chân 3s đầu · Tự động hóa xuất phụ đề .SRT lồng tiếng CapCut.
      </Typography>

      {/* Quick Action Buttons */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ justifyContent: "center", alignItems: "center", mb: 3 }}
      >
        <Button
          variant="contained"
          size="medium"
          startIcon={<PlayArrowIcon />}
          onClick={onScrollToTool}
          sx={{
            fontWeight: 700,
            px: 3,
            py: 1,
            bgcolor: APPLE_PALETTE.actionBlue,
            boxShadow: "0 4px 20px rgba(0, 113, 227, 0.45)",
            "&:active": { transform: "scale(0.96)" },
          }}
        >
          Dán Link Trải Nghiệm Ngay
        </Button>
        <Button
          variant="outlined"
          size="medium"
          startIcon={<GitHubIcon />}
          component="a"
          href="https://github.com/iamhuuthien/lensai-video"
          target="_blank"
          rel="noreferrer"
          sx={{
            fontWeight: 600,
            px: 2.5,
            py: 1,
            borderColor: APPLE_PALETTE.hairlineStrong,
            color: "#ffffff",
            "&:hover": { borderColor: APPLE_PALETTE.skyLink, bgcolor: "rgba(255, 255, 255, 0.05)" },
            "&:active": { transform: "scale(0.96)" },
          }}
        >
          Mã Nguồn GitHub (Open Core)
        </Button>
      </Stack>

      {/* Sample Tryouts (Người mới vào web bấm thử ngay không cần copy link) */}
      <Box sx={{ mb: 4, pt: 1 }}>
        <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 1, fontSize: "0.75rem" }}>
          👉 Người mới? Bấm thử video mẫu thực tế (không cần tìm link):
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ justifyContent: "center", flexWrap: "wrap" }}>
          {SAMPLES.map((s, idx) => (
            <Chip
              key={idx}
              icon={s.icon}
              label={s.label}
              size="small"
              onClick={() => onSelectSampleUrl?.(s.url)}
              sx={{
                bgcolor: APPLE_PALETTE.tile2,
                border: `1px solid ${APPLE_PALETTE.hairline}`,
                color: "#e1e1e6",
                cursor: "pointer",
                fontSize: "0.75rem",
                transition: "all 0.18s ease",
                "&:hover": {
                  borderColor: APPLE_PALETTE.skyLink,
                  bgcolor: APPLE_PALETTE.tileHover,
                  color: "#ffffff",
                },
                "&:active": { transform: "scale(0.95)" },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* 4 Superpower Bento Cards */}
      <Grid container spacing={2} sx={{ textAlign: "left" }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SpotlightCard
            spotlightColor="rgba(48, 209, 88, 0.18)"
            hoverBorderColor="#30d158"
            sx={{ p: 2.2, height: "100%", borderRadius: "18px" }}
          >
            <Box sx={{ color: "#30d158", mb: 1 }}>
              <DownloadForOfflineIcon sx={{ fontSize: 26 }} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ffffff", mb: 0.5 }}>
              Tải Video Không Logo 0đ
            </Typography>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, lineHeight: 1.4, display: "block" }}>
              Bóc watermark TikTok, Reels, Shorts siêu nét từ CDN gốc, không tốn AI credit và không giới hạn.
            </Typography>
          </SpotlightCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SpotlightCard
            spotlightColor="rgba(41, 151, 255, 0.18)"
            hoverBorderColor={APPLE_PALETTE.skyLink}
            sx={{ p: 2.2, height: "100%", borderRadius: "18px" }}
          >
            <Box sx={{ color: APPLE_PALETTE.skyLink, mb: 1 }}>
              <BoltIcon sx={{ fontSize: 26 }} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ffffff", mb: 0.5 }}>
              Dò Đoạn Vàng Giữ Chân
            </Typography>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, lineHeight: 1.4, display: "block" }}>
              AI quan sát hình ảnh và âm thanh để định vị chính xác giây phút viral nhất trong video.
            </Typography>
          </SpotlightCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SpotlightCard
            spotlightColor="rgba(175, 82, 222, 0.18)"
            hoverBorderColor="#af52de"
            sx={{ p: 2.2, height: "100%", borderRadius: "18px" }}
          >
            <Box sx={{ color: "#af52de", mb: 1 }}>
              <SubtitlesIcon sx={{ fontSize: 26 }} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ffffff", mb: 0.5 }}>
              Xuất Phụ Đề .SRT CapCut
            </Typography>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, lineHeight: 1.4, display: "block" }}>
              Đồng bộ phụ đề chuẩn khung thời gian để kéo thẳng vào CapCut cho AI lồng tiếng tự động.
            </Typography>
          </SpotlightCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SpotlightCard
            spotlightColor="rgba(255, 159, 10, 0.18)"
            hoverBorderColor="#ff9f0a"
            sx={{ p: 2.2, height: "100%", borderRadius: "18px" }}
          >
            <Box sx={{ color: "#ff9f0a", mb: 1 }}>
              <PsychologyIcon sx={{ fontSize: 26 }} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ffffff", mb: 0.5 }}>
              AI Gemini 2.5 Pro Tư Duy
            </Typography>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, lineHeight: 1.4, display: "block" }}>
              Đọc chữ OCR trên màn hình, phát hiện tool ẩn và viết lại kịch bản viral cho bạn dựng lại clip.
            </Typography>
          </SpotlightCard>
        </Grid>
      </Grid>
    </Box>
  );
};
