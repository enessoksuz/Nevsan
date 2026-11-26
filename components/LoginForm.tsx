"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Giriş yapılamadı.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Giriş yapılamadı.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={onSubmit}>
        <p className="eyebrow">Nevsan Ambalaj</p>
        <h1>Yönetim</h1>
        <p className="login-lead">Ana görsel, ürün galerisi, iletişim bilgileri ve diller buradan düzenlenir.</p>
        <label>
          Şifre
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn btn-pine" type="submit" disabled={pending}>
          {pending ? "Giriliyor…" : "Giriş"}
        </button>
        <p className="login-hint">Şifre, proje klasöründeki .env.local dosyasında ADMIN_PASSWORD olarak durur.</p>
      </form>
    </main>
  );
}
