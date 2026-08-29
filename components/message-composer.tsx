"use client";

import { useEffect, useState } from "react";
import { MessageCircleHeart, PauseCircle, Send, XCircle } from "lucide-react";

const MAX_LENGTH = 150;

interface ComposerProps {
  code: string;
  description: string | null;
  placeholder: string | null;
  footerText: string | null;
  initialStatus: "open" | "paused" | "closed";
}

export function MessageComposer({
  code,
  description,
  placeholder,
  footerText,
  initialStatus,
}: ComposerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  // Poll room status lightly (skip the message payload).
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/rooms/${encodeURIComponent(code)}/messages?after=9999999999`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
        }
      } catch {
        // ignore transient errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [code]);

  async function send() {
    const value = text.trim();
    if (!value || pending) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/api/rooms/${encodeURIComponent(code)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: value }),
    });
    if (res.ok) {
      setText("");
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Could not send message");
    }
    setPending(false);
  }

  const remaining = MAX_LENGTH - text.length;

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-sky-soft via-paper to-paper">
      <header className="px-6 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blush shadow-sm">
            <MessageCircleHeart className="h-5 w-5 text-[#2a2a33]" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">Your Words</h1>
        </div>
        {description && (
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-neutral-500">
            {description}
          </p>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5">
        {status === "closed" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-neutral-400">
            <XCircle className="h-10 w-10" />
            <p>This room is closed. Thank you for participating.</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            {status === "paused" && (
              <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <PauseCircle className="h-4 w-4 shrink-0" />
                The host has paused this room. You can still write your message.
              </div>
            )}

            <div className="relative flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                placeholder={placeholder?.trim() || "Write your words here..."}
                rows={6}
                className="h-full min-h-40 w-full resize-none rounded-3xl border border-neutral-200 bg-white p-5 pb-9 text-base leading-relaxed shadow-sm outline-none transition-colors placeholder:text-neutral-300 focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
              />
              <span
                className={`pointer-events-none absolute bottom-3 right-4 text-xs tabular-nums ${
                  remaining <= 40 ? "text-amber-600" : "text-neutral-400"
                }`}
              >
                {text.length}/{MAX_LENGTH}
              </span>
            </div>

            <div className="mt-3 flex min-h-5 items-center justify-end">
              {sent && <span className="text-xs text-green-600">Sent</span>}
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={send}
              disabled={pending || !text.trim() || status === "paused"}
              className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-blush py-4 font-medium text-[#2a2a33] shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {pending ? "Sending..." : "Send to screen"}
            </button>

            {footerText?.trim() && (
              <p className="pb-6 text-center text-sm leading-relaxed text-neutral-400">
                {footerText}
              </p>
            )}
            {!footerText?.trim() && <div className="pb-6" />}
          </div>
        )}
      </main>
    </div>
  );
}
