import { asc, eq } from 'drizzle-orm'

import { userTable } from '#/db/schemas/auth'
import { commentsTable } from '#/db/schemas/comments'
import { threadsTable } from '#/db/schemas/threads'
import { type ORPCContext, orpcBase } from '#/orpc'
import { orpcRequireAuthMiddleware } from '#/orpc/middlewares'

const DELETED_COMMENT_CONTENT = '[deleted]'

const commentSelect = {
  id: commentsTable.id,
  threadId: commentsTable.threadId,
  authorId: commentsTable.authorId,
  parentId: commentsTable.parentId,
  content: commentsTable.content,
  createdAt: commentsTable.createdAt,
  updatedAt: commentsTable.updatedAt,
  deletedAt: commentsTable.deletedAt,
}

const authorSelect = {
  name: userTable.name,
  username: userTable.username,
  image: userTable.image,
}

type CommentRow = {
  id: string
  threadId: string
  authorId: string
  parentId: string | null
  content: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  author: {
    name: string
    username: string
    image: string | null
  }
}

const mapCommentRow = (row: CommentRow) => {
  const isDeleted = row.deletedAt !== null

  return {
    id: row.id,
    threadId: row.threadId,
    parentId: row.parentId,
    content: isDeleted ? null : row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    isDeleted,
    author: row.author,
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

  return comment
}

const getByThreadCommentsHandler = orpcBase.comments.getByThread.handler(
  async ({ context, errors, input }) => {
    const [thread] = await context.db
      .select({ id: threadsTable.id })
      .from(threadsTable)
      .where(eq(threadsTable.id, input.threadId))
      .limit(1)

    if (!thread) {
      throw errors.NOT_FOUND({ message: 'Thread not found' })
    }

    const comments = await context.db
      .select({
        ...commentSelect,
        author: authorSelect,
      })
      .from(commentsTable)
      .innerJoin(userTable, eq(commentsTable.authorId, userTable.id))
      .where(eq(commentsTable.threadId, input.threadId))
      .orderBy(asc(commentsTable.createdAt), asc(commentsTable.id))

    return {
      items: comments.map(mapCommentRow),
      totalCount: comments.length,
    }
  }
)

const createCommentHandler = orpcBase
  .use(orpcRequireAuthMiddleware)
  .comments.create.handler(async ({ context, errors, input }) => {
    const [thread] = await context.db
      .select({ id: threadsTable.id })
      .from(threadsTable)
      .where(eq(threadsTable.id, input.threadId))
      .limit(1)

    if (!thread) {
      throw errors.NOT_FOUND({ message: 'Thread not found' })
    }

    if (input.parentId) {
      const [parentComment] = await context.db
        .select({
          id: commentsTable.id,
          threadId: commentsTable.threadId,
          deletedAt: commentsTable.deletedAt,
        })
        .from(commentsTable)
        .where(eq(commentsTable.id, input.parentId))
        .limit(1)

      if (!parentComment) {
        throw errors.NOT_FOUND({ message: 'Parent comment not found' })
      }

      if (parentComment.threadId !== input.threadId) {
        throw errors.BAD_REQUEST({
          message: 'Parent comment belongs to a different thread',
        })
      }

      if (parentComment.deletedAt) {
        throw errors.BAD_REQUEST({
          message: 'Cannot reply to a deleted comment',
        })
      }
    }

    const [newComment] = await context.db
      .insert(commentsTable)
      .values({
        threadId: input.threadId,
        parentId: input.parentId ?? null,
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

    return mapCommentRow(comment)
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

    return mapCommentRow(updatedComment)
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

    return mapCommentRow(deletedComment)
  })

export const commentsRouter = {
  getByThread: getByThreadCommentsHandler,
  create: createCommentHandler,
  update: updateCommentHandler,
  delete: deleteCommentHandler,
}
