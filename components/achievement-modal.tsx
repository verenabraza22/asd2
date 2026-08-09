'use client'

import { PartyPopper, Rocket, Sparkles, Trophy, Wine, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export interface Achievement {
  /** Persistence key, e.g. `annual-2026` or `monthly-2026-3`. */
  key: string
  scope: 'annual' | 'monthly'
  /** The goal value that was met. */
  goal: number
  /** Label for the period, e.g. "2026" or "Marzo". */
  periodLabel: string
}

const CONFETTI_COLORS = [
  'var(--primary)',
  'var(--gold)',
  'var(--accent)',
  'var(--chart-1)',
  'var(--chart-3)',
]

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const left = Math.random() * 100
        const drift = `${(Math.random() - 0.5) * 160}px`
        const dur = `${2.4 + Math.random() * 2.2}s`
        const delay = `${Math.random() * 0.8}s`
        const spin = `${360 + Math.random() * 540}deg`
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        const round = i % 3 === 0
        return { i, left, drift, dur, delay, spin, color, round }
      }),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.i}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              backgroundColor: p.color,
              borderRadius: p.round ? '999px' : '2px',
              '--drift': p.drift,
              '--dur': p.dur,
              '--delay': p.delay,
              '--spin': p.spin,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

const INCREMENTS = [3, 5, 10]

export function AchievementModal({
  achievement,
  onKeep,
  onExpand,
}: {
  achievement: Achievement
  /** Keep the goal as-is and dismiss. */
  onKeep: () => void
  /** Raise the goal to a new value and dismiss. */
  onExpand: (newGoal: number) => void
}) {
  const { scope, goal, periodLabel } = achievement
  const [expanding, setExpanding] = useState(false)
  const [custom, setCustom] = useState('')

  const title =
    scope === 'annual'
      ? '¡Meta anual cumplida!'
      : '¡Objetivo del mes cumplido!'

  const message =
    scope === 'annual'
      ? `Lograste tu meta anual de ${goal} ${goal === 1 ? 'libro' : 'libros'} en ${periodLabel}. Cada página valió la pena.`
      : `Completaste tus ${goal} ${goal === 1 ? 'libro' : 'libros'} planeados para ${periodLabel}. ¡Qué ritmo tan acogedor!`

  function confirmCustom() {
    const n = Math.round(Number(custom))
    if (Number.isFinite(n) && n > goal) onExpand(n)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-title"
    >
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <Confetti />

      <div className="animate-fade-in-up relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl">
        {/* festive banner top */}
        <div className="relative flex flex-col items-center gap-4 bg-primary/10 px-6 pb-6 pt-8 text-center">
          <button
            type="button"
            onClick={onKeep}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>

          {/* watercolor-style medal */}
          <div className="badge-pop badge-glow relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-gold/90 to-primary text-primary-foreground shadow-lg">
            <Trophy className="size-11" strokeWidth={1.75} />
            <Sparkles className="absolute -right-1 -top-1 size-6 text-gold" />
          </div>

          <div className="space-y-1">
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <PartyPopper className="size-4" />
              Logro desbloqueado
            </p>
            <h2
              id="achievement-title"
              className="font-serif text-2xl font-bold text-balance text-foreground"
            >
              {title}
            </h2>
          </div>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
        </div>

        {/* interactive challenge */}
        <div className="space-y-4 px-6 pb-6 pt-5">
          {!expanding ? (
            <>
              <p className="text-center text-sm font-medium text-foreground">
                ¿Quieres aumentar tu objetivo de lectura y llevar tu reto al
                siguiente nivel?
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setExpanding(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                >
                  <Rocket className="size-4" />
                  Ampliar meta
                </button>
                <button
                  type="button"
                  onClick={onKeep}
                  className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-muted"
                >
                  <Wine className="size-4" />
                  Mantener así y celebrar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-sm font-medium text-foreground">
                Elige cuánto quieres subir tu meta{' '}
                {scope === 'annual' ? 'anual' : 'mensual'}:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {INCREMENTS.map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => onExpand(goal + inc)}
                    className="flex flex-col items-center gap-0.5 rounded-xl border border-border bg-background py-3 transition-colors hover:border-primary hover:bg-primary/10"
                  >
                    <span className="font-serif text-lg font-bold text-primary">
                      +{inc}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {goal + inc} total
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={goal + 1}
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmCustom()}
                  placeholder="Personalizado"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm tabular-nums outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
                <button
                  type="button"
                  onClick={confirmCustom}
                  disabled={!(Number(custom) > goal)}
                  className={cn(
                    'shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity',
                    Number(custom) > goal
                      ? 'hover:opacity-90'
                      : 'cursor-not-allowed opacity-40',
                  )}
                >
                  Confirmar
                </button>
              </div>
              <button
                type="button"
                onClick={() => setExpanding(false)}
                className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Volver
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
