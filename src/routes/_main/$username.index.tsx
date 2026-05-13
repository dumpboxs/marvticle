import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/$username/')({
  beforeLoad: ({ params }) => ({
    breadcrumb: params.username,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="container mx-auto  w-full max-w-6xl pt-4 pb-8">
      Hello "/_main/$username/"!
    </div>
  )
}
