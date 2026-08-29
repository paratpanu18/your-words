import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR =
  process.env.YOUR_WORDS_DATA_DIR ?? path.join(process.cwd(), "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const globalForDb = globalThis as unknown as {
  __yourWordsDb?: Database.Database;
};

function createDb(): Database.Database {
  const db = new Database(path.join(DATA_DIR, "your-words.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      description TEXT,
      pin TEXT,
      placeholder TEXT,
      footer_text TEXT,
      realtime INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paused', 'closed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id, id);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);
  `);

  // Migration for databases created before the description column existed.
  try {
    db.exec("ALTER TABLE rooms ADD COLUMN description TEXT");
  } catch {
    // column already exists
  }
  // Migration for databases created before the realtime column existed.
  try {
    db.exec("ALTER TABLE rooms ADD COLUMN realtime INTEGER NOT NULL DEFAULT 0");
  } catch {
    // column already exists
  }
  // Migration for databases created before the customization columns existed.
  try {
    db.exec("ALTER TABLE rooms ADD COLUMN placeholder TEXT");
  } catch {
    // column already exists
  }
  try {
    db.exec("ALTER TABLE rooms ADD COLUMN footer_text TEXT");
  } catch {
    // column already exists
  }
  return db;
}

export function getDb(): Database.Database {
  if (!globalForDb.__yourWordsDb) {
    globalForDb.__yourWordsDb = createDb();
  }
  return globalForDb.__yourWordsDb;
}
