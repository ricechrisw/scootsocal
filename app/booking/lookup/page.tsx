"use client";

import { useState } from "react";
import { formatLong, money } from "@/lib/dates";

type Result = {
  code: string;
  status: string;
  className: string;
  startDate: string;
  endDate: string;
  totalCents: number;
  street: string;
  city: string;
  state: string;
  zip: string;
  receiptUrl: string | null;
};

export default function LookupPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    const res = await fetch("/api/booking/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, email }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Not found");
    else setResult(data);
  }

  return (
    <main id="main" className="section">
      <div className="wrap">
        <h1>Look up a booking</h1>
        <p className="section-intro">No account needed. Use the reservation code from your confirmation email and the email you booked with.</p>
        <form className="form-panel" onSubmit={onSubmit}>
          <label>
            Reservation code
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SSC-A7K2" required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button className="btn btn-citrus" type="submit">
            Find booking
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
        {result ? (
          <div className="form-panel" style={{ marginTop: "1rem" }}>
            <h2>{result.code}</h2>
            <p>{result.status}</p>
            <p>
              {result.className} · {formatLong(result.startDate)} → {formatLong(result.endDate)}
            </p>
            <p>
              {result.street}, {result.city}, {result.state} {result.zip}
            </p>
            <p>Total {money(result.totalCents)}</p>
            {result.receiptUrl ? (
              <p>
                <a href={result.receiptUrl}>Receipt</a>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
