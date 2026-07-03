import { NextResponse } from "next/server";
import { registerUser, setSession } from "@/lib/auth.js";

export async function POST(req) {
  const { email, name, password } = await req.json();
  if (!email || !name || !password)
    return NextResponse.json({ error: "請填寫姓名、Email 與密碼" }, { status: 400 });

  try {
    const user = await registerUser({ email, password, name });
    await setSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
