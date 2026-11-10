# Common CMS dashboard

The dashboard at `/admin` is now a custom Payload view, built around the daily task of choosing a website and working on its content.

- Website cards show only workspaces the signed-in user can access. Search filters them by name or domain.
- Opening a workspace updates Payload’s tenant selector and refreshes the server-rendered counts and recent activity. A default accessible website is selected on first visit.
- Pages, Blogs and Media open the existing content editors for that website. Preview opens the authenticated website preview. Settings appears for Website Admins and Super Admins. Only Super Admins see Add website.
- Editors get a Create a page action; viewers get Preview website. Users without memberships get an empty workspace state.
- English and Arabic interface copy, RTL layout, localized content, keyboard focus states, mobile layouts and reduced-motion preferences are supported. Payload’s account Language setting controls the interface; the Locale selector controls the language of the content being edited.

The visual system uses platform fonts, soft neutral surfaces, subtle borders, blue actions and restrained press/hover feedback. Website card artwork is a decorative workspace illustration, not a live screenshot of the public website. Counts and recent documents come from the database.

The existing Payload editors, authentication, role assignments and tenant enforcement remain in place. No schema migration is needed for the dashboard itself; apply the Phase 1 migration if upgrading from the original single-website version.

For a fresh local checkout:

```sh
npm ci
npm run setup
npm run seed
npm run dev
```

Open `/admin` locally and create your first Super Admin. See [multi-website setup](multi-website.md) for production migration and domain configuration.

Verification includes a production build, type checking, unit tests, the tenant-isolation integration suite and browser checks for website switching, content-editor scope, search/empty states, Arabic layout and 375px/1440px responsive layouts. The integration suite also checks that members cannot use a foreign website cookie to expose another website or unlock dashboard creation actions.
