import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'

import { threadsInfiniteQueryOptions } from '#/features/threads/hooks/use-threads'
import { DEFAULT_THREADS_LIMIT } from '#/features/threads/schemas/thread.schema'
import { orpc } from '#/orpc/client'

export const useToggleVoteMutation = () => {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.threads.vote.mutationOptions({
      onSuccess: () => {
        toast.success('Vote cast', {
          description: 'Your vote has been recorded.',
        })

        void queryClient.invalidateQueries({
          queryKey: threadsInfiniteQueryOptions({
            limit: DEFAULT_THREADS_LIMIT,
          }).queryKey,
        })
      },

      onError: (error) => {
        toast.error('Failed to vote', {
          description: error.message,
        })
      },
    })
  )
}
