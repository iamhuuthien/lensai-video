import { createTheme, alpha } from "@mui/material/styles";

// Apple Cinema Dark System Palette
export const APPLE_PALETTE = {
  black: "#000000",
  tile1: "#161618",
  tile2: "#212124",
  tile3: "#2c2c2e",
  tileHover: "#28282b",
  actionBlue: "#0071e3",
  actionBlueHover: "#0077ed",
  skyLink: "#2997ff",
  success: "#30d158",
  warning: "#ffd60a",
  error: "#ff453a",
  inkMuted: "#86868b",
  hairline: "rgba(255, 255, 255, 0.08)",
  hairlineStrong: "rgba(255, 255, 255, 0.16)",
  glass: "rgba(22, 22, 24, 0.72)",
  gold: "#f5a623",
  purple: "#af52de",
};

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: APPLE_PALETTE.actionBlue,
      light: APPLE_PALETTE.skyLink,
      dark: "#005bb5",
      contrastText: "#ffffff",
    },
    secondary: {
      main: APPLE_PALETTE.skyLink,
      contrastText: "#ffffff",
    },
    background: {
      default: APPLE_PALETTE.black,
      paper: APPLE_PALETTE.tile1,
    },
    text: {
      primary: "#ffffff",
      secondary: APPLE_PALETTE.inkMuted,
    },
    success: {
      main: APPLE_PALETTE.success,
    },
    warning: {
      main: APPLE_PALETTE.warning,
    },
    error: {
      main: APPLE_PALETTE.error,
    },
    divider: APPLE_PALETTE.hairline,
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"SF Pro Display"',
      '"SF Pro Text"',
      '"Segoe UI"',
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "2.75rem",
      fontWeight: 600,
      letterSpacing: "-0.03em",
      lineHeight: 1.08,
      "@media (max-width:600px)": {
        fontSize: "2rem",
      },
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.15,
      "@media (max-width:600px)": {
        fontSize: "1.5rem",
      },
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      letterSpacing: "-0.015em",
      lineHeight: 1.25,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
      lineHeight: 1.3,
    },
    body1: {
      fontSize: "1.0625rem", // 17px Apple Body standard
      lineHeight: 1.47,
      letterSpacing: "-0.015em",
    },
    body2: {
      fontSize: "0.875rem", // 14px
      lineHeight: 1.43,
      letterSpacing: "-0.01em",
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
      fontSize: "0.9375rem",
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: APPLE_PALETTE.black,
          color: "#ffffff",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255, 255, 255, 0.2) rgba(18, 18, 20, 0.6)",
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(18, 18, 20, 0.6)",
            borderRadius: "9999px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "9999px",
            border: "2px solid transparent",
            backgroundClip: "content-box",
            transition: "background 0.2s ease",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(255, 255, 255, 0.38)",
            backgroundClip: "content-box",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // Apple pill standard
          padding: "9px 20px",
          transition: "all 0.18s cubic-bezier(0.25, 0.1, 0.25, 1)",
          "&:active": {
            transform: "scale(0.97)",
          },
        },
        contained: {
          backgroundColor: APPLE_PALETTE.actionBlue,
          boxShadow: "none",
          "&:hover": {
            backgroundColor: APPLE_PALETTE.actionBlueHover,
            boxShadow: `0 4px 16px ${alpha(APPLE_PALETTE.actionBlue, 0.35)}`,
          },
        },
        outlined: {
          borderColor: APPLE_PALETTE.hairlineStrong,
          "&:hover": {
            borderColor: APPLE_PALETTE.skyLink,
            backgroundColor: alpha(APPLE_PALETTE.skyLink, 0.08),
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: APPLE_PALETTE.tile1,
          border: `1px solid ${APPLE_PALETTE.hairline}`,
          borderRadius: 18,
          transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: APPLE_PALETTE.tile1,
          border: `1px solid ${APPLE_PALETTE.hairline}`,
          borderRadius: 18,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#161618",
          border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
          borderRadius: 22,
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.85)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 14,
            backgroundColor: alpha(APPLE_PALETTE.tile2, 0.6),
            "& fieldset": {
              borderColor: APPLE_PALETTE.hairline,
            },
            "&:hover fieldset": {
              borderColor: APPLE_PALETTE.hairlineStrong,
            },
            "&.Mui-focused fieldset": {
              borderColor: APPLE_PALETTE.actionBlue,
              borderWidth: 2,
            },
          },
        },
      },
    },
  },
});
