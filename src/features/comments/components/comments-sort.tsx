import { useNavigate } from '@tanstack/react-router'

import { useMemo } from 'react'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { SortByComments } from '#/schemas/drizzle-zod'

interface CommentsSortProps {
  count: number
  sortBy: SortByComments
}

const commentSortOptions: Array<{
  value: SortByComments
  label: string
}> = [
  { value: 'top', label: 'Top' },
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
]

export const CommentsSort = ({ count, sortBy }: CommentsSortProps) => {
  const navigate = useNavigate()

  const handleSelectValue = (value: SortByComments) => {
    void navigate({
      to: '.',
      search: (prev) => ({ ...prev, sortBy: value }),
      replace: true,
      viewTransition: true,
    })
  }

  const commentSortOption = useMemo(() => {
    return commentSortOptions.find((o) => o.value === sortBy)
  }, [sortBy])

  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-heading text-lg font-semibold">
        {commentSortOption?.label} Comments{' '}
        <span className="text-sm text-muted-foreground">({count})</span>
      </h2>

      <Select onValueChange={handleSelectValue} value={sortBy}>
        <SelectTrigger className="w-full max-w-20">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Sort by</SelectLabel>
            {commentSortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
