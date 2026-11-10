import { cms } from '@/cms.config'

export function BrandIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" width="32" height="32" fill="none">
      <rect width="32" height="32" rx="9" fill="#1d1d1f" />
      <path d="M22 10H13a6 6 0 0 0 0 12h9M22 16h-8" stroke="#fff" strokeWidth="3" />
    </svg>
  )
}
export function Brand() {
  return (
    <div className="common-brand">
      <BrandIcon />
      <span>
        {cms.name}
        <small>CMS</small>
      </span>
    </div>
  )
}

export function SidebarBrand() {
  return (
    <a className="common-sidebar-brand" href="/admin" aria-label="Common CMS">
      <BrandIcon />
      <span>
        Common<small>CMS</small>
      </span>
    </a>
  )
}
