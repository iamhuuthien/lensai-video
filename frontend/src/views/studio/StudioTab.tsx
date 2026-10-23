import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Slider,
  Grid,
  Chip,
  Alert,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import DownloadIcon from "@mui/icons-material/Download";
import SpeedIcon from "@mui/icons-material/Speed";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import { FreeToolsService } from "../../services/freeTools";
import { ExportService } from "../../services/export";
import { APPLE_PALETTE } from "../../theme/theme";
import { SpotlightCard } from "../common/SpotlightCard";

export const StudioTab: React.FC = () => {
  const [script, setScript] = useState<string>(
    "Chào bạn! Bạn có biết rằng 90% người xem lướt qua video của bạn chỉ vì 3 giây đầu chưa đủ hấp dẫn?\n\nTrong video ngắn này, mình sẽ chỉ ra đúng 3 lỗi sai phổ biến nhất khi đặt hook mở đầu mà ai cũng từng mắc phải.\n\nLỗi thứ nhất: Giới thiệu bản thân quá dài dòng. Khán giả không quan tâm bạn là ai, họ quan tâm nội dung giúp gì cho họ.\n\nLỗi thứ hai: Thiếu yếu tố bất ngờ hoặc xung đột thị giác. Hãy bắt đầu ngay với hành động hoặc một phát biểu gây tò mò.\n\nLỗi thứ ba: Không có lời kêu gọi hành động rõ ràng ở cuối clip.\n\nHãy lưu ngay video này lại và thử áp dụng cho clip tiếp theo của bạn nhé!"
  );
  const [wpm, setWpm] = useState<number>(155);
  const [wordsPerLine, setWordsPerLine] = useState<number>(5);
  const [generatedSrt, setGeneratedSrt] = useState<string>("");
  const [isPrompting, setIsPrompting] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(24);

  const pacing = FreeToolsService.calculatePacing(script);

  const handleGenerateSrt = () => {
    const srt = FreeToolsService.generateSrtFromScript(script, wpm, wordsPerLine);
    setGeneratedSrt(srt);
  };

  const handleDownloadSrt = () => {
    const srt = generatedSrt || FreeToolsService.generateSrtFromScript(script, wpm, wordsPerLine);
    ExportService.downloadFile("LensAI_CapCut_Subtitles.srt", srt, "application/x-subrip");
  };

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: 2, py: 3 }}>
      {/* Studio Banner */}
      <SpotlightCard
        spotlightColor="rgba(0, 113, 227, 0.16)"
        hoverBorderColor="rgba(41, 151, 255, 0.4)"
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
            bgcolor: "rgba(0, 113, 227, 0.15)",
            color: APPLE_PALETTE.skyLink,
            display: "flex",
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 32 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            LensAI Creator Studio
          </Typography>
          <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
            Bộ công cụ dựng clip tốc độ cao cho TikTok, Reels & CapCut. Tự động hóa ngắt nhịp phụ đề và máy nhắc chữ khi quay.
          </Typography>
        </Box>
      </SpotlightCard>

      {/* Grid: Editor & Settings */}
      <Grid container spacing={3}>
        {/* Left: Script Input & Teleprompter */}
        <Grid size={{ xs: 12, md: 7 }}>
          <SpotlightCard
            spotlightColor="rgba(41, 151, 255, 0.12)"
            hoverBorderColor="rgba(41, 151, 255, 0.35)"
            sx={{
              p: 3,
              borderRadius: "20px",
              height: "100%",
            }}
          >
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Kịch bản dựng clip
              </Typography>
              <Chip
                label={`${pacing.wordCount} từ · ~${pacing.standardSeconds}s`}
                size="small"
                sx={{ bgcolor: APPLE_PALETTE.tile2, color: APPLE_PALETTE.skyLink, fontWeight: 600 }}
              />
            </Stack>

            <TextField
              fullWidth
              multiline
              rows={isPrompting ? 12 : 9}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Nhập hoặc dán kịch bản video của bạn tại đây..."
              sx={{
                mb: 2.5,
                "& .MuiOutlinedInput-root": {
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.6,
                },
              }}
            />

            {/* Pacing Advice */}
            <Alert
              severity="info"
              icon={<SpeedIcon sx={{ color: APPLE_PALETTE.skyLink }} />}
              sx={{
                mb: 2.5,
                backgroundColor: "rgba(0, 113, 227, 0.08)",
                color: "#c8e1ff",
                border: "1px solid rgba(0, 113, 227, 0.2)",
                borderRadius: "12px",
              }}
            >
              <strong>{pacing.pacingCategory}:</strong> {pacing.recommendation}
            </Alert>

            {/* Actions */}
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<SubtitlesIcon />}
                onClick={handleGenerateSrt}
                sx={{
                  fontWeight: 600,
                  transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                  "&:active": { transform: "scale(0.96)" },
                }}
              >
                Tạo mã phụ đề .SRT
              </Button>

              <Button
                variant="outlined"
                startIcon={isPrompting ? <PauseIcon /> : <PlayArrowIcon />}
                onClick={() => setIsPrompting(!isPrompting)}
                sx={{
                  transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                  "&:active": { transform: "scale(0.96)" },
                }}
              >
                {isPrompting ? "Tắt nhắc chữ" : "Chế độ máy nhắc chữ"}
              </Button>
            </Stack>
          </SpotlightCard>
        </Grid>

        {/* Right: SRT Pacing & Output */}
        <Grid size={{ xs: 12, md: 5 }}>
          <SpotlightCard
            spotlightColor="rgba(41, 151, 255, 0.12)"
            hoverBorderColor="rgba(41, 151, 255, 0.35)"
            sx={{
              p: 3,
              borderRadius: "20px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
              Cấu hình xuất phụ đề CapCut
            </Typography>

            {/* Slider: WPM */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
                  Tốc độ nói (Từ / phút):
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: APPLE_PALETTE.skyLink }}>
                  {wpm} WPM
                </Typography>
              </Stack>
              <Slider
                value={wpm}
                min={110}
                max={220}
                step={5}
                onChange={(_, val) => setWpm(val as number)}
                sx={{ color: APPLE_PALETTE.actionBlue }}
              />
              <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                130-150: Bình thường · 160-180: Nhanh kiểu TikTok · 190+: Siêu tốc
              </Typography>
            </Box>

            {/* Slider: Max Words Per Line */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
                  Số từ trên 1 dòng phụ đề:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: APPLE_PALETTE.skyLink }}>
                  {wordsPerLine} từ
                </Typography>
              </Stack>
              <Slider
                value={wordsPerLine}
                min={2}
                max={8}
                step={1}
                onChange={(_, val) => setWordsPerLine(val as number)}
                sx={{ color: APPLE_PALETTE.actionBlue }}
              />
              <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                Khuyến nghị: 4-5 từ giúp người xem đọc nhanh mà không bị che mặt nhân vật.
              </Typography>
            </Box>

            {/* Slider: Font Size for Teleprompter */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
                  Cỡ chữ máy nhắc:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: APPLE_PALETTE.skyLink }}>
                  {fontSize}px
                </Typography>
              </Stack>
              <Slider
                value={fontSize}
                min={16}
                max={36}
                step={2}
                onChange={(_, val) => setFontSize(val as number)}
                sx={{ color: APPLE_PALETTE.actionBlue }}
              />
            </Box>

            {/* Download SRT Button */}
            <Box sx={{ mt: "auto", pt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadSrt}
                sx={{
                  py: 1.3,
                  fontWeight: 600,
                  bgcolor: APPLE_PALETTE.actionBlue,
                  transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                  "&:active": { transform: "scale(0.96)" },
                }}
              >
                Tải file .SRT cho CapCut
              </Button>
            </Box>
          </SpotlightCard>
        </Grid>
      </Grid>
    </Box>
  );
};
