import { NextResponse } from "next/server";
import {
  createMessage,
  getRoomByCode,
  listMessagesAfter,
} from "@/lib/queries";
import { hasRoomAccess } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const MAX_LENGTH = 150;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = getRoomByCode(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.pin && !(await hasRoomAccess(room.code))) {
    return NextResponse.json({ error: "PIN required" }, { status: 403 });
  }

  const after = Number(new URL(request.url).searchParams.get("after") ?? "0");
  const messages = listMessagesAfter(room.id, Number.isFinite(after) ? after : 0);

  return NextResponse.json({
    status: room.status,
    realtime: room.realtime === 1,
    messages: messages.map((m) => ({ id: m.id, text: m.text })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!rateLimit(`send:${clientIp(request)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "You are sending messages too fast. Please wait a moment." },
      { status: 429 },
    );
  }

  const room = getRoomByCode(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.pin && !(await hasRoomAccess(room.code))) {
    return NextResponse.json({ error: "PIN required" }, { status: 403 });
  }

  if (room.status !== "open") {
    return NextResponse.json(
      { error: room.status === "paused" ? "The room is paused" : "The room is closed" },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "Message is empty" }, { status: 400 });
  }
  if (text.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: `Message must be at most ${MAX_LENGTH} characters` },
      { status: 400 },
    );
  }

  const message = createMessage(room.id, text);
  return NextResponse.json({ ok: true, id: message.id });
}
