import { NextResponse } from "next/server";
import { hasAnyAdmin, createAdmin } from "@/lib/queries";
import { hashPassword, startAdminSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(`setup:${clientIp(request)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  if (hasAnyAdmin()) {
    return NextResponse.json(
      { error: "Setup already completed" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (username.length < 3 || username.length > 40) {
    return NextResponse.json(
      { error: "Username must be 3-40 characters" },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const admin = createAdmin(username, hashPassword(password));
  await startAdminSession(admin);
  return NextResponse.json({ ok: true });
}
