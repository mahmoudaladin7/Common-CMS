# First pilot: Talaline

The core shared CMS workflows are implemented and verified locally. Talaline (`https://www.talaline.sa/`) is the chosen first pilot. Its GitHub source (`wbhc-sw/talaline`, inspected at commit `35cac4a`) now has a prepared, locally verified news integration. The live site has not been changed. Other websites can use the same CMS after the pilot succeeds.

## Ready in the application

- Website-owned pages, blogs, uploads, settings and navigation with server-side isolation.
- New website workspaces automatically receive empty navigation and their own settings. No demo pages or deployment are created automatically.
- A guided bilingual blog workspace, a writing/details/search editor, private autosaved drafts, preview, publishing, unpublishing and revision history.
- Stable blog addresses and original publication dates when a post is edited. Public author names default to the writer name and remain editable.
- A simplified employee sidebar showing Pages, Blog posts and Media. Website Admins also see Navigation and Site settings. Super Admins retain the full management navigation.
- Account creation, explicit website assignments, readable role descriptions and suspension. Suspension clears active sessions and rejects sign-in. Restoring access requires a Super Admin; the last active Super Admin cannot be disabled, demoted or deleted.
- English/Arabic content, interface labels and RTL layouts. Website access checks apply to both languages.

Website Admins manage their website’s content and settings; only Super Admins assign accounts and memberships. Editors can publish directly. A separate author/reviewer approval workflow, invitations, scheduling and per-feature permissions are not part of this pilot milestone.

## Database setup is the next stage

Development and isolated tests still use SQLite. No hosted database, production database credentials or live Talaline changes were created during this milestone.

Before provisioning, select the CMS hosting target and database provider. The planned production move is PostgreSQL. That stage includes the Payload PostgreSQL adapter, PostgreSQL-specific migrations, data transfer if required, and verification against the actual PostgreSQL instance. The committed SQLite migrations cannot be run directly on PostgreSQL.

Talaline’s source has been inspected. It uses Next.js 16 with coded English/Arabic pages and an existing News & Insights placeholder. The pilot preserves those coded pages and adds request-time listing/article templates backed by the CMS’s published, website-scoped public feed. Talaline configuration requires only the CMS origin and website identifier; no database credentials or administrator tokens are used there. Unconfigured deployments retain their current coming-soon page.

The isolated two-application test verifies publication, updates, unpublication, both languages, public media ownership and sitemap entries without rebuilding. This is a local integration against temporary data, not a production database or live-domain connection. The CMS’s bundled preview still serves private drafts; previewing them in Talaline’s exact frontend requires a separate authenticated preview bridge. Persistent publication-triggered caching is also not implemented.

The first connection should be a staging copy: configure one website record, trusted origins, storage, password-reset email and a small set of real test accounts. Test an English/Arabic post from creation through preview, publication and unpublication on the actual frontend. Verify both authorized and unauthorized accounts. Only then promote the connection to the live domain and repeat onboarding for the other websites.

## Deployment and migration notes

Existing SQLite installations must run the new account-access migration with their database backup in place. The migration adds the account suspension field and preserves existing account access. Moving blog fields into unnamed tabs changes their presentation without moving the stored fields.

For local preview on a non-default port, set `SERVER_URL` to the exact origin, for example:

```sh
SERVER_URL=http://127.0.0.1:3015 npm run dev -- --port 3015
```

Default development origins `localhost:3000` and `127.0.0.1:3000` are supported. Production accepts the configured CMS origin; do not disable CSRF protection to fix an origin mismatch.

The current frontend renders database content on request, so publication does not require deployment. Publication-triggered persistent caching has not been added. Infrastructure-specific backups/restore, MFA, audit logging, additional rate limiting and monitoring remain part of production hardening before a public rollout. Keep staging access restricted while completing that work.
