import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'

import { ProfileLayout } from '#/features/profile/components/profile-layout'
import { userProfileQueryOptions } from '#/features/users/hooks/use-user-profile'

export const Route = createFileRoute('/_main/$username')({
  beforeLoad: async ({ context, params }) => {
    const user = await context.queryClient.ensureQueryData(
      userProfileQueryOptions(params.username)
    )

    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (!user) throw notFound()

    return {
      user,
      breadcrumb: params.username,
    }
  },
  component: () => {
    return (
      <ProfileLayout>
        <Outlet />
      </ProfileLayout>
    )
  },
})
