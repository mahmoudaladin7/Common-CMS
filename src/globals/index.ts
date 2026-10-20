import type { GlobalConfig } from 'payload'
import { adminOnly, editors } from '@/access'
import { linkFields } from '@/fields'
import { validateHref } from '@/lib/validation'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: {
    group: 'Workspace',
    description: 'Public website information. Never store secrets or API credentials here.',
  },
  access: { read: () => true, update: adminOnly },
  versions: { max: 20 },
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

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  admin: {
    group: 'Website',
    description:
      'Menu changes take effect immediately. Page content has a separate draft workflow.',
  },
  access: { read: () => true, update: editors },
  versions: { max: 20 },
  fields: [
    { name: 'main', label: 'Main menu', type: 'array', maxRows: 8, fields: linkFields },
    { name: 'footer', label: 'Footer menu', type: 'array', maxRows: 12, fields: linkFields },
  ],
}
