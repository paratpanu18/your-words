import { NextResponse } from "next/server";
import { getRoomByCode } from "@/lib/queries";
import { grantRoomAccess } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!rateLimit(`join:${clientIp(request)}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const room = getRoomByCode(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";

  if (room.pin && pin !== room.pin) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 403 });
  }

  await grantRoomAccess(room.code);
  return NextResponse.json({ ok: true });
}
