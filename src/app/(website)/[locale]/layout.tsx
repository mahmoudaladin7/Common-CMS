import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale } from '@/cms.config'
import { getCMS, getReadContext } from '@/lib/content'
import { localizedHref } from '@/lib/validation'
import { BrandIcon } from '@/components/admin/Brand'
import { MediaImage } from '@/components/website/MediaImage'
import { LanguageSwitch } from '@/components/website/LanguageSwitch'
import './website.css'

export const dynamic = 'force-dynamic'

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const payload = await getCMS()
  const [settings, navigation, context] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', locale, overrideAccess: false }),
    payload.findGlobal({ slug: 'navigation', locale, overrideAccess: false }),
    getReadContext(locale),
  ])
  const ar = locale === 'ar'
  return (
    <html lang={locale} dir={ar ? 'rtl' : 'ltr'} data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          {ar ? 'انتقل إلى المحتوى' : 'Skip to content'}
        </a>
        {context.draft ? (
          <div className="preview-banner" role="status">
            {ar ? 'معاينة المسودة — مرئية لفريقك فقط' : 'Draft preview — visible to your team only'}
            <a href="/exit-preview">{ar ? 'إنهاء المعاينة' : 'Exit preview'}</a>
          </div>
        ) : null}
        <header className="site-header">
          <Link className="site-brand" href={`/${locale}`}>
            {settings.logo ? <MediaImage media={settings.logo} /> : <BrandIcon />}
            <span>{settings.siteName || 'Common'}</span>
          </Link>
          <nav aria-label={ar ? 'القائمة الرئيسية' : 'Main menu'}>
            {navigation.main?.map((link, i) => (
              <Link key={link.id || i} href={localizedHref(link.href, locale)}>
                {link.label}
              </Link>
            ))}
          </nav>
          <LanguageSwitch locale={locale} />
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div>
            <strong>{settings.siteName || 'Common'}</strong>
            <p>{settings.tagline}</p>
            {settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : null}
            {settings.phone ? <p dir="ltr">{settings.phone}</p> : null}
            {settings.address ? <p>{settings.address}</p> : null}
          </div>
          <div className="footer-links">
            {navigation.footer?.map((link, i) => (
              <Link key={link.id || i} href={localizedHref(link.href, locale)}>
                {link.label}
              </Link>
            ))}
            {settings.socialLinks?.map((link, i) => (
              <a key={link.id || i} href={localizedHref(link.href, locale)}>
                {link.label}
              </a>
            ))}
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} {settings.siteName}
            </span>
            <Link href="/admin">{ar ? 'إدارة المحتوى' : 'Content workspace'} ↗</Link>
          </div>
        </footer>
      </body>
    </html>
  )
}
