'use client'

import {
  BookCheck,
  Check,
  Compass,
  Loader2,
  Plus,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { BookCover } from '../book-cover'
import {
  getRecommendations,
  readerProfile,
  suggestionKey,
  type Suggestion,
} from '@/lib/recommend'
import { useStore } from '@/lib/store'
import { SectionHeader } from './section-header'

type Phase = 'idle' | 'loading' | 'done' | 'error'

const VISIBLE_COUNT = 8

function keyOf(s: Suggestion) {
  return suggestionKey(s.title, s.author)
}

export function RecommendSection() {
  const {
    data,
    addWishlist,
    addRecommendPref,
    removeRecommendPref,
    dismissSuggestion,
  } = useStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [pool, setPool] = useState<Suggestion[]>([])
  const [shownKeys, setShownKeys] = useState<string[]>([])
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [markedRead, setMarkedRead] = useState<Set<string>>(new Set())
  const [attempt, setAttempt] = useState(0)

  const baseProfile = useMemo(() => readerProfile(data.books), [data.books])
  const extraGenres = data.recommendPrefs?.extraGenres ?? []
  const extraAuthors = data.recommendPrefs?.extraAuthors ?? []

  const profile = useMemo(() => {
    const genres = [...baseProfile.topGenres]
    for (const g of extraGenres) if (!genres.includes(g)) genres.push(g)
    const authors = [...baseProfile.topAuthors]
    for (const a of extraAuthors) if (!authors.includes(a)) authors.push(a)
    return { ...baseProfile, topGenres: genres, topAuthors: authors }
  }, [baseProfile, extraGenres, extraAuthors])

  const hasEnough =
    baseProfile.sampleSize > 0 || extraGenres.length > 0 || extraAuthors.length > 0

  const shown = shownKeys
    .map((k) => pool.find((s) => keyOf(s) === k))
    .filter((s): s is Suggestion => Boolean(s))

  async function loadRecommendations() {
    setPhase('loading')
    setAdded(new Set())
    setMarkedRead(new Set())
    const currentAttempt = attempt
    try {
      const results = await getRecommendations({
        genres: profile.topGenres,
        authorsToSearch: profile.topAuthors,
        library: data.books,
        wishlist: data.wishlist,
        dismissed: data.dismissedSuggestions ?? [],
        attempt: currentAttempt,
      })
      setPool(results)
      setShownKeys(results.slice(0, VISIBLE_COUNT).map(keyOf))
      setPhase(results.length ? 'done' : 'error')
      setAttempt(currentAttempt + 1)
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
    setAdded((prev) => new Set(prev).add(keyOf(s)))
  }

  function replaceWithNext(removedKey: string) {
    setShownKeys((prev) => {
      const without = prev.filter((k) => k !== removedKey)
      const used = new Set([...without, removedKey])
      const next = pool.find((s) => !used.has(keyOf(s)))
      return next ? [...without, keyOf(next)] : without
    })
  }

  function markAsRead(s: Suggestion) {
    const key = keyOf(s)
    dismissSuggestion(key)
    setMarkedRead((prev) => new Set(prev).add(key))
    replaceWithNext(key)
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
            Valorá algunos libros con 4 o 5 estrellas en tu glosario, o agregá
            géneros y autores manualmente abajo, para descubrir lecturas
            hechas a tu medida.
          </p>
          <div className="mx-auto mt-6 max-w-sm space-y-4 text-left">
            <TagEditor
              label="Géneros favoritos"
              placeholder="Ej: Fantasía"
              tags={extraGenres}
              onAdd={(v) => addRecommendPref('genre', v)}
              onRemove={(v) => removeRecommendPref('genre', v)}
            />
            <TagEditor
              label="Autores favoritos"
              placeholder="Ej: Gabriel García Márquez"
              tags={extraAuthors}
              onAdd={(v) => addRecommendPref('author', v)}
              onRemove={(v) => removeRecommendPref('author', v)}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Reader taste profile */}
          <div className="rounded-3xl bg-card/70 p-5 shadow-sm">
            <p className="text-sm font-medium text-foreground">
              Tu perfil lector
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <TasteGroup label="Géneros favoritos" items={baseProfile.topGenres} />
              <TasteGroup label="Autores que amás" items={baseProfile.topAuthors} />
            </div>

            <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
              <TagEditor
                label="Agregar otro género"
                placeholder="Ej: Fantasía"
                tags={extraGenres}
                onAdd={(v) => addRecommendPref('genre', v)}
                onRemove={(v) => removeRecommendPref('genre', v)}
              />
              <TagEditor
                label="Agregar otro autor"
                placeholder="Ej: Isabel Allende"
                tags={extraAuthors}
                onAdd={(v) => addRecommendPref('author', v)}
                onRemove={(v) => removeRecommendPref('author', v)}
              />
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
              {shown.map((s) => {
                const key = keyOf(s)
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
                      <div className="mt-3 flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => addToPending(s)}
                          disabled={isAdded}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${
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
                        <button
                          type="button"
                          onClick={() => markAsRead(s)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition hover:bg-muted"
                          title="Ya lo leí, no lo agregues a la biblioteca"
                        >
                          <BookCheck className="size-3.5" aria-hidden />
                          Ya lo leí
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {phase === 'done' && shown.length === 0 && (
            <div className="rounded-2xl bg-card/70 p-6 text-center text-sm text-muted-foreground shadow-sm">
              Ya viste todas las sugerencias de esta tanda. Tocá "Buscar de
              nuevo" para descubrir más.
            </div>
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

function TagEditor({
  label,
  placeholder,
  tags,
  onAdd,
  onRemove,
}: {
  label: string
  placeholder: string
  tags: string[]
  onAdd: (value: string) => void
  onRemove: (value: string) => void
}) {
  const [value, setValue] = useState('')

  function submit() {
    const v = value.trim()
    if (!v) return
    onAdd(v)
    setValue('')
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
            >
              {t}
              <button
                type="button"
                onClick={() => onRemove(t)}
                aria-label={`Quitar ${t}`}
                className="rounded-full p-0.5 hover:bg-foreground/10"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submit())}
          placeholder={placeholder}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="flex shrink-0 items-center justify-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition hover:bg-muted disabled:opacity-40"
        >
          <Plus className="size-3.5" aria-hidden />
          Agregar
        </button>
      </div>
    </div>
  )
}
