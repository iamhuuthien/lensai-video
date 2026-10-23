import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  IconButton,
  Chip,
  Paper,
  CircularProgress,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import TimerIcon from "@mui/icons-material/Timer";
import SyncIcon from "@mui/icons-material/Sync";
import type { Order } from "../../models/types";
import { ExportService } from "../../services/export";
import { APPLE_PALETTE } from "../../theme/theme";

interface VietQrModalProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onManualCheck: () => void;
}

export const VietQrModal: React.FC<VietQrModalProps> = ({ open, order, onClose, onManualCheck }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(600); // 10 minutes countdown

  useEffect(() => {
    if (!open) {
      setSecondsLeft(600);
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [open]);

  if (!order) return null;

  const handleCopy = async (text: string, fieldName: string) => {
    const ok = await ExportService.copyToClipboard(text);
    if (ok) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerDisplay = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#111113",
          border: `1.5px solid ${APPLE_PALETTE.hairlineStrong}`,
          borderRadius: "24px",
          boxShadow: "0 28px 72px rgba(0, 0, 0, 0.95)",
          maxHeight: "92vh",
          overflowY: "auto",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: { xs: 2, sm: 2.5 },
          pb: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${APPLE_PALETTE.hairline}`,
        }}
      >
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
            <QrCode2Icon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffffff", fontSize: "1.05rem" }}>
              Thanh toán VietQR Kích Hoạt Tự Động
            </Typography>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
              Đơn hàng: #{order.order_code} · Tự động kích hoạt sau khi nhận tiền
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: APPLE_PALETTE.inkMuted }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      {/* 2-Column Content: Left QR + Timer | Right Details & Actions */}
      <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, pt: { xs: 2, sm: 2 } }}>
        <Grid container spacing={2.5} sx={{ alignItems: "stretch" }}>
          {/* Left Column: QR Code Box + Timer */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                bgcolor: APPLE_PALETTE.tile1,
                border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
                borderRadius: "20px",
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* High-Contrast QR Code */}
              <Box
                sx={{
                  bgcolor: "#ffffff",
                  p: 1.5,
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                  width: "100%",
                  maxWidth: 220,
                  aspectRatio: "1/1",
                }}
              >
                <Box
                  component="img"
                  src={order.qr_url}
                  alt="Mã VietQR thanh toán"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: "#d5d5dc", mt: 1.5, textAlign: "center", fontWeight: 500 }}>
                Quét bằng ứng dụng Ngân hàng bất kỳ hoặc MoMo
              </Typography>

              {/* Timer & Listening Status */}
              <Stack spacing={1} sx={{ width: "100%", mt: 1.5 }}>
                <Chip
                  icon={<TimerIcon sx={{ fontSize: "14px !important" }} />}
                  label={`Hết hạn sau: ${timerDisplay}`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255, 214, 10, 0.12)",
                    color: "#ffd60a",
                    border: "1px solid rgba(255, 214, 10, 0.25)",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    height: 24,
                  }}
                />
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center" }}>
                  <CircularProgress size={12} sx={{ color: APPLE_PALETTE.success }} />
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.success, fontWeight: 500, fontSize: "0.75rem" }}>
                    Đang lắng nghe giao dịch...
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Grid>

          {/* Right Column: Bank Details & Action */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: APPLE_PALETTE.tile1,
                border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
                borderRadius: "20px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#ffffff", fontSize: "0.875rem" }}>
                Thông tin chuyển khoản chính xác:
              </Typography>

              <Stack spacing={1.2}>
                {/* Bank */}
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                    Ngân hàng:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#ffffff" }}>
                    {order.bank_id} (Ngân hàng Quân Đội)
                  </Typography>
                </Stack>

                {/* Account Number */}
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                    Số tài khoản:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: "0.04em", color: APPLE_PALETTE.skyLink }}>
                      {order.account_no}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(order.account_no, "account_no")}
                      sx={{
                        p: 0.5,
                        color: copiedField === "account_no" ? APPLE_PALETTE.success : APPLE_PALETTE.inkMuted,
                      }}
                    >
                      {copiedField === "account_no" ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </Stack>
                </Stack>

                {/* Account Name */}
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                    Chủ tài khoản:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#ffffff" }}>
                    {order.account_name}
                  </Typography>
                </Stack>

                {/* Amount */}
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                    Số tiền cần chuyển:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffd60a", fontSize: "1.15rem" }}>
                      {ExportService.formatVnd(order.amount)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(String(order.amount), "amount")}
                      sx={{
                        p: 0.5,
                        color: copiedField === "amount" ? APPLE_PALETTE.success : APPLE_PALETTE.inkMuted,
                      }}
                    >
                      {copiedField === "amount" ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </Stack>
                </Stack>

                {/* Memo Box */}
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "rgba(0, 113, 227, 0.1)",
                    border: "1px dashed rgba(41, 151, 255, 0.4)",
                    borderRadius: "12px",
                  }}
                >
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", fontSize: "0.72rem" }}>
                    Nội dung chuyển khoản (bắt buộc đúng để tự kích hoạt):
                  </Typography>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: "#ffffff", letterSpacing: "0.05em" }}>
                      {order.memo}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={copiedField === "memo" ? <CheckIcon sx={{ fontSize: 13 }} /> : <ContentCopyIcon sx={{ fontSize: 13 }} />}
                      onClick={() => handleCopy(order.memo, "memo")}
                      sx={{
                        py: 0.3,
                        px: 1,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: copiedField === "memo" ? APPLE_PALETTE.success : APPLE_PALETTE.skyLink,
                        borderColor: copiedField === "memo" ? APPLE_PALETTE.success : APPLE_PALETTE.skyLink,
                      }}
                    >
                      {copiedField === "memo" ? "Đã chép" : "Sao chép"}
                    </Button>
                  </Stack>
                </Box>
              </Stack>

              {/* Assurance note */}
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1.5, mb: 1 }}>
                <VerifiedUserIcon sx={{ fontSize: 16, color: APPLE_PALETTE.success }} />
                <Typography variant="caption" sx={{ color: "#a1a1a6", fontSize: "0.72rem", lineHeight: 1.3 }}>
                  Kích hoạt tự động sau 30-60 giây. Nếu cần hỗ trợ, liên hệ admin Zalo/Telegram.
                </Typography>
              </Stack>

              {/* Main Check Action */}
              <Button
                fullWidth
                variant="contained"
                size="medium"
                startIcon={<SyncIcon />}
                onClick={onManualCheck}
                sx={{
                  py: 1,
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  bgcolor: APPLE_PALETTE.actionBlue,
                  boxShadow: "0 4px 16px rgba(0, 113, 227, 0.4)",
                  transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                  "&:hover": { bgcolor: APPLE_PALETTE.actionBlueHover },
                  "&:active": { transform: "scale(0.96)" },
                }}
              >
                Tôi đã chuyển khoản - Kiểm tra ngay
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0.5, borderTop: `1px solid ${APPLE_PALETTE.hairline}` }}>
        <Button onClick={onClose} size="small" sx={{ color: APPLE_PALETTE.inkMuted }}>
          Đóng cửa sổ
        </Button>
      </DialogActions>
    </Dialog>
  );
};
