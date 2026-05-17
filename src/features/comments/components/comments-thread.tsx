import { CommentsThreadTree } from '#/features/comments/components/comments-thread-tree'
import { useThreadCommentsInfiniteQuery } from '#/features/comments/hooks/use-comments'

interface CommentsThreadProps {
  threadSlug: string
  threadAuthorId: string
}

export const CommentsThread = ({
  threadSlug,
  threadAuthorId,
}: CommentsThreadProps) => {
  const { comments } = useThreadCommentsInfiniteQuery({ threadSlug })
  return (
    <>
      <CommentsThreadTree comments={comments} threadAuthorId={threadAuthorId} />
    </>
  )
}
