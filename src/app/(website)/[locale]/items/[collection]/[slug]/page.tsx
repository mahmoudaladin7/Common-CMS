import { notFound } from 'next/navigation'
import { isLocale } from '@/cms.config'
import { getDocument, isContentSlug } from '@/lib/content'
import { documentMetadata } from '@/lib/metadata'
import { Document } from '@/components/website/Document'

type Props = { params: Promise<{ locale: string; collection: string; slug: string }> }
async function read(params: Props['params']) {
  const { locale, collection, slug } = await params
  if (
    !isLocale(locale) ||
    !isContentSlug(collection) ||
    collection === 'pages' ||
    collection === 'posts'
  )
    notFound()
  return { locale, collection, slug }
}
export async function generateMetadata({ params }: Props) {
  const { locale, collection, slug } = await read(params)
  const doc = await getDocument(collection, slug, locale)
  return doc ? documentMetadata(doc, collection, locale) : { title: 'Not found' }
}
export default async function Page({ params }: Props) {
  const args = await read(params)
  return <Document {...args} />
}
