import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Typography, Button, Paper, Stack } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import { APPLE_PALETTE } from "../theme/theme";
import { StorageService } from "../services/storage";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("LensAI Uncaught Error Boundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    StorageService.clearAll();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: APPLE_PALETTE.black,
            p: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              maxWidth: 520,
              width: "100%",
              p: 4,
              bgcolor: APPLE_PALETTE.tile1,
              border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
              borderRadius: "20px",
              textAlign: "center",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#ffffff", mb: 1.5 }}>
              LensAI Video Explainer
            </Typography>
            <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted, mb: 3 }}>
              Hệ thống phát hiện dữ liệu phiên bản cũ cần được làm mới. Vui lòng bấm làm mới trang bên dưới.
            </Typography>

            <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
                sx={{ bgcolor: APPLE_PALETTE.actionBlue }}
              >
                Tải lại trang
              </Button>
              <Button
                variant="outlined"
                startIcon={<DeleteSweepIcon />}
                onClick={this.handleResetStorage}
                sx={{ color: APPLE_PALETTE.inkMuted, borderColor: APPLE_PALETTE.hairlineStrong }}
              >
                Xóa cache cũ
              </Button>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
