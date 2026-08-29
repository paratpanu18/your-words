import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PresentationClient } from "@/components/presentation-client";
import { getCurrentAdmin } from "@/lib/auth";
import { getRoomById, listAllMessages } from "@/lib/queries";

export const metadata: Metadata = { title: "Presentation" };
export const dynamic = "force-dynamic";

export default async function PresentPage({
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

  // Latest first in the DB, but the cloud wants oldest-first (chronological).
  const messages = listAllMessages(room.id).reverse();

  return (
    <PresentationClient
      code={room.code}
      name={room.name}
      initialStatus={room.status}
      initialRealtime={room.realtime === 1}
      initialMessages={messages.map((m) => ({ id: m.id, text: m.text }))}
    />
  );
}
