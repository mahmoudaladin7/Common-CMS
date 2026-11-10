import assert from 'node:assert/strict'
import { getPayload, createLocalReq } from 'payload'
import { sql } from '@payloadcms/db-sqlite'
import config from '../src/payload.config'
import { up as initial } from '../src/migrations/20261020_064300_initial'
import { up as upgrade } from '../src/migrations/20261110_081344'

if (process.env.CMS_INTEGRATION_TEST !== 'true')
  throw new Error('Use the isolated migration runner.')
const payload = await getPayload({ config })
const db = payload.db.drizzle
const req = await createLocalReq({}, payload)
try {
  const args = { db, payload, req }
  await initial(args)
  await db.run(
    sql`INSERT INTO users (id, name, role, email) VALUES (1, 'Owner', 'admin', 'owner@example.test'), (2, 'Legacy editor', 'editor', 'editor@example.test');`,
  )
  await db.run(sql`INSERT INTO pages (id, slug, _status) VALUES (1, 'home', 'published');`)
  await db.run(
    sql`INSERT INTO pages_locales (_parent_id, _locale, title) VALUES (1, 'en', 'Legacy home'), (1, 'ar', 'الرئيسية القديمة');`,
  )
  await db.run(sql`INSERT INTO site_settings (id, email) VALUES (1, 'preserved@example.test');`)
  await db.run(
    sql`INSERT INTO site_settings_locales (_parent_id, _locale, site_name) VALUES (1, 'en', 'Legacy brand'), (1, 'ar', 'العلامة القديمة');`,
  )
  await db.run(sql`INSERT INTO navigation (id) VALUES (1);`)
  await db.run(
    sql`INSERT INTO navigation_main (id, _parent_id, _order, href) VALUES ('old-menu', 1, 1, '/about');`,
  )
  await db.run(
    sql`INSERT INTO navigation_main_locales (_parent_id, _locale, label) VALUES ('old-menu', 'en', 'About'), ('old-menu', 'ar', 'من نحن');`,
  )
  await upgrade(args)
  const page = await payload.findByID({ collection: 'pages', id: 1, locale: 'ar', depth: 0 })
  assert.equal(page.title, 'الرئيسية القديمة')
  assert.equal(page.tenant, 1)
  const settings = await payload.findByID({
    collection: 'site-settings',
    id: 1,
    locale: 'ar',
    depth: 0,
  })
  assert.equal(settings.siteName, 'العلامة القديمة')
  assert.equal(settings.email, 'preserved@example.test')
  assert.equal(settings.tenant, 1)
  const nav = await payload.findByID({ collection: 'navigation', id: 1, locale: 'ar', depth: 0 })
  assert.equal(nav.main?.[0].label, 'من نحن')
  const editor = await payload.findByID({ collection: 'users', id: 2, depth: 0 })
  assert.equal(editor.tenants?.[0].tenant, 1)
  assert.equal(editor.tenants?.[0].role, 'editor')
  const sites = await payload.find({ collection: 'websites' })
  assert.equal(sites.totalDocs, 2)
  console.log(
    '✓ Legacy content, Arabic settings/navigation, memberships, and two workspaces survive migration.',
  )
} finally {
  await payload.destroy()
}
