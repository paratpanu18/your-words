import type { Metadata } from "next";
import { MessageCircleHeart } from "lucide-react";
import { PinForm } from "@/components/pin-form";
import { MessageComposer } from "@/components/message-composer";
import { hasRoomAccess } from "@/lib/auth";
import { getRoomByCode } from "@/lib/queries";

export const metadata: Metadata = { title: "Room" };
export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const room = getRoomByCode(code);

  if (!room) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <MessageCircleHeart className="h-10 w-10 text-neutral-300" />
        <h1 className="text-xl font-semibold">Room not found</h1>
        <p className="text-sm text-neutral-400">
          Check the code and try again from the home page.
        </p>
      </div>
    );
  }

  if (room.pin && !(await hasRoomAccess(room.code))) {
    return <PinForm code={room.code} />;
  }

  return (
    <MessageComposer
      code={room.code}
      description={room.description}
      placeholder={room.placeholder}
      footerText={room.footer_text}
      initialStatus={room.status}
    />
  );
}
