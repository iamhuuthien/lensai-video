import { useState, useEffect, useCallback } from "react";
import type { AnalysisMode, AnalysisResult } from "../models/types";
import { ApiService, onTrialExhausted } from "../services/api";
import { StorageService } from "../services/storage";

export function useAnalyzeController(onOpenPricing?: () => void) {
  const [url, setUrl] = useState<string>("");
  const [mode, setMode] = useState<AnalysisMode>("quick");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  useEffect(() => {
    setHistory(StorageService.getHistory());

    const unsubscribe = onTrialExhausted((message) => {
      setError(message);
      if (onOpenPricing) onOpenPricing();
    });

    return () => {
      unsubscribe();
    };
  }, [onOpenPricing]);

  const handleAnalyze = useCallback(
    async (targetUrl?: string, targetMode?: AnalysisMode) => {
      const runUrl = (targetUrl || url).trim();
      const runMode = targetMode || mode;

      if (!runUrl) {
        setError("Vui lòng dán đường link video (TikTok, YouTube, Facebook, Reels).");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await ApiService.analyzeVideo(runUrl, runMode);
        setResult(res);
        StorageService.saveHistory(runUrl);
        setHistory(StorageService.getHistory());
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [url, mode]
  );

  const handleClear = useCallback(() => {
    setUrl("");
    setError(null);
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    setSeekTime(seconds);
  }, []);

  return {
    url,
    setUrl,
    mode,
    setMode,
    loading,
    error,
    setError,
    result,
    setResult,
    history,
    seekTime,
    handleSeek,
    handleAnalyze,
    handleClear,
    handlePaste,
  };
}
