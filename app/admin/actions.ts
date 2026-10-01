"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { applyReservationUpdate } from "@/lib/admin-reservation";
import { requireAdmin, setAdminCookie, signAdminToken } from "@/lib/auth";
import { eachDate } from "@/lib/dates";
import { assertBookableWindow, rangeAvailable, releaseExpiredHolds } from "@/lib/inventory";
import { notifyBookingChange } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { quoteCents } from "@/lib/pricing";
import { makeReservationCode } from "@/lib/reservation-code";
import { getSettings, setSetting } from "@/lib/settings";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { appUrl } from "@/lib/stripe";

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

export async function updateReservation(formData: FormData) {
  await requireAdmin();
  await applyReservationUpdate({
    id: String(formData.get("id")),
    startDate: String(formData.get("startDate")),
    endDate: String(formData.get("endDate")),
    classId: String(formData.get("classId")),
    status: String(formData.get("status")),
    unitLabel: String(formData.get("unitLabel") || ""),
    adminNotes: String(formData.get("adminNotes") || ""),
    street: String(formData.get("street")),
    city: String(formData.get("city")),
    state: String(formData.get("state")),
    zip: String(formData.get("zip")),
    propertyName: String(formData.get("propertyName") || ""),
    placeType: String(formData.get("placeType") || "hotel"),
    guestName: String(formData.get("guestName") || ""),
    deliveryWindow: String(formData.get("deliveryWindow")),
    pickupWindow: String(formData.get("pickupWindow")),
    policyOverride: String(formData.get("policyOverride") || ""),
    rescheduleReason: String(formData.get("rescheduleReason") || ""),
  });
}

export async function cancelReservation(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") || "Canceled by admin");
  await prisma.$transaction(async (tx) => {
    const res = await tx.reservation.findUnique({ where: { id } });
    if (!res) return;
    await tx.inventoryHold.deleteMany({ where: { reservationId: id } });
    await tx.reservation.update({
      where: { id },
      data: {
        status: res.status === "refunded" ? "refunded" : "canceled",
        adminNotes: `${res.adminNotes || ""}\n${reason}`.trim(),
      },
    });
  });
  revalidatePath("/admin");
  await mailChange(id, "Scoot SoCal reservation canceled");
  redirect(`/admin/reservations/${id}`);
}

export async function refundReservation(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const amount = Math.round(Number(formData.get("amount")) * 100);
  const res = await prisma.reservation.findUnique({ where: { id } });
  if (!res) throw new Error("Missing reservation");
  if (!res.stripePaymentIntentId || !stripeEnabled()) {
    throw new Error("No Stripe payment to refund (offline payments: cancel and note instead).");
  }
  const stripe = getStripe();
  const refund = await stripe.refunds.create({
    payment_intent: res.stripePaymentIntentId,
    amount: amount > 0 ? amount : undefined,
  });
  const newRefund = res.refundCents + (refund.amount || 0);
  await prisma.reservation.update({
    where: { id },
    data: {
      refundCents: newRefund,
      stripeRefundIds: [res.stripeRefundIds, refund.id].filter(Boolean).join(","),
      status: newRefund >= res.totalCents ? "refunded" : res.status,
      stripePaymentStatus: newRefund >= res.totalCents ? "refunded" : "partially_refunded",
    },
  });
  revalidatePath(`/admin/reservations/${id}`);
  await mailChange(id, "Scoot SoCal refund issued");
}

export async function createManualReservation(formData: FormData) {
  await requireAdmin();
  const settings = await getSettings();
  const slug = String(formData.get("classSlug"));
  const startDate = String(formData.get("startDate"));
  const endDate = String(formData.get("endDate"));
  const payMode = String(formData.get("payMode"));
  const klass = await prisma.scooterClass.findUnique({ where: { slug } });
  if (!klass) throw new Error("Unknown class");
  await assertBookableWindow(startDate, endDate);

  const created = await prisma.$transaction(async (tx) => {
    await releaseExpiredHolds(tx);
    const open = await rangeAvailable(tx, klass.id, klass.unitCount, startDate, endDate);
    if (!open) throw new Error("Those dates are sold out.");
    const money = quoteCents(klass.dailyRateCents, startDate, endDate, settings.taxRate);
    const email = String(formData.get("email")).trim().toLowerCase();
    const customer = await tx.customer.upsert({
      where: { email },
      create: {
        email,
        firstName: String(formData.get("firstName")),
        lastName: String(formData.get("lastName")),
        phone: String(formData.get("phone")),
      },
      update: {
        firstName: String(formData.get("firstName")),
        lastName: String(formData.get("lastName")),
        phone: String(formData.get("phone")),
      },
    });
    let code = makeReservationCode();
    const reservation = await tx.reservation.create({
      data: {
        code,
        customerId: customer.id,
        classId: klass.id,
        startDate,
        endDate,
        status: payMode === "offline" ? "confirmed" : "pending_payment",
        street: String(formData.get("street")),
        city: String(formData.get("city")),
        state: String(formData.get("state") || "CA"),
        zip: String(formData.get("zip")),
        placeType: String(formData.get("placeType") || "hotel"),
        propertyName: String(formData.get("propertyName") || "") || null,
        guestName: String(formData.get("guestName") || "") || null,
        deliveryWindow: String(formData.get("deliveryWindow") || "flexible"),
        pickupWindow: String(formData.get("pickupWindow") || "flexible"),
        riderWeight: formData.get("riderWeight") ? Number(formData.get("riderWeight")) : null,
        notes: String(formData.get("notes") || "") || null,
        subtotalCents: money.subtotalCents,
        taxCents: money.taxCents,
        totalCents: money.totalCents,
        paidOffline: payMode === "offline",
        stripePaymentStatus: payMode === "offline" ? "offline" : "unpaid",
      },
    });
    if (payMode !== "offline") {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await tx.inventoryHold.createMany({
        data: eachDate(startDate, endDate).map((date) => ({
          reservationId: reservation.id,
          classId: klass.id,
          date,
          expiresAt,
        })),
      });
    }
    return reservation;
  });

  let paymentUrl = "";
  if (payMode === "link") {
    if (!stripeEnabled()) throw new Error("Stripe keys required to send a payment link.");
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: String(formData.get("email")),
      metadata: { reservationId: created.id, reservationCode: created.code },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: created.totalCents,
            product_data: { name: `Scoot SoCal rental ${created.code}` },
          },
        },
      ],
      success_url: `${appUrl()}/reserve/confirmation?code=${created.code}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/admin/reservations/${created.id}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    paymentUrl = session.url || "";
    await prisma.reservation.update({
      where: { id: created.id },
      data: { stripeCheckoutSessionId: session.id, adminNotes: `Payment link: ${paymentUrl}` },
    });
  }

  revalidatePath("/admin/reservations");
  redirect(`/admin/reservations/${created.id}${paymentUrl ? `?link=${encodeURIComponent(paymentUrl)}` : ""}`);
}

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  await setSetting("tax_rate", String(formData.get("tax_rate")));
  await setSetting("same_day_cutoff", String(formData.get("same_day_cutoff")));
  await setSetting("notify_email", String(formData.get("notify_email")));
  await setSetting("service_area_blurb", String(formData.get("service_area_blurb")));
  const classes = await prisma.scooterClass.findMany();
  for (const c of classes) {
    const rate = formData.get(`rate_${c.slug}`);
    const units = formData.get(`units_${c.slug}`);
    const cap = formData.get(`cap_${c.slug}`);
    await prisma.scooterClass.update({
      where: { id: c.id },
      data: {
        dailyRateCents: Math.round(Number(rate) * 100),
        unitCount: Number(units),
        weightCap: String(cap),
      },
    });
  }
  revalidatePath("/admin/settings");
}

function usersPage(message: { ok?: string; error?: string }): never {
  const q = new URLSearchParams();
  if (message.ok) q.set("ok", message.ok);
  if (message.error) q.set("error", message.error);
  redirect(`/admin/users?${q.toString()}`);
}

function parseStaffName(raw: string) {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2) throw new Error("Enter the person’s name.");
  if (name.length > 80) throw new Error("Name is too long.");
  return name;
}

function parseStaffEmail(raw: string) {
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email.");
  }
  return email;
}

function parseStaffPassword(raw: string, confirm: string, required: boolean) {
  const password = raw;
  if (!password) {
    if (required) throw new Error("Password is required.");
    return null;
  }
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (password !== confirm) throw new Error("Passwords do not match.");
  return password;
}

export async function createAdminUser(formData: FormData) {
  await requireAdmin();
  try {
    const name = parseStaffName(String(formData.get("name") || ""));
    const email = parseStaffEmail(String(formData.get("email") || ""));
    const password = parseStaffPassword(String(formData.get("password") || ""), String(formData.get("confirm") || ""), true);
    const exists = await prisma.adminUser.findUnique({ where: { email } });
    if (exists) throw new Error("That email already has a staff login.");
    await prisma.adminUser.create({
      data: { name, email, passwordHash: await bcrypt.hash(password!, 12) },
    });
  } catch (err) {
    usersPage({ error: err instanceof Error ? err.message : "Could not add staff user." });
  }
  revalidatePath("/admin/users");
  usersPage({ ok: "Staff user added." });
}

export async function updateAdminUser(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  try {
    const current = await prisma.adminUser.findUnique({ where: { id } });
    if (!current) throw new Error("Missing staff user.");
    const name = parseStaffName(String(formData.get("name") || ""));
    const email = parseStaffEmail(String(formData.get("email") || ""));
    const password = parseStaffPassword(
      String(formData.get("password") || ""),
      String(formData.get("confirm") || ""),
      false,
    );
    if (email !== current.email) {
      const taken = await prisma.adminUser.findUnique({ where: { email } });
      if (taken) throw new Error("That email already has a staff login.");
    }
    await prisma.adminUser.update({
      where: { id },
      data: {
        name,
        email,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
    });
    if (current.email === session.email && email !== current.email) {
      await setAdminCookie(await signAdminToken(email));
    }
  } catch (err) {
    usersPage({ error: err instanceof Error ? err.message : "Could not save staff user." });
  }
  revalidatePath("/admin/users");
  usersPage({ ok: "Staff user saved." });
}

export async function deleteAdminUser(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") || "");
  try {
    const current = await prisma.adminUser.findUnique({ where: { id } });
    if (!current) throw new Error("Missing staff user.");
    if (current.email === session.email) throw new Error("You cannot remove the account you are signed in with.");
    const count = await prisma.adminUser.count();
    if (count <= 1) throw new Error("Keep at least one staff login.");
    await prisma.adminUser.delete({ where: { id } });
  } catch (err) {
    usersPage({ error: err instanceof Error ? err.message : "Could not remove staff user." });
  }
  revalidatePath("/admin/users");
  usersPage({ ok: "Staff user removed." });
}
