'use client'

import { Loader2, Search, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { searchBooks, type BookMetadata } from '@/lib/google-books'
import { BookCover } from './book-cover'

interface BookSearchProps {
  onSelect: (meta: BookMetadata) => void
  placeholder?: string
}

type Status = 'idle' | 'ok' | 'empty' | 'error'

/** Live Google Books search that autocompletes metadata on select. */
export function BookSearch({ onSelect, placeholder }: BookSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookMetadata[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (query.trim().length < 3) {
      setResults([])
      setStatus('idle')
      setLoading(false)
      return
    }
    setLoading(true)
    timer.current = setTimeout(async () => {
      const res = await searchBooks(query)
      setResults(res.results)
      setStatus(res.status)
      setLoading(false)
      setOpen(true)
    }, 400)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [query])

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder ?? 'Buscar por título o autor…'}
          className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && !loading && status === 'error' && (
        <div className="animate-fade-in-up absolute z-50 mt-2 w-full rounded-xl border border-border bg-popover p-3 shadow-lg">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <TriangleAlert className="size-4 shrink-0 text-primary" aria-hidden />
            No pudimos buscar ahora. Podés cargar el libro manualmente abajo.
          </p>
        </div>
      )}
      {open && !loading && status === 'empty' && (
        <div className="animate-fade-in-up absolute z-50 mt-2 w-full rounded-xl border border-border bg-popover p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">
            Sin resultados. Probá otro término o cargalo manualmente.
          </p>
        </div>
      )}
      {open && results.length > 0 && (
        <ul className="animate-fade-in-up absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-border bg-popover p-1.5 shadow-lg">
          {results.map((r, i) => (
            <li key={`${r.title}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(r)
                  setQuery('')
                  setResults([])
                  setOpen(false)
                }}
                className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
              >
                <BookCover
                  src={r.coverUrl}
                  alt={r.title}
                  className="h-16 w-11 shrink-0"
                />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="line-clamp-2 block text-sm font-semibold">
                    {r.title}
                  </span>
                  <span className="line-clamp-1 block text-xs text-muted-foreground">
                    {r.author}
                  </span>
                  {r.pages && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {r.pages} págs.
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
