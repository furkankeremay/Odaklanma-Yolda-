import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.ts';
import path from 'path';

const dbPath = path.join(process.cwd(), 'sqlite.db');
const sqlite = new Database(dbPath);

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Auto-create tables so no migration step is needed
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id            TEXT    PRIMARY KEY,
    username      TEXT    NOT NULL,
    okul_adi      TEXT    NOT NULL,
    sehir_adi     TEXT    NOT NULL DEFAULT '',
    basari_puani  INTEGER NOT NULL DEFAULT 0,
    seri_gunu     INTEGER NOT NULL DEFAULT 0,
    email         TEXT,
    password_hash TEXT
  );

  CREATE TABLE IF NOT EXISTS denemeler (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       TEXT    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    deneme_adi    TEXT    NOT NULL,
    deneme_turu   TEXT    NOT NULL,
    turkce_net    REAL    NOT NULL DEFAULT 0,
    sosyal_net    REAL    NOT NULL DEFAULT 0,
    matematik_net REAL    NOT NULL DEFAULT 0,
    fen_net       REAL    NOT NULL DEFAULT 0,
    toplam_net    REAL    NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
`);

console.log('[DB] SQLite veritabanı hazır:', dbPath);

export const db = drizzle(sqlite, { schema });
