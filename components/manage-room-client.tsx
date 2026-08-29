"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  Globe,
  Lock,
  MessageSquareText,
  Pause,
  Pencil,
  Play,
  Presentation,
  SquarePen,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { ConfirmDialog, type ConfirmOptions } from "@/components/confirm-dialog";
import { CopyButton } from "@/components/copy-button";
import { EditRoomDialog } from "@/components/edit-room-dialog";
import { ShareLink } from "@/components/share-link";
import { ToggleSwitch } from "@/components/toggle-switch";
import { cn } from "@/lib/utils";
import type { MessageRow, RoomRow, RoomStatus } from "@/lib/queries";

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

function formatDateTime(value: string): string {
  const date = new Date(value.replace(" ", "T") + "Z");
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ManageRoomClient({
  room,
  messages,
}: {
  room: RoomRow;
  messages: MessageRow[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [realtime, setRealtime] = useState(room.realtime === 1);
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmOptions | null>(null);

  // Light polling keeps the answer feed fresh while the admin watches.
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  async function toggleRealtime(next: boolean) {
    setRealtime(next); // optimistic
    const res = await fetch(`/api/admin/rooms/${room.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ realtime: next }),
    });
    if (!res.ok) setRealtime(!next);
    router.refresh();
  }

  async function setStatus(status: RoomStatus) {
    setPending(true);
    await fetch(`/api/admin/rooms/${room.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
    setPending(false);
  }

  async function deleteMessage(id: number) {
    setPending(true);
    await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    router.refresh();
    setPending(false);
  }

  async function clearAll() {
    setPending(true);
    await fetch(`/api/admin/rooms/${room.id}/messages`, { method: "DELETE" });
    router.refresh();
    setPending(false);
  }

  async function deleteRoom() {
    setPending(true);
    await fetch(`/api/admin/rooms/${room.id}`, { method: "DELETE" });
    router.push("/admin");
  }

  function exportCsv() {
    const chronological = [...messages].reverse();
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = [
      ["id", "text", "created_at"],
      ...chronological.map((m) => [String(m.id), esc(m.text), m.created_at]),
    ];
    downloadFile(
      "\uFEFF" + rows.map((r) => r.join(",")).join("\n"),
      `your-words-${room.code.toLowerCase()}.csv`,
      "text/csv;charset=utf-8",
    );
  }

  function exportTxt() {
    const chronological = [...messages].reverse();
    const txt = chronological
      .map((m, i) => `${i + 1}. [${m.created_at} UTC] ${m.text}`)
      .join("\n");
    downloadFile(
      txt,
      `your-words-${room.code.toLowerCase()}.txt`,
      "text/plain;charset=utf-8",
    );
  }

  const stats = [
    {
      icon: MessageSquareText,
      label: "Answers",
      value: String(messages.length),
    },
    {
      icon: SquarePen,
      label: "Status",
      value: STATUS_LABELS[room.status],
    },
    {
      icon: CalendarDays,
      label: "Created",
      value: formatDateTime(room.created_at),
    },
    {
      icon: Zap,
      label: "Real-time",
      value: room.realtime === 1 ? "On" : "Off",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <a
        href="/admin"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-600"
      >
        <ArrowLeft className="h-4 w-4" />
        All rooms
      </a>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {room.name}
            </h1>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                STATUS_STYLES[room.status],
              )}
            >
              {STATUS_LABELS[room.status]}
            </span>
          </div>
          {room.description && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-500">
              {room.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-400">
            <span>
              Code{" "}
              <span className="font-mono text-base tracking-[0.25em] text-neutral-700">
                {room.code}
              </span>
              <CopyButton value={room.code} label="" />
            </span>
            {room.pin ? (
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-4 w-4" /> PIN{" "}
                <span className="font-mono text-neutral-700">{room.pin}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> Public
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {room.status !== "closed" && (
            <a
              href={`/admin/rooms/${room.id}/present`}
              className="inline-flex items-center gap-1.5 rounded-full bg-blush px-4 py-2 text-sm font-medium text-[#2a2a33] transition-transform hover:scale-[1.03] active:scale-[0.97]"
            >
              <Presentation className="h-4 w-4" />
              Presentation
            </a>
          )}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            <Pencil className="h-4 w-4" />
            Edit room
          </button>
        </div>
      </header>

      {/* stats */}
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </div>
            <p className="mt-1.5 truncate text-lg font-semibold text-[#2a2a33]">
              {s.value}
            </p>
          </div>
        ))}
      </section>

      {/* share + controls */}
      <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="mb-3 text-sm font-medium text-neutral-500">
            Share this link with your audience
          </h2>
          <ShareLink code={room.code} />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4">
          {room.status === "open" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setStatus("paused")}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-amber-50 disabled:opacity-50"
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
          )}
          {(room.status === "paused" || room.status === "closed") && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setStatus("open")}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-green-50 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Open
            </button>
          )}
          {room.status !== "closed" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setStatus("closed")}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Close
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              setConfirm({
                title: "Delete this room?",
                message: `Room "${room.name}" and all its ${messages.length} answers will be permanently removed. This cannot be undone.`,
                confirmLabel: "Delete room",
                onConfirm: deleteRoom,
              })
            }
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete room
          </button>
        </div>
      </section>

      {/* real-time toggle */}
      <section className="mb-6 flex items-center justify-between gap-6 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-medium">
            <Zap className="h-4 w-4 text-neutral-400" />
            Real-time mode
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-400">
            Push new messages to the presentation instantly using server-sent
            events. When off, the presentation refreshes every few seconds.
          </p>
        </div>
        <ToggleSwitch
          checked={realtime}
          onChange={toggleRealtime}
          disabled={pending}
          label="Real-time mode"
        />
      </section>

      {/* answers */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">
            Answers{" "}
            <span className="text-sm font-normal text-neutral-400">
              ({messages.length})
            </span>
          </h2>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={exportCsv}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={exportTxt}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
                >
                  <FileText className="h-4 w-4" />
                  TXT
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    setConfirm({
                      title: "Clear all answers?",
                      message: `All ${messages.length} answers in this room will be permanently removed. Export them first if you want to keep a copy.`,
                      confirmLabel: "Clear all",
                      onConfirm: clearAll,
                    })
                  }
                  className="text-sm text-neutral-400 transition-colors hover:text-red-500 disabled:opacity-50"
                >
                  Clear all
                </button>
              </>
            )}
          </div>
        </div>

        {messages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center text-sm text-neutral-400">
            No answers yet. They will appear here live as your audience sends
            them.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((m, index) => (
              <li
                key={m.id}
                className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white px-5 py-3.5 shadow-sm transition-colors hover:border-sky/60"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-soft text-xs font-medium text-neutral-500">
                  {messages.length - index}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm leading-relaxed">
                    {m.text}
                  </p>
                  <p className="mt-1 text-xs text-neutral-300">
                    {formatDateTime(m.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    setConfirm({
                      title: "Delete this answer?",
                      message:
                        m.text.length > 80
                          ? `"${m.text.slice(0, 80)}..." will be permanently removed.`
                          : `"${m.text}" will be permanently removed.`,
                      confirmLabel: "Delete",
                      onConfirm: () => deleteMessage(m.id),
                    })
                  }
                  title="Delete answer"
                  className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editOpen && <EditRoomDialog room={room} onClose={() => setEditOpen(false)} />}
      <ConfirmDialog options={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
