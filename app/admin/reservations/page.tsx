import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PLACE_TYPES, STATUS_LABELS } from "@/lib/constants";
import { formatLong, money } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { createManualReservation } from "../actions";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  await requireAdmin();
  const rows = await prisma.reservation.findMany({
    include: { customer: true, scooterClass: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const classes = await prisma.scooterClass.findMany({ orderBy: { dailyRateCents: "asc" } });
  return (
    <main id="main" className="section">
      <div className="wrap">
        <h1>Reservations</h1>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Status</th>
                <th>Class</th>
                <th>Dates</th>
                <th>Customer</th>
                <th>Guest on reservation</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/reservations/${r.id}`}>{r.code}</Link>
                  </td>
                  <td>{STATUS_LABELS[r.status] || r.status}</td>
                  <td>{r.scooterClass.name}</td>
                  <td>
                    {formatLong(r.startDate)} – {formatLong(r.endDate)}
                  </td>
                  <td>
                    {r.customer.firstName} {r.customer.lastName}
                  </td>
                  <td>{r.guestName?.trim() ? r.guestName : "—"}</td>
                  <td>{money(r.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 id="create">Create booking (phone / walk-in)</h2>
        <form className="form-panel" action={createManualReservation}>
          <div className="form-row">
            <label>
              First name
              <input name="firstName" required />
            </label>
            <label>
              Last name
              <input name="lastName" required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Phone
              <input name="phone" required />
            </label>
          </div>
          <label>
            Guest name on reservation if different
            <input name="guestName" />
          </label>
          <label>
            Class
            <select name="classSlug">
              {classes.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              Delivery
              <input name="startDate" type="date" required />
            </label>
            <label>
              Pickup
              <input name="endDate" type="date" required />
            </label>
          </div>
          <p className="note">Pickup must be the day after delivery or later (24-hour minimum).</p>
          <label>
            Stay Type
            <select name="placeType" defaultValue="hotel">
              {PLACE_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Property / hotel name
            <input name="propertyName" required />
          </label>
          <label>
            Street
            <input name="street" required />
          </label>
          <div className="form-row">
            <label>
              City
              <input name="city" required />
            </label>
            <label>
              ZIP
              <input name="zip" required />
            </label>
          </div>
          <input type="hidden" name="state" value="CA" />
          <label>
            Payment
            <select name="payMode">
              <option value="link">Send Stripe payment link</option>
              <option value="offline">Mark paid offline</option>
            </select>
          </label>
          <button className="btn btn-citrus" type="submit">
            Create reservation
          </button>
        </form>
      </div>
    </main>
  );
}
