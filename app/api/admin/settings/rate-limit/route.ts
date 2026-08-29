import { NextResponse } from "next/server";
import {
  getRateLimitSettings,
  updateRateLimitSettings,
} from "@/lib/queries";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  return NextResponse.json({ rateLimit: getRateLimitSettings() });
}

export async function PUT(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const enabled = body?.enabled === true;
  const limit = Number(body?.limit);
  const windowSec = Number(body?.windowSec);

  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
    return NextResponse.json(
      { error: "Max messages must be between 1 and 1000" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(windowSec) || windowSec < 5 || windowSec > 3600) {
    return NextResponse.json(
      { error: "Window must be between 5 and 3600 seconds" },
      { status: 400 },
    );
  }

  updateRateLimitSettings({
    enabled,
    limit,
    windowMs: windowSec * 1000,
  });

  return NextResponse.json({ ok: true, rateLimit: getRateLimitSettings() });
}
