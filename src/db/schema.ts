import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  okulAdi: text('okul_adi').notNull(),
  sehirAdi: text('sehir_adi').default('').notNull(),
  basariPuani: integer('basari_puani').default(0).notNull(),
  seriGunu: integer('seri_gunu').default(0).notNull(),
  email: text('email'),
  passwordHash: text('password_hash'),
});

export const denemeler = sqliteTable('denemeler', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  denemeAdi: text('deneme_adi').notNull(),
  denemeTuru: text('deneme_turu').notNull(),
  turkceNet: real('turkce_net').default(0).notNull(),
  sosyalNet: real('sosyal_net').default(0).notNull(),
  matematikNet: real('matematik_net').default(0).notNull(),
  fenNet: real('fen_net').default(0).notNull(),
  toplamNet: real('toplam_net').default(0).notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()).notNull(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  denemeler: many(denemeler),
}));

export const denemelerRelations = relations(denemeler, ({ one }) => ({
  profile: one(profiles, {
    fields: [denemeler.userId],
    references: [profiles.id],
  }),
}));
