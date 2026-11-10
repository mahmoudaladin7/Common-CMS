import {
  APIError,
  type Access,
  type CollectionBeforeValidateHook,
  type PayloadRequest,
  type Where,
} from 'payload'

type Actor =
  | {
      role?: string | null
      tenants?: { tenant: number | { id: number }; role?: string | null }[] | null
    }
  | null
  | undefined
export const relationID = (value: unknown): number | undefined => {
  const id = typeof value === 'object' && value ? (value as { id?: unknown }).id : value
  return Number.isSafeInteger(Number(id)) && Number(id) > 0 ? Number(id) : undefined
}
export const isSuperAdmin = (user: Actor) => user?.role === 'admin'
export const websiteIDs = (user: Actor, roles = ['admin', 'editor', 'viewer']) =>
  (user?.tenants || [])
    .filter((row) => roles.includes(row.role || 'viewer'))
    .map((row) => relationID(row.tenant)!)
    .filter(Boolean)

// Public scope comes from a registered hostname, never from an arbitrary tenant ID.
// Internal rendering passes the resolved scope through Local API context.
export async function publicWebsite(req: PayloadRequest): Promise<number | undefined> {
  if (req.context.websiteID) return relationID(req.context.websiteID)
  const host = req.headers.get('host')?.toLowerCase().split(':')[0]
  if (!host) return undefined
  const result = await req.payload.find({
    collection: 'websites',
    overrideAccess: true,
    depth: 0,
    limit: 1,
    req,
    where: { domain: { equals: host } },
  })
  return result.docs[0]?.id
}

export const tenantRead =
  (published = true): Access =>
  async ({ req }) => {
    const scope = relationID(req.context.websiteID)
    if (req.user) {
      if (isSuperAdmin(req.user)) return scope ? { tenant: { equals: scope } } : true
      const ids = websiteIDs(req.user)
      if (scope && !ids.includes(scope)) return false
      return { tenant: scope ? { equals: scope } : { in: ids } }
    }
    const id = await publicWebsite(req)
    if (!id) return false
    return {
      and: [
        { tenant: { equals: id } },
        ...(published ? [{ _status: { equals: 'published' } }] : []),
      ],
    } as Where
  }
export const tenantWrite =
  (roles = ['admin', 'editor']): Access =>
  ({ req, data }) => {
    if (isSuperAdmin(req.user)) return true
    const ids = websiteIDs(req.user, roles)
    if (!req.user || !ids.length) return false
    if (data?.tenant && !ids.includes(relationID(data.tenant)!)) return false
    return { tenant: { in: ids } }
  }
export const tenantCreate =
  (roles = ['admin', 'editor']): Access =>
  ({ req, data }) =>
    isSuperAdmin(req.user) ||
    Boolean(
      req.user &&
      (data?.tenant
        ? websiteIDs(req.user, roles).includes(relationID(data.tenant)!)
        : websiteIDs(req.user, roles).length > 0),
    )
export const tenantVersions: Access = ({ req }) => {
  if (!req.user) return false
  if (isSuperAdmin(req.user)) return true
  return { 'version.tenant': { in: websiteIDs(req.user) } }
}
export const tenantContentAccess = {
  read: tenantRead(),
  create: tenantCreate(),
  update: tenantWrite(),
  delete: tenantWrite(['admin']),
  readVersions: tenantVersions,
}

// Enforce immutability and validate every relationship, including blocks and rich text.
// UI filters alone do not prevent a forged cross-website relationship ID.
export const enforceWebsite: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
  collection,
  operation,
}) => {
  if (!data) return data
  const id = relationID(data.tenant ?? originalDoc?.tenant)
  if (!id) throw new APIError('Select a website for this document.', 400)
  if (operation === 'update' && id !== relationID(originalDoc.tenant))
    throw new APIError('Documents cannot move between websites.', 403)
  if (req.user && !isSuperAdmin(req.user)) {
    const roles = collection.slug === 'site-settings' ? ['admin'] : ['admin', 'editor']
    if (!websiteIDs(req.user, roles).includes(id))
      throw new APIError('You cannot edit this website.', 403)
  }
  const configFields = collection.fields
  async function checkReference(value: unknown, target: string) {
    if (value == null) return
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      const ref = relationID(item)
      if (!ref) throw new APIError('Invalid relationship.', 400)
      const doc = await req.payload.findByID({
        collection: target as 'media',
        id: ref,
        depth: 0,
        req,
        overrideAccess: true,
      })
      if (relationID((doc as unknown as { tenant?: unknown }).tenant) !== id)
        throw new APIError('Relationships must belong to the same website.', 400)
    }
  }
  async function walk(fields: typeof configFields, object: Record<string, unknown>) {
    for (const field of fields) {
      if (field.type === 'tabs') {
        for (const tab of field.tabs)
          await walk(
            tab.fields,
            'name' in tab && tab.name
              ? ((object[tab.name] || {}) as Record<string, unknown>)
              : object,
          )
        continue
      }
      if (!('name' in field) || !field.name) {
        if ('fields' in field) await walk(field.fields, object)
        continue
      }
      const value = object[field.name]
      if (value == null) continue
      if (field.type === 'upload' || field.type === 'relationship') {
        if (Array.isArray(field.relationTo)) {
          for (const entry of Array.isArray(value) ? value : [value]) {
            const row = entry as { relationTo: string; value: unknown }
            if (row.relationTo !== 'websites') await checkReference(row.value, row.relationTo)
          }
        } else if (field.relationTo !== 'websites') await checkReference(value, field.relationTo)
      } else if (field.type === 'group') await walk(field.fields, value as Record<string, unknown>)
      else if (field.type === 'array') {
        for (const row of value as Record<string, unknown>[]) await walk(field.fields, row)
      } else if (field.type === 'blocks') {
        for (const row of value as Record<string, unknown>[]) {
          const block = field.blocks.find(
            (block) => typeof block !== 'string' && block.slug === row.blockType,
          )
          if (block && typeof block !== 'string') await walk(block.fields, row)
        }
      } else if (field.type === 'richText') await richReferences(value)
    }
  }
  async function richReferences(value: unknown): Promise<void> {
    if (!value || typeof value !== 'object') return
    const node = value as Record<string, unknown>
    if (
      (node.type === 'upload' || node.type === 'relationship') &&
      typeof node.relationTo === 'string'
    )
      await checkReference(node.value, node.relationTo)
    if (node.type === 'link' && node.fields && typeof node.fields === 'object') {
      const doc = (node.fields as { doc?: { relationTo: string; value: unknown } }).doc
      if (doc) await checkReference(doc.value, doc.relationTo)
    }
    for (const child of Object.values(node))
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) await richReferences(item)
        } else await richReferences(child)
      }
  }
  await walk(configFields, data)
  return data
}
