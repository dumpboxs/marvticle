import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useLocation,
} from '@tanstack/react-router'
import { ArrowLeftIcon } from '@phosphor-icons/react'
import { z } from 'zod'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { SocialSignInButtons } from '#/components/social-sign-in-buttons'

const authSearchSchema = z.object({
  redirect_to: z.string().optional().default('/'),
})

export const Route = createFileRoute('/_auth')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.auth) {
      throw redirect({ to: search.redirect_to, viewTransition: true })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const pathname = useLocation({ select: (state) => state.pathname })
  const search = Route.useSearch()

  const title = pathname === '/sign-in' ? 'Sign In' : 'Sign Up'
  const description =
    pathname === '/sign-in'
      ? 'Enter your username below to login to your account'
      : 'Create an account'

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-y-4 px-4">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute top-4 left-4"
        asChild
      >
        <Link to="/" viewTransition>
          <ArrowLeftIcon />
        </Link>
      </Button>

      <Card className="w-full max-w-md gap-0">
        <CardHeader>
          <CardTitle className="font-heading text-xl font-semibold">
            {title}
          </CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>

        <CardContent className="mt-6">
          <Outlet />

          <div className="my-6 flex w-full items-center justify-between gap-x-2">
            <Separator className="flex-1" />
            <span className="text-muted-foreground">or continue with</span>
            <Separator className="flex-1" />
          </div>

          <SocialSignInButtons />
        </CardContent>

        <CardFooter className="border-none px-4">
          <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
            {pathname === '/sign-in' ? (
              <p>
                Don't have an account?{' '}
                <Button variant="link" size="sm" className="p-0" asChild>
                  <Link to="/sign-up" search={search} viewTransition>
                    Sign Up
                  </Link>
                </Button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <Button variant="link" size="sm" className="p-0" asChild>
                  <Link to="/sign-in" search={search} viewTransition>
                    Sign In
                  </Link>
                </Button>
              </p>
            )}
          </div>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        By signing {pathname === '/sign-in' ? 'in' : 'up'}, you agree to the{' '}
        <Link
          to="."
          className="font-medium text-primary hover:underline hover:underline-offset-4"
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          to="."
          className="font-medium text-primary hover:underline hover:underline-offset-4"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  )
}
