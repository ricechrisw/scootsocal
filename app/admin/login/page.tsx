"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Login failed");
      return;
    }
    router.push("/admin");
    router.refresh();
  }
  return (
    <main id="main" className="section">
      <div className="wrap" style={{ maxWidth: 420 }}>
        <h1>Staff login</h1>
        <form className="form-panel" onSubmit={onSubmit}>
          <label>
            Email
            <input name="email" type="email" required autoComplete="username" />
          </label>
          <label>
            Password
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button className="btn btn-citrus" type="submit">
            Log in
          </button>
          {error ? <p className="error">{error}</p> : null}
        </form>
      </div>
    </main>
  );
}
