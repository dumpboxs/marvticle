import { and, desc, eq, lt, or } from 'drizzle-orm'
import limax from 'limax'
import { nanoid } from 'nanoid'

import { userTable } from '#/db/schemas'
import { threadsTable } from '#/db/schemas/threads'
import { threadPaginationCursorSchema } from '#/features/threads/schemas/thread.schema'
import type { ThreadPaginationCursor } from '#/features/threads/schemas/thread.schema'
import { orpcBase } from '#/orpc'
import { orpcRequireAuthMiddleware } from '#/orpc/middlewares'

const generateSlug = (title: string): string => {
  return `${limax(title)}-${nanoid(9)}`
}

const encodeCursor = (cursor: ThreadPaginationCursor): string => {
  return Buffer.from(JSON.stringify(cursor), 'utf-8').toString('base64url')
}

const decodeCursor = (cursor: string): ThreadPaginationCursor | null => {
  try {
    const value = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf-8')
    ) as unknown

    const result = threadPaginationCursorSchema.safeParse(value)

    if (!result.success) return null

    return result.data
  } catch {
    return null
  }
}

const threadSelect = {
  id: threadsTable.id,
  slug: threadsTable.slug,
  title: threadsTable.title,
  content: threadsTable.content,
  createdAt: threadsTable.createdAt,
  updatedAt: threadsTable.updatedAt,
}

const authorSelect = {
  name: userTable.name,
  username: userTable.username,
  image: userTable.image,
  verified: userTable.verified,
}

const getManyThreadHandler = orpcBase.threads.getMany.handler(
  async ({ context, errors, input }) => {
    const cursor = input.cursor ? decodeCursor(input.cursor) : null

    if (input.cursor && !cursor) {
      throw errors.BAD_REQUEST({ message: 'Invalid thread cursor' })
    }

    const threads = await context.db
      .select({
        ...threadSelect,
        author: authorSelect,
      })
      .from(threadsTable)
      .innerJoin(userTable, eq(threadsTable.authorId, userTable.id))
      .where(
        cursor
          ? or(
              lt(threadsTable.createdAt, cursor.createdAt),
              and(
                eq(threadsTable.createdAt, cursor.createdAt),
                lt(threadsTable.id, cursor.id)
              )
            )
          : undefined
      )
      .orderBy(desc(threadsTable.createdAt), desc(threadsTable.id))
      .limit(input.limit + 1)

    let nextCursor: string | null = null
    const hasMore = threads.length > input.limit
    const items = hasMore ? threads.slice(0, input.limit) : threads
    const lastItem = items.at(-1)

    if (hasMore && lastItem) {
      nextCursor = encodeCursor({
        id: lastItem.id,
        createdAt: lastItem.createdAt,
      })
    }

    return {
      items,
      nextCursor,
    }
  }
)

const getOneThreadBySlugHandler = orpcBase.threads.getOne.handler(
  async ({ context, errors, input }) => {
    const [thread] = await context.db
      .select({
        ...threadSelect,
        author: authorSelect,
      })
      .from(threadsTable)
      .innerJoin(userTable, eq(threadsTable.authorId, userTable.id))
      .where(eq(threadsTable.slug, input.slug))

    if (!thread) {
      throw errors.NOT_FOUND({ message: 'Thread not found' })
    }

    return thread
  }
)

const createThreadHandler = orpcBase
  .use(orpcRequireAuthMiddleware)
  .threads.create.handler(async ({ context, errors, input }) => {
    const slug = generateSlug(input.title)

    const [newThread] = await context.db
      .insert(threadsTable)
      .values({
        ...input,
        slug,
        authorId: context.auth.user.id,
      })
      .returning({ slug: threadsTable.slug })

    if (!newThread) {
      throw errors.INTERNAL_SERVER_ERROR({ message: 'Failed to create thread' })
    }

    return newThread
  })

export const threadsRouter = {
  getMany: getManyThreadHandler,
  getOne: getOneThreadBySlugHandler,
  create: createThreadHandler,
}
