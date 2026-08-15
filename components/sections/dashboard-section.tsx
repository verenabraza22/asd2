'use client'

import {
  BookOpen,
  Check,
  ChevronDown,
  Headphones,
  Pencil,
  Plus,
  Target,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { SectionId } from '@/lib/nav'
import {
  currentlyReading,
  finishedInYear,
} from '@/lib/selectors'
import { useStore } from '@/lib/store'
import { type BookType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { type Achievement, AchievementModal } from '../achievement-modal'
import { BookCover } from '../book-cover'
import { BookForm } from '../book-form'
import { SectionHeader } from './section-header'

export function DashboardSection({
  onNavigate,
}: {
  onNavigate: (s: SectionId) => void
}) {
  const { data, setGoal, markGoalCelebrated } = useStore()
  const year = data.activeYear
  const goal = data.goals[year] ?? { annual: 15 }

  const [formType, setFormType] = useState<BookType | null>(null)
  const [achievement, setAchievement] = useState<Achievement | null>(null)

  const finished = useMemo(
    () => finishedInYear(data.books, year),
    [data.books, year],
  )
  const booksRead = finished.length
  const reading = useMemo(() => currentlyReading(data.books), [data.books])

  const annualPct = Math.min(
    100,
    Math.round((booksRead / Math.max(1, goal.annual)) * 100),
  )

  // Detect a newly-met annual goal that hasn't been celebrated yet.
  useEffect(() => {
    if (achievement) return

    const annualKey = `annual-${year}`
    if (
      goal.annual > 0 &&
      booksRead >= goal.annual &&
      data.achievements[annualKey] !== goal.annual
    ) {
      setAchievement({
        key: annualKey,
        scope: 'annual',
        goal: goal.annual,
        periodLabel: String(year),
      })
    }
  }, [achievement, booksRead, goal.annual, year, data.achievements])

  function handleKeep() {
    if (achievement) markGoalCelebrated(achievement.key, achievement.goal)
    setAchievement(null)
  }

  function handleExpand(newGoal: number) {
    if (!achievement) return
    // Mark the current milestone as celebrated so it won't re-trigger, then
    // raise the goal. The higher goal can trigger a fresh celebration later.
    markGoalCelebrated(achievement.key, achievement.goal)
    setGoal(year, { annual: newGoal })
    setAchievement(null)
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title={`Tu año lector ${year}`}
          subtitle="Un vistazo cálido a tu progreso de lectura."
        />
        <AddNewMenu onSelect={setFormType} />
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={BookOpen} label="Libros leídos" value={booksRead} />
        <StatCard icon={Headphones} label="En curso" value={reading.length} />
        <StatCard icon={Target} label="Meta anual" value={`${goal.annual}`} />
      </div>

      {/* Goal */}
      <GoalCard
        title="Objetivo anual"
        unit="libros"
        value={goal.annual}
        current={booksRead}
        pct={annualPct}
        onSave={(v) => setGoal(year, { annual: v })}
      />

      {/* Currently reading */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold">Leyendo ahora</h3>
          <button
            type="button"
            onClick={() => onNavigate('glosario')}
            className="text-sm font-medium text-primary hover:underline"
          >
            Ir al glosario
          </button>
        </div>
        {reading.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No tienes lecturas en curso. Comienza un nuevo libro desde el
            glosario o tu lista de pendientes.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-4">
            {reading.map((b) => (
              <li key={b.id} className="flex w-32 flex-col gap-2">
                <BookCover
                  src={b.coverUrl}
                  alt={b.title}
                  className="aspect-[2/3] w-full"
                />
                <div className="leading-tight">
                  <p className="line-clamp-2 text-sm font-semibold">
                    {b.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{b.author}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {formType && (
        <BookForm
          key={formType}
          open
          type={formType}
          onClose={() => setFormType(null)}
        />
      )}

      {achievement && (
        <AchievementModal
          achievement={achievement}
          onKeep={handleKeep}
          onExpand={handleExpand}
        />
      )}
    </div>
  )
}

function AddNewMenu({ onSelect }: { onSelect: (t: BookType) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
      >
        <Plus className="size-4" />
        Agregar nuevo
        <ChevronDown
          className={cn('size-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="animate-fade-in-up absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
          <MenuItem
            icon={BookOpen}
            label="Agregar libro"
            onClick={() => {
              onSelect('book')
              setOpen(false)
            }}
          />
          <MenuItem
            icon={Headphones}
            label="Agregar audiolibro"
            onClick={() => {
              onSelect('audiobook')
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof BookOpen
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <Icon className="size-4 text-primary" />
      {label}
    </button>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen
  label: string
  value: string | number
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4.5" />
      </span>
      <p className="font-serif text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  )
}

function GoalCard({
  title,
  unit,
  value,
  current,
  pct,
  onSave,
}: {
  title: string
  unit: string
  value: number
  current: number
  pct: number
  onSave: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  function save() {
    const n = Math.max(1, Math.round(Number(draft) || 1))
    onSave(n)
    setEditing(false)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold">{title}</h3>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              className="w-20 rounded-lg border border-input bg-background px-2 py-1 text-sm tabular-nums outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="button"
              onClick={save}
              className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              aria-label="Guardar meta"
            >
              <Check className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(String(value))
              setEditing(true)
            }}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-3.5" />
            Editar
          </button>
        )}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-serif text-3xl font-bold text-foreground tabular-nums">
            {current}
          </span>
          <span className="mx-1">/</span>
          <span className="tabular-nums">
            {value} {unit}
          </span>
        </p>
        <p className="font-serif text-2xl font-bold text-primary tabular-nums">
          {pct}%
        </p>
      </div>
      <div
        className="mt-3 h-3 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

