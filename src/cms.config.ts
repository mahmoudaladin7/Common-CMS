/**
 * Start here when adapting the template to a new website.
 * Keep client-specific content in the database and reusable behavior in code.
 * One clone = one website, database, media directory, and set of CMS users.
 */
export const cms = {
  name: 'Common',
  description: 'A shared foundation. A website of your own.',
  locales: [
    { code: 'en' as const, label: 'English', rtl: false },
    { code: 'ar' as const, label: 'العربية', rtl: true },
  ],
  defaultLocale: 'en' as const,
  // Disable a module to hide it and deny API access, without deleting its data.
  modules: {
    services: true,
    projects: true,
    companies: true,
    team: true,
  },
}

export type Locale = (typeof cms.locales)[number]['code']
export const isLocale = (value: string): value is Locale =>
  cms.locales.some((locale) => locale.code === value)
