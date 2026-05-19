import { createFileRoute } from '@tanstack/react-router'

import { z } from 'zod'

import { MarkdownRenderer } from '#/components/markdown-renderer'
import { Separator } from '#/components/ui/separator'
import { CommentsThread } from '#/features/comments/components/comments-thread'
import { threadCommentsInfiniteQueryOptions } from '#/features/comments/query-options'
import {
  threadDetailQueryOptions,
  useThreadDetailQuery,
} from '#/features/threads/hooks/use-threads'
import { sortByCommentsSchema } from '#/schemas/drizzle-zod'

const commentsSortParams = z.object({
  sortBy: sortByCommentsSchema.optional(),
})

export const Route = createFileRoute('/_main/$username_/threads/$threadSlug')({
  validateSearch: commentsSortParams,
  loaderDeps: ({ search: { sortBy } }) => ({ sortBy: sortBy ?? 'top' }),
  beforeLoad: async ({ context, params }) => {
    const thread = await context.queryClient.ensureQueryData(
      threadDetailQueryOptions({ slug: params.threadSlug })
    )

    return { thread }
  },
  loader: async ({ context, params, deps }) => {
    await context.queryClient.ensureInfiniteQueryData(
      threadCommentsInfiniteQueryOptions({
        threadSlug: params.threadSlug,
        sortBy: deps.sortBy,
      })
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { threadSlug } = Route.useParams()
  const { data: thread } = useThreadDetailQuery({ slug: threadSlug })

  return (
    <div className="container mx-auto w-full max-w-2xl px-4 pt-4 pb-8">
      <MarkdownRenderer
        content={thread.content}
        className="max-w-none min-w-0"
      />

      <Separator className="my-8" />

      <CommentsThread threadAuthorId={thread.author.id} />
    </div>
  )
}
