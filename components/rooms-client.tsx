"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Lock,
  Globe,
  Pause,
  Play,
  Plus,
  Presentation,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog, type ConfirmOptions } from "@/components/confirm-dialog";
import { CreateRoomDialog } from "@/components/create-room-dialog";
import type { RoomWithCount, RoomStatus } from "@/lib/queries";

const STATUS_STYLES: Record<RoomStatus, string> = {
  open: "bg-green-50 text-green-700",
  paused: "bg-amber-50 text-amber-700",
  closed: "bg-neutral-100 text-neutral-500",
};

const STATUS_LABELS: Record<RoomStatus, string> = {
  open: "Open",
  paused: "Paused",
  closed: "Closed",
};

export function RoomsClient({ rooms }: { rooms: RoomWithCount[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmOptions | null>(null);

  async function setStatus(id: number, status: RoomStatus) {
    await fetch(`/api/admin/rooms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function removeRoom(id: number) {
    await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Your rooms</h2>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-sky px-4 text-sm font-medium text-[#2a2a33] shadow-sm transition-transform hover:scale-[1.03] active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          Create room
        </button>
      </div>

      <CreateRoomDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(room) => router.push(`/admin/rooms/${room.id}`)}
      />

      <div className="flex flex-col gap-3">
        {rooms.length === 0 && (
          <p className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-sm text-neutral-400">
            No rooms yet. Create your first room to start collecting words.
          </p>
        )}
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex flex-col gap-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    STATUS_STYLES[room.status],
                  )}
                >
                  {STATUS_LABELS[room.status]}
                </span>
                {room.pin ? (
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                    <Lock className="h-3 w-3" /> PIN protected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                    <Globe className="h-3 w-3" /> Public
                  </span>
                )}
                {room.realtime === 1 && (
                  <span className="rounded-full bg-blush-soft px-2 py-0.5 text-xs text-neutral-500">
                    Real time
                  </span>
                )}
              </div>
              <p className="mt-2 truncate font-medium">{room.name}</p>
              {room.description && (
                <p className="mt-0.5 truncate text-sm text-neutral-500">
                  {room.description}
                </p>
              )}
              <p className="mt-0.5 text-sm text-neutral-400">
                Code <span className="font-mono tracking-widest">{room.code}</span>
                {" · "}
                {room.message_count}{" "}
                {room.message_count === 1 ? "message" : "messages"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {room.status !== "closed" && (
                <a
                  href={`/admin/rooms/${room.id}/present`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blush px-4 py-2 text-sm font-medium text-[#2a2a33] transition-transform hover:scale-[1.03] active:scale-[0.97]"
                >
                  <Presentation className="h-4 w-4" />
                  Present
                </a>
              )}
              <a
                href={`/admin/rooms/${room.id}`}
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                Manage
              </a>
              {room.status === "open" && (
                <button
                  type="button"
                  onClick={() => setStatus(room.id, "paused")}
                  title="Pause room"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                >
                  <Pause className="h-4 w-4" />
                </button>
              )}
              {(room.status === "paused" || room.status === "closed") && (
                <button
                  type="button"
                  onClick={() => setStatus(room.id, "open")}
                  title="Reopen room"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:bg-green-50 hover:text-green-600"
                >
                  <Play className="h-4 w-4" />
                </button>
              )}
              {room.status !== "closed" && (
                <button
                  type="button"
                  onClick={() => setStatus(room.id, "closed")}
                  title="Close room"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  setConfirm({
                    title: "Delete this room?",
                    message: `Room "${room.name}" and all its ${room.message_count} answers will be permanently removed. This cannot be undone.`,
                    confirmLabel: "Delete room",
                    onConfirm: () => removeRoom(room.id),
                  })
                }
                title="Delete room"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog options={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
