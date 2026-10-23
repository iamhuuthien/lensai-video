import React, { useState } from "react";
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
  Grid,
  Card,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import DiamondIcon from "@mui/icons-material/Diamond";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import KeyIcon from "@mui/icons-material/Key";
import type { Plan, TrialStatus } from "../../models/types";
import { ExportService } from "../../services/export";
import { APPLE_PALETTE } from "../../theme/theme";

interface PricingDialogProps {
  open: boolean;
  onClose: () => void;
  plans: Plan[];
  trialStatus: TrialStatus | null;
  onSelectPlan: (planId: string) => void;
  onApplyVipCode: (code: string) => void;
}

const PLAN_THEMES: Record<string, { accent: string; glow: string; icon: React.ReactElement }> = {
  day_pass: {
    accent: APPLE_PALETTE.actionBlue,
    glow: "rgba(0, 113, 227, 0.4)",
    icon: <ElectricBoltIcon sx={{ fontSize: 20, color: APPLE_PALETTE.actionBlue }} />,
  },
  month_pass: {
    accent: "#f5a623",
    glow: "rgba(245, 166, 35, 0.45)",
    icon: <WorkspacePremiumIcon sx={{ fontSize: 20, color: "#f5a623" }} />,
  },
  year_pass: {
    accent: "#af52de",
    glow: "rgba(175, 82, 222, 0.45)",
    icon: <DiamondIcon sx={{ fontSize: 20, color: "#af52de" }} />,
  },
};

export const PricingDialog: React.FC<PricingDialogProps> = ({
  open,
  onClose,
  plans,
  trialStatus,
  onSelectPlan,
  onApplyVipCode,
}) => {
  const [manualCode, setManualCode] = useState<string>("");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 3, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
            <WorkspacePremiumIcon sx={{ color: "#ffd60a", fontSize: 24 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Nâng cấp Gói VIP Không Giới Hạn
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted }}>
            Khai phá toàn bộ năng lực phân tích video, xuất phụ đề CapCut và cố vấn kịch bản AI.
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: APPLE_PALETTE.inkMuted }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 1.5 }}>
        {/* Trial Status Notice */}
        {trialStatus && !trialStatus.is_vip && (
          <Alert
            severity="info"
            sx={{
              mb: 3,
              backgroundColor: "rgba(41, 151, 255, 0.08)",
              color: "#c8e1ff",
              border: "1px solid rgba(41, 151, 255, 0.25)",
              borderRadius: "14px",
            }}
          >
            Hạn ngạch dùng thử tháng này: Còn <strong>{trialStatus.link_remaining}/3</strong> lượt phân tích video và{" "}
            <strong>{trialStatus.srt_remaining}/1</strong> lượt xuất file .SRT.
          </Alert>
        )}

        {/* Pricing Cards Grid */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {plans.map((plan) => {
            const themeInfo = PLAN_THEMES[plan.id] || {
              accent: APPLE_PALETTE.actionBlue,
              glow: "rgba(0, 113, 227, 0.4)",
              icon: <ElectricBoltIcon sx={{ fontSize: 20 }} />,
            };

            return (
              <Grid size={{ xs: 12, md: 4 }} key={plan.id}>
                <Card
                  elevation={0}
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    bgcolor: APPLE_PALETTE.tile1,
                    border: `1.5px solid ${plan.popular ? themeInfo.accent : APPLE_PALETTE.hairlineStrong}`,
                    borderRadius: "20px",
                    position: "relative",
                    overflow: "visible",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: themeInfo.accent,
                      boxShadow: `0 12px 32px ${themeInfo.glow}`,
                      bgcolor: "rgba(28, 28, 30, 0.98)",
                    },
                  }}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <Chip
                      label={plan.badge}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: -12,
                        right: 20,
                        bgcolor: themeInfo.accent,
                        color: "#000000",
                        fontWeight: 700,
                        fontSize: "0.6875rem",
                        boxShadow: `0 2px 8px ${themeInfo.glow}`,
                      }}
                    />
                  )}

                  <Box sx={{ mb: 2.5 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                      {themeInfo.icon}
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff" }}>
                        {plan.name}
                      </Typography>
                    </Stack>

                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", minHeight: 36, mb: 2 }}>
                      {plan.description}
                    </Typography>

                    {/* Price */}
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: themeInfo.accent }}>
                        {ExportService.formatVnd(plan.price)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                        / {plan.duration_days === 1 ? "24h" : `${plan.duration_days} ngày`}
                      </Typography>
                    </Box>

                    {/* Features list */}
                    <List disablePadding>
                      {plan.features.map((feat, idx) => (
                        <ListItem key={idx} disableGutters sx={{ py: 0.5, alignItems: "flex-start" }}>
                          <ListItemIcon sx={{ minWidth: 24, mt: 0.3 }}>
                            <CheckCircleIcon sx={{ fontSize: 16, color: themeInfo.accent }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography variant="caption" sx={{ color: "#e1e1e6", lineHeight: 1.4 }}>{feat}</Typography>}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {/* Select Button */}
                  <Button
                    fullWidth
                    variant={plan.popular ? "contained" : "outlined"}
                    size="medium"
                    onClick={() => onSelectPlan(plan.id)}
                    sx={{
                      mt: "auto",
                      fontWeight: 600,
                      py: 1,
                      borderColor: themeInfo.accent,
                      bgcolor: plan.popular ? themeInfo.accent : "transparent",
                      color: plan.popular ? "#000000" : themeInfo.accent,
                      "&:hover": {
                        bgcolor: themeInfo.accent,
                        color: "#000000",
                        boxShadow: `0 4px 16px ${themeInfo.glow}`,
                      },
                    }}
                  >
                    Chọn gói này
                  </Button>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Manual VIP code input */}
        <Box sx={{ p: 2, bgcolor: APPLE_PALETTE.tile2, borderRadius: "14px", border: `1px solid ${APPLE_PALETTE.hairline}` }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: "center" }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 160 }}>
              <KeyIcon sx={{ fontSize: 18, color: APPLE_PALETTE.skyLink }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#ffffff" }}>
                Đã có mã kích hoạt VIP?
              </Typography>
            </Stack>
            <TextField
              fullWidth
              size="small"
              placeholder="Nhập mã VIP (VD: VIP-XXXXXX)..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <Button
              variant="outlined"
              size="medium"
              disabled={!manualCode.trim()}
              onClick={() => onApplyVipCode(manualCode)}
              sx={{ whiteSpace: "nowrap" }}
            >
              Kích hoạt
            </Button>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} sx={{ color: APPLE_PALETTE.inkMuted }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};
