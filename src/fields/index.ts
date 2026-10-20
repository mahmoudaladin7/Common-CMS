import type { Field } from 'payload'
import { slugify, validateHref, validateSlug } from '@/lib/validation'

export const titleField: Field = { name: 'title', type: 'text', localized: true, required: true }

export const slugField = (page = false): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: page
      ? 'Shared across languages. Use “home” for the homepage.'
      : 'A stable address shared across languages.',
  },
  hooks: {
    beforeValidate: [
      ({ value, siblingData }) => value || slugify(String(siblingData?.title || '')),
    ],
  },
  validate: (value: unknown) => validateSlug(value, page),
})

export const seoField: Field = {
  name: 'seo',
  label: 'Search & social',
  type: 'group',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      maxLength: 70,
      admin: { description: 'Optional title shown in search results.' },
    },
    { name: 'description', type: 'textarea', localized: true, maxLength: 180 },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'noIndex', type: 'checkbox', defaultValue: false, label: 'Hide from search engines' },
  ],
}

export const linkFields: Field[] = [
  { name: 'label', type: 'text', localized: true, required: true },
  {
    name: 'href',
    type: 'text',
    required: true,
    validate: validateHref,
    admin: { description: 'For example /about or https://example.com' },
  },
]
