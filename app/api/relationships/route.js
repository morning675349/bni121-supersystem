import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth.js";
import { listRelationships, upsertRelationship } from "@/lib/store.js";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  return NextResponse.json({ relationships: await listRelationships(user.id) });
}

// body: { targetId, favorite?, met?, categoryIndex? }（部分更新，沒傳的欄位不動）
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { targetId, favorite, met, categoryIndex } = await req.json();
  if (!targetId) return NextResponse.json({ error: "缺少 targetId" }, { status: 400 });

  const patch = {};
  if (typeof favorite === "boolean") patch.favorite = favorite;
  if (typeof met === "boolean") {
    patch.met = met;
    patch.metAt = met ? new Date().toISOString() : null;
  }
  if (categoryIndex === null || typeof categoryIndex === "number") patch.categoryIndex = categoryIndex;

  const rel = await upsertRelationship(user.id, targetId, patch);
  return NextResponse.json({ ok: true, relationship: rel });
}
