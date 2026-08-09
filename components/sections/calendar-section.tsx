"use client"

import { useMemo, useState } from "react"
import { CalendarCheck, ChevronLeft, ChevronRight, Flame } from "lucide-react"
import { useStore } from "@/lib/store"
import { MONTHS_ES } from "@/lib/types"
import { SectionHeader } from "./section-header"

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"]

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

export function CalendarSection() {
  const { data, toggleHabit } = useStore()
  const now = new Date()
  const [view, setView] = useState({ year: data.activeYear, month: now.getMonth() })

  const { cells, monthDays } = useMemo(() => {
    const first = new Date(view.year, view.month, 1)
    // getDay: 0=Sun..6=Sat -> shift to Monday-first
    const startOffset = (first.getDay() + 6) % 7
    const days = new Date(view.year, view.month + 1, 0).getDate()
    const list: (number | null)[] = []
    for (let i = 0; i < startOffset; i++) list.push(null)
    for (let d = 1; d <= days; d++) list.push(d)
    return { cells: list, monthDays: days }
  }, [view])

  const readDaysThisMonth = useMemo(() => {
    let count = 0
    for (let d = 1; d <= monthDays; d++) {
      if (data.habits[dateKey(view.year, view.month, d)]) count++
    }
    return count
  }, [data.habits, view, monthDays])

  const currentStreak = useMemo(() => {
    let streak = 0
    const cur = new Date()
    for (;;) {
      const k = dateKey(cur.getFullYear(), cur.getMonth(), cur.getDate())
      if (data.habits[k]) {
        streak++
        cur.setDate(cur.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }, [data.habits])

  function shift(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate())

  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="Calendario de lectura"
        subtitle="Marcá los días que leíste y construí tu racha."
        icon={<CalendarCheck className="size-5" aria-hidden />}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Flame className="size-4" aria-hidden />
            <span className="text-sm font-medium text-foreground">Racha actual</span>
          </div>
          <p className="mt-2 font-serif text-3xl text-foreground">
            {currentStreak} {currentStreak === 1 ? "día" : "días"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <CalendarCheck className="size-4" aria-hidden />
            <span className="text-sm font-medium text-foreground">Días leídos (mes)</span>
          </div>
          <p className="mt-2 font-serif text-3xl text-foreground">{readDaysThisMonth}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <CalendarCheck className="size-4" aria-hidden />
            <span className="text-sm font-medium text-foreground">Total registrado</span>
          </div>
          <p className="mt-2 font-serif text-3xl text-foreground">{Object.keys(data.habits).length}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Mes anterior"
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <h3 className="font-serif text-xl text-foreground">
            {MONTHS_ES[view.month]} {view.year}
          </h3>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Mes siguiente"
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="pb-1 text-center text-xs font-medium text-muted-foreground">
              {w}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />
            const key = dateKey(view.year, view.month, day)
            const active = !!data.habits[key]
            const isToday = key === todayKey
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleHabit(key)}
                aria-pressed={active}
                aria-label={`${day} de ${MONTHS_ES[view.month]}${active ? ", leído" : ""}`}
                className={`aspect-square rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-foreground hover:bg-secondary"
                } ${isToday && !active ? "ring-2 ring-ring ring-offset-1 ring-offset-card" : ""}`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
