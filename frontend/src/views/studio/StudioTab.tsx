import React, { useState, useRef } from "react";
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
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
  Paper,
  IconButton,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import DownloadIcon from "@mui/icons-material/Download";
import SpeedIcon from "@mui/icons-material/Speed";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import MovieCreationIcon from "@mui/icons-material/MovieCreation";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import SmartDisplayIcon from "@mui/icons-material/SmartDisplay";
import { FreeToolsService } from "../../services/freeTools";
import { ExportService } from "../../services/export";
import { ApiService } from "../../services/api";
import { APPLE_PALETTE } from "../../theme/theme";
import { SpotlightCard } from "../common/SpotlightCard";

export const StudioTab: React.FC = () => {
  // Mode switcher: 0 = Video file import, 1 = Text script teleprompter
  const [tabIndex, setTabIndex] = useState<number>(0);

  // Video Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState<string>("vi");
  const [voiceTone, setVoiceTone] = useState<string>("viral");
  const [customNote, setCustomNote] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    advice: string;
    srtContent: string;
    srtFilename: string;
    modelUsed: string;
  } | null>(null);
  const [copiedSrt, setCopiedSrt] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Script Teleprompter State
  const [script, setScript] = useState<string>(
    "Chào bạn! Bạn có biết rằng 90% người xem lướt qua video của bạn chỉ vì 3 giây đầu chưa đủ hấp dẫn?\n\nTrong video ngắn này, mình sẽ chỉ ra đúng 3 lỗi sai phổ biến nhất khi đặt hook mở đầu mà ai cũng từng mắc phải.\n\nLỗi thứ nhất: Giới thiệu bản thân quá dài dòng. Khán giả không quan tâm bạn là ai, họ quan tâm nội dung giúp gì cho họ.\n\nLỗi thứ hai: Thiếu yếu tố bất ngờ hoặc xung đột thị giác. Hãy bắt đầu ngay với hành động hoặc một phát biểu gây tò mò.\n\nLỗi thứ ba: Không có lời kêu gọi hành động rõ ràng ở cuối clip.\n\nHãy lưu ngay video này lại và thử áp dụng cho clip tiếp theo của bạn nhé!"
  );
  const [wpm, setWpm] = useState<number>(155);
  const [wordsPerLine, setWordsPerLine] = useState<number>(5);
  const [generatedSrt, setGeneratedSrt] = useState<string>("");
  const [isPrompting, setIsPrompting] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(24);

  const pacing = FreeToolsService.calculatePacing(script);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxMb = 60;
      if (file.size > maxMb * 1024 * 1024) {
        setUploadError(`File video vượt quá ${maxMb}MB. Vui lòng chọn file nhẹ hơn hoặc nén lại trước khi tải.`);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const maxMb = 60;
      if (file.size > maxMb * 1024 * 1024) {
        setUploadError(`File video vượt quá ${maxMb}MB. Vui lòng chọn file nhẹ hơn.`);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadResult(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await ApiService.uploadStudioVideo(selectedFile, targetLang, voiceTone, customNote);
      setUploadResult({
        advice: res.editing_advice,
        srtContent: res.srt_content,
        srtFilename: res.srt_filename,
        modelUsed: res.model_used,
      });
    } catch (err: any) {
      setUploadError(err.message || "Không thể phân tích video tải lên.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadUploadedSrt = () => {
    if (!uploadResult) return;
    ExportService.downloadFile(uploadResult.srtFilename, uploadResult.srtContent, "application/x-subrip");
  };

  const handleCopyUploadedSrt = async () => {
    if (!uploadResult) return;
    const ok = await ExportService.copyToClipboard(uploadResult.srtContent);
    if (ok) {
      setCopiedSrt(true);
      setTimeout(() => setCopiedSrt(false), 2000);
    }
  };

  const handleGenerateScriptSrt = () => {
    const srt = FreeToolsService.generateSrtFromScript(script, wpm, wordsPerLine);
    setGeneratedSrt(srt);
  };

  const handleDownloadScriptSrt = () => {
    const srt = generatedSrt || FreeToolsService.generateSrtFromScript(script, wpm, wordsPerLine);
    ExportService.downloadFile("LensAI_CapCut_Subtitles.srt", srt, "application/x-subrip");
  };

  return (
    <Box sx={{ maxWidth: 1040, mx: "auto", px: 2, py: 3 }}>
      {/* Studio Banner */}
      <SpotlightCard
        spotlightColor="rgba(0, 113, 227, 0.16)"
        hoverBorderColor="rgba(41, 151, 255, 0.4)"
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
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
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: "#ffffff" }}>
            LensAI Creator Studio
          </Typography>
          <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
            Bộ công cụ dựng clip tốc độ cao cho TikTok, Reels & CapCut. Tải video gốc lên để AI nhận diện giọng nói, ngắt nhịp và xuất phụ đề .SRT chuẩn khung hình.
          </Typography>
        </Box>
      </SpotlightCard>

      {/* Mode Switcher Tabs */}
      <Tabs
        value={tabIndex}
        onChange={(_, val) => setTabIndex(val)}
        sx={{
          mb: 3,
          "& .MuiTabs-indicator": {
            backgroundColor: APPLE_PALETTE.actionBlue,
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
          "& .MuiTab-root": {
            fontWeight: 600,
            fontSize: "0.95rem",
            color: APPLE_PALETTE.inkMuted,
            textTransform: "none",
            "&.Mui-selected": { color: "#ffffff" },
          },
        }}
      >
        <Tab icon={<MovieCreationIcon sx={{ fontSize: 19 }} />} iconPosition="start" label="Tải File Video Lên (Tự Động Tạo .SRT)" />
        <Tab icon={<TextFieldsIcon sx={{ fontSize: 19 }} />} iconPosition="start" label="Từ Kịch Bản Văn Bản (Máy Nhắc Chữ)" />
      </Tabs>

      {/* MODE 0: VIDEO FILE UPLOAD */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          {/* Left: Video Dropzone & Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <SpotlightCard
              spotlightColor="rgba(41, 151, 255, 0.12)"
              hoverBorderColor="rgba(41, 151, 255, 0.35)"
              sx={{ p: 3, borderRadius: "20px", height: "100%" }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: "#ffffff" }}>
                Import Video Gốc
              </Typography>
              <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 2 }}>
                Hỗ trợ định dạng: MP4, MOV, WEBM, MKV (Dung lượng tối đa: 60MB).
              </Typography>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              {/* Drag & Drop Zone */}
              {!selectedFile ? (
                <Box
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    p: 4,
                    border: `2px dashed ${APPLE_PALETTE.hairlineStrong}`,
                    borderRadius: "16px",
                    bgcolor: "rgba(255, 255, 255, 0.02)",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: APPLE_PALETTE.actionBlue,
                      bgcolor: "rgba(0, 113, 227, 0.05)",
                    },
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 48, color: APPLE_PALETTE.skyLink, mb: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#ffffff" }}>
                    Kéo thả file video vào đây hoặc bấm để chọn
                  </Typography>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, mt: 0.5, display: "block" }}>
                    AI sẽ tự động nghe lời thoại, nhận diện phụ đề và gợi ý góc cắt cho CapCut
                  </Typography>
                </Box>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: "14px",
                    bgcolor: APPLE_PALETTE.tile2,
                    border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", overflow: "hidden" }}>
                      <VideoFileIcon sx={{ fontSize: 32, color: APPLE_PALETTE.skyLink }} />
                      <Box sx={{ overflow: "hidden" }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: "#ffffff" }}>
                          {selectedFile.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.type || "Video"}
                        </Typography>
                      </Box>
                    </Stack>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadResult(null);
                      }}
                      sx={{ color: APPLE_PALETTE.inkMuted, "&:hover": { color: "#ff453a" } }}
                    >
                      <DeleteIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Stack>
                </Paper>
              )}

              {/* Options */}
              <Grid container spacing={2} sx={{ mt: 1.5, mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="target-lang-label">Ngôn ngữ phụ đề</InputLabel>
                    <Select
                      labelId="target-lang-label"
                      value={targetLang}
                      label="Ngôn ngữ phụ đề"
                      onChange={(e) => setTargetLang(e.target.value)}
                    >
                      <MenuItem value="vi">Tiếng Việt</MenuItem>
                      <MenuItem value="en">English (Tiếng Anh)</MenuItem>
                      <MenuItem value="ja">日本語 (Tiếng Nhật)</MenuItem>
                      <MenuItem value="ko">한국어 (Tiếng Hàn)</MenuItem>
                      <MenuItem value="zh">中文 (Tiếng Trung)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="voice-tone-label">Giai điệu đọc / Phong cách</InputLabel>
                    <Select
                      labelId="voice-tone-label"
                      value={voiceTone}
                      label="Giai điệu đọc / Phong cách"
                      onChange={(e) => setVoiceTone(e.target.value)}
                    >
                      <MenuItem value="viral">Viral TikTok (Giật gân & Nhịp nhanh)</MenuItem>
                      <MenuItem value="storyteller">Kể chuyện truyền cảm (Storytelling)</MenuItem>
                      <MenuItem value="humor">Hài hước hóm hỉnh</MenuItem>
                      <MenuItem value="expert">Chuyên gia học thuật</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Custom Note */}
              <TextField
                fullWidth
                size="small"
                label="Ghi chú thêm cho AI (Tùy chọn)"
                placeholder="VD: Cắt ngắn câu dưới 5 từ, bỏ đoạn ngập ngừng..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                sx={{ mb: 2.5 }}
              />

              {uploadError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
                  {uploadError}
                </Alert>
              )}

              {isUploading && (
                <Box sx={{ mb: 2.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.skyLink, fontWeight: 600 }}>
                      AI đang phân tích video & tạo file .SRT...
                    </Typography>
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                      Vui lòng đợi 15-30s
                    </Typography>
                  </Stack>
                  <LinearProgress sx={{ borderRadius: 4, height: 6, bgcolor: "rgba(0, 113, 227, 0.15)" }} />
                </Box>
              )}

              {/* Start Action */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<SubtitlesIcon />}
                disabled={!selectedFile || isUploading}
                onClick={handleUploadAndAnalyze}
                sx={{
                  py: 1.2,
                  fontWeight: 700,
                  bgcolor: APPLE_PALETTE.actionBlue,
                  transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                  "&:active": { transform: "scale(0.96)" },
                }}
              >
                {isUploading ? "Đang xử lý video..." : "Tải lên & Tự động tạo phụ đề .SRT"}
              </Button>
            </SpotlightCard>
          </Grid>

          {/* Right: SRT Output & Editing Advice */}
          <Grid size={{ xs: 12, md: 6 }}>
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: "#ffffff" }}>
                Kết Quả & Phụ Đề CapCut
              </Typography>

              {!uploadResult ? (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 4,
                    textAlign: "center",
                    bgcolor: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "16px",
                    border: `1px solid ${APPLE_PALETTE.hairline}`,
                  }}
                >
                  <SmartDisplayIcon sx={{ fontSize: 44, color: APPLE_PALETTE.inkMuted, mb: 1.5 }} />
                  <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
                    Sau khi tải video lên, file .SRT khớp từng giây và lời khuyên dựng clip CapCut sẽ hiển thị tại đây.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
                    <Chip
                      label={`Model: ${uploadResult.modelUsed || "Gemini 2.5"}`}
                      size="small"
                      sx={{ bgcolor: "rgba(48, 209, 88, 0.15)", color: APPLE_PALETTE.success, fontWeight: 600 }}
                    />
                    <Chip label="Đã tạo .SRT chuẩn CapCut" size="small" sx={{ bgcolor: APPLE_PALETTE.tile2, color: "#ffffff" }} />
                  </Stack>

                  {/* SRT Preview Content */}
                  <TextField
                    fullWidth
                    multiline
                    rows={10}
                    value={uploadResult.srtContent}
                    slotProps={{ input: { readOnly: true } }}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        bgcolor: "#0a0a0c",
                      },
                    }}
                  />

                  {/* Action Buttons */}
                  <Stack direction="row" spacing={1.5} sx={{ mt: "auto" }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadUploadedSrt}
                      sx={{
                        fontWeight: 700,
                        bgcolor: APPLE_PALETTE.actionBlue,
                        transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                        "&:active": { transform: "scale(0.96)" },
                      }}
                    >
                      Tải file .SRT
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={copiedSrt ? <CheckIcon /> : <ContentCopyIcon />}
                      onClick={handleCopyUploadedSrt}
                      sx={{
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                        transition: "all 0.18s ease",
                        "&:active": { transform: "scale(0.96)" },
                      }}
                    >
                      {copiedSrt ? "Đã sao chép" : "Sao chép"}
                    </Button>
                  </Stack>
                </Box>
              )}
            </SpotlightCard>
          </Grid>
        </Grid>
      )}

      {/* MODE 1: TEXT SCRIPT & TELEPROMPTER */}
      {tabIndex === 1 && (
        <Grid container spacing={3}>
          {/* Left: Script Input & Teleprompter */}
          <Grid size={{ xs: 12, md: 7 }}>
            <SpotlightCard
              spotlightColor="rgba(41, 151, 255, 0.12)"
              hoverBorderColor="rgba(41, 151, 255, 0.35)"
              sx={{ p: 3, borderRadius: "20px", height: "100%" }}
            >
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#ffffff" }}>
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
                  onClick={handleGenerateScriptSrt}
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5, color: "#ffffff" }}>
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
                  onClick={handleDownloadScriptSrt}
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
      )}
    </Box>
  );
};
