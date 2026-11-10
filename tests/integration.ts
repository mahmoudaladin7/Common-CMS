import assert from 'node:assert/strict'
import { getPayload } from 'payload'
import { randomBytes } from 'node:crypto'
import config from '../src/payload.config'
import { cms } from '../src/cms.config'
import sharp from 'sharp'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

if (process.env.CMS_INTEGRATION_TEST !== 'true')
  throw new Error('Use npm run test:integration to isolate test data.')
const payload = await getPayload({ config })
let server: ReturnType<typeof spawn> | undefined
let assertions = 0
function check(condition: unknown, message: string) {
  assert.ok(condition, message)
  assertions++
  console.log(`✓ ${message}`)
}

try {
  const password = randomBytes(24).toString('hex')
  const admin = await payload.create({
    collection: 'users',
    data: { name: 'Admin', email: 'admin@example.test', password, role: 'viewer' },
  })
  check(admin.role === 'admin', 'First account becomes an administrator through a server hook')
  const website = await payload.create({
    collection: 'websites',
    data: { name: 'Company A', slug: 'company-a', domain: 'localhost' },
  })
  const tenant = website.id
  const publicContext = { websiteID: tenant }
  const editor = await payload.create({
    collection: 'users',
    user: admin,
    overrideAccess: false,
    data: {
      name: 'Editor',
      email: 'editor@example.test',
      password,
      role: 'editor',
      tenants: [{ tenant, role: 'editor' }],
    },
  })
  const viewer = await payload.create({
    collection: 'users',
    user: admin,
    overrideAccess: false,
    data: {
      name: 'Viewer',
      email: 'viewer@example.test',
      password,
      role: 'viewer',
      tenants: [{ tenant, role: 'viewer' }],
    },
  })
  const layout = [{ blockType: 'hero' as const, heading: 'Original published heading' }]
  const published = await payload.create({
    collection: 'pages',
    user: editor,
    overrideAccess: false,
    data: {
      tenant,
      title: 'Published title',
      slug: 'published-test',
      layout,
      _status: 'published',
    },
  })
  const draft = await payload.create({
    collection: 'pages',
    user: editor,
    overrideAccess: false,
    draft: true,
    data: { tenant, title: 'Private draft', slug: 'private-test', layout, _status: 'draft' },
  })
  const publicList = await payload.find({
    collection: 'pages',
    context: publicContext,
    overrideAccess: false,
    user: null,
  })
  check(
    publicList.docs.length === 1 && publicList.docs[0].id === published.id,
    'Public reads return published documents only',
  )
  const publicDraftRequest = await payload.find({
    collection: 'pages',
    overrideAccess: false,
    context: publicContext,
    user: null,
    draft: true,
    where: { id: { equals: draft.id } },
  })
  check(
    publicDraftRequest.totalDocs === 0,
    'Adding draft=true cannot expose an unpublished document',
  )
  await payload.update({
    collection: 'pages',
    id: published.id,
    user: editor,
    overrideAccess: false,
    draft: true,
    data: { tenant, title: 'Private revision', _status: 'draft' },
  })
  const publicOriginal = await payload.findByID({
    collection: 'pages',
    id: published.id,
    overrideAccess: false,
    context: publicContext,
    user: null,
  })
  check(
    publicOriginal.title === 'Published title',
    'Saving a draft preserves the live published version',
  )
  const anonymousPreview = await payload.find({
    collection: 'pages',
    overrideAccess: false,
    context: publicContext,
    user: null,
    draft: true,
    where: { id: { equals: published.id } },
  })
  check(
    anonymousPreview.docs.every((doc) => doc.title !== 'Private revision'),
    'Anonymous draft queries cannot read revisions of a published document',
  )
  const revision = await payload.findByID({
    collection: 'pages',
    id: published.id,
    overrideAccess: false,
    user: viewer,
    draft: true,
  })
  check(revision.title === 'Private revision', 'Authenticated viewers can review draft revisions')
  await assert.rejects(() =>
    payload.create({
      collection: 'pages',
      user: viewer,
      overrideAccess: false,
      data: { tenant, title: 'Denied', slug: 'denied', layout },
    }),
  )
  check(true, 'Viewers cannot create content')
  await assert.rejects(() =>
    payload.update({
      collection: 'pages',
      id: published.id,
      user: viewer,
      overrideAccess: false,
      data: { tenant, title: 'Denied update' },
    }),
  )
  check(true, 'Viewers cannot edit content')
  await assert.rejects(() =>
    payload.delete({ collection: 'pages', id: draft.id, user: editor, overrideAccess: false }),
  )
  check(true, 'Editors cannot delete content')
  await payload.update({
    collection: 'users',
    id: editor.id,
    user: editor,
    overrideAccess: false,
    data: { role: 'admin' },
  })
  const unchangedRole = await payload.findByID({ collection: 'users', id: editor.id })
  check(unchangedRole.role === 'editor', 'Editors cannot elevate their own role')
  const users = await payload.find({ collection: 'users', user: viewer, overrideAccess: false })
  check(
    users.docs.length === 1 && users.docs[0].id === viewer.id,
    'Non-admin users can read only their own account',
  )
  await assert.rejects(() =>
    payload.find({ collection: 'users', user: null, overrideAccess: false }),
  )
  check(true, 'Anonymous visitors cannot read user accounts')
  await assert.rejects(() =>
    payload.delete({ collection: 'users', id: admin.id, user: admin, overrideAccess: false }),
  )
  check(true, 'The last administrator cannot be deleted')
  await assert.rejects(() =>
    payload.update({
      collection: 'users',
      id: admin.id,
      user: admin,
      overrideAccess: false,
      data: { role: 'viewer' },
    }),
  )
  check(true, 'The last administrator cannot be demoted')
  await assert.rejects(() =>
    payload.create({
      collection: 'site-settings',
      user: editor,
      overrideAccess: false,
      data: { tenant, siteName: 'Denied' },
    }),
  )
  check(true, 'Only administrators can change site settings')
  await payload.update({
    collection: 'pages',
    id: published.id,
    locale: 'ar',
    user: editor,
    overrideAccess: false,
    data: {
      title: 'عنوان عربي',
      layout: [{ blockType: 'hero', id: published.layout[0].id, heading: 'عنوان القسم بالعربية' }],
      _status: 'published',
    },
  })
  const arabic = await payload.findByID({
    collection: 'pages',
    id: published.id,
    locale: 'ar',
    context: publicContext,
    overrideAccess: false,
  })
  check(arabic.title === 'عنوان عربي', 'Arabic content persists independently')
  const english = await payload.findByID({
    collection: 'pages',
    id: published.id,
    locale: 'en',
    context: publicContext,
    overrideAccess: false,
  })
  check(english.title !== 'عنوان عربي', 'Updating Arabic does not overwrite English')
  await assert.rejects(() =>
    payload.create({
      collection: 'pages',
      user: editor,
      overrideAccess: false,
      data: { tenant, title: 'Duplicate', slug: 'published-test', layout, _status: 'published' },
    }),
  )
  check(true, 'Duplicate page slugs are rejected')
  const history = await payload.findVersions({
    collection: 'pages',
    where: { parent: { equals: published.id } },
    user: admin,
    overrideAccess: false,
  })
  check(history.totalDocs > 1, 'Content changes create revision history')
  const png = await sharp({ create: { width: 64, height: 64, channels: 4, background: '#21594d' } })
    .png()
    .toBuffer()
  const media = await payload.create({
    collection: 'media',
    user: editor,
    overrideAccess: false,
    data: { tenant, alt: 'Test image' },
    file: { data: png, mimetype: 'image/png', name: 'test-image.png', size: png.length },
  })
  check(
    Boolean(media.url && media.sizes?.thumbnail?.url),
    'Image uploads persist and generate thumbnail variants',
  )
  await assert.rejects(() =>
    payload.create({
      collection: 'media',
      user: editor,
      overrideAccess: false,
      data: { tenant, alt: 'Unsafe' },
      file: {
        data: Buffer.from('<script>alert(1)</script>'),
        mimetype: 'text/html',
        name: 'unsafe.html',
        size: 25,
      },
    }),
  )
  check(true, 'Executable HTML uploads are rejected')
  const originalProjectSetting = cms.modules.projects
  cms.modules.projects = true
  const project = await payload.create({
    collection: 'projects',
    user: admin,
    overrideAccess: false,
    data: {
      tenant,
      title: 'Retained project',
      slug: 'retained',
      summary: 'Test',
      _status: 'published',
    },
  })
  cms.modules.projects = false
  await assert.rejects(() =>
    payload.find({ collection: 'projects', user: admin, overrideAccess: false }),
  )
  check(true, 'Disabled modules deny API reads even for administrators')
  cms.modules.projects = true
  const retained = await payload.findByID({
    collection: 'projects',
    id: project.id,
    user: admin,
    overrideAccess: false,
  })
  check(
    retained.title === 'Retained project',
    'Re-enabling a module preserves its existing content',
  )
  cms.modules.projects = originalProjectSetting

  const websiteB = await payload.create({
    collection: 'websites',
    data: { name: 'Company B', slug: 'company-b', domain: '127.0.0.1' },
  })
  const b = websiteB.id
  const pageB = await payload.create({
    collection: 'pages',
    data: {
      tenant: b,
      title: 'Company B secret',
      slug: 'published-test',
      layout,
      _status: 'draft',
    },
  })
  const adminA = await payload.create({
    collection: 'users',
    data: {
      name: 'Admin A',
      email: 'admin-a@example.test',
      password,
      role: 'viewer',
      tenants: [
        { tenant, role: 'admin' },
        { tenant: b, role: 'viewer' },
      ],
    },
  })
  const outsider = await payload.create({
    collection: 'users',
    data: { name: 'No membership', email: 'outsider@example.test', password, role: 'editor' },
  })
  for (const user of [editor, viewer, outsider]) {
    const scoped = await payload.find({
      collection: 'pages',
      user,
      overrideAccess: false,
      draft: true,
      where: { tenant: { equals: b } },
    })
    check(
      scoped.totalDocs === 0,
      `${user.name} cannot list another website, even with a forged filter`,
    )
    await assert.rejects(() =>
      payload.findByID({
        collection: 'pages',
        id: pageB.id,
        user,
        overrideAccess: false,
        draft: true,
      }),
    )
    await assert.rejects(() =>
      payload.update({
        collection: 'pages',
        id: pageB.id,
        user,
        overrideAccess: false,
        draft: true,
        data: { title: 'Attack' },
      }),
    )
    await assert.rejects(() =>
      payload.delete({ collection: 'pages', id: pageB.id, user, overrideAccess: false }),
    )
    const count = await payload.count({
      collection: 'pages',
      user,
      overrideAccess: false,
      where: { tenant: { equals: b } },
    })
    check(count.totalDocs === 0, `${user.name} cannot count another website's documents`)
  }
  check(pageB.slug === published.slug, 'Separate websites can use the same page slug')
  await assert.rejects(() =>
    payload.create({
      collection: 'pages',
      user: editor,
      overrideAccess: false,
      draft: true,
      data: { tenant: b, title: 'Attack', slug: 'forged-create', layout },
    }),
  )
  await assert.rejects(() =>
    payload.update({
      collection: 'pages',
      id: published.id,
      user: adminA,
      overrideAccess: false,
      data: { tenant: b },
    }),
  )
  check(true, 'Forged draft creates and website reassignment are rejected')
  await payload.update({
    collection: 'pages',
    id: published.id,
    user: adminA,
    overrideAccess: false,
    data: { title: 'Website admin update' },
  })
  await assert.rejects(() =>
    payload.update({
      collection: 'pages',
      id: pageB.id,
      user: adminA,
      overrideAccess: false,
      data: { title: 'Wrong role' },
    }),
  )
  check(true, 'The same user can administer A while remaining read-only on B')
  const settingsA = await payload.create({
    collection: 'site-settings',
    user: adminA,
    overrideAccess: false,
    data: { tenant, siteName: 'A settings' },
  })
  await payload.create({ collection: 'site-settings', data: { tenant: b, siteName: 'B settings' } })
  await assert.rejects(() =>
    payload.update({
      collection: 'site-settings',
      id: settingsA.id,
      user: editor,
      overrideAccess: false,
      data: { siteName: 'Attack' },
    }),
  )
  const visibleSettings = await payload.find({
    collection: 'site-settings',
    user: editor,
    overrideAccess: false,
  })
  check(
    visibleSettings.totalDocs === 1 && visibleSettings.docs[0].id === settingsA.id,
    'Settings are isolated and only website admins can change them',
  )
  await payload.update({
    collection: 'users',
    id: editor.id,
    user: editor,
    overrideAccess: false,
    data: { tenants: [{ tenant: b, role: 'admin' }] },
  })
  const unchangedMembership = await payload.findByID({ collection: 'users', id: editor.id })
  check(
    unchangedMembership.tenants?.length === 1 && unchangedMembership.tenants[0].role === 'editor',
    'Members cannot grant themselves website memberships or roles',
  )
  const versionsB = await payload.findVersions({
    collection: 'pages',
    user: editor,
    overrideAccess: false,
    where: { parent: { equals: pageB.id } },
  })
  check(versionsB.totalDocs === 0, 'Version history cannot cross website boundaries')
  const ownHistory = await payload.findVersions({
    collection: 'pages',
    user: editor,
    overrideAccess: false,
    where: { parent: { equals: published.id } },
  })
  check(ownHistory.totalDocs > 0, 'Editors retain access to their own website revision history')
  const historyB = await payload.findVersions({
    collection: 'pages',
    where: { parent: { equals: pageB.id } },
  })
  await assert.rejects(() =>
    payload.restoreVersion({
      collection: 'pages',
      id: historyB.docs[0].id,
      user: editor,
      overrideAccess: false,
    }),
  )
  check(true, 'Editors cannot restore another website version')
  const mediaB = await payload.create({
    collection: 'media',
    data: { tenant: b, alt: 'B private library' },
    file: { data: png, mimetype: 'image/png', name: 'b-image.png', size: png.length },
  })
  await assert.rejects(() =>
    payload.findByID({ collection: 'media', id: mediaB.id, user: editor, overrideAccess: false }),
  )
  await assert.rejects(() =>
    payload.update({
      collection: 'media',
      id: mediaB.id,
      user: editor,
      overrideAccess: false,
      data: { alt: 'Attack' },
    }),
  )
  await assert.rejects(() =>
    payload.create({
      collection: 'media',
      user: editor,
      overrideAccess: false,
      data: { tenant: b, alt: 'Attack' },
      file: { data: png, mimetype: 'image/png', name: 'attack.png', size: png.length },
    }),
  )
  check(true, 'Media reads, writes and uploads enforce website membership')
  await assert.rejects(() =>
    payload.update({
      collection: 'pages',
      id: published.id,
      user: adminA,
      overrideAccess: false,
      draft: true,
      data: { seo: { image: mediaB.id } },
    }),
  )
  await assert.rejects(() =>
    payload.update({
      collection: 'pages',
      id: published.id,
      user: adminA,
      overrideAccess: false,
      draft: true,
      data: { layout: [{ blockType: 'hero', heading: 'Attack', image: mediaB.id }] },
    }),
  )
  check(
    true,
    'Cross-website media references are rejected even when the user belongs to both websites',
  )
  const hostA = { headers: new Headers({ host: 'localhost:3000' }) }
  const hostB = { headers: new Headers({ host: '127.0.0.1:3000' }) }
  const publicA = await payload.find({
    collection: 'pages',
    user: null,
    overrideAccess: false,
    req: hostA,
  })
  check(
    publicA.docs.every(
      (doc) => (typeof doc.tenant === 'object' ? doc.tenant?.id : doc.tenant) === tenant,
    ),
    'Anonymous queries resolve only the registered hostname website',
  )
  const publicB = await payload.find({
    collection: 'pages',
    user: null,
    overrideAccess: false,
    req: hostB,
    draft: true,
  })
  check(
    publicB.totalDocs === 0,
    'Anonymous draft requests on B cannot expose B drafts or A published content',
  )
  await assert.rejects(() =>
    payload.find({
      collection: 'pages',
      user: null,
      overrideAccess: false,
      req: { headers: new Headers({ host: 'unknown.test' }) },
    }),
  )
  const mediaA = await payload.find({
    collection: 'media',
    user: null,
    overrideAccess: false,
    req: hostA,
  })
  check(
    mediaA.docs.every((doc) => doc.id !== mediaB.id),
    'Public media libraries remain scoped to hostname',
  )
  const superList = await payload.find({
    collection: 'pages',
    user: admin,
    overrideAccess: false,
    draft: true,
  })
  check(
    superList.docs.some((doc) => doc.id === pageB.id),
    'Super Admin can manage both websites',
  )

  for (const [site, enTitle, arTitle] of [
    [tenant, 'A home', 'الرئيسية أ'],
    [b, 'B home', 'الرئيسية ب'],
  ] as const) {
    const home = await payload.create({
      collection: 'pages',
      locale: 'en',
      data: { tenant: site, title: enTitle, slug: 'home', layout, _status: 'published' },
    })
    await payload.update({
      collection: 'pages',
      id: home.id,
      locale: 'ar',
      data: {
        title: arTitle,
        layout: [{ blockType: 'hero', id: home.layout[0].id, heading: arTitle }],
        _status: 'published',
      },
    })
  }
  // Exercise the actual REST, GraphQL, upload and preview handlers over HTTP.
  const port = await new Promise<number>((resolve) => {
    const socket = createServer()
    socket.listen(0, '127.0.0.1', () => {
      const address = socket.address() as { port: number }
      socket.close(() => resolve(address.port))
    })
  })
  server = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)],
    { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let output = ''
  server.stdout?.on('data', (chunk) => {
    output = (output + chunk).slice(-6000)
  })
  server.stderr?.on('data', (chunk) => {
    output = (output + chunk).slice(-6000)
  })
  const base = `http://127.0.0.1:${port}`
  let ready = false
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const response = await fetch(`${base}/api/users/me`)
      if (response.ok) {
        ready = true
        break
      }
    } catch {}
    if (server.exitCode !== null) break
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  assert.ok(ready, `HTTP test server failed: ${output}`)
  const login = await fetch(`${base}/api/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: editor.email, password }),
  })
  const session = (await login.json()) as { token: string }
  assert.ok(session.token, 'REST login must issue a session token')
  const authHeaders = { Authorization: `JWT ${session.token}`, 'content-type': 'application/json' }
  const rest = await fetch(`${base}/api/pages?draft=true&where[tenant][equals]=${b}`, {
    headers: authHeaders,
  })
  assert.equal(((await rest.json()) as { totalDocs: number }).totalDocs, 0)
  const forged = await fetch(`${base}/api/pages/${pageB.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ title: 'HTTP attack' }),
  })
  assert.ok([403, 404].includes(forged.status))
  const cookieAttack = await fetch(`${base}/api/pages/${pageB.id}?draft=true`, {
    headers: { ...authHeaders, Cookie: `payload-tenant=${b}` },
  })
  assert.ok([403, 404].includes(cookieAttack.status))
  check(true, 'REST filters, direct IDs and forged website cookies cannot bypass isolation')
  const gql = await fetch(`${base}/api/graphql`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      query: `{ Pages(where: { tenant: { equals: ${b} } }, draft: true) { totalDocs docs { id title } } }`,
    }),
  })
  const graph = (await gql.json()) as { data?: { Pages: { totalDocs: number } }; errors?: unknown }
  assert.equal(graph.errors, undefined, JSON.stringify(graph))
  assert.equal(graph.data?.Pages.totalDocs, 0)
  check(true, 'GraphQL enforces the same website boundary')
  const preview = await fetch(`${base}/preview?collection=pages&id=${pageB.id}&locale=ar`, {
    headers: { Cookie: `payload-token=${session.token}`, 'Sec-Fetch-Site': 'same-origin' },
    redirect: 'manual',
  })
  assert.equal(preview.status, 404)
  const ownPreview = await fetch(`${base}/preview?collection=pages&id=${published.id}&locale=ar`, {
    headers: { Cookie: `payload-token=${session.token}`, 'Sec-Fetch-Site': 'same-origin' },
    redirect: 'manual',
  })
  assert.equal(ownPreview.status, 307)
  assert.ok(ownPreview.headers.get('set-cookie')?.includes(`common-preview-website=${tenant}`))
  check(true, 'Preview rejects foreign documents and sets the authorized website scope')
  const file = await fetch(`${base}/api/media/file/${mediaB.filename}`, { headers: authHeaders })
  assert.ok([403, 404].includes(file.status), `Unexpected foreign file status ${file.status}`)
  const thumbnail = await fetch(`${base}/api/media/file/${mediaB.sizes?.thumbnail?.filename}`, {
    headers: authHeaders,
  })
  assert.ok([403, 404].includes(thumbnail.status))
  check(true, 'Direct media and thumbnail URLs enforce website access for authenticated users')

  for (const [host, expected, forbidden] of [
    ['localhost', 'A home', 'B home'],
    ['127.0.0.1', 'B home', 'A home'],
  ]) {
    const response = await fetch(`http://${host}:${port}/en`)
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.ok(
      html.includes(expected),
      `Missing ${expected}: ${html.match(/<title>.*?<\/title>|<h1.*?<\/h1>/g)?.join(' ')}`,
    )
    assert.ok(!html.includes(forbidden), `Leaked ${forbidden}`)
  }
  assert.ok(
    mediaB.url?.startsWith('/api/media/file/'),
    'Media delivery URLs must retain the current website hostname',
  )
  const bPublicFile = await fetch(`${base}${mediaB.url}`)
  assert.equal(bPublicFile.status, 200)
  const aForeignFile = await fetch(`http://localhost:${port}${mediaB.url}`)
  assert.ok([403, 404].includes(aForeignFile.status))
  check(
    true,
    'Public media resolves on its own website hostname and is denied on the other website',
  )
  const arabicHTTP = await fetch(`http://localhost:${port}/ar`)
  const arabicHTML = await arabicHTTP.text()
  assert.equal(arabicHTTP.status, 200)
  assert.ok(arabicHTML.includes('dir="rtl"') && arabicHTML.includes('الرئيسية أ'))
  check(
    true,
    'Public English routes stay on their website and Arabic routes retain localized RTL content',
  )
  for (const [actor, canCreate] of [
    [editor, true],
    [viewer, false],
    [outsider, false],
  ] as const) {
    const loginResponse = await fetch(`${base}/api/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: actor.email, password }),
    })
    const { token } = (await loginResponse.json()) as { token: string }
    const dashboardResponse = await fetch(`${base}/admin`, {
      headers: {
        Cookie: `payload-token=${token}; payload-tenant=${b}`,
        'Sec-Fetch-Site': 'same-origin',
      },
    })
    assert.equal(dashboardResponse.status, 200)
    const dashboard = await dashboardResponse.text()
    assert.ok(dashboard.includes('Everything in one place.'))
    assert.ok(!dashboard.includes('href="/admin/collections/websites/create"'))
    const action =
      /class="common-button common-button--blue" href="\/admin\/collections\/pages\/create"/.test(
        dashboard,
      )
    assert.equal(action, canCreate, `${actor.name} dashboard must respect editing permissions`)
    assert.ok(!dashboard.includes('Open workspace for Company B'))
    check(
      true,
      `${actor.name} dashboard ignores foreign website cookies and shows only authorized actions`,
    )
  }
  console.log(`\n${assertions} integration assertions passed.`)
} finally {
  if (server) {
    const stopped = new Promise((resolve) => server!.once('exit', resolve))
    server.kill('SIGTERM')
    await stopped
  }
  await payload.destroy()
}
