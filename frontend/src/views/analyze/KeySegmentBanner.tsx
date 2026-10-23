import React from "react";
import { Box, Typography, Button, Stack, Chip } from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import TimerIcon from "@mui/icons-material/Timer";
import type { KeySegment } from "../../models/types";
import { APPLE_PALETTE } from "../../theme/theme";
import { SpotlightCard } from "../common/SpotlightCard";

interface KeySegmentBannerProps {
  segment: KeySegment;
  onSeek?: (seconds: number) => void;
}

export const KeySegmentBanner: React.FC<KeySegmentBannerProps> = ({ segment, onSeek }) => {
  return (
    <SpotlightCard
      spotlightColor="rgba(255, 149, 0, 0.18)"
      hoverBorderColor="rgba(255, 149, 0, 0.55)"
      enableScaleHover
      sx={{
        p: { xs: 2.5, sm: 3 },
        mb: 3.5,
        backgroundColor: "rgba(22, 22, 24, 0.95)",
        border: "1px solid rgba(245, 166, 35, 0.35)",
        borderRadius: "20px",
        position: "relative",
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(90deg, #ff9500, #ffcc00, #ff3b30)",
          zIndex: 2,
        },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2.5}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
            <Chip
              icon={<WhatshotIcon sx={{ fontSize: "16px !important", color: "#ff9500 !important" }} />}
              label="ĐOẠN VÀNG GIỮ CHÂN CAO NHẤT"
              size="small"
              sx={{
                backgroundColor: "rgba(255, 149, 0, 0.15)",
                color: "#ff9500",
                fontWeight: 700,
                fontSize: "0.75rem",
                letterSpacing: "0.04em",
                border: "1px solid rgba(255, 149, 0, 0.3)",
              }}
            />
            <Chip
              icon={<TimerIcon sx={{ fontSize: "14px !important", color: "#ffffff !important" }} />}
              label={`${segment.start_time} - ${segment.end_time}`}
              size="small"
              sx={{
                backgroundColor: APPLE_PALETTE.tile2,
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
          </Stack>

          {segment.title && (
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#ffffff", mb: 0.5 }}>
              {segment.title}
            </Typography>
          )}

          <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted, lineHeight: 1.5 }}>
            {segment.reason}
          </Typography>
        </Box>

        {onSeek && (
          <Button
            variant="contained"
            size="medium"
            onClick={() => onSeek(segment.start_seconds)}
            startIcon={<PlayArrowIcon />}
            sx={{
              backgroundColor: "#ff9500",
              color: "#000000",
              fontWeight: 600,
              flexShrink: 0,
              transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
              "&:hover": {
                backgroundColor: "#ffaa33",
                boxShadow: "0 6px 20px rgba(255, 149, 0, 0.45)",
              },
              "&:active": {
                transform: "scale(0.96)",
              },
            }}
          >
            Xem đoạn này
          </Button>
        )}
      </Stack>
    </SpotlightCard>
  );
};
