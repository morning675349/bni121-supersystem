"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) router.push("/profile");
    else setError((await res.json()).error || "註冊失敗");
  }

  return (
    <main className="container narrow">
      <div className="hero" style={{ paddingBottom: 12 }}>
        <div className="brand">BNI 121 <small>對接媒合</small></div>
        <h1 style={{ fontSize: 24, marginTop: 16 }}>建立你的帳號</h1>
      </div>
      <form className="card" onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        <label>姓名</label>
        <input value={form.name} onChange={set("name")} placeholder="王晨安" />
        <label>Email</label>
        <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
        <label>密碼 <span className="hint">至少 6 碼</span></label>
        <input type="password" value={form.password} onChange={set("password")} />
        <div style={{ marginTop: 20 }}>
          <button className="btn" disabled={loading}>{loading ? "建立中…" : "建立帳號"}</button>
        </div>
        <p className="muted center" style={{ marginBottom: 0, marginTop: 16, fontSize: 14 }}>
          已有帳號？<Link href="/login">登入</Link>
        </p>
      </form>
    </main>
  );
}
