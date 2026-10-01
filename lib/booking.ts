import { HOLD_MINUTES } from "./constants";
import { eachDate } from "./dates";
import { assertBookableWindow, holdExpiry, rangeAvailable, releaseExpiredHolds } from "./inventory";
import { prisma } from "./prisma";
import { quoteCents } from "./pricing";
import { makeReservationCode } from "./reservation-code";
import { getSettings } from "./settings";
import type { CheckoutInput } from "./validators";

export async function createPendingReservation(input: CheckoutInput) {
  await assertBookableWindow(input.startDate, input.endDate);
  const settings = await getSettings();

  return prisma.$transaction(async (tx) => {
    await releaseExpiredHolds(tx);
    const klass = await tx.scooterClass.findUnique({ where: { slug: input.classSlug } });
    if (!klass || !klass.active) throw new Error("That scooter class is not available.");

    const open = await rangeAvailable(tx, klass.id, klass.unitCount, input.startDate, input.endDate);
    if (!open) throw new Error("Those dates are sold out for this class. Pick another range.");

    const money = quoteCents(klass.dailyRateCents, input.startDate, input.endDate, settings.taxRate);

    const customer = await tx.customer.upsert({
      where: { email: input.email.toLowerCase() },
      create: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
        phone: input.phone,
      },
      update: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      },
    });

    let code = makeReservationCode();
    for (let i = 0; i < 8; i++) {
      const clash = await tx.reservation.findUnique({ where: { code } });
      if (!clash) break;
      code = makeReservationCode();
    }

    const reservation = await tx.reservation.create({
      data: {
        code,
        customerId: customer.id,
        classId: klass.id,
        startDate: input.startDate,
        endDate: input.endDate,
        status: "pending_payment",
        street: input.street,
        city: input.city,
        state: input.state.toUpperCase(),
        zip: input.zip,
        placeType: input.placeType,
        propertyName: input.propertyName || null,
        guestName: input.guestName || null,
        deliveryWindow: input.deliveryWindow,
        pickupWindow: input.pickupWindow,
        riderWeight: input.riderWeight ?? null,
        notes: input.notes || null,
        subtotalCents: money.subtotalCents,
        taxCents: money.taxCents,
        totalCents: money.totalCents,
      },
    });

    const expiresAt = holdExpiry();
    await tx.inventoryHold.createMany({
      data: eachDate(input.startDate, input.endDate).map((date) => ({
        reservationId: reservation.id,
        classId: klass.id,
        date,
        expiresAt,
      })),
    });

    return { reservation, customer, klass, money, holdMinutes: HOLD_MINUTES };
  });
}
