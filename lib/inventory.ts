import type { Prisma, PrismaClient } from "@prisma/client";
import { HOLD_MINUTES, MAX_RENTAL_DAYS, MIN_RENTAL_DAYS, OCCUPYING_STATUSES } from "./constants";
import { addDays, compareYmd, eachDate, timeHmInLA, todayInLA } from "./dates";
import { getSettings } from "./settings";
import { prisma } from "./prisma";

type Db = PrismaClient | Prisma.TransactionClient;

export async function releaseExpiredHolds(db: Db = prisma) {
  const now = new Date();
  const expired = await db.inventoryHold.findMany({
    where: { expiresAt: { lt: now } },
    select: { reservationId: true },
  });
  if (expired.length === 0) return;
  const ids = [...new Set(expired.map((h) => h.reservationId))];
  await db.inventoryHold.deleteMany({ where: { expiresAt: { lt: now } } });
  await db.reservation.updateMany({
    where: { id: { in: ids }, status: "pending_payment" },
    data: {
      status: "canceled",
      adminNotes: "Abandoned checkout — inventory hold expired after 15 minutes.",
    },
  });
}

export async function occupancyOnDate(db: Db, classId: string, date: string): Promise<number> {
  const occupying = await db.reservation.count({
    where: {
      classId,
      status: { in: [...OCCUPYING_STATUSES] },
      startDate: { lte: date },
      endDate: { gte: date },
    },
  });
  const pendingHolds = await db.inventoryHold.count({
    where: {
      classId,
      date,
      expiresAt: { gt: new Date() },
      reservation: { status: "pending_payment" },
    },
  });
  return occupying + pendingHolds;
}

export async function remainingOnDate(db: Db, classId: string, unitCount: number, date: string) {
  return Math.max(0, unitCount - (await occupancyOnDate(db, classId, date)));
}

export async function rangeAvailable(
  db: Db,
  classId: string,
  unitCount: number,
  start: string,
  end: string,
  ignoreReservationId?: string,
): Promise<boolean> {
  const dates = eachDate(start, end);
  for (const date of dates) {
    let used = await occupancyOnDate(db, classId, date);
    if (ignoreReservationId) {
      const selfHold = await db.inventoryHold.count({
        where: { classId, date, reservationId: ignoreReservationId, expiresAt: { gt: new Date() } },
      });
      const selfOcc = await db.reservation.count({
        where: {
          id: ignoreReservationId,
          classId,
          status: { in: [...OCCUPYING_STATUSES] },
          startDate: { lte: date },
          endDate: { gte: date },
        },
      });
      used -= selfHold + selfOcc;
    }
    if (used >= unitCount) return false;
  }
  return true;
}

export async function soldOutDates(
  classId: string,
  unitCount: number,
  from: string,
  to: string,
): Promise<string[]> {
  await releaseExpiredHolds();
  const dates = eachDate(from, to);
  const sold: string[] = [];
  for (const date of dates) {
    if ((await occupancyOnDate(prisma, classId, date)) >= unitCount) sold.push(date);
  }
  return sold;
}

export async function firstBookableDate(cutoff: string, now = new Date()): Promise<string> {
  const today = todayInLA(now);
  const hm = timeHmInLA(now);
  if (compareYmd(hm, cutoff) >= 0) return addDays(today, 1);
  return today;
}

export async function assertBookableWindow(start: string, end: string) {
  const settings = await getSettings();
  const first = await firstBookableDate(settings.sameDayCutoff);
  if (compareYmd(start, first) < 0) {
    throw new Error(
      start === todayInLA()
        ? `Same-day delivery cutoff is ${settings.sameDayCutoff} America/Los_Angeles. First available delivery is ${first}.`
        : `Delivery cannot be before ${first}.`,
    );
  }
  if (compareYmd(end, start) < 0) throw new Error("Pickup date must be after delivery date.");
  const days = eachDate(start, end).length;
  if (days < MIN_RENTAL_DAYS) {
    throw new Error("Rentals must be at least 24 hours. Pickup cannot be the same day as delivery.");
  }
  if (days > MAX_RENTAL_DAYS) throw new Error("Maximum rental is 30 days.");
}

export function holdExpiry(from = new Date()): Date {
  return new Date(from.getTime() + HOLD_MINUTES * 60 * 1000);
}
