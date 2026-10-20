import Link from 'next/link'
export default function NotFound() {
  return (
    <section className="section empty-home">
      <p className="eyebrow">404</p>
      <h1>
        Page not found.
        <br />
        <span lang="ar" dir="rtl">
          الصفحة غير موجودة
        </span>
      </h1>
      <p>This page may be unpublished or its address may have changed.</p>
      <Link className="button" href="/">
        Return home ↗
      </Link>
    </section>
  )
}
