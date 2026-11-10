# Phase 1: multiple website workspaces

Common-CMS now runs a central Payload admin with website-owned content. English and Arabic localization and RTL rendering remain enabled.

## Start locally

Use Node 22.13+ and npm:

```sh
npm ci
npm run setup
npm run seed
npm run dev
```

Create the first Super Admin at `/admin` while access is restricted to your machine. Seeding never creates users or passwords. The idempotent seed creates Company A (`localhost`) and Company B (`127.0.0.1`), with separate English/Arabic pages, navigation and settings. Open `http://localhost:3000/en`, `http://localhost:3000/ar`, `http://127.0.0.1:3000/en` and `http://127.0.0.1:3000/ar`. The examples are fictional; replace hostnames and copy before production.

In Users, give each member website memberships with a role. Select the website in the admin navigation before editing. The first user is Super Admin. Existing `admin` users retain that platform role; the old `editor`/`viewer` platform values grant no website access by themselves.

| Role          | Scope            | Permissions                                                                                      |
| ------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| Super Admin   | Platform         | Create websites and users, assign memberships, manage all content                                |
| Website Admin | Assigned website | Edit/publish content and navigation, edit settings, manage/delete content and media              |
| Editor        | Assigned website | Create/edit/publish content, upload/edit media and edit navigation; no deletion or site settings |
| Viewer        | Assigned website | Read content, drafts and versions; preview                                                       |

In Phase 1, account creation and membership assignments remain with the Super Admin. A member can hold different roles on different websites. Website deletion and moving documents between websites are deliberately unavailable; they require an explicit migration process.

## Isolation contract

Pages, posts, optional directory collections, media, navigation, site settings and their versions carry a `tenant` relationship to Websites. Slugs are unique within a website; two websites may both have `home`. Navigation and settings are singleton collections per website, replacing the former globals. Their new API paths are `/api/navigation` and `/api/site-settings`.

Payload's multi-tenant plugin supplies the selector, field defaults, relationship pickers and membership field. Application access functions enforce per-website roles for REST, GraphQL and access-aware Local API calls. Validation also checks relationship ownership inside groups, arrays, blocks and supported rich-text relationships. Forging the website selector cookie does not grant membership. Draft saves and version restores obey the same ownership rules.

Public content is intentionally public, but each anonymous query is scoped to the registered request hostname. Unknown hosts fail closed. Public content reads expose published content only. Media remains public website material; authorized public delivery on a website's hostname is expected. This is not a private document vault. Do not expose the runtime media directory through a separate static server that bypasses Payload's access checks.

Authenticated users see only their assigned websites, even if another website has public content. The Super Admin sees all websites. Local API bypasses access by default in Payload: request-facing application code must use `overrideAccess: false`. Only trusted server code may supply `context.websiteID`; it is not an HTTP query parameter. Keep background jobs explicit about both scope and access.

The sample frontend resolves registered hostnames on every request. Its React `cache` helpers deduplicate within a request, not across websites. Draft previews validate membership first, set an HTTP-only website context cookie, and retain that scope through the English and Arabic routes. Exiting preview clears it. Sitemaps, metadata, navigation and content-section queries use the same resolved website.

## Upgrade an existing installation

1. Back up the database and media volume, and verify restoration on a copy.
2. Stop application writes. Run `npm ci`, `npm run generate`, `npm run build`, then `NODE_ENV=production npm run db:migrate` using the deployment environment and persistent database.
3. The migration creates two websites, assigns existing content, media, navigation, settings and revision history to Company A, and maps existing non-admin users to Company A with their old role. Company B starts empty.
4. Sign in as Super Admin and change the example domains to your real domains. Seed demo content only when wanted; do not run it blindly against a live client website.
5. Configure domain routing, HTTPS, `SERVER_URL`, allowed origins/CSRF and persistent volumes for the deployment. `SERVER_URL` remains the central CMS URL. Each Website domain is a hostname without a scheme, port or path. Both public websites must route to this application for the bundled frontend to serve them. External frontend consumers must forward the registered public hostname through a trusted proxy or implement their own server-side scoped integration.

The migration uses additive changes for former global tables so their localized child rows remain intact. Rollback to one website cannot safely merge duplicate slugs or client content; the down migration refuses and directs you to restore the backup. SQLite is retained in this milestone. PostgreSQL migration, MFA, delegated user invitations, full approval workflows and automatic website provisioning are separate work.

## Verification

```sh
npm run check
npm run test:integration
npm run test:migration
npm run format:check
npm run build
```

The integration suite runs on a temporary database and upload directory. It covers legacy editorial behavior, localization, direct IDs, forged filters and cookies, role escalation, website reassignment, version history/restores, media access and cross-website references. It also starts an isolated local Next server to exercise REST, GraphQL, preview and media handlers. The migration test starts from the old schema, inserts bilingual legacy data, upgrades, and checks content and role preservation. Neither test uses your development database.
