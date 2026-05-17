import type { FC } from 'react'
import { useState } from 'react'

import { formatDistanceToNowStrict } from 'date-fns'
import { MinusIcon, PlusIcon } from 'lucide-react'

import { MarkdownRenderer } from '#/components/markdown-renderer'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { UserAvatar } from '#/components/user-avatar'
import { useCommentRepliesInfiniteQuery } from '#/features/comments/hooks/use-comments'
import type { RouterOutputs } from '#/orpc/routers'

type CommentOutput = RouterOutputs['comments']['getByThread']['items'][number]

interface CommentsThreadTreeProps {
  comments: CommentOutput[]
  threadAuthorId: string
}

interface CommentsThreadTreeNodeProps {
  comment: CommentOutput
  depth: number
  threadAuthorId: string
}

const CommentsThreadTreeNode: FC<CommentsThreadTreeNodeProps> = ({
  comment,
  depth,
  threadAuthorId,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  const { replies, totalCount } = useCommentRepliesInfiniteQuery({
    parentId: comment.id,
    enabled: !!isExpanded,
  })

  const isAuthor = comment.author.id === threadAuthorId
  const visualDepth = Math.min(depth, 16)
  const relativeTime = (date: Date) => formatDistanceToNowStrict(date)

  const toggleExpand = () => {
    setIsExpanded((value) => !value)
  }

  return (
    <div style={{ marginLeft: visualDepth > 0 ? 32 : 0 }} className="space-y-2">
      <div className="flex items-center gap-2">
        <UserAvatar
          image={comment.author.image}
          name={comment.author.username}
        />

        <div className="flex-1">
          <div className="-mt-1 flex items-center -space-y-1.5 font-heading text-sm font-semibold">
            <span className="max-w-[15ch] truncate">{comment.author.name}</span>

            <Separator className="mx-1 mt-0.5 rounded-full data-horizontal:size-1" />

            <span className="mt-1 text-xs font-normal text-muted-foreground">
              {relativeTime(new Date(comment.createdAt))}
            </span>

            <Separator className="mx-1 mt-0.5 rounded-full data-horizontal:size-1" />

            {!!isAuthor && (
              <Badge
                variant="secondary"
                className="mt-1.5 px-1 py-0.5 text-[11px]"
              >
                Author
              </Badge>
            )}
          </div>

          <p className="max-w-[15ch] truncate text-xs font-medium tracking-wide text-muted-foreground">
            @{comment.author.username}
          </p>
        </div>
      </div>

      <div className="ml-10 space-y-2">
        <MarkdownRenderer content={comment.content} />
      </div>

      {totalCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="ml-10 px-1.5"
          onClick={toggleExpand}
        >
          {isExpanded ? (
            <>
              <MinusIcon />
              <span>Hide replies</span>
            </>
          ) : (
            <>
              <PlusIcon />
              <span>{totalCount} replies</span>
            </>
          )}
        </Button>
      )}

      {isExpanded &&
        replies.map((reply) => (
          <div key={reply.id} className="">
            <CommentsThreadTreeNode
              comment={reply}
              depth={reply.depth}
              threadAuthorId={threadAuthorId}
            />
          </div>
        ))}
    </div>
  )
}

export const CommentsThreadTree = ({
  comments,
  threadAuthorId,
}: CommentsThreadTreeProps) => {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentsThreadTreeNode
          key={comment.id}
          comment={comment}
          depth={comment.depth}
          threadAuthorId={threadAuthorId}
        />
      ))}
    </div>
  )
}
