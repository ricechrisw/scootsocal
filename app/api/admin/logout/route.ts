import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login", req.url));
  res.cookies.delete(COOKIE_NAME);
  return res;
}
