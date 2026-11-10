'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client'
import { useRouter } from 'next/navigation'
import { Arrow, Globe } from './DashboardIcons'

type WebsiteCard = { id: number; name: string; domain: string; role: string }
export function WebsiteCards({
  websites,
  selected,
  ar,
}: {
  websites: WebsiteCard[]
  selected?: number
  ar: boolean
}) {
  const [query, setQuery] = useState('')
  const [pendingID, setPendingID] = useState<number>()
  const [pending, startTransition] = useTransition()
  const { setTenant, selectedTenantID } = useTenantSelection()
  const router = useRouter()
  useEffect(() => {
    if (selected && selectedTenantID === undefined) setTenant({ id: selected, refresh: true })
  }, [selected, selectedTenantID, setTenant])
  const visible = websites.filter((site) =>
    `${site.name} ${site.domain}`.toLowerCase().includes(query.toLowerCase()),
  )
  function select(id: number) {
    setPendingID(id)
    setTenant({ id })
    startTransition(() => router.refresh())
    document.getElementById('website-workspace')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    })
  }
  return (
    <>
      <div className="common-site-tools">
        <p>{ar ? 'اختر موقعاً لتبدأ العمل.' : 'Choose a website. Make it yours.'}</p>
        <label className="common-search">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <span className="common-sr-only">{ar ? 'البحث في المواقع' : 'Search websites'}</span>
          <input
            type="search"
            placeholder={ar ? 'ابحث عن موقع' : 'Find a website'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="common-websites" aria-busy={pending}>
        {visible.map((site, index) => (
          <article
            className={`common-website ${selected === site.id ? 'is-selected' : ''}`}
            key={site.id}
          >
            <button
              className={`common-site-preview common-site-preview--${index % 2}`}
              onClick={() => select(site.id)}
              aria-label={`${ar ? 'فتح مساحة عمل' : 'Open workspace for'} ${site.name}`}
            >
              <span className="common-browser-bar" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>{site.domain}</span>
                <Globe />
              </span>
              <span className="common-preview-canvas" aria-hidden="true">
                <span className="common-preview-brand">
                  {site.name}
                  <span>©</span>
                </span>
                <span className="common-preview-heading">
                  {ar ? (
                    <>
                      مساحة جديدة.
                      <br />
                      إمكانات واسعة.
                    </>
                  ) : (
                    <>
                      A new space.
                      <br />A world of possibility.
                    </>
                  )}
                </span>
                <span className="common-preview-line" />
                <span className="common-preview-orb" />
                <span className="common-preview-caption">
                  {ar ? 'مساحة موقعك' : 'YOUR WEBSITE WORKSPACE'}
                </span>
              </span>
              <span className="common-preview-open">
                <Arrow />
              </span>
            </button>
            <div className="common-website-details">
              <div>
                <h3>{site.name}</h3>
                <p dir="ltr">{site.domain}</p>
              </div>
              <span className="common-role">{site.role}</span>
            </div>
            <div className="common-website-bottom">
              <span className={`common-selected-label ${selected === site.id ? 'active' : ''}`}>
                <i />
                {selected === site.id
                  ? ar
                    ? 'مساحة العمل الحالية'
                    : 'Current workspace'
                  : ar
                    ? 'مساحة عمل'
                    : 'Website workspace'}
              </span>
              <button
                className="common-text-button"
                onClick={() => select(site.id)}
                disabled={pending && pendingID === site.id}
              >
                {pending && pendingID === site.id
                  ? ar
                    ? 'جارٍ الفتح…'
                    : 'Opening…'
                  : ar
                    ? 'فتح الموقع'
                    : 'Open workspace'}
                <Arrow />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="common-empty">
          <Globe />
          <h3>{ar ? 'لم يتم العثور على مواقع' : 'No websites found'}</h3>
          <p>
            {query
              ? ar
                ? 'جرّب اسماً أو نطاقاً آخر.'
                : 'Try a different name or domain.'
              : ar
                ? 'ستظهر هنا المواقع المسندة إليك.'
                : 'Your assigned websites will appear here.'}
          </p>
          {query && (
            <button className="common-text-button" onClick={() => setQuery('')}>
              {ar ? 'مسح البحث' : 'Clear search'}
            </button>
          )}
        </div>
      )}
    </>
  )
}
