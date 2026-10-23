import { useState, useEffect, useCallback, useRef } from "react";
import type { Order, Plan, TrialStatus } from "../models/types";
import { ApiService } from "../services/api";
import { StorageService } from "../services/storage";

const DEFAULT_PLANS: Plan[] = [
  {
    id: "day_pass",
    name: "Pass Ngày (24h)",
    price: 29000,
    duration_days: 1,
    description: "Cứu cánh tức thì cho nhu cầu phân tích & dựng clip gấp trong ngày.",
    features: [
      "Không giới hạn số lượt phân tích video",
      "Xuất file phụ đề .SRT & CapCut không giới hạn",
      "Chat hỏi đáp sâu về video với AI",
      "Kích hoạt tự động sau 30-60 giây chuyển khoản",
    ],
  },
  {
    id: "month_pass",
    name: "Pass Tháng (30 ngày)",
    price: 99000,
    duration_days: 30,
    description: "Lựa chọn phổ biến nhất cho Content Creator & Video Editor chuyên nghiệp.",
    popular: true,
    badge: "Phổ biến nhất",
    features: [
      "Tất cả quyền lợi của gói Ngày trong 30 ngày",
      "Tiết kiệm 88% so với mua lẻ theo ngày",
      "Ưu tiên băng thông phân tích video siêu tốc",
      "Hỗ trợ trọn bộ công cụ Studio & Hook Viral",
    ],
  },
  {
    id: "year_pass",
    name: "Pass Năm (365 ngày)",
    price: 299000,
    duration_days: 365,
    description: "Đầu tư dài hạn kinh tế nhất, chỉ tương đương ~800đ mỗi ngày.",
    badge: "Tiết kiệm 75%",
    features: [
      "Toàn quyền truy cập trọn vẹn 1 năm",
      "Cập nhật mọi tính năng mới trong tương lai",
      "Hỗ trợ kỹ thuật 1-1 qua Zalo/Telegram",
      "Không lo giới hạn số lượt sử dụng",
    ],
  },
];

export function useBillingController() {
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [pricingOpen, setPricingOpen] = useState<boolean>(false);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState<boolean>(false);
  const [isVip, setIsVip] = useState<boolean>(false);
  const [vipCode, setVipCode] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const pollIntervalRef = useRef<number | null>(null);

  const refreshTrialStatus = useCallback(async () => {
    try {
      const status = await ApiService.getTrialStatus();
      setTrialStatus(status);
      if (status.is_vip) {
        setIsVip(true);
      }
    } catch {
      // Offline fallback: community mode or API error
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      const res = await ApiService.getPlans();
      if (res && res.length > 0) {
        setPlans(res);
      }
    } catch {
      // Use default plans
    }
  }, []);

  useEffect(() => {
    const savedVip = StorageService.getVipCode();
    if (savedVip) {
      setVipCode(savedVip);
      setIsVip(true);
    }
    refreshTrialStatus();
    loadPlans();
  }, [refreshTrialStatus, loadPlans]);

  // Clean up poll on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleSelectPlan = useCallback(async (planId: string) => {
    setOrderLoading(true);
    try {
      const order = await ApiService.createOrder(planId);
      setCurrentOrder(order);
      setPricingOpen(false);
      setQrModalOpen(true);
      startPolling(order.order_code);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể khởi tạo mã đơn hàng.";
      setStatusMessage(msg);
    } finally {
      setOrderLoading(false);
    }
  }, []);

  const startPolling = useCallback(
    (orderCode: string) => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const check = await ApiService.checkOrder(orderCode);
          if (check.status === "paid") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsVip(true);
            StorageService.setVipCode(orderCode);
            setVipCode(orderCode);
            setQrModalOpen(false);
            setStatusMessage("Thanh toán thành công! Gói VIP đã được kích hoạt tự động.");
            refreshTrialStatus();
          }
        } catch {
          // ignore transient network errors during poll
        }
      }, 2500);
    },
    [refreshTrialStatus]
  );

  const handleManualCheckOrder = useCallback(async () => {
    if (!currentOrder) return;
    try {
      const check = await ApiService.checkOrder(currentOrder.order_code);
      if (check.status === "paid") {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setIsVip(true);
        StorageService.setVipCode(currentOrder.order_code);
        setVipCode(currentOrder.order_code);
        setQrModalOpen(false);
        setStatusMessage("Thanh toán thành công! Gói VIP đã được kích hoạt.");
        refreshTrialStatus();
      } else {
        setStatusMessage("Hệ thống đang chờ ngân hàng đối soát. Quá trình thường mất 15-45 giây, vui lòng giữ màn hình.");
      }
    } catch {
      setStatusMessage("Không thể kiểm tra giao dịch lúc này. Hãy thử lại sau vài giây.");
    }
  }, [currentOrder, refreshTrialStatus]);

  const handleApplyVipCode = useCallback(
    async (code: string) => {
      const clean = code.trim().toUpperCase();
      if (!clean) return;

      try {
        const res = await ApiService.verifyVipPass(clean);
        if (res.valid) {
          StorageService.setVipCode(clean);
          setVipCode(clean);
          setIsVip(true);
          setStatusMessage("Kích hoạt mã VIP thành công! Cảm ơn bạn.");
          refreshTrialStatus();
          setPricingOpen(false);
        } else {
          setStatusMessage(res.message || "Mã VIP không hợp lệ hoặc đã hết hạn.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Mã VIP không tồn tại hoặc lỗi kết nối.";
        setStatusMessage(msg);
      }
    },
    [refreshTrialStatus]
  );

  const closeQrModal = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setQrModalOpen(false);
  }, []);

  return {
    plans,
    trialStatus,
    pricingOpen,
    setPricingOpen,
    qrModalOpen,
    closeQrModal,
    currentOrder,
    orderLoading,
    isVip,
    vipCode,
    statusMessage,
    setStatusMessage,
    handleSelectPlan,
    handleManualCheckOrder,
    handleApplyVipCode,
    refreshTrialStatus,
  };
}
