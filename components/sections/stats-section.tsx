"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BookOpen, ChartColumn, Clock, Star } from "lucide-react"
import { useStore } from "@/lib/store"
import { booksByMonth, finishedInYear, pagesInYear } from "@/lib/selectors"
import { MONTHS_ES } from "@/lib/types"
import { SectionHeader } from "./section-header"

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

export function StatsSection() {
  const { data } = useStore()
  const year = data.activeYear

  const finished = useMemo(() => finishedInYear(data.books, year), [data.books, year])
  const totalPages = useMemo(() => pagesInYear(data.books, year), [data.books, year])

  const monthly = useMemo(() => {
    const byMonth = booksByMonth(data.books, year)
    return MONTHS_ES.map((m, i) => ({
      month: m.slice(0, 3),
      libros: byMonth[i]?.length ?? 0,
    }))
  }, [data.books, year])

  const genreData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const b of finished) {
      const g = b.genre || "Sin género"
      counts[g] = (counts[g] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [finished])

  const avgRating = useMemo(() => {
    const rated = finished.filter((b) => b.rating > 0)
    if (rated.length === 0) return 0
    return rated.reduce((s, b) => s + b.rating, 0) / rated.length
  }, [finished])

  const audioHours = useMemo(() => {
    return finished
      .filter((b) => b.type === "audiobook")
      .reduce((s, b) => s + (b.durationHours ?? 0) + (b.durationMinutes ?? 0) / 60, 0)
  }, [finished])

  return (
    <div className="animate-fade-in-up">
      <SectionHeader
        title="Estadísticas"
        subtitle={`Tu año lector ${year} en números.`}
        icon={<ChartColumn className="size-5" aria-hidden />}
      />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<BookOpen className="size-4" aria-hidden />} label="Libros terminados" value={String(finished.length)} />
        <StatCard icon={<ChartColumn className="size-4" aria-hidden />} label="Páginas leídas" value={totalPages.toLocaleString("es")} />
        <StatCard icon={<Star className="size-4" aria-hidden />} label="Rating promedio" value={avgRating ? avgRating.toFixed(1) : "—"} />
        <StatCard icon={<Clock className="size-4" aria-hidden />} label="Horas de audio" value={audioHours ? audioHours.toFixed(1) : "—"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-3">
          <h3 className="font-serif text-lg text-foreground">Libros por mes</h3>
          <p className="mb-4 text-sm text-muted-foreground">Ritmo de lectura durante el año</p>
          {finished.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                    fontSize: 13,
                  }}
                  labelStyle={{ color: "var(--color-popover-foreground)" }}
                />
                <Bar dataKey="libros" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <h3 className="font-serif text-lg text-foreground">Géneros favoritos</h3>
          <p className="mb-4 text-sm text-muted-foreground">Distribución por género</p>
          {genreData.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={genreData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {genreData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      color: "var(--color-popover-foreground)",
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 flex flex-wrap gap-2">
                {genreData.map((g, i) => (
                  <li key={g.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {g.name} ({g.value})
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <p className="mt-2 font-serif text-2xl text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
      Aún no hay datos para este año
    </div>
  )
}
