import type { MetadataRoute } from 'next'
import { cms } from '@/cms.config'
import { contentSlugs, contentPath, getCMS, getReadContext } from '@/lib/content'

export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getCMS()
  const context = await getReadContext(cms.defaultLocale)
  const base = context.websiteURL
  const entries: MetadataRoute.Sitemap = []
  for (const collection of contentSlugs) {
    let page = 1
    let more = true
    while (more) {
      const result = await payload.find({
        collection,
        ...context,
        user: null,
        draft: false,
        where: { 'seo.noIndex': { not_equals: true } },
        depth: 0,
        limit: 100,
        page,
      })
      for (const doc of result.docs)
        for (const locale of cms.locales) {
          entries.push({
            url: `${base}${contentPath(collection, doc.slug, locale.code)}`,
            lastModified: doc.updatedAt,
          })
        }
      more = result.hasNextPage
      page++
    }
  }
  return entries
}
