import { MIN_RENTAL_DAYS } from "./constants";
import { inclusiveDays } from "./dates";

export function quoteCents(dailyRateCents: number, startDate: string, endDate: string, taxRate: number) {
  const days = inclusiveDays(startDate, endDate);
  if (days < MIN_RENTAL_DAYS) {
    throw new Error("Rentals must be at least 24 hours. Pickup cannot be the same day as delivery.");
  }
  const subtotalCents = dailyRateCents * days;
  const taxCents = Math.round(subtotalCents * taxRate);
  return {
    days,
    dailyRateCents,
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
  };
}
