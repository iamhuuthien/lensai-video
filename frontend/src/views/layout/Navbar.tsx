import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import DiamondIcon from "@mui/icons-material/Diamond";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import AppleIcon from "@mui/icons-material/Apple";
import TuneIcon from "@mui/icons-material/Tune";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import type { TrialStatus } from "../../models/types";
import { APPLE_PALETTE } from "../../theme/theme";

interface NavbarProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  trialStatus: TrialStatus | null;
  isVip: boolean;
  onOpenPricing: () => void;
  onOpenSettings: () => void;
  onOpenShortcut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  trialStatus,
  isVip,
  onOpenPricing,
  onOpenSettings,
  onOpenShortcut,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "saturate(180%) blur(20px)",
        borderBottom: `1px solid ${APPLE_PALETTE.hairline}`,
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3 } }}>
        {/* Brand */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }} onClick={() => onTabChange(0)}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${APPLE_PALETTE.actionBlue}, #5856d6)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px rgba(0, 113, 227, 0.4)",
            }}
          >
            <MovieFilterIcon sx={{ fontSize: 20, color: "#ffffff" }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              LensAI
            </Typography>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontSize: "0.6875rem", display: "block" }}>
              Video Explainer 4.0
            </Typography>
          </Box>
        </Box>

        {/* Center Navigation Tabs (Desktop) */}
        {!isMobile && (
          <Tabs
            value={activeTab}
            onChange={(_, val) => onTabChange(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 44,
              "& .MuiTab-root": {
                minHeight: 44,
                textTransform: "none",
                fontSize: "0.9375rem",
                fontWeight: 500,
                color: APPLE_PALETTE.inkMuted,
                transition: "color 0.2s ease",
                "&.Mui-selected": {
                  color: "#ffffff",
                  fontWeight: 600,
                },
              },
            }}
          >
            <Tab icon={<MovieFilterIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Phân tích Video" />
            <Tab icon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Studio CapCut" />
            <Tab icon={<CardGiftcardIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Free Hub 0đ" />
          </Tabs>
        )}

        {/* Right Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Trial Status or VIP Badge */}
          {isVip ? (
            <Chip
              icon={<DiamondIcon sx={{ fontSize: "16px !important", color: "#ffd60a !important" }} />}
              label="VIP PRO"
              size="small"
              sx={{
                backgroundColor: "rgba(255, 214, 10, 0.12)",
                color: "#ffd60a",
                border: "1px solid rgba(255, 214, 10, 0.3)",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
          ) : trialStatus ? (
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: "15px !important", color: `${APPLE_PALETTE.skyLink} !important` }} />}
              label={`Thử: ${trialStatus.link_remaining}/3 link`}
              size="small"
              onClick={onOpenPricing}
              sx={{
                backgroundColor: "rgba(41, 151, 255, 0.1)",
                color: APPLE_PALETTE.skyLink,
                border: "1px solid rgba(41, 151, 255, 0.25)",
                fontWeight: 500,
                fontSize: "0.75rem",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "rgba(41, 151, 255, 0.2)",
                },
              }}
            />
          ) : null}

          {/* Pricing Button */}
          <Button
            variant={isVip ? "text" : "outlined"}
            size="small"
            startIcon={<WorkspacePremiumIcon sx={{ fontSize: 18 }} />}
            onClick={onOpenPricing}
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              fontSize: "0.8125rem",
              py: 0.6,
              px: 1.5,
              borderColor: isVip ? "transparent" : "rgba(255, 214, 10, 0.4)",
              color: isVip ? APPLE_PALETTE.inkMuted : "#ffd60a",
              "&:hover": {
                borderColor: "#ffd60a",
                backgroundColor: "rgba(255, 214, 10, 0.08)",
              },
            }}
          >
            {isVip ? "Gói VIP" : "Nâng cấp"}
          </Button>

          {/* iOS Shortcut */}
          <IconButton
            size="small"
            onClick={onOpenShortcut}
            title="Cài đặt phím tắt iOS"
            sx={{
              color: APPLE_PALETTE.inkMuted,
              border: `1px solid ${APPLE_PALETTE.hairline}`,
              "&:hover": { color: "#ffffff", borderColor: APPLE_PALETTE.hairlineStrong },
            }}
          >
            <AppleIcon sx={{ fontSize: 18 }} />
          </IconButton>

          {/* Settings */}
          <IconButton
            size="small"
            onClick={onOpenSettings}
            title="Cấu hình hệ thống"
            sx={{
              color: APPLE_PALETTE.inkMuted,
              border: `1px solid ${APPLE_PALETTE.hairline}`,
              "&:hover": { color: "#ffffff", borderColor: APPLE_PALETTE.hairlineStrong },
            }}
          >
            <TuneIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile Navigation Tabs */}
      {isMobile && (
        <Tabs
          value={activeTab}
          onChange={(_, val) => onTabChange(val)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 40,
            borderTop: `1px solid ${APPLE_PALETTE.hairline}`,
            "& .MuiTab-root": {
              minHeight: 40,
              textTransform: "none",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: APPLE_PALETTE.inkMuted,
              "&.Mui-selected": {
                color: "#ffffff",
                fontWeight: 600,
              },
            },
          }}
        >
          <Tab icon={<MovieFilterIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Phân tích" />
          <Tab icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Studio" />
          <Tab icon={<CardGiftcardIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Free 0đ" />
        </Tabs>
      )}
    </AppBar>
  );
};
