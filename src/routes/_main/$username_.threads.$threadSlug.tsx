import { createFileRoute } from '@tanstack/react-router'

import { MarkdownRenderer } from '#/components/markdown-renderer'
import { CommentThread } from '#/features/comments/coments-tree'
import { CommentsThread } from '#/features/comments/components/comments-thread'
import { useThreadCommentsInfiniteQuery } from '#/features/comments/hooks/use-comments'
import { useThreadDetailQuery } from '#/features/threads/hooks/use-threads'

export const Route = createFileRoute('/_main/$username_/threads/$threadSlug')({
  component: RouteComponent,
})

function RouteComponent() {
  const { threadSlug } = Route.useParams()
  const { data: thread } = useThreadDetailQuery({ slug: threadSlug })
  const { comments } = useThreadCommentsInfiniteQuery({ threadSlug })

  return (
    <div className="container mx-auto w-full max-w-2xl px-4 pt-4 pb-8">
      <MarkdownRenderer
        content={thread.content}
        className="max-w-none min-w-0"
      />
      <div className="my-8 border-t border-border pt-4">
        <CommentsThread
          threadSlug={threadSlug}
          threadAuthorId={thread.author.id}
        />
      </div>
      <CommentThread initialComments={comments} />
    </div>
  )
}
