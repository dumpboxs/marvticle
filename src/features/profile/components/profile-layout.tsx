import { getRouteApi, Link } from '@tanstack/react-router'

import type { ComponentProps } from 'react'

import { DotsThreeVerticalIcon } from '@phosphor-icons/react'
import { formatDate } from 'date-fns'
import {
  CalendarDays,
  MapPinIcon,
  PencilIcon,
  UserPlus2Icon,
  VerifiedIcon,
} from 'lucide-react'

import { GeneratedBanner } from '#/components/generated-banner'
import { AspectRatio } from '#/components/ui/aspect-ratio'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { UserAvatar } from '#/components/user-avatar'
import { ProfileNavigation } from '#/features/profile/components/profile-navigation'
import { useUserProfile } from '#/features/users/hooks/use-user-profile'
import { cn } from '#/lib/utils'
import { getPublicOrExternalUrl } from '#/utils/storage'

type Props = ComponentProps<'div'>

const Route = getRouteApi('/_main/$username')

export const ProfileLayout = ({ className, children, ...props }: Props) => {
  const { username } = Route.useParams()
  const { auth } = Route.useRouteContext()
  const { data: user } = useUserProfile(username)

  return (
    <div
      className={cn('container mx-auto  w-full max-w-270  pb-8', className)}
      {...props}
    >
      <div className="relative flex flex-col gap-4">
        <AspectRatio ratio={3 / 1}>
          {user.banner ? (
            <img
              src={getPublicOrExternalUrl(user.banner)}
              alt={`Banner for ${user.username}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <GeneratedBanner seed={user.username} />
          )}
        </AspectRatio>

        <div className="absolute -bottom-8 left-6 after:absolute after:inset-0 after:outline-4 after:outline-sidebar after:content-['']">
          <UserAvatar
            name={user.username}
            image={user.image}
            className="size-16"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col px-4">
        <div className="flex items-center justify-end gap-2">
          {!auth ? (
            <>
              <Button type="button" variant="outline" size="icon">
                <DotsThreeVerticalIcon className="size-4" />
              </Button>

              <Button type="button" variant="default">
                <UserPlus2Icon className="size-4" />
                <span>Follow</span>
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" asChild>
              <Link
                to="/$username/settings"
                params={{ username }}
                viewTransition
              >
                <PencilIcon className="size-4" />
                <span>Edit profile</span>
              </Link>
            </Button>
          )}
        </div>

        <div className="-space-y-1.5">
          <h1 className="font-heading text-2xl font-bold">
            {user.name}
            {!!user.verified && (
              <VerifiedIcon className="ml-1 inline size-5 fill-sky-500 text-sidebar" />
            )}
          </h1>
          <div className="flex items-center gap-1.5 text-base text-muted-foreground">
            <span>@{user.username}</span>
            {!!user.pronouns && (
              <>
                <Separator className="mt-1 rounded-full data-horizontal:size-1" />
                <span className="mt-1 text-sm">{user.pronouns}</span>
              </>
            )}
          </div>
        </div>

        {!!user.bio && (
          <p className="my-4 text-base text-primary">{user.bio}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {!!user.location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPinIcon className="size-4" />
              <span>{user.location}</span>
            </p>
          )}

          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            <span>
              Joined {formatDate(new Date(user.createdAt), 'MMM yyyy')}
            </span>
          </p>
        </div>
      </div>

      <ProfileNavigation username={username} />

      {children}
    </div>
  )
}
