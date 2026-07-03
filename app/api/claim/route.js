import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth.js";
import { claimBniMember, unclaimBniMember } from "@/lib/store.js";
import { getBniMember } from "@/lib/members.js";

// 認領時要直接覆蓋進九宮格(GAINS)的欄位對照：BNI 官方欄位 → 九宮格欄位
const GAINS_FIELD_MAP = {
  company: "company",
  categoryEn: "category",
  specialty: "specialty",
  chapter: "chapter",
  region: "region",
  business: "business",
  idealReferral: "idealReferral",
  problemSolved: "problemSolved",
  idealPartner: "idealPartner",
  topProduct: "topProduct",
};

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { bniId } = await req.json();
  if (!bniId) return NextResponse.json({ error: "缺少 bniId" }, { status: 400 });
  const bniMember = getBniMember(bniId);
  if (!bniMember) return NextResponse.json({ error: "找不到這筆 BNI 會員資料" }, { status: 404 });

  // 官方有值的欄位直接覆蓋；官方沒填的欄位保留使用者原本內容，不用空白洗掉
  const gainsData = {};
  for (const [bniKey, profileKey] of Object.entries(GAINS_FIELD_MAP)) {
    if (bniMember[bniKey]) gainsData[profileKey] = bniMember[bniKey];
  }

  try {
    await claimBniMember(user.id, bniId, gainsData);
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
