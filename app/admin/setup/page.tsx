import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { SetupForm } from "@/components/setup-form";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { hasAnyAdmin } from "@/lib/queries";

export const metadata: Metadata = { title: "Admin setup" };
export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  const alreadySetUp = await hasAnyAdmin();

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <DotPattern width={24} height={24} cx={1.5} cy={1.5} cr={1.5} className="fill-sky-deep/20 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <main className="relative z-10 w-full max-w-sm rounded-3xl border border-neutral-100 bg-white/90 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blush shadow-sm">
            <ShieldCheck className="h-5 w-5 text-[#2a2a33]" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Set up admin</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Create the first admin account
            </p>
          </div>
        </div>

        {alreadySetUp ? (
          <p className="text-center text-sm leading-relaxed text-neutral-500">
            Setup is already complete. Please sign in instead.
          </p>
        ) : (
          <SetupForm />
        )}
      </main>
    </div>
  );
}
