import type { CollectionConfig, Field } from 'payload'
import { contentAccess } from '@/access'
import { seoField, slugField, titleField } from '@/fields'
import { validateHref } from '@/lib/validation'
import { cms } from '@/cms.config'

export type DirectorySlug = 'services' | 'projects' | 'companies' | 'team'

/**
 * These collections share an editorial lifecycle, not an arbitrary key/value bag.
 * Each keeps typed, domain-specific fields so extensions stay discoverable.
 */
function directory(slug: DirectorySlug, singular: string, fields: Field[]): CollectionConfig {
  return {
    slug,
    labels: { singular, plural: slug === 'team' ? 'Team' : slug[0].toUpperCase() + slug.slice(1) },
    admin: {
      useAsTitle: 'title',
      group: 'Website',
      defaultColumns: ['title', '_status', 'sortOrder'],
      hidden: !cms.modules[slug],
      preview: (doc, { locale }) => `/preview?collection=${slug}&id=${doc.id}&locale=${locale}`,
    },
    access: {
      create: (args) => cms.modules[slug] && contentAccess.create(args),
      read: (args) => (cms.modules[slug] ? contentAccess.read(args) : false),
      update: (args) => cms.modules[slug] && contentAccess.update(args),
      delete: (args) => cms.modules[slug] && contentAccess.delete(args),
      readVersions: (args) => cms.modules[slug] && contentAccess.readVersions(args),
    },
    versions: { drafts: true, maxPerDoc: 20 },
    fields: [
      titleField,
      slugField(),
      { name: 'summary', type: 'textarea', localized: true, required: true },
      { name: 'image', type: 'upload', relationTo: 'media' },
      ...fields,
      { name: 'content', type: 'richText', localized: true },
      { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
      seoField,
    ],
  }
}

export const Services = directory('services', 'Service', [])
export const Projects = directory('projects', 'Project', [
  { name: 'location', type: 'text', localized: true },
  {
    name: 'sector',
    type: 'select',
    options: ['residential', 'commercial', 'hospitality', 'office', 'mixed-use', 'other'],
  },
  {
    name: 'projectStatus',
    type: 'select',
    defaultValue: 'planned',
    options: ['planned', 'in-progress', 'completed'],
  },
  {
    name: 'gallery',
    type: 'array',
    fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
  },
])
export const Companies = directory('companies', 'Company', [
  { name: 'sector', type: 'text', localized: true },
  { name: 'website', type: 'text', validate: validateHref },
])
export const Team = directory('team', 'Team member', [
  { name: 'position', type: 'text', localized: true, required: true },
])
