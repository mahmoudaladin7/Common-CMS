import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { ar } from '@payloadcms/translations/languages/ar'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { Websites } from './collections/Websites'
import { enforceWebsite, isSuperAdmin } from './access/tenancy'
import { cms } from './cms.config'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Companies, Projects, Services, Team } from './collections/Directory'
import { SiteSettings, Navigation } from './globals'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const secret = process.env.PAYLOAD_SECRET
if (!secret || secret.length < 32)
  throw new Error('PAYLOAD_SECRET must contain at least 32 characters. Run npm run setup.')
const serverURL = process.env.SERVER_URL || 'http://localhost:3000'
const extraOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

export default buildConfig({
  secret,
  serverURL,
  admin: {
    user: Users.slug,
    theme: 'light',
    meta: { titleSuffix: ` · ${cms.name} CMS` },
    importMap: { baseDir: dirname },
    components: {
      beforeNav: ['/components/admin/Brand#SidebarBrand'],
      views: { dashboard: { Component: '/components/admin/Overview#Overview' } },
      beforeLogin: ['/components/admin/Welcome#Welcome'],
      graphics: {
        Logo: '/components/admin/Brand#Brand',
        Icon: '/components/admin/Brand#BrandIcon',
      },
    },
  },
  // Feature switches gate access instead of dropping tables or generated types.
  collections: [
    Users,
    Websites,
    Media,
    Pages,
    Posts,
    Services,
    Projects,
    Companies,
    Team,
    SiteSettings,
    Navigation,
  ].map((collection) => {
    if (['users', 'websites'].includes(collection.slug)) return collection
    return {
      ...collection,
      indexes: [
        ...(collection.indexes || []),
        ...(['site-settings', 'navigation'].includes(collection.slug)
          ? []
          : collection.slug === 'media'
            ? []
            : [{ fields: ['tenant', 'slug'], unique: true }]),
      ],
      hooks: {
        ...collection.hooks,
        beforeValidate: [...(collection.hooks?.beforeValidate || []), enforceWebsite],
      },
    }
  }),
  plugins: [
    multiTenantPlugin({
      tenantsSlug: 'websites',
      userHasAccessToAllTenants: isSuperAdmin,
      cleanupAfterTenantDelete: false,
      useTenantsCollectionAccess: false,
      useUsersTenantFilter: false,
      tenantsArrayField: {
        rowFields: [
          {
            name: 'role',
            type: 'select',
            required: true,
            saveToJWT: true,
            defaultValue: 'viewer',
            options: [
              { label: 'Website Admin', value: 'admin' },
              { label: 'Editor', value: 'editor' },
              { label: 'Viewer', value: 'viewer' },
            ],
          },
        ],
      },
      collections: Object.fromEntries(
        [
          'media',
          'pages',
          'posts',
          'services',
          'projects',
          'companies',
          'team',
          'site-settings',
          'navigation',
        ].map((slug) => [
          slug,
          { useTenantAccess: false, isGlobal: ['site-settings', 'navigation'].includes(slug) },
        ]),
      ),
      i18n: {
        translations: {
          en: { 'nav-tenantSelector-label': 'Website' },
          ar: { 'nav-tenantSelector-label': 'الموقع' },
        },
      },
    }),
  ],
  editor: lexicalEditor(),
  localization: { locales: cms.locales, defaultLocale: cms.defaultLocale, fallback: true },
  i18n: { supportedLanguages: { en, ar }, fallbackLanguage: 'en' },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || 'file:./cms.db',
      authToken: process.env.DATABASE_AUTH_TOKEN,
    },
    push: process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  // Media is public by design. Allow only formats configured in Media.ts.
  upload: { limits: { fileSize: 10 * 1024 * 1024 }, abortOnLimit: true },
  cors: [serverURL, ...extraOrigins],
  csrf: [serverURL],
  ...(process.env.SMTP_HOST
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: process.env.SMTP_FROM_ADDRESS || 'cms@example.com',
          defaultFromName: process.env.SMTP_FROM_NAME || `${cms.name} CMS`,
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            ...(process.env.SMTP_USER
              ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
              : {}),
          },
        }),
      }
    : {}),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
