import { z } from "zod";
import { MAX_RENTAL_DAYS, MIN_RENTAL_DAYS } from "./constants";
import { inclusiveDays, isValidYmd } from "./dates";

export const checkoutSchema = z
  .object({
    classSlug: z.enum(["light", "standard", "heavy"]),
    startDate: z.string().refine(isValidYmd, "Invalid delivery date"),
    endDate: z.string().refine(isValidYmd, "Invalid pickup date"),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email(),
    phone: z
      .string()
      .trim()
      .min(10)
      .max(32)
      .refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a valid mobile number"),
    street: z.string().trim().min(3).max(120),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(2),
    zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP"),
    placeType: z.enum(["hotel", "resort", "airbnb", "home", "other"]),
    propertyName: z.string().trim().min(1, "Property / hotel name is required").max(120),
    guestName: z.string().trim().max(120).optional().or(z.literal("")),
    deliveryWindow: z.enum(["morning", "afternoon", "flexible"]),
    pickupWindow: z.enum(["morning", "afternoon", "flexible"]),
    riderWeight: z.preprocess((v) => {
      if (v === "" || v === null || v === undefined) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }, z.number().int().min(40).max(800).optional()),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    agree: z.literal(true).or(z.literal("on")).or(z.literal("true")),
  })
  .refine((d) => inclusiveDays(d.startDate, d.endDate) >= MIN_RENTAL_DAYS, {
    message: "Rentals must be at least 24 hours. Pickup cannot be the same day as delivery.",
    path: ["endDate"],
  })
  .refine((d) => inclusiveDays(d.startDate, d.endDate) <= MAX_RENTAL_DAYS, {
    message: "Maximum rental is 30 days.",
    path: ["endDate"],
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export function zipOutsideSoCal(zip: string): boolean {
  const five = zip.slice(0, 5);
  return !/^9[0-3]\d{3}$/.test(five);
}

export const lookupSchema = z.object({
  code: z.string().trim().min(4).max(16),
  email: z.string().trim().email(),
});
