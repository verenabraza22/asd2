'use client'

import { ImagePlus } from 'lucide-react'
import { useRef, useState } from 'react'
import type { BookMetadata } from '@/lib/google-books'
import { useStore } from '@/lib/store'
import {
  ABANDON_REASONS,
  GENRES,
  type Book,
  type BookType,
  type ReadingStatus,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { BookCover } from './book-cover'
import { BookSearch } from './book-search'
import { DateInput } from './date-input'
import { Modal } from './modal'
import { StarRating } from './star-rating'

interface BookFormProps {
  open: boolean
  onClose: () => void
  type: BookType
  /** Existing book to edit, or partial seed for a new book. */
  initial?: Partial<Book>
  editingId?: string
}

const FIELD =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30'
const LABEL = 'text-sm font-medium text-foreground'

/** Today's date as DD/MM/AAAA. */
function todayStr() {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

export function BookForm({
  open,
  onClose,
  type,
  initial,
  editingId,
}: BookFormProps) {
  const { addBook, updateBook } = useStore()
  const isAudio = type === 'audiobook'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [author, setAuthor] = useState(initial?.author ?? '')
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? '')
  const [pages, setPages] = useState(
    initial?.pages ? String(initial.pages) : '',
  )
  const [durationHours, setDurationHours] = useState(
    initial?.durationHours ? String(initial.durationHours) : '',
  )
  const [durationMinutes, setDurationMinutes] = useState(
    initial?.durationMinutes ? String(initial.durationMinutes) : '',
  )
  const [chapters, setChapters] = useState(
    initial?.chapters ? String(initial.chapters) : '',
  )
  const [genre, setGenre] = useState(initial?.genre ?? '')
  const [synopsis, setSynopsis] = useState(initial?.synopsis ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [status, setStatus] = useState<ReadingStatus>(
    initial?.status ?? 'reading',
  )
  const [abandonReason, setAbandonReason] = useState(
    initial?.abandonReason ?? ABANDON_REASONS[0],
  )
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [recommended, setRecommended] = useState(initial?.recommended ?? false)
  const [reflections, setReflections] = useState(initial?.reflections ?? '')

  function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setCoverUrl(String(reader.result))
    reader.readAsDataURL(file)
    // reset so selecting the same file again still fires onChange
    e.target.value = ''
  }

  function applyMeta(meta: BookMetadata) {
    setTitle(meta.title)
    setAuthor(meta.author)
    if (meta.coverUrl) setCoverUrl(meta.coverUrl)
    if (meta.pages) setPages(String(meta.pages))
    if (meta.genre) setGenre(meta.genre)
    if (meta.synopsis) setSynopsis(meta.synopsis)
  }

  function handleSave() {
    if (!title.trim()) return
    // A finished book must be anchored to a date so it counts toward a
    // reading year on the dashboard. Default to today when left blank.
    const resolvedEnd =
      status === 'finished' ? endDate || todayStr() : undefined
    const payload: Omit<Book, 'id' | 'createdAt'> = {
      type,
      title: title.trim(),
      author: author.trim() || 'Autor desconocido',
      coverUrl: coverUrl || undefined,
      pages: pages ? Number(pages) : undefined,
      durationHours: durationHours ? Number(durationHours) : undefined,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      chapters: chapters ? Number(chapters) : undefined,
      genre: genre || undefined,
      synopsis: synopsis || undefined,
      startDate: startDate || undefined,
      endDate: resolvedEnd,
      status,
      abandonReason: status === 'abandoned' ? abandonReason : undefined,
      rating: status === 'finished' ? rating : 0,
      recommended: status === 'finished' ? recommended : false,
      reflections: status === 'finished' ? reflections || undefined : undefined,
    }
    if (editingId) updateBook(editingId, payload)
    else addBook(payload)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="book-form-title">
      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        <h3 id="book-form-title" className="mb-1 font-serif text-xl font-bold">
          {editingId ? 'Editar' : 'Agregar'}{' '}
          {isAudio ? 'audiolibro' : 'libro'}
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Busca para autocompletar la portada, páginas, género y sinopsis.
        </p>

        {!editingId && (
          <div className="mb-4">
            <BookSearch onSelect={applyMeta} />
          </div>
        )}

        <div className="flex gap-4">
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative block h-36 w-24 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="Subir portada desde tu dispositivo"
            >
              <BookCover
                src={coverUrl}
                alt={title || 'Portada'}
                className="h-36 w-24"
              />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-foreground/55 text-center text-[11px] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <ImagePlus className="size-5" />
                Subir portada
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleCoverFile}
              className="sr-only"
            />
            <p className="mt-1.5 w-24 text-center text-[11px] leading-tight text-muted-foreground">
              Toca para subir
            </p>
          </div>
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <label className={LABEL} htmlFor="bf-title">
                Título
              </label>
              <input
                id="bf-title"
                className={FIELD}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className={LABEL} htmlFor="bf-author">
                Autor
              </label>
              <input
                id="bf-author"
                className={FIELD}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {isAudio ? (
            <>
              <div className="space-y-1">
                <label className={LABEL}>Duración</label>
                <div className="flex gap-2">
                  <input
                    className={FIELD}
                    type="number"
                    min={0}
                    placeholder="h"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                  />
                  <input
                    className={FIELD}
                    type="number"
                    min={0}
                    max={59}
                    placeholder="min"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className={LABEL} htmlFor="bf-chapters">
                  Capítulos
                </label>
                <input
                  id="bf-chapters"
                  className={FIELD}
                  type="number"
                  min={0}
                  value={chapters}
                  onChange={(e) => setChapters(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label className={LABEL} htmlFor="bf-pages">
                Páginas
              </label>
              <input
                id="bf-pages"
                className={FIELD}
                type="number"
                min={0}
                value={pages}
                onChange={(e) => setPages(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1">
            <label className={LABEL} htmlFor="bf-genre">
              Género
            </label>
            <select
              id="bf-genre"
              className={FIELD}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="">Sin especificar</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start date */}
        <div className="mt-3 space-y-1">
          <label className={LABEL}>Fecha de inicio</label>
          <DateInput value={startDate} onChange={setStartDate} />
        </div>

        {/* Finish flow */}
        <div className="mt-4 rounded-xl border border-border bg-background/60 p-3">
          <p className="mb-2 text-sm font-medium">
            ¿Terminaste de leer{isAudio ? ' / escuchar' : ''} el libro?
          </p>
          <div className="flex flex-wrap gap-2">
            <StatusPill
              active={status === 'reading'}
              onClick={() => setStatus('reading')}
              label="Aún en curso"
            />
            <StatusPill
              active={status === 'finished'}
              onClick={() => setStatus('finished')}
              label="Sí, finalizado"
            />
            <StatusPill
              active={status === 'abandoned'}
              onClick={() => setStatus('abandoned')}
              label="No lo terminé"
            />
          </div>

          {status === 'abandoned' && (
            <div className="mt-3 space-y-1">
              <label className={LABEL} htmlFor="bf-reason">
                Motivo
              </label>
              <select
                id="bf-reason"
                className={FIELD}
                value={abandonReason}
                onChange={(e) => setAbandonReason(e.target.value)}
              >
                {ABANDON_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {status === 'finished' && (
            <div className="mt-3 space-y-3">
              <div className="space-y-1">
                <label className={LABEL}>Fecha de fin</label>
                <DateInput value={endDate} onChange={setEndDate} />
              </div>
              <div className="space-y-1">
                <label className={LABEL}>Valoración</label>
                <StarRating value={rating} onChange={setRating} size={26} />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={recommended}
                  onChange={(e) => setRecommended(e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                ¿Lo recomendarías?
              </label>
              <div className="space-y-1">
                <label className={LABEL} htmlFor="bf-reflections">
                  Citas y reflexiones
                </label>
                <textarea
                  id="bf-reflections"
                  className={cn(FIELD, 'min-h-20 resize-y')}
                  placeholder="Tus frases favoritas o reflexiones sobre el libro…"
                  value={reflections}
                  onChange={(e) => setReflections(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Synopsis */}
        <div className="mt-3 space-y-1">
          <label className={LABEL} htmlFor="bf-synopsis">
            Sinopsis
          </label>
          <textarea
            id="bf-synopsis"
            className={cn(FIELD, 'min-h-20 resize-y')}
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  )
}

function StatusPill({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

