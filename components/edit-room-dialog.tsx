"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { PhonePreview } from "@/components/phone-preview";
import { ToggleSwitch } from "@/components/toggle-switch";
import type { RoomRow } from "@/lib/queries";

export function EditRoomDialog({
  room,
  onClose,
}: {
  room: RoomRow;
  onClose: () => void;
}) {
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? "");
  const [placeholder, setPlaceholder] = useState(room.placeholder ?? "");
  const [footerText, setFooterText] = useState(room.footer_text ?? "");
  const [pin, setPin] = useState(room.pin ?? "");
  const [realtime, setRealtime] = useState(room.realtime === 1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function save() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/admin/rooms/${room.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        placeholder,
        footerText,
        pin: pin || null,
        realtime,
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      onClose();
    } else {
      setError(data?.error ?? "Could not save room");
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#2a2a33]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative z-10 max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Edit room
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Update the room details and preview the attendee view.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_250px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="flex flex-col gap-4"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-600">
                Room name <span className="text-neutral-400">(required)</span>
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                className="h-11 rounded-xl border border-neutral-200 px-4 outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-600">
                Description
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Shown to attendees"
                maxLength={200}
                rows={3}
                className="resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
              />
              <span className="text-xs text-neutral-400">
                {description.length}/200
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-neutral-600">
                  Input placeholder
                </span>
                <input
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  maxLength={100}
                  className="h-11 w-full rounded-xl border border-neutral-200 px-4 outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-neutral-600">
                  Footer text
                </span>
                <input
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  maxLength={120}
                  className="h-11 w-full rounded-xl border border-neutral-200 px-4 outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-600">
                PIN{" "}
                <span className="text-neutral-400">
                  (4-8 digits, empty = public)
                </span>
              </span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                maxLength={8}
                className="h-11 w-full rounded-xl border border-neutral-200 px-4 font-mono outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
              />
            </label>

            <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-700">
                  Real-time mode
                </p>
                <p className="text-xs text-neutral-400">
                  Instant pushes on the presentation screen
                </p>
              </div>
              <ToggleSwitch
                checked={realtime}
                onChange={setRealtime}
                label="Real-time mode"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-11 flex-1 rounded-full border border-neutral-200 font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || !name.trim()}
                className="h-11 flex-1 rounded-full bg-sky font-medium text-[#2a2a33] shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
              >
                {pending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>

          <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
              Preview
            </p>
            <PhonePreview
              name={name}
              description={description}
              placeholder={placeholder}
              footerText={footerText}
              pin={pin}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
