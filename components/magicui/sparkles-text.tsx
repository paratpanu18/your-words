"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * MagicUI-style Sparkles Text: twinkling four-point stars scattered around
 * the text. Colors follow the site palette.
 */

const SPARKLE_COLORS = ["#8ec8f2", "#f7b3c0", "#ffd7de"];

const SPARKLES = [
  { left: "-4%", top: "-22%", size: 14, duration: 2.4, delay: 0 },
  { left: "26%", top: "-34%", size: 10, duration: 3.1, delay: 0.7 },
  { left: "96%", top: "-16%", size: 16, duration: 2.8, delay: 1.2 },
  { left: "103%", top: "58%", size: 11, duration: 2.2, delay: 0.4 },
  { left: "74%", top: "112%", size: 13, duration: 3.4, delay: 1.6 },
  { left: "-8%", top: "82%", size: 12, duration: 2.6, delay: 2.0 },
];

export function SparklesText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-block px-1", className)}>
      {children}
      {SPARKLES.map((s, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{ left: s.left, top: s.top }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 60] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: 1.4,
            ease: "easeInOut",
          }}
        >
          <svg
            width={s.size}
            height={s.size}
            viewBox="0 0 24 24"
            fill={SPARKLE_COLORS[i % SPARKLE_COLORS.length]}
          >
            <path d="M12 0c.9 6.6 4.5 10.2 12 12-7.5 1.8-11.1 5.4-12 12-.9-6.6-4.5-10.2-12-12C7.5 10.2 11.1 6.6 12 0z" />
          </svg>
        </motion.span>
      ))}
    </span>
  );
}
