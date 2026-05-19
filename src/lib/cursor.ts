import { cursorPayloadSchema } from '#/schemas/drizzle-zod'
import type { CursorPayload } from '#/schemas/drizzle-zod'

export const encodeCursor = (cursor: CursorPayload): string => {
  return Buffer.from(JSON.stringify(cursor), 'utf-8').toString('base64url')
}

export const decodeCursor = (cursor: string): CursorPayload | null => {
  try {
    const value = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf-8')
    ) as unknown

    const result = cursorPayloadSchema.safeParse(value)

    if (!result.success) return null

    return result.data
  } catch {
    return null
  }
}
