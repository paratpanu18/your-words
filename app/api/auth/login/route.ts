import { NextResponse } from "next/server";
import { getAdminByUsername } from "@/lib/queries";
import { startAdminSession, verifyPassword } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const admin = username ? getAdminByUsername(username) : undefined;
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  }

  await startAdminSession(admin);
  return NextResponse.json({ ok: true });
}
