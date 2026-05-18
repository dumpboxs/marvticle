import { z } from 'zod'

import { threadsTable } from '#/db/schemas/threads'
import { userSelectSchema } from '#/features/users/schemas/users.schema'
import {
  commentsCountSchema,
  createInsertSchema,
  createSelectSchema,
  feedThreadSchema,
  limitThreadsSchema,
  periodThreadSchema,
  pointsSchema,
  sortThreadSchema,
  voteDirectionNullableSchema,
} from '#/schemas/drizzle-zod'

export const threadOutputSchema = createSelectSchema(threadsTable)
  .pick({
    id: true,
    title: true,
    slug: true,
    content: true,
    points: true,
    commentsCount: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    points: pointsSchema,
    commentsCount: commentsCountSchema,
    author: userSelectSchema.pick({
      id: true,
      name: true,
      username: true,
      image: true,
      verified: true,
    }),
    isVoted: voteDirectionNullableSchema,
  })

export const listThreadsInputSchema = z.object({
  feed: feedThreadSchema.optional().default('discover'),
  sort: sortThreadSchema.optional(),
  period: periodThreadSchema.optional().default('all'),
  limit: limitThreadsSchema,
  cursor: z.string().optional(),
})

export const threadsOutputSchema = z.object({
  items: threadOutputSchema.array(),
  nextCursor: z.string().nullable(),
})

export const getOneThreadInputSchema = threadOutputSchema.pick({
  slug: true,
})

export const threadInsertSchema = createInsertSchema(threadsTable, {
  title: (s) =>
    s
      .nonempty({ error: 'Title is required' })
      .max(255, { message: 'Title must be at most 255 characters long' }),
  content: (s) => s.nonempty({ error: 'Content is required' }),
}).pick({
  title: true,
  content: true,
})
