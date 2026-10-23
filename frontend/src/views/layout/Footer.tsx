import React from "react";
import { Box, Typography, Stack, Link } from "@mui/material";
import { APPLE_PALETTE } from "../../theme/theme";

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: 8,
        py: 4,
        px: 3,
        borderTop: `1px solid ${APPLE_PALETTE.hairline}`,
        textAlign: "center",
        backgroundColor: APPLE_PALETTE.black,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
          © 2026 LensAI Video Explainer · Kiến trúc MVC Chuẩn & Material UI
        </Typography>
        <Typography variant="caption" sx={{ color: APPLE_PALETTE.hairlineStrong, display: { xs: "none", sm: "block" } }}>
          •
        </Typography>
        <Link
          href="https://ai.google.dev"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: APPLE_PALETTE.skyLink, textDecoration: "none", fontSize: "0.75rem", "&:hover": { textDecoration: "underline" } }}
        >
          Google Gemini Multimodal Vision
        </Link>
        <Typography variant="caption" sx={{ color: APPLE_PALETTE.hairlineStrong, display: { xs: "none", sm: "block" } }}>
          •
        </Typography>
        <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
          Bảo mật quyền riêng tư thiết bị
        </Typography>
      </Stack>
      <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.3)", fontSize: "0.6875rem" }}>
        LensAI Video Explainer v4.0.0 · Tương thích TikTok, YouTube, Instagram Reels, Facebook Watch
      </Typography>
    </Box>
  );
};
