import React, { useState } from "react";
import { ThemeProvider, CssBaseline, Box, Container, Snackbar, Alert, Button } from "@mui/material";
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
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);
  const [cleanDownloadSuccess, setCleanDownloadSuccess] = useState<string | null>(null);

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

  const handleCleanDownload = async () => {
    if (!analyze.url.trim()) return;
    setDownloadLoading(true);
    try {
      const res = await ApiService.downloadCleanVideo(analyze.url.trim());
      // Trigger native file download
      const a = document.createElement("a");
      a.href = res.download_url;
      a.download = res.filename || "Video_Clean.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setCleanDownloadSuccess(`Đã tải video không logo: "${res.title.slice(0, 35)}..."`);

      // Save into cloud history (15 days retention)
      ApiService.saveCloudHistory({
        session_id: res.session_id,
        url: analyze.url.trim(),
        title: res.title,
        thumbnail: res.thumbnail,
        platform: res.platform,
        duration: res.duration,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải video lúc này.";
      billing.setStatusMessage(msg);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleScrollToTool = () => {
    const el = document.getElementById("url-input-tool");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
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
            {/* Tab 0: Video Analysis & Clean Download */}
            {activeTab === 0 && (
              <Box>
                <Hero
                  onSelectSampleUrl={(sampleUrl) => {
                    analyze.setUrl(sampleUrl);
                    handleScrollToTool();
                  }}
                  onScrollToTool={handleScrollToTool}
                />

                <UrlInputCard
                  url={analyze.url}
                  setUrl={analyze.setUrl}
                  mode={analyze.mode}
                  setMode={analyze.setMode}
                  loading={analyze.loading}
                  downloadLoading={downloadLoading}
                  error={analyze.error}
                  history={analyze.history}
                  onAnalyze={analyze.handleAnalyze}
                  onDownloadClean={handleCleanDownload}
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

            {/* Tab 1: Creator Studio (.SRT) */}
            {activeTab === 1 && <StudioTab />}

            {/* Tab 2: Free Tools Hub */}
            {activeTab === 2 && <FreeHubTab />}
          </Container>
        </Box>

        {/* Footer */}
        <Footer />

        {/* Modals & Dialogs */}
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

        {/* Clean Download Success Toast with Conversion Action */}
        <Snackbar
          open={Boolean(cleanDownloadSuccess)}
          autoHideDuration={7000}
          onClose={() => setCleanDownloadSuccess(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setCleanDownloadSuccess(null)}
            severity="success"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setCleanDownloadSuccess(null);
                  analyze.handleAnalyze();
                }}
                sx={{ fontWeight: 700, textDecoration: "underline" }}
              >
                Phân tích AI ngay
              </Button>
            }
            sx={{ width: "100%", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
          >
            {cleanDownloadSuccess}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};
