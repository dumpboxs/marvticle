import { and, asc, countDistinct, eq, isNull } from 'drizzle-orm'

import { userTable } from '#/db/schemas/auth'
import { commentsTable } from '#/db/schemas/comments'
import { threadsTable } from '#/db/schemas/threads'
import { commentPaginationCursorSchema } from '#/features/comments/schemas/comment.schema'
import type { CommentPaginationCursor } from '#/features/comments/schemas/comment.schema'
import { orpcBase } from '#/orpc'
import type { ORPCContext } from '#/orpc'
import { orpcRequireAuthMiddleware } from '#/orpc/middlewares'

const DELETED_COMMENT_CONTENT = '[deleted]'

const commentSelect = {
  id: commentsTable.id,
  threadId: commentsTable.threadId,
  authorId: commentsTable.authorId,
  parentId: commentsTable.parentId,
  content: commentsTable.content,
  depth: commentsTable.depth,
  createdAt: commentsTable.createdAt,
  updatedAt: commentsTable.updatedAt,
  deletedAt: commentsTable.deletedAt,
}

const authorSelect = {
  id: userTable.id,
  name: userTable.name,
  username: userTable.username,
  image: userTable.image,
}

const encodeCursor = (cursor: CommentPaginationCursor): string => {
  return Buffer.from(JSON.stringify(cursor), 'utf-8').toString('base64url')
}

const decodeCursor = (cursor: string): CommentPaginationCursor | null => {
  try {
    const value = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf-8')
    ) as unknown

    const result = commentPaginationCursorSchema.safeParse(value)

    if (!result.success) return null

    return result.data
  } catch {
    return null
  }
}

const getCommentById = async ({
  context,
  id,
}: {
  context: ORPCContext
  id: string
}) => {
  const [comment] = await context.db
    .select({
      ...commentSelect,
      author: authorSelect,
    })
    .from(commentsTable)
    .innerJoin(userTable, eq(commentsTable.authorId, userTable.id))
    .where(eq(commentsTable.id, id))
    .limit(1)

  if (!comment) return undefined

  return {
    ...comment,
    isDeleted: comment.deletedAt !== null,
  }
}

const getByThreadCommentsHandler = orpcBase.comments.getByThread.handler(
  async ({ context, errors, input }) => {
    const cursor = input.cursor ? decodeCursor(input.cursor) : null

    if (input.cursor && !cursor) {
      throw errors.BAD_REQUEST({ message: 'Invalid thread cursor' })
    }

    const [thread] = await context.db
      .select({ id: threadsTable.id })
      .from(threadsTable)
      .where(eq(threadsTable.slug, input.threadSlug))
      .limit(1)

    if (!thread) {
      throw errors.NOT_FOUND({ message: 'Thread not found' })
    }

    const [count] = await context.db
      .select({ count: countDistinct(commentsTable.id) })
      .from(commentsTable)
      .where(eq(commentsTable.threadId, thread.id))

    if (!count) {
      throw errors.NOT_FOUND({ message: 'No comments found for this thread' })
    }

    const comments = await context.db.query.commentsTable.findMany({
      where: and(
        eq(commentsTable.threadId, thread.id),
        isNull(commentsTable.parentId)
      ),
      orderBy: [asc(commentsTable.createdAt), asc(commentsTable.id)],
      limit: input.limit,
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        replies: {
          limit: input.includeReplies ? 3 : 0,
          with: {
            author: {
              columns: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    })

    let nextCursor: string | null = null
    const hasMore = comments.length > input.limit
    const rawItems = hasMore ? comments.slice(0, input.limit) : comments
    const lastItem = rawItems.at(-1)

    if (hasMore && lastItem) {
      nextCursor = encodeCursor({
        id: lastItem.id,
        createdAt: lastItem.createdAt,
      })
    }

    const items = rawItems.map(({ replies, ...comment }) => ({
      ...comment,
      isDeleted: comment.deletedAt !== null,
      childComments: replies.map(({ ...reply }) => ({
        ...reply,
        isDeleted: reply.deletedAt !== null,
      })),
    }))

    return {
      items,
      nextCursor,
      totalCount: count.count,
    }
  }
)

const getRepliesCommentsHandler = orpcBase.comments.getReplies.handler(
  async ({ context, errors, input }) => {
    const cursor = input.cursor ? decodeCursor(input.cursor) : null

    if (input.cursor && !cursor) {
      throw errors.BAD_REQUEST({ message: 'Invalid parent comment cursor' })
    }

    const [parentComment] = await context.db
      .select({ id: commentsTable.id })
      .from(commentsTable)
      .where(eq(commentsTable.id, input.parentId))
      .limit(1)

    if (!parentComment) {
      throw errors.NOT_FOUND({ message: 'Parent comment not found' })
    }

    const [count] = await context.db
      .select({ count: countDistinct(commentsTable.id) })
      .from(commentsTable)
      .where(eq(commentsTable.parentId, parentComment.id))

    if (!count) {
      throw errors.NOT_FOUND({ message: 'No replies found for this comment' })
    }

    const comments = await context.db.query.commentsTable.findMany({
      where: and(eq(commentsTable.parentId, parentComment.id)),
      orderBy: [asc(commentsTable.createdAt), asc(commentsTable.id)],
      limit: input.limit,
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    let nextCursor: string | null = null
    const hasMore = comments.length > input.limit
    const rawItems = hasMore ? comments.slice(0, input.limit) : comments
    const lastItem = rawItems.at(-1)

    if (hasMore && lastItem) {
      nextCursor = encodeCursor({
        id: lastItem.id,
        createdAt: lastItem.createdAt,
      })
    }

    const items = rawItems.map((comment) => ({
      ...comment,
      isDeleted: comment.deletedAt !== null,
      childComments: [],
    }))

    return {
      items,
      nextCursor,
      totalCount: count.count,
    }
  }
)

const createCommentRootHandler = orpcBase
  .use(orpcRequireAuthMiddleware)
  .comments.createRoot.handler(async ({ context, errors, input }) => {
    const [thread] = await context.db
      .select({ id: threadsTable.id })
      .from(threadsTable)
      .where(eq(threadsTable.slug, input.threadSlug))
      .limit(1)

    if (!thread) {
      throw errors.NOT_FOUND({ message: 'Thread not found' })
    }

    const [newComment] = await context.db
      .insert(commentsTable)
      .values({
        threadId: thread.id,
        content: input.content,
        authorId: context.auth.user.id,
      })
      .returning({ id: commentsTable.id })

    if (!newComment) {
      throw errors.INTERNAL_SERVER_ERROR({
        message: 'Failed to create comment',
      })
    }

    const comment = await getCommentById({ context, id: newComment.id })

    if (!comment) {
      throw errors.INTERNAL_SERVER_ERROR({
        message: 'Failed to load created comment',
      })
    }

    return comment
  })

const createCommentReplyHandler = orpcBase
  .use(orpcRequireAuthMiddleware)
  .comments.createReply.handler(async ({ context, errors, input }) => {
    const [parentComment] = await context.db
      .select({
        id: commentsTable.id,
        threadId: commentsTable.threadId,
        depth: commentsTable.depth,
        deletedAt: commentsTable.deletedAt,
      })
      .from(commentsTable)
      .where(eq(commentsTable.id, input.parentId))
      .limit(1)

    if (!parentComment) {
      throw errors.NOT_FOUND({ message: 'Parent comment not found' })
    }

    const [thread] = await context.db
      .select({ id: threadsTable.id })
      .from(threadsTable)
      .where(eq(threadsTable.id, parentComment.threadId))
      .limit(1)

    if (!thread) {
      throw errors.NOT_FOUND({ message: 'Thread not found' })
    }

    if (parentComment.threadId !== thread.id) {
      throw errors.BAD_REQUEST({
        message: 'Parent comment belongs to a different thread',
      })
    }

    if (parentComment.deletedAt) {
      throw errors.BAD_REQUEST({
        message: 'Cannot reply to a deleted comment',
      })
    }

    const [newComment] = await context.db
      .insert(commentsTable)
      .values({
        threadId: thread.id,
        parentId: input.parentId,
        depth: parentComment.depth + 1,
        content: input.content,
        authorId: context.auth.user.id,
      })
      .returning({ id: commentsTable.id })

    if (!newComment) {
      throw errors.INTERNAL_SERVER_ERROR({
        message: 'Failed to create comment',
      })
    }

    const comment = await getCommentById({ context, id: newComment.id })

    if (!comment) {
      throw errors.INTERNAL_SERVER_ERROR({
        message: 'Failed to load created comment',
      })
    }

    return comment
  })

const updateCommentHandler = orpcBase
  .use(orpcRequireAuthMiddleware)
  .comments.update.handler(async ({ context, errors, input }) => {
    const currentComment = await getCommentById({ context, id: input.id })

    if (!currentComment) {
      throw errors.NOT_FOUND({ message: 'Comment not found' })
    }

    if (currentComment.authorId !== context.auth.user.id) {
      throw errors.FORBIDDEN({
        message: 'You can only update your own comments',
      })
    }

    if (currentComment.deletedAt) {
      throw errors.CONFLICT({
        message: 'Cannot update a deleted comment',
      })
    }

    await context.db
      .update(commentsTable)
      .set({ content: input.content })
      .where(eq(commentsTable.id, input.id))

    const updatedComment = await getCommentById({ context, id: input.id })

    if (!updatedComment) {
      throw errors.INTERNAL_SERVER_ERROR({
        message: 'Failed to load updated comment',
      })
    }

    return updatedComment
  })

const deleteCommentHandler = orpcBase
  .use(orpcRequireAuthMiddleware)
  .comments.delete.handler(async ({ context, errors, input }) => {
    const currentComment = await getCommentById({ context, id: input.id })

    if (!currentComment) {
      throw errors.NOT_FOUND({ message: 'Comment not found' })
    }

    if (currentComment.authorId !== context.auth.user.id) {
      throw errors.FORBIDDEN({
        message: 'You can only delete your own comments',
      })
    }

    await context.db
      .update(commentsTable)
      .set({
        content: DELETED_COMMENT_CONTENT,
        deletedAt: new Date(),
      })
      .where(eq(commentsTable.id, input.id))

    const deletedComment = await getCommentById({ context, id: input.id })

    if (!deletedComment) {
      throw errors.INTERNAL_SERVER_ERROR({
        message: 'Failed to load deleted comment',
      })
    }

    return deletedComment
  })

export const commentsRouter = {
  getByThread: getByThreadCommentsHandler,
  getReplies: getRepliesCommentsHandler,
  createRoot: createCommentRootHandler,
  createReply: createCommentReplyHandler,
  update: updateCommentHandler,
  delete: deleteCommentHandler,
}
