'use client'

import { Download, HardDriveDownload, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import type { AppData } from '@/lib/types'

export function BackupMenu() {
  const { exportData, importData } = useStore()
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function handleExport() {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `entre-paginas-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppData
        importData(parsed)
        setMsg('Datos importados correctamente')
        setTimeout(() => setMsg(null), 2500)
      } catch {
        setMsg('Archivo inválido')
        setTimeout(() => setMsg(null), 2500)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Copia de seguridad"
        className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted"
      >
        <HardDriveDownload className="size-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="animate-fade-in-up absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Copia de seguridad (JSON)
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={handleExport}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
          >
            <Download className="size-4" />
            Exportar datos
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
          >
            <Upload className="size-4" />
            Importar datos
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImportFile}
        className="hidden"
      />
      {msg && (
        <div className="animate-fade-in-up absolute right-0 top-11 z-50 w-52 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
          {msg}
        </div>
      )}
    </div>
  )
}
