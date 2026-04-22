import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const visitors = pgTable('visitors', {
  id: text('id').primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
})

export const searches = pgTable('searches', {
  id: text('id').primaryKey(),
  visitorId: text('visitor_id').notNull(),
  resultType: text('result_type').notNull(),
  source: text('source').notNull(),
  primaryResult: jsonb('primary_result').notNull(),
  candidates: jsonb('candidates').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
