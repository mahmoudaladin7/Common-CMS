import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access'
import { isSuperAdmin, websiteIDs } from '@/access/tenancy'
export const Websites: CollectionConfig = {
  slug: 'websites',
  labels: { singular: { en: 'Website', ar: 'موقع' }, plural: { en: 'Websites', ar: 'المواقع' } },
  admin: {
    useAsTitle: 'name',
    group: { en: 'Workspace', ar: 'مساحة العمل' },
    defaultColumns: ['name', 'domain'],
    description: {
      en: 'Add a workspace for an existing website. Domain routing and deployment are connected separately.',
      ar: 'أضف مساحة عمل لموقع. يتم ربط النطاق والاستضافة بشكل منفصل.',
    },
  },
  access: {
    create: adminOnly,
    read: ({ req }) =>
      isSuperAdmin(req.user) ? true : req.user ? { id: { in: websiteIDs(req.user) } } : false,
    update: adminOnly,
    // Workspace deletion needs an explicit archival/migration process.
    delete: () => false,
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        await req.payload.create({
          collection: 'site-settings',
          req,
          overrideAccess: true,
          locale: req.locale === 'ar' ? 'ar' : 'en',
          data: { tenant: doc.id, siteName: doc.name },
        })
        await req.payload.create({
          collection: 'navigation',
          req,
          overrideAccess: true,
          data: { tenant: doc.id, main: [], footer: [] },
        })
        return doc
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    {
      name: 'slug',
      label: { en: 'Website identifier', ar: 'معرّف الموقع' },
      admin: {
        description: {
          en: 'A short internal identifier, for example company-a.',
          ar: 'معرّف داخلي قصير مثل company-a.',
        },
      },
      type: 'text',
      required: true,
      unique: true,
      validate: (v: unknown) =>
        (typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) ||
        'Use a lowercase website identifier.',
    },
    {
      name: 'domain',
      label: { en: 'Website domain', ar: 'نطاق الموقع' },
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
