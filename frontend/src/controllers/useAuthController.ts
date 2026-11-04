import { useState, useEffect, useCallback } from "react";
import type { UserProfile } from "../models/types";
import { ApiService } from "../services/api";
import { StorageService } from "../services/storage";

export function useAuthController(onSessionChange?: () => void) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [proStatus, setProStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [authDialogOpen, setAuthDialogOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    const token = StorageService.getAuthToken();
    if (!token) {
      setUser(null);
      setProStatus(null);
      return null;
    }
    try {
      const res = await ApiService.getMe();
      setUser(res.user);
      setProStatus(res.pro_status || null);
      if (res.pro_status?.code && !StorageService.getVipCode()) {
        StorageService.setVipCode(res.pro_status.code);
      }
      return res.user;
    } catch {
      // Token expired or revoked
      StorageService.setAuthToken("");
      setUser(null);
      setProStatus(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.loginAccount({ email, password });
      StorageService.setAuthToken(res.token);
      setUser(res.user);
      setProStatus(res.pro_status || null);
      if (res.pro_status?.code) {
        StorageService.setVipCode(res.pro_status.code);
      }
      onSessionChange?.();
      return res.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<UserProfile> => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.registerAccount({
        email,
        password,
        display_name: displayName,
      });
      StorageService.setAuthToken(res.token);
      setUser(res.user);
      setProStatus(res.pro_status || null);
      onSessionChange?.();
      return res.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng ký thất bại.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    StorageService.setAuthToken("");
    setUser(null);
    setProStatus(null);
    onSessionChange?.();
  };

  return {
    user,
    proStatus,
    loading,
    error,
    setError,
    authDialogOpen,
    setAuthDialogOpen,
    refreshMe,
    login,
    register,
    logout,
  };
}
