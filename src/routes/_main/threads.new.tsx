import { createFileRoute, redirect } from '@tanstack/react-router'

import { NewThreadForm } from '#/features/threads/components/new-thread-form'

export const Route = createFileRoute('/_main/threads/new')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect_to: location.pathname,
        },
      })
    }

    return { auth: context.auth, breadcrumb: 'Create Thread' }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="container mx-auto  w-full max-w-2xl pt-4 pb-8">
      <NewThreadForm />
    </div>
  )
}
