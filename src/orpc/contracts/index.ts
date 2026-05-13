import { threadsContract } from '#/orpc/contracts/threads.contract'
import { usersContract } from '#/orpc/contracts/users.contract'

export const orpcContracts = {
  users: usersContract,
  threads: threadsContract,
}
