import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { expireCheckout, fulfillCheckoutSession } from "@/lib/fulfill";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET missing" }, { status: 500 });
  }
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const seen = await prisma.processedStripeEvent.findUnique({ where: { id: event.id } });
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "unpaid") {
          await fulfillCheckoutSession(session);
        }
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        await expireCheckout(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (pi) {
          const res = await prisma.reservation.findFirst({ where: { stripePaymentIntentId: pi } });
          if (res) {
            const refunded = charge.amount_refunded || 0;
            await prisma.reservation.update({
              where: { id: res.id },
              data: {
                refundCents: refunded,
                status: refunded >= res.totalCents ? "refunded" : res.status,
                stripePaymentStatus: refunded >= res.totalCents ? "refunded" : "partially_refunded",
              },
            });
          }
        }
        break;
      }
      default:
        break;
    }
    await prisma.processedStripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch (err) {
    console.error("webhook handler failed", err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
