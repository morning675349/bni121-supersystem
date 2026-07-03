import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth.js";
import { createInvitation, updateInvitation, invitationsFor } from "@/lib/store.js";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  return NextResponse.json({ invitations: await invitationsFor(user.id) });
}

// 發起邀約：toUserId 為對方平台 userId（去掉 "user:" 前綴）
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { toUserId, message } = await req.json();
  const target = String(toUserId || "").replace(/^user:/, "");
  if (!target) return NextResponse.json({ error: "對象無效（該夥伴尚未加入平台）" }, { status: 400 });
  if (target === user.id) return NextResponse.json({ error: "不能邀約自己" }, { status: 400 });
  const inv = await createInvitation({ fromUserId: user.id, toUserId: target, message });
  return NextResponse.json({ ok: true, invitation: inv });
}

// 回覆 / 更新邀約狀態
export async function PATCH(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { id, status, note } = await req.json();
  const patch = {};
  if (status && ["accepted", "declined", "completed"].includes(status)) patch.status = status;
  if (typeof note === "string") patch.note = note.slice(0, 2000);
  const inv = await updateInvitation(id, patch);
  if (!inv) return NextResponse.json({ error: "找不到邀約" }, { status: 404 });
  return NextResponse.json({ ok: true, invitation: inv });
}
