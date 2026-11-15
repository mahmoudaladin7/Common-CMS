> Phase 1: all content, media, navigation and settings queries are website-scoped. Anonymous calls require a registered request hostname; authenticated calls are limited by website membership. See [multi-website setup](multi-website.md).

# Connect an existing website

The CMS can render its included frontend or serve a completely separate website.
Public content reads need no API key. Editing requires CMS authentication and
the same server-side role rules used by the admin.

## REST

Read published pages in Arabic:

```bash
curl 'http://localhost:3000/api/pages?locale=ar&depth=1&limit=10'
```

Read a page by slug:

```ts
const url = new URL('/api/pages', process.env.CMS_URL)
url.searchParams.set('where[slug][equals]', 'about')
url.searchParams.set('locale', 'en')
url.searchParams.set('depth', '1')

const response = await fetch(url, { cache: 'no-store' })
if (!response.ok) throw new Error(`CMS read failed: ${response.status}`)
const { docs } = await response.json()
const page = docs[0] ?? null
```

Collections:

| Path                 | Content                                 |
| -------------------- | --------------------------------------- |
| `/api/pages`         | Page sections and SEO                   |
| `/api/posts`         | Articles                                |
| `/api/media`         | Public file metadata                    |
| `/api/services`      | Services, when enabled                  |
| `/api/projects`      | Projects, when enabled                  |
| `/api/companies`     | Companies, when enabled                 |
| `/api/team`          | Team, when enabled                      |
| `/api/navigation`    | Main and footer menus                   |
| `/api/site-settings` | Public branding and contact information |

Lists return `docs`, `totalDocs`, `totalPages`, `page`, `hasNextPage` and
`nextPage`. Follow pagination instead of assuming the first page contains
everything. Use `depth=0` if relationship IDs are sufficient.

## GraphQL

Send a POST to `/api/graphql`. For example:

```graphql
query WebsitePages {
  Pages(locale: en, limit: 10) {
    docs {
      id
      title
      slug
    }
    totalDocs
  }
}
```

Collection, field and version access rules apply to both REST and GraphQL.
Inspect the generated schema when adding modules or fields.

## CORS and authentication

Server-to-server reads do not need browser CORS. For browser reads from a
separate frontend, set `CORS_ORIGINS=https://www.example.com`. This does not grant
editing access or trust that origin for authenticated admin writes.

Never place an administrator password, auth token or `PAYLOAD_SECRET` in public
JavaScript. The included preview route uses the CMS session on the same origin.
A separate website needs its own authenticated preview handshake; simply adding
`draft=true` must not be treated as authorization.

## Local API

Inside this Next.js application, use `getCMS()` and the helpers in
`src/lib/content.ts`. New visitor-facing calls must explicitly pass:

```ts
{
  overrideAccess: false,
  user: null,
  draft: false,
}
```

Privileged seed and migration scripts are the intentional exceptions. Do not
copy their access bypass into public route handlers.

## Rendering contract

`Page.layout` is a discriminated union keyed by `blockType`. Render each block
using a component matched to that value. Use generated `payload-types.ts` in
TypeScript consumers or generate equivalent client types from your API schema.

Treat API text as text, not raw HTML. Validate links before rendering. Preserve
image alternative text and dimensions. Existing frontends with caches should
define their own revalidation policy; the bundled frontend uses fresh reads.

## Published feed for a separate frontend

Use `/api/public/{website-identifier}/posts?locale=en&page=1&limit=12` on the central CMS origin. Add `slug=article-address` to retrieve one published article. `limit` is bounded at 100; locales are `en` and `ar`. Unknown websites return 404 and invalid queries return 400. Draft parameters, arbitrary filters and caller admin sessions cannot expand this public feed.

The response contains `docs`, `totalDocs`, `page`, `totalPages`, `hasNextPage` and `hasPrevPage`. Article fields are explicitly exported rather than exposing the internal Payload document. Rich-text content is structured JSON; frontends should render supported nodes without injecting arbitrary HTML. The public adapter currently exports ordinary URL links, not internal document relationships.

Media URLs use `/api/public/{website-identifier}/media/{filename}`. These reads verify website ownership before opening a runtime upload file. Image exports prefer the generated large variant. Files remain public website assets, not private document storage. This filesystem delivery endpoint assumes the existing persistent local media volume; an object-storage adapter will need matching delivery integration during infrastructure setup.

Responses for articles use `Cache-Control: no-store`; media may be cached for five minutes. This feed never returns drafts and is not an authenticated preview API. The Talaline pilot reads it server-side, requiring no administrator token in that website.

To run the isolated two-application test:

```sh
TALALINE_DIR=/absolute/path/to/talaline npm run test:talaline
```
