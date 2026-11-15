import { DefaultNav } from '@payloadcms/next/rsc'
import type { AdminViewServerProps, PayloadRequest } from 'payload'
import { isAdmin } from '@/access'
import { relationID } from '@/access/tenancy'
import { cookies } from 'next/headers'

export async function WorkspaceNav(props: AdminViewServerProps & { req: PayloadRequest }) {
  const user = props.req.user
  if (isAdmin(user)) return <DefaultNav {...props} />
  const selected = Number((await cookies()).get('payload-tenant')?.value)
  const manager = user?.tenants?.some(
    (row) => row.role === 'admin' && relationID(row.tenant) === selected,
  )
  const allowed = new Set([
    'pages',
    'posts',
    'media',
    ...(manager ? ['navigation', 'site-settings'] : []),
  ])
  return (
    <DefaultNav
      {...props}
      visibleEntities={{
        globals: props.visibleEntities?.globals || [],
        collections: (props.visibleEntities?.collections || []).filter((slug) => allowed.has(slug)),
      }}
    />
  )
}
