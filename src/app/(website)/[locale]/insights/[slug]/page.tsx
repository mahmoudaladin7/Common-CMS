import { notFound } from 'next/navigation'
import { isLocale } from '@/cms.config'
import { getDocument } from '@/lib/content'
import { documentMetadata } from '@/lib/metadata'
import { Document } from '@/components/website/Document'

type Props = { params: Promise<{ locale: string; slug: string }> }
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const doc = await getDocument('posts', slug, locale)
  return doc ? documentMetadata(doc, 'posts', locale) : { title: 'Not found' }
}
export default async function Page({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  return <Document collection="posts" slug={slug} locale={locale} />
}
