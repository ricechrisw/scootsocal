"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PLACE_TYPES, WINDOWS } from "@/lib/constants";
import { MIN_RENTAL_DAYS } from "@/lib/constants";
import { addDays, eachDate, formatLong, inclusiveDays, money, monthGrid, todayInLA } from "@/lib/dates";
import { zipOutsideSoCal } from "@/lib/validators";

type Klass = {
  slug: string;
  name: string;
  dailyRateCents: number;
  description: string;
  photoPath: string;
  weightCap: string;
};

type Props = {
  classes: Klass[];
  initialClass?: string;
  canceled?: boolean;
};

const STEPS = ["Class", "Dates", "Delivery", "Review"];

export function ReserveWizard({ classes, initialClass, canceled }: Props) {
  const [step, setStep] = useState(0);
  const [slug, setSlug] = useState(initialClass && classes.some((c) => c.slug === initialClass) ? initialClass : classes[0]?.slug);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [cursor, setCursor] = useState(() => {
    const t = todayInLA();
    return { y: Number(t.slice(0, 4)), m: Number(t.slice(5, 7)) };
  });
  const [soldOut, setSoldOut] = useState<string[]>([]);
  const [minDate, setMinDate] = useState(todayInLA());
  const [taxRate, setTaxRate] = useState(0.0775);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "CA",
    zip: "",
    placeType: "hotel",
    propertyName: "",
    guestName: "",
    deliveryWindow: "flexible",
    pickupWindow: "flexible",
    riderWeight: "",
    notes: "",
    agree: false,
  });

  const klass = classes.find((c) => c.slug === slug) || classes[0];

  useEffect(() => {
    if (!klass) return;
    const from = `${cursor.y}-${String(cursor.m).padStart(2, "0")}-01`;
    const to = addDays(from, 40);
    fetch(`/api/availability?class=${klass.slug}&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => {
        setSoldOut(d.soldOut || []);
        if (d.minDate) setMinDate(d.minDate);
        if (typeof d.taxRate === "number") setTaxRate(d.taxRate);
      })
      .catch(() => undefined);
  }, [klass, cursor.y, cursor.m]);

  const days = start && end ? inclusiveDays(start, end) : 0;
  const quote = useMemo(() => {
    if (!klass || days < MIN_RENTAL_DAYS) return null;
    const subtotal = klass.dailyRateCents * days;
    const tax = Math.round(subtotal * taxRate);
    return { days, subtotal, tax, total: subtotal + tax };
  }, [klass, days, taxRate]);

  function rangeBlocked(a: string, b: string) {
    return eachDate(a, b).some((d) => soldOut.includes(d) || d < minDate);
  }

  function onDay(date: string) {
    if (date < minDate || soldOut.includes(date)) return;
    if (!start || (start && end)) {
      setStart(date);
      setEnd("");
      return;
    }
    if (date < start) {
      setStart(date);
      setEnd("");
      return;
    }
    if (inclusiveDays(start, date) < MIN_RENTAL_DAYS) {
      setError("Rentals must be at least 24 hours. Pickup cannot be the same day as delivery.");
      return;
    }
    if (inclusiveDays(start, date) > 30) {
      setError("Maximum rental is 30 days.");
      return;
    }
    if (rangeBlocked(start, date)) {
      setError("That range includes a sold-out day.");
      return;
    }
    setError("");
    setEnd(date);
  }

  function nextMonth(delta: number) {
    let m = cursor.m + delta;
    let y = cursor.y;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setCursor({ y, m });
  }

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function pay() {
    setError("");
    if (!form.agree) {
      setError("Please agree to the rental terms.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classSlug: klass.slug,
          startDate: start,
          endDate: end,
          ...form,
          riderWeight: form.riderWeight === "" ? undefined : Number(form.riderWeight),
          agree: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusy(false);
    }
  }

  const cells = monthGrid(cursor.y, cursor.m);
  const monthLabel = new Date(Date.UTC(cursor.y, cursor.m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="wizard">
      {canceled ? <p className="banner">Checkout canceled. Your dates were not charged. Holds expire in 15 minutes if you restart pay.</p> : null}
      <ol className="steps" aria-label="Booking steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? "is-current" : i < step ? "is-done" : undefined}>
            {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="class-pick">
          {classes.map((c) => (
            <label key={c.slug} className={c.slug === slug ? "class-option is-active" : "class-option"}>
              <input type="radio" name="class" checked={c.slug === slug} onChange={() => setSlug(c.slug)} />
              <img src={c.photoPath} alt="" />
              <div>
                <strong>{c.name}</strong>
                <p>{c.description}</p>
                <p className="rates">{money(c.dailyRateCents)} / day · {c.weightCap}</p>
              </div>
            </label>
          ))}
          <button className="btn btn-citrus" type="button" onClick={() => setStep(1)}>
            Continue to dates
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <p>
            Select delivery date, then pickup date (next day or later — 24-hour minimum). Sold-out days are blocked.
            Timezone: America/Los_Angeles.
          </p>
          <div className="cal-nav">
            <button type="button" className="btn btn-ghost" onClick={() => nextMonth(-1)} aria-label="Previous month">
              Previous
            </button>
            <h3>{monthLabel}</h3>
            <button type="button" className="btn btn-ghost" onClick={() => nextMonth(1)} aria-label="Next month">
              Next
            </button>
          </div>
          <div className="cal-grid" role="grid" aria-label="Rental calendar">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="cal-dow">
                {d}
              </div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={`e${i}`} />;
              const disabled = date < minDate || soldOut.includes(date);
              const inRange = start && (date === start || (end && date >= start && date <= end));
              return (
                <button
                  key={date}
                  type="button"
                  className={`cal-day${disabled ? " is-disabled" : ""}${inRange ? " is-range" : ""}${date === start || date === end ? " is-end" : ""}`}
                  disabled={disabled}
                  onClick={() => onDay(date)}
                  aria-pressed={date === start || date === end}
                >
                  {Number(date.slice(8))}
                </button>
              );
            })}
          </div>
          <p>
            {start ? `Delivery ${formatLong(start)}` : "Select a delivery date"}
            {end ? ` · Pickup ${formatLong(end)} · ${days} day${days === 1 ? "" : "s"}` : start ? " · now pick pickup" : ""}
          </p>
          {quote ? (
            <ul className="line-items">
              <li>
                {klass.name} · {quote.days} × {money(klass.dailyRateCents)}
              </li>
              <li>Subtotal {money(quote.subtotal)}</li>
              <li>Tax {money(quote.tax)}</li>
              <li>
                <strong>Total {money(quote.total)}</strong>
              </li>
            </ul>
          ) : (
            <p>Select dates to see availability and price.</p>
          )}
          <div className="wizard-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setStep(0)}>
              Back
            </button>
            <button className="btn btn-citrus" type="button" disabled={!start || !end} onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form
          className="form-panel"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(3);
          }}
        >
          <div className="form-row">
            <label>
              First name
              <input required value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} autoComplete="given-name" />
            </label>
            <label>
              Last name
              <input required value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} autoComplete="family-name" />
            </label>
          </div>
          <div className="form-row">
            <label>
              Email
              <input required type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} autoComplete="email" />
            </label>
            <label>
              Mobile phone
              <input required type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} autoComplete="tel" />
            </label>
          </div>
          <label>
            Street address
            <input required value={form.street} onChange={(e) => setField("street", e.target.value)} autoComplete="street-address" />
          </label>
          <div className="form-row">
            <label>
              City
              <input required value={form.city} onChange={(e) => setField("city", e.target.value)} autoComplete="address-level2" />
            </label>
            <label>
              State
              <input required maxLength={2} value={form.state} onChange={(e) => setField("state", e.target.value.toUpperCase())} autoComplete="address-level1" />
            </label>
          </div>
          <label>
            ZIP
            <input required value={form.zip} onChange={(e) => setField("zip", e.target.value)} autoComplete="postal-code" />
          </label>
          {form.zip && zipOutsideSoCal(form.zip) ? (
            <p className="warn">That ZIP looks outside our usual SoCal zone. You can still book — we’ll confirm delivery.</p>
          ) : null}
          <label>
            Stay Type
            <select value={form.placeType} onChange={(e) => setField("placeType", e.target.value)}>
              {PLACE_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Property / hotel name
            <input required value={form.propertyName} onChange={(e) => setField("propertyName", e.target.value)} />
          </label>
          {["hotel", "resort", "airbnb"].includes(form.placeType) ? (
            <p className="field-disclaimer" role="note">
              Please make sure you have made necessary arrangements with hotel/property management. Failure to do so
              could result in a delay of your delivery/pickup
            </p>
          ) : null}
          <label>
            Guest name on reservation if different
            <input value={form.guestName} onChange={(e) => setField("guestName", e.target.value)} />
          </label>
          <div className="form-row">
            <label>
              Delivery window
              <select value={form.deliveryWindow} onChange={(e) => setField("deliveryWindow", e.target.value)}>
                {WINDOWS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pickup window
              <select value={form.pickupWindow} onChange={(e) => setField("pickupWindow", e.target.value)}>
                {WINDOWS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Rider weight (lb, optional)
            <input type="number" min={40} max={800} value={form.riderWeight} onChange={(e) => setField("riderWeight", e.target.value)} />
          </label>
          <label>
            Special notes (gate code, front desk, mobility constraints)
            <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={3} />
          </label>
          <p className="note">
            Guest must arrange hotel / property acceptance of delivery so we aren’t turned away at the lobby.
          </p>
          <div className="wizard-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn btn-citrus" type="submit">
              Review
            </button>
          </div>
        </form>
      )}

      {step === 3 && quote && (
        <div className="form-panel">
          <h3>Review</h3>
          <ul className="line-items">
            <li>
              {klass.name} · {formatLong(start)} → {formatLong(end)} · {quote.days} days
            </li>
            <li>
              {form.firstName} {form.lastName} · {form.email} · {form.phone}
            </li>
            <li>
              Stay Type: {PLACE_TYPES.find((p) => p.value === form.placeType)?.label || form.placeType}
              {form.propertyName ? ` · ${form.propertyName}` : ""}
            </li>
            <li>
              {form.street}, {form.city}, {form.state} {form.zip}
            </li>
            {form.guestName ? <li>Guest name on reservation: {form.guestName}</li> : null}
            <li>Subtotal {money(quote.subtotal)}</li>
            <li>Tax {money(quote.tax)}</li>
            <li>
              <strong>Total due {money(quote.total)}</strong>
            </li>
          </ul>
          <label className="agree">
            <input type="checkbox" checked={form.agree} onChange={(e) => setField("agree", e.target.checked)} />
            <span>
              I agree to the{" "}
              <Link href="/terms" target="_blank">
                rental terms
              </Link>
              : cancelation policy, damage responsibility, theme-park rules are the rider’s, the scooter stays with the
              booked guest, and I must be reachable by phone.
            </span>
          </label>
          <div className="wizard-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setStep(2)}>
              Back
            </button>
            <button className="btn btn-citrus" type="button" disabled={busy} onClick={pay}>
              {busy ? "Sending to Stripe…" : "Pay with Stripe"}
            </button>
          </div>
        </div>
      )}

      {error ? <p className="error" role="alert">{error}</p> : null}
    </div>
  );
}
