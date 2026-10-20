import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { isLocale } from '@/cms.config'
import { contentPath, getCMS, isContentSlug } from '@/lib/content'

export async function GET(request: NextRequest) {
  const payload = await getCMS()
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return new Response('Sign in to the CMS before previewing drafts.', { status: 401 })
  const collection = request.nextUrl.searchParams.get('collection') || ''
  const locale = request.nextUrl.searchParams.get('locale') || 'en'
  const id = Number(request.nextUrl.searchParams.get('id'))
  if (!isContentSlug(collection) || !isLocale(locale) || !Number.isSafeInteger(id) || id < 1) {
    return new Response('Invalid preview request.', { status: 400 })
  }
  const { docs } = await payload.find({
    collection,
    where: { id: { equals: id } },
    locale,
    user,
    draft: true,
    overrideAccess: false,
    limit: 1,
    depth: 0,
  })
  if (!docs[0]) return new Response('Document not found.', { status: 404 })
  ;(await draftMode()).enable()
  // Build the redirect from validated content, never an arbitrary URL parameter.
  return NextResponse.redirect(new URL(contentPath(collection, docs[0].slug, locale), request.url))
}
