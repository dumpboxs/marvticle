import { Link, useMatchRoute, linkOptions } from '@tanstack/react-router'

import { Fragment } from 'react/jsx-runtime'

import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'

const getProfileLinks = (username: string) => {
  return linkOptions([
    {
      to: '/$username',
      params: { username },
      label: 'Threads',
    },
  ])
}

export const ProfileNavigation = ({ username }: { username: string }) => {
  const profileLinks = getProfileLinks(username)
  const matchRoute = useMatchRoute()

  return (
    <div className="my-4 px-4">
      <div className="mb-2 flex items-center justify-start gap-2">
        {profileLinks.map((link) => {
          const isActive = matchRoute({ to: link.to, params: link.params })
          return (
            <Fragment key={link.to}>
              <Button
                type="button"
                variant={isActive ? 'secondary' : 'ghost'}
                asChild
              >
                <Link {...link} viewTransition>
                  {link.label}
                </Link>
              </Button>
            </Fragment>
          )
        })}
      </div>

      <Separator />
    </div>
  )
}
