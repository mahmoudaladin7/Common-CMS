/** Reject executable schemes, protocol-relative URLs and control characters. */
export function isSafeHref(value: unknown): value is string {
  if (typeof value !== 'string' || value !== value.trim() || /[\u0000-\u0020\u007f\\]/.test(value))
    return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    const url = new URL(value)
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)
  } catch {
    return false
  }
}

export const validateHref = (value: unknown) =>
  !value || isSafeHref(value) || 'Use a site path (/about), https:// URL, mailto: or tel: link.'

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

export const reservedPageSlugs = new Set([
  'admin',
  'api',
  'preview',
  'exit-preview',
  'insights',
  'items',
  'en',
  'ar',
])

export function validateSlug(value: unknown, page = false): true | string {
  if (typeof value !== 'string' || !/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(value)) {
    return 'Use letters and numbers separated by single hyphens, with no spaces or slashes.'
  }
  if (page && reservedPageSlugs.has(value)) return 'This address is reserved by the application.'
  return true
}

export function localizedHref(href: string, locale: string): string {
  if (!isSafeHref(href)) return '#'
  if (!href.startsWith('/') || /^\/(en|ar)(\/|$)/.test(href)) return href
  return `/${locale}${href === '/' ? '' : href}`
}
