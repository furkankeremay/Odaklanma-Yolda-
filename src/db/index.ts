import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.ts';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client, { schema });

export async function initDb(): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS profiles (
      id            TEXT    PRIMARY KEY,
      username      TEXT    NOT NULL,
      okul_adi      TEXT    NOT NULL,
      sehir_adi     TEXT    NOT NULL DEFAULT '',
      basari_puani  INTEGER NOT NULL DEFAULT 0,
      seri_gunu     INTEGER NOT NULL DEFAULT 0,
      email         TEXT,
      password_hash TEXT
    )
  `);

  await client.execute(`
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
    )
  `);

  console.log('[DB] Turso bağlantısı başarılı, tablolar hazır.');
}
