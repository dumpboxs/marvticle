import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/$username/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <h1>Username</h1>
    </div>
  )
}
