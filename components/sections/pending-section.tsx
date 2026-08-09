"use client"

import { useMemo, useState } from "react"
import { BookMarked, Check, Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import { useStore } from "@/lib/store"
import type { BookMetadata } from "@/lib/google-books"
import type { WishlistItem } from "@/lib/types"
import { BookCover } from "@/components/book-cover"
import { BookForm } from "@/components/book-form"
import { BookSearch } from "@/components/book-search"
import { CoverScanner } from "@/components/cover-scanner"
import { Modal } from "@/components/modal"
import { SectionHeader } from "./section-header"

export function PendingSection() {
  const { data, addWishlist, updateWishlist, deleteWishlist } = useStore()
  const [addOpen, setAddOpen] = useState(false)
  const [scanText, setScanText] = useState<string | null>(null)
  const [migrating, setMigrating] = useState<WishlistItem | null>(null)

  const items = useMemo(
    () => [...data.wishlist].sort((a, b) => Number(a.checked) - Number(b.checked) || b.createdAt - a.createdAt),
    [data.wishlist],
  )

  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="Libros pendientes"
        subtitle="Tu lista de deseos. Cuando termines de leer uno, pasalo a tu glosario."
        icon={<BookMarked className="size-5" aria-hidden />}
        action={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden />
            Agregar
          </button>
        }
      />

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <BookMarked className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-serif text-lg text-foreground">Tu lista de deseos está vacía</p>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Agregá libros que querés leer. Podés escanear la portada con la cámara.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`group flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition ${
                item.checked ? "opacity-60" : ""
              }`}
            >
              <BookCover src={item.coverUrl} alt={item.title} className="h-24 w-16 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className={`line-clamp-2 font-semibold leading-tight text-foreground ${item.checked ? "line-through" : ""}`}>
                  {item.title}
                </p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{item.author}</p>
                {item.genre && (
                  <span className="mt-1 w-fit rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {item.genre}
                  </span>
                )}
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() => updateWishlist(item.id, { checked: !item.checked })}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition ${
                      item.checked
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-secondary"
                    }`}
                    aria-pressed={item.checked}
                  >
                    <Check className="size-3.5" aria-hidden />
                    {item.checked ? "Conseguido" : "Marcar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMigrating(item)}
                    className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground transition hover:opacity-90"
                  >
                    <Sparkles className="size-3.5" aria-hidden />
                    Ya lo leí
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteWishlist(item.id)}
                    aria-label={`Eliminar ${item.title}`}
                    className="ml-auto inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} labelledBy="pending-add-title">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          <h3 id="pending-add-title" className="font-serif text-xl font-bold">
            Agregar a pendientes
          </h3>
          <CoverScanner onDetected={setScanText} />
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Buscar libro</p>
            <BookSearch
              key={scanText ?? "empty"}
              placeholder={scanText ? `Buscando: ${scanText}` : "Buscar por título o autor…"}
              onSelect={(meta: BookMetadata) => {
                addWishlist({
                  type: "book",
                  title: meta.title,
                  author: meta.author,
                  coverUrl: meta.coverUrl,
                  pages: meta.pages,
                  genre: meta.genre,
                  synopsis: meta.synopsis,
                  checked: false,
                })
                setScanText(null)
                setAddOpen(false)
              }}
            />
            {scanText && (
              <p className="mt-2 text-xs text-muted-foreground">
                Texto detectado en la portada: <span className="font-medium text-foreground">{scanText}</span>. Buscalo
                arriba y seleccionalo.
              </p>
            )}
          </div>
          <ManualWishlistForm
            onSubmit={(payload) => {
              addWishlist(payload)
              setScanText(null)
              setAddOpen(false)
            }}
          />
        </div>
      </Modal>

      {/* Migrate to glossary: prefilled book form */}
      {migrating && (
        <BookForm
          key={migrating.id}
          open
          type={migrating.type}
          initial={{
            type: migrating.type,
            title: migrating.title,
            author: migrating.author,
            coverUrl: migrating.coverUrl,
            pages: migrating.pages,
            genre: migrating.genre,
            synopsis: migrating.synopsis,
            status: "reading",
          }}
          onClose={() => {
            // If it now exists in the library (was saved), remove from wishlist.
            deleteWishlist(migrating.id)
            setMigrating(null)
          }}
        />
      )}
    </div>
  )
}

function ManualWishlistForm({
  onSubmit,
}: {
  onSubmit: (payload: Omit<WishlistItem, "id" | "createdAt">) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition hover:border-ring hover:text-foreground"
      >
        <Pencil className="size-4" aria-hidden />
        Cargar manualmente
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onSubmit({ type: "book", title: title.trim(), author: author.trim() || "Autor desconocido", checked: false })
      }}
      className="space-y-2 rounded-lg border border-border bg-muted/30 p-3"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Autor"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
      <button
        type="submit"
        className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Agregar a pendientes
      </button>
    </form>
  )
}
