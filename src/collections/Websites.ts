import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access'
import { isSuperAdmin, websiteIDs } from '@/access/tenancy'
export const Websites: CollectionConfig = {
  slug: 'websites',
  labels: { singular: { en: 'Website', ar: 'موقع' }, plural: { en: 'Websites', ar: 'المواقع' } },
  admin: { useAsTitle: 'name', group: 'Workspace', defaultColumns: ['name', 'domain'] },
  access: {
    create: adminOnly,
    read: ({ req }) =>
      isSuperAdmin(req.user) ? true : req.user ? { id: { in: websiteIDs(req.user) } } : false,
    update: adminOnly,
    // Workspace deletion needs an explicit archival/migration process.
    delete: () => false,
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      validate: (v: unknown) =>
        (typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) ||
        'Use a lowercase website identifier.',
    },
    {
      name: 'domain',
      type: 'text',
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value),
        ],
      },
      validate: (v: unknown) =>
        (typeof v === 'string' &&
          /^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9-]+)$/.test(v)) ||
        'Enter a hostname without a scheme, port or path.',
    },
  ],
}
