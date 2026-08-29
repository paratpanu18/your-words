import Link from "next/link";
import { MessageCircleHeart, ShieldCheck } from "lucide-react";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { JoinForm } from "@/components/join-form";

export default function HomePage() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <DotPattern width={24} height={24} cx={1.5} cy={1.5} cr={1.5} className="fill-sky-deep/25 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <main className="relative z-10 flex w-full max-w-xl flex-col items-center gap-10 py-20 text-center">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blush shadow-sm">
            <MessageCircleHeart className="h-6 w-6 text-[#2a2a33]" />
          </span>
          <h1 className="text-4xl font-semibold tracking-tight">Your Words</h1>
        </div>

        <p className="max-w-md text-lg leading-relaxed text-neutral-500">
          Send your words to the big screen. Join a room with a code and watch
          your message float up as a cloud.
        </p>

        <JoinForm />

        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <ShieldCheck className="h-4 w-4" />
          Admin sign in
        </Link>
      </main>

      <footer className="relative z-10 pb-8 text-xs text-neutral-400">
        Your Words — words from the room, on the wall.
      </footer>
    </div>
  );
}
