import { NextResponse } from "next/server";
import { deleteAllMessages, getRoomById } from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

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

  deleteAllMessages(room.id);
  return NextResponse.json({ ok: true });
}
