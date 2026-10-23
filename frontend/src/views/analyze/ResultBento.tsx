import React, { useState } from "react";
import {
  Grid,
  Paper,
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import DownloadIcon from "@mui/icons-material/Download";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import type { AnalysisResult } from "../../models/types";
import { ExportService } from "../../services/export";
import { APPLE_PALETTE } from "../../theme/theme";

interface ResultBentoProps {
  result: AnalysisResult;
  onSeek?: (seconds: number) => void;
  onExportSrt?: () => void;
}

export const ResultBento: React.FC<ResultBentoProps> = ({ result, onSeek, onExportSrt }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyAll = async () => {
    const success = await ExportService.copyToClipboard(result.raw_markdown || result.summary);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    const safeTitle = (result.video_info.title || "lensai-summary")
      .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_")
      .slice(0, 50);
    ExportService.downloadFile(`${safeTitle}.md`, result.raw_markdown || result.summary, "text/markdown");
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Top Export Bar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: APPLE_PALETTE.tile1,
          border: `1px solid ${APPLE_PALETTE.hairline}`,
          borderRadius: "16px",
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
          Kết quả phân tích từ Gemini Vision:
        </Typography>

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          {onExportSrt && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<SubtitlesIcon sx={{ fontSize: 16 }} />}
              onClick={onExportSrt}
              sx={{ fontSize: "0.8125rem", py: 0.6 }}
            >
              Xuất .SRT CapCut
            </Button>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleDownloadMarkdown}
            sx={{ fontSize: "0.8125rem", py: 0.6 }}
          >
            Tải Markdown (.md)
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={copied ? <CheckIcon sx={{ fontSize: 16, color: APPLE_PALETTE.success }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
            onClick={handleCopyAll}
            sx={{
              fontSize: "0.8125rem",
              py: 0.6,
              color: copied ? APPLE_PALETTE.success : undefined,
              borderColor: copied ? APPLE_PALETTE.success : undefined,
            }}
          >
            {copied ? "Đã sao chép" : "Sao chép toàn bộ"}
          </Button>
        </Stack>
      </Stack>

      {/* Bento Grid */}
      <Grid container spacing={2.5}>
        {/* Card 1: Executive Summary */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: "100%",
              backgroundColor: APPLE_PALETTE.tile1,
              border: `1px solid ${APPLE_PALETTE.hairline}`,
              borderRadius: "18px",
              transition: "border-color 0.2s ease",
              "&:hover": { borderColor: "rgba(255, 255, 255, 0.2)" },
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
              <Box
                sx={{
                  p: 0.8,
                  borderRadius: "10px",
                  bgcolor: "rgba(0, 113, 227, 0.15)",
                  color: APPLE_PALETTE.skyLink,
                  display: "flex",
                }}
              >
                <LightbulbIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Tóm tắt & Thông điệp cốt lõi
              </Typography>
            </Stack>

            <Typography
              variant="body1"
              sx={{
                color: "#e1e1e6",
                lineHeight: 1.6,
                whiteSpace: "pre-line",
              }}
            >
              {result.summary}
            </Typography>
          </Paper>
        </Grid>

        {/* Card 2: Interactive Timeline / Chapters */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: "100%",
              backgroundColor: APPLE_PALETTE.tile1,
              border: `1px solid ${APPLE_PALETTE.hairline}`,
              borderRadius: "18px",
              transition: "border-color 0.2s ease",
              "&:hover": { borderColor: "rgba(255, 255, 255, 0.2)" },
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
              <Box
                sx={{
                  p: 0.8,
                  borderRadius: "10px",
                  bgcolor: "rgba(48, 209, 88, 0.15)",
                  color: APPLE_PALETTE.success,
                  display: "flex",
                }}
              >
                <FormatListNumberedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Dòng thời gian & Mục lục
              </Typography>
            </Stack>

            {result.chapters && result.chapters.length > 0 ? (
              <List disablePadding>
                {result.chapters.map((chap, idx) => (
                  <ListItem
                    key={idx}
                    disableGutters
                    sx={{
                      py: 1.2,
                      borderBottom: idx < result.chapters.length - 1 ? `1px solid ${APPLE_PALETTE.hairline}` : "none",
                    }}
                  >
                    <Chip
                      icon={<PlayArrowIcon sx={{ fontSize: 13 }} />}
                      label={chap.time}
                      size="small"
                      onClick={() => onSeek && onSeek(chap.seconds)}
                      sx={{
                        mr: 1.5,
                        backgroundColor: APPLE_PALETTE.tile2,
                        color: APPLE_PALETTE.skyLink,
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        cursor: onSeek ? "pointer" : "default",
                        "&:hover": { backgroundColor: APPLE_PALETTE.tileHover },
                      }}
                    />
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ fontWeight: 500, color: "#ffffff" }}>{chap.title}</Typography>}
                      secondary={chap.summary ? <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>{chap.summary}</Typography> : undefined}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
                Không có mục thời gian cụ thể cho video này.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Card 3: Key Quotes & Takeaways */}
        {result.takeaways && result.takeaways.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                backgroundColor: APPLE_PALETTE.tile1,
                border: `1px solid ${APPLE_PALETTE.hairline}`,
                borderRadius: "18px",
                transition: "border-color 0.2s ease",
                "&:hover": { borderColor: "rgba(255, 255, 255, 0.2)" },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
                <Box
                  sx={{
                    p: 0.8,
                    borderRadius: "10px",
                    bgcolor: "rgba(255, 214, 10, 0.15)",
                    color: "#ffd60a",
                    display: "flex",
                  }}
                >
                  <FormatQuoteIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Takeaways & Trích dẫn đắt giá
                </Typography>
              </Stack>

              <List disablePadding>
                {result.takeaways.map((item, idx) => (
                  <ListItem key={idx} disableGutters sx={{ py: 0.8, alignItems: "flex-start" }}>
                    <ListItemIcon sx={{ minWidth: 28, mt: 0.4 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#ffd60a" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ color: "#e1e1e6", lineHeight: 1.5 }}>{item}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Card 4: Action Items */}
        {result.action_items && result.action_items.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: "100%",
                backgroundColor: APPLE_PALETTE.tile1,
                border: `1px solid ${APPLE_PALETTE.hairline}`,
                borderRadius: "18px",
                transition: "border-color 0.2s ease",
                "&:hover": { borderColor: "rgba(255, 255, 255, 0.2)" },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
                <Box
                  sx={{
                    p: 0.8,
                    borderRadius: "10px",
                    bgcolor: "rgba(48, 209, 88, 0.15)",
                    color: APPLE_PALETTE.success,
                    display: "flex",
                  }}
                >
                  <CheckCircleOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Hành động khuyến nghị
                </Typography>
              </Stack>

              <List disablePadding>
                {result.action_items.map((item, idx) => (
                  <ListItem key={idx} disableGutters sx={{ py: 0.8, alignItems: "flex-start" }}>
                    <ListItemIcon sx={{ minWidth: 28, mt: 0.3 }}>
                      <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: APPLE_PALETTE.success }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ color: "#e1e1e6", lineHeight: 1.5 }}>{item}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Card 5: Concept / Mindmap Structure */}
        {result.mindmap && result.mindmap.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                backgroundColor: APPLE_PALETTE.tile1,
                border: `1px solid ${APPLE_PALETTE.hairline}`,
                borderRadius: "18px",
                transition: "border-color 0.2s ease",
                "&:hover": { borderColor: "rgba(255, 255, 255, 0.2)" },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
                <Box
                  sx={{
                    p: 0.8,
                    borderRadius: "10px",
                    bgcolor: "rgba(175, 82, 222, 0.15)",
                    color: APPLE_PALETTE.purple,
                    display: "flex",
                  }}
                >
                  <AccountTreeIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Sơ đồ tư duy & Cấu trúc luận điểm
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                {result.mindmap.map((node, idx) => (
                  <Chip
                    key={idx}
                    label={node}
                    sx={{
                      backgroundColor: APPLE_PALETTE.tile2,
                      color: "#ffffff",
                      border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
                      py: 1,
                      px: 0.5,
                      fontSize: "0.8125rem",
                    }}
                  />
                ))}
              </Stack>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
