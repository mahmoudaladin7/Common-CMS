import type { Media } from '@/payload-types'

export function MediaImage({
  media,
  className,
  eager = false,
}: {
  media: number | Media | null | undefined
  className?: string
  eager?: boolean
}) {
  if (!media || typeof media !== 'object' || !media.url || !media.mimeType?.startsWith('image/'))
    return null
  return (
    <img
      className={className}
      src={media.sizes?.large?.url || media.url}
      alt={media.alt}
      width={media.sizes?.large?.width || media.width || undefined}
      height={media.sizes?.large?.height || media.height || undefined}
      loading={eager ? 'eager' : 'lazy'}
    />
  )
}
