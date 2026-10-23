import React from "react";
import { Box, Typography, Chip, Stack } from "@mui/material";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import ForumIcon from "@mui/icons-material/Forum";
import { APPLE_PALETTE } from "../../theme/theme";

export const Hero: React.FC = () => {
  return (
    <Box sx={{ pt: { xs: 4, sm: 6 }, pb: { xs: 3, sm: 4 }, textAlign: "center", maxWidth: 840, mx: "auto", px: 2 }}>
      {/* Eyebrow badge */}
      <Chip
        label="LensAI 4.0 — Computer Vision & Deep Explainer"
        size="small"
        sx={{
          mb: 2.5,
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          color: APPLE_PALETTE.skyLink,
          border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
          fontSize: "0.8125rem",
          fontWeight: 500,
          py: 1.8,
          px: 1,
        }}
      />

      {/* Main headline */}
      <Typography
        variant="h1"
        sx={{
          color: "#ffffff",
          fontWeight: 600,
          letterSpacing: "-0.03em",
          mb: 2,
        }}
      >
        Hiểu sâu mọi video trong chớp mắt.
      </Typography>

      {/* Subtitle / Lead */}
      <Typography
        variant="body1"
        sx={{
          color: APPLE_PALETTE.inkMuted,
          fontSize: { xs: "1rem", sm: "1.125rem" },
          lineHeight: 1.5,
          maxWidth: 680,
          mx: "auto",
          mb: 3.5,
        }}
      >
        AI xem trực tiếp video TikTok, Reels, Shorts và YouTube để phân tích cấu trúc, dò tìm đoạn giữ chân cao nhất và tư vấn kịch bản dựng lại clip.
      </Typography>

      {/* Highlight features */}
      <Stack
        direction="row"
        spacing={{ xs: 1, sm: 1.5 }}
        useFlexGap
        sx={{
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Chip
          icon={<ElectricBoltIcon sx={{ fontSize: "16px !important", color: `${APPLE_PALETTE.actionBlue} !important` }} />}
          label="Dò đoạn vàng giữ chân"
          size="small"
          sx={{
            backgroundColor: APPLE_PALETTE.tile2,
            border: `1px solid ${APPLE_PALETTE.hairline}`,
            color: "#ffffff",
            fontSize: "0.8125rem",
          }}
        />
        <Chip
          icon={<SubtitlesIcon sx={{ fontSize: "16px !important", color: `${APPLE_PALETTE.skyLink} !important` }} />}
          label="Xuất file phụ đề CapCut"
          size="small"
          sx={{
            backgroundColor: APPLE_PALETTE.tile2,
            border: `1px solid ${APPLE_PALETTE.hairline}`,
            color: "#ffffff",
            fontSize: "0.8125rem",
          }}
        />
        <Chip
          icon={<TrendingUpIcon sx={{ fontSize: "16px !important", color: `${APPLE_PALETTE.success} !important` }} />}
          label="Tư vấn kịch bản viral"
          size="small"
          sx={{
            backgroundColor: APPLE_PALETTE.tile2,
            border: `1px solid ${APPLE_PALETTE.hairline}`,
            color: "#ffffff",
            fontSize: "0.8125rem",
          }}
        />
        <Chip
          icon={<ForumIcon sx={{ fontSize: "16px !important", color: "#ffd60a !important" }} />}
          label="Hỏi đáp 1-1 với AI"
          size="small"
          sx={{
            backgroundColor: APPLE_PALETTE.tile2,
            border: `1px solid ${APPLE_PALETTE.hairline}`,
            color: "#ffffff",
            fontSize: "0.8125rem",
          }}
        />
      </Stack>
    </Box>
  );
};
