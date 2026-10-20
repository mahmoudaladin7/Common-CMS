'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/cms.config'

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const target = locale === 'ar' ? 'en' : 'ar'
  const href = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${target}`)
  return (
    <Link className="language-switch" href={href} hrefLang={target} lang={target}>
      {target === 'ar' ? 'العربية' : 'English'}
    </Link>
  )
}
