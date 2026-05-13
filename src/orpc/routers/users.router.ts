import { eq } from 'drizzle-orm'

import { userTable } from '#/db/schemas'
import { orpcBase } from '#/orpc'
import { orpcRequireAuthMiddleware } from '#/orpc/middlewares'

const userProfileSelect = {
  id: userTable.id,
  name: userTable.name,
  username: userTable.username,
  image: userTable.image,
  banner: userTable.banner,
  bio: userTable.bio,
  pronouns: userTable.pronouns,
  location: userTable.location,
  education: userTable.education,
  work: userTable.work,
  verified: userTable.verified,
  createdAt: userTable.createdAt,
  updatedAt: userTable.updatedAt,
}

const getUserByUsernameHandler = orpcBase.users.getUserByUsername.handler(
  async ({ context, input, errors }) => {
    const [user] = await context.db
      .select(userProfileSelect)
      .from(userTable)
      .where(eq(userTable.username, input.username))
      .limit(1)

    if (!user) {
      throw errors.NOT_FOUND({
        message: `User @${input.username} not found.`,
      })
    }

    return user
  }
)

export const usersRouter = {
  getUserByUsername: getUserByUsernameHandler,
}

export const getMeHandler = orpcBase
  .use(orpcRequireAuthMiddleware)
  .me.handler(async ({ context }) => {
    const { user } = context.auth

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      displayUsername: user.displayUsername,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      banner: user.banner,
      bio: user.bio,
      pronouns: user.pronouns,
      location: user.location,
      education: user.education,
      work: user.work,
      verified: user.verified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  })
