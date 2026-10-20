# Customize a website

## Start with the shared foundation

Clone the template into a separate repository for each website. Give it its own
environment, secret, database and media storage. Change the workspace name in
`src/cms.config.ts`, then set the public brand through **Site settings**.

```ts
modules: {
  services: true,
  projects: false,
  companies: true,
  team: true,
}
```

Disabling a module hides its admin collection, denies access through the API and
removes its option in new content-collection blocks. Its data and generated types
remain intact, so it can be re-enabled later without a destructive migration.
Existing website blocks for disabled modules render nothing; remove or replace
those blocks before disabling. Regenerate types/import maps after configuration
changes. Permanently removing a collection from the schema is a separate
developer change that requires reviewing references and a database migration.

## Example: a holding company website

The public structure of [WBHC](https://www.wbhc.com.sa/en) suggests:

- **Pages:** home, about, investment approach, contact, policies.
- **Companies:** group businesses, sector, summary, logo and external website.
- **Services:** group support and investment services.
- **Team:** group leadership and role descriptions.
- **Articles:** news and insights.

Enable companies, services and team. Disable projects unless needed. Build
“Our companies” with a collection block targeting `companies`. Add any
client-specific fields, such as investment stage, to `Companies` rather than
adding them to every content type.

## Example: a real estate development website

The public structure of [Smart Details](https://www.smartdetails.sa/en) suggests:

- **Pages:** home, about, partnerships, contact and policies.
- **Projects:** development sector, location, stage, images and gallery.
- **Services:** development, advisory and property services.
- **Team:** leadership profiles.
- **Articles:** property insights.

Enable projects, services and team. Disable companies unless partner or subsidiary
profiles need dedicated entries. Add structured fields such as city, completion
date or area only where they are useful to the website.

These are implementation starting points based on public pages, not claims about
either website's current backend. No existing website was modified or imported.

## Add a field

For a completion year in `src/collections/Directory.ts`, add to `Projects`:

```ts
{ name: 'completionYear', type: 'number', min: 1900, max: 2200 }
```

Then:

```bash
npm run generate
npm run db:create-migration
npm run check
npm run test:integration
```

Render the field in `components/website/Document.tsx`, or use it in your separate
frontend. Generated types make missing integration points visible at build time.

## Add a page block

1. Add a named `Block` schema in `src/blocks/index.ts`.
2. Register it in `pageBlocks`.
3. Add the matching case to `components/website/Blocks.tsx`.
4. Regenerate types and migrations.
5. Create an example in the admin; verify both languages and mobile layouts.

Keep fields purposeful. A testimonial block might contain quote, person, role
and portrait rather than a free-form HTML blob. Avoid allowing arbitrary scripts
or unsanitized HTML.

## Brand and visual styles

- Admin logo and icon: `components/admin/Brand.tsx`.
- Admin introduction and overview: `components/admin/Welcome.tsx`, `Overview.tsx`.
- Admin colors/layout: `app/(payload)/custom.css`.
- Website design tokens: top of `app/(website)/[locale]/website.css`.
- Public logo/name/contact information: **Site settings**.
- Navigation links: **Navigation**.

The example website is deliberately small. Replace its rendering while preserving
the content schema if a client needs a more elaborate visual design.

## Languages

Translatable fields use `localized: true`; structural fields such as a slug,
module selection and page-block order are shared. English is the fallback if a
translated field is missing. Slugs can contain Arabic letters but are shared
across locales. The example routes use `/en` and `/ar`.

Adding another language requires updating `cms.config.ts`, language switching,
internal-link localization, and any interface copy in the example frontend.
Changing only the locale list is not enough for a fully translated website.

## Keep upgrades manageable

Maintain a clean template upstream. Carry reusable changes there and merge them
into client repositories deliberately. Do not share database files between sites.
Keep Payload packages on the same version. Review dependency overrides before
upgrading, then run type generation, access-control tests and a production build.
