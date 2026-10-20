import path from 'node:path'
import type { CollectionConfig } from 'payload'
import { adminOnly, editors } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
    description: 'Public website assets. Do not upload private documents.',
  },
  access: { read: () => true, create: editors, update: editors, delete: adminOnly },
  upload: {
    // This directory is a runtime volume, not a build-time asset dependency.
    staticDir: path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_DIR || './media'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 480, height: 320, fit: 'inside', withoutEnlargement: true },
      { name: 'large', width: 1600, withoutEnlargement: true },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      label: 'Alternative text',
      admin: { description: 'Describe the image or document for people using screen readers.' },
    },
    { name: 'caption', type: 'textarea', localized: true },
  ],
}
