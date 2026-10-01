import { NextRequest, NextResponse } from "next/server";
import { createPendingReservation } from "@/lib/booking";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { appUrl, getStripe, stripeEnabled } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function originOk(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
   return new URL(origin).origin === new URL(appUrl()).origin || origin.includes("localhost") || origin.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!originOk(req)) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  if (!rateLimit(`checkout:${clientIp(req.headers)}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many checkout attempts. Try again in a few minutes." }, { status: 429 });
  }
  if (!stripeEnabled()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in .env (test mode is fine)." },
      { status: 503 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid booking" }, { status: 400 });
  }

  try {
    const { reservation, klass, money } = await createPendingReservation({
      ...parsed.data,
      agree: true,
    });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: parsed.data.email,
      client_reference_id: reservation.code,
      metadata: {
        reservationId: reservation.id,
        reservationCode: reservation.code,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: money.totalCents,
            product_data: {
              name: `Scoot SoCal ${klass.name} rental`,
              description: `${money.days} day${money.days === 1 ? "" : "s"} · ${reservation.startDate} to ${reservation.endDate} · tax included`,
            },
          },
        },
      ],
      success_url: `${appUrl()}/reserve/confirmation?code=${encodeURIComponent(reservation.code)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/reserve?canceled=1&class=${klass.slug}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return NextResponse.json({ url: session.url, code: reservation.code });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start checkout";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
