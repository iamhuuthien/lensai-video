import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Avatar,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyIcon from "@mui/icons-material/Key";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import BoltIcon from "@mui/icons-material/Bolt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SecurityIcon from "@mui/icons-material/Security";
import InsightsIcon from "@mui/icons-material/Insights";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import type { UserProfile } from "../../models/types";
import { ApiService } from "../../services/api";
import { StorageService } from "../../services/storage";
import { APPLE_PALETTE } from "../../theme/theme";

interface AdminPageProps {
  onBackToApp: () => void;
  onActivateVipCode: (code: string) => Promise<void>;
  onRefreshTrial: () => void;
  currentUser: UserProfile | null;
  onUserLogin: (email: string, password: string) => Promise<UserProfile>;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onBackToApp,
  onActivateVipCode,
  onRefreshTrial,
  currentUser,
  onUserLogin,
}) => {
  const [adminSecret, setAdminSecret] = useState<string>(() => StorageService.getAdminSecret());
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [loginMode, setLoginMode] = useState<number>(0); // 0 = Secret Key, 1 = Admin Email/Password
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [adminActor, setAdminActor] = useState<{ uid: string; email: string; break_glass: boolean } | null>(null);

  const [tab, setTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dashboard Data
  const [storageBackend, setStorageBackend] = useState<string>("firestore");
  const [stats, setStats] = useState<any | null>(null);
  const [passes, setPasses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [taxReport, setTaxReport] = useState<any | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersTotal, setUsersTotal] = useState<number>(0);
  const [userQuery, setUserQuery] = useState<string>("");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Create Pass Form
  const [planId, setPlanId] = useState<string>("studio_month");
  const [customCredits, setCustomCredits] = useState<string>("200");
  const [customDays, setCustomDays] = useState<string>("30");
  const [customCode, setCustomCode] = useState<string>("");
  const [note, setNote] = useState<string>("QA / Creator Test Pass");
  const [lastCreatedCode, setLastCreatedCode] = useState<string>("");

  // Selected User Detail Modal
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [grantPlanId, setGrantPlanId] = useState<string>("creator_week");

  const loadAllDashboardData = useCallback(
    async (secretOverride?: string) => {
      const secretToUse = (secretOverride ?? adminSecret).trim();
      setLoading(true);
      setError(null);
      try {
        const [meRes, statsRes, overviewRes, usersRes, auditRes] = await Promise.all([
          ApiService.getAdminMe(secretToUse),
          ApiService.getAdminStats(secretToUse),
          ApiService.getAdminOverview(secretToUse),
          ApiService.getAdminUsers({ limit: 50, q: userQuery }, secretToUse),
          ApiService.getAdminAuditLogs(60, secretToUse),
        ]);

        if (secretToUse) {
          StorageService.setAdminSecret(secretToUse);
        }
        setAuthenticated(true);
        setAdminActor(meRes.admin);
        setStorageBackend(statsRes.storage_backend || overviewRes.storage_backend || "firestore");
        setStats(statsRes.stats);
        setPasses(overviewRes.passes || []);
        setOrders(overviewRes.orders || []);
        setTaxReport(overviewRes.tax_report || null);
        setUsers(usersRes.items || []);
        setUsersTotal(usersRes.total || 0);
        setAuditLogs(auditRes.items || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Không thể xác thực quyền Admin.";
        setAuthenticated(false);
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [adminSecret, userQuery]
  );

  useEffect(() => {
    const savedSecret = StorageService.getAdminSecret();
    const isUserAdmin = Boolean(currentUser?.is_admin || currentUser?.role === "admin");
    if (savedSecret || isUserAdmin) {
      loadAllDashboardData(savedSecret);
    }
  }, [currentUser, loadAllDashboardData]);

  const handleSecretLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminSecret.trim();
    if (!clean) {
      setError("Vui lòng nhập mã bảo mật Admin (X-Admin-Secret).");
      return;
    }
    setAdminSecret(clean);
    await loadAllDashboardData(clean);
  };

  const handleAccountAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const logged = await onUserLogin(adminEmail.trim(), adminPassword);
      if (!logged.is_admin && logged.role !== "admin") {
        setError(
          "Tài khoản này chưa được cấp quyền Quản trị viên (Admin). Hãy đăng nhập bằng Mã Bảo Mật Admin (Tab 1) rồi nâng quyền cho email này trong mục Quản lý Người dùng."
        );
        setLoading(false);
        return;
      }
      setAdminPassword("");
      await loadAllDashboardData("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng nhập tài khoản Admin thất bại.");
      setLoading(false);
    }
  };

  const handleLogoutAdmin = () => {
    StorageService.setAdminSecret("");
    setAdminSecret("");
    setAuthenticated(false);
    setAdminActor(null);
  };

  // ---- Pass & Order Actions ----
  const handleCreatePass = async (autoActivate: boolean = false) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await ApiService.adminCreatePass(adminSecret, {
        plan_id: planId,
        custom_credits: customCredits ? parseInt(customCredits, 10) : undefined,
        custom_days: customDays ? parseInt(customDays, 10) : undefined,
        pass_code: customCode.trim() || undefined,
        note: note.trim() || "Admin Created",
      });
      const code = res.pass?.code || "";
      setLastCreatedCode(code);
      setCustomCode("");
      if (autoActivate && code) {
        await onActivateVipCode(code);
        setSuccessMsg(`Đã tạo & kích hoạt ngay mã VIP: ${code} trên trình duyệt này!`);
      } else {
        setSuccessMsg(`Đã tạo mã VIP thành công: ${code}`);
      }
      await loadAllDashboardData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tạo mã VIP thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePass = async (code: string, currentActive: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await ApiService.adminTogglePass(adminSecret, code, !currentActive);
      setSuccessMsg(`Đã ${!currentActive ? "mở khóa" : "khóa"} mã ${code}`);
      await loadAllDashboardData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái mã.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderCode: string, amountVnd: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.adminConfirmOrder(adminSecret, orderCode, amountVnd);
      const passCode = res.order?.pass_code || "";
      setSuccessMsg(`Đã duyệt đơn ${orderCode}! Mã VIP phát hành: ${passCode}`);
      await loadAllDashboardData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Duyệt đơn hàng thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetDeviceTrial = async () => {
    setLoading(true);
    setError(null);
    try {
      await ApiService.adminResetTrial(adminSecret);
      StorageService.setVipCode("");
      onRefreshTrial();
      setSuccessMsg(
        `Đã reset hạn mức dùng thử (3 Link + 1 .SRT) cho thiết bị hiện tại (${StorageService.getDeviceId()})!`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset dùng thử thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // ---- User Management Actions ----
  const handleSearchUsers = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await ApiService.getAdminUsers({ limit: 50, q: userQuery }, adminSecret);
      setUsers(res.items || []);
      setUsersTotal(res.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (u: UserProfile) => {
    const nextStatus = u.status === "suspended" ? "active" : "suspended";
    setLoading(true);
    setError(null);
    try {
      await ApiService.adminSetUserStatus(u.uid, nextStatus, adminSecret);
      setSuccessMsg(
        `Đã ${nextStatus === "suspended" ? "tạm khóa" : "mở khóa"} tài khoản ${u.email}.`
      );
      await loadAllDashboardData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể đổi trạng thái tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserRole = async (u: UserProfile) => {
    const nextRole = u.role === "admin" ? "user" : "admin";
    setLoading(true);
    setError(null);
    try {
      await ApiService.adminSetUserRole(u.uid, nextRole, adminSecret);
      setSuccessMsg(
        `Đã cập nhật vai trò của ${u.email} thành ${nextRole.toUpperCase()}.`
      );
      await loadAllDashboardData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể đổi vai trò người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserDetail = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await ApiService.getAdminUserDetail(uid, adminSecret);
      setSelectedUserDetail(detail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải chi tiết người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPassToUser = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.adminGrantUserPass(
        uid,
        { plan_id: grantPlanId, note: `Admin granted (${grantPlanId})` },
        adminSecret
      );
      setSuccessMsg(`Đã cấp mã VIP ${res.pass?.code} trực tiếp vào tài khoản ${uid}!`);
      const detail = await ApiService.getAdminUserDetail(uid, adminSecret);
      setSelectedUserDetail(detail);
      await loadAllDashboardData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể cấp mã VIP cho người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeUserSessions = async (uid: string, email: string) => {
    setLoading(true);
    setError(null);
    try {
      await ApiService.adminRevokeUserSessions(uid, adminSecret);
      setSuccessMsg(`Đã thu hồi toàn bộ phiên đăng nhập của ${email}.`);
      await loadAllDashboardData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Thu hồi phiên đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#09090b", color: "#f5f5f7", pb: 8 }}>
      {/* Top Admin Header Bar */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          bgcolor: "rgba(12, 12, 14, 0.88)",
          backdropFilter: "saturate(180%) blur(20px)",
          borderBottom: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
          py: 1.5,
          px: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="xl" disableGutters>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={onBackToApp}
                sx={{
                  borderColor: APPLE_PALETTE.hairlineStrong,
                  color: "#fff",
                  borderRadius: "10px",
                  "&:hover": { borderColor: APPLE_PALETTE.skyLink, bgcolor: "rgba(41,151,255,0.08)" },
                }}
              >
                Ứng dụng LensAI
              </Button>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AdminPanelSettingsIcon sx={{ color: "#ffd60a", fontSize: 28 }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                    LensAI Admin Console & QA Center
                  </Typography>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                    Quản trị Người dùng Firebase · VIP Pass · Duyệt đơn VietQR · Báo cáo Thuế · ISO/IEC 27001 Audit
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {authenticated && (
                <>
                  <Chip
                    size="small"
                    icon={<VerifiedUserIcon sx={{ fontSize: "15px !important", color: "#30d158 !important" }} />}
                    label={`DB: ${storageBackend.toUpperCase()}`}
                    sx={{
                      bgcolor: "rgba(48, 209, 88, 0.12)",
                      color: "#30d158",
                      border: "1px solid rgba(48, 209, 88, 0.3)",
                      fontWeight: 700,
                    }}
                  />
                  {adminActor && (
                    <Chip
                      size="small"
                      label={adminActor.email ? `Admin: ${adminActor.email}` : "Admin: Break-Glass Secret"}
                      sx={{
                        bgcolor: "rgba(255, 214, 10, 0.12)",
                        color: "#ffd60a",
                        border: "1px solid rgba(255, 214, 10, 0.3)",
                        fontWeight: 600,
                      }}
                    />
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
                    onClick={() => loadAllDashboardData()}
                    disabled={loading}
                  >
                    Làm mới
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogoutAdmin}
                  >
                    Thoát Admin
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 4 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3, borderRadius: "14px" }}>
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ mb: 3, borderRadius: "14px" }}>
            {successMsg}
          </Alert>
        )}

        {/* Authentication Gate when not yet logged into Admin */}
        {!authenticated ? (
          <Box sx={{ maxWidth: 540, mx: "auto", mt: { xs: 2, md: 6 } }}>
            <Paper
              sx={{
                p: { xs: 3, sm: 4 },
                bgcolor: "#141416",
                border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
                borderRadius: "24px",
                boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "14px",
                    bgcolor: "rgba(255, 214, 10, 0.14)",
                    border: "1px solid rgba(255, 214, 10, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AdminPanelSettingsIcon sx={{ color: "#ffd60a", fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Đăng Nhập Trang Quản Trị
                  </Typography>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                    Xác thực bằng Mã Bảo Mật Hệ Thống (X-Admin-Secret) hoặc Tài khoản Admin
                  </Typography>
                </Box>
              </Box>

              <Tabs
                value={loginMode}
                onChange={(_, v) => {
                  setLoginMode(v);
                  setError(null);
                }}
                variant="fullWidth"
                sx={{
                  mb: 3,
                  bgcolor: "#1c1c1e",
                  borderRadius: "12px",
                  p: 0.5,
                  minHeight: 42,
                  "& .MuiTab-root": {
                    minHeight: 36,
                    borderRadius: "9px",
                    textTransform: "none",
                    fontWeight: 600,
                  },
                  "& .Mui-selected": {
                    bgcolor: "#ffd60a",
                    color: "#000 !important",
                  },
                  "& .MuiTabs-indicator": { display: "none" },
                }}
              >
                <Tab icon={<KeyIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Mã Bảo Mật (X-Admin-Secret)" />
                <Tab icon={<PeopleAltIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Tài Khoản Admin" />
              </Tabs>

              {loginMode === 0 ? (
                <Box component="form" onSubmit={handleSecretLogin} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Mã bảo mật Admin (X-Admin-Secret)"
                    type={showSecret ? "text" : "password"}
                    fullWidth
                    required
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder="Nhập mã bảo mật Admin (VD: Adm-...)"
                    slotProps={{
                      input: {
                        startAdornment: <KeyIcon sx={{ mr: 1, fontSize: 18, color: "#ffd60a" }} />,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowSecret((s) => !s)} edge="end">
                              {showSecret ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || !adminSecret.trim()}
                    sx={{
                      py: 1.3,
                      borderRadius: "12px",
                      bgcolor: "#ffd60a",
                      color: "#000",
                      fontWeight: 800,
                      "&:hover": { bgcolor: "#ffe033" },
                    }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : "Mở Bảng Điều Khiển Admin"}
                  </Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleAccountAdminLogin} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Email Quản trị viên"
                    type="email"
                    fullWidth
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@domain.com"
                  />
                  <TextField
                    label="Mật khẩu"
                    type={showSecret ? "text" : "password"}
                    fullWidth
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowSecret((s) => !s)} edge="end">
                              {showSecret ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || !adminEmail.trim() || !adminPassword}
                    sx={{ py: 1.3, borderRadius: "12px", fontWeight: 700 }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : "Đăng nhập bằng Tài khoản Admin"}
                  </Button>
                </Box>
              )}

              <Divider sx={{ my: 2.5, borderColor: APPLE_PALETTE.hairline }} />
              <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", lineHeight: 1.6 }}>
                💡 <strong>Mẹo bảo mật ISO/IEC 27001:</strong> Hệ thống tự động loại bỏ khoảng trắng thừa ở đầu/cuối khi bạn dán mã <code>X-Admin-Secret</code>. Sau khi đăng nhập bằng <code>X-Admin-Secret</code>, bạn có thể sang tab <strong>Quản lý Người dùng</strong> để nâng quyền <code>ADMIN</code> cho tài khoản Email của mình.
              </Typography>
            </Paper>
          </Box>
        ) : (
          /* Authenticated Full-Page Dashboard */
          <Box>
            {/* Navigation Tabs */}
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mb: 3,
                borderBottom: `1px solid ${APPLE_PALETTE.hairline}`,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  minHeight: 48,
                },
              }}
            >
              <Tab icon={<InsightsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="1. Tổng Quan & Biểu Đồ KPI" />
              <Tab
                icon={<PeopleAltIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`2. Quản Lý Người Dùng (${usersTotal})`}
              />
              <Tab
                icon={<CardGiftcardIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`3. VIP Pass (${passes.length}) & Đơn VietQR (${orders.length})`}
              />
              <Tab
                icon={<SecurityIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`4. Nhật Ký Bảo Mật ISO (${auditLogs.length})`}
              />
            </Tabs>

            {/* TAB 0: OVERVIEW & ANALYTICS */}
            {tab === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* KPI Cards */}
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2.5, bgcolor: "#141416", border: `1px solid ${APPLE_PALETTE.hairline}`, borderRadius: "18px" }}>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 600 }}>
                        TỔNG NGƯỜI DÙNG ĐĂNG KÝ
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: APPLE_PALETTE.skyLink, my: 0.5 }}>
                        {stats?.users?.total ?? usersTotal}
                      </Typography>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                        +{stats?.users?.new_7d ?? 0} trong 7 ngày · {stats?.users?.admins ?? 0} Admin
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2.5, bgcolor: "#141416", border: `1px solid ${APPLE_PALETTE.hairline}`, borderRadius: "18px" }}>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 600 }}>
                        MÃ VIP PASS ĐANG HOẠT ĐỘNG
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: "#ffd60a", my: 0.5 }}>
                        {stats?.passes?.active ?? passes.length} / {stats?.passes?.total ?? passes.length}
                      </Typography>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                        {stats?.passes?.claimed ?? 0} mã đã gắn cố định vào tài khoản
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2.5, bgcolor: "#141416", border: `1px solid ${APPLE_PALETTE.hairline}`, borderRadius: "18px" }}>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 600 }}>
                        ĐƠN HÀNG VIETQR
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: "#30d158", my: 0.5 }}>
                        {stats?.orders?.paid ?? 0} đã thanh toán
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#ff9f0a" }}>
                        {stats?.orders?.pending ?? 0} đơn đang chờ duyệt
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2.5, bgcolor: "#141416", border: "1px solid rgba(48, 209, 88, 0.3)", borderRadius: "18px" }}>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 600 }}>
                        LỢI NHUẬN RÒNG THÁNG NÀY
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: "#30d158", my: 0.5 }}>
                        {(stats?.tax_current_month?.net_profit_vnd || 0).toLocaleString("vi-VN")}đ
                      </Typography>
                      <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                        Gộp: {(stats?.tax_current_month?.gross_revenue_vnd || 0).toLocaleString("vi-VN")}đ · Thuế 7%: {(stats?.tax_current_month?.total_tax_vnd || 0).toLocaleString("vi-VN")}đ
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Charts Row */}
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Paper sx={{ p: 3, bgcolor: "#141416", border: `1px solid ${APPLE_PALETTE.hairline}`, borderRadius: "18px" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        Biểu đồ Đăng ký Tài khoản Mới (30 ngày gần nhất)
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.6, height: 140, pt: 2 }}>
                        {(stats?.signups_by_day || []).map((d: { date: string; count: number }) => {
                          const maxCount = Math.max(1, ...(stats?.signups_by_day || []).map((x: any) => x.count));
                          const h = Math.max(6, Math.round((d.count / maxCount) * 110));
                          return (
                            <Box
                              key={d.date}
                              title={`${d.date}: ${d.count} tài khoản`}
                              sx={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Box
                                sx={{
                                  width: "100%",
                                  height: h,
                                  borderRadius: "4px 4px 0 0",
                                  bgcolor: d.count > 0 ? APPLE_PALETTE.skyLink : "rgba(255,255,255,0.08)",
                                  transition: "height 0.3s ease",
                                }}
                              />
                            </Box>
                          );
                        })}
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                        <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                          {stats?.signups_by_day?.[0]?.date || "30 ngày trước"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                          Hôm nay ({stats?.signups_by_day?.[stats.signups_by_day.length - 1]?.date || ""})
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 5 }}>
                    <Paper sx={{ p: 3, bgcolor: "#141416", border: `1px solid ${APPLE_PALETTE.hairline}`, borderRadius: "18px", height: "100%" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        Doanh thu & Thuế 6 Tháng Gần Nhất
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                        {(stats?.revenue_by_month || []).map((m: any) => (
                          <Box
                            key={m.month}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              p: 1,
                              borderRadius: "10px",
                              bgcolor: "#1c1c1e",
                            }}
                          >
                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                              {m.month} ({m.orders} đơn)
                            </Typography>
                            <Box sx={{ textAlign: "right" }}>
                              <Typography variant="body2" sx={{ color: "#30d158", fontWeight: 700 }}>
                                +{Number(m.net_profit_vnd || 0).toLocaleString("vi-VN")}đ
                              </Typography>
                              <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                                Thuế: {Number(m.total_tax_vnd || 0).toLocaleString("vi-VN")}đ
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Quick QA Actions */}
                <Paper sx={{ p: 3, bgcolor: "#141416", border: `1px solid ${APPLE_PALETTE.hairline}`, borderRadius: "18px" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "#ffd60a" }}>
                    ⚡ Công Cụ Kiểm Thử Nhanh (QA Test Center)
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      startIcon={<RestartAltIcon />}
                      onClick={handleResetDeviceTrial}
                      disabled={loading}
                    >
                      Reset 3 Lượt Link + 1 .SRT Cho Thiết Bị Hiện Tại ({StorageService.getDeviceId()})
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<BoltIcon />}
                      onClick={() => handleCreatePass(true)}
                      disabled={loading}
                      sx={{ bgcolor: "#30d158", color: "#000", fontWeight: 700, "&:hover": { bgcolor: "#28b84c" } }}
                    >
                      Tạo & Kích Hoạt Ngay Mã VIP Test Trên Trình Duyệt Này
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}

            {/* TAB 1: USER MANAGEMENT */}
            {tab === 1 && (
              <Paper sx={{ p: 3, bgcolor: "#141416", border: `1px solid ${APPLE_PALETTE.hairline}`, borderRadius: "18px" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2.5 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Quản Lý Tài Khoản Người Dùng (`lensai_users`)
                    </Typography>
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                      Tìm kiếm theo tiền tố email, nâng/hạ quyền Admin, khóa tài khoản vi phạm hoặc cấp trực tiếp mã VIP Pass
                    </Typography>
                  </Box>
                  <Box component="form" onSubmit={handleSearchUsers} sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Tìm theo email..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <SearchIcon sx={{ fontSize: 18, mr: 0.8, color: APPLE_PALETTE.inkMuted }} />,
                        },
                      }}
                    />
                    <Button type="submit" variant="contained" size="small" disabled={loading}>
                      Tìm kiếm
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Người dùng</TableCell>
                        <TableCell>Vai trò</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>Đăng nhập</TableCell>
                        <TableCell align="right">Thao tác quản trị</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.uid} hover>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: "0.85rem", bgcolor: u.role === "admin" ? "#ffd60a" : APPLE_PALETTE.actionBlue, color: u.role === "admin" ? "#000" : "#fff", fontWeight: 700 }}>
                                {(u.display_name || u.email || "U").slice(0, 1).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {u.display_name || "Chưa đặt tên"}
                                </Typography>
                                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontFamily: "monospace" }}>
                                  {u.email} · {u.uid}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={u.role === "admin" ? "ADMIN" : "USER"}
                              sx={{
                                fontWeight: 700,
                                bgcolor: u.role === "admin" ? "rgba(255, 214, 10, 0.16)" : "rgba(255,255,255,0.06)",
                                color: u.role === "admin" ? "#ffd60a" : APPLE_PALETTE.inkMuted,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={u.status === "suspended" ? "Tạm khóa" : "Hoạt động"}
                              color={u.status === "suspended" ? "error" : "success"}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ display: "block" }}>
                              #{u.login_count || 1} lần
                            </Typography>
                            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                              {(u.last_login_iso || u.created_iso || "").slice(0, 16).replace("T", " ")}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.8, flexWrap: "wrap" }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleOpenUserDetail(u.uid)}
                                sx={{ fontSize: "0.72rem", py: 0.3 }}
                              >
                                Chi tiết / Cấp VIP
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color={u.role === "admin" ? "warning" : "info"}
                                onClick={() => handleToggleUserRole(u)}
                                sx={{ fontSize: "0.72rem", py: 0.3 }}
                              >
                                {u.role === "admin" ? "Hạ xuống User" : "Nâng lên Admin"}
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color={u.status === "suspended" ? "success" : "error"}
                                onClick={() => handleToggleUserStatus(u)}
                                sx={{ fontSize: "0.72rem", py: 0.3 }}
                              >
                                {u.status === "suspended" ? "Mở khóa" : "Khóa"}
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: APPLE_PALETTE.inkMuted }}>
                            Chưa có tài khoản người dùng nào phù hợp.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            )}

            {/* TAB 2: VIP PASSES, VIETQR ORDERS & TAX */}
            {tab === 2 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Create VIP Pass */}
                <Paper sx={{ p: 3, bgcolor: "#141416", border: `1px solid ${APPLE_PALETTE.hairline}`, borderRadius: "18px" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "#ffd60a" }}>
                    1. Tạo Mã VIP Pass Mới & Kích Hoạt Nhanh
                  </Typography>
                  <Grid container spacing={2} sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Gói cơ sở</InputLabel>
                        <Select
                          value={planId}
                          label="Gói cơ sở"
                          onChange={(e) => {
                            const val = e.target.value;
                            setPlanId(val);
                            if (val === "trial_day") {
                              setCustomCredits("10");
                              setCustomDays("1");
                            } else if (val === "creator_week") {
                              setCustomCredits("45");
                              setCustomDays("7");
                            } else {
                              setCustomCredits("200");
                              setCustomDays("30");
                            }
                          }}
                        >
                          <MenuItem value="trial_day">Trải Nghiệm 24h (10 lượt)</MenuItem>
                          <MenuItem value="creator_week">Creator Tuần (45 lượt)</MenuItem>
                          <MenuItem value="studio_month">Pro Studio Tháng (200 lượt)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        label="Số lượt (Credits)"
                        size="small"
                        type="number"
                        fullWidth
                        value={customCredits}
                        onChange={(e) => setCustomCredits(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        label="Số ngày hạn"
                        size="small"
                        type="number"
                        fullWidth
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2.5 }}>
                      <TextField
                        label="Mã tùy chọn (để trống = tự sinh)"
                        size="small"
                        fullWidth
                        placeholder="VD: VIP-TEST-999"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2.5 }}>
                      <TextField
                        label="Ghi chú"
                        size="small"
                        fullWidth
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap", alignItems: "center" }}>
                    <Button variant="contained" onClick={() => handleCreatePass(false)} disabled={loading}>
                      Tạo Mã VIP
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<BoltIcon />}
                      onClick={() => handleCreatePass(true)}
                      disabled={loading}
                      sx={{ bgcolor: "#30d158", color: "#000", fontWeight: 700, "&:hover": { bgcolor: "#28b84c" } }}
                    >
                      Tạo & Kích Hoạt Ngay Trên Trình Duyệt Này
                    </Button>
                    {lastCreatedCode && (
                      <Chip
                        label={`Mã vừa tạo: ${lastCreatedCode}`}
                        color="success"
                        onDelete={() => navigator.clipboard.writeText(lastCreatedCode)}
                        deleteIcon={<ContentCopyIcon />}
                      />
                    )}
                  </Box>
                </Paper>

                {/* VietQR Orders */}
                <Paper sx={{ p: 3, bgcolor: "#141416", border: `1px solid ${APPLE_PALETTE.hairline}`, borderRadius: "18px" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                    2. Đơn Hàng VietQR ({orders.length})
                  </Typography>
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Mã Đơn</TableCell>
                          <TableCell>Gói</TableCell>
                          <TableCell>Số tiền</TableCell>
                          <TableCell>Trạng thái</TableCell>
                          <TableCell>Mã VIP phát hành</TableCell>
                          <TableCell align="right">Hành động</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orders.map((o) => (
                          <TableRow key={o.order_code} hover>
                            <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>{o.order_code}</TableCell>
                            <TableCell>{o.plan_name || o.plan_id}</TableCell>
                            <TableCell>{Number(o.amount_vnd || 0).toLocaleString("vi-VN")}đ</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={o.status === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}
                                color={o.status === "paid" ? "success" : "warning"}
                              />
                            </TableCell>
                            <TableCell sx={{ fontFamily: "monospace", color: "#ffd60a" }}>{o.pass_code || "—"}</TableCell>
                            <TableCell align="right">
                              {o.status !== "paid" ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleConfirmOrder(o.order_code, o.amount_vnd)}
                                  disabled={loading}
                                >
                                  Duyệt & Cấp VIP
                                </Button>
                              ) : (
                                o.pass_code && (
                                  <Button size="small" variant="text" onClick={() => onActivateVipCode(o.pass_code)}>
                                    Dùng mã này
                                  </Button>
                                )
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {orders.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ color: APPLE_PALETTE.inkMuted, py: 3 }}>
                              Chưa có đơn hàng nào.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>

                {/* VIP Passes Table */}
                <Paper sx={{ p: 3, bgcolor: "#141416", border: `1px solid ${APPLE_PALETTE.hairline}`, borderRadius: "18px" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                    3. Danh Sách Mã VIP Pass ({passes.length})
                  </Typography>
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Mã VIP</TableCell>
                          <TableCell>Gói</TableCell>
                          <TableCell>Lượt còn lại</TableCell>
                          <TableCell>Hạn còn lại</TableCell>
                          <TableCell>Trạng thái</TableCell>
                          <TableCell align="right">Thao tác</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {passes.map((p) => (
                          <TableRow key={p.code} hover>
                            <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: "#ffd60a" }}>{p.code}</TableCell>
                            <TableCell>{p.plan_name}</TableCell>
                            <TableCell>
                              {p.credits_remaining}/{p.credits_total}
                            </TableCell>
                            <TableCell>{p.remaining_days} ngày</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={!p.active ? "Đã khóa" : p.is_expired ? "Hết hạn" : "Hoạt động"}
                                color={!p.active || p.is_expired ? "error" : "success"}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                onClick={async () => {
                                  await onActivateVipCode(p.code);
                                  setSuccessMsg(`Đã kích hoạt mã ${p.code} trên trình duyệt hiện tại!`);
                                }}
                                sx={{ mr: 0.5 }}
                              >
                                Dùng thử
                              </Button>
                              <IconButton
                                size="small"
                                title="Copy mã"
                                onClick={() => {
                                  navigator.clipboard.writeText(p.code);
                                  setSuccessMsg(`Đã sao chép mã: ${p.code}`);
                                }}
                              >
                                <ContentCopyIcon fontSize="inherit" />
                              </IconButton>
                              <IconButton
                                size="small"
                                title={p.active ? "Khóa mã" : "Mở khóa mã"}
                                onClick={() => handleTogglePass(p.code, p.active)}
                                color={p.active ? "warning" : "success"}
                              >
                                {p.active ? <BlockIcon fontSize="inherit" /> : <CheckCircleIcon fontSize="inherit" />}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>

                {/* Tax Report */}
                {taxReport && (
                  <Paper sx={{ p: 3, bgcolor: "#141416", border: `1px solid ${APPLE_PALETTE.hairline}`, borderRadius: "18px" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                      <ReceiptLongIcon sx={{ color: "#30d158", fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#30d158" }}>
                        4. Báo Cáo Doanh Thu & Thuế Hộ Kinh Doanh Cá Thể VN (GTGT 5% + TNCN 2%)
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 1 }}>
                      {taxReport.tax_policy} — {taxReport.threshold_warning}
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* TAB 3: ISO 27001 SECURITY AUDIT LOGS */}
            {tab === 3 && (
              <Paper sx={{ p: 3, bgcolor: "#141416", border: `1px solid ${APPLE_PALETTE.hairline}`, borderRadius: "18px" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Nhật Ký Bảo Mật & Kiểm Toán Hệ Thống (`lensai_audit_logs` — ISO/IEC 27001)
                </Typography>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 2 }}>
                  Ghi nhận tự động mọi sự kiện đăng ký, đăng nhập Admin, tạo/cấp mã VIP, khóa người dùng và xuất/xóa dữ liệu cá nhân.
                </Typography>

                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Thời gian (UTC)</TableCell>
                        <TableCell>Hành động</TableCell>
                        <TableCell>Tác nhân (Actor)</TableCell>
                        <TableCell>Đối tượng (Target)</TableCell>
                        <TableCell>Kết quả</TableCell>
                        <TableCell>IP</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                            {(log.iso || "").slice(0, 19).replace("T", " ")}
                          </TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: APPLE_PALETTE.skyLink }}>
                            {log.action}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.8rem" }}>
                            {log.actor_email || log.actor_uid}
                          </TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                            {log.target_type ? `${log.target_type}:${log.target_id}` : "—"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={log.outcome}
                              color={log.outcome === "success" ? "success" : "error"}
                              sx={{ height: 20, fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem", color: APPLE_PALETTE.inkMuted }}>
                            {log.ip}
                          </TableCell>
                        </TableRow>
                      ))}
                      {auditLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: APPLE_PALETTE.inkMuted }}>
                            Chưa có bản ghi kiểm toán nào.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </Container>

      {/* User Detail & Direct Grant Pass Modal */}
      <Dialog
        open={Boolean(selectedUserDetail)}
        onClose={() => setSelectedUserDetail(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: "#141416",
              border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
              borderRadius: "20px",
            },
          },
        }}
      >
        {selectedUserDetail && (
          <>
            <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${APPLE_PALETTE.hairline}` }}>
              Hồ Sơ Chi Tiết: {selectedUserDetail.user?.display_name || selectedUserDetail.user?.email}
            </DialogTitle>
            <DialogContent sx={{ pt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
                  UID: <code>{selectedUserDetail.user?.uid}</code> · Email: <code>{selectedUserDetail.user?.email}</code>
                </Typography>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block" }}>
                  Lịch sử đám mây: {selectedUserDetail.history_count || 0} video · Số mã VIP sở hữu: {(selectedUserDetail.passes || []).length}
                </Typography>
              </Box>

              <Paper sx={{ p: 2, bgcolor: "#1c1c1e", borderRadius: "12px" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ffd60a", mb: 1.2 }}>
                  Cấp Trực Tiếp Mã VIP Pass Cho Tài Khoản Này
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Chọn gói VIP</InputLabel>
                    <Select
                      value={grantPlanId}
                      label="Chọn gói VIP"
                      onChange={(e) => setGrantPlanId(e.target.value)}
                    >
                      <MenuItem value="trial_day">Trải Nghiệm 24h (10 lượt)</MenuItem>
                      <MenuItem value="creator_week">Creator Tuần (45 lượt)</MenuItem>
                      <MenuItem value="studio_month">Pro Studio Tháng (200 lượt)</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    disabled={loading}
                    onClick={() => handleGrantPassToUser(selectedUserDetail.user.uid)}
                    sx={{ whiteSpace: "nowrap", fontWeight: 700 }}
                  >
                    Cấp VIP Ngay
                  </Button>
                </Box>
              </Paper>

              {(selectedUserDetail.passes || []).length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: APPLE_PALETTE.inkMuted }}>
                    MÃ VIP ĐANG GẮN VỚI TÀI KHOẢN:
                  </Typography>
                  {(selectedUserDetail.passes || []).map((p: any) => (
                    <Box key={p.code} sx={{ display: "flex", justifyContent: "space-between", py: 0.6 }}>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#ffd60a", fontWeight: 700 }}>
                        {p.code} ({p.plan_name})
                      </Typography>
                      <Typography variant="caption">
                        Còn {p.credits_remaining}/{p.credits_total} lượt ({p.remaining_days} ngày)
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1 }}>
                <Button
                  size="small"
                  color="warning"
                  variant="outlined"
                  onClick={() => handleRevokeUserSessions(selectedUserDetail.user.uid, selectedUserDetail.user.email)}
                >
                  Thu hồi mọi phiên đăng nhập
                </Button>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5, borderTop: `1px solid ${APPLE_PALETTE.hairline}` }}>
              <Button onClick={() => setSelectedUserDetail(null)}>Đóng</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
