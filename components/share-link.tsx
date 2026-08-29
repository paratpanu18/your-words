"use client";

import { useSyncExternalStore } from "react";
import { CopyButton } from "@/components/copy-button";

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

export function ShareLink({ code }: { code: string }) {
  const origin = useSyncExternalStore(subscribe, getOrigin, getServerOrigin);
  const url = `${origin}/room/${code}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
        {url}
      </code>
      <CopyButton value={url} label="Copy link" />
    </div>
  );
}
