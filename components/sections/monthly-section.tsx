"use client"

import { useMemo } from "react"
import { CalendarDays, Heart } from "lucide-react"
import { useStore } from "@/lib/store"
import { booksByMonth } from "@/lib/selectors"
import { MONTHS_ES } from "@/lib/types"
import { BookCover } from "@/components/book-cover"
import { StarRating } from "@/components/star-rating"
import { SectionHeader } from "./section-header"

export function MonthlySection() {
  const { data, setFavorite } = useStore()
  const year = data.activeYear
  const byMonth = useMemo(() => booksByMonth(data.books, year), [data.books, year])

  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="Resumen mensual"
        subtitle={`Mes a mes de tu año ${year}. Elegí tu libro favorito de cada mes.`}
        icon={<CalendarDays className="size-5" aria-hidden />}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MONTHS_ES.map((month, i) => {
          const books = byMonth[i] ?? []
          const favKey = `${year}-${i}`
          const favId = data.favorites[favKey]
          const favBook = favId ? books.find((b) => b.id === favId) : undefined
          return (
            <div key={month} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-foreground">{month}</h3>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                  {books.length} {books.length === 1 ? "libro" : "libros"}
                </span>
              </div>

              {favBook && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 p-2.5">
                  <BookCover src={favBook.coverUrl} alt={favBook.title} className="h-16 w-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                      <Heart className="size-3 fill-current" aria-hidden />
                      Favorito del mes
                    </p>
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{favBook.title}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{favBook.author}</p>
                  </div>
                </div>
              )}

              {books.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Sin lecturas terminadas este mes.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {books.map((b) => {
                    const isFav = favId === b.id
                    return (
                      <li key={b.id} className="flex items-center gap-3 rounded-xl bg-muted/40 p-2">
                        <BookCover src={b.coverUrl} alt={b.title} className="h-14 w-10 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium text-foreground">{b.title}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">{b.author}</p>
                          <StarRating value={b.rating} size={12} className="mt-0.5" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFavorite(year, i, isFav ? null : b.id)}
                          aria-label={isFav ? "Quitar de favorito del mes" : "Marcar como favorito del mes"}
                          aria-pressed={isFav}
                          className={`shrink-0 rounded-full p-1.5 transition ${
                            isFav ? "text-primary" : "text-muted-foreground hover:text-primary"
                          }`}
                        >
                          <Heart className={`size-4 ${isFav ? "fill-current" : ""}`} aria-hidden />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
