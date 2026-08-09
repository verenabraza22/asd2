'use client'

import { BookMarked } from 'lucide-react'
import { useState } from 'react'
import { NAV_ITEMS, type SectionId } from '@/lib/nav'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { BackupMenu } from './backup-menu'
import { QuoteBanner } from './quote-banner'
import { ThemeSwitcher } from './theme-switcher'
import { YearSelector } from './year-selector'
import { AudiobooksSection } from './sections/audiobooks-section'
import { CalendarSection } from './sections/calendar-section'
import { DashboardSection } from './sections/dashboard-section'
import { GlossarySection } from './sections/glossary-section'
import { MonthlySection } from './sections/monthly-section'
import { PendingSection } from './sections/pending-section'
import { RecommendSection } from './sections/recommend-section'
import { ShelfSection } from './sections/shelf-section'
import { StatsSection } from './sections/stats-section'

export function AppShell() {
  const { ready } = useStore()
  const [section, setSection] = useState<SectionId>('inicio')

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <BookMarked className="size-8 animate-pulse text-primary" />
          <p className="font-serif text-sm italic">Abriendo tu diario…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="paper-texture relative min-h-dvh bg-background">
      {/* cozy decorative watermark layer */}
      <div
        className="cozy-pattern pointer-events-none fixed inset-0 z-0 opacity-[0.035] dark:opacity-[0.05]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-7xl flex-col lg:flex-row">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 z-30 hidden h-dvh w-60 shrink-0 flex-col bg-card/60 p-4 shadow-[1px_0_16px_-8px_rgba(0,0,0,0.25)] backdrop-blur lg:flex">
          <Brand />
          <nav className="mt-6 flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={section === item.id}
                onClick={() => setSection(item.id)}
              />
            ))}
          </nav>
          <div className="mt-4 rounded-2xl bg-background/70 p-3 shadow-sm">
            <QuoteBanner />
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 bg-card/80 shadow-[0_2px_16px_-10px_rgba(0,0,0,0.3)] backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 lg:hidden">
                <Brand compact />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <YearSelector />
                <ThemeSwitcher />
                <BackupMenu />
              </div>
            </div>
            {/* Mobile nav */}
            <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV_ITEMS.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={section === item.id}
                  onClick={() => setSection(item.id)}
                  compact
                />
              ))}
            </nav>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6">
            {section === 'inicio' && <DashboardSection onNavigate={setSection} />}
            {section === 'estanteria' && <ShelfSection />}
            {section === 'glosario' && <GlossarySection />}
            {section === 'audiolibros' && <AudiobooksSection />}
            {section === 'pendientes' && <PendingSection />}
            {section === 'recomiendame' && <RecommendSection />}
            {section === 'calendario' && <CalendarSection />}
            {section === 'estadisticas' && <StatsSection />}
            {section === 'resumen' && <MonthlySection />}
          </main>
        </div>
      </div>
    </div>
  )
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <BookMarked className="size-5" />
      </span>
      <div className="leading-tight">
        <p className="font-serif text-lg font-semibold text-foreground">
          Entre Páginas
        </p>
        {!compact && (
          <p className="text-xs text-muted-foreground">Diario de lectura</p>
        )}
      </div>
    </div>
  )
}

function NavButton({
  item,
  active,
  onClick,
  compact,
}: {
  item: (typeof NAV_ITEMS)[number]
  active: boolean
  onClick: () => void
  compact?: boolean
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-xl text-sm font-medium transition-colors',
        compact ? 'shrink-0 px-3 py-2' : 'px-3 py-2.5',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className={cn(compact && 'whitespace-nowrap')}>{item.label}</span>
    </button>
  )
}
