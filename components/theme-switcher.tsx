'use client'

import { Coffee, Leaf, Moon } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { ThemeName } from '@/lib/types'
import { cn } from '@/lib/utils'

const THEMES: { id: ThemeName; label: string; icon: typeof Coffee }[] = [
  { id: 'cream', label: 'Crema', icon: Coffee },
  { id: 'mocha', label: 'Moca', icon: Moon },
  { id: 'pastel', label: 'Pastel', icon: Leaf },
]

export function ThemeSwitcher() {
  const { data, setTheme } = useStore()

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
      role="radiogroup"
      aria-label="Seleccionar tema"
    >
      {THEMES.map(({ id, label, icon: Icon }) => {
        const active = data.theme === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            title={`Tema ${label}`}
            onClick={() => setTheme(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
