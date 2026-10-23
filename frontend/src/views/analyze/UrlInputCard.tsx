import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import BoltIcon from "@mui/icons-material/Bolt";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SchoolIcon from "@mui/icons-material/School";
import MovieCreationIcon from "@mui/icons-material/MovieCreation";
import HistoryIcon from "@mui/icons-material/History";
import type { AnalysisMode } from "../../models/types";
import { APPLE_PALETTE } from "../../theme/theme";
import { SpotlightCard } from "../common/SpotlightCard";

interface UrlInputCardProps {
  url: string;
  setUrl: (url: string) => void;
  mode: AnalysisMode;
  setMode: (mode: AnalysisMode) => void;
  loading: boolean;
  error: string | null;
  history: string[];
  onAnalyze: (targetUrl?: string, targetMode?: AnalysisMode) => void;
  onClear: () => void;
  onPaste: () => void;
}

const MODES: { id: AnalysisMode; label: string; icon: React.ReactElement }[] = [
  { id: "quick", label: "Tóm tắt nhanh", icon: <BoltIcon sx={{ fontSize: 16 }} /> },
  { id: "deep", label: "Phân tích chuyên sâu", icon: <PsychologyIcon sx={{ fontSize: 16 }} /> },
  { id: "study", label: "Học tập & Ghi chép", icon: <SchoolIcon sx={{ fontSize: 16 }} /> },
  { id: "clip_ideas", label: "Ý tưởng dựng clip", icon: <MovieCreationIcon sx={{ fontSize: 16 }} /> },
];

export const UrlInputCard: React.FC<UrlInputCardProps> = ({
  url,
  setUrl,
  mode,
  setMode,
  loading,
  error,
  history,
  onAnalyze,
  onClear,
  onPaste,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && url.trim()) {
      onAnalyze();
    }
  };

  return (
    <SpotlightCard
      spotlightColor="rgba(0, 113, 227, 0.16)"
      hoverBorderColor="rgba(41, 151, 255, 0.4)"
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        maxWidth: 840,
        mx: "auto",
        mb: 4,
        borderRadius: "22px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Search Input Bar */}
      <Box sx={{ mb: 2.5 }}>
        <TextField
          fullWidth
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Dán link video TikTok, Shorts, Reels hoặc YouTube..."
          disabled={loading}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon sx={{ color: APPLE_PALETTE.skyLink }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {url ? (
                    <IconButton size="small" onClick={onClear} edge="end" sx={{ color: APPLE_PALETTE.inkMuted }}>
                      <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  ) : (
                    <Button
                      size="small"
                      startIcon={<ContentPasteIcon sx={{ fontSize: 16 }} />}
                      onClick={onPaste}
                      sx={{
                        fontSize: "0.75rem",
                        py: 0.4,
                        px: 1.2,
                        color: APPLE_PALETTE.inkMuted,
                        "&:hover": { color: "#ffffff" },
                      }}
                    >
                      Dán link
                    </Button>
                  )}
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/* Mode Selector & Analyze CTA */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        {/* Mode Chips */}
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", flex: 1 }}>
          {MODES.map((m) => {
            const isSelected = mode === m.id;
            return (
              <Chip
                key={m.id}
                icon={m.icon}
                label={m.label}
                onClick={() => setMode(m.id)}
                sx={{
                  backgroundColor: isSelected ? APPLE_PALETTE.actionBlue : alpha(APPLE_PALETTE.tile2, 0.8),
                  color: isSelected ? "#ffffff" : APPLE_PALETTE.inkMuted,
                  border: `1px solid ${isSelected ? APPLE_PALETTE.actionBlue : APPLE_PALETTE.hairline}`,
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                  "&:active": {
                    transform: "scale(0.95)",
                  },
                  "&:hover": {
                    backgroundColor: isSelected ? APPLE_PALETTE.actionBlueHover : APPLE_PALETTE.tileHover,
                    color: "#ffffff",
                    borderColor: APPLE_PALETTE.skyLink,
                  },
                }}
              />
            );
          })}
        </Stack>

        {/* CTA Button */}
        <Button
          variant="contained"
          color="primary"
          size="large"
          disabled={loading || !url.trim()}
          onClick={() => onAnalyze()}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
          sx={{
            minWidth: 160,
            py: 1.2,
            px: 3,
            fontSize: "0.9375rem",
            fontWeight: 600,
            transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
            "&:active": {
              transform: "scale(0.96)",
            },
          }}
        >
          {loading ? "Đang xử lý..." : "Phân tích ngay"}
        </Button>
      </Stack>

      {/* Error alert */}
      {error && (
        <Alert
          severity="warning"
          onClose={onClear}
          sx={{
            mt: 2.5,
            backgroundColor: "rgba(255, 69, 58, 0.12)",
            color: "#ff8b85",
            border: "1px solid rgba(255, 69, 58, 0.3)",
            borderRadius: "12px",
            "& .MuiAlert-icon": { color: "#ff8b85" },
          }}
        >
          {error}
        </Alert>
      )}

      {/* Recent history */}
      {history.length > 0 && !loading && (
        <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${APPLE_PALETTE.hairline}` }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
            <HistoryIcon sx={{ fontSize: 14, color: APPLE_PALETTE.inkMuted }} />
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontSize: "0.75rem" }}>
              Video đã phân tích gần đây:
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {history.slice(0, 3).map((histItem, idx) => {
              const cleanUrl = typeof histItem === "string" ? histItem : String((histItem as { video?: { url?: string }; url?: string })?.video?.url || (histItem as { url?: string })?.url || "");
              if (!cleanUrl) return null;

              let display = cleanUrl;
              try {
                const u = new URL(cleanUrl);
                display = `${u.hostname}${String(u.pathname || "").slice(0, 16)}...`;
              } catch {
                display = String(cleanUrl).slice(0, 24) + "...";
              }

              return (
                <Chip
                  key={idx}
                  label={display}
                  size="small"
                  onClick={() => {
                    setUrl(cleanUrl);
                    onAnalyze(cleanUrl);
                  }}
                  sx={{
                    fontSize: "0.6875rem",
                    backgroundColor: alpha(APPLE_PALETTE.tile3, 0.5),
                    color: APPLE_PALETTE.inkMuted,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    "&:hover": { color: "#ffffff", backgroundColor: APPLE_PALETTE.tile3, borderColor: APPLE_PALETTE.skyLink },
                    "&:active": { transform: "scale(0.96)" },
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      )}
    </SpotlightCard>
  );
};

function alpha(hex: string, a: number): string {
  if (hex.startsWith("#")) {
    const c = hex.slice(1);
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return hex;
}
