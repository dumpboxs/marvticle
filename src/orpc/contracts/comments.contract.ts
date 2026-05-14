import {
  commentCreateSchema,
  commentDeleteSchema,
  commentSelectSchema,
  commentUpdateSchema,
  getThreadCommentsSchema,
  threadCommentsSchema,
} from '#/features/comments/schemas/comment.schema'
import { orpcBaseContract as base } from '#/orpc/contracts/base.contract'

const getThreadCommentsContract = base
  .route({
    path: '/threads/{threadId}/comments',
    method: 'GET',
    summary: 'Get thread comments',
    description: 'Get threaded comments for a thread.',
    tags: ['Comments'],
    operationId: 'getThreadComments',
    successStatus: 200,
    successDescription: 'Thread comments retrieved successfully',
  })
  .input(getThreadCommentsSchema)
  .output(threadCommentsSchema)

const createCommentContract = base
  .route({
    path: '/threads/{threadId}/comments',
    method: 'POST',
    summary: 'Create comment',
    description: 'Create a comment or reply on a thread.',
    tags: ['Comments'],
    operationId: 'createComment',
    successStatus: 200,
    successDescription: 'Comment created successfully',
  })
  .input(commentCreateSchema)
  .output(commentSelectSchema)

const updateCommentContract = base
  .route({
    path: '/comments/{id}',
    method: 'PATCH',
    summary: 'Update comment',
    description: 'Update an existing comment owned by the current user.',
    tags: ['Comments'],
    operationId: 'updateComment',
    successStatus: 200,
    successDescription: 'Comment updated successfully',
  })
  .input(commentUpdateSchema)
  .output(commentSelectSchema)

const deleteCommentContract = base
  .route({
    path: '/comments/{id}',
    method: 'DELETE',
    summary: 'Delete comment',
    description: 'Soft delete an existing comment owned by the current user.',
    tags: ['Comments'],
    operationId: 'deleteComment',
    successStatus: 200,
    successDescription: 'Comment deleted successfully',
  })
  .input(commentDeleteSchema)
  .output(commentSelectSchema)

export const commentsContract = {
  getByThread: getThreadCommentsContract,
  create: createCommentContract,
  update: updateCommentContract,
  delete: deleteCommentContract,
}
