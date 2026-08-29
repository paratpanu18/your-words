export type RoomStatus = "open" | "paused" | "closed";

export interface AdminRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface RoomRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
  pin: string | null;
  placeholder: string | null;
  footer_text: string | null;
  realtime: number;
  status: RoomStatus;
  created_at: string;
}

export interface NewRoom {
  name: string;
  pin: string | null;
  description: string | null;
  placeholder: string | null;
  footerText: string | null;
  realtime: boolean;
}

export interface MessageRow {
  id: number;
  room_id: number;
  text: string;
  created_at: string;
}

export interface RoomWithCount extends RoomRow {
  message_count: number;
}

import { getDb } from "./db";
import { publishRoomEvent } from "./events";

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(length: number): string {
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/* ---------------- admins ---------------- */

export function getAdminByUsername(username: string): AdminRow | undefined {
  return getDb()
    .prepare("SELECT * FROM admins WHERE username = ? COLLATE NOCASE")
    .get(username) as AdminRow | undefined;
}

export function getAdminById(id: number): AdminRow | undefined {
  return getDb().prepare("SELECT * FROM admins WHERE id = ?").get(id) as
    | AdminRow
    | undefined;
}

export function hasAnyAdmin(): boolean {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM admins")
    .get() as { n: number };
  return row.n > 0;
}

export function createAdmin(username: string, passwordHash: string): AdminRow {
  const info = getDb()
    .prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)")
    .run(username, passwordHash);
  return getAdminById(Number(info.lastInsertRowid))!;
}

/* ---------------- admin sessions ---------------- */

export function createAdminSession(
  adminId: number,
  token: string,
  expiresAt: number,
): void {
  getDb()
    .prepare("INSERT INTO admin_sessions (token, admin_id, expires_at) VALUES (?, ?, ?)")
    .run(token, adminId, expiresAt);
}

export function getAdminSession(token: string):
  | { admin_id: number; expires_at: number }
  | undefined {
  return getDb()
    .prepare("SELECT admin_id, expires_at FROM admin_sessions WHERE token = ?")
    .get(token) as { admin_id: number; expires_at: number } | undefined;
}

export function deleteAdminSession(token: string): void {
  getDb().prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
}

export function pruneExpiredSessions(): void {
  getDb().prepare("DELETE FROM admin_sessions WHERE expires_at < ?").run(
    Date.now(),
  );
}

/* ---------------- rooms ---------------- */

export function createRoom(input: NewRoom): RoomRow {
  const db = getDb();
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = randomCode(6);
    try {
      const info = db
        .prepare(
          "INSERT INTO rooms (code, name, pin, description, placeholder, footer_text, realtime) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .run(
          code,
          input.name,
          input.pin,
          input.description,
          input.placeholder,
          input.footerText,
          input.realtime ? 1 : 0,
        );
      return getRoomById(Number(info.lastInsertRowid))!;
    } catch {
      // code collision, retry
    }
  }
  throw new Error("Could not generate a unique room code");
}

export function getRoomById(id: number): RoomRow | undefined {
  return getDb().prepare("SELECT * FROM rooms WHERE id = ?").get(id) as
    | RoomRow
    | undefined;
}

export function getRoomByCode(code: string): RoomRow | undefined {
  return getDb()
    .prepare("SELECT * FROM rooms WHERE code = ? COLLATE NOCASE")
    .get(code) as RoomRow | undefined;
}

export function listRooms(): RoomWithCount[] {
  return getDb()
    .prepare(
      `SELECT rooms.*, COUNT(messages.id) AS message_count
       FROM rooms LEFT JOIN messages ON messages.room_id = rooms.id
       GROUP BY rooms.id
       ORDER BY rooms.created_at DESC, rooms.id DESC`,
    )
    .all() as RoomWithCount[];
}

export function updateRoomStatus(id: number, status: RoomStatus): void {
  getDb().prepare("UPDATE rooms SET status = ? WHERE id = ?").run(status, id);
  publishRoomEvent(id, { type: "status", status });
}

export function updateRoomRealtime(id: number, realtime: boolean): void {
  getDb()
    .prepare("UPDATE rooms SET realtime = ? WHERE id = ?")
    .run(realtime ? 1 : 0, id);
  publishRoomEvent(id, { type: "realtime", realtime });
}

export function updateRoomMeta(
  id: number,
  fields: {
    name?: string;
    description?: string | null;
    placeholder?: string | null;
    footerText?: string | null;
  },
): void {
  const sets: string[] = [];
  const values: (string | null)[] = [];
  if (fields.name !== undefined) {
    sets.push("name = ?");
    values.push(fields.name);
  }
  if (fields.description !== undefined) {
    sets.push("description = ?");
    values.push(fields.description);
  }
  if (fields.placeholder !== undefined) {
    sets.push("placeholder = ?");
    values.push(fields.placeholder);
  }
  if (fields.footerText !== undefined) {
    sets.push("footer_text = ?");
    values.push(fields.footerText);
  }
  if (sets.length === 0) return;
  getDb()
    .prepare(`UPDATE rooms SET ${sets.join(", ")} WHERE id = ?`)
    .run(...values, id);
}

export function updateRoomPin(id: number, pin: string | null): void {
  getDb().prepare("UPDATE rooms SET pin = ? WHERE id = ?").run(pin, id);
}

export function deleteRoom(id: number): void {
  getDb().prepare("DELETE FROM rooms WHERE id = ?").run(id);
}

/* ---------------- messages ---------------- */

export function createMessage(roomId: number, text: string): MessageRow {
  const info = getDb()
    .prepare("INSERT INTO messages (room_id, text) VALUES (?, ?)")
    .run(roomId, text);
  const message = getMessageById(Number(info.lastInsertRowid))!;
  publishRoomEvent(roomId, {
    type: "message",
    message: { id: message.id, text: message.text },
  });
  return message;
}

export function getMessageById(id: number): MessageRow | undefined {
  return getDb().prepare("SELECT * FROM messages WHERE id = ?").get(id) as
    | MessageRow
    | undefined;
}

export function listMessagesAfter(roomId: number, afterId: number): MessageRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM messages WHERE room_id = ? AND id > ? ORDER BY id ASC",
    )
    .all(roomId, afterId) as MessageRow[];
}

export function listAllMessages(roomId: number): MessageRow[] {
  return getDb()
    .prepare("SELECT * FROM messages WHERE room_id = ? ORDER BY id DESC")
    .all(roomId) as MessageRow[];
}

export function deleteMessage(id: number): boolean {
  const info = getDb().prepare("DELETE FROM messages WHERE id = ?").run(id);
  return info.changes > 0;
}

export function deleteAllMessages(roomId: number): void {
  getDb().prepare("DELETE FROM messages WHERE room_id = ?").run(roomId);
}

export function countMessages(roomId: number): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM messages WHERE room_id = ?")
    .get(roomId) as { n: number };
  return row.n;
}
