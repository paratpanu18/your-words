import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageCircleHeart } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { RateLimitSettingsCard } from "@/components/rate-limit-settings";
import { RoomsClient } from "@/components/rooms-client";
import { getCurrentAdmin } from "@/lib/auth";
import { getRateLimitSettings, listRooms } from "@/lib/queries";

export const metadata: Metadata = { title: "Rooms" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const rooms = listRooms();
  const rateLimitSettings = getRateLimitSettings();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blush">
            <MessageCircleHeart className="h-4.5 w-4.5 text-[#2a2a33]" />
          </span>
          <div>
            <p className="font-semibold leading-tight">Your Words</p>
            <p className="text-xs text-neutral-400">Signed in as {admin.username}</p>
          </div>
        </div>
        <LogoutButton />
      </header>

      <RoomsClient rooms={rooms} />

      <div className="mt-10">
        <RateLimitSettingsCard settings={rateLimitSettings} />
      </div>
    </div>
  );
}
