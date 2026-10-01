import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyContact } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().max(32).optional(),
  message: z.string().trim().min(4).max(4000),
});

export async function POST(req: NextRequest) {
  if (!rateLimit(`contact:${clientIp(req.headers)}`, 6, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many messages." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill name, email, and a short message." }, { status: 400 });
  }
  await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message,
    },
  });
  const settings = await getSettings();
  await notifyContact(
    settings.notifyEmail,
    parsed.data.name,
    parsed.data.email,
    parsed.data.phone || "",
    parsed.data.message,
  );
  return NextResponse.json({ ok: true });
}
