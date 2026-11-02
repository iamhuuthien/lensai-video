import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Snackbar,
  Tooltip,
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
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import CodeIcon from "@mui/icons-material/Code";
import ViewTimelineIcon from "@mui/icons-material/ViewTimeline";
import DescriptionIcon from "@mui/icons-material/Description";
import { FreeToolsService } from "../../services/freeTools";
import { ExportService } from "../../services/export";
import { ApiService } from "../../services/api";
import { APPLE_PALETTE } from "../../theme/theme";
import { SpotlightCard } from "../common/SpotlightCard";
import {
  RichContentRenderer,
  InteractiveSrtTimeline,
  parseSrtBlocks,
  stripMarkdownToCleanText,
} from "../common/RichContentRenderer";

export const StudioTab: React.FC = () => {
  // Mode switcher: 0 = Video file import, 1 = Text script teleprompter
  const [tabIndex, setTabIndex] = useState<number>(0);

  // Video Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    analysisPartial?: boolean;
    analysisWarning?: string | null;
  } | null>(null);
  const [resultView, setResultView] = useState<"srt" | "advice">("advice");
  const [srtDisplayMode, setSrtDisplayMode] = useState<"timeline" | "raw">("timeline");
  const [popupNotice, setPopupNotice] = useState<{ message: string; severity: "success" | "warning" } | null>(null);
  const [copiedState, setCopiedState] = useState<"srt" | "advice" | "script_srt" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const teleprompterRef = useRef<HTMLDivElement>(null);

  // Script Teleprompter State
  const [script, setScript] = useState<string>(
    "Chào bạn! Bạn có biết rằng 90% người xem lướt qua video của bạn chỉ vì 3 giây đầu chưa đủ hấp dẫn?\n\nTrong video ngắn này, mình sẽ chỉ ra đúng 3 lỗi sai phổ biến nhất khi đặt hook mở đầu mà ai cũng từng mắc phải.\n\nLỗi thứ nhất: Giới thiệu bản thân quá dài dòng. Khán giả không quan tâm bạn là ai, họ quan tâm nội dung giúp gì cho họ.\n\nLỗi thứ hai: Thiếu yếu tố bất ngờ hoặc xung đột thị giác. Hãy bắt đầu ngay với hành động hoặc một phát biểu gây tò mò.\n\nLỗi thứ ba: Không có lời kêu gọi hành động rõ ràng ở cuối clip.\n\nHãy lưu ngay video này lại và thử áp dụng cho clip tiếp theo của bạn nhé!"
  );
  const [wpm, setWpm] = useState<number>(155);
  const [wordsPerLine, setWordsPerLine] = useState<number>(5);
  const [generatedSrt, setGeneratedSrt] = useState<string>("");
  const [scriptSrtMode, setScriptSrtMode] = useState<"timeline" | "raw">("timeline");
  const [isPrompting, setIsPrompting] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(24);

  const pacing = FreeToolsService.calculatePacing(script);

  // Manage local object URL for instant video preview
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  // Auto-scroll teleprompter when active
  useEffect(() => {
    if (!isPrompting || !teleprompterRef.current) return;
    const pixelsPerTick = Math.max(0.6, (wpm / 150) * 1.1);
    const timer = window.setInterval(() => {
      if (teleprompterRef.current) {
        teleprompterRef.current.scrollTop += pixelsPerTick;
      }
    }, 35);
    return () => window.clearInterval(timer);
  }, [isPrompting, wpm]);

  // Live SRT preview for Mode 1
  const liveScriptSrt = useMemo(() => {
    return generatedSrt || FreeToolsService.generateSrtFromScript(script, wpm, wordsPerLine);
  }, [generatedSrt, script, wpm, wordsPerLine]);

  const uploadedSrtBlocks = useMemo(() => {
    return uploadResult ? parseSrtBlocks(uploadResult.srtContent) : [];
  }, [uploadResult]);

  const handleSeekPreview = (seconds: number) => {
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = Math.max(0, seconds);
      videoPreviewRef.current.play().catch(() => {});
    }
  };

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
    setPopupNotice(null);
    try {
      const res = await ApiService.uploadStudioVideo(selectedFile, targetLang, voiceTone, customNote);
      setUploadResult({
        advice: res.editing_advice,
        srtContent: res.srt_content,
        srtFilename: res.srt_filename,
        modelUsed: res.model_used,
        analysisPartial: Boolean(res.analysis_partial),
        analysisWarning: res.analysis_warning || null,
      });
      // Default to showing the rich Director Playbook so user immediately sees what to fix,
      // while the .SRT file is automatically downloaded to their device!
      setResultView("advice");
      if (res.srt_content) {
        ExportService.downloadFile(res.srt_filename, res.srt_content, "application/x-subrip");
      }
      if (res.analysis_warning) {
        setPopupNotice({
          message: res.analysis_warning,
          severity: "warning",
        });
      } else {
        setPopupNotice({
          message: `Đã tự động tải về file phụ đề ${res.srt_filename} & hoàn tất chẩn đoán Đạo diễn CapCut!`,
          severity: "success",
        });
      }
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

  const handleDownloadCleanAdvice = () => {
    if (!uploadResult) return;
    const cleanText = stripMarkdownToCleanText(uploadResult.advice);
    const baseName = uploadResult.srtFilename.replace(/\.srt$/i, "") || "CapCut_Director_Guide";
    ExportService.downloadFile(`${baseName}__Cam_Nang_Dao_Dien.txt`, cleanText, "text/plain");
  };

  const handleCopyActiveContent = async () => {
    if (!uploadResult) return;
    if (resultView === "srt") {
      const ok = await ExportService.copyToClipboard(uploadResult.srtContent);
      if (ok) {
        setCopiedState("srt");
        setTimeout(() => setCopiedState(null), 2000);
      }
    } else {
      const cleanAdvice = stripMarkdownToCleanText(uploadResult.advice);
      const ok = await ExportService.copyToClipboard(cleanAdvice);
      if (ok) {
        setCopiedState("advice");
        setTimeout(() => setCopiedState(null), 2000);
      }
    }
  };

  const handleGenerateScriptSrt = () => {
    const srt = FreeToolsService.generateSrtFromScript(script, wpm, wordsPerLine);
    setGeneratedSrt(srt);
    setPopupNotice({
      message: "Đã cập nhật phụ đề .SRT theo tốc độ đọc của bạn!",
      severity: "success",
    });
  };

  const handleDownloadScriptSrt = () => {
    ExportService.downloadFile("LensAI_CapCut_Subtitles.srt", liveScriptSrt, "application/x-subrip");
  };

  const handleCopyScriptSrt = async () => {
    const ok = await ExportService.copyToClipboard(liveScriptSrt);
    if (ok) {
      setCopiedState("script_srt");
      setTimeout(() => setCopiedState(null), 2000);
    }
  };

  return (
    <Box sx={{ maxWidth: 1120, mx: "auto", px: { xs: 1.5, sm: 2 }, py: 3 }}>
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
          <Stack direction="row" spacing={1.2} sx={{ alignItems: "center", mb: 0.5, flexWrap: "wrap" }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#ffffff" }}>
              LensAI Creator Studio
            </Typography>
            <Chip
              label="Chuẩn TikTok · Reels · Shorts · CapCut"
              size="small"
              sx={{
                bgcolor: "rgba(41, 151, 255, 0.14)",
                color: APPLE_PALETTE.skyLink,
                border: "1px solid rgba(41, 151, 255, 0.3)",
                fontWeight: 600,
                fontSize: "0.72rem",
              }}
            />
          </Stack>
          <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
            Tải video gốc lên để AI tự động tách âm thanh xuất phụ đề <strong>.SRT chuẩn từng mili-giây</strong>, đồng thời chẩn đoán lỗi giữ chân 3 giây đầu và gợi ý kịch bản cắt nhịp CapCut dễ hiểu nhất.
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
            transition: "color 0.2s ease",
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
          {/* Left: Video Dropzone, Preview Player & Settings */}
          <Grid size={{ xs: 12, md: 5 }}>
            <SpotlightCard
              spotlightColor="rgba(41, 151, 255, 0.12)"
              hoverBorderColor="rgba(41, 151, 255, 0.35)"
              sx={{ p: 3, borderRadius: "20px", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: "#ffffff" }}>
                Import Video Gốc
              </Typography>
              <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 2 }}>
                Hỗ trợ: MP4, MOV, WEBM, MKV (Tối đa: 60MB · Thời lượng tối ưu: 15 giây – 12 phút, tối đa ~15 phút).
              </Typography>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              {/* Drag & Drop Zone or File + Video Preview */}
              {!selectedFile ? (
                <Box
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    p: 4,
                    mb: 2,
                    border: `2px dashed ${APPLE_PALETTE.hairlineStrong}`,
                    borderRadius: "16px",
                    bgcolor: "rgba(255, 255, 255, 0.02)",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                    "&:hover": {
                      borderColor: APPLE_PALETTE.actionBlue,
                      bgcolor: "rgba(0, 113, 227, 0.06)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 48, color: APPLE_PALETTE.skyLink, mb: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#ffffff" }}>
                    Kéo thả file video vào đây hoặc bấm để chọn
                  </Typography>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, mt: 0.5, display: "block" }}>
                    AI sẽ tự động tách lời thoại xuất .SRT và chỉ ra các điểm cần sửa trong video
                  </Typography>
                </Box>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.75,
                    mb: 2,
                    borderRadius: "16px",
                    bgcolor: APPLE_PALETTE.tile2,
                    border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: previewUrl ? 1.5 : 0 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", overflow: "hidden" }}>
                      <VideoFileIcon sx={{ fontSize: 30, color: APPLE_PALETTE.skyLink, flexShrink: 0 }} />
                      <Box sx={{ overflow: "hidden" }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: "#ffffff" }}>
                          {selectedFile.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.type || "video/mp4"}
                        </Typography>
                      </Box>
                    </Stack>
                    <Tooltip title="Chọn video khác">
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
                    </Tooltip>
                  </Stack>

                  {/* Interactive Video Preview Player */}
                  {previewUrl && (
                    <Box
                      sx={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        bgcolor: "#000000",
                        border: `1px solid ${APPLE_PALETTE.hairline}`,
                      }}
                    >
                      <video
                        ref={videoPreviewRef}
                        src={previewUrl}
                        controls
                        preload="metadata"
                        style={{
                          width: "100%",
                          maxHeight: 220,
                          display: "block",
                          objectFit: "contain",
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              )}

              {/* Options */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
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
                    <InputLabel id="voice-tone-label">Phong cách dựng</InputLabel>
                    <Select
                      labelId="voice-tone-label"
                      value={voiceTone}
                      label="Phong cách dựng"
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
                placeholder="VD: Cắt ngắn câu dưới 6 từ, nhấn mạnh từ khóa công nghệ..."
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
                <Box
                  sx={{
                    mb: 2.5,
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: "rgba(0, 113, 227, 0.08)",
                    border: "1px solid rgba(41, 151, 255, 0.22)",
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.8 }}>
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.skyLink, fontWeight: 700 }}>
                      Đang tách âm thanh 16kHz & tạo phụ đề .SRT chuẩn...
                    </Typography>
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                      ~15-35s
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
                  mt: "auto",
                  py: 1.3,
                  fontWeight: 700,
                  bgcolor: APPLE_PALETTE.actionBlue,
                  boxShadow: "0 4px 18px rgba(0, 113, 227, 0.35)",
                  transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                  "&:active": { transform: "scale(0.96)" },
                }}
              >
                {isUploading ? "Đang xử lý video & xuất .SRT..." : "Tải lên & Tự động tạo phụ đề .SRT"}
              </Button>
            </SpotlightCard>
          </Grid>

          {/* Right: Structured Director Playbook & Interactive SRT Timeline */}
          <Grid size={{ xs: 12, md: 7 }}>
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
              {/* Header Bar */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 2 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff" }}>
                  Kết Quả & Đạo Diễn CapCut
                </Typography>

                {uploadResult && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Chip
                      label={`Model: ${uploadResult.modelUsed || "Gemini Flash"}`}
                      size="small"
                      sx={{
                        bgcolor: "rgba(48, 209, 88, 0.14)",
                        color: APPLE_PALETTE.success,
                        border: "1px solid rgba(48, 209, 88, 0.3)",
                        fontWeight: 600,
                        fontSize: "0.73rem",
                      }}
                    />
                    {uploadedSrtBlocks.length > 0 && (
                      <Chip
                        label={`${uploadedSrtBlocks.length} câu phụ đề`}
                        size="small"
                        sx={{
                          bgcolor: APPLE_PALETTE.tile2,
                          color: APPLE_PALETTE.skyLink,
                          fontWeight: 600,
                          fontSize: "0.73rem",
                        }}
                      />
                    )}
                  </Stack>
                )}
              </Stack>

              {!uploadResult ? (
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 340,
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
                  <SmartDisplayIcon sx={{ fontSize: 48, color: APPLE_PALETTE.inkMuted, mb: 1.5, opacity: 0.7 }} />
                  <Typography variant="subtitle2" sx={{ color: "#ffffff", fontWeight: 600, mb: 0.5 }}>
                    Sẵn sàng phân tích & xuất phụ đề .SRT
                  </Typography>
                  <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted, maxWidth: 420 }}>
                    Sau khi tải video lên, file <strong>.SRT chuẩn CapCut</strong> sẽ tự động tải về máy, kèm bảng <strong>Chẩn đoán lỗi 3s đầu & Kịch bản cắt nhịp Đạo diễn</strong> dễ hiểu ngay tại đây.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Apple Cinema Segmented Control */}
                  <Box
                    sx={{
                      p: 0.5,
                      mb: 2,
                      borderRadius: "14px",
                      bgcolor: "#0d0d10",
                      border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 0.5,
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={<TipsAndUpdatesIcon sx={{ fontSize: 17 }} />}
                      onClick={() => setResultView("advice")}
                      sx={{
                        py: 0.9,
                        borderRadius: "10px",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        bgcolor: resultView === "advice" ? APPLE_PALETTE.actionBlue : "transparent",
                        color: resultView === "advice" ? "#ffffff" : APPLE_PALETTE.inkMuted,
                        "&:hover": {
                          bgcolor: resultView === "advice" ? APPLE_PALETTE.actionBlueHover : "rgba(255,255,255,0.04)",
                          color: "#ffffff",
                        },
                      }}
                    >
                      {uploadResult.analysisPartial ? "Mẹo dựng nhanh" : "Gợi ý Đạo diễn CapCut"}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<SubtitlesIcon sx={{ fontSize: 17 }} />}
                      onClick={() => setResultView("srt")}
                      sx={{
                        py: 0.9,
                        borderRadius: "10px",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        bgcolor: resultView === "srt" ? APPLE_PALETTE.actionBlue : "transparent",
                        color: resultView === "srt" ? "#ffffff" : APPLE_PALETTE.inkMuted,
                        "&:hover": {
                          bgcolor: resultView === "srt" ? APPLE_PALETTE.actionBlueHover : "rgba(255,255,255,0.04)",
                          color: "#ffffff",
                        },
                      }}
                    >
                      Phụ đề .SRT ({uploadedSrtBlocks.length || "Chuẩn"})
                    </Button>
                  </Box>

                  {uploadResult.analysisWarning && (
                    <Alert severity="warning" sx={{ mb: 1.5, borderRadius: "12px", fontSize: "0.8rem" }}>
                      {uploadResult.analysisWarning}
                    </Alert>
                  )}

                  {/* Sub-toolbar when viewing .SRT */}
                  {resultView === "srt" && (
                    <Stack
                      direction="row"
                       sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.2, px: 0.5 }}
                    >
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                        💡 Bấm vào mốc thời gian để tua nhanh video xem trước bên trái
                      </Typography>
                      <Stack direction="row" spacing={0.8}>
                        <Chip
                          icon={<ViewTimelineIcon sx={{ fontSize: "14px !important" }} />}
                          label="Dòng thời gian"
                          size="small"
                          onClick={() => setSrtDisplayMode("timeline")}
                          sx={{
                            height: 24,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            bgcolor: srtDisplayMode === "timeline" ? "rgba(41, 151, 255, 0.2)" : APPLE_PALETTE.tile2,
                            color: srtDisplayMode === "timeline" ? APPLE_PALETTE.skyLink : APPLE_PALETTE.inkMuted,
                            border: `1px solid ${
                              srtDisplayMode === "timeline" ? "rgba(41, 151, 255, 0.4)" : APPLE_PALETTE.hairline
                            }`,
                          }}
                        />
                        <Chip
                          icon={<CodeIcon sx={{ fontSize: "14px !important" }} />}
                          label="Mã .SRT gốc"
                          size="small"
                          onClick={() => setSrtDisplayMode("raw")}
                          sx={{
                            height: 24,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            bgcolor: srtDisplayMode === "raw" ? "rgba(41, 151, 255, 0.2)" : APPLE_PALETTE.tile2,
                            color: srtDisplayMode === "raw" ? APPLE_PALETTE.skyLink : APPLE_PALETTE.inkMuted,
                            border: `1px solid ${
                              srtDisplayMode === "raw" ? "rgba(41, 151, 255, 0.4)" : APPLE_PALETTE.hairline
                            }`,
                          }}
                        />
                      </Stack>
                    </Stack>
                  )}

                  {/* Main Scrollable Content Area */}
                  <Box
                    sx={{
                      flex: 1,
                      maxHeight: 440,
                      minHeight: 300,
                      overflowY: "auto",
                      p: 2,
                      mb: 2,
                      borderRadius: "16px",
                      bgcolor: "#0b0b0e",
                      border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
                    }}
                  >
                    {resultView === "advice" ? (
                      <RichContentRenderer content={uploadResult.advice} onSeek={handleSeekPreview} />
                    ) : srtDisplayMode === "timeline" ? (
                      <InteractiveSrtTimeline srtContent={uploadResult.srtContent} onSeek={handleSeekPreview} />
                    ) : (
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          color: "#d2d2d7",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          lineHeight: 1.55,
                        }}
                      >
                        {uploadResult.srtContent}
                      </Box>
                    )}
                  </Box>

                  {/* Action Buttons */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: "auto" }}>
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
                      Tải file .SRT chuẩn CapCut
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={
                        copiedState === resultView ? (
                          <CheckIcon sx={{ color: APPLE_PALETTE.success }} />
                        ) : (
                          <ContentCopyIcon />
                        )
                      }
                      onClick={handleCopyActiveContent}
                      sx={{
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                        minWidth: 165,
                        color: copiedState === resultView ? APPLE_PALETTE.success : "#ffffff",
                        borderColor: copiedState === resultView ? APPLE_PALETTE.success : APPLE_PALETTE.hairlineStrong,
                        transition: "all 0.18s ease",
                        "&:active": { transform: "scale(0.96)" },
                      }}
                    >
                      {copiedState === resultView
                        ? "Đã sao chép!"
                        : resultView === "srt"
                        ? "Sao chép .SRT"
                        : "Chép Gợi ý (Sạch)"}
                    </Button>

                    {resultView === "advice" && (
                      <Tooltip title="Tải bản hướng dẫn dựng phim (.txt) không chứa ký tự Markdown">
                        <Button
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                          onClick={handleDownloadCleanAdvice}
                          sx={{
                            whiteSpace: "nowrap",
                            fontWeight: 600,
                            borderColor: APPLE_PALETTE.hairlineStrong,
                            color: APPLE_PALETTE.skyLink,
                          }}
                        >
                          Tải Cẩm Nang (.txt)
                        </Button>
                      </Tooltip>
                    )}
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
          <Grid size={{ xs: 12, md: 6 }}>
            <SpotlightCard
              spotlightColor="rgba(41, 151, 255, 0.12)"
              hoverBorderColor="rgba(41, 151, 255, 0.35)"
              sx={{ p: 3, borderRadius: "20px", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff" }}>
                  Kịch bản & Máy nhắc chữ
                </Typography>
                <Chip
                  label={`${pacing.wordCount} từ · ~${pacing.standardSeconds}s`}
                  size="small"
                  sx={{ bgcolor: APPLE_PALETTE.tile2, color: APPLE_PALETTE.skyLink, fontWeight: 600 }}
                />
              </Stack>

              {isPrompting ? (
                <Box
                  ref={teleprompterRef}
                  sx={{
                    mb: 2.5,
                    p: 3,
                    height: 320,
                    overflowY: "auto",
                    borderRadius: "16px",
                    bgcolor: "#050507",
                    border: `2px solid ${APPLE_PALETTE.actionBlue}`,
                    boxShadow: "0 0 28px rgba(0, 113, 227, 0.25)",
                  }}
                >
                  <Chip
                    label={`Đang cuộn tự động (${wpm} WPM) — Đọc theo chữ sáng`}
                    size="small"
                    sx={{ mb: 2, bgcolor: "rgba(48, 209, 88, 0.16)", color: APPLE_PALETTE.success, fontWeight: 700 }}
                  />
                  <Typography
                    sx={{
                      fontSize: `${fontSize}px`,
                      lineHeight: 1.75,
                      fontWeight: 600,
                      color: "#ffffff",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {script}
                  </Typography>
                </Box>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={9}
                  value={script}
                  onChange={(e) => {
                    setScript(e.target.value);
                    setGeneratedSrt("");
                  }}
                  placeholder="Nhập hoặc dán kịch bản video của bạn tại đây..."
                  sx={{
                    mb: 2.5,
                    "& .MuiOutlinedInput-root": {
                      fontSize: `${Math.min(fontSize, 22)}px`,
                      lineHeight: 1.6,
                    },
                  }}
                />
              )}

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

              {/* Sliders */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
                    Tốc độ đọc: <strong style={{ color: APPLE_PALETTE.skyLink }}>{wpm} WPM</strong>
                  </Typography>
                  <Slider
                    value={wpm}
                    min={110}
                    max={220}
                    step={5}
                    size="small"
                    onChange={(_, val) => setWpm(val as number)}
                    sx={{ color: APPLE_PALETTE.actionBlue }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
                    Số từ / dòng: <strong style={{ color: APPLE_PALETTE.skyLink }}>{wordsPerLine} từ</strong>
                  </Typography>
                  <Slider
                    value={wordsPerLine}
                    min={2}
                    max={8}
                    step={1}
                    size="small"
                    onChange={(_, val) => setWordsPerLine(val as number)}
                    sx={{ color: APPLE_PALETTE.actionBlue }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
                    Cỡ chữ nhắc: <strong style={{ color: APPLE_PALETTE.skyLink }}>{fontSize}px</strong>
                  </Typography>
                  <Slider
                    value={fontSize}
                    min={16}
                    max={36}
                    step={2}
                    size="small"
                    onChange={(_, val) => setFontSize(val as number)}
                    sx={{ color: APPLE_PALETTE.actionBlue }}
                  />
                </Grid>
              </Grid>

              {/* Actions */}
              <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap", mt: "auto" }}>
                <Button
                  variant="contained"
                  startIcon={<SubtitlesIcon />}
                  onClick={handleGenerateScriptSrt}
                  sx={{
                    fontWeight: 700,
                    transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    "&:active": { transform: "scale(0.96)" },
                  }}
                >
                  Cập nhật phụ đề .SRT
                </Button>

                <Button
                  variant={isPrompting ? "contained" : "outlined"}
                  color={isPrompting ? "warning" : "primary"}
                  startIcon={isPrompting ? <PauseIcon /> : <PlayArrowIcon />}
                  onClick={() => setIsPrompting(!isPrompting)}
                  sx={{
                    fontWeight: 600,
                    transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    "&:active": { transform: "scale(0.96)" },
                  }}
                >
                  {isPrompting ? "Dừng máy nhắc chữ" : "Bật máy nhắc chữ tự cuộn"}
                </Button>
              </Stack>
            </SpotlightCard>
          </Grid>

          {/* Right: Live SRT Preview & Export */}
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
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff" }}>
                  Xem trước Phụ đề .SRT ({parseSrtBlocks(liveScriptSrt).length} câu)
                </Typography>

                <Stack direction="row" spacing={0.8}>
                  <Chip
                    icon={<ViewTimelineIcon sx={{ fontSize: "14px !important" }} />}
                    label="Dòng thời gian"
                    size="small"
                    onClick={() => setScriptSrtMode("timeline")}
                    sx={{
                      height: 24,
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      bgcolor: scriptSrtMode === "timeline" ? "rgba(41, 151, 255, 0.2)" : APPLE_PALETTE.tile2,
                      color: scriptSrtMode === "timeline" ? APPLE_PALETTE.skyLink : APPLE_PALETTE.inkMuted,
                    }}
                  />
                  <Chip
                    icon={<CodeIcon sx={{ fontSize: "14px !important" }} />}
                    label="Mã .SRT"
                    size="small"
                    onClick={() => setScriptSrtMode("raw")}
                    sx={{
                      height: 24,
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      bgcolor: scriptSrtMode === "raw" ? "rgba(41, 151, 255, 0.2)" : APPLE_PALETTE.tile2,
                      color: scriptSrtMode === "raw" ? APPLE_PALETTE.skyLink : APPLE_PALETTE.inkMuted,
                    }}
                  />
                </Stack>
              </Stack>

              <Box
                sx={{
                  flex: 1,
                  maxHeight: 410,
                  minHeight: 300,
                  overflowY: "auto",
                  p: 2,
                  mb: 2,
                  borderRadius: "16px",
                  bgcolor: "#0b0b0e",
                  border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
                }}
              >
                {scriptSrtMode === "timeline" ? (
                  <InteractiveSrtTimeline srtContent={liveScriptSrt} />
                ) : (
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      color: "#d2d2d7",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.55,
                    }}
                  >
                    {liveScriptSrt}
                  </Box>
                )}
              </Box>

              {/* Download & Copy SRT Buttons */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: "auto" }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadScriptSrt}
                  sx={{
                    py: 1.2,
                    fontWeight: 700,
                    bgcolor: APPLE_PALETTE.actionBlue,
                    transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    "&:active": { transform: "scale(0.96)" },
                  }}
                >
                  Tải file .SRT cho CapCut
                </Button>
                <Button
                  variant="outlined"
                  startIcon={copiedState === "script_srt" ? <CheckIcon sx={{ color: APPLE_PALETTE.success }} /> : <ContentCopyIcon />}
                  onClick={handleCopyScriptSrt}
                  sx={{
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                    minWidth: 150,
                    color: copiedState === "script_srt" ? APPLE_PALETTE.success : "#ffffff",
                  }}
                >
                  {copiedState === "script_srt" ? "Đã sao chép!" : "Sao chép .SRT"}
                </Button>
              </Stack>
            </SpotlightCard>
          </Grid>
        </Grid>
      )}

      <Snackbar
        open={Boolean(popupNotice)}
        autoHideDuration={7000}
        onClose={() => setPopupNotice(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setPopupNotice(null)}
          severity={popupNotice?.severity || "info"}
          variant="filled"
          sx={{ width: "100%", borderRadius: "12px", fontWeight: 600 }}
        >
          {popupNotice?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
