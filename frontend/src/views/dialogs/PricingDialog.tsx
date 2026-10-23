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
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import PsychologyIcon from "@mui/icons-material/Psychology";
import GroupsIcon from "@mui/icons-material/Groups";
import KeyIcon from "@mui/icons-material/Key";
import type { Plan, TrialStatus } from "../../models/types";
import { ExportService } from "../../services/export";
import { APPLE_PALETTE } from "../../theme/theme";
import { SpotlightCard } from "../common/SpotlightCard";

interface PricingDialogProps {
  open: boolean;
  onClose: () => void;
  plans: Plan[];
  trialStatus: TrialStatus | null;
  onSelectPlan: (planId: string) => void;
  onApplyVipCode: (code: string) => void;
}

interface PlanTheme {
  accent: string;
  glow: string;
  spotlight: string;
  icon: React.ReactElement;
  modelBadge: string;
  modelIcon: React.ReactElement;
}

const PLAN_THEMES: Record<string, PlanTheme> = {
  trial_day: {
    accent: "#30d158",
    glow: "rgba(48, 209, 88, 0.4)",
    spotlight: "rgba(48, 209, 88, 0.22)",
    icon: <ElectricBoltIcon sx={{ fontSize: 20, color: "#30d158" }} />,
    modelBadge: "Gemini 2.5 Flash",
    modelIcon: <ElectricBoltIcon sx={{ fontSize: 13, color: "#30d158" }} />,
  },
  creator_week: {
    accent: APPLE_PALETTE.skyLink,
    glow: "rgba(41, 151, 255, 0.45)",
    spotlight: "rgba(41, 151, 255, 0.22)",
    icon: <WorkspacePremiumIcon sx={{ fontSize: 20, color: APPLE_PALETTE.skyLink }} />,
    modelBadge: "Gemini 2.5 Flash",
    modelIcon: <ElectricBoltIcon sx={{ fontSize: 13, color: APPLE_PALETTE.skyLink }} />,
  },
  pro_month: {
    accent: "#af52de",
    glow: "rgba(175, 82, 222, 0.45)",
    spotlight: "rgba(175, 82, 222, 0.25)",
    icon: <PsychologyIcon sx={{ fontSize: 20, color: "#af52de" }} />,
    modelBadge: "Gemini 2.5 Pro",
    modelIcon: <PsychologyIcon sx={{ fontSize: 13, color: "#af52de" }} />,
  },
  agency_month: {
    accent: "#ff9f0a",
    glow: "rgba(255, 159, 10, 0.45)",
    spotlight: "rgba(255, 159, 10, 0.25)",
    icon: <GroupsIcon sx={{ fontSize: 20, color: "#ff9f0a" }} />,
    modelBadge: "Gemini 2.5 Pro",
    modelIcon: <PsychologyIcon sx={{ fontSize: 13, color: "#ff9f0a" }} />,
  },
};

const DEFAULT_THEME: PlanTheme = {
  accent: APPLE_PALETTE.actionBlue,
  glow: "rgba(0, 113, 227, 0.4)",
  spotlight: "rgba(0, 113, 227, 0.22)",
  icon: <ElectricBoltIcon sx={{ fontSize: 20 }} />,
  modelBadge: "Gemini 2.5",
  modelIcon: <ElectricBoltIcon sx={{ fontSize: 13 }} />,
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
      <DialogTitle
        sx={{
          m: 0,
          p: { xs: 2, sm: 2.5 },
          pb: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${APPLE_PALETTE.hairline}`,
        }}
      >
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <WorkspacePremiumIcon sx={{ color: "#ffd60a", fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff" }}>
              Nâng cấp Gói VIP LensAI
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
            Khai phá sức mạnh phân tích thị giác AI, xuất file .SRT CapCut và cố vấn kịch bản viral.
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: APPLE_PALETTE.inkMuted }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 }, pt: { xs: 1.5, sm: 2 } }}>
        {/* Trial Status Notice (Compact) */}
        {trialStatus && !trialStatus.is_vip && (
          <Alert
            severity="info"
            sx={{
              mb: 2,
              py: 0.5,
              px: 2,
              backgroundColor: "rgba(41, 151, 255, 0.08)",
              color: "#c8e1ff",
              border: "1px solid rgba(41, 151, 255, 0.22)",
              borderRadius: "12px",
              "& .MuiAlert-message": { fontSize: "0.8125rem", py: 0.2 },
            }}
          >
            Hạn ngạch dùng thử tháng này: Còn <strong>{trialStatus.link_remaining}/3</strong> lượt phân tích video và{" "}
            <strong>{trialStatus.srt_remaining}/1</strong> lượt xuất file .SRT.
          </Alert>
        )}

        {/* 4 Plans Grid - All 4 cards fit side-by-side on desktop */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {plans.map((plan) => {
            const themeInfo = PLAN_THEMES[plan.id] || DEFAULT_THEME;
            const isProModel = plan.id === "pro_month" || plan.id === "agency_month";

            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={plan.id}>
                <SpotlightCard
                  spotlightColor={themeInfo.spotlight}
                  hoverBorderColor={themeInfo.accent}
                  enableScaleHover
                  sx={{
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    bgcolor: APPLE_PALETTE.tile1,
                    border: `1.5px solid ${plan.popular ? themeInfo.accent : APPLE_PALETTE.hairlineStrong}`,
                    borderRadius: "18px",
                    position: "relative",
                    overflow: "visible",
                    transition: "all 0.24s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    "&:hover": {
                      boxShadow: `0 14px 36px ${themeInfo.glow}`,
                      bgcolor: "rgba(26, 26, 30, 0.98)",
                      borderColor: themeInfo.accent,
                    },
                  }}
                >
                  {/* Popular or Category Badge */}
                  {plan.badge && (
                    <Chip
                      label={plan.badge}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: -11,
                        right: 14,
                        bgcolor: themeInfo.accent,
                        color: "#000000",
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        height: 20,
                        boxShadow: `0 2px 10px ${themeInfo.glow}`,
                        zIndex: 3,
                      }}
                    />
                  )}

                  <Box sx={{ mb: 1.5 }}>
                    {/* Header */}
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                      {themeInfo.icon}
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffffff", fontSize: "0.95rem" }}>
                        {plan.name}
                      </Typography>
                    </Stack>

                    {/* AI Model Badge */}
                    <Box sx={{ mb: 1.5 }}>
                      <Chip
                        icon={themeInfo.modelIcon}
                        label={`Model: ${themeInfo.modelBadge}`}
                        size="small"
                        sx={{
                          bgcolor: isProModel ? "rgba(175, 82, 222, 0.14)" : "rgba(48, 209, 88, 0.14)",
                          color: isProModel ? "#d8b4fe" : "#bbf7d0",
                          border: `1px solid ${isProModel ? "rgba(175, 82, 222, 0.35)" : "rgba(48, 209, 88, 0.35)"}`,
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          height: 22,
                          "& .MuiChip-icon": { ml: 0.5 },
                        }}
                      />
                    </Box>

                    {/* Price */}
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 1.5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: themeInfo.accent }}>
                        {ExportService.formatVnd(plan.price)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                        / {plan.duration_days === 1 ? "24h" : `${plan.duration_days} ngày`}
                      </Typography>
                    </Box>

                    {/* Features list */}
                    <List disablePadding sx={{ minHeight: { md: 140 } }}>
                      {plan.features.map((feat, idx) => (
                        <ListItem key={idx} disableGutters sx={{ py: 0.3, alignItems: "flex-start" }}>
                          <ListItemIcon sx={{ minWidth: 20, mt: 0.2 }}>
                            <CheckCircleIcon sx={{ fontSize: 14, color: themeInfo.accent }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="caption" sx={{ color: "#d5d5dc", lineHeight: 1.35, fontSize: "0.75rem" }}>
                                {feat}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {/* Select Button */}
                  <Button
                    fullWidth
                    variant={plan.popular ? "contained" : "outlined"}
                    size="small"
                    onClick={() => onSelectPlan(plan.id)}
                    sx={{
                      mt: "auto",
                      fontWeight: 700,
                      py: 0.85,
                      fontSize: "0.8125rem",
                      borderColor: themeInfo.accent,
                      bgcolor: plan.popular ? themeInfo.accent : "transparent",
                      color: plan.popular ? "#000000" : themeInfo.accent,
                      transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
                      "&:hover": {
                        bgcolor: themeInfo.accent,
                        color: "#000000",
                        boxShadow: `0 6px 20px ${themeInfo.glow}`,
                      },
                      "&:active": {
                        transform: "scale(0.96)",
                      },
                    }}
                  >
                    Chọn gói này
                  </Button>
                </SpotlightCard>
              </Grid>
            );
          })}
        </Grid>

        {/* Manual VIP code input (Compact) */}
        <SpotlightCard
          spotlightColor="rgba(41, 151, 255, 0.1)"
          sx={{
            p: 1.5,
            bgcolor: APPLE_PALETTE.tile2,
            borderRadius: "14px",
            border: `1px solid ${APPLE_PALETTE.hairline}`,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: "center" }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 160 }}>
              <KeyIcon sx={{ fontSize: 17, color: APPLE_PALETTE.skyLink }} />
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
              sx={{
                "& .MuiOutlinedInput-input": { py: 0.7, fontSize: "0.8125rem" },
              }}
            />
            <Button
              variant="outlined"
              size="small"
              disabled={!manualCode.trim()}
              onClick={() => onApplyVipCode(manualCode)}
              sx={{
                whiteSpace: "nowrap",
                fontWeight: 600,
                py: 0.7,
                px: 2,
                transition: "all 0.15s ease",
                "&:active": { transform: "scale(0.96)" },
              }}
            >
              Kích hoạt
            </Button>
          </Stack>
        </SpotlightCard>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0.5 }}>
        <Button onClick={onClose} size="small" sx={{ color: APPLE_PALETTE.inkMuted }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};
