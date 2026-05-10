/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { authMiddleware } from '#/middlewares/auth'
import { auth } from '#/lib/auth/server'

export const listUserAccountsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.auth) {
      throw new Error('Not authenticated')
    }

    const headers = getRequestHeaders()

    const listAccounts = await auth.api.listUserAccounts({ headers })

    return listAccounts
  })
