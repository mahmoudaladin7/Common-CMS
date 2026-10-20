# Verification record

Verified locally on October 20, 2026 with Node 26.8.1 and npm 11.19.0 on macOS.
The repository recommends Node 22 LTS and includes a Node 22 GitHub CI workflow.
That remote workflow has not been run because the package has not been uploaded.

## Automated checks

- Strict TypeScript checking passed.
- Three input-validation tests passed.
- Twenty-three isolated CMS integration assertions passed.
- Production build passed without application build warnings.
- The initial production migration succeeded on a fresh SQLite database.
- The final installed dependency tree reported zero known vulnerabilities.

Integration assertions cover first-administrator setup, public/draft isolation,
preserving live content while saving a draft, authenticated draft reads, editor
and viewer restrictions, role-escalation prevention, user-account privacy, last
administrator protection, site settings access, independent Arabic/English
content, unique slugs, revision history, image upload/thumbnail generation,
rejecting HTML uploads, and preserving data when modules are disabled/re-enabled.

## HTTP checks

Confirmed successful English and Arabic website routes, about/contact/articles
pages, sitemap and robots responses. REST and GraphQL returned the expected
published content. Unpublished projects were excluded even with `draft=true`.
Anonymous users received 403 for user records and 401 for authenticated preview.
A missing page returned 404.

## Browser checks

Using an explicitly approved temporary local administrator:

1. Signed in through the CMS login screen.
2. Inspected the custom dashboard, collection navigation and page editor.
3. Edited the homepage heading and verified an autosaved draft.
4. Opened authenticated preview and saw the new draft heading.
5. Exited preview and saw the original published heading.
6. Published the revision through the editor.
7. Confirmed the public page showed the newly published heading.
8. Confirmed the Arabic content remained separate.

Checked the website at 1440 px and Arabic at 375 px, plus the admin dashboard
at 375 px. No horizontal page overflow was observed. Screenshots are in
`docs/screenshots/`; the “published-test” screenshot intentionally shows a
temporary test heading, not starter seed content.

The preview account, its credentials and disposable database are not included
in the source package. The preview server was stopped after testing.

## Limits

Docker packaging, a live HTTPS hosting environment, SMTP delivery, backup restore,
PostgreSQL/object-storage adaptations, and external production deployment were
not exercised. Configure and verify these for each website. The browser check
does not constitute a full accessibility audit or a penetration test.
