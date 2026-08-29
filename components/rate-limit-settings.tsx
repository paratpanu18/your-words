"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gauge } from "lucide-react";
import { ToggleSwitch } from "@/components/toggle-switch";
import type { RateLimitSettings } from "@/lib/queries";

export function RateLimitSettingsCard({
  settings,
}: {
  settings: RateLimitSettings;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [limit, setLimit] = useState(String(settings.limit));
  const [windowSec, setWindowSec] = useState(String(settings.windowMs / 1000));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/settings/rate-limit", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled,
        limit: Number(limit),
        windowSec: Number(windowSec),
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not save settings");
    }
    setPending(false);
  }

  return (
    <form
      onSubmit={save}
      className="mb-10 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-medium">
            <Gauge className="h-4 w-4 text-neutral-400" />
            Rate limiting
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-400">
            Limits how many messages one attendee (per IP) can send within a
            time window. Off by default.
          </p>
        </div>
        <ToggleSwitch
          checked={enabled}
          onChange={setEnabled}
          label="Enable rate limiting"
        />
      </div>

      <div
        className={`mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-100 pt-4 transition-opacity ${
          enabled ? "" : "pointer-events-none opacity-40"
        }`}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-neutral-500">
            Max messages
          </span>
          <input
            value={limit}
            onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={4}
            className="h-10 w-28 rounded-xl border border-neutral-200 px-3 outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
          />
        </label>
        <span className="pb-2.5 text-sm text-neutral-400">per</span>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-neutral-500">
            Window (seconds)
          </span>
          <input
            value={windowSec}
            onChange={(e) => setWindowSec(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={4}
            className="h-10 w-28 rounded-xl border border-neutral-200 px-3 outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
          />
        </label>
        <span className="pb-2.5 text-sm text-neutral-400">
          per attendee
        </span>

        <div className="ml-auto flex items-center gap-3 pb-0.5">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">Saved</p>}
          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-full bg-sky px-5 text-sm font-medium text-[#2a2a33] shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
