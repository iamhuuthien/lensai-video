import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
} from "@mui/material";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import SearchIcon from "@mui/icons-material/Search";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import TagIcon from "@mui/icons-material/Tag";
import SpeedIcon from "@mui/icons-material/Speed";
import { VIRAL_HOOKS, HASHTAG_PRESETS, FreeToolsService } from "../../services/freeTools";
import { ExportService } from "../../services/export";
import { APPLE_PALETTE } from "../../theme/theme";
import { SpotlightCard } from "../common/SpotlightCard";

export const FreeHubTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testScript, setTestScript] = useState<string>("");

  const categories = ["Tất cả", "Tò mò & Bí mật", "Tương phản & Đòn bẩy", "Con số & Thực chứng", "Kể chuyện & Cảm xúc"];

  const filteredHooks = VIRAL_HOOKS.filter((h) => {
    const matchCategory = selectedCategory === "Tất cả" || h.category === selectedCategory;
    const matchSearch =
      !searchTerm ||
      h.hook.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.framework.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.example.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleCopy = async (text: string, id: string) => {
    const ok = await ExportService.copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const pacing = FreeToolsService.calculatePacing(testScript);

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: 2, py: 3 }}>
      {/* Header Banner */}
      <SpotlightCard
        spotlightColor="rgba(48, 209, 88, 0.16)"
        hoverBorderColor="rgba(48, 209, 88, 0.4)"
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 4,
          borderRadius: "20px",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          gap: 2.5,
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderRadius: "14px",
            bgcolor: "rgba(48, 209, 88, 0.15)",
            color: APPLE_PALETTE.success,
            display: "flex",
          }}
        >
          <CardGiftcardIcon sx={{ fontSize: 32 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Free Creator Hub (0đ Trọn đời)
            </Typography>
            <Chip
              label="0 AI Tokens · 100% Trình duyệt"
              size="small"
              sx={{ bgcolor: "rgba(48, 209, 88, 0.12)", color: APPLE_PALETTE.success, fontWeight: 600 }}
            />
          </Stack>
          <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
            Trọn bộ công cụ hỗ trợ sáng tạo video ngắn không giới hạn số lần, không tiêu hao điểm tín dụng AI và xử lý trực tiếp trên trình duyệt của bạn.
          </Typography>
        </Box>
      </SpotlightCard>

      {/* Section 1: Viral Hook Library */}
      <Box sx={{ mb: 6 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 2.5,
          }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <LocalFireDepartmentIcon sx={{ color: "#ff9500", fontSize: 22 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Kho công thức Hook mở đầu 3 giây
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
              Chọn công thức tâm lý, thay thế cụm từ trong ngoặc và đưa thẳng vào kịch bản
            </Typography>
          </Box>

          {/* Search Field */}
          <TextField
            size="small"
            placeholder="Tìm công thức..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: APPLE_PALETTE.inkMuted, fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: { xs: "100%", sm: 220 } }}
          />
        </Stack>

        {/* Categories Chips */}
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 3 }}>
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setSelectedCategory(cat)}
              sx={{
                backgroundColor: selectedCategory === cat ? APPLE_PALETTE.actionBlue : APPLE_PALETTE.tile2,
                color: selectedCategory === cat ? "#ffffff" : APPLE_PALETTE.inkMuted,
                border: `1px solid ${selectedCategory === cat ? APPLE_PALETTE.actionBlue : APPLE_PALETTE.hairline}`,
                fontWeight: selectedCategory === cat ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                "&:hover": {
                  backgroundColor: selectedCategory === cat ? APPLE_PALETTE.actionBlueHover : APPLE_PALETTE.tileHover,
                  color: "#ffffff",
                },
                "&:active": {
                  transform: "scale(0.96)",
                },
              }}
            />
          ))}
        </Stack>

        {/* Hooks Cards */}
        <Grid container spacing={2}>
          {filteredHooks.map((h, idx) => {
            const hookId = `hook-${idx}`;
            const isCopied = copiedId === hookId;
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                <SpotlightCard
                  spotlightColor="rgba(41, 151, 255, 0.12)"
                  hoverBorderColor="rgba(41, 151, 255, 0.4)"
                  enableScaleHover
                  sx={{
                    p: 2.5,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ mb: 1.5 }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Chip
                        label={h.category}
                        size="small"
                        sx={{ fontSize: "0.6875rem", bgcolor: APPLE_PALETTE.tile2, color: APPLE_PALETTE.skyLink }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(h.hook, hookId)}
                        sx={{
                          color: isCopied ? APPLE_PALETTE.success : APPLE_PALETTE.inkMuted,
                          transition: "all 0.15s ease",
                          "&:hover": { color: "#ffffff" },
                          "&:active": { transform: "scale(0.9)" },
                        }}
                      >
                        {isCopied ? <CheckIcon sx={{ fontSize: 18 }} /> : <ContentCopyIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Stack>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#ffffff", mb: 1, lineHeight: 1.4 }}>
                      "{h.hook}"
                    </Typography>
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 0.5 }}>
                      Cấu trúc: {h.framework}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#a1a1a6", fontStyle: "italic", display: "block" }}>
                      Ví dụ thực tế: {h.example}
                    </Typography>
                  </Box>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={isCopied ? <CheckIcon sx={{ fontSize: 15 }} /> : <ContentCopyIcon sx={{ fontSize: 15 }} />}
                    onClick={() => handleCopy(h.hook, hookId)}
                    sx={{
                      alignSelf: "flex-start",
                      fontSize: "0.75rem",
                      color: isCopied ? APPLE_PALETTE.success : APPLE_PALETTE.skyLink,
                      p: 0,
                      transition: "all 0.15s ease",
                      "&:active": { transform: "scale(0.96)" },
                    }}
                  >
                    {isCopied ? "Đã sao chép" : "Sao chép công thức"}
                  </Button>
                </SpotlightCard>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Section 2: Quick Pacing & Duration Calculator */}
      <Box sx={{ mb: 6 }}>
        <SpotlightCard
          spotlightColor="rgba(41, 151, 255, 0.12)"
          hoverBorderColor="rgba(41, 151, 255, 0.35)"
          sx={{
            p: 3,
            borderRadius: "20px",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
            <SpeedIcon sx={{ color: APPLE_PALETTE.skyLink, fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Bảng ước tính nhịp độ & thời lượng video
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 2 }}>
            Dán kịch bản thử nghiệm để tính chính xác số giây nói khi quay
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            value={testScript}
            onChange={(e) => setTestScript(e.target.value)}
            placeholder="Dán đoạn kịch bản ngắn vào đây để tính nhịp độ..."
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box sx={{ p: 1.5, bgcolor: APPLE_PALETTE.tile2, borderRadius: "12px", textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
                  Tổng số từ
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff" }}>
                  {pacing.wordCount}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box sx={{ p: 1.5, bgcolor: APPLE_PALETTE.tile2, borderRadius: "12px", textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
                  Nói chuẩn (150 WPM)
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: APPLE_PALETTE.skyLink }}>
                  ~{pacing.standardSeconds}s
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box sx={{ p: 1.5, bgcolor: APPLE_PALETTE.tile2, borderRadius: "12px", textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
                  Nói nhanh TikTok (185 WPM)
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#ff9500" }}>
                  ~{pacing.fastSeconds}s
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box sx={{ p: 1.5, bgcolor: APPLE_PALETTE.tile2, borderRadius: "12px", textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
                  Đánh giá phân khúc
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: APPLE_PALETTE.success }}>
                  {pacing.pacingCategory}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </SpotlightCard>
      </Box>

      {/* Section 3: Hashtag SEO Matrix */}
      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
          <TagIcon sx={{ color: APPLE_PALETTE.purple, fontSize: 22 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Bộ thẻ Hashtag xu hướng theo ngành
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 2.5 }}>
          Bấm để sao chép toàn bộ cụm hashtag tối ưu cho bài đăng của bạn
        </Typography>

        <Grid container spacing={2}>
          {Object.entries(HASHTAG_PRESETS).map(([niche, tags], idx) => {
            const tagStr = tags.join(" ");
            const tagId = `tag-${idx}`;
            const isCopied = copiedId === tagId;
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                <SpotlightCard
                  spotlightColor="rgba(175, 82, 222, 0.12)"
                  hoverBorderColor="rgba(175, 82, 222, 0.4)"
                  sx={{
                    p: 2.5,
                    borderRadius: "16px",
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#ffffff" }}>
                      {niche}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={isCopied ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                      onClick={() => handleCopy(tagStr, tagId)}
                      sx={{
                        fontSize: "0.75rem",
                        color: isCopied ? APPLE_PALETTE.success : APPLE_PALETTE.skyLink,
                        transition: "all 0.15s ease",
                        "&:active": { transform: "scale(0.96)" },
                      }}
                    >
                      {isCopied ? "Đã chép" : "Sao chép"}
                    </Button>
                  </Stack>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, wordBreak: "break-all" }}>
                    {tagStr}
                  </Typography>
                </SpotlightCard>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
};
