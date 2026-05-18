import {
  getOneThreadInputSchema,
  listThreadsInputSchema,
  threadInsertSchema,
  threadOutputSchema,
  threadsOutputSchema,
} from '#/features/threads/schemas/thread.schema'
import { orpcBaseContract as base } from '#/orpc/contracts/base.contract'

const listThreadsContract = base
  .route({
    path: '/threads',
    method: 'GET',
    summary: 'List threads',
    description: 'List threads',
    tags: ['Threads'],
    operationId: 'listThreads',
    successStatus: 200,
    successDescription: 'Threads retrieved successfully',
  })
  .input(listThreadsInputSchema)
  .output(threadsOutputSchema)

const getOneThreadContract = base
  .route({
    path: '/threads/{slug}',
    method: 'GET',
    summary: 'Get one thread',
    description: 'Get one thread',
    tags: ['Threads'],
    operationId: 'getOneThread',
    successStatus: 200,
    successDescription: 'Thread retrieved successfully',
  })
  .input(getOneThreadInputSchema)
  .output(threadOutputSchema)

const createThreadContract = base
  .route({
    path: '/threads',
    method: 'POST',
    summary: 'Create thread',
    description: 'Create a new thread',
    tags: ['Threads'],
    operationId: 'createThread',
    successStatus: 200,
    successDescription: 'Thread created successfully',
  })
  .input(threadInsertSchema)
  .output(threadOutputSchema)

// const toggleVoteContract = base
//   .route({
//     path: '/threads/{slug}/vote',
//     method: 'POST',
//     summary: 'Toggle vote',
//     description: 'Toggle vote',
//     tags: ['Threads'],
//     operationId: 'toggleVote',
//     successStatus: 200,
//     successDescription: 'Vote toggled successfully',
//   })
//   .input(toggleVoteInputSchema)
//   .output(toggleVoteOutputSchema)

export const threadsContract = {
  list: listThreadsContract,
  getOne: getOneThreadContract,
  create: createThreadContract,
  // vote: toggleVoteContract,
}
