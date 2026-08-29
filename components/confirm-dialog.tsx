"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  options,
  onClose,
}: {
  options: ConfirmOptions | null;
  onClose: () => void;
}) {
  const open = options !== null;

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

  if (!options) return null;

  const destructive = options.destructive !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#2a2a33]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3.5">
          {destructive && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
              <TriangleAlert className="h-5 w-5 text-red-500" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-[#2a2a33]">{options.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
              {options.message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-full border border-neutral-200 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              options.onConfirm();
              onClose();
            }}
            className={cn(
              "h-10 flex-1 rounded-full text-sm font-medium text-white transition-colors",
              destructive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[#2a2a33] hover:bg-[#3a3a45]",
            )}
          >
            {options.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
