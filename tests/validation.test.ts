import test from 'node:test'
import assert from 'node:assert/strict'
import { isSafeHref, localizedHref, slugify, validateSlug } from '../src/lib/validation'

test('links reject executable schemes, control characters and external redirects disguised as paths', () => {
  for (const value of [
    'javascript:alert(1)',
    '//evil.test',
    '/\\evil.test',
    'data:text/html,test',
    ' javaScript:foo',
    '\nhttps://example.com',
  ]) {
    assert.equal(isSafeHref(value), false, value)
  }
  for (const value of [
    '/about',
    'https://example.com',
    'mailto:hello@example.com',
    'tel:+966123456789',
  ]) {
    assert.equal(isSafeHref(value), true, value)
  }
})
test('internal links preserve locale while external and already localized links stay intact', () => {
  assert.equal(localizedHref('/about', 'ar'), '/ar/about')
  assert.equal(localizedHref('/', 'en'), '/en')
  assert.equal(localizedHref('/en/about', 'ar'), '/en/about')
  assert.equal(localizedHref('https://example.com', 'ar'), 'https://example.com')
  assert.equal(localizedHref('javascript:alert(1)', 'en'), '#')
})
test('slugs support Arabic and protect application routes', () => {
  assert.equal(slugify('  Our Services! '), 'our-services')
  assert.equal(slugify('خدمات الشركة'), 'خدمات-الشركة')
  assert.equal(validateSlug('خدمات-الشركة', true), true)
  assert.equal(validateSlug('home', true), true)
  for (const slug of ['insights', 'admin', 'api', '../admin', 'two--words', 'hello/world']) {
    assert.notEqual(validateSlug(slug, true), true)
  }
})
