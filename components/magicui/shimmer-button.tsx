import { cn } from "@/lib/utils";
import React from "react";

interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  background?: string;
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      shimmerColor = "rgba(255, 255, 255, 0.75)",
      background = "rgba(180, 223, 255, 1)",
      className,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        style={
          {
            background,
            "--shimmer-color": shimmerColor,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "shimmer-btn relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 font-medium text-[#2a2a33] shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <span className="relative z-10 inline-flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";
