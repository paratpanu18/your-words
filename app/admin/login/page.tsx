import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircleHeart } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { hasAnyAdmin } from "@/lib/queries";

export const metadata: Metadata = { title: "Admin sign in" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const needsSetup = !(await hasAnyAdmin());

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <DotPattern width={24} height={24} cx={1.5} cy={1.5} cr={1.5} className="fill-sky-deep/20 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <main className="relative z-10 w-full max-w-sm rounded-3xl border border-neutral-100 bg-white/90 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blush shadow-sm">
            <MessageCircleHeart className="h-5 w-5 text-[#2a2a33]" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Admin sign in</h1>
            <p className="mt-1 text-sm text-neutral-400">Your Words</p>
          </div>
        </div>

        {needsSetup ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm leading-relaxed text-neutral-500">
              No admin account exists yet. Create the first one to get started.
            </p>
            <Link
              href="/admin/setup"
              className="h-11 inline-flex items-center justify-center rounded-full bg-sky font-medium text-[#2a2a33] shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.98]"
            >
              Set up admin
            </Link>
          </div>
        ) : (
          <LoginForm />
        )}
      </main>
    </div>
  );
}
