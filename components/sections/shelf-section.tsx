'use client'

import { ChevronLeft, ChevronRight, Sprout } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BookDetail } from '../book-detail'
import { BookForm } from '../book-form'
import { finishedInYear } from '@/lib/selectors'
import { spineColor, spineTextColor } from '@/lib/spine'
import { useStore } from '@/lib/store'
import type { Book } from '@/lib/types'
import { SectionHeader } from './section-header'

const PER_SHELF = 5
const ROW_H = 176
const LINE = 11
const PAD = 28
const BADGE = 34
const SHELVES_PER_PAGE = 4
const PER_PAGE = PER_SHELF * SHELVES_PER_PAGE

export function ShelfSection() {
  const { data } = useStore()
  const [page, setPage] = useState(0)
  const [detail, setDetail] = useState<Book | null>(null)
  const [editing, setEditing] = useState<Book | null>(null)

  // Finished books of the active year, most recent first by finish date.
  const books = useMemo(
    () => finishedInYear(data.books, data.activeYear).slice().reverse(),
    [data.books, data.activeYear],
  )

  const totalPages = Math.max(1, Math.ceil(books.length / PER_PAGE))
  const pageClamped = Math.min(page, totalPages - 1)
  const pageStart = pageClamped * PER_PAGE
  const pageBooks = books.slice(pageStart, pageStart + PER_PAGE)
  const usedShelves = Math.max(1, Math.ceil(pageBooks.length / PER_SHELF))

  return (
    <div className="animate-fade-in-up space-y-5">
      <SectionHeader
        title="Estantería virtual"
        subtitle={`${books.length} libro${
          books.length === 1 ? '' : 's'
        } finalizado${books.length === 1 ? '' : 's'} en ${data.activeYear}`}
        action={
          totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={pageClamped === 0}
                className="flex size-9 items-center justify-center rounded-full bg-card text-foreground shadow-sm transition hover:shadow-md disabled:opacity-40 disabled:shadow-none"
                aria-label="Estantería anterior"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                {pageClamped + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageClamped >= totalPages - 1}
                className="flex size-9 items-center justify-center rounded-full bg-card text-foreground shadow-sm transition hover:shadow-md disabled:opacity-40 disabled:shadow-none"
                aria-label="Estantería siguiente"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )
        }
      />

      {books.length === 0 ? (
        <div className="rounded-3xl bg-card/60 py-16 text-center shadow-sm">
          <Sprout className="mx-auto size-8 text-primary/50" aria-hidden />
          <p className="mt-3 font-serif text-lg font-semibold">
            Tu estantería está vacía
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
            Los libros que marques como finalizados en {data.activeYear}{' '}
            aparecerán aquí, acomodados prolijamente en tu estantería.
          </p>
        </div>
      ) : (
        <div
          className="shelf-wall relative overflow-hidden rounded-3xl shadow-md"
          style={{ height: usedShelves * ROW_H + PAD }}
        >
          {Array.from({ length: usedShelves }).map((_, si) => {
            const shelfBooks = pageBooks.slice(
              si * PER_SHELF,
              si * PER_SHELF + PER_SHELF,
            )
            // Cumulative count of finished books once this shelf (and every
            // shelf above it, across all previous pages) is filled.
            const milestone = pageStart + (si + 1) * PER_SHELF
            const isFullShelf = shelfBooks.length === PER_SHELF
            const rowTop = PAD / 2 + si * ROW_H

            return (
              <div
                key={si}
                className="absolute left-0 right-0"
                style={{ top: rowTop, height: ROW_H }}
              >
                {/* books resting on this shelf's board */}
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-end gap-2"
                  style={{
                    left: PAD,
                    right: PAD,
                    bottom: LINE,
                  }}
                >
                  {shelfBooks.map((book, bi) => (
                    <BookOnShelf
                      key={book.id}
                      book={book}
                      theme={data.theme}
                      tilt={TILTS[(si * PER_SHELF + bi) % TILTS.length]}
                      onClick={() => setDetail(book)}
                    />
                  ))}
                </div>

                {/* the shelf board itself */}
                <div
                  className="shelf-board absolute"
                  style={{ left: PAD - 6, right: PAD - 6, bottom: 0, height: LINE }}
                />

                {/* milestone badge, centered on top of this shelf's own
                    board — only shown once the shelf is completely full, so
                    it always sits on the row whose books earned that count */}
                {isFullShelf && (
                  <div
                    className="absolute z-20 flex items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm"
                    style={{
                      right: PAD - 6,
                      bottom: LINE - BADGE / 2,
                      width: BADGE,
                      height: BADGE,
                    }}
                    aria-hidden
                  >
                    {milestone}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <BookDetail
        book={detail}
        onClose={() => setDetail(null)}
        onEdit={(b) => {
          setDetail(null)
          setEditing(b)
        }}
      />
      {editing && (
        <BookForm
          open={!!editing}
          type={editing.type}
          initial={editing}
          editingId={editing.id}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

// Gentle hand-drawn tilt variations (degrees)
const TILTS = [-3, 0, 2, -1, 1]

function BookOnShelf({
  book,
  theme,
  tilt,
  onClick,
}: {
  book: Book
  theme: 'cream' | 'mocha' | 'pastel'
  tilt: number
  onClick: () => void
}) {
  const bg = spineColor(book.id + book.title, theme)
  const fg = spineTextColor(bg)
  // Slight height variation so the row feels organically arranged.
  const seed = book.id.charCodeAt(0) % 3
  const height = ['h-[86px]', 'h-[104px]', 'h-[120px]'][seed]

  return (
    <div
      className="origin-bottom"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <button
        type="button"
        onClick={onClick}
        title={book.title}
        aria-label={`${book.title} de ${book.author}`}
        className={`book-3d group relative ${height} w-11 shrink-0 origin-bottom overflow-hidden rounded-l-[3px] rounded-r-md transition-transform duration-200 ease-out hover:-translate-y-2 hover:scale-[1.04] sm:w-[68px]`}
      >
        <span
          className="flex h-full w-full flex-col items-center justify-between gap-1 p-1.5 text-center"
          style={{ backgroundColor: bg, color: fg }}
        >
          <span className="line-clamp-4 text-[10px] leading-tight font-semibold sm:text-[11px]">
            {book.title}
          </span>
          <span className="line-clamp-2 text-[8px] font-medium opacity-80 sm:text-[9px]">
            {book.author}
          </span>
        </span>
        {/* left "spine" shadow for a 3D book edge */}
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/35 to-transparent" />
        {/* subtle top page highlight */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-white/20" />
      </button>
    </div>
  )
}
