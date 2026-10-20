import type { Payload } from 'payload'
import type { User } from '@/payload-types'
import Link from 'next/link'
import { canEdit } from '@/access'
import { cms } from '@/cms.config'

export async function Overview({ payload, user }: { payload: Payload; user: User | null }) {
  if (!user) return null
  const [pages, articles, media, recent] = await Promise.all([
    payload.count({ collection: 'pages', overrideAccess: false, user }),
    payload.count({ collection: 'posts', overrideAccess: false, user }),
    payload.count({ collection: 'media', overrideAccess: false, user }),
    payload.find({
      collection: 'pages',
      limit: 4,
      sort: '-updatedAt',
      overrideAccess: false,
      user,
      draft: true,
      depth: 0,
    }),
  ])
  const writable = canEdit(user)
  return (
    <section className="common-overview">
      <div className="common-heading">
        <div>
          <p className="common-eyebrow">YOUR WEBSITE, ALL TOGETHER</p>
          <h1>Make room for what’s next.</h1>
          <p>Welcome back, {user.name}. Your content starts here.</p>
        </div>
        <Link
          className="common-secondary"
          href={`/${cms.defaultLocale}`}
          target="_blank"
          rel="noreferrer"
        >
          View website ↗
        </Link>
      </div>
      <div className="common-dashboard-grid">
        <div className="common-editorial-card">
          <div>
            <span className="common-pill">THE WORKSPACE</span>
            <h2>
              Good stories
              <br />
              start with a page.
            </h2>
            <p>
              Build your pages, bring your ideas to life,
              <br />
              and publish when they’re ready.
            </p>
          </div>
          <Link
            className="common-primary"
            href={writable ? '/admin/collections/pages/create' : '/admin/collections/pages'}
          >
            {writable ? 'Create a page' : 'Explore pages'} <span aria-hidden="true">↗</span>
          </Link>
          <div className="common-shape" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="common-stats">
          {[
            ['Pages', pages.totalDocs, 'pages'],
            ['Articles', articles.totalDocs, 'posts'],
            ['Media assets', media.totalDocs, 'media'],
          ].map(([label, count, collection], i) => (
            <Link className="common-stat" key={label} href={`/admin/collections/${collection}`}>
              <div>
                <span className="common-stat-index">0{i + 1}</span>
                <span>{label}</span>
              </div>
              <strong>{count}</strong>
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="common-lower-grid">
        <div className="common-recent">
          <div className="common-section-heading">
            <h2>Recently edited</h2>
            <Link href="/admin/collections/pages">All pages ↗</Link>
          </div>
          {recent.docs.length ? (
            <ul>
              {recent.docs.map((page) => (
                <li key={page.id}>
                  <Link href={`/admin/collections/pages/${page.id}`}>
                    <span className="common-file" aria-hidden="true">
                      ▤
                    </span>
                    <span>
                      {page.title || 'Untitled page'}
                      <small>/{page.slug}</small>
                    </span>
                    <span className={`common-status ${page._status}`}>{page._status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="common-empty">Your first page belongs here. Create one to get started.</p>
          )}
        </div>
        <aside className="common-note">
          <span className="common-eyebrow">BUILT TO BE YOURS</span>
          <h2>
            One foundation.
            <br />
            Endless possibilities.
          </h2>
          <p>
            English and Arabic. Flexible sections. A familiar place for every website you build.
          </p>
          <Link href="/admin/globals/navigation">Shape your navigation ↗</Link>
        </aside>
      </div>
      <div className="common-section-heading common-collections">
        <h2>Explore your workspace</h2>
        <span>Everything in its place</span>
      </div>
    </section>
  )
}
