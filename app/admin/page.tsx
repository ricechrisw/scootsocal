import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { STATUS_LABELS, WINDOWS } from "@/lib/constants";
import { addDays, formatLong, money, parseYmd, todayInLA } from "@/lib/dates";
import { occupancyOnDate, releaseExpiredHolds } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ROUTE_STATUSES = ["pending_payment", "confirmed", "out_for_delivery", "out"] as const;
const WINDOW_ORDER = WINDOWS.map((w) => w.value);

type StopKind = "delivery" | "pickup";

type Stop = {
  id: string;
  code: string;
  kind: StopKind;
  window: string;
  property: string;
  guest: string;
  bookedBy: string;
  className: string;
  classSlug: string;
  status: string;
};

function weekdayLong(ymd: string) {
  const { y, m, d } = parseYmd(ymd);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function dayHead(ymd: string) {
  const { y, m, d } = parseYmd(ymd);
  const dow = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
  return `${dow} ${d}`;
}

function windowLabel(value: string) {
  return WINDOWS.find((w) => w.value === value)?.label || value;
}

function displayName(r: { guestName: string | null; customer: { firstName: string; lastName: string } }) {
  const booked = `${r.customer.firstName} ${r.customer.lastName}`.trim();
  return r.guestName?.trim() || booked;
}

function toStop(
  r: {
    id: string;
    code: string;
    status: string;
    street: string;
    city: string;
    propertyName: string | null;
    guestName: string | null;
    deliveryWindow: string;
    pickupWindow: string;
    customer: { firstName: string; lastName: string };
    scooterClass: { name: string; slug: string };
  },
  kind: StopKind,
): Stop {
  const bookedBy = `${r.customer.firstName} ${r.customer.lastName}`.trim();
  return {
    id: r.id,
    code: r.code,
    kind,
    window: kind === "pickup" ? r.pickupWindow : r.deliveryWindow,
    property: r.propertyName?.trim() || `${r.street}, ${r.city}`,
    guest: displayName(r),
    bookedBy,
    className: r.scooterClass.name,
    classSlug: r.scooterClass.slug,
    status: r.status,
  };
}

function sortStops(a: Stop, b: Stop) {
  if (a.kind !== b.kind) return a.kind === "delivery" ? -1 : 1;
  return a.property.localeCompare(b.property) || a.code.localeCompare(b.code);
}

export default async function AdminHome() {
  await requireAdmin();
  await releaseExpiredHolds();
  const today = todayInLA();
  const weekEnd = addDays(today, 6);

  const [routeRows, pending, classes] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        status: { in: [...ROUTE_STATUSES] },
        OR: [{ startDate: today }, { endDate: today }],
      },
      include: { customer: true, scooterClass: true },
      orderBy: [{ startDate: "asc" }, { code: "asc" }],
    }),
    prisma.reservation.findMany({
      where: { status: "pending_payment" },
      include: { customer: true, scooterClass: true },
      orderBy: { startDate: "asc" },
      take: 12,
    }),
    prisma.scooterClass.findMany({ orderBy: { dailyRateCents: "asc" } }),
  ]);

  const stops: Stop[] = [];
  for (const r of routeRows) {
    if (r.startDate === today) stops.push(toStop(r, "delivery"));
    if (r.endDate === today) stops.push(toStop(r, "pickup"));
  }

  const deliveries = stops.filter((s) => s.kind === "delivery");
  const pickups = stops.filter((s) => s.kind === "pickup");
  const bands = WINDOW_ORDER.map((value) => ({
    value,
    label: windowLabel(value),
    items: stops.filter((s) => s.window === value).sort(sortStops),
  }));
  const unwindowed = stops.filter((s) => !WINDOW_ORDER.includes(s.window)).sort(sortStops);
  if (unwindowed.length) {
    bands.push({ value: "other", label: "Other", items: unwindowed });
  }

  const inventory: { id: string; name: string; days: { date: string; left: number }[] }[] = [];
  for (const c of classes) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const used = await occupancyOnDate(prisma, c.id, date);
      days.push({ date, left: Math.max(0, c.unitCount - used) });
    }
    inventory.push({ id: c.id, name: c.name, days });
  }

  const CONTRACT = `<!--
THESIS: Today's hotel route is a departure board by window, not a stats page or a booking bullet list.
OWN-WORLD: Navy paper rows, citrus Out outline, Source Sans, pill New booking, In/Out tags from the staff calendar.
STORY: Staff see this morning's deliveries and pickups, work the route, glance remaining fleet, chase unpaid bookings.
FIRST VIEWPORT: Date with In/Out counts as type and New booking at the right; three window bands of hotel-first rows; remaining units and pending pay under the route.
FORM: Window board, grounded list index 3, seed 422531cf.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

  return (
    <main id="main" className="section dash-page">
      <div hidden dangerouslySetInnerHTML={{ __html: CONTRACT }} />
      <div className="wrap wrap-wide">
        <header className="dash-head">
          <div>
            <h1>{weekdayLong(today)}</h1>
            <p className="dash-counts">
              <span>
                <strong>{deliveries.length}</strong> In
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong>{pickups.length}</strong> Out
              </span>
            </p>
          </div>
          <Link className="btn btn-citrus" href="/admin/reservations#create">
            New booking
          </Link>
        </header>

        <section className="dash-board" aria-label="Today’s route by window">
          {stops.length === 0 ? (
            <p className="dash-empty-board">No deliveries or pickups today. Tomorrow’s work is on the calendar.</p>
          ) : null}
          {stops.length > 0
            ? bands
                .filter((band) => band.items.length > 0)
                .map((band) => (
                  <div key={band.value} className="dash-band">
                    <h2>
                      {band.label}
                      <span>
                        {band.items.length} stop{band.items.length === 1 ? "" : "s"}
                      </span>
                    </h2>
                    <ul>
                      {band.items.map((s) => (
                        <li key={`${s.kind}-${s.id}`}>
                          <Link
                            href={`/admin/reservations/${s.id}`}
                            className={`dash-stop is-${s.kind}${s.status === "pending_payment" ? " is-pending" : ""}`}
                          >
                            <span className={`dash-tag is-${s.kind}`}>{s.kind === "pickup" ? "Out" : "In"}</span>
                            <span className="dash-stop-main">
                              <strong>{s.property}</strong>
                              <span>
                                {s.guest}
                                {s.guest !== s.bookedBy ? ` · booked by ${s.bookedBy}` : ""}
                              </span>
                            </span>
                            <span className="dash-stop-meta">
                              {s.className} · {s.code}
                            </span>
                            <span className="dash-stop-status">{STATUS_LABELS[s.status] || s.status}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
            : null}
        </section>

        <section className="dash-fleet" aria-label="Inventory remaining this week">
          <div className="dash-section-head">
            <h2>Remaining this week</h2>
            <Link href="/admin/calendar">Open calendar</Link>
          </div>
          <div className="table-wrap">
            <table className="admin-table dash-inv">
              <thead>
                <tr>
                  <th>Class</th>
                  {inventory[0]?.days.map((d) => (
                    <th key={d.date} className={d.date === today ? "is-today" : undefined}>
                      {dayHead(d.date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    {row.days.map((d) => (
                      <td
                        key={d.date}
                        className={`${d.date === today ? "is-today" : ""}${d.left === 0 ? " is-sold" : ""}`}
                      >
                        {d.left}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">{formatLong(today)} through {formatLong(weekEnd)}. Zero means sold out.</p>
        </section>

        {pending.length ? (
          <section className="dash-pending" aria-label="Pending payment">
            <h2>Pending payment</h2>
            <ul>
              {pending.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/reservations/${r.id}`}>
                    <strong>{r.code}</strong>
                    <span>
                      {displayName(r)} · {r.scooterClass.name} · {formatLong(r.startDate)}–{formatLong(r.endDate)}
                    </span>
                    <span className="dash-pending-amt">{money(r.totalCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
