import type { Block } from 'payload'
import { cms } from '@/cms.config'
import { linkFields } from '@/fields'

const Hero: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'links', type: 'array', maxRows: 2, fields: linkFields },
  ],
}

const RichContent: Block = {
  slug: 'richContent',
  labels: { singular: 'Rich content', plural: 'Rich content' },
  fields: [{ name: 'content', type: 'richText', localized: true, required: true }],
}

const FeatureGrid: Block = {
  slug: 'featureGrid',
  fields: [
    { name: 'heading', type: 'text', localized: true },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 12,
      fields: [
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'description', type: 'textarea', localized: true, required: true },
      ],
    },
  ],
}

const Stats: Block = {
  slug: 'stats',
  labels: { singular: 'Statistics', plural: 'Statistics' },
  fields: [
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'text', required: true, localized: true },
        { name: 'label', type: 'text', required: true, localized: true },
      ],
    },
  ],
}

const CallToAction: Block = {
  slug: 'callToAction',
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'link', type: 'group', fields: linkFields },
  ],
}

const CollectionGrid: Block = {
  slug: 'collectionGrid',
  labels: { singular: 'Content collection', plural: 'Content collections' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    {
      name: 'collection',
      type: 'select',
      required: true,
      options: [
        { label: 'Articles', value: 'posts' },
        ...Object.entries(cms.modules)
          .filter(([, enabled]) => enabled)
          .map(([value]) => ({
            label: value[0].toUpperCase() + value.slice(1),
            value,
          })),
      ],
    },
    { name: 'limit', type: 'number', min: 1, max: 12, defaultValue: 3, required: true },
  ],
}

// A block's schema and its renderer form its public contract. Add both together.
export const pageBlocks: Block[] = [
  Hero,
  RichContent,
  FeatureGrid,
  Stats,
  CallToAction,
  CollectionGrid,
]
