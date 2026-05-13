import { relations } from 'drizzle-orm'

import { accountTable, sessionTable, userTable } from '#/db/schemas/auth'
import { threadsTable } from '#/db/schemas/threads'

export const userRelations = relations(userTable, ({ many }) => ({
  sessions: many(sessionTable),
  accounts: many(accountTable),
  threads: many(threadsTable),
}))

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}))

export const accountRelations = relations(accountTable, ({ one }) => ({
  user: one(userTable, {
    fields: [accountTable.userId],
    references: [userTable.id],
  }),
}))

export const threadRelations = relations(threadsTable, ({ one }) => ({
  author: one(userTable, {
    fields: [threadsTable.authorId],
    references: [userTable.id],
  }),
}))
