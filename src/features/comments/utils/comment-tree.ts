export type ThreadComment = {
  id: string
  threadId: string
  parentId: string | null
  content: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  isDeleted: boolean
  author: {
    name: string
    username: string
    image: string | null
  }
}

export type CommentTreeItem = ThreadComment & {
  replies: Array<CommentTreeItem>
}

export const buildCommentTree = (
  items: Array<ThreadComment>
): Array<CommentTreeItem> => {
  const commentsById = new Map<string, CommentTreeItem>()

  for (const item of items) {
    commentsById.set(item.id, {
      ...item,
      replies: [],
    })
  }

  const roots: Array<CommentTreeItem> = []

  for (const item of items) {
    const comment = commentsById.get(item.id)

    if (!comment) continue

    const parent = item.parentId ? commentsById.get(item.parentId) : undefined

    if (parent) {
      parent.replies.push(comment)
      continue
    }

    roots.push(comment)
  }

  return roots
}
