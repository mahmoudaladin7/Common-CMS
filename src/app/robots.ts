import type { MetadataRoute } from 'next'
import { getReadContext } from '@/lib/content'
import { cms } from '@/cms.config'
export const dynamic = 'force-dynamic'
export default async function robots(): Promise<MetadataRoute.Robots> {
  const context = await getReadContext(cms.defaultLocale)
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/preview', '/exit-preview'],
    },
    sitemap: `${context.websiteURL}/sitemap.xml`,
  }
}
