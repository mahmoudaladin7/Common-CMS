import type { CollectionConfig } from 'payload'
import { contentAccess } from '@/access'
import { seoField, slugField, titleField } from '@/fields'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Article', plural: 'Articles' },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', '_status', 'publishedAt'],
    preview: (doc, { locale }) => `/preview?collection=posts&id=${doc.id}&locale=${locale}`,
  },
  access: contentAccess,
  versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 30 },
  fields: [
    titleField,
    slugField(),
    { name: 'excerpt', type: 'textarea', localized: true, required: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'category', type: 'text', localized: true },
    {
      name: 'authorName',
      type: 'text',
      localized: true,
      admin: { description: 'A public byline, separate from private CMS user accounts.' },
    },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
    { name: 'content', type: 'richText', localized: true, required: true },
    seoField,
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data._status === 'published' && !data.publishedAt)
          data.publishedAt = new Date().toISOString()
        return data
      },
    ],
  },
}
