'use client'

import { ChevronDown, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function YearSelector() {
  const { data, years, setActiveYear, addYear } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function handleAddYear() {
    const next = Math.max(...years) + 1
    addYear(next)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <span className="font-serif tabular-nums">{data.activeYear}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
      {open && (
        <div
          role="listbox"
          className="animate-fade-in-up absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Año de lectura
          </p>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              role="option"
              aria-selected={y === data.activeYear}
              onClick={() => {
                setActiveYear(y)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors',
                y === data.activeYear
                  ? 'bg-primary/10 font-semibold text-primary'
                  : 'hover:bg-muted',
              )}
            >
              <span className="tabular-nums">{y}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={handleAddYear}
            className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-border px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-4" />
            Nuevo año
          </button>
        </div>
      )}
    </div>
  )
}
