import { useState, useCallback } from "react";
import type { ChatMessage } from "../models/types";
import { ApiService } from "../services/api";

export function useChatController(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const q = (overrideText || inputQuestion).trim();
      if (!q || !sessionId) return;

      const userMsg: ChatMessage = {
        id: "msg-" + Date.now(),
        sender: "user",
        text: q,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputQuestion("");
      setLoading(true);
      setError(null);

      try {
        const res = await ApiService.chatVideo(sessionId, q);
        const aiMsg: ChatMessage = {
          id: "msg-ai-" + Date.now(),
          sender: "ai",
          text: res.answer,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Không thể trả lời lúc này.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [inputQuestion, sessionId]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setInputQuestion("");
    setError(null);
  }, []);

  return {
    messages,
    inputQuestion,
    setInputQuestion,
    loading,
    error,
    sendMessage,
    resetChat,
  };
}
