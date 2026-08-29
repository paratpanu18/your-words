"use client";

import { useId, useEffect, useState } from "react";
import { motion } from "motion/react";

interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  cr?: number;
}

export function DotPattern({
  width = 20,
  height = 20,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}: DotPatternProps) {
  const id = useId();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = document.body.getBoundingClientRect();
      const x = (event.clientX - rect.width / 2) / 40;
      const y = (event.clientY - rect.height / 2) / 40;
      setOffset({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full fill-neutral-400/40 ${className ?? ""}`}
      {...props}
    >
      <defs>
        <motion.pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          animate={{ x: offset.x, y: offset.y }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        >
          <circle cx={cx} cy={cy} r={cr} />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
