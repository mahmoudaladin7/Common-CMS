import type { Metadata } from 'next'
import type { Media } from '@/payload-types'
import type { Locale } from '@/cms.config'
import { cms } from '@/cms.config'
import { contentPath, getCMS, getReadContext, type ContentSlug } from '@/lib/content'

type MetadataDocument = {
  title: string
  slug: string
  seo?: {
    title?: string | null
    description?: string | null
    image?: number | Media | null
    noIndex?: boolean | null
  }
}

export async function documentMetadata(
  doc: MetadataDocument,
  collection: ContentSlug,
  locale: Locale,
): Promise<Metadata> {
  const [payload, context] = await Promise.all([getCMS(), getReadContext(locale)])
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    locale,
    overrideAccess: false,
    depth: 1,
  })
  const title = doc.seo?.title || `${doc.title} · ${settings.siteName}`
  const description = doc.seo?.description || settings.defaultDescription || undefined
  const image = doc.seo?.image || settings.defaultImage
  return {
    title,
    description,
    metadataBase: new URL(process.env.SERVER_URL || 'http://localhost:3000'),
    alternates: {
      canonical: contentPath(collection, doc.slug, locale),
      languages: Object.fromEntries(
        cms.locales.map(({ code }) => [code, contentPath(collection, doc.slug, code)]),
      ),
    },
    robots: context.draft || doc.seo?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      images:
        typeof image === 'object' && image?.url ? [{ url: image.url, alt: image.alt }] : undefined,
    },
  }
}
