'use client'

import {
  BookOpen,
  Headphones,
  Heart,
  Pencil,
  Quote,
  Trash2,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import type { Book } from '@/lib/types'
import { BookCover } from './book-cover'
import { Modal } from './modal'
import { StarRating } from './star-rating'

interface BookDetailProps {
  book: Book | null
  onClose: () => void
  onEdit: (book: Book) => void
}

function statusLabel(book: Book): string {
  if (book.status === 'finished') return 'Finalizado'
  if (book.status === 'abandoned')
    return `No finalizado por: ${book.abandonReason ?? 'motivo no indicado'}`
  return 'En curso'
}

function durationLabel(book: Book): string | null {
  if (book.type !== 'audiobook') return null
  const parts: string[] = []
  if (book.durationHours) parts.push(`${book.durationHours} h`)
  if (book.durationMinutes) parts.push(`${book.durationMinutes} min`)
  if (book.chapters) parts.push(`${book.chapters} cap.`)
  return parts.length ? parts.join(' · ') : null
}

export function BookDetail({ book, onClose, onEdit }: BookDetailProps) {
  const { deleteBook } = useStore()
  if (!book) return null

  const isAudio = book.type === 'audiobook'
  const duration = durationLabel(book)

  return (
    <Modal
      open={!!book}
      onClose={onClose}
      labelledBy="detail-title"
      className="max-w-3xl"
    >
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
          {/* Left: large cover */}
          <div className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-52">
            <BookCover
              src={book.coverUrl}
              alt={`Portada de ${book.title}`}
              className="aspect-[2/3] w-full shadow-md"
            />
          </div>

          {/* Right: metadata */}
          <div className="min-w-0 flex-1">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {isAudio ? (
                <Headphones className="size-3.5" />
              ) : (
                <BookOpen className="size-3.5" />
              )}
              {isAudio ? 'Audiolibro' : 'Libro'}
            </span>
            <h3
              id="detail-title"
              className="font-serif text-2xl font-bold text-balance"
            >
              {book.title}
            </h3>
            <p className="mt-0.5 text-base text-muted-foreground">
              {book.author}
            </p>

            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Estado" value={statusLabel(book)} />
              {book.startDate && (
                <Row label="Inicio" value={book.startDate} />
              )}
              {book.status === 'finished' && book.endDate && (
                <Row label="Fin" value={book.endDate} />
              )}
              {!isAudio && book.pages && (
                <Row label="Páginas" value={`${book.pages}`} />
              )}
              {duration && <Row label="Duración" value={duration} />}
              {book.genre && <Row label="Género" value={book.genre} />}
            </dl>

            {book.status === 'finished' && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StarRating value={book.rating} readOnly size={22} />
                {book.recommended && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                    <Heart className="size-3.5 fill-current text-destructive" />
                    Recomendado
                  </span>
                )}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(book)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Pencil className="size-4" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteBook(book.id)
                  onClose()
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>

        {/* Bottom: synopsis + reflections */}
        {(book.synopsis || book.reflections) && (
          <div className="space-y-5 border-t border-border p-5 sm:p-6">
            {book.synopsis && (
              <div>
                <h4 className="mb-1.5 font-serif text-lg font-semibold">
                  Sinopsis
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {book.synopsis}
                </p>
              </div>
            )}
            {book.reflections && (
              <div>
                <h4 className="mb-1.5 flex items-center gap-2 font-serif text-lg font-semibold">
                  <Quote className="size-4 text-primary" />
                  Citas y reflexiones
                </h4>
                <blockquote className="rounded-xl border-l-4 border-primary/40 bg-background/60 p-3 text-sm leading-relaxed text-foreground/90 italic text-pretty whitespace-pre-line">
                  {book.reflections}
                </blockquote>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  )
}

