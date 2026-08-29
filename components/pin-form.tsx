"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";

export function PinForm({ code, error: initialError }: { code: string; error?: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, setPending] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          const res = await fetch(`/api/rooms/${encodeURIComponent(code)}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin }),
          });
          if (res.ok) {
            router.refresh();
          } else {
            const data = await res.json().catch(() => null);
            setError(data?.error ?? "Could not join room");
            setPending(false);
          }
        }}
        className="w-full max-w-sm rounded-3xl border border-neutral-100 bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)]"
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky">
            <Lock className="h-5 w-5 text-[#2a2a33]" />
          </span>
          <div>
            <h1 className="text-lg font-semibold">This room is private</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Enter the PIN shared by the host
            </p>
          </div>
        </div>

        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="PIN"
          maxLength={8}
          required
          className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-center font-mono text-xl tracking-[0.4em] outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
        />

        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 h-11 w-full rounded-full bg-sky font-medium text-[#2a2a33] shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "Joining..." : "Join room"}
        </button>
      </form>
    </div>
  );
}
