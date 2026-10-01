import { NextRequest, NextResponse } from "next/server";
import { addDays, isValidYmd, todayInLA } from "@/lib/dates";
import { firstBookableDate, releaseExpiredHolds, soldOutDates } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("class");
  const from = req.nextUrl.searchParams.get("from") || todayInLA();
  const to = req.nextUrl.searchParams.get("to") || addDays(from, 62);
  if (!slug || !isValidYmd(from) || !isValidYmd(to)) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const klass = await prisma.scooterClass.findUnique({ where: { slug } });
  if (!klass) return NextResponse.json({ error: "Unknown class" }, { status: 404 });
  await releaseExpiredHolds();
  const settings = await getSettings();
  const minDate = await firstBookableDate(settings.sameDayCutoff);
  const soldOut = await soldOutDates(klass.id, klass.unitCount, from, to);
  return NextResponse.json({
    class: klass.slug,
    dailyRateCents: klass.dailyRateCents,
    unitCount: klass.unitCount,
    taxRate: settings.taxRate,
    minDate,
    cutoff: settings.sameDayCutoff,
    soldOut,
  });
}
