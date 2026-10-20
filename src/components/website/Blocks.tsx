import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Page } from '@/payload-types'
import type { Locale } from '@/cms.config'
import { localizedHref } from '@/lib/validation'
import { getCMS, getReadContext, isContentSlug } from '@/lib/content'
import { ContentCards } from './ContentCards'
import { MediaImage } from './MediaImage'

export async function Blocks({ blocks, locale }: { blocks: Page['layout']; locale: Locale }) {
  // Independent collection sections fetch concurrently, not one after another.
  const sections = await Promise.all(
    (blocks || []).map(async (block, index) => {
      const key = block.id || index
      switch (block.blockType) {
        case 'hero':
          return (
            <section className={`hero ${block.image ? 'has-image' : ''}`} key={key}>
              <div className="hero-copy">
                <p className="eyebrow">{block.eyebrow}</p>
                <h1>{block.heading}</h1>
                <p className="hero-description">{block.description}</p>
                <div className="actions">
                  {block.links?.map((link, i) => (
                    <Link
                      className={i === 0 ? 'button' : 'text-link'}
                      key={link.id || i}
                      href={localizedHref(link.href, locale)}
                    >
                      {link.label}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ))}
                </div>
              </div>
              {block.image ? (
                <MediaImage className="hero-image" media={block.image} eager />
              ) : (
                <div className="architectural-art" aria-hidden="true">
                  <div />
                  <div />
                  <div />
                  <span>COMMON GROUND</span>
                </div>
              )}
            </section>
          )
        case 'richContent':
          return (
            <section className="section prose" key={key}>
              <RichText data={block.content} />
            </section>
          )
        case 'featureGrid':
          return (
            <section className="section" key={key}>
              <p className="eyebrow">{locale === 'ar' ? 'مصمم من أجلك' : 'DESIGNED AROUND YOU'}</p>
              <h2>{block.heading}</h2>
              <div className="feature-grid">
                {block.items?.map((item, i) => (
                  <article key={item.id || i}>
                    <span className="card-number">0{i + 1}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </section>
          )
        case 'stats':
          return (
            <section className="stats section" key={key}>
              {block.items?.map((item, i) => (
                <div key={item.id || i}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </section>
          )
        case 'callToAction':
          return (
            <section className="cta section" key={key}>
              <div>
                <h2>{block.heading}</h2>
                <p>{block.description}</p>
              </div>
              <Link className="button light" href={localizedHref(block.link.href, locale)}>
                {block.link.label}
                <span aria-hidden="true">↗</span>
              </Link>
            </section>
          )
        case 'collectionGrid': {
          if (!isContentSlug(block.collection)) return null
          const [payload, context] = await Promise.all([getCMS(), getReadContext(locale)])
          const { docs } = await payload.find({
            collection: block.collection,
            ...context,
            limit: block.limit,
            sort: block.collection === 'posts' ? '-publishedAt' : 'sortOrder',
            depth: 1,
          })
          return (
            <section className="section" key={key}>
              <h2>{block.heading}</h2>
              <ContentCards docs={docs} collection={block.collection} locale={locale} />
            </section>
          )
        }
        default:
          return null
      }
    }),
  )
  return <>{sections}</>
}
