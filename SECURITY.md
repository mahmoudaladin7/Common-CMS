# Security model

## Access boundaries

- First-user registration is available only while the user collection is empty.
  Claim that account on a private connection before exposing a new installation.
- New users default to viewer. Only an administrator can grant another role.
- Editors can create, edit and publish content and update navigation.
- Only administrators can delete content, manage other accounts or edit site settings.
- Anonymous readers receive published content only.
- Preview requires an authenticated session on every read, not just a URL or cookie.
- Website Local API calls explicitly enable access control.
- Public user-account reads are denied; non-admin users can read only themselves.
- Uploads are public assets. HTML and SVG uploads are not enabled.
- The app rejects unsafe URLs in structured link fields.

Keep the CMS, dependencies and operating system patched. Restrict network access
where appropriate, terminate HTTPS correctly and apply edge rate limits. The
application uses Payload's login lockout behavior; it does not implement MFA or
a distributed rate-limiting service.

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

Do not place confidential data in public globals or media. Restrict operational
logs; without SMTP, development reset emails can be written to the console.

The single-site installation boundary is deliberate. A shared multi-tenant
installation needs additional authorization, tenant-aware storage and tests.

## Reporting

When publishing this template, enable GitHub private vulnerability reporting and
use the repository's private reporting channel. Do not include credentials or
private client data in public issues. Each fork's maintainer is responsible for
providing a working private contact and applying relevant updates.
