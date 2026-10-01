import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = lookupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a reservation code and email." }, { status: 400 });
  }
  const code = parsed.data.code.trim().toUpperCase();
  const reservation = await prisma.reservation.findFirst({
    where: {
      code,
      customer: { email: parsed.data.email.trim().toLowerCase() },
    },
    include: { scooterClass: true, customer: true },
  });
  if (!reservation) {
    return NextResponse.json({ error: "No booking matches that code and email." }, { status: 404 });
  }
  return NextResponse.json({
    code: reservation.code,
    status: reservation.status,
    className: reservation.scooterClass.name,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    totalCents: reservation.totalCents,
    street: reservation.street,
    city: reservation.city,
    state: reservation.state,
    zip: reservation.zip,
    receiptUrl: reservation.receiptUrl,
  });
}
