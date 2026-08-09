'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: number
  readOnly?: boolean
  className?: string
}

export function StarRating({
  value,
  onChange,
  size = 20,
  readOnly = false,
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`Valoración: ${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= active
        const star = (
          <Star
            width={size}
            height={size}
            className={cn(
              'transition-colors',
              filled ? 'text-gold' : 'text-muted-foreground/30',
            )}
            fill={filled ? 'currentColor' : 'none'}
          />
        )

        // In read-only mode render plain spans so this can be nested
        // safely inside other interactive elements (e.g. list rows).
        if (readOnly) {
          return (
            <span key={i} className="cursor-default">
              {star}
            </span>
          )
        }

        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange?.(i === value ? 0 : i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="cursor-pointer transition-transform hover:scale-110"
            aria-label={`${i} estrella${i > 1 ? 's' : ''}`}
          >
            {star}
          </button>
        )
      })}
    </div>
  )
}
