import Stripe from "stripe";
import { appUrl, getStripe } from "./stripe";
import { notifyBookingConfirmed } from "./notify";
import { prisma } from "./prisma";
import { getSettings } from "./settings";
import { rangeAvailable, releaseExpiredHolds } from "./inventory";

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const reservationId = session.metadata?.reservationId;
  if (!reservationId) return;

  const existingEventLock = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { customer: true, scooterClass: true },
  });
  if (!existingEventLock) return;
  if (existingEventLock.status === "confirmed" || existingEventLock.status === "out_for_delivery" || existingEventLock.status === "out" || existingEventLock.status === "returned") {
    return;
  }

  const stripe = getStripe();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  let chargeId: string | null = null;
  let receiptUrl: string | null = null;
  let brand: string | null = null;
  let last4: string | null = null;
  let customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id || null;

  if (paymentIntentId) {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const charge = pi.latest_charge;
    if (charge && typeof charge !== "string") {
      chargeId = charge.id;
      receiptUrl = charge.receipt_url;
      brand = charge.payment_method_details?.card?.brand ?? null;
      last4 = charge.payment_method_details?.card?.last4 ?? null;
    }
  }

  const settings = await getSettings();

  const result = await prisma.$transaction(async (tx) => {
    await releaseExpiredHolds(tx);
    const res = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: { scooterClass: true, customer: true },
    });
    if (!res) return null;
    if (["confirmed", "out_for_delivery", "out", "returned"].includes(res.status)) {
      return { conflict: false as const, already: true as const, reservation: res };
    }

    const open = await rangeAvailable(
      tx,
      res.classId,
      res.scooterClass.unitCount,
      res.startDate,
      res.endDate,
      res.id,
    );
    if (!open) {
      return { conflict: true as const, reservation: res };
    }

    const updated = await tx.reservation.update({
      where: { id: res.id },
      data: {
        status: "confirmed",
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId ?? res.stripePaymentIntentId,
        stripeChargeId: chargeId,
        stripeCustomerId: customerId,
        stripePaymentStatus: session.payment_status || "paid",
        receiptUrl,
        cardBrand: brand,
        cardLast4: last4,
      },
      include: { customer: true, scooterClass: true },
    });
    await tx.inventoryHold.deleteMany({ where: { reservationId: res.id } });
    return { conflict: false as const, reservation: updated };
  });

  if (!result) return;
  if (result.conflict) {
    if (paymentIntentId) {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: "duplicate",
      });
    }
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: "canceled",
        stripePaymentStatus: "refunded_inventory_conflict",
        adminNotes: `${result.reservation.adminNotes || ""}\nAuto-refunded: inventory taken before payment settled.`.trim(),
      },
    });
    return;
  }

  if ("already" in result && result.already) return;
  const res = result.reservation;
  await notifyBookingConfirmed(
    {
      code: res.code,
      firstName: res.customer.firstName,
      lastName: res.customer.lastName,
      email: res.customer.email,
      phone: res.customer.phone,
      className: res.scooterClass.name,
      startDate: res.startDate,
      endDate: res.endDate,
      street: res.street,
      city: res.city,
      state: res.state,
      zip: res.zip,
      totalCents: res.totalCents,
      adminPath: `${appUrl()}/admin/reservations/${res.id}`,
    },
    settings.notifyEmail,
  );
}

export async function expireCheckout(session: Stripe.Checkout.Session) {
  const reservationId = session.metadata?.reservationId;
  if (!reservationId) return;
  await prisma.$transaction(async (tx) => {
    const res = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!res || res.status !== "pending_payment") return;
    await tx.inventoryHold.deleteMany({ where: { reservationId } });
    await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: "canceled",
        adminNotes: `${res.adminNotes || ""}\nCheckout expired or abandoned.`.trim(),
      },
    });
  });
}
