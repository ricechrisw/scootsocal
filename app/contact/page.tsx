"use client";

import { useState } from "react";
import { EMAIL } from "@/lib/constants";

export default function ContactPage() {
  const [status, setStatus] = useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        message: fd.get("message"),
      }),
    });
    setStatus(res.ok ? "Message received. We’ll reply by email." : "Could not send. Email us instead.");
  }
  return (
    <main id="main" className="section">
      <div className="wrap">
        <h1>Contact</h1>
        <p className="section-intro">
          Booking happens on <a href="/reserve">Reserve</a>. Use this form for questions only — it does not hold a
          scooter.
        </p>
        <p>
          Email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </p>
        <form className="form-panel" onSubmit={onSubmit}>
          <label>
            Name
            <input name="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Phone
            <input name="phone" type="tel" />
          </label>
          <label>
            Message
            <textarea name="message" rows={5} required />
          </label>
          <button className="btn btn-citrus" type="submit">
            Send message
          </button>
        </form>
        {status ? <p>{status}</p> : null}
      </div>
    </main>
  );
}
