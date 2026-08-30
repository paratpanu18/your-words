"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link2, Maximize, Minimize, PauseCircle, XCircle } from "lucide-react";
import {
  CloudBubbles,
  computePlacement,
  type CloudMessage,
} from "@/components/cloud-bubbles";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { AuroraText } from "@/components/magicui/aurora-text";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { motion } from "motion/react";

interface PresentationClientProps {
  code: string;
  name: string;
  initialStatus: "open" | "paused" | "closed";
  initialRealtime: boolean;
  initialMessages: Array<{ id: number; text: string }>;
}

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

export function PresentationClient({
  code,
  name,
  initialStatus,
  initialRealtime,
  initialMessages,
}: PresentationClientProps) {
  const [messages, setMessages] = useState<CloudMessage[]>(() =>
    initialMessages.reduce<CloudMessage[]>((acc, m) => {
      if (acc.some((x) => x.id === m.id)) return acc;
      const pos = computePlacement(acc, m.id);
      acc.push({ ...m, ...pos });
      return acc;
    }, []),
  );
  const [status, setStatus] = useState(initialStatus);
  const [realtime, setRealtime] = useState(initialRealtime);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const lastIdRef = useRef(
    initialMessages.length > 0
      ? initialMessages[initialMessages.length - 1].id
      : 0,
  );

  const origin = useSyncExternalStore(subscribe, getOrigin, getServerOrigin);
  const shareUrl = `${origin}/room/${code}`;

  const applyIncoming = useCallback((incoming: Array<{ id: number; text: string }>) => {
    if (incoming.length === 0) return;
    lastIdRef.current = Math.max(
      lastIdRef.current,
      incoming[incoming.length - 1].id,
    );
    setMessages((prev) => {
      // Placement is computed once at arrival — pure and deterministic,
      // so it never changes afterwards.
      const additions: CloudMessage[] = [];
      for (const inc of incoming) {
        if (prev.some((x) => x.id === inc.id)) continue;
        additions.push({ ...inc, ...computePlacement(prev, inc.id) });
      }
      if (additions.length === 0) return prev;
      return [...prev, ...additions];
    });
  }, []);

  // Real-time mode (room setting): server-sent events push instantly.
  useEffect(() => {
    if (!realtime) return;
    const source = new EventSource(
      `/api/rooms/${encodeURIComponent(code)}/stream?after=${lastIdRef.current}`,
    );
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" && data.message) {
          applyIncoming([data.message]);
        } else if (data.type === "status" && data.status) {
          setStatus(data.status);
        } else if (data.type === "realtime" && !data.realtime) {
          // Admin turned real time off; fall back to polling.
          setRealtime(false);
        } else if (data.type === "hello") {
          if (data.status) setStatus(data.status);
          if (typeof data.realtime === "boolean" && !data.realtime) {
            setRealtime(false);
          }
        }
      } catch {
        // ignore malformed events
      }
    };
    source.onerror = () => {
      // The browser retries transient drops automatically; a fatal close
      // falls back to polling.
      if (source.readyState === EventSource.CLOSED) {
        setRealtime(false);
      }
    };
    return () => source.close();
  }, [realtime, code, applyIncoming]);

  // Polling mode (used when the room's real-time setting is off).
  useEffect(() => {
    if (realtime) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/rooms/${encodeURIComponent(code)}/messages?after=${lastIdRef.current}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);
        if (Array.isArray(data.messages)) {
          applyIncoming(data.messages);
        }
        // Admin may switch the room back to real time; follow along.
        if (data.realtime === true) {
          setRealtime(true);
        }
      } catch {
        // ignore transient errors
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [realtime, code, applyIncoming]);

  useEffect(() => {
    const handler = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-gradient-to-br from-sky-soft via-paper to-blush-soft">
      <DotPattern
        width={28}
        height={28}
        cx={1.5}
        cy={1.5}
        cr={1.5}
        interactive={false}
        className="fill-sky-deep/15 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />

      <header className="relative z-10 flex items-start justify-between gap-6 px-8 py-6">
        {/* room title with aurora gradient, top-left */}
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="min-w-0"
        >
          <h1 className="break-words text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            <SparklesText>
              <AuroraText>{name}</AuroraText>
            </SparklesText>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-2 text-sm text-neutral-500"
          >
            {messages.length} {messages.length === 1 ? "message" : "messages"}
            {" · "}
            <span className="font-mono tracking-[0.2em]">
              {code.toUpperCase()}
            </span>
          </motion.p>
        </motion.div>

        {/* controls + QR code, top-right */}
        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyLink}
              title="Copy room link"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/90 px-3 text-sm text-neutral-500 transition-colors hover:bg-white"
            >
              <Link2 className="h-4 w-4" />
              {copied ? "Copied" : "Link"}
            </button>
            <button
              type="button"
              onClick={() =>
                document.fullscreenElement
                  ? document.exitFullscreen()
                  : document.documentElement.requestFullscreen()
              }
              title="Toggle fullscreen"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200/80 bg-white/90 text-neutral-500 transition-colors hover:bg-white"
            >
              {fullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15,
              type: "spring",
              stiffness: 140,
              damping: 18,
            }}
            className="rounded-2xl border border-neutral-200/70 bg-white p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
          >
            <QRCodeSVG
              value={shareUrl}
              size={92}
              bgColor="#ffffff"
              fgColor="#2a2a33"
              level="M"
            />
            <p className="mt-1.5 text-center font-mono text-[10px] tracking-[0.25em] text-neutral-500">
              {code.toUpperCase()}
            </p>
          </motion.div>
        </div>
      </header>

      {messages.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <CloudBubbles messages={messages} />
        </div>
      )}

      <main className="relative z-10 flex-1 px-8 pb-8">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-neutral-400">
            <p className="text-xl font-medium text-neutral-500">
              Waiting for your audience...
            </p>
            <p className="text-sm">
              Scan the QR code or share the room link and their words will
              appear here.
            </p>
          </div>
        )}
      </main>

      {status !== "open" && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 bg-[#2a2a33]/90 py-3 text-sm text-white">
          {status === "paused" ? (
            <>
              <PauseCircle className="h-4 w-4" />
              This room is paused — new messages are not being accepted
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              This room is closed
            </>
          )}
        </div>
      )}
    </div>
  );
}
