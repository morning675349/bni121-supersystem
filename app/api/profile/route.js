import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth.js";
import { saveProfile, getProfile } from "@/lib/store.js";

// GAINS 官方檔案欄位（對應 BNI 官網會員頁六大欄位）
const FIELDS = [
  "company", "category", "specialty", "region", "chapter",
  "business", "idealReferral", "problemSolved", "idealPartner", "topProduct",
];

function sanitizeNetworkCircle(nc) {
  const center = (nc?.center || "").toString().slice(0, 60);
  const categories = Array.isArray(nc?.categories)
    ? nc.categories.slice(0, 8).map((c) => ({
        name: (c?.name || "").toString().slice(0, 30),
        items: Array.isArray(c?.items)
          ? c.items.slice(0, 8).map((i) => (i || "").toString().slice(0, 30)).filter(Boolean)
          : [],
      }))
    : [];
  return { center, categories };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const profile = await getProfile(user.id);
  return NextResponse.json({ profile: profile || {} });
}

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const body = await req.json();
  const clean = {};

  // 兩個表單（GAINS 官方檔案 / 業務人脈圈）各自獨立送出，只處理有送來的部分，
  // 避免其中一個表單儲存時把另一個已存的資料覆蓋掉（Firestore 端仍用 merge）。
  const hasGainsFields = FIELDS.some((f) => f in body);
  if (hasGainsFields) {
    for (const f of FIELDS) clean[f] = (body[f] || "").toString().slice(0, 2000);
    clean.name = user.name;
  }
  if (body.networkCircle) {
    clean.networkCircle = sanitizeNetworkCircle(body.networkCircle);
  }

  const saved = await saveProfile(user.id, clean);
  return NextResponse.json({ ok: true, profile: saved });
}
