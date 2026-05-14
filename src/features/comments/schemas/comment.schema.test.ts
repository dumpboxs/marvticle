import { describe, expect, it } from 'vitest'

import {
  COMMENT_CONTENT_MAX_LENGTH,
  commentCreateSchema,
  commentContentSchema,
} from '#/features/comments/schemas/comment.schema'

const threadId = '11111111-1111-4111-8111-111111111111'
const parentId = '22222222-2222-4222-8222-222222222222'

describe('comment schemas', () => {
  it('rejects empty comment content', () => {
    expect(commentContentSchema.safeParse('   ').success).toBe(false)
  })

  it('rejects content above the maximum length', () => {
    expect(
      commentContentSchema.safeParse('a'.repeat(COMMENT_CONTENT_MAX_LENGTH + 1))
        .success
    ).toBe(false)
  })

  it('accepts create input without a parent comment', () => {
    expect(
      commentCreateSchema.safeParse({
        threadId,
        content: 'Root comment',
      }).success
    ).toBe(true)
  })

  it('accepts create input with a parent comment', () => {
    expect(
      commentCreateSchema.safeParse({
        threadId,
        parentId,
        content: 'Reply comment',
      }).success
    ).toBe(true)
  })
})
