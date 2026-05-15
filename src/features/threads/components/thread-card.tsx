import { DotsThreeIcon } from '@phosphor-icons/react'
import { formatDistanceToNowStrict } from 'date-fns'
import {
  ArrowBigDownIcon,
  ArrowBigUpIcon,
  MessagesSquareIcon,
  VerifiedIcon,
} from 'lucide-react'

import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import { UserAvatar } from '#/components/user-avatar'
import { parseMarkdownToWords } from '#/lib/parse-markdown'
import type { RouterOutputs } from '#/orpc/routers'

type ThreadCardProps = RouterOutputs['threads']['getMany']['items'][number]

export const ThreadCard = (thread: ThreadCardProps) => {
  return (
    <Card className="gap-0 p-0 ring-0">
      <CardHeader className="gap-2 p-0! [.border-b]:pb-0!">
        <div className="flex items-center justify-between gap-2">
          <UserAvatar
            name={thread.author.username}
            image={thread.author.image}
          />

          <div className="flex-1">
            <div className="flex items-center -space-y-0.5 font-heading text-sm font-semibold">
              <span className="max-w-[15ch] truncate">
                {thread.author.name}
              </span>

              {!!thread.author.verified && (
                <VerifiedIcon className="ml-1 size-4 fill-sky-500 text-sidebar" />
              )}

              <Separator className="mx-1 mt-0.5 rounded-full data-horizontal:size-1" />

              <span className="mt-1 text-xs font-normal text-muted-foreground">
                {formatDistanceToNowStrict(new Date(thread.createdAt))}
              </span>
            </div>

            <p className="max-w-[15ch] truncate text-xs font-medium tracking-wide text-muted-foreground">
              @{thread.author.username}
            </p>
          </div>

          <Button size="icon" variant="ghost">
            <DotsThreeIcon className="size-4" />
          </Button>
        </div>

        <CardTitle className="line-clamp-2 text-lg font-semibold text-balance">
          {thread.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="mb-4 line-clamp-2 p-0! text-base font-normal text-muted-foreground">
        {parseMarkdownToWords(thread.content)}
      </CardContent>

      <CardFooter className="w-full gap-4 border-0 p-0!">
        <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-1 items-center gap-2">
          <Button size="icon-sm" variant="ghost">
            <ArrowBigUpIcon className="size-4" />
          </Button>

          <span>0</span>

          <Button size="icon-sm" variant="ghost">
            <ArrowBigDownIcon className="size-4" />
          </Button>
        </div>

        <Button variant="ghost" size="sm">
          <MessagesSquareIcon />

          <span>0</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
