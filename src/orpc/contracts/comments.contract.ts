import {
  commentDeleteThreadInputSchema,
  commentThreadOutputSchema,
  commentUpdateThreadInputSchema,
  createCommentThreadInputSchema,
  listCommentRepliesInputSchema,
  listCommentsOutputSchema,
  listCommentsThreadInputSchema,
  replyToCommentThreadInputSchema,
} from '#/features/comments/schemas/comment.schema'
import {
  voteCommentThreadInputSchema,
  voteCommentThreadOutputSchema,
} from '#/features/votes/schemas/votes.schema'
import { orpcBaseContract as base } from '#/orpc/contracts/base.contract'

const listCommentsByThreadContract = base
  .route({
    path: '/threads/{threadSlug}/comments',
    method: 'GET',
    summary: 'List thread comments',
    description: 'List comments for a thread.',
    tags: ['Comments'],
    operationId: 'listCommentsThread',
    successStatus: 200,
    successDescription: 'Thread comments listed successfully',
  })
  .input(listCommentsThreadInputSchema)
  .output(listCommentsOutputSchema)

const listCommentRepliesContract = base
  .route({
    path: '/comments/{parentId}/replies',
    method: 'GET',
    summary: 'List comment replies',
    description: 'List replies for a comment.',
    tags: ['Comments'],
    operationId: 'listCommentReplies',
    successStatus: 200,
    successDescription: 'Comment replies listed successfully',
  })
  .input(listCommentRepliesInputSchema)
  .output(listCommentsOutputSchema)

const createCommentThreadContract = base
  .route({
    path: '/threads/{threadSlug}/comments',
    method: 'POST',
    summary: 'Create comment',
    description: 'Create a comment on a thread.',
    tags: ['Comments'],
    operationId: 'createCommentThread',
    successStatus: 200,
    successDescription: 'Comment created successfully',
  })
  .input(createCommentThreadInputSchema)
  .output(commentThreadOutputSchema)

const replyCommentThreadContract = base
  .route({
    path: '/comments/{parentId}/replies',
    method: 'POST',
    summary: 'Reply to comment',
    description: 'Reply to an existing comment on a thread.',
    tags: ['Comments'],
    operationId: 'replyCommentThread',
    successStatus: 200,
    successDescription: 'Comment replied successfully',
  })
  .input(replyToCommentThreadInputSchema)
  .output(commentThreadOutputSchema)

const updateCommentThreadContract = base
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
  .input(commentUpdateThreadInputSchema)
  .output(commentThreadOutputSchema)

const deleteCommentThreadContract = base
  .route({
    path: '/comments/{id}',
    method: 'DELETE',
    summary: 'Delete comment',
    description: 'Delete an existing comment owned by the current user.',
    tags: ['Comments'],
    operationId: 'deleteComment',
    successStatus: 200,
    successDescription: 'Comment deleted successfully',
  })
  .input(commentDeleteThreadInputSchema)
  .output(commentThreadOutputSchema)

const voteCommentThreadContract = base
  .route({
    path: '/comments/{id}/vote',
    method: 'POST',
    summary: 'Vote comment',
    description: 'Vote comment',
    tags: ['Votes'],
    operationId: 'voteCommentThread',
    successStatus: 200,
    successDescription: 'Vote comment successfully',
  })
  .input(voteCommentThreadInputSchema)
  .output(voteCommentThreadOutputSchema)

export const commentsContract = {
  list: listCommentsByThreadContract,
  listReplies: listCommentRepliesContract,
  create: createCommentThreadContract,
  reply: replyCommentThreadContract,
  update: updateCommentThreadContract,
  delete: deleteCommentThreadContract,
  vote: voteCommentThreadContract,
}
