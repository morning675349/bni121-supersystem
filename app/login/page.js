"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) router.push("/matches");
    else setError((await res.json()).error || "登入失敗");
  }

  return (
    <main className="container narrow">
      <div className="hero" style={{ paddingBottom: 12 }}>
        <img src="/bni-badge.png" alt="BNI" style={{ height: 64, marginBottom: 10 }} />
        <div className="brand brand-logo" style={{ justifyContent: "center" }}>BNI 121 <small>對接媒合</small></div>
        <h1 style={{ fontSize: 24, marginTop: 16 }}>登入</h1>
      </div>
      <form className="card" onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        <label>Email</label>
        <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
        <label>密碼</label>
        <input type="password" value={form.password} onChange={set("password")} />
        <div style={{ marginTop: 20 }}>
          <button className="btn" disabled={loading}>{loading ? "登入中…" : "登入"}</button>
        </div>
        <p className="muted center" style={{ marginBottom: 0, marginTop: 16, fontSize: 14 }}>
          還沒有帳號？<Link href="/register">建立帳號</Link>
        </p>
      </form>
    </main>
  );
}
