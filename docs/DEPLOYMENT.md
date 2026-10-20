# Deployment and operations

## Supported default

The default is one Node.js server with a **persistent SQLite database and media
directory**. Use a VM or container platform with persistent disks. This local
filesystem configuration is not suitable for ephemeral serverless storage or
multiple independently writing replicas.

Set runtime environment variables:

```dotenv
NODE_ENV=production
SERVER_URL=https://cms.example.com
PAYLOAD_SECRET=<at-least-32-random-characters>
DATABASE_URL=file:/var/lib/common-cms/cms.db
MEDIA_DIR=/var/lib/common-cms/media
```

`SERVER_URL` is the origin serving both admin and the example website. It controls
CMS URLs, canonical metadata and CSRF trust. Use HTTPS in production: production
session cookies are secure. A local production smoke test can check anonymous
routes over HTTP, but authenticated browser flows need HTTPS.

Generate a secret with `openssl rand -hex 32`, or reuse the unique value created
by `npm run setup` for this installation only. Ensure the process can write the
database directory and media folder. Keep secrets outside Git.

## Database migrations

Development synchronizes schema automatically. Production explicitly disables
schema push and uses committed migrations.

After a schema change:

```bash
npm run generate
npm run db:create-migration
```

Review the generated SQL and test on a disposable database. Back up production
before applying schema changes. Deploy the matching code and migrations together:

```bash
npm ci
npm run build
NODE_ENV=production npm run db:migrate
npm start
```

The included initial migration creates the default schema. Do not run it blindly
against an existing development database already created by schema push.
Provision a fresh production database or deliberately reconcile migration
history using Payload's documented migration workflow. Do not edit previously
applied migrations; create a new one.

## Container example

The repository includes `Dockerfile` and `compose.yaml`. Docker is optional.

```bash
npm run setup
# Edit .env for the real HTTPS origin, secret and SMTP.
docker compose build
docker compose run --rm cms npm run db:migrate
docker compose up -d
```

The named volume persists `/data/cms.db` and `/data/media`. The service binds to
localhost so it can sit behind an HTTPS reverse proxy. Configure the proxy to
forward the original host/protocol, support upload bodies of at least 10 MB,
and rate-limit public login/reset endpoints. Provision the first administrator
through a restricted connection before opening the service to other users.

The image retains source and CLI dependencies so migrations are executable.
It favors predictable operation over the smallest possible image.

## SMTP

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM_ADDRESS` and `SMTP_FROM_NAME`.
If authentication is required, set `SMTP_USER` and `SMTP_PASSWORD`. Use
`SMTP_SECURE=true` for implicit TLS, usually port 465; use `false` for a
STARTTLS-capable provider, usually port 587.

Without SMTP, Payload uses its development console email behavior. Real password
reset delivery is not configured. Do not expose production console logs to users.

## Backups

Back up the database, media directory and configuration separately. For SQLite,
use its online backup mechanism or stop the CMS before copying the database
and associated journal files. Copying a live database file casually can produce
an inconsistent backup.

Restore into a separate environment and verify sign-in, published pages, draft
history and uploaded images. A backup is not verified until a restore is tested.
Keep the installation's secret in a secure secret manager.

## Other databases and object storage

For a hosted PostgreSQL deployment:

1. Install `@payloadcms/db-postgres` at the same version as `payload`.
2. Replace `sqliteAdapter` in `src/payload.config.ts` with `postgresAdapter`.
3. Configure the database connection through environment variables.
4. Generate **new PostgreSQL migrations** in a separate migration history.
5. Migrate content explicitly; SQLite files/SQL migrations are not portable
   PostgreSQL backups.

For object storage, add a supported Payload storage adapter, configure the media
collection, and use least-privilege credentials through the environment.
Re-run upload, access and preview tests after changing adapters.

These are adaptation instructions; PostgreSQL and object storage are not already
configured in this starter.

## Launch checklist

- Replace starter copy, example email links and brand assets.
- Create unique administrator accounts and verify roles.
- Confirm English and Arabic content and link destinations.
- Confirm SMTP delivery and session behavior over HTTPS.
- Apply migrations and verify persistent database/media storage.
- Configure backups, a restore procedure, logs and availability monitoring.
- Run the repository checks, build, dependency audit and a browser publishing test.

GitHub CI checks types, tests, generated files, build and a fresh migration.
The hosting platform, reverse proxy, SMTP and backup schedule remain deployment
configuration for each website.
