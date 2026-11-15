import type { Access, FieldAccess } from 'payload'

type Actor = { role?: string | null; disabled?: boolean | null } | null | undefined
export const isAdmin = (user: Actor): boolean => user?.role === 'admin' && !user.disabled
export const adminOnly: Access = ({ req }) => isAdmin(req.user)
export const adminField: FieldAccess = ({ req }) => isAdmin(req.user)

export const adminOrSelf: Access = ({ req }) =>
  isAdmin(req.user)
    ? true
    : req.user && !req.user.disabled
      ? { id: { equals: req.user.id } }
      : false

export { tenantContentAccess as contentAccess } from './tenancy'
