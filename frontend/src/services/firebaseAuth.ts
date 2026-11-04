import { ApiService } from "./api";

const FIREBASE_APP_CDN = "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
const FIREBASE_AUTH_CDN = "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

let cachedAuthInstance: any = null;

async function getFirebaseAuthInstance(): Promise<any> {
  if (cachedAuthInstance) return cachedAuthInstance;

  const cfg = await ApiService.getAuthConfig();
  if (!cfg.enabled || !cfg.web || !cfg.web.apiKey) {
    throw new Error(
      "Cấu hình Firebase Web SDK chưa sẵn sàng trên máy chủ. Vui lòng đăng nhập bằng Email & Mật khẩu."
    );
  }

  const firebaseAppMod: any = await import(/* @vite-ignore */ FIREBASE_APP_CDN);
  const firebaseAuthMod: any = await import(/* @vite-ignore */ FIREBASE_AUTH_CDN);

  const existingApps = firebaseAppMod.getApps?.() || [];
  const app =
    existingApps.find((a: any) => a.name === "lensai-web") ||
    firebaseAppMod.initializeApp(cfg.web, "lensai-web");

  const auth = firebaseAuthMod.getAuth(app);
  cachedAuthInstance = { auth, firebaseAuthMod };
  return cachedAuthInstance;
}

export async function signInWithFirebaseGoogle(): Promise<string> {
  try {
    const { auth, firebaseAuthMod } = await getFirebaseAuthInstance();
    const provider = new firebaseAuthMod.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await firebaseAuthMod.signInWithPopup(auth, provider);
    const idToken: string = await result.user.getIdToken(true);
    return idToken;
  } catch (err: any) {
    const code = String(err?.code || err?.message || "");
    if (
      code.includes("auth/configuration-not-found") ||
      code.includes("auth/operation-not-allowed") ||
      code.includes("CONFIGURATION_NOT_FOUND")
    ) {
      throw new Error(
        "Google Sign-In trên Firebase Project 'lensai-video' cần bật công tắc lần đầu: Mở console.firebase.google.com/project/lensai-video/authentication/providers → chọn Google → Enable → Save. Trong lúc đó bạn có thể đăng nhập bằng Email & Mật khẩu bên dưới!"
      );
    }
    if (code.includes("auth/unauthorized-domain")) {
      throw new Error(
        `Tên miền "${window.location.hostname}" chưa được thêm vào Authorized Domains. Mở Firebase Console → Authentication → Settings → Authorized domains → Add domain "${window.location.hostname}".`
      );
    }
    if (code.includes("auth/popup-closed-by-user")) {
      throw new Error("Đã hủy cửa sổ đăng nhập Google.");
    }
    if (code.includes("auth/popup-blocked")) {
      throw new Error("Trình duyệt đã chặn cửa sổ bật lên (Popup). Hãy cho phép Popup cho trang này.");
    }
    throw new Error(err instanceof Error ? err.message : "Đăng nhập Google thất bại.");
  }
}
