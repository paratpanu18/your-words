"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SetupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (password !== confirm) {
          setError("Passwords do not match");
          return;
        }
        setPending(true);
        setError(null);
        const res = await fetch("/api/auth/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
          router.replace("/admin");
        } else {
          const data = await res.json().catch(() => null);
          setError(data?.error ?? "Setup failed");
          setPending(false);
        }
      }}
      className="flex w-full flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-600">Username</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          minLength={3}
          maxLength={40}
          className="h-11 rounded-xl border border-neutral-200 bg-white px-4 outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-600">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          className="h-11 rounded-xl border border-neutral-200 bg-white px-4 outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-600">
          Confirm password
        </span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          className="h-11 rounded-xl border border-neutral-200 bg-white px-4 outline-none transition-colors focus:border-sky-deep focus:ring-2 focus:ring-sky/50"
        />
      </label>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-full bg-sky font-medium text-[#2a2a33] shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create admin account"}
      </button>
    </form>
  );
}
