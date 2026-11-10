import type { AdminViewServerProps } from 'payload'
import Link from 'next/link'
import { Gutter } from '@payloadcms/ui'
import { cookies } from 'next/headers'
import { isAdmin } from '@/access'
import { relationID } from '@/access/tenancy'
import { WebsiteCards } from './DashboardControls'
import {
  Arrow,
  BlogIcon,
  EyeIcon,
  Globe,
  MediaIcon,
  PageIcon,
  PlusIcon,
  SettingsIcon,
} from './DashboardIcons'

export async function Overview({ payload, user, i18n, locale }: AdminViewServerProps) {
  if (!user) return null
  const ar = i18n.language === 'ar'
  const lang = ar ? 'ar' : 'en'
  const contentLocale = locale?.code === 'ar' ? 'ar' : 'en'
  const t = (en: string, arabic: string) => (ar ? arabic : en)
  const websites = await payload.find({
    collection: 'websites',
    user,
    overrideAccess: false,
    locale: contentLocale,
    depth: 0,
    limit: 100,
    sort: 'createdAt',
  })
  const requested = Number((await cookies()).get('payload-tenant')?.value)
  const selected = websites.docs.find((site) => site.id === requested) || websites.docs[0]
  const context = { websiteID: selected?.id }
  const [pages, posts, media, drafts, recent] = selected
    ? await Promise.all([
        payload.count({ collection: 'pages', user, context, overrideAccess: false }),
        payload.count({ collection: 'posts', user, context, overrideAccess: false }),
        payload.count({ collection: 'media', user, context, overrideAccess: false }),
        payload.count({
          collection: 'pages',
          user,
          context,
          overrideAccess: false,
          where: { _status: { equals: 'draft' } },
        }),
        payload.find({
          collection: 'pages',
          user,
          context,
          overrideAccess: false,
          locale: contentLocale,
          limit: 4,
          depth: 0,
          sort: '-updatedAt',
          draft: true,
        }),
      ])
    : [null, null, null, null, null]
  const role = user.tenants?.find((row) => relationID(row.tenant) === selected?.id)?.role
  const writable = isAdmin(user) || role === 'admin' || role === 'editor'
  const settings = isAdmin(user) || role === 'admin'
  const tools = [
    {
      slug: 'pages',
      name: t('Pages', 'الصفحات'),
      description: t('Shape your website', 'شكّل محتوى موقعك'),
      icon: <PageIcon />,
      count: pages?.totalDocs,
    },
    {
      slug: 'posts',
      name: t('Blogs', 'المدونة'),
      description: t('Tell your next story', 'شارك قصتك القادمة'),
      icon: <BlogIcon />,
      count: posts?.totalDocs,
    },
    {
      slug: 'media',
      name: t('Media', 'الوسائط'),
      description: t('A home for your assets', 'مكان لصورك وملفاتك'),
      icon: <MediaIcon />,
      count: media?.totalDocs,
    },
  ]
  return (
    <Gutter>
      <section className="common-dashboard" dir={ar ? 'rtl' : 'ltr'}>
        <div className="common-topline">
          <span>{t('YOUR WORKSPACE', 'مساحة عملك')}</span>
          <time dateTime={new Date().toISOString()}>
            {new Intl.DateTimeFormat(lang, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              timeZone: 'Asia/Riyadh',
            }).format(new Date())}
          </time>
        </div>
        <header className="common-hero">
          <div>
            <p className="common-greeting">
              {t('Welcome back', 'مرحباً بعودتك')}, {user.name.split(' ')[0]}.
            </p>
            <h1>{t('Everything in one place.', 'كل شيء في مكان واحد.')}</h1>
            <p className="common-intro">
              {t(
                'Your websites. Your stories. A little more room to create.',
                'مواقعك وقصصك. ومساحة أكبر للإبداع.',
              )}
            </p>
          </div>
          {isAdmin(user) && (
            <Link
              className="common-button common-button--dark"
              href="/admin/collections/websites/create"
            >
              <PlusIcon />
              {t('Add website', 'إضافة موقع')}
            </Link>
          )}
        </header>
        <nav
          className="common-section-nav"
          aria-label={t('Dashboard sections', 'أقسام لوحة التحكم')}
        >
          <a href="#your-websites" className="is-active">
            {t('Your websites', 'مواقعك')}
            <span>{websites.totalDocs}</span>
          </a>
          <a href="#website-workspace">{t('Workspace', 'مساحة العمل')}</a>
          <a href="#recent-activity">{t('Recent activity', 'النشاط الأخير')}</a>
        </nav>
        <section id="your-websites" className="common-site-section" aria-labelledby="sites-heading">
          <div className="common-section-title">
            <h2 id="sites-heading">
              {t('Your websites', 'مواقعك')}
              <span className="common-count">{websites.totalDocs}</span>
            </h2>
            <span className="common-section-hint">
              {t('One space. Every possibility.', 'مساحة واحدة. إمكانات واسعة.')}
            </span>
          </div>
          <WebsiteCards
            ar={ar}
            selected={selected?.id}
            websites={websites.docs.map((site) => ({
              id: site.id,
              name: site.name,
              domain: site.domain,
              role: isAdmin(user)
                ? t('Super Admin', 'مدير المنصة')
                : {
                    admin: t('Website Admin', 'مدير الموقع'),
                    editor: t('Editor', 'محرر'),
                    viewer: t('Viewer', 'مشاهد'),
                  }[
                    user.tenants?.find((row) => relationID(row.tenant) === site.id)?.role ||
                      'viewer'
                  ],
            }))}
          />
        </section>
        {selected && (
          <>
            <section
              id="website-workspace"
              className="common-workspace"
              aria-labelledby="workspace-heading"
            >
              <div className="common-workspace-header">
                <div className="common-workspace-identity">
                  <span className="common-icon-tile">
                    <Globe />
                  </span>
                  <div>
                    <p>{t('CURRENT WORKSPACE', 'مساحة العمل الحالية')}</p>
                    <h2 id="workspace-heading">{selected.name}</h2>
                  </div>
                </div>
                <Link
                  className="common-button common-button--light"
                  href={`/preview?website=${selected.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <EyeIcon />
                  {t('Preview website', 'معاينة الموقع')}
                  <span className="common-external" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </div>
              <div className="common-tool-grid">
                {tools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/admin/collections/${tool.slug}`}
                    className="common-tool"
                  >
                    <span className={`common-tool-icon common-tool-icon--${tool.slug}`}>
                      {tool.icon}
                    </span>
                    <span className="common-tool-count">{tool.count}</span>
                    <h3>{tool.name}</h3>
                    <p>{tool.description}</p>
                    <Arrow />
                  </Link>
                ))}
                {settings && (
                  <Link href="/admin/collections/site-settings" className="common-tool">
                    <span className="common-tool-icon common-tool-icon--settings">
                      <SettingsIcon />
                    </span>
                    <h3>{t('Settings', 'الإعدادات')}</h3>
                    <p>{t('Make it feel like you', 'تفاصيل تعبّر عنك')}</p>
                    <Arrow />
                  </Link>
                )}
              </div>
            </section>
            <div className="common-bottom-grid">
              <section
                id="recent-activity"
                className="common-recent"
                aria-labelledby="recent-heading"
              >
                <div className="common-section-title">
                  <h2 id="recent-heading">
                    {t('Pick up where you left off', 'واصل من حيث توقفت')}
                  </h2>
                  <Link href="/admin/collections/pages">
                    {t('All pages', 'كل الصفحات')}
                    <Arrow />
                  </Link>
                </div>
                <p className="common-card-subtitle">
                  {t('The latest pages in your workspace.', 'آخر الصفحات في مساحة عملك.')}
                </p>
                {recent?.docs.length ? (
                  <ul className="common-activity-list">
                    {recent.docs.map((page) => (
                      <li key={page.id}>
                        <Link href={`/admin/collections/pages/${page.id}`}>
                          <span className="common-document-icon">
                            <PageIcon />
                          </span>
                          <span className="common-activity-name">
                            <strong>{page.title || t('Untitled page', 'صفحة بدون عنوان')}</strong>
                            <span>
                              <bdi>/{page.slug}</bdi>
                              <span>·</span>
                              {new Intl.DateTimeFormat(lang, {
                                month: 'short',
                                day: 'numeric',
                                timeZone: 'Asia/Riyadh',
                              }).format(new Date(page.updatedAt))}
                            </span>
                          </span>
                          <span className={`common-status common-status--${page._status}`}>
                            <i />
                            {page._status === 'published'
                              ? t('Published', 'منشور')
                              : t('Draft', 'مسودة')}
                          </span>
                          <Arrow />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="common-empty">
                    <PageIcon />
                    <h3>{t('A fresh start.', 'بداية جديدة.')}</h3>
                    <p>
                      {t(
                        'Your pages will appear here as you create them.',
                        'ستظهر صفحاتك هنا عندما تبدأ بإنشائها.',
                      )}
                    </p>
                  </div>
                )}
              </section>
              <aside className="common-create-card">
                <span className="common-create-icon">
                  <PlusIcon />
                </span>
                <p className="common-eyebrow">{t('MAKE SOMETHING GREAT', 'اصنع شيئاً مميزاً')}</p>
                <h2>
                  {writable
                    ? t('Your next chapter starts here.', 'فصلك القادم يبدأ هنا.')
                    : t('A fresh perspective starts here.', 'رؤية جديدة تبدأ هنا.')}
                </h2>
                <p>
                  {writable
                    ? t(
                        'A new idea, an updated page, a story worth sharing. Bring it to life.',
                        'فكرة جديدة، أو صفحة محدثة، أو قصة تستحق المشاركة. امنحها الحياة.',
                      )
                    : t(
                        'Explore your website’s content and preview what comes next.',
                        'تصفّح محتوى موقعك وعاين ما يأتي بعد.',
                      )}
                </p>
                <Link
                  className="common-button common-button--blue"
                  href={
                    writable ? '/admin/collections/pages/create' : `/preview?website=${selected.id}`
                  }
                >
                  {writable
                    ? t('Create a page', 'إنشاء صفحة')
                    : t('Preview website', 'معاينة الموقع')}
                  <Arrow />
                </Link>
                {Boolean(drafts?.totalDocs) && (
                  <span className="common-draft-note">
                    {new Intl.NumberFormat(lang).format(drafts!.totalDocs)}{' '}
                    {t('draft pages in this workspace', 'صفحات مسودة في مساحة العمل')}
                  </span>
                )}
              </aside>
            </div>
          </>
        )}
        <footer className="common-dashboard-footer">
          <span>
            Common<span className="common-footer-dot">•</span>CMS
          </span>
          <span>
            {t('A little structure. A lot of possibility.', 'هيكل واضح. وإمكانات واسعة.')}
          </span>
          <Link href="/admin/account">
            {t('Your account', 'حسابك')}
            <Arrow />
          </Link>
        </footer>
      </section>
    </Gutter>
  )
}
