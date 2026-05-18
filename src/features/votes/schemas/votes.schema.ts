import { z } from 'zod'

import {
  pointsSchema,
  voteActionSchema,
  voteDirectionNullableSchema,
  voteDirectionSchema,
} from '#/schemas/drizzle-zod'

export const voteThreadInputSchema = z.object({
  slug: z.string().min(1, { message: 'Slug is required' }),
  direction: voteDirectionSchema,
})

export const voteThreadOutputSchema = z.object({
  action: voteActionSchema,
  userVote: voteDirectionNullableSchema,
  newPoints: pointsSchema,
})

export type VoteThreadOutput = z.infer<typeof voteThreadOutputSchema>
