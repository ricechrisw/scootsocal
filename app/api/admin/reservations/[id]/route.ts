import { NextRequest, NextResponse } from "next/server";
import { applyReservationUpdate } from "@/lib/admin-reservation";
import { readAdminSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const reservation = await applyReservationUpdate({
      id,
      startDate: String(body.startDate || ""),
      endDate: String(body.endDate || ""),
      classId: String(body.classId || ""),
      status: String(body.status || ""),
      street: String(body.street || ""),
      city: String(body.city || ""),
      state: String(body.state || ""),
      zip: String(body.zip || ""),
      placeType: String(body.placeType || "hotel"),
      propertyName: String(body.propertyName || ""),
      guestName: String(body.guestName || ""),
      deliveryWindow: String(body.deliveryWindow || "flexible"),
      pickupWindow: String(body.pickupWindow || "flexible"),
      unitLabel: String(body.unitLabel || ""),
      adminNotes: body.adminNotes != null ? String(body.adminNotes) : undefined,
      rescheduleReason: String(body.rescheduleReason || ""),
    });
    return NextResponse.json({ reservation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save reservation.";
    const conflict = /inventory|sold out|not available/i.test(message);
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 400 });
  }
}
