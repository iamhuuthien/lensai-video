import React from "react";
import {
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Avatar,
} from "@mui/material";
import ForumIcon from "@mui/icons-material/Forum";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import type { ChatMessage } from "../../models/types";
import { APPLE_PALETTE } from "../../theme/theme";

interface ChatSectionProps {
  messages: ChatMessage[];
  inputQuestion: string;
  setInputQuestion: (q: string) => void;
  loading: boolean;
  error: string | null;
  onSend: (override?: string) => void;
  onReset: () => void;
}

const SUGGESTED_QUESTIONS = [
  "Tóm tắt 3 ý quan trọng nhất?",
  "Giải thích thuật ngữ khó trong clip",
  "Viết lại kịch bản ngắn 30s cho TikTok",
  "Khán giả sẽ phản biện điểm nào?",
];

export const ChatSection: React.FC<ChatSectionProps> = ({
  messages,
  inputQuestion,
  setInputQuestion,
  loading,
  error,
  onSend,
  onReset,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && inputQuestion.trim()) {
        onSend();
      }
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        backgroundColor: APPLE_PALETTE.tile1,
        border: `1px solid ${APPLE_PALETTE.hairline}`,
        borderRadius: "20px",
        mb: 4,
      }}
    >
      {/* Header */}
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              p: 0.8,
              borderRadius: "10px",
              bgcolor: "rgba(0, 113, 227, 0.15)",
              color: APPLE_PALETTE.skyLink,
              display: "flex",
            }}
          >
            <ForumIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Hỏi đáp chuyên sâu về video
            </Typography>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
              Hỏi mọi chi tiết xuất hiện trong video, kịch bản hoặc hình ảnh
            </Typography>
          </Box>
        </Stack>

        {messages.length > 0 && (
          <Button
            size="small"
            startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
            onClick={onReset}
            sx={{ color: APPLE_PALETTE.inkMuted, fontSize: "0.75rem" }}
          >
            Đặt lại
          </Button>
        )}
      </Stack>

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 1 }}>
            Gợi ý câu hỏi nhanh:
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <Chip
                key={idx}
                label={q}
                size="small"
                onClick={() => onSend(q)}
                sx={{
                  backgroundColor: APPLE_PALETTE.tile2,
                  color: "#ffffff",
                  border: `1px solid ${APPLE_PALETTE.hairline}`,
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  "&:hover": {
                    backgroundColor: APPLE_PALETTE.tileHover,
                    borderColor: APPLE_PALETTE.skyLink,
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Message history */}
      {messages.length > 0 && (
        <Box
          sx={{
            mb: 3,
            maxHeight: 400,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pr: 1,
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <Box
                key={msg.id}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: { xs: "90%", sm: "80%" },
                  flexDirection: isUser ? "row-reverse" : "row",
                }}
              >
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: isUser ? APPLE_PALETTE.actionBlue : APPLE_PALETTE.tile3,
                    color: "#ffffff",
                  }}
                >
                  {isUser ? <PersonIcon sx={{ fontSize: 18 }} /> : <SmartToyIcon sx={{ fontSize: 18 }} />}
                </Avatar>

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.75,
                    borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                    bgcolor: isUser ? APPLE_PALETTE.actionBlue : APPLE_PALETTE.tile2,
                    color: "#ffffff",
                    border: `1px solid ${isUser ? "transparent" : APPLE_PALETTE.hairline}`,
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {msg.text}
                  </Typography>
                </Paper>
              </Box>
            );
          })}

          {loading && (
            <Box sx={{ display: "flex", gap: 1.5, alignSelf: "flex-start" }}>
              <Avatar sx={{ width: 30, height: 30, bgcolor: APPLE_PALETTE.tile3 }}>
                <SmartToyIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  bgcolor: APPLE_PALETTE.tile2,
                  border: `1px solid ${APPLE_PALETTE.hairline}`,
                  borderRadius: "4px 16px 16px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CircularProgress size={16} sx={{ color: APPLE_PALETTE.skyLink }} />
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                  AI đang phân tích câu hỏi...
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      )}

      {/* Input row */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <TextField
          fullWidth
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Đặt câu hỏi về nội dung, nhân vật hoặc dữ liệu trong video..."
          disabled={loading}
          size="small"
        />
        <IconButton
          color="primary"
          disabled={loading || !inputQuestion.trim()}
          onClick={() => onSend()}
          sx={{
            bgcolor: APPLE_PALETTE.actionBlue,
            color: "#ffffff",
            p: 1.2,
            "&:hover": { bgcolor: APPLE_PALETTE.actionBlueHover },
            "&.Mui-disabled": { bgcolor: alpha(APPLE_PALETTE.tile3, 0.5), color: APPLE_PALETTE.inkMuted },
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon sx={{ fontSize: 20 }} />}
        </IconButton>
      </Stack>

      {error && (
        <Typography variant="caption" sx={{ color: APPLE_PALETTE.error, mt: 1, display: "block" }}>
          {error}
        </Typography>
      )}
    </Paper>
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
