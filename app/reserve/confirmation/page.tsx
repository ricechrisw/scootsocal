import Link from "next/link";
import { notFound } from "next/navigation";
import { EMAIL } from "@/lib/constants";
import { formatLong, money } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/fulfill";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; session_id?: string }>;
}) {
  const sp = await searchParams;
  if (sp.session_id && stripeEnabled()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sp.session_id);
      if (session.payment_status !== "unpaid") {
        await fulfillCheckoutSession(session);
      }
    } catch {
      /* webhook is source of truth; page still renders */
    }
  }
  const code = (sp.code || "").toUpperCase();
  if (!code) notFound();
  const reservation = await prisma.reservation.findUnique({
    where: { code },
    include: { customer: true, scooterClass: true },
  });
  if (!reservation) notFound();

  const paid = ["confirmed", "out_for_delivery", "out", "returned"].includes(reservation.status);

  return (
    <main id="main" className="section">
      <div className="wrap">
        <div className="success">
          <h1>{paid ? "You’re booked." : "We’re confirming payment."}</h1>
          <p>
            Reservation <strong>{reservation.code}</strong>
          </p>
          <p>
            {reservation.scooterClass.name} · {formatLong(reservation.startDate)} → {formatLong(reservation.endDate)}
          </p>
          <p>
            {reservation.street}, {reservation.city}, {reservation.state} {reservation.zip}
            {reservation.propertyName ? ` · ${reservation.propertyName}` : ""}
          </p>
          {reservation.guestName ? <p>Guest name on reservation: {reservation.guestName}</p> : null}
          <p>Total {money(reservation.totalCents)}</p>
          {reservation.receiptUrl ? (
            <p>
              <a href={reservation.receiptUrl}>Stripe receipt</a>
            </p>
          ) : null}
          <p>
            We will email you at this booking address to confirm the delivery window. Questions?{" "}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
          {!paid ? (
            <p>
              If this page still says pending, wait a few seconds and refresh — Stripe webhooks mark the booking paid.
            </p>
          ) : null}
          <p>
            <Link href={`/booking/lookup`}>Look up this booking later</Link> with your code and email.
          </p>
        </div>
      </div>
    </main>
  );
}
