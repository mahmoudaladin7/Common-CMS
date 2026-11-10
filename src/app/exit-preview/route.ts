import { cookies, draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
export async function GET(request: NextRequest) {
  ;(await draftMode()).disable()
  ;(await cookies()).delete('common-preview-website')
  return NextResponse.redirect(new URL('/en', request.url))
}
