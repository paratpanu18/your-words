import { NextResponse } from "next/server";
import { getCurrentAdmin } from "./auth";
import type { AdminRow } from "./queries";

export async function requireAdmin(): Promise<
  { admin: AdminRow; error: null } | { admin: null; error: NextResponse }
> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return {
      admin: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { admin, error: null };
}
