import type { Access, FieldAccess } from 'payload'

type Actor = { role?: string | null } | null | undefined
export const isAdmin = (user: Actor): boolean => user?.role === 'admin'
export const canEdit = (user: Actor): boolean => isAdmin(user) || user?.role === 'editor'

export const adminOnly: Access = ({ req }) => isAdmin(req.user)
export const editors: Access = ({ req }) => canEdit(req.user)
export const authenticated: Access = ({ req }) => Boolean(req.user)
export const adminField: FieldAccess = ({ req }) => isAdmin(req.user)

// A query constraint is enforced by REST, GraphQL and access-aware Local API calls.
export const publishedOrAuthenticated: Access = ({ req }) =>
  req.user ? true : { _status: { equals: 'published' } }

export const adminOrSelf: Access = ({ req }) =>
  isAdmin(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false

export const contentAccess = {
  create: editors,
  read: publishedOrAuthenticated,
  update: editors,
  delete: adminOnly,
  readVersions: authenticated,
}
