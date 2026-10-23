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
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import VerifiedIcon from "@mui/icons-material/Verified";
import TimerIcon from "@mui/icons-material/Timer";
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
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#141416",
          border: `1.5px solid ${APPLE_PALETTE.hairlineStrong}`,
          borderRadius: "24px",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.9)",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 3,
          pb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${APPLE_PALETTE.hairline}`,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              p: 1,
              borderRadius: "12px",
              bgcolor: "rgba(0, 113, 227, 0.15)",
              color: APPLE_PALETTE.skyLink,
              display: "flex",
            }}
          >
            <QrCode2Icon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Quét mã VietQR chuyển khoản
            </Typography>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
              Đơn hàng: #{order.order_code} · Kích hoạt VIP tự động
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: APPLE_PALETTE.inkMuted }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 3 }}>
        {/* Countdown Timer */}
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
          <Chip
            icon={<TimerIcon sx={{ fontSize: 16 }} />}
            label={`Mã QR hết hạn sau: ${timerDisplay}`}
            size="small"
            sx={{
              bgcolor: "rgba(255, 214, 10, 0.12)",
              color: "#ffd60a",
              border: "1px solid rgba(255, 214, 10, 0.25)",
              fontWeight: 600,
            }}
          />
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <CircularProgress size={14} sx={{ color: APPLE_PALETTE.success }} />
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.success, fontWeight: 500 }}>
              Đang lắng nghe chuyển khoản...
            </Typography>
          </Stack>
        </Stack>

        {/* QR Code Container - Big and High-Contrast */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            mb: 3,
            bgcolor: "#ffffff",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Box
            component="img"
            src={order.qr_url}
            alt="Mã VietQR thanh toán"
            sx={{
              width: { xs: 240, sm: 280 },
              height: { xs: 240, sm: 280 },
              objectFit: "contain",
              display: "block",
            }}
          />
          <Typography variant="caption" sx={{ color: "#333333", mt: 1.5, fontWeight: 600 }}>
            Mở App ngân hàng bất kỳ (MB, Vietcombank, Techcombank, ...) và quét mã trên
          </Typography>
        </Box>

        {/* Clear Details Table */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            bgcolor: APPLE_PALETTE.tile1,
            border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
            borderRadius: "18px",
            mb: 2.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#ffffff" }}>
            Thông tin chuyển khoản chính xác:
          </Typography>

          <Stack spacing={1.5}>
            {/* Bank */}
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
                Ngân hàng:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#ffffff" }}>
                {order.bank_id} (Ngân hàng TMCP Quân Đội)
              </Typography>
            </Stack>

            {/* Account Number with Copy */}
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
                Số tài khoản:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: "0.03em", color: APPLE_PALETTE.skyLink }}>
                  {order.account_no}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(order.account_no, "account_no")}
                  sx={{ color: copiedField === "account_no" ? APPLE_PALETTE.success : APPLE_PALETTE.inkMuted }}
                >
                  {copiedField === "account_no" ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Stack>
            </Stack>

            {/* Account Name */}
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
                Chủ tài khoản:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#ffffff" }}>
                {order.account_name}
              </Typography>
            </Stack>

            {/* Amount */}
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
                Số tiền:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffd60a" }}>
                  {ExportService.formatVnd(order.amount)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(String(order.amount), "amount")}
                  sx={{ color: copiedField === "amount" ? APPLE_PALETTE.success : APPLE_PALETTE.inkMuted }}
                >
                  {copiedField === "amount" ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Stack>
            </Stack>

            {/* Transfer Memo - Highlighted */}
            <Box
              sx={{
                p: 1.5,
                mt: 1,
                bgcolor: "rgba(0, 113, 227, 0.12)",
                border: "1px dashed rgba(0, 113, 227, 0.4)",
                borderRadius: "12px",
              }}
            >
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
                    Nội dung chuyển khoản (bắt buộc đúng để tự kích hoạt):
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "#ffffff", letterSpacing: "0.04em" }}>
                    {order.memo}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={copiedField === "memo" ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                  onClick={() => handleCopy(order.memo, "memo")}
                  sx={{
                    fontSize: "0.75rem",
                    color: copiedField === "memo" ? APPLE_PALETTE.success : APPLE_PALETTE.skyLink,
                    borderColor: copiedField === "memo" ? APPLE_PALETTE.success : APPLE_PALETTE.skyLink,
                  }}
                >
                  {copiedField === "memo" ? "Đã chép" : "Sao chép"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Security & Guarantee Alert */}
        <Alert
          severity="success"
          icon={<VerifiedIcon sx={{ color: APPLE_PALETTE.success }} />}
          sx={{
            backgroundColor: "rgba(48, 209, 88, 0.08)",
            color: "#b4f4c5",
            border: "1px solid rgba(48, 209, 88, 0.2)",
            borderRadius: "14px",
            "& .MuiAlert-message": { fontSize: "0.8125rem", lineHeight: 1.4 },
          }}
        >
          Sau khi chuyển khoản thành công từ ngân hàng, hệ thống LensAI sẽ tự động nhận diện và nâng cấp tài khoản của bạn sau 30-60 giây mà không cần thao tác thêm.
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, justifyContent: "space-between" }}>
        <Button onClick={onClose} sx={{ color: APPLE_PALETTE.inkMuted }}>
          Đóng
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onManualCheck}
          sx={{ fontWeight: 600, px: 2.5 }}
        >
          Tôi đã chuyển khoản - Kiểm tra ngay
        </Button>
      </DialogActions>
    </Dialog>
  );
};
