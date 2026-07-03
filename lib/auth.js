// 認證：Firebase Auth 做密碼驗證，session 用簽章 cookie 存 firebase uid
// 密碼驗證必須經過 Identity Toolkit REST API（Admin SDK 基於安全設計不提供密碼比對）
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { adminAuth } from "./firebaseAdmin.js";

const SECRET = process.env.SESSION_SECRET || "bni-121-dev-secret-change-me";
const COOKIE = "bni_session";
const API_KEY = process.env.FIREBASE_API_KEY;

function sign(value) {
  const sig = createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${sig}`;
}
function unsign(token) {
  if (!token || !token.includes(".")) return null;
  const idx = token.lastIndexOf(".");
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", SECRET).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}

const ERROR_MAP = {
  EMAIL_EXISTS: "此 Email 已註冊",
  EMAIL_NOT_FOUND: "Email 或密碼錯誤",
  INVALID_PASSWORD: "Email 或密碼錯誤",
  INVALID_LOGIN_CREDENTIALS: "Email 或密碼錯誤",
  WEAK_PASSWORD: "密碼至少 6 碼",
  INVALID_EMAIL: "Email 格式不正確",
  TOO_MANY_ATTEMPTS_TRY_LATER: "嘗試次數過多，請稍後再試",
};

function mapFirebaseError(message) {
  const key = Object.keys(ERROR_MAP).find((k) => message?.startsWith(k));
  return key ? ERROR_MAP[key] : "認證失敗，請稍後再試";
}

async function identityToolkit(endpoint, body) {
  if (!API_KEY) throw new Error("缺少 FIREBASE_API_KEY 環境變數");
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(mapFirebaseError(data?.error?.message));
  return data;
}

// 註冊：Identity Toolkit 建立帳號，再用 Admin SDK 設定顯示名稱
export async function registerUser({ email, password, name }) {
  const data = await identityToolkit("signUp", { email, password });
  await adminAuth.updateUser(data.localId, { displayName: name });
  return { id: data.localId, email, name };
}

// 登入：Identity Toolkit 驗證密碼是唯一途徑（Admin SDK 不提供密碼比對）
export async function loginWithPassword(email, password) {
  const data = await identityToolkit("signInWithPassword", { email, password });
  const user = await adminAuth.getUser(data.localId);
  return { id: user.uid, email: user.email, name: user.displayName || "" };
}

export async function setSession(uid) {
  const jar = await cookies();
  jar.set(COOKIE, sign(uid), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 天
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  const uid = unsign(token);
  if (!uid) return null;
  try {
    const user = await adminAuth.getUser(uid);
    return { id: user.uid, email: user.email, name: user.displayName || "" };
  } catch {
    return null; // 使用者已被刪除或 uid 無效
  }
}
