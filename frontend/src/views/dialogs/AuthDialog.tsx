import React, { useState, useEffect } from "react";
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
  Tabs,
  Tab,
  Alert,
  Chip,
  Divider,
  Avatar,
  InputAdornment,
  CircularProgress,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DiamondIcon from "@mui/icons-material/Diamond";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import DownloadIcon from "@mui/icons-material/Download";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import type { UserProfile } from "../../models/types";
import { ApiService } from "../../services/api";
import { ExportService } from "../../services/export";
import { StorageService } from "../../services/storage";
import { APPLE_PALETTE } from "../../theme/theme";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  proStatus: any | null;
  loading: boolean;
  error: string | null;
  onClearError: () => void;
  onLogin: (email: string, password: string) => Promise<UserProfile>;
  onRegister: (email: string, password: string, displayName: string) => Promise<UserProfile>;
  onGoogleLogin?: () => Promise<UserProfile>;
  onLogout: () => void;
  onRefreshMe: () => Promise<UserProfile | null>;
  onRefreshTrial: () => void;
  onOpenAdminPage: () => void;
}

const GoogleGIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.33-2.05 3.05l3.3 2.56c1.93-1.78 3.05-4.4 3.05-7.56 0-.72-.06-1.42-.19-2.09H12z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.75 0 5.06-.91 6.75-2.46l-3.3-2.56c-.91.61-2.08.98-3.45.98-2.65 0-4.9-1.79-5.7-4.2l-3.41 2.64C4.57 19.74 8.01 22 12 22z"
    />
    <path
      fill="#4A90E2"
      d="M6.3 13.76A5.98 5.98 0 0 1 6 12c0-.61.11-1.2.3-1.76L2.89 7.6A9.96 9.96 0 0 0 2 12c0 1.61.39 3.14 1.07 4.49l3.23-2.73z"
    />
    <path
      fill="#FBBC05"
      d="M12 5.98c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 2.94 14.75 2 12 2 8.01 2 4.57 4.26 2.89 7.6l3.41 2.64c.8-2.41 3.05-4.26 5.7-4.26z"
    />
  </svg>
);

export const AuthDialog: React.FC<AuthDialogProps> = ({
  open,
  onClose,
  user,
  proStatus,
  loading,
  error,
  onClearError,
  onLogin,
  onRegister,
  onGoogleLogin,
  onLogout,
  onRefreshMe,
  onRefreshTrial,
  onOpenAdminPage,
}) => {
  const [tab, setTab] = useState<number>(0); // 0 = Login, 1 = Register
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Account management states
  const [editName, setEditName] = useState<string>("");
  const [redeemCode, setRedeemCode] = useState<string>(() => StorageService.getVipCode());
  const [orders, setOrders] = useState<any[]>([]);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    if (user && open) {
      setEditName(user.display_name || "");
      setRedeemCode(StorageService.getVipCode() || "");
      ApiService.getMyOrders()
        .then((res) => setOrders(res.orders || []))
        .catch(() => setOrders([]));
    }
  }, [user, open]);

  const handleSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);
    onClearError();
    try {
      if (tab === 0) {
        const logged = await onLogin(email.trim(), password);
        setLocalSuccess(`Chào mừng trở lại, ${logged.display_name || logged.email}!`);
      } else {
        const created = await onRegister(email.trim(), password, displayName.trim());
        setLocalSuccess(`Đã tạo tài khoản thành công cho ${created.email}!`);
      }
      setPassword("");
    } catch {
      // handled via error prop
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setBusy(true);
    setLocalError(null);
    setLocalSuccess(null);
    try {
      await ApiService.patchProfile({ display_name: editName.trim() });
      await onRefreshMe();
      setLocalSuccess("Đã cập nhật tên hiển thị thành công.");
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Không thể cập nhật hồ sơ.");
    } finally {
      setBusy(false);
    }
  };

  const handleRedeemPass = async () => {
    const clean = redeemCode.trim().toUpperCase();
    if (!clean) return;
    setBusy(true);
    setLocalError(null);
    setLocalSuccess(null);
    try {
      const res = await ApiService.redeemPassToAccount(clean);
      StorageService.setVipCode(clean);
      await onRefreshMe();
      onRefreshTrial();
      setLocalSuccess(res.message || `Đã liên kết mã VIP ${clean} vào tài khoản!`);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Không thể liên kết mã VIP.");
    } finally {
      setBusy(false);
    }
  };

  const handleExportData = async () => {
    setBusy(true);
    setLocalError(null);
    try {
      const res = await ApiService.exportMyData();
      ExportService.downloadFile(
        `lensai_account_${user?.uid || "export"}.json`,
        JSON.stringify(res.data, null, 2),
        "application/json"
      );
      setLocalSuccess("Đã tải xuống hồ sơ dữ liệu cá nhân (.JSON).");
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Không thể xuất dữ liệu.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !confirmDeleteEmail.trim()) return;
    setBusy(true);
    setLocalError(null);
    try {
      await ApiService.deleteMyAccount(confirmDeleteEmail.trim());
      onLogout();
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Không thể xóa tài khoản.");
    } finally {
      setBusy(false);
    }
  };

  const isAdmin = Boolean(user?.is_admin || user?.role === "admin");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#141416",
            backgroundImage: "none",
            border: `1px solid ${APPLE_PALETTE.hairlineStrong}`,
            borderRadius: "22px",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${APPLE_PALETTE.hairline}`,
          pb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <PersonIcon sx={{ color: APPLE_PALETTE.skyLink, fontSize: 26 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {user ? "Tài Khoản & Quyền Lợi Của Bạn" : "Đăng Nhập / Tạo Tài Khoản LensAI"}
            </Typography>
            <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
              {user
                ? "Đồng bộ lịch sử 15 ngày, bảo vệ mã VIP và quản lý dữ liệu cá nhân theo chuẩn ISO/IEC 27001"
                : "Lưu trữ lịch sử đám mây, gắn kết mã VIP vĩnh viễn và sử dụng trên nhiều thiết bị"}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: APPLE_PALETTE.inkMuted }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {(error || localError) && (
          <Alert
            severity="error"
            onClose={() => {
              onClearError();
              setLocalError(null);
            }}
            sx={{ mb: 2, borderRadius: "12px" }}
          >
            {localError || error}
          </Alert>
        )}

        {localSuccess && (
          <Alert severity="success" onClose={() => setLocalSuccess(null)} sx={{ mb: 2, borderRadius: "12px" }}>
            {localSuccess}
          </Alert>
        )}

        {!user ? (
          <Box component="form" onSubmit={handleSubmitAuth}>
            <Tabs
              value={tab}
              onChange={(_, v) => {
                setTab(v);
                onClearError();
                setLocalError(null);
              }}
              variant="fullWidth"
              sx={{
                mb: 2.5,
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
                  bgcolor: APPLE_PALETTE.actionBlue,
                  color: "#fff !important",
                },
                "& .MuiTabs-indicator": { display: "none" },
              }}
            >
              <Tab label="Đăng nhập" />
              <Tab label="Tạo tài khoản mới" />
            </Tabs>

            {onGoogleLogin && (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={<GoogleGIcon />}
                  onClick={async () => {
                    setLocalError(null);
                    setLocalSuccess(null);
                    onClearError();
                    try {
                      const gUser = await onGoogleLogin();
                      setLocalSuccess(`Đã đăng nhập Google thành công: ${gUser.email}`);
                    } catch {
                      // handled via error prop
                    }
                  }}
                  sx={{
                    mb: 2,
                    py: 1.2,
                    borderRadius: "12px",
                    bgcolor: "#ffffff",
                    color: "#111111",
                    borderColor: "#ffffff",
                    fontWeight: 700,
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: "#f2f2f7",
                      borderColor: "#f2f2f7",
                    },
                  }}
                >
                  Tiếp tục nhanh bằng Google (Firebase Auth)
                </Button>

                <Divider sx={{ mb: 2, borderColor: APPLE_PALETTE.hairline }}>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                    hoặc dùng Email & Mật khẩu
                  </Typography>
                </Divider>
              </>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {tab === 1 && (
                <TextField
                  label="Tên hiển thị của bạn"
                  placeholder="VD: Minh Creator"
                  fullWidth
                  size="small"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 60 } }}
                />
              )}

              <TextField
                label="Địa chỉ Email"
                type="email"
                placeholder="ban@domain.com"
                required
                fullWidth
                size="small"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                label="Mật khẩu"
                type={showPassword ? "text" : "password"}
                placeholder={tab === 1 ? "Tối thiểu 8 ký tự" : "Nhập mật khẩu của bạn"}
                required
                fullWidth
                size="small"
                autoComplete={tab === 1 ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword((s) => !s)}
                          edge="end"
                          aria-label="Hiện/ẩn mật khẩu"
                        >
                          {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
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
                disabled={loading || !email.trim() || !password}
                sx={{
                  mt: 0.5,
                  py: 1.2,
                  borderRadius: "12px",
                  fontWeight: 700,
                }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : tab === 0 ? (
                  "Đăng nhập ngay"
                ) : (
                  "Đăng ký & Đồng bộ tài khoản"
                )}
              </Button>
            </Box>

            <Paper
              sx={{
                mt: 2.5,
                p: 2,
                bgcolor: "rgba(41, 151, 255, 0.06)",
                border: "1px solid rgba(41, 151, 255, 0.18)",
                borderRadius: "14px",
              }}
            >
              <Typography variant="caption" sx={{ color: "#d1d1d6", display: "block", mb: 0.5, fontWeight: 600 }}>
                <VerifiedUserIcon sx={{ fontSize: 15, verticalAlign: "text-bottom", mr: 0.6, color: APPLE_PALETTE.skyLink }} />
                Quyền lợi khi đăng nhập tài khoản:
              </Typography>
              <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", lineHeight: 1.6 }}>
                • Tự động đồng bộ lịch sử video & phụ đề `.SRT` từ chế độ khách sang tài khoản.<br />
                • Liên kết mã VIP Pass vào tài khoản — đăng nhập trên máy tính hay điện thoại đều tự nhận VIP.<br />
                • Dành cho Quản trị viên: mở trực tiếp <strong>Trang Quản Trị (/admin)</strong> để quản lý hệ thống.
              </Typography>
              <Box sx={{ mt: 1.5, pt: 1.2, borderTop: `1px solid ${APPLE_PALETTE.hairline}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                  Bạn là Quản trị viên hệ thống?
                </Typography>
                <Button
                  size="small"
                  startIcon={<AdminPanelSettingsIcon sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    onClose();
                    onOpenAdminPage();
                  }}
                  sx={{ color: "#ffd60a", fontSize: "0.75rem", fontWeight: 600 }}
                >
                  Mở Trang Admin (/admin)
                </Button>
              </Box>
            </Paper>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Profile Summary Card */}
            <Paper
              sx={{
                p: 2,
                bgcolor: "#1c1c1e",
                border: `1px solid ${APPLE_PALETTE.hairline}`,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  src={user.photo_url || undefined}
                  sx={{
                    width: 46,
                    height: 46,
                    bgcolor: isAdmin ? "#ffd60a" : APPLE_PALETTE.actionBlue,
                    color: isAdmin ? "#000" : "#fff",
                    fontWeight: 700,
                  }}
                >
                  {(user.display_name || user.email || "U").slice(0, 1).toUpperCase()}
                </Avatar>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {user.display_name || user.email}
                    </Typography>
                    <Chip
                      label={isAdmin ? "ADMIN" : "THÀNH VIÊN"}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        bgcolor: isAdmin ? "rgba(255, 214, 10, 0.16)" : "rgba(41, 151, 255, 0.15)",
                        color: isAdmin ? "#ffd60a" : APPLE_PALETTE.skyLink,
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted }}>
                    {user.email} · Đăng nhập #{user.login_count || 1}
                  </Typography>
                </Box>
              </Box>

              {isAdmin && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AdminPanelSettingsIcon />}
                  onClick={() => {
                    onClose();
                    onOpenAdminPage();
                  }}
                  sx={{
                    bgcolor: "#ffd60a",
                    color: "#000",
                    fontWeight: 700,
                    "&:hover": { bgcolor: "#ffdf38" },
                  }}
                >
                  Mở Trang Admin
                </Button>
              )}
            </Paper>

            {/* Display Name Update */}
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                label="Tên hiển thị"
                size="small"
                fullWidth
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                disabled={busy || !editName.trim() || editName.trim() === user.display_name}
                onClick={handleSaveName}
                sx={{ whiteSpace: "nowrap" }}
              >
                Lưu tên
              </Button>
            </Box>

            {/* VIP Pass Binding Section */}
            <Paper
              sx={{
                p: 2,
                bgcolor: "rgba(255, 214, 10, 0.05)",
                border: "1px solid rgba(255, 214, 10, 0.25)",
                borderRadius: "16px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#ffd60a", display: "flex", alignItems: "center", gap: 0.8 }}>
                  <DiamondIcon sx={{ fontSize: 18 }} />
                  Liên Kết Mã VIP Pass Vào Tài Khoản
                </Typography>
                {proStatus && (
                  <Chip
                    size="small"
                    label={`Còn ${proStatus.credits_remaining}/${proStatus.credits_total} lượt`}
                    color="success"
                  />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, display: "block", mb: 1.5 }}>
                Khi gắn mã VIP vào tài khoản, bạn không cần nhớ hay nhập lại mã trên các thiết bị khác.
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Nhập mã VIP (VD: VIP-XXXX-XXXX)"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                />
                <Button
                  variant="contained"
                  disabled={busy || !redeemCode.trim()}
                  onClick={handleRedeemPass}
                  sx={{ whiteSpace: "nowrap", fontWeight: 700 }}
                >
                  Gắn mã VIP
                </Button>
              </Box>
            </Paper>

            {/* Orders list if any */}
            {orders.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: APPLE_PALETTE.inkMuted, fontWeight: 600, display: "block", mb: 1 }}>
                  ĐƠN HÀNG VIETQR CỦA BẠN ({orders.length})
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 140, overflowY: "auto" }}>
                  {orders.map((o) => (
                    <Paper
                      key={o.order_code}
                      sx={{
                        p: 1.2,
                        bgcolor: "#1c1c1e",
                        border: `1px solid ${APPLE_PALETTE.hairline}`,
                        borderRadius: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                          {o.order_code} · {o.plan_name || o.plan_id}
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", color: APPLE_PALETTE.inkMuted }}>
                          {Number(o.amount_vnd || 0).toLocaleString("vi-VN")}đ
                          {o.pass_code ? ` · Mã: ${o.pass_code}` : ""}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={o.status === "paid" ? "Đã thanh toán" : "Chờ duyệt"}
                        color={o.status === "paid" ? "success" : "warning"}
                      />
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ borderColor: APPLE_PALETTE.hairline }} />

            {/* ISO/GDPR Privacy & Security Actions */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  disabled={busy}
                  onClick={handleExportData}
                >
                  Tải dữ liệu (.JSON)
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="text"
                  startIcon={<DeleteIcon />}
                  onClick={() => setShowDeleteConfirm((prev) => !prev)}
                >
                  Xóa tài khoản
                </Button>
              </Box>

              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={() => {
                  onLogout();
                  onClose();
                }}
              >
                Đăng xuất
              </Button>
            </Box>

            {showDeleteConfirm && (
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "rgba(255, 69, 58, 0.08)",
                  border: "1px solid rgba(255, 69, 58, 0.35)",
                  borderRadius: "12px",
                }}
              >
                <Typography variant="caption" sx={{ color: "#ff453a", fontWeight: 700, display: "block", mb: 1 }}>
                  Xác nhận xóa vĩnh viễn tài khoản ({user.email}):
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder={`Nhập lại ${user.email}`}
                    value={confirmDeleteEmail}
                    onChange={(e) => setConfirmDeleteEmail(e.target.value)}
                  />
                  <Button
                    color="error"
                    variant="contained"
                    disabled={busy || confirmDeleteEmail.trim().toLowerCase() !== user.email.toLowerCase()}
                    onClick={handleDeleteAccount}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    Xác nhận xóa
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: `1px solid ${APPLE_PALETTE.hairline}` }}>
        <Button onClick={onClose} sx={{ color: APPLE_PALETTE.inkMuted }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};
