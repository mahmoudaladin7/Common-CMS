import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { adminField, adminOnly, adminOrSelf } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'name', group: 'Workspace', defaultColumns: ['name', 'email', 'role'] },
  auth: {
    tokenExpiration: 60 * 60 * 2,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: { secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' },
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'viewer',
      saveToJWT: true,
      admin: { condition: (_data, _siblingData, { user }) => Boolean(user) },
      access: { create: adminField, update: adminField },
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ operation, data, req, originalDoc }) => {
        // Payload's first-user registration bypasses collection create access.
        // Grant admin only while the database is empty, never from form input.
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({
            collection: 'users',
            req,
            overrideAccess: true,
          })
          if (totalDocs === 0) data.role = 'admin'
        }
        if (
          operation === 'update' &&
          originalDoc.role === 'admin' &&
          data.role &&
          data.role !== 'admin'
        ) {
          const { totalDocs } = await req.payload.count({
            collection: 'users',
            where: { role: { equals: 'admin' } },
            req,
            overrideAccess: true,
          })
          if (totalDocs <= 1)
            throw new APIError('Keep at least one administrator in this workspace.', 400)
        }
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const user = await req.payload.findByID({
          collection: 'users',
          id,
          req,
          overrideAccess: true,
        })
        if (user.role === 'admin') {
          const { totalDocs } = await req.payload.count({
            collection: 'users',
            where: { role: { equals: 'admin' } },
            req,
            overrideAccess: true,
          })
          if (totalDocs <= 1) throw new APIError('The last administrator cannot be deleted.', 400)
        }
      },
    ],
  },
}
