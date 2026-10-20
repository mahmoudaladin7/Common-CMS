# Contributing

Use Node 22 LTS, install with `npm ci`, and run `npm run setup`. Make changes on a
branch. Keep schema, access policy and rendering changes together when they form
one feature.

Before proposing a change:

```bash
npm run generate
npm run format
npm run check
npm run test:integration
npm run build
```

If the schema changes, generate and review a migration. Test on an isolated
database and include the migration, generated types and import map in the PR.
Explain the problem, resulting behavior and verification.

Use short modules, descriptive names and strict types. Prefer the existing
shared fields and access rules. Comments should explain decisions and
non-obvious constraints rather than repeat the code.

Add meaningful tests when changing permissions, publishing, validation,
localization or data migration behavior. Do not commit secrets, runtime files,
client content or private uploads.

For security reports, follow `SECURITY.md` rather than a public issue containing
credentials or exploit details.
