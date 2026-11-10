import type { ReactNode } from 'react'
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}
export function Arrow() {
  return (
    <Icon>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </Icon>
  )
}
export function Globe() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </Icon>
  )
}
export function PageIcon() {
  return (
    <Icon>
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zm0 0v5h5M9 12h6m-6 4h6" />
    </Icon>
  )
}
export function BlogIcon() {
  return (
    <Icon>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M7 9h10M7 13h5m-5 3h8" />
    </Icon>
  )
}
export function MediaIcon() {
  return (
    <Icon>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1.5" />
      <path d="m3 17 5-5 4 4 4-6 5 7" />
    </Icon>
  )
}
export function SettingsIcon() {
  return (
    <Icon>
      <path d="M4 7h16M4 17h16" />
      <rect x="7" y="4" width="4" height="6" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="14" width="4" height="6" rx="1" fill="currentColor" stroke="none" />
    </Icon>
  )
}
export function PlusIcon() {
  return (
    <Icon>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}
export function EyeIcon() {
  return (
    <Icon>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  )
}
