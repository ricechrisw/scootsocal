import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { PLACE_TYPES, STATUS_LABELS, WINDOWS } from "@/lib/constants";
import { formatLong, money } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { cancelReservation, refundReservation, updateReservation } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ReservationDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ link?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const r = await prisma.reservation.findUnique({
    where: { id },
    include: { customer: true, scooterClass: true, holds: true },
  });
  if (!r) notFound();
  const classes = await prisma.scooterClass.findMany({ orderBy: { dailyRateCents: "asc" } });

  return (
    <main id="main" className="section">
      <div className="wrap">
        <p>
          <Link href="/admin/reservations">All reservations</Link>
        </p>
        <h1>{r.code}</h1>
        {sp.link ? (
          <p className="banner">
            Payment link: <a href={sp.link}>{sp.link}</a>
          </p>
        ) : null}
        <p>
          {STATUS_LABELS[r.status]} · {r.scooterClass.name} · {formatLong(r.startDate)} → {formatLong(r.endDate)}
        </p>
        <p>
          Booked by: {r.customer.firstName} {r.customer.lastName} · {r.customer.email} · {r.customer.phone}
        </p>
        <p>
          <strong>Guest name on reservation:</strong> {r.guestName?.trim() ? r.guestName : "Same as booked customer"}
        </p>
        <p>
          Property: {r.propertyName || "—"} · Stay Type:{" "}
          {PLACE_TYPES.find((p) => p.value === r.placeType)?.label || r.placeType}
          {r.riderWeight != null ? ` · rider weight ${r.riderWeight} lb` : ""}
        </p>
        <p>
          Subtotal {money(r.subtotalCents)} · tax {money(r.taxCents)} · total {money(r.totalCents)}
          {r.refundCents ? ` · refunded ${money(r.refundCents)}` : ""}
        </p>
        <ul>
          <li>Stripe payment status: {r.stripePaymentStatus || "—"}</li>
          <li>Checkout session: {r.stripeCheckoutSessionId || "—"}</li>
          <li>PaymentIntent: {r.stripePaymentIntentId || "—"}</li>
          <li>Charge: {r.stripeChargeId || "—"}</li>
          <li>
            Card: {r.cardBrand || "—"} {r.cardLast4 ? `•••• ${r.cardLast4}` : ""}
          </li>
          <li>
            {r.receiptUrl ? (
              <a href={r.receiptUrl} target="_blank" rel="noreferrer">
                Stripe receipt
              </a>
            ) : (
              "No receipt URL"
            )}
          </li>
          {r.stripePaymentIntentId ? (
            <li>
              <a
                href={`https://dashboard.stripe.com/test/payments/${r.stripePaymentIntentId}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Stripe Dashboard
              </a>
            </li>
          ) : null}
        </ul>

        <h2>Edit</h2>
        <form className="form-panel" action={updateReservation}>
          <input type="hidden" name="id" value={r.id} />
          <label>
            Status
            <select name="status" defaultValue={r.status}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Class
            <select name="classId" defaultValue={r.classId}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              Delivery
              <input name="startDate" type="date" defaultValue={r.startDate} required />
            </label>
            <label>
              Pickup
              <input name="endDate" type="date" defaultValue={r.endDate} required />
            </label>
          </div>
          <p className="note">Pickup must be the day after delivery or later (24-hour minimum).</p>
          <label>
            Unit assigned
            <input name="unitLabel" defaultValue={r.unitLabel || ""} />
          </label>
          <label>
            Guest name on reservation
            <input name="guestName" defaultValue={r.guestName || ""} />
          </label>
          <label>
            Stay Type
            <select name="placeType" defaultValue={r.placeType}>
              {PLACE_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Property / hotel name
            <input name="propertyName" defaultValue={r.propertyName || ""} required />
          </label>
          <label>
            Street
            <input name="street" defaultValue={r.street} required />
          </label>
          <div className="form-row">
            <label>
              City
              <input name="city" defaultValue={r.city} required />
            </label>
            <label>
              State
              <input name="state" defaultValue={r.state} required />
            </label>
            <label>
              ZIP
              <input name="zip" defaultValue={r.zip} required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Delivery window
              <select name="deliveryWindow" defaultValue={r.deliveryWindow}>
                {WINDOWS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pickup window
              <select name="pickupWindow" defaultValue={r.pickupWindow}>
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
            <textarea name="adminNotes" rows={4} defaultValue={r.adminNotes || ""} />
          </label>
          <label>
            Reschedule reason (if changing dates)
            <input name="rescheduleReason" />
          </label>
          <label>
            48-hour policy override reason
            <input name="policyOverride" />
          </label>
          <button className="btn btn-citrus" type="submit">
            Save changes
          </button>
        </form>

        <form className="form-panel" action={refundReservation} style={{ marginTop: "1rem" }}>
          <input type="hidden" name="id" value={r.id} />
          <label>
            Refund amount (USD, blank = full)
            <input name="amount" type="number" step="0.01" min="0" placeholder={(r.totalCents / 100).toFixed(2)} />
          </label>
          <button className="btn btn-navy" type="submit">
            Issue Stripe refund
          </button>
        </form>

        <form className="form-panel" action={cancelReservation} style={{ marginTop: "1rem" }}>
          <input type="hidden" name="id" value={r.id} />
          <label>
            Cancel reason
            <input name="reason" required />
          </label>
          <button className="btn btn-ghost" type="submit">
            Cancel reservation
          </button>
        </form>
        <p className="note">Paid history is never deleted. Canceled paid bookings stay on this list.</p>
        <p>Customer notes: {r.notes || "—"}</p>
      </div>
    </main>
  );
}
