import {
  commentCreateRootSchema,
  commentCreateReplySchema,
  commentDeleteSchema,
  commentSelectSchema,
  commentUpdateSchema,
  threadCommentsSchema,
  getCommentRepliesSchema,
  getThreadCommentsSchema,
} from '#/features/comments/schemas/comment.schema'
import { orpcBaseContract as base } from '#/orpc/contracts/base.contract'

const getThreadCommentsContract = base
  .route({
    path: '/threads/{threadSlug}/comments',
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

const getCommentRepliesContract = base
  .route({
    path: '/comments/{parentId}/replies',
    method: 'GET',
    summary: 'Get comment replies',
    description: 'Get replies for a comment.',
    tags: ['Comments'],
    operationId: 'getCommentReplies',
    successStatus: 200,
    successDescription: 'Comment replies retrieved successfully',
  })
  .input(getCommentRepliesSchema)
  .output(threadCommentsSchema)

const createCommentRootContract = base
  .route({
    path: '/threads/{threadSlug}/comments',
    method: 'POST',
    summary: 'Create comment',
    description: 'Create a comment on a thread.',
    tags: ['Comments'],
    operationId: 'createCommentRoot',
    successStatus: 200,
    successDescription: 'Comment created successfully',
  })
  .input(commentCreateRootSchema)
  .output(commentSelectSchema)

const createCommentReplyContract = base
  .route({
    path: '/comments/{parentId}/replies',
    method: 'POST',
    summary: 'Create comment reply',
    description: 'Create a reply to an existing comment.',
    tags: ['Comments'],
    operationId: 'createCommentReply',
    successStatus: 200,
    successDescription: 'Comment reply created successfully',
  })
  .input(commentCreateReplySchema)
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
  getReplies: getCommentRepliesContract,
  createRoot: createCommentRootContract,
  createReply: createCommentReplyContract,
  update: updateCommentContract,
  delete: deleteCommentContract,
}
