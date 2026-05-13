import {
  getUserByUsernameParamsSchema,
  userSelectSchema,
} from '#/features/users/schemas/users.schema'
import { orpcBaseContract as base } from '#/orpc/contracts/base.contract'

const getUserByUsernameContract = base
  .route({
    path: '/users/{username}',
    method: 'GET',
    summary: 'Get user profile by username',
    description:
      'Retrieve full user profile data including bio, metadata, and profile details.',
    tags: ['Users'],
    operationId: 'getUserByUsername',
    successStatus: 200,
    successDescription: 'User profile retrieved successfully',
  })
  .input(getUserByUsernameParamsSchema)
  .output(
    userSelectSchema.omit({
      displayUsername: true,
      email: true,
      emailVerified: true,
    })
  )

export const usersContract = {
  getUserByUsername: getUserByUsernameContract,
}

export const getMeContract = base
  .route({
    path: '/me',
    method: 'GET',
    summary: 'Get current user',
    description:
      'Retrieve authenticated user data for settings and profile editing.',
    tags: ['Me'],
    operationId: 'getMe',
    successStatus: 200,
    successDescription: 'Current user retrieved successfully',
  })
  .output(userSelectSchema)
