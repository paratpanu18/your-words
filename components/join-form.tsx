"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function JoinForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const clean = code.trim().toUpperCase();
        if (!clean) {
          setError("Please enter a room code");
          return;
        }
        setPending(true);
        router.push(`/room/${encodeURIComponent(clean)}`);
      }}
      className="flex w-full max-w-sm flex-col gap-2"
    >
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="ROOM CODE"
          maxLength={6}
          autoComplete="off"
          autoCapitalize="characters"
          className="h-12 w-full rounded-full border border-neutral-200 bg-white px-5 text-center font-mono text-lg tracking-[0.3em] uppercase outline-none transition-colors placeholder:tracking-normal placeholder:text-neutral-400 focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky text-[#2a2a33] shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          aria-label="Join room"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
