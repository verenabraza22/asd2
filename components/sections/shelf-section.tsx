'use client'

import {
  AlarmClock,
  Cat,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Flower2,
  Gem,
  Lamp,
  Sprout,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { BookDetail } from '../book-detail'
import { BookForm } from '../book-form'
import { finishedInYear } from '@/lib/selectors'
import { spineColor, spineTextColor } from '@/lib/spine'
import { useStore } from '@/lib/store'
import type { Book } from '@/lib/types'
import { SectionHeader } from './section-header'

const PER_SHELF = 5
const SHELVES_PER_PAGE = 4
const PER_PAGE = PER_SHELF * SHELVES_PER_PAGE // 20

// Serpentine track geometry (px)
const ROW_H = 168
const LINE = 8
const PAD = 36
const BADGE = 34

const DECORATIONS: LucideIcon[] = [Sprout, Coffee, AlarmClock, Cat, Lamp, Gem]

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

  // Split into shelves of PER_SHELF, keeping only shelves that hold a book.
  const usedShelves = Math.max(1, Math.ceil(pageBooks.length / PER_SHELF))
  const shelves: Book[][] = Array.from({ length: usedShelves }, (_, s) =>
    pageBooks.slice(s * PER_SHELF, s * PER_SHELF + PER_SHELF),
  )

  const trackHeight = shelves.length * ROW_H + 12

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
            aparecerán aquí, descansando en el camino de tu estantería.
          </p>
        </div>
      ) : (
        <div className="shelf-wall relative overflow-hidden rounded-3xl p-4 shadow-md sm:p-6">
          <div className="relative" style={{ height: trackHeight }}>
            {shelves.map((shelf, si) => {
              const rtl = si % 2 === 1
              // U-turn side that connects this shelf to the next one.
              const turnSide: 'left' | 'right' = rtl ? 'left' : 'right'
              // The empty "cap" side where a small decoration can rest.
              const capSide: 'left' | 'right' = rtl ? 'right' : 'left'
              const milestone = pageStart + (si + 1) * PER_SHELF
              const reached = books.length >= milestone
              const isLast = si === shelves.length - 1
              const Decoration = DECORATIONS[(pageClamped + si) % DECORATIONS.length]

              return (
                <div
                  key={si}
                  className="absolute inset-x-0"
                  style={{ top: si * ROW_H, height: ROW_H }}
                >
                  {/* horizontal rail (the shelf line) */}
                  <div
                    className="absolute rounded-full bg-wood/55"
                    style={{ left: PAD, right: PAD, bottom: 0, height: LINE }}
                  />

                  {/* U-turn pipe down to the next shelf */}
                  {!isLast && (
                    <div
                      className="absolute rounded-full bg-wood/55"
                      style={{
                        [turnSide]: PAD - LINE / 2,
                        top: ROW_H - LINE,
                        width: LINE,
                        height: ROW_H,
                      }}
                    />
                  )}

                  {/* milestone badge on the curve */}
                  {!isLast && (
                    <div
                      className={`absolute z-20 flex items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                        reached
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-muted-foreground'
                      }`}
                      style={{
                        [turnSide]: PAD - BADGE / 2 + LINE / 2,
                        top: ROW_H - LINE + (ROW_H - BADGE) / 2,
                        width: BADGE,
                        height: BADGE,
                      }}
                      aria-hidden
                    >
                      {milestone}
                    </div>
                  )}

                  {/* small illustrated decoration resting on the cap side */}
                  <span
                    className="pointer-events-none absolute z-0 text-wood-dark/30"
                    style={{ [capSide]: PAD + 2, bottom: LINE }}
                    aria-hidden
                  >
                    <Decoration className="size-7 sm:size-8" strokeWidth={1.5} />
                  </span>

                  {/* books resting on the rail */}
                  <div
                    className="absolute z-10 flex items-end justify-center gap-2.5 sm:gap-5"
                    style={{
                      left: PAD,
                      right: PAD,
                      bottom: LINE - 1,
                      flexDirection: rtl ? 'row-reverse' : 'row',
                    }}
                  >
                    {shelf.map((book, bi) => (
                      <BookOnShelf
                        key={book.id}
                        book={book}
                        theme={data.theme}
                        tilt={TILTS[(si * PER_SHELF + bi) % TILTS.length]}
                        onClick={() => setDetail(book)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
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
const TILTS = [-3, 0, 2, -1, 3]

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
  const hasCover = Boolean(book.coverUrl)
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
        {hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl! || '/placeholder.svg'}
            alt={book.title}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
            loading="lazy"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center p-1.5 text-center"
            style={{ backgroundColor: bg, color: fg }}
          >
            <span className="line-clamp-4 text-[10px] leading-tight font-semibold sm:text-[11px]">
              {book.title}
            </span>
          </span>
        )}
        {/* left "spine" shadow for a 3D book edge */}
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/35 to-transparent" />
        {/* subtle top page highlight */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-white/20" />
      </button>
    </div>
  )
}
