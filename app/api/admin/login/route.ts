import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setAdminCookie, signAdminToken } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { COOKIE_NAME } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!rateLimit(`admin-login:${clientIp(req.headers)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "")
    .trim()
    .toLowerCase();
  const password = String(body?.password || "");
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  }
  const token = await signAdminToken(user.email);
  await setAdminCookie(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
