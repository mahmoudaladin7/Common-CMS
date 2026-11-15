import Link from 'next/link'
import { cookies } from 'next/headers'
import type { ServerProps } from 'payload'
import { isAdmin } from '@/access'
import { relationID } from '@/access/tenancy'
import { WorkspaceSelection } from './DashboardControls'
import { BlogIcon, EyeIcon, PlusIcon } from './DashboardIcons'

export async function BlogGuide({ payload, user, i18n, locale }: ServerProps) {
  if (!user) return null
  const ar = i18n.language === 'ar'
  const t = (en: string, arabic: string) => (ar ? arabic : en)
  const sites = await payload.find({
    collection: 'websites',
    user,
    overrideAccess: false,
    locale: locale?.code === 'ar' ? 'ar' : 'en',
    depth: 0,
    limit: 100,
    sort: 'createdAt',
  })
  const selected = Number((await cookies()).get('payload-tenant')?.value)
  const site = sites.docs.find((site) => site.id === selected) || sites.docs[0]
  const role = user.tenants?.find((row) => relationID(row.tenant) === site?.id)?.role
  const writable = Boolean(site && (isAdmin(user) || role === 'admin' || role === 'editor'))
  const [all, published] = site
    ? await Promise.all([
        payload.count({
          collection: 'posts',
          user,
          overrideAccess: false,
          context: { websiteID: site.id },
        }),
        payload.count({
          collection: 'posts',
          user,
          overrideAccess: false,
          context: { websiteID: site.id },
          where: { _status: { equals: 'published' } },
        }),
      ])
    : [null, null]
  return (
    <section className="common-guide common-blog-guide" dir={ar ? 'rtl' : 'ltr'}>
      <WorkspaceSelection id={site?.id} />
      <div className="common-guide-heading">
        <div>
          <span className="common-guide-icon">
            <BlogIcon />
          </span>
          <p>
            {site?.name || t('Choose a website in the sidebar', 'اختر موقعاً من القائمة الجانبية')}
          </p>
          <h2>{t('A good story starts here.', 'القصة المميزة تبدأ هنا.')}</h2>
          <p>
            {t(
              'Write in your own words. Preview it on your website. Publish when it feels right.',
              'اكتب بأسلوبك وعاين المقالة على موقعك ثم انشرها عندما تكون جاهزة.',
            )}
          </p>
        </div>
        <div className="common-guide-actions">
          {writable && (
            <Link
              className="common-button common-button--blue"
              href="/admin/collections/posts/create"
            >
              <PlusIcon />
              {t('Write a blog post', 'كتابة مقالة')}
            </Link>
          )}
          {site && (
            <Link
              className="common-button common-button--light"
              href={`/preview?website=${site.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <EyeIcon />
              {t('Preview website', 'معاينة الموقع')}
            </Link>
          )}
        </div>
      </div>
      <ol className="common-writing-steps">
        <li>
          <span>1</span>
          <div>
            <strong>{t('Write & save', 'اكتب واحفظ')}</strong>
            <p>{t('Drafts stay private to your team.', 'المسودات متاحة لفريقك فقط.')}</p>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>{t('Check both languages', 'راجع اللغتين')}</strong>
            <p>{t('Use Locale for English and Arabic.', 'اختر اللغة لكتابة المحتوى باللغتين.')}</p>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>{t('Preview & publish', 'عاين وانشر')}</strong>
            <p>{t('Publishing makes the post public.', 'النشر يجعل المقالة متاحة للزوار.')}</p>
          </div>
        </li>
      </ol>
      {all && published && (
        <div className="common-blog-summary">
          <span>
            <strong>{all.totalDocs}</strong>
            {t('Total posts', 'كل المقالات')}
          </span>
          <span>
            <strong>{published.totalDocs}</strong>
            {t('Published', 'منشور')}
          </span>
          <span>
            <strong>{all.totalDocs - published.totalDocs}</strong>
            {t('Unpublished', 'غير منشور')}
          </span>
        </div>
      )}
    </section>
  )
}

export function AccountsGuide({ user, i18n }: ServerProps) {
  if (!isAdmin(user)) return null
  const ar = i18n.language === 'ar'
  return (
    <section className="common-guide" dir={ar ? 'rtl' : 'ltr'}>
      <div className="common-guide-heading">
        <div>
          <p>{ar ? 'فريقك، بصلاحيات واضحة' : 'YOUR TEAM, WITH CLEAR BOUNDARIES'}</p>
          <h2>
            {ar ? 'الحساب المناسب. والصلاحية المناسبة.' : 'The right people. The right access.'}
          </h2>
          <p>
            {ar
              ? 'أنشئ حساباً ثم حدد المواقع ودور المستخدم في كل موقع. يمكنك إيقاف الحساب لإنهاء جلساته دون حذف محتواه.'
              : 'Create an account, assign its websites, then choose a role for each. Suspend an account to end its sessions without deleting its content.'}
          </p>
        </div>
        <Link className="common-button common-button--dark" href="/admin/collections/users/create">
          <PlusIcon />
          {ar ? 'إضافة عضو' : 'Add team member'}
        </Link>
      </div>
      <div className="common-permission-guide">
        <span>
          <strong>{ar ? 'مدير الموقع' : 'Website Admin'}</strong>
          {ar ? 'المحتوى والوسائط والإعدادات' : 'Content, media and settings'}
        </span>
        <span>
          <strong>{ar ? 'محرر' : 'Editor'}</strong>
          {ar ? 'كتابة المحتوى ونشره' : 'Write and publish content'}
        </span>
        <span>
          <strong>{ar ? 'مشاهد' : 'Viewer'}</strong>
          {ar ? 'المراجعة والمعاينة فقط' : 'Review and preview only'}
        </span>
      </div>
    </section>
  )
}
