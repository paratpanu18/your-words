"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Lock, X } from "lucide-react";
import { PhonePreview } from "@/components/phone-preview";
import { ToggleSwitch } from "@/components/toggle-switch";

interface CreatedRoom {
  id: number;
  code: string;
}

export function CreateRoomDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (room: CreatedRoom) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [footerText, setFooterText] = useState("");
  const [pin, setPin] = useState("");
  const [realtime, setRealtime] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  async function create() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/admin/rooms", {
      method: "POST",
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
    if (res.ok && data?.room) {
      onCreated(data.room);
    } else {
      setError(data?.error ?? "Could not create room");
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
              Create a room
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Set up the room and preview what your audience will see.
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
              create();
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
                placeholder="e.g. Town hall Q&A"
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
                placeholder="Shown to attendees, e.g. Share one word that describes today..."
                maxLength={200}
                rows={3}
                className="resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
              />
              <span className="text-xs text-neutral-400">
                {description.length}/200
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-600">
                PIN <span className="text-neutral-400">(optional, 4-8 digits)</span>
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Leave empty for a public room"
                  inputMode="numeric"
                  maxLength={8}
                  className="h-11 w-full rounded-xl border border-neutral-200 pl-10 pr-4 outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-600">
                Input placeholder{" "}
                <span className="text-neutral-400">(optional)</span>
              </span>
              <input
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="e.g. What's on your mind?"
                maxLength={100}
                className="h-11 w-full rounded-xl border border-neutral-200 px-4 outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
              />
              <span className="text-xs text-neutral-400">
                Shown inside the message box on the attendee page.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-600">
                Footer text <span className="text-neutral-400">(optional)</span>
              </span>
              <input
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="e.g. Be kind — your words appear on screen"
                maxLength={120}
                className="h-11 w-full rounded-xl border border-neutral-200 px-4 outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
              />
              <span className="text-xs text-neutral-400">
                Shown under the send button on the attendee page.
              </span>
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
                {pending ? "Creating..." : "Create room"}
              </button>
            </div>
          </form>

          {/* live preview of the attendee view */}
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
