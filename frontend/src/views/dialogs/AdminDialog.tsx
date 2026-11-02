import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  Chip,
  Tabs,
  Tab,
  Alert,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import KeyIcon from "@mui/icons-material/Key";
import RefreshIcon from "@mui/icons-material/Refresh";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StorageIcon from "@mui/icons-material/Storage";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { ApiService } from "../../services/api";
import { StorageService } from "../../services/storage";
import { APPLE_PALETTE } from "../../theme/theme";
import { SpotlightCard } from "../common/SpotlightCard";

interface AdminDialogProps {
  open: boolean;
  onClose: () => void;
  onActivateVipCode: (code: string) => void;
  onRefreshTrial: () => void;
}

const ADMIN_STORAGE_KEY = "lensai_admin_session_secret";

export const AdminDialog: React.FC<AdminDialogProps> = ({
  open,
  onClose,
  onActivateVipCode,
  onRefreshTrial,
}) => {
  const [adminSecret, setAdminSecret] = useState<string>(
    () => sessionStorage.getItem(ADMIN_STORAGE_KEY) || ""
  );
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [tab, setTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [storageBackend, setStorageBackend] = useState<string>("");
  const [passes, setPasses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [taxReport, setTaxReport] = useState<any | null>(null);

  // Create pass form
  const [newPlanId, setNewPlanId] = useState<string>("pro_month");
  const [newPassCode, setNewPassCode] = useState<string>("");
  const [newCredits, setNewCredits] = useState<string>("100");
  const [newDays, setNewDays] = useState<string>("30");
  const newNote = "Tạo từ Admin Portal";

  const loadOverview = useCallback(
    async (secretToUse?: string) => {
      const sec = (secretToUse ?? adminSecret).trim();
      if (!sec) {
        setError("Vui lòng nhập mã bảo mật Admin (X-Admin-Secret).");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await ApiService.getAdminOverview(sec);
        sessionStorage.setItem(ADMIN_STORAGE_KEY, sec);
        setAuthenticated(true);
        setStorageBackend(res.storage_backend);
        setPasses(res.passes || []);
        setOrders(res.orders || []);
        setTaxReport(res.tax_report || null);
      } catch (err: unknown) {
        setAuthenticated(false);
        setError(err instanceof Error ? err.message : "Không thể kết nối Admin API.");
      } finally {
        setLoading(false);
      }
    },
    [adminSecret]
  );

  useEffect(() => {
    if (open && adminSecret) {
      loadOverview(adminSecret);
    }
  }, [open]);

  const handleCreatePass = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await ApiService.adminCreatePass(adminSecret, {
        plan_id: newPlanId,
        custom_credits: Number(newCredits) || undefined,
        custom_days: Number(newDays) || undefined,
        pass_code: newPassCode.trim() || undefined,
        note: newNote.trim() || "Created via Admin UI",
      });
      setNotice(`Đã tạo mã VIP mới: ${res.pass.code} (${res.pass.credits_total} credits)`);
      setNewPassCode("");
      await loadOverview();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tạo mã VIP.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePass = async (code: string, currentActive: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await ApiService.adminTogglePass(adminSecret, code, !currentActive);
      setNotice(`Đã ${!currentActive ? "mở khóa" : "khóa"} mã ${code}.`);
      await loadOverview();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái mã VIP.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.adminConfirmOrder(adminSecret, orderCode);
      setNotice(`Đã xác nhận đơn ${orderCode} -> Cấp mã VIP: ${res.order?.pass_code || ""}`);
      await loadOverview();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể xác nhận đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetMyTrial = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.adminResetTrial(adminSecret);
      StorageService.setVipCode("");
      onRefreshTrial();
      setNotice(
        `Đã reset hạn mức dùng thử cho thiết bị (${res.device_id}): Còn ${res.trial_status.link_remaining}/3 link, ${res.trial_status.srt_remaining}/1 SRT.`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể reset hạn mức dùng thử.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
          bgcolor: "rgba(18, 18, 22, 0.98)",
          backdropFilter: "blur(24px)",
          border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
          borderRadius: "22px",
          color: "#ffffff",
          },
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <AdminPanelSettingsIcon sx={{ color: "#ffd60a", fontSize: 26 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              LensAI Admin & QA Test Center
            </Typography>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
              Quản trị VIP Pass, duyệt đơn VietQR, xem báo cáo thuế và kiểm thử nhanh mọi kịch bản
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: APPLE_PALETTE.inkMuted }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: APPLE_PALETTE.hairline }}>
        {/* Admin Auth Bar */}
        <Box sx={{ mb: 2.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: "center" }}>
            <TextField
              size="small"
              fullWidth
              type="password"
              autoComplete="off"
              label="Mã bảo mật Admin (X-Admin-Secret)"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <KeyIcon sx={{ fontSize: 18, mr: 1, color: "#ffd60a" }} />,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => loadOverview(adminSecret)}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              sx={{ whiteSpace: "nowrap", bgcolor: APPLE_PALETTE.actionBlue, px: 2.5 }}
            >
              Đăng nhập / Làm mới
            </Button>
            {authenticated && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  sessionStorage.removeItem(ADMIN_STORAGE_KEY);
                  setAdminSecret("");
                  setAuthenticated(false);
                  setPasses([]);
                  setOrders([]);
                  setTaxReport(null);
                }}
                sx={{ whiteSpace: "nowrap", borderColor: "rgba(255,69,58,0.4)", color: "#ff453a" }}
              >
                Đăng xuất
              </Button>
            )}
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {notice && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: "12px" }} onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}

        {authenticated && (
          <>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ mb: 2.5, borderBottom: `1px solid ${APPLE_PALETTE.hairline}` }}
            >
              <Tab
                icon={<StorageIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Tổng quan & Công cụ Test"
                sx={{ textTransform: "none", fontWeight: 600 }}
              />
              <Tab
                icon={<WorkspacePremiumIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Mã VIP (${passes.length})`}
                sx={{ textTransform: "none", fontWeight: 600 }}
              />
              <Tab
                icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Đơn VietQR (${orders.length})`}
                sx={{ textTransform: "none", fontWeight: 600 }}
              />
            </Tabs>

            {/* TAB 0: OVERVIEW & QA SANDBOX */}
            {tab === 0 && (
              <Stack spacing={2.5}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <SpotlightCard sx={{ p: 2, borderRadius: "14px" }}>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                        Database đang kết nối
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#30d158", mt: 0.5 }}>
                        {storageBackend === "firebase_firestore" ? "Firebase Cloud Firestore" : "Local JSON Ledger"}
                      </Typography>
                    </SpotlightCard>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <SpotlightCard sx={{ p: 2, borderRadius: "14px" }}>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                        Doanh thu tháng ({taxReport?.period_month || "Hiện tại"})
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffd60a", mt: 0.5 }}>
                        {(taxReport?.monthly_gross_revenue_vnd || 0).toLocaleString("vi-VN")} đ (
                        {taxReport?.monthly_orders_count || 0} đơn)
                      </Typography>
                    </SpotlightCard>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <SpotlightCard sx={{ p: 2, borderRadius: "14px" }}>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                        Lợi nhuận ròng ước tính
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: APPLE_PALETTE.skyLink, mt: 0.5 }}>
                        {(taxReport?.monthly_estimated_net_profit_vnd || 0).toLocaleString("vi-VN")} đ
                      </Typography>
                    </SpotlightCard>
                  </Grid>
                </Grid>

                <SpotlightCard sx={{ p: 2.5, borderRadius: "16px" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Bộ công cụ Test nhanh (QA Sandbox 1-Click)
                  </Typography>
                  <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted, mb: 2 }}>
                    Dùng các nút dưới đây để chuyển đổi nhanh giữa chế độ Khách Dùng Thử (Free Trial) và VIP Pro mà không cần xóa dữ liệu trình duyệt:
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      startIcon={<RestartAltIcon />}
                      onClick={handleResetMyTrial}
                      sx={{ borderColor: "#30d158", color: "#30d158" }}
                    >
                      Reset 3 Link + 1 SRT Dùng Thử (Về Chế Độ Free)
                    </Button>
                    {passes.length > 0 && (
                      <Button
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => {
                          onActivateVipCode(passes[0].code);
                          onClose();
                        }}
                        sx={{ bgcolor: "#ffd60a", color: "#000", fontWeight: 700 }}
                      >
                        Kích hoạt nhanh mã VIP ({passes[0].code})
                      </Button>
                    )}
                  </Stack>
                </SpotlightCard>

                {taxReport?.tax_assessment && (
                  <SpotlightCard sx={{ p: 2.5, borderRadius: "16px" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Trạng thái Thuế TMĐT / SaaS Việt Nam 2026
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#e1e1e6", mb: 1 }}>
                      {taxReport.tax_assessment.status_note}
                    </Typography>
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                      Doanh thu lũy kế năm: {(taxReport.tax_assessment.ytd_revenue_vnd || 0).toLocaleString("vi-VN")} /{" "}
                      {(taxReport.tax_assessment.annual_threshold_vnd || 500000000).toLocaleString("vi-VN")} VNĐ · Quỹ
                      dự phòng 7%:{" "}
                      {(taxReport.tax_assessment.conservative_7pct_reserve_on_gross_vnd || 0).toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </Typography>
                  </SpotlightCard>
                )}
              </Stack>
            )}

            {/* TAB 1: VIP PASSES */}
            {tab === 1 && (
              <Stack spacing={2.5}>
                <SpotlightCard sx={{ p: 2.5, borderRadius: "16px" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Cấp mã VIP mới (Lưu trực tiếp vào {storageBackend})
                  </Typography>
                  <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Gói cước</InputLabel>
                        <Select value={newPlanId} label="Gói cước" onChange={(e) => setNewPlanId(e.target.value)}>
                          <MenuItem value="trial_day">Trải nghiệm 24h (19k)</MenuItem>
                          <MenuItem value="creator_week">Tuần Creator (59k)</MenuItem>
                          <MenuItem value="pro_month">Tháng Pro (169k)</MenuItem>
                          <MenuItem value="agency_month">Agency (399k)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Số Credits"
                        type="number"
                        value={newCredits}
                        onChange={(e) => setNewCredits(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Số ngày"
                        type="number"
                        value={newDays}
                        onChange={(e) => setNewDays(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Mã tùy chọn (VD: VIP-TEST)"
                        placeholder="Để trống = tự sinh"
                        value={newPassCode}
                        onChange={(e) => setNewPassCode(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AutoAwesomeIcon />}
                        onClick={handleCreatePass}
                        disabled={loading}
                        sx={{ bgcolor: "#30d158", color: "#000", fontWeight: 700 }}
                      >
                        Tạo mã
                      </Button>
                    </Grid>
                  </Grid>
                </SpotlightCard>

                <Stack spacing={1.2}>
                  {passes.map((p) => (
                    <SpotlightCard key={p.code} sx={{ p: 2, borderRadius: "14px" }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
                      >
                        <Box>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "monospace", color: "#ffd60a" }}>
                              {p.code}
                            </Typography>
                            <Chip
                              size="small"
                              label={!p.active ? "Đã khóa" : p.is_expired ? "Hết hạn" : "Đang hoạt động"}
                              color={!p.active ? "error" : p.is_expired ? "warning" : "success"}
                              sx={{ height: 20, fontSize: "0.7rem" }}
                            />
                            <Chip
                              size="small"
                              label={`${p.credits_remaining}/${p.credits_total} credits`}
                              sx={{ height: 20, fontSize: "0.7rem", bgcolor: APPLE_PALETTE.tile2, color: "#fff" }}
                            />
                          </Stack>
                          <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                            {p.plan_name} · Còn {p.remaining_days} ngày ({p.remaining_hours}h)
                            {p.order_code ? ` · Đơn: ${p.order_code}` : ""}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => {
                              onActivateVipCode(p.code);
                              onClose();
                            }}
                            sx={{ fontSize: "0.75rem" }}
                          >
                            Dùng mã này
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color={p.active ? "error" : "success"}
                            startIcon={p.active ? <LockIcon /> : <LockOpenIcon />}
                            onClick={() => handleTogglePass(p.code, p.active)}
                            sx={{ fontSize: "0.75rem" }}
                          >
                            {p.active ? "Khóa" : "Mở"}
                          </Button>
                        </Stack>
                      </Stack>
                    </SpotlightCard>
                  ))}
                </Stack>
              </Stack>
            )}

            {/* TAB 2: VIETQR ORDERS */}
            {tab === 2 && (
              <Stack spacing={1.5}>
                {orders.length === 0 ? (
                  <Typography variant="body2" sx={{ color: APPLE_PALETTE.inkMuted, py: 3, textAlign: "center" }}>
                    Chưa có đơn hàng VietQR nào. Hãy bấm chọn mua 1 gói ở bảng giá để tạo đơn và thử duyệt tại đây.
                  </Typography>
                ) : (
                  orders.map((o) => (
                    <SpotlightCard key={o.order_code} sx={{ p: 2, borderRadius: "14px" }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
                      >
                        <Box>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                              {o.order_code}
                            </Typography>
                            <Chip
                              size="small"
                              label={o.status === "paid" ? "Đã thanh toán" : "Chờ chuyển khoản"}
                              color={o.status === "paid" ? "success" : "warning"}
                              sx={{ height: 20, fontSize: "0.7rem" }}
                            />
                            <Typography variant="caption" sx={{ color: "#ffd60a", fontWeight: 700 }}>
                              {(o.amount_vnd || 0).toLocaleString("vi-VN")} đ
                            </Typography>
                          </Stack>
                          <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                            {o.plan_name} ({o.credits} credits / {o.duration_days} ngày)
                            {o.pass_code ? ` · Mã VIP đã cấp: ${o.pass_code}` : ""}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1}>
                          {o.status !== "paid" ? (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleConfirmOrder(o.order_code)}
                              disabled={loading}
                              sx={{ bgcolor: "#30d158", color: "#000", fontWeight: 700, fontSize: "0.75rem" }}
                            >
                              Xác nhận đã thanh toán (Giả lập SePay)
                            </Button>
                          ) : (
                            o.pass_code && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<PlayArrowIcon />}
                                onClick={() => {
                                  onActivateVipCode(o.pass_code);
                                  onClose();
                                }}
                                sx={{ fontSize: "0.75rem" }}
                              >
                                Kích hoạt {o.pass_code}
                              </Button>
                            )
                          )}
                        </Stack>
                      </Stack>
                    </SpotlightCard>
                  ))
                )}
              </Stack>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} size="small" sx={{ color: APPLE_PALETTE.inkMuted }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};
