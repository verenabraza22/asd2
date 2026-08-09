'use client'

import { Check, Compass, Loader2, Plus, Sparkles, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BookCover } from '../book-cover'
import {
  getRecommendations,
  readerProfile,
  type Suggestion,
} from '@/lib/recommend'
import { useStore } from '@/lib/store'
import { SectionHeader } from './section-header'

type Phase = 'idle' | 'loading' | 'done' | 'error'

export function RecommendSection() {
  const { data, addWishlist } = useStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [added, setAdded] = useState<Set<string>>(new Set())

  const profile = useMemo(() => readerProfile(data.books), [data.books])
  const hasEnough = profile.sampleSize > 0

  async function loadRecommendations() {
    setPhase('loading')
    try {
      const results = await getRecommendations(
        profile,
        data.books,
        data.wishlist,
      )
      setSuggestions(results)
      setPhase(results.length ? 'done' : 'error')
    } catch {
      setPhase('error')
    }
  }

  function addToPending(s: Suggestion) {
    addWishlist({
      type: 'book',
      title: s.title,
      author: s.author,
      coverUrl: s.coverUrl,
      pages: s.pages,
      genre: s.genre,
      synopsis: s.synopsis,
      checked: false,
    })
    setAdded((prev) => new Set(prev).add(s.title + s.author))
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <SectionHeader
        title="Recomiéndame"
        subtitle="Sugerencias basadas en los libros que más te gustaron (4 y 5 estrellas)."
        icon={<Compass className="size-5" aria-hidden />}
      />

      {!hasEnough ? (
        <div className="rounded-3xl bg-card/60 py-16 text-center shadow-sm">
          <Sparkles className="mx-auto size-8 text-primary/50" aria-hidden />
          <p className="mt-3 font-serif text-lg font-semibold">
            Necesitamos conocer tus gustos
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
            Valorá algunos libros con 4 o 5 estrellas en tu glosario y volvé
            para descubrir lecturas hechas a tu medida.
          </p>
        </div>
      ) : (
        <>
          {/* Reader taste profile */}
          <div className="rounded-3xl bg-card/70 p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">
              Tu perfil lector
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <TasteGroup label="Géneros favoritos" items={profile.topGenres} />
              <TasteGroup label="Autores que amás" items={profile.topAuthors} />
            </div>
            <button
              type="button"
              onClick={loadRecommendations}
              disabled={phase === 'loading'}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {phase === 'loading' ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
              {phase === 'done' ? 'Buscar de nuevo' : 'Buscar recomendaciones'}
            </button>
          </div>

          {phase === 'error' && (
            <div className="flex items-center gap-2 rounded-2xl bg-card/70 p-4 text-sm text-muted-foreground shadow-sm">
              <TriangleAlert className="size-4 shrink-0 text-primary" aria-hidden />
              No encontramos sugerencias ahora mismo. Probá de nuevo en unos
              segundos.
            </div>
          )}

          {phase === 'loading' && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl bg-muted/60"
                />
              ))}
            </div>
          )}

          {phase === 'done' && (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {suggestions.map((s) => {
                const key = s.title + s.author
                const isAdded = added.has(key)
                return (
                  <li
                    key={key}
                    className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm transition hover:shadow-md"
                  >
                    <BookCover
                      src={s.coverUrl}
                      alt={s.title}
                      className="aspect-[2/3] w-full rounded-none"
                    />
                    <div className="flex flex-1 flex-col p-3">
                      <span className="w-fit rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        {s.reason}
                      </span>
                      <p className="mt-2 line-clamp-2 font-semibold leading-tight text-foreground">
                        {s.title}
                      </p>
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {s.author}
                      </p>
                      <button
                        type="button"
                        onClick={() => addToPending(s)}
                        disabled={isAdded}
                        className={`mt-3 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${
                          isAdded
                            ? 'bg-secondary text-secondary-foreground'
                            : 'bg-primary text-primary-foreground hover:opacity-90'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="size-3.5" aria-hidden />
                            En pendientes
                          </>
                        ) : (
                          <>
                            <Plus className="size-3.5" aria-hidden />
                            Agregar a pendientes
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function TasteGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="min-w-[8rem]">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.length ? (
          items.map((i) => (
            <span
              key={i}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              {i}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">Aún sin datos</span>
        )}
      </div>
    </div>
  )
}
