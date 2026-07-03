// Firebase Admin SDK 初始化（伺服器端專用，切勿在 client component 引入）
// 服務帳戶金鑰只放在 .env.local，絕不進 git（見 .gitignore）
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// 從服務帳戶 JSON 直接複製貼上時，常會不小心連 JSON 的結尾逗號或多餘引號也貼進來，
// 這裡做防禦性清理：去除頭尾多餘的引號/逗號/空白，並把字面 "\n" 還原成真正換行。
function sanitizePrivateKey(raw) {
  let s = (raw || "").trim();
  // 反覆剝除頭尾的引號與逗號（可能同時混有兩者，如 `"...",`）
  while (/^["'\s]|["',\s]$/.test(s)) {
    s = s.replace(/^["'\s]+/, "").replace(/["',\s]+$/, "");
  }
  return s.replace(/\\n/g, "\n");
}

function loadCredential() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // 優先用 base64 版本（FIREBASE_PRIVATE_KEY_B64）——避免多行 PEM 在不同環境變數
  // 儲存介面（.env 檔 vs 雲端後台 UI）之間換行處理不一致造成的格式問題。
  const b64 = process.env.FIREBASE_PRIVATE_KEY_B64;
  const privateKey = b64
    ? Buffer.from(b64, "base64").toString("utf8").trim()
    : sanitizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "缺少 Firebase 服務帳戶環境變數（FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY）。" +
        "請參考 .env.local.example 設定 .env.local。"
    );
  }
  if (!privateKey.startsWith("-----BEGIN PRIVATE KEY-----") || !privateKey.includes("-----END PRIVATE KEY-----")) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY 格式不正確（清理後仍非合法 PEM）。請確認是直接複製服務帳戶 JSON 裡 private_key 欄位的值。"
    );
  }
  return cert({ projectId, clientEmail, privateKey });
}

const app = getApps()[0] || initializeApp({ credential: loadCredential() });

export const db = getFirestore(app);
export const adminAuth = getAuth(app);
