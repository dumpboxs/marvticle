import {
  type InferRouterInputs,
  type InferRouterOutputs,
  type RouterClient,
} from '@orpc/server'

import { orpcBase } from '#/orpc'
import { threadsRouter } from '#/orpc/routers/threads.routers'
import { getMeHandler, usersRouter } from '#/orpc/routers/users.router'

export const orpcRouters = orpcBase.router({
  users: usersRouter,
  threads: threadsRouter,
  me: getMeHandler,
})

export type ORPCRouterClient = RouterClient<typeof orpcRouters>

export type RouterInputs = InferRouterInputs<typeof orpcRouters>
export type RouterOutputs = InferRouterOutputs<typeof orpcRouters>
