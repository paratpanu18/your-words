import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  createAdminSession,
  deleteAdminSession,
  getAdminById,
  getAdminSession,
  pruneExpiredSessions,
} from "./queries";
import type { AdminRow } from "./queries";

export const ADMIN_COOKIE = "yw_admin";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export async function startAdminSession(admin: AdminRow): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  createAdminSession(admin.id, token, expiresAt);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (token) {
    deleteAdminSession(token);
  }
  store.delete(ADMIN_COOKIE);
}

export async function getCurrentAdmin(): Promise<AdminRow | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  pruneExpiredSessions();
  const session = getAdminSession(token);
  if (!session || session.expires_at < Date.now()) return null;
  return getAdminById(session.admin_id) ?? null;
}

/* ---------------- room PIN cookie ---------------- */

export function roomPinCookieName(code: string): string {
  return `yw_room_${code.toUpperCase()}`;
}

export async function grantRoomAccess(code: string): Promise<void> {
  const store = await cookies();
  store.set(roomPinCookieName(code), "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/`,
    maxAge: 60 * 60 * 24, // 1 day
  });
}

export async function hasRoomAccess(code: string): Promise<boolean> {
  const store = await cookies();
  return store.get(roomPinCookieName(code))?.value === "1";
}
