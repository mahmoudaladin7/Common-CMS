import type { CollectionConfig } from 'payload'
import { contentAccess } from '@/access'
import { pageBlocks } from '@/blocks'
import { seoField, slugField, titleField } from '@/fields'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description: 'Build and reorder sections. Save a draft, review it, then publish.',
    preview: (doc, { locale }) => `/preview?collection=pages&id=${doc.id}&locale=${locale}`,
  },
  access: contentAccess,
  versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 30 },
  fields: [
    titleField,
    slugField(true),
    { name: 'layout', type: 'blocks', blocks: pageBlocks, required: true, minRows: 1 },
    seoField,
  ],
}
