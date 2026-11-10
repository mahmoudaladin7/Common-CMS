import type { Access, FieldAccess } from 'payload'

type Actor = { role?: string | null } | null | undefined
export const isAdmin = (user: Actor): boolean => user?.role === 'admin'
export const adminOnly: Access = ({ req }) => isAdmin(req.user)
export const adminField: FieldAccess = ({ req }) => isAdmin(req.user)

export const adminOrSelf: Access = ({ req }) =>
  isAdmin(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false

export { tenantContentAccess as contentAccess } from './tenancy'
