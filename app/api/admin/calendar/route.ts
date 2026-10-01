import { NextRequest, NextResponse } from "next/server";
import { toCalReservation } from "@/lib/admin-reservation";
import { readAdminSession } from "@/lib/auth";
import { isValidYmd } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from") || "";
  const to = req.nextUrl.searchParams.get("to") || "";
  const includeCanceled = req.nextUrl.searchParams.get("canceled") === "1";
  if (!isValidYmd(from) || !isValidYmd(to) || from > to) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const hidden = includeCanceled ? [] : ["canceled", "refunded"];
  const [rows, classes] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        startDate: { lte: to },
        endDate: { gte: from },
        ...(hidden.length ? { status: { notIn: hidden } } : {}),
      },
      include: { customer: true, scooterClass: true },
      orderBy: [{ startDate: "asc" }, { code: "asc" }],
    }),
    prisma.scooterClass.findMany({
      orderBy: { dailyRateCents: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return NextResponse.json({
    classes,
    reservations: rows.map(toCalReservation),
  });
}
