import { z } from 'zod'

import { commentsTable } from '#/db/schemas/comments'
import { createInsertSchema, createSelectSchema } from '#/schemas/drizzle-zod'

export const COMMENT_CONTENT_MAX_LENGTH = 5_000

export const commentContentSchema = z
  .string()
  .trim()
  .min(1, { error: 'Comment is required' })
  .max(COMMENT_CONTENT_MAX_LENGTH, {
    error: `Comment must be at most ${COMMENT_CONTENT_MAX_LENGTH} characters long`,
  })

export const commentSelectSchema = createSelectSchema(commentsTable)
  .pick({
    id: true,
    threadId: true,
    parentId: true,
    content: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .extend({
    content: z.string().nullable(),
    isDeleted: z.boolean(),
    author: z.object({
      name: z.string(),
      username: z.string(),
      image: z.string().nullable(),
    }),
  })

export const getThreadCommentsSchema = z.object({
  threadId: z.string().uuid(),
})

export const threadCommentsSchema = z.object({
  items: commentSelectSchema.array(),
  totalCount: z.number().int().min(0),
})

export const commentCreateSchema = createInsertSchema(commentsTable, {
  content: () => commentContentSchema,
})
  .pick({
    threadId: true,
    parentId: true,
    content: true,
  })
  .extend({
    threadId: z.string().uuid(),
    parentId: z.string().uuid().nullish(),
    content: commentContentSchema,
  })

export const commentUpdateSchema = z.object({
  id: z.string().uuid(),
  content: commentContentSchema,
})

export const commentDeleteSchema = z.object({
  id: z.string().uuid(),
})

export type CommentSelect = z.infer<typeof commentSelectSchema>
