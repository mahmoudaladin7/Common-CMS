# Architecture

## Request flow

```text
Editor → Payload admin → collection schema + access rules → database / media
Visitor → Next.js route → access-aware Local API → published content → components
External website → REST or GraphQL → same access rules → published content
```

The collection configuration is the source of truth for validation, forms,
permissions and generated types. It avoids maintaining a second custom CRUD API
or duplicating the form schema in a separate frontend.

## Directory map

```text
src/
  cms.config.ts           Per-website configuration and enabled modules
  payload.config.ts       CMS composition, database, email, localization
  access/                 Reusable role/access policy
  collections/            Typed content schemas and user policy
  globals/                Navigation and site settings
  fields/                 Shared slug, link and SEO fields
  blocks/                 Composable page-section schemas
  components/admin/       Brand and workspace overview
  components/website/     Example rendering of the content contract
  lib/                    Query boundaries, metadata and input validation
  app/(payload)/          Payload admin and API route adapters
  app/(website)/          Public localized example website
  app/preview/            Authenticated draft-mode entry
  migrations/             Committed SQLite schema history
  payload-types.ts        Generated types; do not edit manually
scripts/                  Setup, seed and isolated integration-test runner
tests/                    Input validation and CMS integration checks
```

## Design principles

- **One source of truth:** schemas define the content contract.
- **Small policy functions:** access rules are explicit, reusable and tested.
- **Separate responsibilities:** branding, schema, permissions and rendering have
  different entry points. Domain behavior stays out of generic UI components.
- **Typed extension points:** projects retain project fields, companies retain
  company fields. Avoid an unvalidated “settings JSON” field for business data.
- **Progressive reuse:** fork for a website; move genuinely shared changes upstream.
  Do not generalize client-specific behavior before two websites need it.
- **Comments explain intent:** especially access overrides, first-admin creation,
  preview isolation and localized row IDs.

## Reading content safely

Payload's Local API defaults to bypassing access control. Website reads always
set `overrideAccess: false`. Normal website requests pass no CMS user, even if a
visitor happens to have an admin session. Preview mode additionally requires a
valid CMS session; a preview cookie alone grants no access.

Public read access for versioned content adds `_status = published`. User
accounts are never publicly readable. Media and global settings are public by
design; never put secrets or private documents there.

## Deliberate boundaries

- One database and user group per installation; no multi-tenant isolation layer.
- The bundled website performs fresh server reads, so publishing is immediately
  visible without a webhook/cache-invalidation dependency.
- Navigation and global settings update immediately and keep revision history.
  They do not have the page/article draft workflow.
- Content translations share a publication status. If a client requires approval
  per locale, design and test that workflow explicitly.
- No sales pipeline, payments, lead intake, analytics or deployment control UI.
- SQLite and local media make local setup simple. Production requires persistent
  disks or a deliberate database/storage adapter change.
