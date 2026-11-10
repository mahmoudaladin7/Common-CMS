import path from 'node:path'
import type { CollectionConfig } from 'payload'
import { tenantRead, tenantCreate, tenantWrite } from '@/access/tenancy'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
    description: 'Public website assets. Do not upload private documents.',
  },
  access: {
    read: tenantRead(false),
    create: tenantCreate(),
    update: tenantWrite(),
    delete: tenantWrite(['admin']),
  },
  hooks: {
    // Relative delivery URLs keep public assets on their owning website's host.
    // Absolute SERVER_URL links would send Company B images to the central/A host.
    afterRead: [
      ({ doc }) => {
        const fileURL = (filename: string) => `/api/media/file/${encodeURIComponent(filename)}`
        if (doc.filename) doc.url = fileURL(doc.filename)
        for (const size of Object.values(doc.sizes || {})) {
          const image = size as { filename?: string; url?: string }
          if (image.filename) image.url = fileURL(image.filename)
        }
        if (doc.sizes?.thumbnail?.filename) doc.thumbnailURL = fileURL(doc.sizes.thumbnail.filename)
        return doc
      },
    ],
  },
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
