import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import { useMemo } from 'react'

import { toast } from 'sonner'

import { buildCommentTree } from '#/features/comments/utils/comment-tree'
import { orpc } from '#/orpc/client'

export const threadCommentsQueryOptions = ({
  threadId,
}: {
  threadId: string
}) =>
  orpc.comments.getByThread.queryOptions({
    input: { threadId },
  })

export const useThreadCommentsQuery = ({ threadId }: { threadId: string }) => {
  const query = useSuspenseQuery(threadCommentsQueryOptions({ threadId }))
  const comments = query.data.items
  const totalCount = query.data.totalCount
  const commentTree = useMemo(() => buildCommentTree(comments), [comments])

  return {
    ...query,
    comments,
    commentTree,
    totalCount,
  }
}

export const useCreateCommentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.comments.create.mutationOptions({
      onSuccess: (_comment, variables) => {
        toast.success('Comment created', {
          description: 'Your comment has been posted.',
        })

        void queryClient.invalidateQueries({
          queryKey: threadCommentsQueryOptions({
            threadId: variables.threadId,
          }).queryKey,
        })
      },

      onError: (error) => {
        toast.error('Failed to create comment', {
          description: error.message,
        })
      },
    })
  )
}

export const useUpdateCommentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.comments.update.mutationOptions({
      onSuccess: (comment) => {
        toast.success('Comment updated', {
          description: 'Your comment has been updated.',
        })

        void queryClient.invalidateQueries({
          queryKey: threadCommentsQueryOptions({
            threadId: comment.threadId,
          }).queryKey,
        })
      },

      onError: (error) => {
        toast.error('Failed to update comment', {
          description: error.message,
        })
      },
    })
  )
}

export const useDeleteCommentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.comments.delete.mutationOptions({
      onSuccess: (comment) => {
        toast.success('Comment deleted', {
          description: 'Your comment has been deleted.',
        })

        void queryClient.invalidateQueries({
          queryKey: threadCommentsQueryOptions({
            threadId: comment.threadId,
          }).queryKey,
        })
      },

      onError: (error) => {
        toast.error('Failed to delete comment', {
          description: error.message,
        })
      },
    })
  )
}
