import { userTable } from '#/db/schemas'
import { createSelectSchema } from '#/schemas/drizzle-zod'

export const userSelectSchema = createSelectSchema(userTable).pick({
  id: true,
  name: true,
  username: true,
  email: true,
  image: true,
  banner: true,
  bio: true,
  pronouns: true,
  location: true,
  education: true,
  work: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
})
