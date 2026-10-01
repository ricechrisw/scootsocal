import { revalidatePath } from "next/cache";
import { MAX_RENTAL_DAYS, MIN_RENTAL_DAYS, STATUS_LABELS } from "./constants";
import { eachDate, inclusiveDays, isValidYmd } from "./dates";
import { holdExpiry, rangeAvailable, releaseExpiredHolds } from "./inventory";
import { notifyBookingChange } from "./notify";
import { prisma } from "./prisma";
import { quoteCents } from "./pricing";
import { getSettings } from "./settings";

export type ReservationUpdateInput = {
  id: string;
  startDate: string;
  endDate: string;
  classId: string;
  status: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  placeType: string;
  propertyName: string;
  guestName: string;
  deliveryWindow: string;
  pickupWindow: string;
  unitLabel?: string;
  adminNotes?: string;
  rescheduleReason?: string;
  policyOverride?: string;
};

export type CalReservationPayload = {
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

export function toCalReservation(r: {
  id: string;
  code: string;
  status: string;
  startDate: string;
  endDate: string;
  classId: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  placeType: string;
  propertyName: string | null;
  guestName: string | null;
  deliveryWindow: string;
  pickupWindow: string;
  unitLabel: string | null;
  adminNotes: string | null;
  customer: { firstName: string; lastName: string };
  scooterClass: { name: string; slug: string };
}): CalReservationPayload {
  return {
    id: r.id,
    code: r.code,
    status: r.status,
    startDate: r.startDate,
    endDate: r.endDate,
    classId: r.classId,
    className: r.scooterClass.name,
    classSlug: r.scooterClass.slug,
    customerName: `${r.customer.firstName} ${r.customer.lastName}`.trim(),
    guestName: r.guestName?.trim() || null,
    propertyName: r.propertyName || null,
    placeType: r.placeType,
    street: r.street,
    city: r.city,
    state: r.state,
    zip: r.zip,
    deliveryWindow: r.deliveryWindow,
    pickupWindow: r.pickupWindow,
    unitLabel: r.unitLabel,
    adminNotes: r.adminNotes,
  };
}

async function mailChange(id: string, subject: string) {
  const res = await prisma.reservation.findUnique({
    where: { id },
    include: { customer: true, scooterClass: true },
  });
  if (!res) return;
  const settings = await getSettings();
  await notifyBookingChange(
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
    },
    settings.notifyEmail,
    subject,
  );
}

export async function applyReservationUpdate(input: ReservationUpdateInput): Promise<CalReservationPayload> {
  if (!isValidYmd(input.startDate) || !isValidYmd(input.endDate)) {
    throw new Error("Invalid delivery or pickup date.");
  }
  const days = inclusiveDays(input.startDate, input.endDate);
  if (days < MIN_RENTAL_DAYS) {
    throw new Error("Rentals must be at least 24 hours. Pickup cannot be the same day as delivery.");
  }
  if (days > MAX_RENTAL_DAYS) throw new Error("Maximum rental is 30 days.");
  if (!STATUS_LABELS[input.status]) throw new Error("Unknown status.");

  const street = input.street.trim();
  const city = input.city.trim();
  const state = input.state.trim().toUpperCase();
  const zip = input.zip.trim();
  const propertyName = input.propertyName.trim();
  if (street.length < 3) throw new Error("Street is required.");
  if (city.length < 2) throw new Error("City is required.");
  if (state.length !== 2) throw new Error("State must be 2 letters.");
  if (!/^\d{5}(-\d{4})?$/.test(zip)) throw new Error("Enter a 5-digit ZIP.");
  if (!propertyName) throw new Error("Property / hotel name is required.");

  const updated = await prisma.$transaction(async (tx) => {
    await releaseExpiredHolds(tx);
    const current = await tx.reservation.findUnique({
      where: { id: input.id },
      include: { holds: true },
    });
    if (!current) throw new Error("Missing reservation");
    const klass = await tx.scooterClass.findUnique({ where: { id: input.classId } });
    if (!klass) throw new Error("Unknown class");

    const inactive = input.status === "canceled" || input.status === "refunded";
    const datesChanged =
      current.startDate !== input.startDate || current.endDate !== input.endDate || current.classId !== input.classId;

    if (datesChanged && !inactive) {
      const open = await rangeAvailable(tx, klass.id, klass.unitCount, input.startDate, input.endDate, input.id);
      if (!open) throw new Error("Inventory not available for that class/dates.");
    }

    const settings = await getSettings();
    const money = quoteCents(klass.dailyRateCents, input.startDate, input.endDate, settings.taxRate);
    const recalc = current.status === "pending_payment" || current.paidOffline;
    const notes = [
      input.adminNotes ?? current.adminNotes ?? "",
      input.policyOverride ? `Override: ${input.policyOverride}` : "",
      input.rescheduleReason && datesChanged ? `Reschedule: ${input.rescheduleReason}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const row = await tx.reservation.update({
      where: { id: input.id },
      data: {
        startDate: input.startDate,
        endDate: input.endDate,
        classId: input.classId,
        status: input.status,
        unitLabel: input.unitLabel?.trim() || null,
        adminNotes: notes || null,
        street,
        city,
        state,
        zip,
        propertyName,
        placeType: input.placeType,
        guestName: input.guestName.trim() || null,
        deliveryWindow: input.deliveryWindow,
        pickupWindow: input.pickupWindow,
        ...(recalc
          ? { subtotalCents: money.subtotalCents, taxCents: money.taxCents, totalCents: money.totalCents }
          : {}),
      },
      include: { customer: true, scooterClass: true },
    });

    if (input.status !== "pending_payment") {
      await tx.inventoryHold.deleteMany({ where: { reservationId: input.id } });
    } else if (datesChanged || current.status !== "pending_payment") {
      const expiresAt =
        current.holds[0]?.expiresAt && current.holds[0].expiresAt > new Date()
          ? current.holds[0].expiresAt
          : holdExpiry();
      await tx.inventoryHold.deleteMany({ where: { reservationId: input.id } });
      await tx.inventoryHold.createMany({
        data: eachDate(input.startDate, input.endDate).map((date) => ({
          reservationId: input.id,
          classId: klass.id,
          date,
          expiresAt,
        })),
      });
    }

    return row;
  });

  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/reservations");
  revalidatePath(`/admin/reservations/${input.id}`);
  await mailChange(input.id, "Scoot SoCal reservation updated");
  return toCalReservation(updated);
}
