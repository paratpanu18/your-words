"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface CloudMessage {
  id: number;
  text: string;
  left: number;
  top: number;
}

const CLOUD_THEMES = [
  { from: "#ffffff", to: "#ffd6df", text: "#8a4b5c" }, // blush
  { from: "#ffffff", to: "#bfe3ff", text: "#3d6b8f" }, // sky
  { from: "#ffffff", to: "#ffe8ee", text: "#96606f" }, // light blush
  { from: "#ffffff", to: "#d9edff", text: "#4a729a" }, // light sky
  { from: "#ffffff", to: "#e6dcff", text: "#6b5a96" }, // lavender
  { from: "#ffffff", to: "#d3f4e4", text: "#3f7d61" }, // mint
];

const MAX_BUBBLES = 60;

// Placement bounds (%) — keeps clouds clear of the header and edges.
const X_MIN = 8;
const X_MAX = 92;
const Y_MIN = 14;
const Y_MAX = 88;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Small deterministic PRNG — every cloud gets its own reproducible
// random stream, so positions are stable across re-renders.
function mulberry32(seed: number) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Placement {
  left: number;
  top: number;
}

/**
 * Pure, deterministic placement for a new message: seeded per id, and
 * sampled away from every already-placed cloud. Call it once when the
 * message arrives — the position is then attached to the message forever.
 */
export function computePlacement(
  existing: Placement[],
  id: number,
): Placement {
  const rand = mulberry32(hashString(String(id)) || 1);
  const others = existing;

  // Best-candidate sampling: try N random spots, keep the one
  // farthest from every existing cloud -> organic, even scatter.
  let best: Placement = {
    left: X_MIN + rand() * (X_MAX - X_MIN),
    top: Y_MIN + rand() * (Y_MAX - Y_MIN),
  };
  let bestScore = -Infinity;

  for (let i = 0; i < 18; i++) {
    const cand: Placement = {
      left: X_MIN + rand() * (X_MAX - X_MIN),
      top: Y_MIN + rand() * (Y_MAX - Y_MIN),
    };
    let minDist = Infinity;
    for (const o of others) {
      // Clouds are wide and flat, so vertical closeness hurts more.
      const dx = cand.left - o.left;
      const dy = (cand.top - o.top) * 1.8;
      minDist = Math.min(minDist, dx * dx + dy * dy);
    }
    // First cloud has no neighbors — just take a random candidate.
    const score = others.length === 0 ? rand() : minDist;
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }

  return best;
}

/** Text font scales down as the message gets longer, and long messages
 * wrap at a fixed character budget so the cloud keeps its proportions. */
function cloudFontPx(basePx: number, text: string): number {
  const mult = Math.min(1.18, Math.max(0.62, Math.sqrt(50 / text.length)));
  return Math.max(11, Math.round(basePx * mult));
}

function cloudChCap(text: string): number {
  return text.length <= 36 ? 36 : 26;
}

/** ... CloudShape from before, unchanged ... */
function CloudShape({
  theme,
  fontPx,
  text,
  uid,
  chCap,
}: {
  theme: (typeof CLOUD_THEMES)[number];
  fontPx: number;
  text: string;
  uid: number;
  chCap: number;
}) {
  const gradId = `cloud-grad-${uid}`;
  const clipId = `cloud-clip-${uid}`;

  const shapes = (
    <>
      <rect x="8" y="50" width="204" height="92" rx="46" />
      <circle cx="58" cy="54" r="34" />
      <circle cx="112" cy="46" r="44" />
      <circle cx="168" cy="56" r="32" />
    </>
  );

  return (
    <div className="relative" style={{ fontSize: `${fontPx}px` }}>
      <svg
        className="absolute inset-0 h-full w-full drop-shadow-[0_14px_28px_rgba(120,150,190,0.35)]"
        viewBox="0 0 220 150"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="0"
            y2="150"
          >
            <stop offset="0%" stopColor={theme.from} />
            <stop offset="100%" stopColor={theme.to} />
          </linearGradient>
          <clipPath id={clipId}>{shapes}</clipPath>
        </defs>
        <g fill={`url(#${gradId})`}>{shapes}</g>
        <g clipPath={`url(#${clipId})`}>
          <ellipse cx="100" cy="40" rx="78" ry="30" fill="#ffffff" opacity="0.5" />
        </g>
      </svg>

      <div
        className="relative flex min-h-[4.8em] min-w-[8em] items-center justify-center px-[1.9em] pt-[1.9em] pb-[1em] text-center"
        style={{ maxWidth: `${chCap}ch` }}
      >
        <p
          className="break-words font-semibold leading-snug [text-shadow:0_1px_0_rgba(255,255,255,0.7)]"
          style={{ color: theme.text }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

export function CloudBubbles({ messages }: { messages: CloudMessage[] }) {
  const visible = useMemo(() => messages.slice(-MAX_BUBBLES), [messages]);
  const count = visible.length;

  const layout = useMemo(() => {
    if (count === 0) return { fontPx: 28, maxW: 40 };
    const scale = Math.max(0.55, Math.min(1.5, 1.45 - count / 55));
    const fontPx = Math.round(Math.min(30, 17 * scale));
    // Max width per cloud shrinks gently as the sky fills up.
    const maxW = Math.max(16, Math.min(44, 96 / Math.sqrt(count + 1)));
    return { fontPx, maxW };
  }, [count]);

  return (
    <div className="relative h-full w-full">
      <AnimatePresence>
        {visible.map((m) => {
          const h = hashString(String(m.id));
          const r = (shift: number) => ((h >> shift) % 1000) / 1000;

          const pos = { left: m.left, top: m.top };

          // Dynamic text sizing: shorter messages render larger, longer
          // ones shrink and wrap so the cloud keeps its proportions.
          const fontPx = cloudFontPx(layout.fontPx, m.text);
          const chCap = cloudChCap(m.text);

          // Natural depth: clouds lower on screen are nearer -> slightly
          // bigger and layered in front, like a real sky.
          const nearness = (pos.top - Y_MIN) / (Y_MAX - Y_MIN); // 0..1
          const depth = 0.82 + nearness * 0.22 + r(11) * 0.14;
          const rotate = (r(14) - 0.5) * 7;
          const theme = CLOUD_THEMES[h % CLOUD_THEMES.length];

          return (
            <motion.div
              key={m.id}
              className="absolute"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                zIndex: Math.round(pos.top * 10),
                maxWidth: `${layout.maxW}%`,
                willChange: "transform, opacity",
              }}
              initial={{ x: "-50%", y: "-50%", opacity: 0, scale: 0.3 }}
              animate={{ x: "-50%", y: "-50%", opacity: 1, scale: depth }}
              exit={{
                opacity: 0,
                scale: 0.4,
                transition: { duration: 0.3, ease: "easeIn" },
              }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
            >
              <motion.div
                initial={{ y: 60, rotate: rotate + 8 }}
                animate={{ y: 0, rotate }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
              >
                <motion.div
                  animate={{
                    x: [0, (r(3) - 0.5) * 34, (r(5) - 0.5) * 26, 0],
                    y: [0, -(8 + r(6) * 14), 4 + r(8) * 8, 0],
                    rotate: [0, (r(9) - 0.5) * 4, (r(10) - 0.5) * -4, 0],
                  }}
                  transition={{
                    duration: 9 + r(4) * 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <CloudShape
                    theme={theme}
                    fontPx={fontPx}
                    text={m.text}
                    uid={m.id}
                    chCap={chCap}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
