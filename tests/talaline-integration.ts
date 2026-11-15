import assert from 'node:assert/strict'
import path from 'node:path'
import { createServer } from 'node:net'
import { spawn, type ChildProcess } from 'node:child_process'
import { getPayload } from 'payload'
import sharp from 'sharp'
import config from '../src/payload.config'

if (process.env.CMS_INTEGRATION_TEST !== 'true' || !process.env.TALALINE_DIR)
  throw new Error('Run the isolated Talaline test with TALALINE_DIR set to its checkout.')
const frontend = path.resolve(process.env.TALALINE_DIR)
const payload = await getPayload({ config })
const children: ChildProcess[] = []
let logs = ''
async function port() {
  return new Promise<number>((resolve, reject) => {
    const socket = createServer()
    socket.once('error', reject)
    socket.listen(0, '127.0.0.1', () => {
      const address = socket.address() as { port: number }
      socket.close(() => resolve(address.port))
    })
  })
}
function start(cwd: string, args: string[], env: NodeJS.ProcessEnv) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
  children.push(child)
  child.stdout?.on('data', (chunk) => {
    logs = (logs + chunk).slice(-8000)
  })
  child.stderr?.on('data', (chunk) => {
    logs = (logs + chunk).slice(-8000)
  })
  return child
}
async function ready(url: string, child: ChildProcess) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    if (child.exitCode !== null) break
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Preview failed: ${logs}`)
}
const story = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    format: '' as const,
    indent: 0,
    direction: 'ltr' as const,
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [
          { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
        ],
      },
    ],
  },
})
try {
  const site = await payload.create({
    collection: 'websites',
    data: { name: 'Tala Line', slug: 'talaline', domain: 'www.talaline.sa' },
  })
  const other = await payload.create({
    collection: 'websites',
    data: { name: 'Other company', slug: 'other', domain: 'other.test' },
  })
  const png = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#653184' } })
    .png()
    .toBuffer()
  const media = await payload.create({
    collection: 'media',
    data: { tenant: site.id, alt: 'Tala Line test cover' },
    file: { data: png, name: 'talaline-cover.png', mimetype: 'image/png', size: png.length },
  })
  const article = await payload.create({
    collection: 'posts',
    data: {
      tenant: site.id,
      title: 'Talaline integration story',
      slug: 'pilot-story',
      excerpt: 'An English introduction',
      content: story('Published English article body.'),
      image: media.id,
      _status: 'published',
    },
  })
  await payload.update({
    collection: 'posts',
    id: article.id,
    locale: 'ar',
    data: {
      title: 'مقالة تالا لاين التجريبية',
      excerpt: 'مقدمة باللغة العربية',
      content: story('نص المقالة المنشورة بالعربية.'),
      _status: 'published',
    },
  })
  await payload.create({
    collection: 'posts',
    draft: true,
    data: {
      tenant: site.id,
      title: 'Private Talaline draft',
      slug: 'private-draft',
      excerpt: 'Private',
      content: story('Private'),
      _status: 'draft',
    },
  })
  await payload.create({
    collection: 'posts',
    data: {
      tenant: other.id,
      title: 'Other company article',
      slug: 'foreign-story',
      excerpt: 'Foreign',
      content: story('Foreign'),
      _status: 'published',
    },
  })
  const cmsPort = await port()
  const cmsURL = `http://127.0.0.1:${cmsPort}`
  const cms = start(
    process.cwd(),
    [
      'node_modules/next/dist/bin/next',
      'dev',
      '--hostname',
      '127.0.0.1',
      '--port',
      String(cmsPort),
    ],
    { ...process.env, SERVER_URL: cmsURL },
  )
  await ready(`${cmsURL}/api/users/me`, cms)
  const feed = await fetch(
    `${cmsURL}/api/public/talaline/posts?locale=en&draft=true&where[tenant][equals]=${other.id}`,
  )
  assert.equal(feed.status, 200)
  const data = await feed.json()
  assert.equal(data.totalDocs, 1)
  assert.equal(data.docs[0].id, article.id)
  assert.equal(data.docs[0].tenant, undefined)
  assert.equal(data.docs[0].title, 'Talaline integration story')
  assert.equal((await fetch(data.docs[0].image.url)).status, 200)
  assert.equal((await fetch(`${cmsURL}/api/public/other/media/${media.filename}`)).status, 404)
  assert.equal((await fetch(`${cmsURL}/api/public/talaline/posts?locale=fr`)).status, 400)
  assert.equal((await fetch(`${cmsURL}/api/public/missing/posts`)).status, 404)
  assert.equal((await fetch(`${cmsURL}/api/public/talaline/posts?limit=101`)).status, 400)
  console.log(
    '✓ Public feed excludes drafts and other tenants; public media remains website-scoped.',
  )

  const frontendPort = await port()
  const frontendURL = `http://127.0.0.1:${frontendPort}`
  const app = start(
    frontend,
    [
      'node_modules/next/dist/bin/next',
      'dev',
      '--hostname',
      '127.0.0.1',
      '--port',
      String(frontendPort),
    ],
    { ...process.env, CMS_URL: cmsURL, CMS_WEBSITE_SLUG: 'talaline', SITE_INDEXABLE: 'false' },
  )
  await ready(`${frontendURL}/en/news`, app)
  for (const [locale, title, body] of [
    ['en', 'Talaline integration story', 'Published English article body.'],
    ['ar', 'مقالة تالا لاين التجريبية', 'نص المقالة المنشورة بالعربية.'],
  ]) {
    const list = await fetch(`${frontendURL}/${locale}/news`)
    assert.equal(list.status, 200)
    const listHTML = await list.text()
    assert.ok(listHTML.includes(title))
    assert.ok(
      !listHTML.includes('Private Talaline draft') && !listHTML.includes('Other company article'),
    )
    const detail = await fetch(`${frontendURL}/${locale}/news/pilot-story`)
    assert.equal(detail.status, 200)
    const html = await detail.text()
    assert.ok(html.includes(title) && html.includes(body))
    assert.ok(html.includes(`/${locale}/news/pilot-story`))
    if (locale === 'ar') assert.ok(html.includes('dir="rtl"'))
  }
  assert.equal((await fetch(`${frontendURL}/en/news/private-draft`)).status, 404)
  const sitemap = await (await fetch(`${frontendURL}/sitemap.xml`)).text()
  assert.ok(sitemap.includes('/en/news/pilot-story') && sitemap.includes('/ar/news/pilot-story'))
  assert.ok(!sitemap.includes('private-draft') && !sitemap.includes('foreign-story'))
  console.log(
    '✓ Talaline renders English/Arabic news, canonical metadata and published-only sitemap entries.',
  )
  await payload.update({
    collection: 'posts',
    id: article.id,
    data: { title: 'Updated without deployment', _status: 'published' },
  })
  assert.ok(
    (await (await fetch(`${frontendURL}/en/news/pilot-story`)).text()).includes(
      'Updated without deployment',
    ),
  )
  await payload.update({ collection: 'posts', id: article.id, data: { _status: 'draft' } })
  assert.equal((await fetch(`${frontendURL}/en/news/pilot-story`)).status, 404)
  console.log(
    '✓ Updating and unpublishing changes Talaline immediately without rebuilding or redeploying.',
  )
  if (process.env.CMS_PILOT_PREVIEW === 'true') {
    await payload.update({
      collection: 'posts',
      id: article.id,
      data: { title: 'Talaline integration story', _status: 'published' },
    })
    console.log(`Preview website: ${frontendURL}/en/news`)
    console.log(`Preview Arabic: ${frontendURL}/ar/news`)
    await new Promise<void>((resolve) => {
      process.once('SIGINT', () => resolve())
      process.once('SIGTERM', () => resolve())
    })
  }
} finally {
  await Promise.all(
    children.map(async (child) => {
      if (child.exitCode !== null || child.signalCode !== null) return
      const stopped = new Promise((resolve) => child.once('exit', resolve))
      child.kill('SIGTERM')
      await stopped
    }),
  )
  await payload.destroy()
}
