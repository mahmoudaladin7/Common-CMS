import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale } from '@/cms.config'
import { getDocument } from '@/lib/content'
import { documentMetadata } from '@/lib/metadata'
import { Blocks } from '@/components/website/Blocks'

type Props = { params: Promise<{ locale: string; slug?: string[] }> }
async function read(params: Props['params']) {
  const { locale, slug } = await params
  if (!isLocale(locale) || (slug && slug.length > 1)) notFound()
  return { locale, slug: slug?.[0] || 'home' }
}
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await read(params)
  const doc = await getDocument('pages', slug, locale)
  return doc
    ? documentMetadata(doc, 'pages', locale)
    : { title: 'Common CMS', robots: { index: false } }
}
export default async function Page({ params }: Props) {
  const { locale, slug } = await read(params)
  const page = await getDocument('pages', slug, locale)
  if (!page) {
    if (slug !== 'home') notFound()
    return (
      <section className="section empty-home">
        <p className="eyebrow">COMMON CMS</p>
        <h1>{locale === 'ar' ? 'مساحة لموقعك القادم.' : 'A place for your next website.'}</h1>
        <p>
          {locale === 'ar'
            ? 'أنشئ صفحة بعنوان home وانشرها لتظهر هنا.'
            : 'Create and publish a page with the slug “home” to bring this space to life.'}
        </p>
        <Link className="button" href="/admin">
          {locale === 'ar' ? 'فتح لوحة الإدارة' : 'Open your workspace'} ↗
        </Link>
      </section>
    )
  }
  if (!('layout' in page)) notFound()
  return <Blocks blocks={page.layout} locale={locale} />
}
