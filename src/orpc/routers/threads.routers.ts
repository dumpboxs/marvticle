import { and, desc, eq, gt, lt, or, sql } from 'drizzle-orm'
import limax from 'limax'
import { nanoid } from 'nanoid'

import { userTable, votesThreadsTable } from '#/db/schemas'
import { threadsTable } from '#/db/schemas/threads'
import { decodeCursor, encodeCursor } from '#/lib/cursor'
import { orpcBase } from '#/orpc'
import { authenticated } from '#/orpc/middlewares'
import type { VoteDirectionNullable } from '#/schemas/drizzle-zod'

const generateSlug = (title: string): string => {
  return `${limax(title)}-${nanoid(9)}`
}

const GRAVITY = 1.5
const DISCOVER_WINDOW_DAYS = 30

const trendingScoreExpr = sql<number>`
  ${threadsTable.points}::float /
  POWER(
    EXTRACT(EPOCH FROM (NOW() - ${threadsTable.createdAt})) / 3600.0 + 2,
    ${GRAVITY}
  )
`

const getPeriodSince = (period: string): Date | null => {
  const now = new Date()
  const map: Record<string, Date | null> = {
    week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    all: null,
  }

  return map[period] ?? null
}

const threadSelect = {
  id: threadsTable.id,
  slug: threadsTable.slug,
  title: threadsTable.title,
  content: threadsTable.content,
  points: threadsTable.points,
  commentsCount: threadsTable.commentsCount,
  createdAt: threadsTable.createdAt,
  updatedAt: threadsTable.updatedAt,
}

const authorSelect = {
  id: userTable.id,
  name: userTable.name,
  username: userTable.username,
  image: userTable.image,
  verified: userTable.verified,
}

const listThreadsHandler = orpcBase.threads.list.handler(
  async ({ context, errors, input }) => {
    const { auth, db } = context
    const { feed, period, sort, limit, cursor } = input

    const isTopSort = sort === 'top'
    const isDiscover = !isTopSort && feed === 'discover'
    const after = cursor ? decodeCursor(cursor) : null

    if (cursor && !after) {
      throw errors.BAD_REQUEST({ message: 'Invalid thread cursor' })
    }

    const conditions = []

    if (isTopSort) {
      const since = getPeriodSince(period)
      if (since) conditions.push(gt(threadsTable.createdAt, since))
    } else if (isDiscover) {
      const windowSince = new Date(
        Date.now() - DISCOVER_WINDOW_DAYS * 24 * 60 * 60 * 1000
      )
      conditions.push(gt(threadsTable.createdAt, windowSince))
    }

    if (after) {
      if (isTopSort && 'points' in after) {
        conditions.push(
          or(
            lt(threadsTable.points, after.points),
            and(
              eq(threadsTable.points, after.points),
              lt(threadsTable.id, after.id)
            )
          )
        )
      } else if (isDiscover && 'trendingScore' in after) {
        conditions.push(
          or(
            sql`${trendingScoreExpr} < ${after.trendingScore}`,
            and(
              sql`${trendingScoreExpr} = ${after.trendingScore}`,
              lt(threadsTable.id, after.id)
            )
          )
        )
      } else if ('createdAt' in after) {
        conditions.push(
          or(
            lt(threadsTable.createdAt, after.createdAt),
            and(
              eq(threadsTable.createdAt, after.createdAt),
              lt(threadsTable.id, after.id)
            )
          )
        )
      }
    }

    const rows = await db
      .select({
        ...threadSelect,
        author: authorSelect,
        isVoted: sql<VoteDirectionNullable>`
          max(case when ${votesThreadsTable.userId} = ${auth?.user.id ?? null}
          then ${votesThreadsTable.direction} end)
        `.as('is_voted'),
        trendingScore: isDiscover
          ? trendingScoreExpr.as('trending_score')
          : sql<number>`0`,
      })
      .from(threadsTable)
      .innerJoin(userTable, eq(threadsTable.authorId, userTable.id))
      .leftJoin(
        votesThreadsTable,
        eq(votesThreadsTable.threadId, threadsTable.id)
      )
      .groupBy(threadsTable.id, userTable.id)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(
        ...(isTopSort
          ? [desc(threadsTable.points), desc(threadsTable.id)]
          : isDiscover
            ? [sql`trending_score DESC`, desc(threadsTable.id)]
            : [desc(threadsTable.createdAt), desc(threadsTable.id)])
      )
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const items = hasMore ? rows.slice(0, limit) : rows
    const lastItem = items.at(-1)

    return {
      items,
      nextCursor:
        hasMore && lastItem
          ? encodeCursor(
              isTopSort
                ? { mode: 'top', id: lastItem.id, points: lastItem.points }
                : isDiscover
                  ? {
                      mode: 'discover',
                      id: lastItem.id,
                      trendingScore: lastItem.trendingScore,
                    }
                  : {
                      mode: 'latest',
                      id: lastItem.id,
                      createdAt: lastItem.createdAt,
                    }
            )
          : null,
    }
  }
)

const getOneThreadHandler = orpcBase.threads.getOne.handler(
  async ({ context, errors, input }) => {
    const [thread] = await context.db
      .select({
        ...threadSelect,
        author: authorSelect,
        isVoted: sql<VoteDirectionNullable>`
      max(case when ${votesThreadsTable.userId} = ${context.auth?.user.id ?? null}
      then ${votesThreadsTable.direction} end)
    `.as('is_voted'),
      })
      .from(threadsTable)
      .innerJoin(userTable, eq(threadsTable.authorId, userTable.id))
      .leftJoin(
        votesThreadsTable,
        eq(votesThreadsTable.threadId, threadsTable.id)
      )
      .groupBy(threadsTable.id, userTable.id)
      .where(eq(threadsTable.slug, input.slug))

    if (!thread) {
      throw errors.NOT_FOUND({ message: 'Thread not found' })
    }

    return thread
  }
)

const createThreadHandler = orpcBase
  .use(authenticated)
  .threads.create.handler(async ({ context, errors, input }) => {
    const slug = generateSlug(input.title)

    const [newThread] = await context.db
      .insert(threadsTable)
      .values({
        ...input,
        slug,
        authorId: context.auth.user.id,
      })
      .returning({ ...threadSelect })

    if (!newThread) {
      throw errors.INTERNAL_SERVER_ERROR({ message: 'Failed to create thread' })
    }

    return {
      ...newThread,
      author: {
        id: context.auth.user.id,
        name: context.auth.user.name,
        username: context.auth.user.username,
        image: context.auth.user.image,
        verified: context.auth.user.verified,
      },
      isVoted: null,
    }
  })

// const toggleVoteHandler = orpcBase
//   .use(orpcRequireAuthMiddleware)
//   .threads.vote.handler(async ({ context, errors, input }) => {
//     const [existingThread] = await context.db
//       .select({
//         id: threadsTable.id,
//       })
//       .from(threadsTable)
//       .where(eq(threadsTable.slug, input.slug))

//     if (!existingThread) {
//       throw errors.NOT_FOUND({ message: 'Thread not found' })
//     }

//     const vote = await db.transaction(async (tx) => {
//       const [existingVote] = await tx
//         .select()
//         .from(votesTable)
//         .where(
//           and(
//             eq(votesTable.userId, context.auth.user.id),
//             eq(votesTable.threadId, existingThread.id)
//           )
//         )
//         .limit(1)

//       const currentVote = existingVote

//       if (!currentVote) {
//         await tx.insert(votesTable).values({
//           userId: context.auth.user.id,
//           threadId: existingThread.id,
//           direction: input.direction,
//         })

//         return {
//           action: 'VOTED',
//           userVote: input.direction,
//         }
//       } else if (currentVote.direction === input.direction) {
//         await tx
//           .delete(votesTable)
//           .where(
//             and(
//               eq(votesTable.userId, context.auth.user.id),
//               eq(votesTable.threadId, existingThread.id)
//             )
//           )

//         return {
//           action: 'UNVOTED',
//           userVote: null,
//         }
//       } else {
//         await tx
//           .update(votesTable)
//           .set({
//             direction: input.direction,
//           })
//           .where(
//             and(
//               eq(votesTable.userId, context.auth.user.id),
//               eq(votesTable.threadId, existingThread.id)
//             )
//           )

//         return {
//           action: 'CHANGED',
//           userVote: input.direction,
//         }
//       }
//     })

//     const [countVotes] = await context.db
//       .select({
//         voteScore: sql<number>`
//       count(case when ${votesTable.direction} = 'UPVOTE' then 1 end) -
//       count(case when ${votesTable.direction} = 'DOWNVOTE' then 1 end)
//     `.as('vote_score'),
//       })
//       .from(votesTable)
//       .where(eq(votesTable.threadId, existingThread.id))

//     if (!countVotes) {
//       throw errors.INTERNAL_SERVER_ERROR({
//         message: 'Failed to get total votes',
//       })
//     }

//     return {
//       action: vote.action,
//       userVote: vote.userVote,
//       voteScore: countVotes.voteScore,
//     } as ToggleVoteOutput
//   })

export const threadsRouter = {
  list: listThreadsHandler,
  getOne: getOneThreadHandler,
  create: createThreadHandler,
  // vote: toggleVoteHandler,
}
