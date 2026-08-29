"use client";

import { Lock, MessageCircleHeart } from "lucide-react";
import { CloudBubbles } from "@/components/cloud-bubbles";

/**
 * Live phone-frame preview of the attendee view, used in the room
 * create/edit dialogs.
 */
export function PhonePreview({
  name,
  description,
  placeholder,
  footerText,
  pin,
}: {
  name: string;
  description: string;
  placeholder: string;
  footerText: string;
  pin: string;
}) {
  const trimmedName = name.trim() || "Your room name";
  const previewText =
    trimmedName.slice(0, 24) + (trimmedName.length > 24 ? "..." : "");

  return (
    <div className="w-[248px] overflow-hidden rounded-[2.2rem] border-[6px] border-neutral-800 bg-white shadow-xl">
      <div className="flex flex-col items-center px-4 pb-3 pt-6 text-center">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blush">
            <MessageCircleHeart className="h-3.5 w-3.5 text-[#2a2a33]" />
          </span>
          <p className="text-sm font-semibold">Your Words</p>
        </div>
        <p className="mt-2 flex min-h-[2.6rem] items-center text-[11px] leading-relaxed text-neutral-500">
          {description.trim() || "The room description will appear here."}
        </p>
        {pin && (
          <p className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2 py-0.5 text-[10px] text-neutral-500">
            <Lock className="h-3 w-3" />
            PIN required
          </p>
        )}
      </div>
      <div className="relative h-28">
        <div className="absolute inset-0 origin-center scale-[0.62]">
          <CloudBubbles
            messages={[
              { id: 1, text: `Welcome to ${previewText}`, left: 50, top: 50 },
            ]}
          />
        </div>
      </div>
      <div className="px-4 pb-5 pt-3">
        <div className="rounded-2xl border border-neutral-200 px-3.5 py-2.5 text-[11px] text-neutral-300">
          {placeholder.trim() || "Write your words here..."}
        </div>
        <div className="mt-2 rounded-full bg-blush py-2 text-center text-[11px] font-medium text-[#2a2a33]">
          Send to screen
        </div>
        {footerText.trim() && (
          <p className="mt-2 text-center text-[10px] leading-relaxed text-neutral-400">
            {footerText}
          </p>
        )}
      </div>
    </div>
  );
}
