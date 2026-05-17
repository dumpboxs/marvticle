import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

import { userTable } from '#/db/schemas/auth'
import { threadsTable } from '#/db/schemas/threads'

export const commentsTable = pgTable(
  'comments',
  {
    id: uuid('id')
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => threadsTable.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references(
      (): AnyPgColumn => commentsTable.id,
      {
        onDelete: 'set null',
      }
    ),
    content: text('content').notNull(),
    depth: integer('depth').notNull().default(0),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('comments_thread_id_idx').on(table.threadId),
    index('comments_parent_id_idx').on(table.parentId),
    index('comments_author_id_idx').on(table.authorId),
    index('comments_thread_created_id_idx').on(
      table.threadId,
      table.createdAt,
      table.id
    ),
  ]
)
