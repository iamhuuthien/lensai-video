import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  IconButton,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import KeyIcon from "@mui/icons-material/Key";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import MemoryIcon from "@mui/icons-material/Memory";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { StorageService } from "../../services/storage";
import { ExportService } from "../../services/export";
import { ApiService } from "../../services/api";
import { APPLE_PALETTE } from "../../theme/theme";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [hasServerKey, setHasServerKey] = useState<boolean | null>(null);
  const [copiedDevId, setCopiedDevId] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setApiKey(StorageService.getApiKey());
      setDeviceId(StorageService.getDeviceId());
      setSelectedModel(StorageService.getSelectedModel());
      setSaved(false);

      // Check server health
      ApiService.checkHealth()
        .then((h) => setHasServerKey(Boolean(h.has_server_api_key)))
        .catch(() => setHasServerKey(false));
    }
  }, [open]);

  const handleSave = () => {
    StorageService.setApiKey(apiKey);
    StorageService.setSelectedModel(selectedModel);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleCopyDevId = async () => {
    const ok = await ExportService.copyToClipboard(deviceId);
    if (ok) {
      setCopiedDevId(true);
      setTimeout(() => setCopiedDevId(false), 2000);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#111113",
          border: `1.5px solid ${APPLE_PALETTE.hairlineStrong}`,
          borderRadius: "24px",
          boxShadow: "0 28px 72px rgba(0, 0, 0, 0.95)",
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${APPLE_PALETTE.hairline}`,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff" }}>
          Cấu hình Hệ thống & AI Model
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: APPLE_PALETTE.inkMuted }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, pt: 2.5 }}>
        {/* Server API Key Health Notice */}
        {hasServerKey === false && (
          <Alert
            severity="warning"
            icon={<WarningAmberIcon sx={{ color: "#ffd60a" }} />}
            sx={{
              mb: 2.5,
              backgroundColor: "rgba(255, 214, 10, 0.08)",
              color: "#fff3bf",
              border: "1px solid rgba(255, 214, 10, 0.25)",
              borderRadius: "14px",
              "& .MuiAlert-message": { fontSize: "0.8125rem", lineHeight: 1.4 },
            }}
          >
            <strong>Máy chủ dùng chung chưa gắn GEMINI_API_KEY:</strong> Vui lòng nhập Gemini API Key cá nhân miễn phí của bạn từ{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#ffd60a", fontWeight: 700, textDecoration: "underline" }}
            >
              Google AI Studio
            </a>{" "}
            vào ô bên dưới để bắt đầu phân tích video ngay!
          </Alert>
        )}

        {/* AI Model Selector */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.8 }}>
            <MemoryIcon sx={{ fontSize: 18, color: APPLE_PALETTE.skyLink }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#ffffff" }}>
              Lựa chọn Mô hình AI (Gemini Multimodal Model)
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 1.5 }}>
            Hệ thống tự động tối ưu Flash cho người dùng Free và Pro cho gói VIP. Bạn có thể tự chọn model ưa thích bên dưới:
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel id="model-select-label">Mô hình AI ưu tiên</InputLabel>
            <Select
              labelId="model-select-label"
              value={selectedModel}
              label="Mô hình AI ưu tiên"
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <MenuItem value="">
                <em>Tự động (Khuyên dùng: Flash cho Free, Pro cho VIP)</em>
              </MenuItem>
              <MenuItem value="gemini-2.5-flash">⚡ Gemini 2.5 Flash (Phản hồi siêu tốc & tối ưu hạn ngạch)</MenuItem>
              <MenuItem value="gemini-2.5-pro">🧠 Gemini 2.5 Pro (Tư duy sâu & Thị giác đa tầng cao cấp)</MenuItem>
              <MenuItem value="gemini-2.0-flash">⚡ Gemini 2.0 Flash (Bản thế hệ 2 tốc độ cao dự phòng)</MenuItem>
              <MenuItem value="gemini-1.5-pro">🧠 Gemini 1.5 Pro (Ngữ cảnh siêu dài 2M token)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Personal Gemini API Key */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.8 }}>
            <KeyIcon sx={{ fontSize: 18, color: APPLE_PALETTE.skyLink }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#ffffff" }}>
              Gemini API Key cá nhân (Tùy chọn)
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 1.5 }}>
            Nếu bạn nhập API Key riêng từ Google AI Studio, tất cả các lần phân tích sẽ sử dụng hạn ngạch riêng không phụ thuộc vào máy chủ.
          </Typography>
          <TextField
            fullWidth
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            size="small"
          />
        </Box>

        {/* Device ID */}
        <Box sx={{ mb: 2.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.8 }}>
            <PhoneAndroidIcon sx={{ fontSize: 18, color: APPLE_PALETTE.skyLink }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#ffffff" }}>
              Mã định danh thiết bị (Device ID)
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 1.5 }}>
            Mã định danh duy nhất của trình duyệt để lưu trữ hạn ngạch dùng thử và nhận diện quyền VIP khi quét mã VietQR.
          </Typography>

          <TextField
            fullWidth
            value={deviceId}
            disabled
            size="small"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleCopyDevId}>
                      {copiedDevId ? <CheckIcon sx={{ fontSize: 18, color: APPLE_PALETTE.success }} /> : <ContentCopyIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {/* Version info */}
        <Box sx={{ pt: 2, borderTop: `1px solid ${APPLE_PALETTE.hairline}` }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
              Phiên bản: LensAI 4.0.0 (MVC Architecture & Real Gemini Engine)
            </Typography>
            <Chip
              icon={<CloudDoneIcon sx={{ fontSize: "13px !important" }} />}
              label="Sẵn sàng"
              size="small"
              sx={{ bgcolor: "rgba(48, 209, 88, 0.15)", color: APPLE_PALETTE.success, fontSize: "0.6875rem", height: 22 }}
            />
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1, borderTop: `1px solid ${APPLE_PALETTE.hairline}` }}>
        <Button onClick={onClose} sx={{ color: APPLE_PALETTE.inkMuted }}>
          Đóng
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            fontWeight: 700,
            bgcolor: saved ? APPLE_PALETTE.success : APPLE_PALETTE.actionBlue,
            transition: "all 0.18s ease",
            "&:hover": { bgcolor: saved ? APPLE_PALETTE.success : APPLE_PALETTE.actionBlueHover },
            "&:active": { transform: "scale(0.96)" },
          }}
        >
          {saved ? "Đã lưu cài đặt" : "Lưu cài đặt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
