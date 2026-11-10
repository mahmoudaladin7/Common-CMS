import type { CollectionConfig } from 'payload'
import { tenantRead, tenantCreate, tenantWrite, tenantVersions } from '@/access/tenancy'
import { linkFields } from '@/fields'
import { validateHref } from '@/lib/validation'

export const SiteSettings: CollectionConfig = {
  slug: 'site-settings',
  labels: { singular: 'Site settings', plural: 'Site settings' },
  admin: {
    group: 'Workspace',
    description: 'Public website information. Never store secrets or API credentials here.',
  },
  access: {
    read: tenantRead(false),
    create: tenantCreate(['admin']),
    update: tenantWrite(['admin']),
    delete: () => false,
    readVersions: tenantVersions,
  },
  versions: { maxPerDoc: 20 },
  fields: [
    { name: 'siteName', type: 'text', required: true, localized: true, defaultValue: 'Common' },
    { name: 'tagline', type: 'textarea', localized: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'address', type: 'textarea', localized: true },
    { name: 'socialLinks', type: 'array', fields: linkFields },
    { name: 'defaultDescription', type: 'textarea', localized: true, maxLength: 180 },
    { name: 'defaultImage', type: 'upload', relationTo: 'media' },
    {
      name: 'externalWebsite',
      type: 'text',
      validate: validateHref,
      admin: { description: 'Optional: the separate website consuming this CMS.' },
    },
  ],
}

export const Navigation: CollectionConfig = {
  slug: 'navigation',
  admin: {
    group: 'Website',
    description:
      'Menu changes take effect immediately. Page content has a separate draft workflow.',
  },
  access: {
    read: tenantRead(false),
    create: tenantCreate(),
    update: tenantWrite(),
    delete: () => false,
    readVersions: tenantVersions,
  },
  versions: { maxPerDoc: 20 },
  fields: [
    { name: 'main', label: 'Main menu', type: 'array', maxRows: 8, fields: linkFields },
    { name: 'footer', label: 'Footer menu', type: 'array', maxRows: 12, fields: linkFields },
  ],
}
