import { implement } from '@orpc/server'

import { db } from '#/db'
import { auth } from '#/lib/auth/server'
import { orpcContracts } from '#/orpc/contracts'

export const CreateORPCContext = async ({ headers }: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers })

  return {
    auth: session,
    db,
  }
}

export type ORPCContext = Awaited<ReturnType<typeof CreateORPCContext>>

export const orpcBase = implement(orpcContracts).$context<ORPCContext>()
