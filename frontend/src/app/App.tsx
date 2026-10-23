import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Box, Container, Snackbar, Alert } from "@mui/material";
import { theme } from "../theme/theme";
import { Navbar } from "../views/layout/Navbar";
import { Hero } from "../views/layout/Hero";
import { Footer } from "../views/layout/Footer";
import { UrlInputCard } from "../views/analyze/UrlInputCard";
import { KeySegmentBanner } from "../views/analyze/KeySegmentBanner";
import { VideoPlayer } from "../views/analyze/VideoPlayer";
import { ResultBento } from "../views/analyze/ResultBento";
import { ChatSection } from "../views/analyze/ChatSection";
import { StudioTab } from "../views/studio/StudioTab";
import { FreeHubTab } from "../views/freehub/FreeHubTab";
import { SettingsDialog } from "../views/dialogs/SettingsDialog";
import { ShortcutDialog } from "../views/dialogs/ShortcutDialog";
import { PricingDialog } from "../views/dialogs/PricingDialog";
import { VietQrModal } from "../views/dialogs/VietQrModal";
import { useAnalyzeController } from "../controllers/useAnalyzeController";
import { useChatController } from "../controllers/useChatController";
import { useBillingController } from "../controllers/useBillingController";
import { ApiService } from "../services/api";
import { ExportService } from "../services/export";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [shortcutOpen, setShortcutOpen] = useState<boolean>(false);

  const billing = useBillingController();
  const analyze = useAnalyzeController(() => billing.setPricingOpen(true));
  const chat = useChatController(analyze.result?.session_id || null);

  const handleExportSrtFromAnalysis = async () => {
    if (!analyze.result) return;
    try {
      const res = await ApiService.exportCapcutSrt(
        analyze.result.video_info.title,
        analyze.result.raw_markdown || analyze.result.summary
      );
      ExportService.downloadFile(res.filename, res.content, "application/x-subrip");
      billing.refreshTrialStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể xuất phụ đề lúc này.";
      billing.setStatusMessage(msg);
      billing.setPricingOpen(true);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#000000" }}>
        {/* Navigation */}
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          trialStatus={billing.trialStatus}
          isVip={billing.isVip}
          onOpenPricing={() => billing.setPricingOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenShortcut={() => setShortcutOpen(true)}
        />

        {/* Main Content */}
        <Box component="main" sx={{ flex: 1, py: { xs: 2, sm: 4 } }}>
          <Container maxWidth="lg">
            {/* Tab 0: Video Analysis */}
            {activeTab === 0 && (
              <Box>
                <Hero />

                <UrlInputCard
                  url={analyze.url}
                  setUrl={analyze.setUrl}
                  mode={analyze.mode}
                  setMode={analyze.setMode}
                  loading={analyze.loading}
                  error={analyze.error}
                  history={analyze.history}
                  onAnalyze={analyze.handleAnalyze}
                  onClear={analyze.handleClear}
                  onPaste={analyze.handlePaste}
                />

                {/* Analysis Results */}
                {analyze.result && (
                  <Box sx={{ mt: 4 }}>
                    {/* Key Retention Segment */}
                    {analyze.result.key_segment && (
                      <KeySegmentBanner
                        segment={analyze.result.key_segment}
                        onSeek={analyze.handleSeek}
                      />
                    )}

                    {/* Video Player */}
                    {analyze.result.session_id && (
                      <VideoPlayer
                        sessionId={analyze.result.session_id}
                        videoInfo={analyze.result.video_info}
                        seekTime={analyze.seekTime}
                      />
                    )}

                    {/* Bento Grid */}
                    <ResultBento
                      result={analyze.result}
                      onSeek={analyze.handleSeek}
                      onExportSrt={handleExportSrtFromAnalysis}
                    />

                    {/* Follow-up Chat */}
                    <ChatSection
                      messages={chat.messages}
                      inputQuestion={chat.inputQuestion}
                      setInputQuestion={chat.setInputQuestion}
                      loading={chat.loading}
                      error={chat.error}
                      onSend={chat.sendMessage}
                      onReset={chat.resetChat}
                    />
                  </Box>
                )}
              </Box>
            )}

            {/* Tab 1: Studio Creator */}
            {activeTab === 1 && <StudioTab />}

            {/* Tab 2: Free Hub 0đ */}
            {activeTab === 2 && <FreeHubTab />}
          </Container>
        </Box>

        {/* Footer */}
        <Footer />

        {/* Dialogs */}
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />

        <ShortcutDialog
          open={shortcutOpen}
          onClose={() => setShortcutOpen(false)}
        />

        <PricingDialog
          open={billing.pricingOpen}
          onClose={() => billing.setPricingOpen(false)}
          plans={billing.plans}
          trialStatus={billing.trialStatus}
          onSelectPlan={billing.handleSelectPlan}
          onApplyVipCode={billing.handleApplyVipCode}
        />

        <VietQrModal
          open={billing.qrModalOpen}
          order={billing.currentOrder}
          onClose={billing.closeQrModal}
          onManualCheck={billing.handleManualCheckOrder}
        />

        {/* Status Toast */}
        <Snackbar
          open={Boolean(billing.statusMessage)}
          autoHideDuration={4000}
          onClose={() => billing.setStatusMessage(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => billing.setStatusMessage(null)}
            severity={billing.statusMessage?.includes("thành công") ? "success" : "info"}
            sx={{ width: "100%", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
          >
            {billing.statusMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};
