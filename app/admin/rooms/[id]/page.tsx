import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ManageRoomClient } from "@/components/manage-room-client";
import { getCurrentAdmin } from "@/lib/auth";
import { getRoomById, listAllMessages } from "@/lib/queries";

export const metadata: Metadata = { title: "Manage room" };
export const dynamic = "force-dynamic";

export default async function ManageRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const roomId = Number(id);
  const room = Number.isInteger(roomId) ? getRoomById(roomId) : undefined;
  if (!room) notFound();

  const messages = listAllMessages(room.id);

  return <ManageRoomClient room={room} messages={messages} />;
}
