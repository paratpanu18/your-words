import { NextResponse } from "next/server";
import {
  deleteRoom,
  getRoomById,
  updateRoomMeta,
  updateRoomPin,
  updateRoomRealtime,
  updateRoomStatus,
} from "@/lib/queries";
import { requireAdmin } from "@/lib/session";
import type { RoomStatus } from "@/lib/queries";

const VALID_STATUSES: RoomStatus[] = ["open", "paused", "closed"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const roomId = Number(id);
  const room = Number.isInteger(roomId) ? getRoomById(roomId) : undefined;
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);

  if (typeof body?.status === "string") {
    if (!VALID_STATUSES.includes(body.status as RoomStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updateRoomStatus(room.id, body.status as RoomStatus);
  }

  if ("pin" in (body ?? {})) {
    if (body.pin !== null && body.pin !== "") {
      const pin = typeof body.pin === "string" ? body.pin.trim() : "";
      if (!/^\d{4,8}$/.test(pin)) {
        return NextResponse.json(
          { error: "PIN must be 4-8 digits" },
          { status: 400 },
        );
      }
      updateRoomPin(room.id, pin);
    } else {
      updateRoomPin(room.id, null);
    }
  }

  if (typeof body?.realtime === "boolean") {
    updateRoomRealtime(room.id, body.realtime);
  }

  const meta: {
    name?: string;
    description?: string | null;
    placeholder?: string | null;
    footerText?: string | null;
  } = {};

  if ("name" in (body ?? {})) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Room name must be 1-80 characters" },
        { status: 400 },
      );
    }
    meta.name = name;
  }
  if ("description" in (body ?? {})) {
    if (body.description !== null && body.description !== "") {
      const description =
        typeof body.description === "string" ? body.description.trim() : "";
      if (description.length > 200) {
        return NextResponse.json(
          { error: "Description must be at most 200 characters" },
          { status: 400 },
        );
      }
      meta.description = description;
    } else {
      meta.description = null;
    }
  }
  if ("placeholder" in (body ?? {})) {
    if (body.placeholder !== null && body.placeholder !== "") {
      const placeholder =
        typeof body.placeholder === "string" ? body.placeholder.trim() : "";
      if (placeholder.length > 100) {
        return NextResponse.json(
          { error: "Placeholder must be at most 100 characters" },
          { status: 400 },
        );
      }
      meta.placeholder = placeholder;
    } else {
      meta.placeholder = null;
    }
  }
  if ("footerText" in (body ?? {})) {
    if (body.footerText !== null && body.footerText !== "") {
      const footerText =
        typeof body.footerText === "string" ? body.footerText.trim() : "";
      if (footerText.length > 120) {
        return NextResponse.json(
          { error: "Footer text must be at most 120 characters" },
          { status: 400 },
        );
      }
      meta.footerText = footerText;
    } else {
      meta.footerText = null;
    }
  }
  updateRoomMeta(room.id, meta);

  const updated = getRoomById(room.id)!;
  return NextResponse.json({
    ok: true,
    room: {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      description: updated.description,
      placeholder: updated.placeholder,
      footer_text: updated.footer_text,
      pin: updated.pin,
      realtime: updated.realtime === 1,
      status: updated.status,
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const roomId = Number(id);
  const room = Number.isInteger(roomId) ? getRoomById(roomId) : undefined;
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  deleteRoom(room.id);
  return NextResponse.json({ ok: true });
}
