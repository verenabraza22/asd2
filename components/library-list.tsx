'use client'

import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import type { Book, BookType } from '@/lib/types'
import { BookCover } from './book-cover'
import { BookDetail } from './book-detail'
import { BookForm } from './book-form'
import { SectionHeader } from './sections/section-header'
import { StarRating } from './star-rating'

type Filter = 'all' | 'reading' | 'finished' | 'abandoned'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'reading', label: 'En curso' },
  { id: 'finished', label: 'Finalizados' },
  { id: 'abandoned', label: 'Sin terminar' },
]

interface LibraryListProps {
  type: BookType
  title: string
  subtitle: string
}

export function LibraryList({ type, title, subtitle }: LibraryListProps) {
  const { data } = useStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)
  const [detail, setDetail] = useState<Book | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const books = useMemo(
    () =>
      data.books
        .filter((b) => b.type === type)
        .filter((b) => (filter === 'all' ? true : b.status === filter)),
    [data.books, type, filter],
  )

  function openEdit(book: Book) {
    setDetail(null)
    setEditing(book)
    setFormOpen(true)
  }

  return (
    <div className="animate-fade-in-up space-y-5">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        action={
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Agregar {type === 'audiobook' ? 'audiolibro' : 'libro'}
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={
              filter === f.id
                ? 'rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground'
                : 'rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground'
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {books.length === 0 ? (
        <EmptyState type={type} onAdd={() => setFormOpen(true)} />
      ) : (
        <ul className="space-y-3">
          {books.map((book) => (
            <BookRow key={book.id} book={book} onOpen={() => setDetail(book)} />
          ))}
        </ul>
      )}

      {formOpen && (
        <BookForm
          open={formOpen}
          type={type}
          initial={editing ?? undefined}
          editingId={editing?.id}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}
      <BookDetail
        book={detail}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
      />
    </div>
  )
}

function BookRow({ book, onOpen }: { book: Book; onOpen: () => void }) {
  const dateText =
    book.status === 'finished'
      ? `${book.startDate ?? '—'} → ${book.endDate ?? '—'}`
      : book.status === 'abandoned'
        ? `Sin terminar${book.abandonReason ? ` · ${book.abandonReason}` : ''}`
        : book.startDate
          ? `Desde ${book.startDate}`
          : 'En curso'

  return (
    <li className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/40">
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0"
        aria-label={`Ver detalle de ${book.title}`}
      >
        <BookCover
          src={book.coverUrl}
          alt={book.title}
          className="h-24 w-16 transition-transform hover:scale-[1.03]"
        />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
      >
        <p className="line-clamp-1 font-serif text-base font-semibold">
          {book.title}
        </p>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {book.author}
        </p>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          {dateText}
        </p>
        {book.status === 'finished' && (
          <div className="mt-1.5">
            <StarRating value={book.rating} readOnly size={15} />
          </div>
        )}
      </button>
    </li>
  )
}

function EmptyState({
  type,
  onAdd,
}: {
  type: BookType
  onAdd: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-14 text-center">
      <p className="font-serif text-lg font-semibold">
        Aún no hay {type === 'audiobook' ? 'audiolibros' : 'libros'} aquí
      </p>
      <p className="max-w-sm text-sm text-muted-foreground text-pretty">
        Agrega tu primer {type === 'audiobook' ? 'audiolibro' : 'libro'} y
        comienza a registrar tu viaje de lectura.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="size-4" />
        Agregar ahora
      </button>
    </div>
  )
}
