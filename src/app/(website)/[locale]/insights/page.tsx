import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale } from '@/cms.config'
import { getCMS, getReadContext } from '@/lib/content'
import { ContentCards } from '@/components/website/ContentCards'

export default async function Articles({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const page = Number((await searchParams).page || 1)
  if (!Number.isSafeInteger(page) || page < 1) notFound()
  const [payload, context] = await Promise.all([getCMS(), getReadContext(locale)])
  const result = await payload.find({
    collection: 'posts',
    ...context,
    sort: '-publishedAt',
    limit: 9,
    page,
    depth: 1,
  })
  return (
    <section className="section">
      <p className="eyebrow">{locale === 'ar' ? 'أفكار تستحق المشاركة' : 'IDEAS WORTH SHARING'}</p>
      <h1>{locale === 'ar' ? 'الأخبار والمقالات' : 'News & insights'}</h1>
      <ContentCards docs={result.docs} collection="posts" locale={locale} />
      <nav className="pagination" aria-label={locale === 'ar' ? 'صفحات المقالات' : 'Article pages'}>
        {result.hasPrevPage ? (
          <Link href={`?page=${page - 1}`}>{locale === 'ar' ? 'السابق' : 'Previous'}</Link>
        ) : null}
        <span>
          {page} / {Math.max(1, result.totalPages)}
        </span>
        {result.hasNextPage ? (
          <Link href={`?page=${page + 1}`}>{locale === 'ar' ? 'التالي' : 'Next'}</Link>
        ) : null}
      </nav>
    </section>
  )
}
