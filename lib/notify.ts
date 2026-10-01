import { EMAIL } from "./constants";
import { formatLong, money } from "./dates";

type BookingMail = {
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  className: string;
  startDate: string;
  endDate: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  totalCents: number;
  adminPath?: string;
};

function bookingBody(b: BookingMail, audience: "customer" | "admin") {
  const lines = [
    audience === "customer"
      ? `You're booked with Scoot SoCal. Reservation ${b.code}.`
      : `New / updated Scoot SoCal reservation ${b.code}.`,
    "",
    `${b.className}`,
    `Delivery ${formatLong(b.startDate)} → pickup ${formatLong(b.endDate)}`,
    `${b.street}, ${b.city}, ${b.state} ${b.zip}`,
    `Guest: ${b.firstName} ${b.lastName} · ${b.phone} · ${b.email}`,
    `Total: ${money(b.totalCents)}`,
    "",
    `We will email you to confirm the delivery window.`,
  ];
  if (audience === "admin" && b.adminPath) {
    lines.push("", `Admin: ${b.adminPath}`);
  }
  return lines.join("\n");
}

async function deliver(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info("[email:not-sent] Set RESEND_API_KEY to send. Payload:", { to, subject, text });
    return { sent: false as const };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Scoot SoCal <${EMAIL}>`,
      to,
      subject,
      text,
    }),
  });
  if (!res.ok) {
    console.error("[email:failed]", await res.text());
    return { sent: false as const };
  }
  return { sent: true as const };
}

export async function notifyBookingConfirmed(b: BookingMail, notifyEmail: string) {
  await deliver(
    b.email,
    `Scoot SoCal reservation ${b.code}`,
    bookingBody(b, "customer"),
  );
  await deliver(
    notifyEmail,
    `Paid booking ${b.code} — ${b.className}`,
    bookingBody({ ...b, adminPath: `${process.env.APP_URL || ""}/admin/reservations/${b.code}` }, "admin"),
  );
}

export async function notifyBookingChange(
  b: BookingMail,
  notifyEmail: string,
  subject: string,
) {
  await deliver(b.email, subject, bookingBody(b, "customer"));
  await deliver(notifyEmail, subject, bookingBody(b, "admin"));
}

export async function notifyContact(notifyEmail: string, name: string, email: string, phone: string, message: string) {
  await deliver(
    notifyEmail,
    `Website message from ${name}`,
    `${name}\n${email}\n${phone}\n\n${message}`,
  );
}
