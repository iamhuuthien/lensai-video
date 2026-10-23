import React from "react";
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AppleIcon from "@mui/icons-material/Apple";
import IosShareIcon from "@mui/icons-material/IosShare";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { APPLE_PALETTE } from "../../theme/theme";

interface ShortcutDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ShortcutDialog: React.FC<ShortcutDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <AppleIcon sx={{ fontSize: 24, color: "#ffffff" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Phím tắt iOS Share Sheet
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: APPLE_PALETTE.inkMuted }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted, mb: 2.5 }}>
          Phân tích mọi video trực tiếp từ ứng dụng TikTok hoặc YouTube trên iPhone của bạn chỉ bằng 1 chạm qua menu Chia sẻ (Share Sheet).
        </Typography>

        <Box
          sx={{
            p: 2,
            mb: 2.5,
            bgcolor: APPLE_PALETTE.tile2,
            border: `1px solid ${APPLE_PALETTE.hairline}`,
            borderRadius: "14px",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#ffffff" }}>
            3 bước cài đặt đơn giản:
          </Typography>
          <List disablePadding>
            <ListItem disableGutters sx={{ py: 0.6 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: APPLE_PALETTE.skyLink }} />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="caption" sx={{ color: "#e1e1e6" }}>Bấm nút 'Tải phím tắt' bên dưới để thêm vào ứng dụng Phím tắt (Shortcuts).</Typography>}
              />
            </ListItem>
            <ListItem disableGutters sx={{ py: 0.6 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: APPLE_PALETTE.skyLink }} />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="caption" sx={{ color: "#e1e1e6" }}>Khi đang xem clip trên TikTok/YouTube, bấm nút 'Chia sẻ' (Share).</Typography>}
              />
            </ListItem>
            <ListItem disableGutters sx={{ py: 0.6 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: APPLE_PALETTE.skyLink }} />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="caption" sx={{ color: "#e1e1e6" }}>Chọn 'LensAI Explainer' — kết quả tóm tắt & đoạn vàng sẽ hiện ngay trên màn hình.</Typography>}
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ textAlign: "center", py: 1 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<IosShareIcon />}
            endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
            href="https://www.icloud.com/shortcuts"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ fontWeight: 600, px: 3 }}
          >
            Tải phím tắt cho iPhone / iPad
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} sx={{ color: APPLE_PALETTE.inkMuted }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};
