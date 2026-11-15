# Security model

## Access boundaries

- First-user registration is available only while the user collection is empty.
  Claim that account on a private connection before exposing a new installation.
- The first account becomes Super Admin. Subsequent users default to Member;
  website memberships default to Viewer. Only Super Admins can assign platform
  roles, website memberships or account suspension.
- Website Editors can create, edit and publish their website's content and media.
  Website Admins can additionally delete content and manage website settings and
  navigation. Viewers have read and preview access only.
- Server-side website ownership filters apply to content, media, settings,
  navigation and revision history. Relationship validation rejects references to
  another website's records, including nested blocks and rich text.
- Suspended accounts cannot sign in; suspension clears their active sessions.
  The last active Super Admin cannot be suspended, demoted or deleted.
- Anonymous readers receive published content only.
- Preview requires an authenticated session on every read, not just a URL or cookie.
- Public content Local API calls explicitly enable access control. Internal
  privileged lookups are limited to resolving scope and authorization checks.
- The external website feed resolves a website identifier into a trusted scope
  and returns only published fields. Query parameters and administrator cookies
  cannot turn that endpoint into a private draft feed.
- Public user-account reads are denied; non-admin users can read only themselves.
- Uploads are public assets, not a confidential document vault. The public media
  endpoint verifies website ownership. HTML and SVG uploads are not enabled.
- The app rejects unsafe URLs in structured link fields.

Keep the CMS, dependencies and operating system patched. Restrict network access
where appropriate, terminate HTTPS correctly and apply edge rate limits. The
application locks sign-in for ten minutes after five failed attempts, uses
two-hour sessions and secure cookies in production, and configures CSRF trusted
origins. It does not implement MFA or a distributed rate-limiting service.

## Dependency overrides

`package.json` pins a current image processor and overrides three transitive
dependencies: Sass, DOMPurify, and the older esbuild used by
`@esbuild-kit/core-utils`. These address advisories in the otherwise selected
dependency tree. Revisit them when upgrading Payload; do not silently delete
them or apply a forceful major-version downgrade recommended by an audit tool.

## Credentials and data

Never commit `.env`, API credentials, databases, backups or uploaded media.
`npm run setup` generates a unique random secret. Seed scripts never create
users or passwords. Tests use disposable storage and random credentials.

Do not place confidential data in public website settings or media. Restrict operational
logs; without SMTP, development reset emails can be written to the console.

## Production work still required

The current SQLite and local-media implementation has local tenant-isolation
tests; this is not a completed production security audit. The planned
Vercel/Supabase deployment still requires PostgreSQL migrations, durable object
storage and verification of both against real hosted infrastructure. Supabase
database and storage access must not provide a route around CMS permissions.

MFA/access-gateway configuration, audit logging, broader API rate limiting,
availability monitoring, backup schedules and tested restores remain pending.
Password-reset delivery requires SMTP configuration. Bootstrap the first account
privately, keep deployment credentials server-side, and restrict staging access
until production verification is complete. The current public frontend feed
does not provide authenticated draft preview in Talaline's exact design.

## Reporting

When publishing this template, enable GitHub private vulnerability reporting and
use the repository's private reporting channel. Do not include credentials or
private client data in public issues. Each fork's maintainer is responsible for
providing a working private contact and applying relevant updates.
