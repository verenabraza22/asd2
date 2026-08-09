"use client"

import { useRef, useState } from "react"
import { Camera, Loader2, Sparkles, X } from "lucide-react"

type Props = {
  onDetected: (text: string) => void
}

/**
 * Escáner de portada por OCR usando tesseract.js.
 * Carga la librería dinámicamente en el navegador para no pesar en el bundle inicial.
 */
export function CoverScanner({ onDetected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setBusy(true)
    setProgress(0)
    const url = URL.createObjectURL(file)
    setPreview(url)
    try {
      const Tesseract = (await import("tesseract.js")).default
      const result = await Tesseract.recognize(file, "spa+eng", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100))
          }
        },
      })
      const raw = result.data.text || ""
      // Nos quedamos con las líneas más largas (suelen ser el título / autor).
      const cleaned = raw
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 2)
        .sort((a, b) => b.length - a.length)
        .slice(0, 2)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
      if (cleaned) {
        onDetected(cleaned)
      } else {
        setError("No se pudo leer texto en la imagen. Probá con una foto más nítida.")
      }
    } catch (e) {
      console.log("[v0] OCR error:", e)
      setError("Ocurrió un error al leer la imagen.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Camera className="size-4 text-primary" aria-hidden />
        Escanear portada
      </div>
      <p className="mt-1 text-xs text-muted-foreground text-pretty">
        Tomá o subí una foto de la portada y detectamos el título automáticamente para buscarlo.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
          {busy ? `Leyendo… ${progress}%` : "Elegir foto"}
        </button>

        {preview && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview || "/placeholder.svg"}
              alt="Portada escaneada"
              className="h-16 w-12 rounded-md object-cover shadow"
            />
            {!busy && (
              <button
                type="button"
                onClick={() => {
                  setPreview(null)
                  setError(null)
                }}
                aria-label="Quitar imagen"
                className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-foreground text-background"
              >
                <X className="size-3" aria-hidden />
              </button>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ""
        }}
      />

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
          <Sparkles className="size-3.5" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}
