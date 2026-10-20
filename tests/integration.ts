import assert from 'node:assert/strict'
import { getPayload } from 'payload'
import { randomBytes } from 'node:crypto'
import config from '../src/payload.config'
import { cms } from '../src/cms.config'
import sharp from 'sharp'

if (process.env.CMS_INTEGRATION_TEST !== 'true')
  throw new Error('Use npm run test:integration to isolate test data.')
const payload = await getPayload({ config })
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
  const editor = await payload.create({
    collection: 'users',
    user: admin,
    overrideAccess: false,
    data: { name: 'Editor', email: 'editor@example.test', password, role: 'editor' },
  })
  const viewer = await payload.create({
    collection: 'users',
    user: admin,
    overrideAccess: false,
    data: { name: 'Viewer', email: 'viewer@example.test', password, role: 'viewer' },
  })
  const layout = [{ blockType: 'hero' as const, heading: 'Original published heading' }]
  const published = await payload.create({
    collection: 'pages',
    user: editor,
    overrideAccess: false,
    data: { title: 'Published title', slug: 'published-test', layout, _status: 'published' },
  })
  const draft = await payload.create({
    collection: 'pages',
    user: editor,
    overrideAccess: false,
    draft: true,
    data: { title: 'Private draft', slug: 'private-test', layout, _status: 'draft' },
  })
  const publicList = await payload.find({ collection: 'pages', overrideAccess: false, user: null })
  check(
    publicList.docs.length === 1 && publicList.docs[0].id === published.id,
    'Public reads return published documents only',
  )
  const publicDraftRequest = await payload.find({
    collection: 'pages',
    overrideAccess: false,
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
    data: { title: 'Private revision', _status: 'draft' },
  })
  const publicOriginal = await payload.findByID({
    collection: 'pages',
    id: published.id,
    overrideAccess: false,
    user: null,
  })
  check(
    publicOriginal.title === 'Published title',
    'Saving a draft preserves the live published version',
  )
  const anonymousPreview = await payload.find({
    collection: 'pages',
    overrideAccess: false,
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
      data: { title: 'Denied', slug: 'denied', layout },
    }),
  )
  check(true, 'Viewers cannot create content')
  await assert.rejects(() =>
    payload.update({
      collection: 'pages',
      id: published.id,
      user: viewer,
      overrideAccess: false,
      data: { title: 'Denied update' },
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
    payload.updateGlobal({
      slug: 'site-settings',
      user: editor,
      overrideAccess: false,
      data: { siteName: 'Denied' },
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
    overrideAccess: false,
  })
  check(arabic.title === 'عنوان عربي', 'Arabic content persists independently')
  const english = await payload.findByID({
    collection: 'pages',
    id: published.id,
    locale: 'en',
    overrideAccess: false,
  })
  check(english.title !== 'عنوان عربي', 'Updating Arabic does not overwrite English')
  await assert.rejects(() =>
    payload.create({
      collection: 'pages',
      user: editor,
      overrideAccess: false,
      data: { title: 'Duplicate', slug: 'published-test', layout, _status: 'published' },
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
    data: { alt: 'Test image' },
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
      data: { alt: 'Unsafe' },
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
    data: { title: 'Retained project', slug: 'retained', summary: 'Test', _status: 'published' },
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
  console.log(`\n${assertions} integration assertions passed.`)
} finally {
  await payload.destroy()
}
