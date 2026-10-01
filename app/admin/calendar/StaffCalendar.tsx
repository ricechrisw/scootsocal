"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { MIN_RENTAL_DAYS, PLACE_TYPES, STATUS_LABELS, WINDOWS } from "@/lib/constants";
import {
  addDays,
  addMonths,
  formatLong,
  formatMonthYear,
  formatShort,
  inclusiveDays,
  paddedMonthDays,
  parseYmd,
  weekEndSaturday,
  WEEKDAY_SHORT,
  weekStartSunday,
} from "@/lib/dates";

export type CalView = "month" | "week" | "day";

export type CalClass = {
  id: string;
  name: string;
  slug: string;
};

export type CalReservation = {
  id: string;
  code: string;
  status: string;
  startDate: string;
  endDate: string;
  classId: string;
  className: string;
  classSlug: string;
  customerName: string;
  guestName: string | null;
  propertyName: string | null;
  placeType: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  deliveryWindow: string;
  pickupWindow: string;
  unitLabel: string | null;
  adminNotes: string | null;
};

const VIEWS: { id: CalView; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
];

function windowLabel(value: string) {
  return WINDOWS.find((w) => w.value === value)?.label || value;
}

function displayName(r: CalReservation) {
  return r.guestName || r.customerName;
}

function overlaps(r: CalReservation, date: string) {
  return r.startDate <= date && r.endDate >= date;
}

function classTone(slug: string) {
  if (slug === "light") return "is-light";
  if (slug === "heavy") return "is-heavy";
  return "is-standard";
}

type EventKind = "delivery" | "pickup" | "stay";

function eventKind(r: CalReservation, date: string): EventKind {
  if (r.endDate === date) return "pickup";
  if (r.startDate === date) return "delivery";
  return "stay";
}

function sortDayEvents(events: CalReservation[], date: string) {
  const rank = (r: CalReservation) => {
    const k = eventKind(r, date);
    return k === "pickup" ? 0 : k === "delivery" ? 1 : 2;
  };
  return [...events].sort((a, b) => rank(a) - rank(b) || a.code.localeCompare(b.code));
}

function EventChip({
  r,
  compact,
  kind,
  selected,
  onEdit,
}: {
  r: CalReservation;
  compact?: boolean;
  kind: EventKind;
  selected?: boolean;
  onEdit: (r: CalReservation) => void;
}) {
  const pending = r.status === "pending_payment";
  const canceled = r.status === "canceled" || r.status === "refunded";
  const tag = kind === "pickup" ? "Out" : kind === "delivery" ? "In" : null;
  const title = `${kind === "pickup" ? "Pickup" : kind === "delivery" ? "Delivery" : "On rent"} · ${r.code} · ${r.className} · ${displayName(r)} · ${STATUS_LABELS[r.status] || r.status}`;
  return (
    <button
      type="button"
      className={`staff-cal-event ${classTone(r.classSlug)} is-${kind}${pending ? " is-pending" : ""}${canceled ? " is-canceled" : ""}${selected ? " is-selected" : ""}`}
      title={title}
      aria-pressed={selected}
      onClick={() => onEdit(r)}
    >
      {tag ? <span className="staff-cal-tag">{tag}</span> : null}
      {compact ? (
        <>
          <span className="staff-cal-event-code">{r.code}</span> {displayName(r)}
        </>
      ) : (
        <>
          <strong>{r.code}</strong> {r.className} · {displayName(r)}
          {kind === "pickup" ? ` · ${windowLabel(r.pickupWindow)}` : null}
          {kind === "delivery" ? ` · ${windowLabel(r.deliveryWindow)}` : null}
        </>
      )}
    </button>
  );
}

function rangeFor(view: CalView, cursor: string) {
  if (view === "day") return { from: cursor, to: cursor };
  if (view === "week") return { from: weekStartSunday(cursor), to: weekEndSaturday(cursor) };
  const days = paddedMonthDays(cursor);
  return { from: days[0], to: days[days.length - 1] };
}

function titleFor(view: CalView, cursor: string) {
  if (view === "day") return formatLong(cursor);
  if (view === "week") return `${formatShort(weekStartSunday(cursor))} – ${formatShort(weekEndSaturday(cursor))}`;
  return formatMonthYear(cursor);
}

export function StaffCalendar({
  today,
  initialView,
  initialDate,
}: {
  today: string;
  initialView: CalView;
  initialDate: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<CalView>(initialView);
  const [cursor, setCursor] = useState(initialDate);
  const [showCanceled, setShowCanceled] = useState(false);
  const [rows, setRows] = useState<CalReservation[]>([]);
  const [classes, setClasses] = useState<CalClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<CalReservation | null>(null);

  const range = useMemo(() => rangeFor(view, cursor), [view, cursor]);

  useEffect(() => {
    const q = new URLSearchParams({ view, date: cursor });
    if (showCanceled) q.set("canceled", "1");
    router.replace(`/admin/calendar?${q.toString()}`, { scroll: false });
  }, [view, cursor, showCanceled, router]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    const q = new URLSearchParams({ from: range.from, to: range.to });
    if (showCanceled) q.set("canceled", "1");
    fetch(`/api/admin/calendar?${q}`, { signal: ac.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load calendar");
        setRows(data.reservations || []);
        setClasses(data.classes || []);
        setError("");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not load calendar");
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [range.from, range.to, showCanceled]);

  function step(dir: -1 | 1) {
    if (view === "month") setCursor(addMonths(cursor, dir));
    else if (view === "week") setCursor(addDays(cursor, dir * 7));
    else setCursor(addDays(cursor, dir));
  }

  function openEditor(r: CalReservation) {
    setEditing(r);
  }

  function applySaved(saved: CalReservation) {
    setRows((prev) => {
      const next = prev.filter((row) => row.id !== saved.id);
      if (saved.startDate <= range.to && saved.endDate >= range.from) next.push(saved);
      return next.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.code.localeCompare(b.code));
    });
    setEditing(null);
  }

  const monthDays = view === "month" ? paddedMonthDays(cursor) : [];
  const weekDays = view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(weekStartSunday(cursor), i)) : [];
  const cursorMonth = parseYmd(cursor).m;
  const onRange = rows.filter((r) => r.startDate <= range.to && r.endDate >= range.from);

  return (
    <div className="staff-cal-page">
      <div className="staff-cal-toolbar">
        <div className="staff-cal-nav">
          <button className="staff-cal-btn" type="button" onClick={() => step(-1)}>
            Previous
          </button>
          <button className="staff-cal-btn" type="button" onClick={() => setCursor(today)}>
            Today
          </button>
          <button className="staff-cal-btn" type="button" onClick={() => step(1)}>
            Next
          </button>
          <h1>{titleFor(view, cursor)}</h1>
        </div>
        <div className="staff-cal-toolbar-end">
          <div className="staff-cal-views" role="tablist" aria-label="Calendar view">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={view === v.id}
                aria-pressed={view === v.id}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <label className="staff-cal-canceled">
            <input type="checkbox" checked={showCanceled} onChange={(e) => setShowCanceled(e.target.checked)} />
            Show canceled
          </label>
        </div>
      </div>

      <p className="staff-cal-legend" aria-hidden="true">
        <span className="staff-cal-swatch is-light">Light</span>
        <span className="staff-cal-swatch is-standard">Standard</span>
        <span className="staff-cal-swatch is-heavy">Heavy</span>
        <span className="staff-cal-swatch is-pending">Pending payment</span>
        <span className="staff-cal-swatch is-delivery">In = delivery</span>
        <span className="staff-cal-swatch is-pickup">Out = pickup</span>
      </p>
      <p className="note">Click a booking to change dates, class, status, or delivery/pickup location. Changes save to the reservation.</p>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {view === "month" ? (
        <div className="staff-cal" aria-busy={loading}>
          <div className="staff-cal-month" role="grid" aria-label="Month calendar">
            {WEEKDAY_SHORT.map((d) => (
              <div key={d} className="staff-cal-dow" role="columnheader">
                {d}
              </div>
            ))}
            {monthDays.map((date) => {
              const { d, m } = parseYmd(date);
              const events = sortDayEvents(
                onRange.filter((r) => overlaps(r, date)),
                date,
              );
              const shown = events.slice(0, 3);
              const extra = events.length - shown.length;
              const outside = m !== cursorMonth;
              return (
                <div
                  key={date}
                  className={`staff-cal-cell${outside ? " is-outside" : ""}${date === today ? " is-today" : ""}`}
                  role="gridcell"
                  aria-label={formatLong(date)}
                >
                  <button
                    type="button"
                    className="staff-cal-date"
                    onClick={() => {
                      setCursor(date);
                      setView("day");
                    }}
                  >
                    {d}
                  </button>
                  <div className="staff-cal-chips">
                    {shown.map((r) => (
                      <EventChip
                        key={`${r.id}-${eventKind(r, date)}`}
                        r={r}
                        compact
                        kind={eventKind(r, date)}
                        selected={editing?.id === r.id}
                        onEdit={openEditor}
                      />
                    ))}
                    {extra > 0 ? (
                      <button
                        type="button"
                        className="staff-cal-more"
                        onClick={() => {
                          setCursor(date);
                          setView("day");
                        }}
                      >
                        +{extra} more
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "week" ? (
        <div className="staff-cal-week-wrap">
          <div className="staff-cal staff-cal-week" role="grid" aria-label="Week calendar" aria-busy={loading}>
            {weekDays.map((date) => {
              const events = sortDayEvents(
                onRange.filter((r) => overlaps(r, date)),
                date,
              );
              const { d } = parseYmd(date);
              const dow = WEEKDAY_SHORT[new Date(`${date}T00:00:00Z`).getUTCDay()];
              return (
                <div key={date} className={`staff-cal-week-col${date === today ? " is-today" : ""}`} role="gridcell">
                  <button
                    type="button"
                    className="staff-cal-week-head"
                    onClick={() => {
                      setCursor(date);
                      setView("day");
                    }}
                  >
                    <span>{dow}</span>
                    <strong>{d}</strong>
                  </button>
                  <div className="staff-cal-chips">
                    {events.length ? (
                      events.map((r) => (
                        <EventChip
                          key={`${r.id}-${eventKind(r, date)}`}
                          r={r}
                          kind={eventKind(r, date)}
                          selected={editing?.id === r.id}
                          onEdit={openEditor}
                        />
                      ))
                    ) : (
                      <p className="staff-cal-empty">No bookings</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "day" ? (
        <DayAgenda
          date={cursor}
          today={today}
          rows={onRange.filter((r) => overlaps(r, cursor))}
          loading={loading}
          selectedId={editing?.id}
          onEdit={openEditor}
        />
      ) : null}

      {loading ? <p className="note">Loading reservations…</p> : null}
      {!loading && view !== "day" && onRange.length === 0 ? <p className="note">No reservations in this {view}.</p> : null}

      {editing ? (
        <ReservationEditor
          reservation={editing}
          classes={classes}
          onClose={() => setEditing(null)}
          onSaved={applySaved}
        />
      ) : null}
    </div>
  );
}

function DayAgenda({
  date,
  today,
  rows,
  loading,
  selectedId,
  onEdit,
}: {
  date: string;
  today: string;
  rows: CalReservation[];
  loading: boolean;
  selectedId?: string;
  onEdit: (r: CalReservation) => void;
}) {
  const deliveries = rows.filter((r) => r.startDate === date);
  const pickups = rows.filter((r) => r.endDate === date);
  const staying = rows.filter((r) => r.startDate < date && r.endDate > date);

  return (
    <div className={`staff-cal staff-cal-day${date === today ? " is-today" : ""}`} aria-busy={loading}>
      {!rows.length && !loading ? <p className="staff-cal-empty-day">No reservations on this day.</p> : null}
      <AgendaGroup title="Deliveries" items={deliveries} kind="delivery" empty="No deliveries" selectedId={selectedId} onEdit={onEdit} />
      <AgendaGroup title="On rent" items={staying} kind="stay" empty="No scooters out overnight" selectedId={selectedId} onEdit={onEdit} />
      <AgendaGroup title="Pickups" items={pickups} kind="pickup" empty="No pickups" selectedId={selectedId} onEdit={onEdit} />
    </div>
  );
}

function AgendaGroup({
  title,
  items,
  kind,
  empty,
  selectedId,
  onEdit,
}: {
  title: string;
  items: CalReservation[];
  kind: "delivery" | "pickup" | "stay";
  empty: string;
  selectedId?: string;
  onEdit: (r: CalReservation) => void;
}) {
  return (
    <section className={`staff-cal-agenda is-${kind}`}>
      <h2>{title}</h2>
      {!items.length ? <p className="staff-cal-empty">{empty}</p> : null}
      {items.length ? (
        <ul>
          {items.map((r) => (
            <li key={`${kind}-${r.id}`}>
              <button
                type="button"
                onClick={() => onEdit(r)}
                aria-pressed={selectedId === r.id}
                className={`staff-cal-agenda-card ${classTone(r.classSlug)} is-${kind}${r.status === "pending_payment" ? " is-pending" : ""}${r.status === "canceled" || r.status === "refunded" ? " is-canceled" : ""}${selectedId === r.id ? " is-selected" : ""}`}
              >
                <p className="staff-cal-agenda-top">
                  <strong>
                    {kind === "pickup" ? "Out · " : kind === "delivery" ? "In · " : ""}
                    {r.code}
                  </strong>
                  <span>{STATUS_LABELS[r.status] || r.status}</span>
                </p>
                <p>
                  {r.className} · {displayName(r)}
                  {r.guestName ? ` (booked by ${r.customerName})` : ""}
                </p>
                <p>
                  {formatShort(r.startDate)} – {formatShort(r.endDate)}
                  {r.propertyName ? ` · ${r.propertyName}` : ""} · {r.city}
                </p>
                {kind === "delivery" ? <p>Delivery window: {windowLabel(r.deliveryWindow)}</p> : null}
                {kind === "pickup" ? <p>Pickup window: {windowLabel(r.pickupWindow)}</p> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ReservationEditor({
  reservation,
  classes,
  onClose,
  onSaved,
}: {
  reservation: CalReservation;
  classes: CalClass[];
  onClose: () => void;
  onSaved: (r: CalReservation) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(reservation);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(reservation);
    setRescheduleReason("");
    setError("");
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, [reservation]);

  const days = inclusiveDays(draft.startDate, draft.endDate);

  function setField<K extends keyof CalReservation>(key: K, value: CalReservation[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: draft.startDate,
          endDate: draft.endDate,
          classId: draft.classId,
          status: draft.status,
          street: draft.street,
          city: draft.city,
          state: draft.state,
          zip: draft.zip,
          placeType: draft.placeType,
          propertyName: draft.propertyName || "",
          guestName: draft.guestName || "",
          deliveryWindow: draft.deliveryWindow,
          pickupWindow: draft.pickupWindow,
          unitLabel: draft.unitLabel || "",
          adminNotes: draft.adminNotes || "",
          rescheduleReason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save reservation.");
      onSaved(data.reservation as CalReservation);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save reservation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="staff-cal-editor"
      aria-labelledby="staff-cal-editor-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
    >
      <form className="staff-cal-editor-inner" onSubmit={onSubmit}>
        <div className="staff-cal-editor-head">
          <div>
            <h2 id="staff-cal-editor-title">Edit {reservation.code}</h2>
            <p>
              {displayName(reservation)}
              {reservation.guestName ? ` · booked by ${reservation.customerName}` : ""}
            </p>
          </div>
          <button className="staff-cal-btn" type="button" onClick={() => dialogRef.current?.close()}>
            Close
          </button>
        </div>

        <div className="staff-cal-editor-body">
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        <label>
          Status
          <select value={draft.status} onChange={(e) => setField("status", e.target.value)}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Class
          <select value={draft.classId} onChange={(e) => setField("classId", e.target.value)}>
            {(classes.length ? classes : [{ id: draft.classId, name: draft.className, slug: draft.classSlug }]).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            Delivery
            <input type="date" required value={draft.startDate} onChange={(e) => setField("startDate", e.target.value)} />
          </label>
          <label>
            Pickup
            <input type="date" required value={draft.endDate} onChange={(e) => setField("endDate", e.target.value)} />
          </label>
        </div>
        <p className="note">
          {days > 0 ? `${days} calendar day${days === 1 ? "" : "s"} · ` : ""}
          Pickup must be the day after delivery or later ({MIN_RENTAL_DAYS === 2 ? "24-hour" : `${MIN_RENTAL_DAYS}-day`} minimum).
        </p>
        <label>
          Guest name on reservation
          <input value={draft.guestName || ""} onChange={(e) => setField("guestName", e.target.value || null)} />
        </label>
        <label>
          Unit assigned
          <input value={draft.unitLabel || ""} onChange={(e) => setField("unitLabel", e.target.value || null)} />
        </label>
        <label>
          Stay Type
          <select value={draft.placeType} onChange={(e) => setField("placeType", e.target.value)}>
            {PLACE_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Property / hotel name
          <input required value={draft.propertyName || ""} onChange={(e) => setField("propertyName", e.target.value || null)} />
        </label>
        <label>
          Street
          <input required value={draft.street} onChange={(e) => setField("street", e.target.value)} />
        </label>
        <div className="form-row staff-cal-editor-city">
          <label>
            City
            <input required value={draft.city} onChange={(e) => setField("city", e.target.value)} />
          </label>
          <label>
            State
            <input required maxLength={2} value={draft.state} onChange={(e) => setField("state", e.target.value.toUpperCase())} />
          </label>
          <label>
            ZIP
            <input required value={draft.zip} onChange={(e) => setField("zip", e.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label>
            Delivery window
            <select value={draft.deliveryWindow} onChange={(e) => setField("deliveryWindow", e.target.value)}>
              {WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Pickup window
            <select value={draft.pickupWindow} onChange={(e) => setField("pickupWindow", e.target.value)}>
              {WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Internal notes
          <textarea rows={3} value={draft.adminNotes || ""} onChange={(e) => setField("adminNotes", e.target.value || null)} />
        </label>
        <label>
          Reschedule reason (if changing dates)
          <input value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} />
        </label>
        <p className="note">Paid card totals stay unless this booking is still pending payment or was marked paid offline.</p>
        </div>
        <div className="staff-cal-editor-actions">
          <button className="btn btn-citrus" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <Link className="btn btn-ghost" href={`/admin/reservations/${reservation.id}`}>
            Open full reservation
          </Link>
        </div>
      </form>
    </dialog>
  );
}
