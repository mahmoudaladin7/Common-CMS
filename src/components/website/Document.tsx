import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getDocument, type ContentSlug } from '@/lib/content'
import type { Locale } from '@/cms.config'
import { isSafeHref } from '@/lib/validation'
import { MediaImage } from './MediaImage'

export async function Document({
  collection,
  slug,
  locale,
}: {
  collection: ContentSlug
  slug: string
  locale: Locale
}) {
  const doc = await getDocument(collection, slug, locale)
  if (!doc) notFound()
  return (
    <article className="section document">
      <Link
        className="text-link"
        href={collection === 'posts' ? `/${locale}/insights` : `/${locale}`}
      >
        ← {locale === 'ar' ? 'عودة' : 'Back'}
      </Link>
      <p className="eyebrow">{'category' in doc ? doc.category : collection}</p>
      <h1>{doc.title}</h1>
      {'position' in doc ? <p className="document-intro">{doc.position}</p> : null}
      <p className="document-intro">
        {'excerpt' in doc ? doc.excerpt : 'summary' in doc ? doc.summary : ''}
      </p>
      {'publishedAt' in doc && doc.publishedAt ? (
        <p className="document-byline">
          {doc.authorName} ·{' '}
          {new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
            new Date(doc.publishedAt),
          )}
        </p>
      ) : null}
      {'location' in doc && doc.location ? <p>{doc.location}</p> : null}
      {'image' in doc ? <MediaImage className="document-image" media={doc.image} eager /> : null}
      {'content' in doc && doc.content ? (
        <div className="prose">
          <RichText data={doc.content} />
        </div>
      ) : null}
      {'website' in doc && doc.website && isSafeHref(doc.website) ? (
        <a className="button" href={doc.website}>
          {locale === 'ar' ? 'زيارة الموقع' : 'Visit website'} ↗
        </a>
      ) : null}
      {'gallery' in doc ? (
        <div className="content-grid">
          {doc.gallery?.map((item, i) => (
            <MediaImage key={item.id || i} media={item.image} />
          ))}
        </div>
      ) : null}
    </article>
  )
}
