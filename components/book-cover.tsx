'use client'

import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookCoverProps {
  src?: string
  alt: string
  className?: string
}

/** Renders a book cover image, falling back to a cozy placeholder. */
export function BookCover({ src, alt, className }: BookCoverProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-md bg-secondary shadow-sm',
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src || '/placeholder.svg'}
          alt={alt}
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-secondary-foreground/70">
          <BookOpen className="size-6 opacity-60" />
          <span className="line-clamp-3 text-[10px] leading-tight font-medium">
            {alt}
          </span>
        </div>
      )}
    </div>
  )
}
