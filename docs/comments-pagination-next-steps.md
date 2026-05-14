# Comments Pagination Next Steps

## Current State

The current comments implementation is intentionally simple:

- `comments.getByThread` returns every comment for a thread in one flat response.
- `buildCommentTree(items)` turns that flat response into a recursive tree on the client.
- UI can render Reddit-style comments by recursively rendering `commentTree` and passing `depth` as a render-only value.
- `depth` is not stored in the database and is not returned by the API.
- Child comments are not nested in the ORPC response.

This is good enough for small and medium threads. For large Reddit-style threads, the next step is to avoid loading the entire comment tree at once.

## Target Design

Move from one full-tree endpoint to two paginated read endpoints:

1. Root comments pagination
2. Replies pagination per parent comment

This keeps initial thread load fast while still supporting unlimited nesting.

The API should return flat paginated rows, not deeply nested recursive payloads. The client then composes the visible tree from cached root pages and loaded reply pages.

## Why Not Return Full Nested Children From The API?

Avoid returning all nested children in one response because:

- Deep trees can become very large.
- Recursive SQL is more complex and harder to paginate predictably.
- TanStack Query cache updates are simpler with per-parent pages.
- "Load more replies" maps naturally to `parentId` scoped queries.
- Optimistic updates are easier when comments are cached by root list or parent reply list.

## Proposed API Shape

Keep existing mutation endpoints:

- `comments.create`
- `comments.update`
- `comments.delete`

Replace or supplement `comments.getByThread` with:

```ts
comments.getRoots
comments.getReplies
```

### `comments.getRoots`

Route:

```txt
GET /threads/{threadId}/comments
```

Input:

```ts
{
  threadId: string
  limit?: number
  cursor?: string
}
```

Behavior:

- Returns only comments where `parentId IS NULL`.
- Ordered by `createdAt asc`, `id asc` for stable Reddit-style chronological reading.
- Uses cursor pagination.
- Includes a lightweight `repliesCount` so UI can show "Load replies" without fetching children first.

Output:

```ts
{
  items: Array<CommentListItem>
  nextCursor: string | null
}
```

### `comments.getReplies`

Route:

```txt
GET /comments/{parentId}/replies
```

Input:

```ts
{
  parentId: string
  limit?: number
  cursor?: string
}
```

Behavior:

- Verifies parent comment exists.
- Returns only direct children where `comments.parentId = parentId`.
- Ordered by `createdAt asc`, `id asc`.
- Uses cursor pagination.
- Includes `repliesCount` for every returned child.

Output:

```ts
{
  items: Array<CommentListItem>
  nextCursor: string | null
}
```

### `CommentListItem`

Recommended public output:

```ts
{
  id: string
  threadId: string
  parentId: string | null
  content: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  isDeleted: boolean
  repliesCount: number
  author: {
    name: string
    username: string
    image: string | null
  }
}
```

Do not add `depth` to this API output. Let UI compute depth during recursive rendering:

```tsx
<CommentNode comment={comment} depth={depth + 1} />
```

## Cursor Design

Use the same cursor style already used by threads:

```ts
{
  id: string
  createdAt: Date
}
```

Encode as base64url JSON.

Root comments query condition:

```ts
where(
  and(
    eq(commentsTable.threadId, input.threadId),
    isNull(commentsTable.parentId),
    cursorCondition
  )
)
```

Replies query condition:

```ts
where(
  and(
    eq(commentsTable.parentId, input.parentId),
    cursorCondition
  )
)
```

For ascending order, cursor condition should be:

```ts
or(
  gt(commentsTable.createdAt, cursor.createdAt),
  and(
    eq(commentsTable.createdAt, cursor.createdAt),
    gt(commentsTable.id, cursor.id)
  )
)
```

Then order by:

```ts
orderBy(asc(commentsTable.createdAt), asc(commentsTable.id))
```

Fetch `limit + 1`, slice to `limit`, and encode the last returned item as `nextCursor` when more data exists.

## Counting Replies

Each returned comment should include direct `repliesCount`.

Recommended implementation options:

1. Use a grouped subquery by `parentId`.
2. Left join the grouped count onto returned comments.
3. Convert count to a number before returning.

Do not count all descendants. `repliesCount` should mean direct replies only.

This keeps "Load replies" behavior predictable:

- If `repliesCount === 0`, hide reply loader.
- If `repliesCount > loadedRepliesCount`, show "Load more replies".

## Schema Changes

Update `src/features/comments/schemas/comment.schema.ts`:

- Add `DEFAULT_COMMENTS_LIMIT = 20`
- Add `MAX_COMMENTS_LIMIT = 50`
- Add `commentPaginationCursorSchema`
- Add `getRootCommentsSchema`
- Add `getCommentRepliesSchema`
- Add `paginatedCommentsSchema`
- Extend `commentSelectSchema` with `repliesCount`

Proposed schemas:

```ts
export const getRootCommentsSchema = z.object({
  threadId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional(),
})

export const getCommentRepliesSchema = z.object({
  parentId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).optional(),
})

export const paginatedCommentsSchema = z.object({
  items: commentSelectSchema.array(),
  nextCursor: z.string().nullable(),
})
```

## ORPC Contract Changes

Update `src/orpc/contracts/comments.contract.ts`:

- Keep `create`, `update`, `delete`.
- Add `getRoots`.
- Add `getReplies`.
- Deprecate or remove `getByThread`.

Recommended short-term approach:

- Keep `getByThread` temporarily to avoid breaking existing callers.
- Implement new hooks against `getRoots` and `getReplies`.
- Remove `getByThread` once UI has migrated.

## Router Handler Changes

Update `src/orpc/routers/comments.router.ts`:

- Extract cursor helpers:
  - `encodeCommentCursor`
  - `decodeCommentCursor`
- Extract paginated select helper:
  - `getPaginatedComments`
- Add root handler:
  - verifies thread exists
  - filters `parentId IS NULL`
- Add replies handler:
  - verifies parent exists
  - filters by `parentId`
- Include `repliesCount` for every returned item.

Keep existing mutation rules:

- create requires auth
- update/delete require ownership
- deleted comments cannot be edited
- replies cannot be created under deleted comments
- delete remains soft-delete tombstone

## TanStack Query Hooks

Update `src/features/comments/hooks/use-comments.ts`.

### Root Comments Hook

```ts
export const rootCommentsInfiniteQueryOptions = ({
  threadId,
  limit,
}: {
  threadId: string
  limit: number
}) =>
  orpc.comments.getRoots.infiniteOptions({
    input: (pageParam: string | null) => ({
      threadId,
      limit,
      cursor: typeof pageParam === 'string' ? pageParam : undefined,
    }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
```

Hook:

```ts
export const useRootCommentsInfiniteQuery = ({
  threadId,
  limit,
}: {
  threadId: string
  limit: number
}) => {
  const query = useSuspenseInfiniteQuery(
    rootCommentsInfiniteQueryOptions({ threadId, limit })
  )

  const comments = query.data.pages.flatMap((page) => page.items)

  return { ...query, comments }
}
```

### Replies Hook

```ts
export const commentRepliesInfiniteQueryOptions = ({
  parentId,
  limit,
}: {
  parentId: string
  limit: number
}) =>
  orpc.comments.getReplies.infiniteOptions({
    input: (pageParam: string | null) => ({
      parentId,
      limit,
      cursor: typeof pageParam === 'string' ? pageParam : undefined,
    }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(parentId),
  })
```

Hook:

```ts
export const useCommentRepliesInfiniteQuery = ({
  parentId,
  limit,
  enabled,
}: {
  parentId: string
  limit: number
  enabled: boolean
}) => {
  const query = useSuspenseInfiniteQuery({
    ...commentRepliesInfiniteQueryOptions({ parentId, limit }),
    enabled,
  })

  const replies = query.data.pages.flatMap((page) => page.items)

  return { ...query, replies }
}
```

### Mutation Invalidation

Create comment:

- If `parentId` is null:
  - invalidate root comments for `threadId`
- If `parentId` exists:
  - invalidate replies for that `parentId`
  - optionally invalidate roots if UI displays aggregate thread comment count

Update comment:

- Invalidate either:
  - parent replies query if `parentId` exists
  - root comments query if `parentId` is null

Delete comment:

- Same invalidation as update.
- Keep children cached and visible.

To make update/delete invalidation precise, mutation outputs should include `parentId` and `threadId`, which the current output already does.

## UI Rendering Guide

Recommended Reddit-style flow:

1. Thread page calls `useRootCommentsInfiniteQuery({ threadId, limit: 20 })`.
2. Render root comments.
3. Each `CommentNode` owns its own collapsed/expanded state.
4. If expanded, `CommentNode` calls `useCommentRepliesInfiniteQuery({ parentId: comment.id, limit: 20, enabled: isExpanded })`.
5. Render direct replies recursively.
6. Pass `depth + 1` to child nodes.
7. Cap visual indentation with `Math.min(depth, 8)`.

Example component shape:

```tsx
function CommentNode({
  comment,
  depth,
}: {
  comment: CommentListItem
  depth: number
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const repliesQuery = useCommentRepliesInfiniteQuery({
    parentId: comment.id,
    limit: 20,
    enabled: isExpanded,
  })

  const visualDepth = Math.min(depth, 8)

  return (
    <div style={{ marginLeft: visualDepth * 16 }}>
      <CommentBody comment={comment} />

      {comment.repliesCount > 0 && (
        <button onClick={() => setIsExpanded((value) => !value)}>
          {isExpanded ? 'Hide replies' : `View ${comment.repliesCount} replies`}
        </button>
      )}

      {isExpanded &&
        repliesQuery.replies.map((reply) => (
          <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
        ))}

      {isExpanded && repliesQuery.hasNextPage && (
        <button onClick={() => repliesQuery.fetchNextPage()}>
          Load more replies
        </button>
      )}
    </div>
  )
}
```

## TODO

### Data And Schema

- [ ] Add `repliesCount` to public comment output schema.
- [ ] Add comment pagination constants.
- [ ] Add comment cursor schema.
- [ ] Add root comments input schema.
- [ ] Add replies input schema.
- [ ] Add paginated comments output schema.

### ORPC Contracts

- [ ] Add `comments.getRoots`.
- [ ] Add `comments.getReplies`.
- [ ] Keep `comments.getByThread` during migration or remove it if no UI depends on it.
- [ ] Ensure OpenAPI route metadata uses clear operation IDs:
  - `getRootComments`
  - `getCommentReplies`

### ORPC Router

- [ ] Add `encodeCommentCursor`.
- [ ] Add `decodeCommentCursor`.
- [ ] Add invalid cursor handling with `BAD_REQUEST`.
- [ ] Add root comments handler.
- [ ] Add replies handler.
- [ ] Add direct replies count to each returned comment.
- [ ] Keep mutation auth and ownership rules unchanged.

### Hooks

- [ ] Add `rootCommentsInfiniteQueryOptions`.
- [ ] Add `useRootCommentsInfiniteQuery`.
- [ ] Add `commentRepliesInfiniteQueryOptions`.
- [ ] Add `useCommentRepliesInfiniteQuery`.
- [ ] Update create mutation invalidation for root vs reply creation.
- [ ] Update update mutation invalidation for root vs reply comment.
- [ ] Update delete mutation invalidation for root vs reply comment.
- [ ] Keep old `useThreadCommentsQuery` only if needed for migration.

### UI Preparation

- [ ] Render roots from `useRootCommentsInfiniteQuery`.
- [ ] Render replies lazily per `CommentNode`.
- [ ] Track expanded state per comment id.
- [ ] Cap visual indentation depth.
- [ ] Add "Load more comments" at root level.
- [ ] Add "Load more replies" per comment.
- [ ] Render deleted comments as tombstones while keeping replies visible.

### Tests

- [ ] Test root pagination returns only `parentId = null`.
- [ ] Test replies pagination returns only direct children.
- [ ] Test cursor ordering is stable for same timestamp.
- [ ] Test invalid cursor returns `BAD_REQUEST`.
- [ ] Test missing thread returns `NOT_FOUND`.
- [ ] Test missing parent returns `NOT_FOUND`.
- [ ] Test `repliesCount` counts direct replies only.
- [ ] Test create reply invalidates parent replies query in hook-level behavior if hook tests are added.

## Acceptance Criteria

- Initial thread page does not fetch all nested comments.
- Root comments can be paginated.
- Replies can be loaded on demand per parent.
- Unlimited nesting still works.
- Deleted parent comments still show their loaded replies.
- Cache invalidation updates the correct root or reply query.
- API response stays flat and predictable.
- UI can render Reddit-style comments using `depth` as render state, not persisted data.
