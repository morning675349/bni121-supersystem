import { NextResponse } from "next/server";
import { loginWithPassword, setSession } from "@/lib/auth.js";

export async function POST(req) {
  const { email, password } = await req.json();
  try {
    const user = await loginWithPassword(email || "", password || "");
    await setSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
