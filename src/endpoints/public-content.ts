import path from 'node:path'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import type { Endpoint, PayloadRequest } from 'payload'
import type { Media, Post } from '@/payload-types'

async function website(req: PayloadRequest) {
  const slug = String(req.routeParams?.website || '')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
  const result = await req.payload.find({
    collection: 'websites',
    overrideAccess: true,
    depth: 0,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] || null
}

function mediaURL(req: PayloadRequest, slug: string, filename: string) {
  return `${req.payload.config.serverURL}/api/public/${encodeURIComponent(slug)}/media/${encodeURIComponent(filename)}`
}
function publicMedia(value: unknown, req: PayloadRequest, slug: string) {
  if (!value || typeof value !== 'object') return null
  const doc = value as Media
  if (!doc.filename) return null
  const display = doc.sizes?.large
  return {
    alt: doc.alt,
    width: display?.width || doc.width,
    height: display?.height || doc.height,
    mimeType: display?.mimeType || doc.mimeType,
    url: mediaURL(req, slug, display?.filename || doc.filename),
  }
}

// Export only the fields a public renderer needs, including safe rich-text data.
function richText(value: unknown, req: PayloadRequest, slug: string): unknown {
  if (!value || typeof value !== 'object') return null
  const node = value as Record<string, unknown>
  if (node.root) return { root: richText(node.root, req, slug) }
  const fields = node.fields as Record<string, unknown> | undefined
  return {
    type: node.type,
    text: node.text,
    format: node.format,
    tag: node.tag,
    listType: node.listType,
    start: node.start,
    ...(fields ? { fields: { url: fields.url, newTab: fields.newTab } } : {}),
    ...(node.type === 'upload' && node.relationTo === 'media'
      ? { media: publicMedia(node.value, req, slug) }
      : {}),
    ...(Array.isArray(node.children)
      ? { children: node.children.map((child) => richText(child, req, slug)) }
      : {}),
  }
}
function post(doc: Post, req: PayloadRequest, slug: string) {
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    category: doc.category,
    authorName: doc.authorName,
    publishedAt: doc.publishedAt,
    updatedAt: doc.updatedAt,
    image: publicMedia(doc.image, req, slug),
    content: richText(doc.content, req, slug),
    seo: {
      title: doc.seo?.title,
      description: doc.seo?.description,
      noIndex: doc.seo?.noIndex,
      image: publicMedia(doc.seo?.image, req, slug),
    },
  }
}
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
export const publicPostsEndpoint: Endpoint = {
  path: '/public/:website/posts',
  method: 'get',
  handler: async (req) => {
    const site = await website(req)
    if (!site) return json({ error: 'Website not found.' }, 404)
    const locale = req.query.locale || 'en'
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 12)
    const slug = req.query.slug
    if (
      !['en', 'ar'].includes(String(locale)) ||
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      (slug !== undefined && (typeof slug !== 'string' || slug.length > 250))
    )
      return json({ error: 'Invalid content query.' }, 400)
    // Never carry a caller's admin session into this public read.
    const result = await req.payload.find({
      collection: 'posts',
      user: null,
      overrideAccess: false,
      context: { websiteID: site.id },
      locale: locale as 'en' | 'ar',
      draft: false,
      depth: 1,
      page,
      limit,
      sort: '-publishedAt',
      where: {
        and: [
          { tenant: { equals: site.id } },
          { _status: { equals: 'published' } },
          ...(slug ? [{ slug: { equals: slug } }] : []),
        ],
      },
    })
    return json({
      docs: result.docs.map((doc) => post(doc, req, site.slug)),
      totalDocs: result.totalDocs,
      page: result.page,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    })
  },
}
export const publicMediaEndpoint: Endpoint = {
  path: '/public/:website/media/:filename',
  method: 'get',
  handler: async (req) => {
    const site = await website(req)
    const filename = String(req.routeParams?.filename || '')
    if (!site || !filename || path.basename(filename) !== filename || filename.includes('\\'))
      return json({ error: 'File not found.' }, 404)
    const result = await req.payload.find({
      collection: 'media',
      user: null,
      overrideAccess: false,
      context: { websiteID: site.id },
      depth: 0,
      limit: 1,
      where: {
        and: [
          { tenant: { equals: site.id } },
          {
            or: [
              { filename: { equals: filename } },
              { 'sizes.thumbnail.filename': { equals: filename } },
              { 'sizes.large.filename': { equals: filename } },
            ],
          },
        ],
      },
    })
    const doc = result.docs[0]
    if (!doc) return json({ error: 'File not found.' }, 404)
    const variant = Object.values(doc.sizes || {}).find((size) => size?.filename === filename)
    const filepath = path.join(
      path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_DIR || './media'),
      filename,
    )
    try {
      const info = await stat(/* turbopackIgnore: true */ filepath)
      if (!info.isFile()) return json({ error: 'File not found.' }, 404)
      return new Response(
        Readable.toWeb(createReadStream(/* turbopackIgnore: true */ filepath)) as ReadableStream,
        {
          headers: {
            'Content-Type': [
              'image/jpeg',
              'image/png',
              'image/webp',
              'image/avif',
              'application/pdf',
            ].includes(variant?.mimeType || doc.mimeType || '')
              ? (variant?.mimeType || doc.mimeType)!
              : 'application/octet-stream',
            'Content-Length': String(info.size),
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'public, max-age=300',
          },
        },
      )
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        return json({ error: 'File not found.' }, 404)
      throw error
    }
  },
}
