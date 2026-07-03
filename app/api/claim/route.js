import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth.js";
import { claimBniMember, unclaimBniMember } from "@/lib/store.js";
import { getBniMember } from "@/lib/members.js";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { bniId } = await req.json();
  if (!bniId) return NextResponse.json({ error: "缺少 bniId" }, { status: 400 });
  if (!getBniMember(bniId)) return NextResponse.json({ error: "找不到這筆 BNI 會員資料" }, { status: 404 });

  try {
    await claimBniMember(user.id, bniId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 409 });
  }
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  await unclaimBniMember(user.id);
  return NextResponse.json({ ok: true });
}
