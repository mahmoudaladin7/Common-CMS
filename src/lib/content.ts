import { cache } from 'react'
import { draftMode, headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cms, type Locale } from '@/cms.config'
import type { DirectorySlug } from '@/collections/Directory'

export const getCMS = cache(() => getPayload({ config }))
export const directorySlugs = Object.entries(cms.modules)
  .filter(([, enabled]) => enabled)
  .map(([slug]) => slug as DirectorySlug)
export const contentSlugs = ['pages', 'posts', ...directorySlugs] as const
export type ContentSlug = (typeof contentSlugs)[number]
export const isContentSlug = (slug: string): slug is ContentSlug =>
  (contentSlugs as readonly string[]).includes(slug)

/**
 * Local API bypasses access control by default. Every website query deliberately
 * opts back in. A draft cookie alone is insufficient: a live session is required.
 */
export const getReadContext = cache(async (locale: Locale) => {
  const payload = await getCMS()
  const previewRequested = (await draftMode()).isEnabled
  const user = previewRequested ? (await payload.auth({ headers: await headers() })).user : null
  return { locale, user, draft: Boolean(user && previewRequested), overrideAccess: false as const }
})

export const getDocument = cache(async (collection: ContentSlug, slug: string, locale: Locale) => {
  const [payload, context] = await Promise.all([getCMS(), getReadContext(locale)])
  const result = await payload.find({
    collection,
    ...context,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return result.docs[0] || null
})

export function contentPath(collection: ContentSlug, slug: string, locale: Locale) {
  const segment = encodeURIComponent(slug)
  if (collection === 'pages') return `/${locale}${slug === 'home' ? '' : `/${segment}`}`
  if (collection === 'posts') return `/${locale}/insights/${segment}`
  return `/${locale}/items/${collection}/${segment}`
}
