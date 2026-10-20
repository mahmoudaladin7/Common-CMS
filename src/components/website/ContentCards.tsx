import Link from 'next/link'
import type { Locale } from '@/cms.config'
import type { Media } from '@/payload-types'
import { contentPath, type ContentSlug } from '@/lib/content'
import { MediaImage } from './MediaImage'

type Card = {
  id: number
  title: string
  slug: string
  summary?: string | null
  excerpt?: string | null
  image?: number | Media | null
}

export function ContentCards({
  docs,
  collection,
  locale,
}: {
  docs: Card[]
  collection: ContentSlug
  locale: Locale
}) {
  if (!docs.length)
    return (
      <p className="empty">
        {locale === 'ar' ? 'لا يوجد محتوى منشور حتى الآن.' : 'No published entries yet.'}
      </p>
    )
  return (
    <div className="content-grid">
      {docs.map((doc, index) => (
        <Link
          key={doc.id}
          className="content-card"
          href={contentPath(collection, doc.slug, locale)}
        >
          <MediaImage media={doc.image} />
          <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
          <h3>
            {doc.title}
            <span aria-hidden="true">↗</span>
          </h3>
          <p>{doc.summary || doc.excerpt}</p>
        </Link>
      ))}
    </div>
  )
}
