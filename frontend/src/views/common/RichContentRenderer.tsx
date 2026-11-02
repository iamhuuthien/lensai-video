import React, { useState } from "react";
import { Box, Typography, Stack, Chip, Paper, IconButton, Tooltip, Button } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { APPLE_PALETTE } from "../../theme/theme";
import { ExportService } from "../../services/export";

export interface SrtBlock {
  index: number;
  start: string;
  end: string;
  startSeconds: number;
  text: string;
  wordCount: number;
}

/**
 * Parse timestamp like "00:01:23,400" or "01:23" into seconds
 */
export function parseTimecodeToSeconds(tc: string): number {
  const cleaned = tc.trim().replace(",", ".");
  const parts = cleaned.split(":").map((p) => parseFloat(p));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

/**
 * Format "00:00:05,700" -> "00:05.7" for compact creator display
 */
export function formatCompactSrtTime(tc: string): string {
  const clean = tc.trim();
  const match = clean.match(/^(?:00:)?(\d{2}:\d{2}),(\d)\d*$/);
  if (match) {
    return `${match[1]}.${match[2]}`;
  }
  return clean.replace(/^00:/, "");
}

/**
 * Parse standard .SRT string into structured subtitle blocks
 */
export function parseSrtBlocks(srt: string): SrtBlock[] {
  if (!srt || !srt.trim()) return [];
  const normalized = srt.replace(/\r\n/g, "\n").trim();
  const rawChunks = normalized.split(/\n\s*\n/);
  const blocks: SrtBlock[] = [];

  for (const chunk of rawChunks) {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;

    let timeLineIdx = 0;
    if (/^\d+$/.test(lines[0]) && lines[1]?.includes("-->")) {
      timeLineIdx = 1;
    } else if (lines[0].includes("-->")) {
      timeLineIdx = 0;
    } else {
      continue;
    }

    const timeLine = lines[timeLineIdx];
    const [startRaw, endRaw] = timeLine.split("-->").map((s) => s.trim());
    if (!startRaw || !endRaw) continue;

    const textLines = lines.slice(timeLineIdx + 1);
    const text = stripInlineMarkdown(textLines.join(" ").trim());
    if (!text) continue;

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    blocks.push({
      index: blocks.length + 1,
      start: startRaw,
      end: endRaw,
      startSeconds: parseTimecodeToSeconds(startRaw),
      text,
      wordCount,
    });
  }

  return blocks;
}

/**
 * Strip inline markdown syntax (**bold**, *italic*, `code`, ~~strike~~) so no strange symbols remain
 */
export function stripInlineMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

/**
 * Convert full markdown advice into clean, readable plain text for clipboard / .txt export
 */
export function stripMarkdownToCleanText(raw: string): string {
  if (!raw) return "";
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }
    // Skip markdown horizontal rules or table separator rows
    if (/^[-*_]{3,}$/.test(trimmed) || /^\|?[\s:|-]+\|[\s:|-]+\|?$/.test(trimmed)) {
      continue;
    }
    // Format markdown table row cleanly
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => stripInlineMarkdown(c.trim()))
        .filter(Boolean);
      if (cells.length > 0) {
        out.push(`• ${cells.join("  —  ")}`);
      }
      continue;
    }
    // Headings
    if (/^#{1,6}\s+/.test(trimmed)) {
      const heading = stripInlineMarkdown(trimmed.replace(/^#{1,6}\s+/, ""));
      out.push(`\n=== ${heading.toUpperCase()} ===`);
      continue;
    }
    // Blockquotes
    if (trimmed.startsWith(">")) {
      const quote = stripInlineMarkdown(trimmed.replace(/^>\s*/, ""));
      out.push(`👉 ${quote}`);
      continue;
    }
    // Bullets
    if (/^[-*+]\s+/.test(trimmed)) {
      const item = stripInlineMarkdown(trimmed.replace(/^[-*+]\s+/, ""));
      out.push(`• ${item}`);
      continue;
    }
    out.push(stripInlineMarkdown(trimmed));
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

interface RichInlineTextProps {
  text: string;
  onSeek?: (seconds: number) => void;
}

/**
 * Renders inline text with clean highlights for **bold**, `code`, and clickable [MM:SS] timecodes,
 * stripping all raw markdown characters.
 */
export const RichInlineText: React.FC<RichInlineTextProps> = ({ text, onSeek }) => {
  if (!text) return null;

  // Normalize stray unclosed double-asterisks or backticks
  const normalized = text.replace(/`(\[?\d{1,2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2})?\]?)`/g, "$1");

  // Tokenize by **bold**, *italic*, `code`, or timecodes like [00:00 - 00:06] / 00:06 - 00:14
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\b\d{1,2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2})?\b)/g;
  const parts = normalized.split(tokenRegex);

  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;

        // Bold **...**
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          const inner = stripInlineMarkdown(part.slice(2, -2));
          // Check if the bold content itself is a timecode
          const tcMatch = inner.match(/^\[?(\d{1,2}:\d{2})(?:\s*-\s*(\d{1,2}:\d{2}))?\]?$/);
          if (tcMatch) {
            const sec = parseTimecodeToSeconds(tcMatch[1]);
            return (
              <Chip
                key={idx}
                icon={onSeek ? <PlayArrowIcon sx={{ fontSize: "13px !important", color: `${APPLE_PALETTE.skyLink} !important` }} /> : undefined}
                label={inner.replace(/^\[|\]$/g, "")}
                size="small"
                onClick={onSeek ? () => onSeek(sec) : undefined}
                sx={{
                  mx: 0.4,
                  my: 0.2,
                  height: 22,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "monospace",
                  bgcolor: "rgba(41, 151, 255, 0.14)",
                  color: APPLE_PALETTE.skyLink,
                  border: "1px solid rgba(41, 151, 255, 0.3)",
                  cursor: onSeek ? "pointer" : "default",
                }}
              />
            );
          }
          return (
            <Box
              key={idx}
              component="span"
              sx={{
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              {inner}
            </Box>
          );
        }

        // Italic *...*
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          const inner = stripInlineMarkdown(part.slice(1, -1));
          return (
            <Box
              key={idx}
              component="span"
              sx={{
                color: "#c8e1ff",
                fontStyle: "italic",
              }}
            >
              {inner}
            </Box>
          );
        }

        // Inline code `...`
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          const inner = part.slice(1, -1);
          return (
            <Box
              key={idx}
              component="span"
              sx={{
                px: 0.7,
                py: 0.15,
                mx: 0.25,
                borderRadius: "6px",
                bgcolor: "rgba(255, 255, 255, 0.08)",
                border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
                color: "#ffd60a",
                fontFamily: "monospace",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              {inner}
            </Box>
          );
        }

        // Standalone timecode e.g. 00:00 - 00:06
        const tcMatch = part.match(/^(\d{1,2}:\d{2})(?:\s*-\s*(\d{1,2}:\d{2}))?$/);
        if (tcMatch) {
          const sec = parseTimecodeToSeconds(tcMatch[1]);
          return (
            <Chip
              key={idx}
              icon={onSeek ? <PlayArrowIcon sx={{ fontSize: "13px !important", color: `${APPLE_PALETTE.skyLink} !important` }} /> : undefined}
              label={part}
              size="small"
              onClick={onSeek ? () => onSeek(sec) : undefined}
              sx={{
                mx: 0.4,
                my: 0.2,
                height: 22,
                fontSize: "0.74rem",
                fontWeight: 700,
                fontFamily: "monospace",
                bgcolor: "rgba(41, 151, 255, 0.14)",
                color: APPLE_PALETTE.skyLink,
                border: "1px solid rgba(41, 151, 255, 0.3)",
                cursor: onSeek ? "pointer" : "default",
              }}
            />
          );
        }

        return <React.Fragment key={idx}>{part.replace(/\*\*/g, "").replace(/`/g, "")}</React.Fragment>;
      })}
    </>
  );
};

interface TableBlock {
  headers: string[];
  rows: string[][];
}

interface RichContentRendererProps {
  content: string;
  onSeek?: (seconds: number) => void;
  compact?: boolean;
}

/**
 * Turns structured Markdown from AI Director / Chat into Apple Cinema Dark Cards,
 * Timeline Cut Rows, Copyable Hook Callouts, and Clean Diagnostics with ZERO raw markdown syntax.
 */
export const RichContentRenderer: React.FC<RichContentRendererProps> = ({ content, onSeek, compact = false }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!content || !content.trim()) {
    return null;
  }

  const handleCopySnippet = async (text: string, key: string) => {
    const clean = stripInlineMarkdown(text).replace(/^["“]|["”]$/g, "");
    const ok = await ExportService.copyToClipboard(clean);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // 1. Skip empty lines or horizontal rules
    if (!line || /^[-*_]{3,}$/.test(line)) {
      i++;
      continue;
    }

    // 2. Detect Markdown Table block (| ... |)
    if (line.startsWith("|") && line.includes("|", 1)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      const parsedRows = tableLines
        .filter((tl) => !/^\|?[\s:|-]+\|[\s:|-]+\|?$/.test(tl))
        .map((tl) =>
          tl
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => cell.trim())
        )
        .filter((row) => row.some(Boolean));

      if (parsedRows.length >= 2) {
        const table: TableBlock = {
          headers: parsedRows[0].map((h) => stripInlineMarkdown(h)),
          rows: parsedRows.slice(1),
        };

        elements.push(
          <Stack key={`table-${i}`} spacing={1.5} sx={{ my: 1.5 }}>
            {table.rows.map((row, rIdx) => {
              const firstCellClean = stripInlineMarkdown(row[0] || "").replace(/^\[|\]$/g, "");
              const tcMatch = firstCellClean.match(/(\d{1,2}:\d{2})/);
              const startSec = tcMatch ? parseTimecodeToSeconds(tcMatch[1]) : null;

              return (
                <Paper
                  key={rIdx}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "rgba(41, 151, 255, 0.45)",
                      bgcolor: "rgba(41, 151, 255, 0.04)",
                    },
                  }}
                >
                  {/* Row Header: Timecode or Step */}
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
                    <Chip
                      icon={
                        startSec !== null && onSeek ? (
                          <PlayArrowIcon sx={{ fontSize: "14px !important", color: "#ffffff !important" }} />
                        ) : (
                          <MovieFilterIcon sx={{ fontSize: "14px !important", color: "#ffffff !important" }} />
                        )
                      }
                      label={firstCellClean || `Phân đoạn #${rIdx + 1}`}
                      size="small"
                      onClick={startSec !== null && onSeek ? () => onSeek(startSec) : undefined}
                      sx={{
                        bgcolor: APPLE_PALETTE.actionBlue,
                        color: "#ffffff",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        fontSize: "0.76rem",
                        cursor: startSec !== null && onSeek ? "pointer" : "default",
                        "&:hover": startSec !== null && onSeek ? { bgcolor: APPLE_PALETTE.actionBlueHover } : undefined,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 600 }}>
                      Cảnh #{rIdx + 1}
                    </Typography>
                  </Stack>

                  {/* Remaining columns rendered as labeled key-value rows */}
                  <Stack spacing={1}>
                    {row.slice(1).map((cell, cIdx) => {
                      if (!cell) return null;
                      const colHeader = table.headers[cIdx + 1] || `Chi tiết ${cIdx + 1}`;
                      const isSfx =
                        colHeader.toLowerCase().includes("âm thanh") ||
                        colHeader.toLowerCase().includes("sfx") ||
                        cell.toLowerCase().includes("sfx");
                      const isZoom =
                        colHeader.toLowerCase().includes("zoom") ||
                        colHeader.toLowerCase().includes("cắt") ||
                        colHeader.toLowerCase().includes("thao tác");

                      return (
                        <Box
                          key={cIdx}
                          sx={{
                            pl: 1.2,
                            borderLeft: `2px solid ${
                              isSfx ? "#ffd60a" : isZoom ? APPLE_PALETTE.skyLink : APPLE_PALETTE.success
                            }`,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.03em",
                              color: isSfx ? "#ffd60a" : isZoom ? APPLE_PALETTE.skyLink : APPLE_PALETTE.success,
                              mb: 0.2,
                            }}
                          >
                            {colHeader}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#e6e6eb", lineHeight: 1.5, fontSize: "0.84rem" }}>
                            <RichInlineText text={cell} onSeek={onSeek} />
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        );
      }
      continue;
    }

    // 3. Section Headings (### ... or ## ...)
    if (/^#{1,4}\s+/.test(line)) {
      const headingText = stripInlineMarkdown(line.replace(/^#{1,4}\s+/, ""));
      const lower = headingText.toLowerCase();
      let icon = <AutoFixHighIcon sx={{ fontSize: 18, color: APPLE_PALETTE.skyLink }} />;
      let accentBg = "rgba(41, 151, 255, 0.14)";
      let accentColor = APPLE_PALETTE.skyLink;

      if (lower.includes("hook") || lower.includes("3 giây") || lower.includes("mở đầu") || lower.includes("vấn đề") || lower.includes("chẩn đoán")) {
        icon = <LocalFireDepartmentIcon sx={{ fontSize: 18, color: "#ff9f0a" }} />;
        accentBg = "rgba(255, 159, 10, 0.14)";
        accentColor = "#ff9f0a";
      } else if (lower.includes("cắt") || lower.includes("zoom") || lower.includes("b-roll") || lower.includes("mốc") || lower.includes("phân cảnh")) {
        icon = <MovieFilterIcon sx={{ fontSize: 18, color: APPLE_PALETTE.skyLink }} />;
        accentBg = "rgba(41, 151, 255, 0.14)";
        accentColor = APPLE_PALETTE.skyLink;
      } else if (lower.includes("âm thanh") || lower.includes("nhạc") || lower.includes("sfx") || lower.includes("pacing")) {
        icon = <GraphicEqIcon sx={{ fontSize: 18, color: APPLE_PALETTE.success }} />;
        accentBg = "rgba(48, 209, 88, 0.14)";
        accentColor = APPLE_PALETTE.success;
      }

      elements.push(
        <Stack
          key={`h-${i}`}
          direction="row"
          spacing={1.2}
          sx={{
            alignItems: "center",
            mt: elements.length === 0 ? 0.5 : 2.5,
            mb: 1.2,
            pb: 0.8,
            borderBottom: `1px solid ${APPLE_PALETTE.hairline}`,
          }}
        >
          <Box
            sx={{
              p: 0.6,
              borderRadius: "8px",
              bgcolor: accentBg,
              color: accentColor,
              display: "flex",
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: "#ffffff",
              fontSize: compact ? "0.9rem" : "0.95rem",
              letterSpacing: "-0.01em",
            }}
          >
            {headingText}
          </Typography>
        </Stack>
      );
      i++;
      continue;
    }

    // 4. Blockquote (> ...) -> Interactive Hook Callout Card with 1-click Copy
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
        i++;
      }
      const combinedQuote = quoteLines.join(" ");
      const copyKey = `quote-${i}`;
      const isCopied = copiedKey === copyKey;

      elements.push(
        <Paper
          key={copyKey}
          elevation={0}
          sx={{
            p: 1.75,
            my: 1.2,
            borderRadius: "14px",
            bgcolor: "rgba(255, 159, 10, 0.07)",
            border: "1px solid rgba(255, 159, 10, 0.28)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: "#ffffff", lineHeight: 1.55, fontSize: "0.86rem" }}>
              <RichInlineText text={combinedQuote} onSeek={onSeek} />
            </Typography>
          </Box>
          <Tooltip title="Sao chép câu Hook này">
            <Button
              size="small"
              variant="outlined"
              startIcon={isCopied ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
              onClick={() => handleCopySnippet(combinedQuote, copyKey)}
              sx={{
                minWidth: "auto",
                px: 1.2,
                py: 0.3,
                fontSize: "0.72rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
                color: isCopied ? APPLE_PALETTE.success : "#ffd60a",
                borderColor: isCopied ? APPLE_PALETTE.success : "rgba(255, 214, 10, 0.35)",
                "&:hover": {
                  borderColor: "#ffd60a",
                  bgcolor: "rgba(255, 214, 10, 0.12)",
                },
              }}
            >
              {isCopied ? "Đã chép" : "Chép"}
            </Button>
          </Tooltip>
        </Paper>
      );
      continue;
    }

    // 5. Bullet or Numbered List Items
    if (/^(\s*[-*+]|\s*\d+\.)\s+/.test(lines[i])) {
      const listItems: { text: string; isSub: boolean }[] = [];
      while (i < lines.length && /^(\s*[-*+]|\s*\d+\.)\s+/.test(lines[i])) {
        const rawLine = lines[i];
        const indent = rawLine.match(/^\s*/)?.[0].length || 0;
        const cleanItem = rawLine.trim().replace(/^([-*+]|\d+\.)\s+/, "");
        listItems.push({ text: cleanItem, isSub: indent >= 2 });
        i++;
      }

      elements.push(
        <Stack key={`list-${i}`} spacing={1} sx={{ my: 1 }}>
          {listItems.map((item, idx) => {
            const lowerItem = item.text.toLowerCase();
            const isWeakness =
              lowerItem.includes("điểm yếu") ||
              lowerItem.includes("vấn đề") ||
              lowerItem.includes("lỗi") ||
              lowerItem.includes("chưa đủ");
            const isStrength =
              lowerItem.includes("điểm mạnh") ||
              lowerItem.includes("giải pháp") ||
              lowerItem.includes("đề xuất") ||
              lowerItem.includes("cách sửa");

            return (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.2,
                  pl: item.isSub ? 2 : 0.5,
                  py: isWeakness || isStrength ? 1 : 0.3,
                  px: isWeakness || isStrength ? 1.2 : 0.5,
                  borderRadius: "10px",
                  bgcolor: isWeakness
                    ? "rgba(255, 69, 58, 0.08)"
                    : isStrength
                    ? "rgba(48, 209, 88, 0.08)"
                    : "transparent",
                  border: isWeakness
                    ? "1px solid rgba(255, 69, 58, 0.22)"
                    : isStrength
                    ? "1px solid rgba(48, 209, 88, 0.22)"
                    : "none",
                }}
              >
                {isWeakness ? (
                  <WarningAmberRoundedIcon sx={{ fontSize: 17, color: "#ff6961", mt: 0.25, flexShrink: 0 }} />
                ) : isStrength ? (
                  <CheckCircleOutlinedIcon sx={{ fontSize: 17, color: APPLE_PALETTE.success, mt: 0.25, flexShrink: 0 }} />
                ) : (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: item.isSub ? APPLE_PALETTE.inkMuted : APPLE_PALETTE.skyLink,
                      mt: 0.9,
                      flexShrink: 0,
                    }}
                  />
                )}
                <Typography variant="body2" sx={{ color: "#e6e6eb", lineHeight: 1.55, fontSize: "0.85rem", flex: 1 }}>
                  <RichInlineText text={item.text} onSeek={onSeek} />
                </Typography>
              </Box>
            );
          })}
        </Stack>
      );
      continue;
    }

    // 6. Regular Paragraph
    elements.push(
      <Typography
        key={`p-${i}`}
        variant="body2"
        sx={{
          color: "#d2d2d7",
          lineHeight: 1.6,
          my: 0.8,
          fontSize: "0.86rem",
        }}
      >
        <RichInlineText text={line} onSeek={onSeek} />
      </Typography>
    );
    i++;
  }

  return <Box sx={{ width: "100%" }}>{elements}</Box>;
};

interface InteractiveSrtTimelineProps {
  srtContent: string;
  onSeek?: (seconds: number) => void;
}

/**
 * Interactive Visual Subtitle Timeline for Creators (like CapCut / OpusClip / Submagic)
 */
export const InteractiveSrtTimeline: React.FC<InteractiveSrtTimelineProps> = ({ srtContent, onSeek }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const blocks = parseSrtBlocks(srtContent);

  if (blocks.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
        {srtContent}
      </Typography>
    );
  }

  const handleCopyLine = async (text: string, idx: number) => {
    const ok = await ExportService.copyToClipboard(text);
    if (ok) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    }
  };

  return (
    <Stack spacing={1}>
      {blocks.map((b) => {
        const isCopied = copiedIdx === b.index;
        const isFastLine = b.wordCount > 14;
        return (
          <Paper
            key={b.index}
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: "12px",
              bgcolor: "rgba(255, 255, 255, 0.025)",
              border: `1px solid ${APPLE_PALETTE.hairline}`,
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              transition: "all 0.16s ease",
              "&:hover": {
                bgcolor: "rgba(41, 151, 255, 0.06)",
                borderColor: "rgba(41, 151, 255, 0.35)",
              },
            }}
          >
            {/* Block Index */}
            <Box
              sx={{
                minWidth: 26,
                height: 26,
                borderRadius: "8px",
                bgcolor: APPLE_PALETTE.tile2,
                color: APPLE_PALETTE.inkMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              #{b.index}
            </Box>

            {/* Clickable Timecode Pill */}
            <Chip
              icon={onSeek ? <PlayArrowIcon sx={{ fontSize: "12px !important", color: `${APPLE_PALETTE.skyLink} !important` }} /> : undefined}
              label={`${formatCompactSrtTime(b.start)} → ${formatCompactSrtTime(b.end)}`}
              size="small"
              onClick={onSeek ? () => onSeek(b.startSeconds) : undefined}
              sx={{
                height: 24,
                bgcolor: "rgba(0, 113, 227, 0.12)",
                color: APPLE_PALETTE.skyLink,
                border: "1px solid rgba(41, 151, 255, 0.25)",
                fontFamily: "monospace",
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: onSeek ? "pointer" : "default",
                flexShrink: 0,
              }}
            />

            {/* Subtitle Line Text */}
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                color: "#ffffff",
                fontWeight: 500,
                fontSize: "0.86rem",
                lineHeight: 1.4,
              }}
            >
              {b.text}
            </Typography>

            {/* Word Count Pill */}
            <Chip
              label={`${b.wordCount} từ`}
              size="small"
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                height: 20,
                fontSize: "0.68rem",
                bgcolor: isFastLine ? "rgba(255, 159, 10, 0.14)" : APPLE_PALETTE.tile2,
                color: isFastLine ? "#ff9f0a" : APPLE_PALETTE.inkMuted,
              }}
            />

            {/* 1-Click Copy Line */}
            <Tooltip title="Sao chép câu thoại này">
              <IconButton
                size="small"
                onClick={() => handleCopyLine(b.text, b.index)}
                sx={{
                  color: isCopied ? APPLE_PALETTE.success : APPLE_PALETTE.inkMuted,
                  p: 0.5,
                  "&:hover": { color: "#ffffff" },
                }}
              >
                {isCopied ? <CheckIcon sx={{ fontSize: 15 }} /> : <ContentCopyIcon sx={{ fontSize: 15 }} />}
              </IconButton>
            </Tooltip>
          </Paper>
        );
      })}
    </Stack>
  );
};
