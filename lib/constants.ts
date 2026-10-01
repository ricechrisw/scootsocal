export const TZ = "America/Los_Angeles";
export const PHONE_DISPLAY = "951-902-9375";
export const PHONE_TEL = "+19519029375";
export const EMAIL = "info@scootsocal.com";
export const BRAND = "Scoot SoCal";
export const HOLD_MINUTES = 15;
export const MIN_RENTAL_DAYS = 2;
export const MAX_RENTAL_DAYS = 30;
export const DEFAULT_TAX_RATE = "0.0775";
export const DEFAULT_CUTOFF = "11:00";
export const COOKIE_NAME = "scoot_admin";

export const ACTIVE_STATUSES = [
  "pending_payment",
  "confirmed",
  "out_for_delivery",
  "out",
] as const;

export const OCCUPYING_STATUSES = [
  "confirmed",
  "out_for_delivery",
  "out",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  out_for_delivery: "Out for delivery",
  out: "Out",
  returned: "Returned",
  canceled: "Canceled",
  refunded: "Refunded",
};

export const PLACE_TYPES = [
  { value: "hotel", label: "Hotel" },
  { value: "resort", label: "Resort" },
  { value: "airbnb", label: "Airbnb" },
  { value: "home", label: "Home" },
  { value: "other", label: "Other" },
] as const;

export const WINDOWS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "flexible", label: "Flexible" },
] as const;
