'use client'

import { Quote as QuoteIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { QUOTES } from '@/lib/types'

export function QuoteBanner() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(Math.floor(Math.random() * QUOTES.length))
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % QUOTES.length)
    }, 9000)
    return () => clearInterval(t)
  }, [])

  const quote = QUOTES[index]

  return (
    <div
      key={index}
      className="animate-fade-in-up flex items-start gap-2 text-pretty"
    >
      <QuoteIcon className="mt-0.5 size-4 shrink-0 text-primary/60" />
      <p className="font-serif text-sm italic text-muted-foreground">
        {quote.text}
        {quote.author && (
          <span className="ml-1 not-italic font-medium text-foreground/70">
            — {quote.author}
          </span>
        )}
      </p>
    </div>
  )
}
