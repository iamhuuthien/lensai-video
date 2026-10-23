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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import KeyIcon from "@mui/icons-material/Key";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { StorageService } from "../../services/storage";
import { ExportService } from "../../services/export";
import { APPLE_PALETTE } from "../../theme/theme";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [copiedDevId, setCopiedDevId] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setApiKey(StorageService.getApiKey());
      setDeviceId(StorageService.getDeviceId());
      setSaved(false);
    }
  }, [open]);

  const handleSave = () => {
    StorageService.setApiKey(apiKey);
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Cấu hình hệ thống & API
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: APPLE_PALETTE.inkMuted }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        {/* Gemini API Key */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
            <KeyIcon sx={{ fontSize: 18, color: APPLE_PALETTE.skyLink }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Gemini API Key cá nhân (Tùy chọn)
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 1.5 }}>
            Nếu bạn có Gemini API Key riêng từ Google AI Studio, bạn có thể nhập vào đây để sử dụng không giới hạn hạn ngạch riêng của bạn.
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
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
            <PhoneAndroidIcon sx={{ fontSize: 18, color: APPLE_PALETTE.skyLink }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Mã định danh thiết bị (Device ID)
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 1.5 }}>
            Mã này gắn liền với phiên làm việc của bạn để lưu lịch sử và kích hoạt quyền VIP khi chuyển khoản.
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
              Phiên bản: LensAI 4.0.0 (MVC Clean Architecture)
            </Typography>
            <Chip label="Sẵn sàng" size="small" sx={{ bgcolor: "rgba(48, 209, 88, 0.15)", color: APPLE_PALETTE.success, fontSize: "0.6875rem" }} />
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} sx={{ color: APPLE_PALETTE.inkMuted }}>
          Đóng
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            bgcolor: saved ? APPLE_PALETTE.success : APPLE_PALETTE.actionBlue,
            "&:hover": { bgcolor: saved ? APPLE_PALETTE.success : APPLE_PALETTE.actionBlueHover },
          }}
        >
          {saved ? "Đã lưu thành công" : "Lưu cài đặt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
