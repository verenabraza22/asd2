import {
  BookHeart,
  CalendarCheck,
  ChartPie,
  Compass,
  Headphones,
  House,
  Library,
  ListChecks,
  NotebookPen,
  type LucideIcon,
} from 'lucide-react'

export type SectionId =
  | 'inicio'
  | 'estanteria'
  | 'estadisticas'
  | 'resumen'
  | 'calendario'
  | 'glosario'
  | 'pendientes'
  | 'audiolibros'
  | 'recomiendame'

export interface NavItem {
  id: SectionId
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'inicio', label: 'Inicio', icon: House },
  { id: 'estanteria', label: 'Estantería', icon: Library },
  { id: 'glosario', label: 'Glosario', icon: NotebookPen },
  { id: 'audiolibros', label: 'Audiolibros', icon: Headphones },
  { id: 'pendientes', label: 'Pendientes', icon: ListChecks },
  { id: 'recomiendame', label: 'Recomiéndame', icon: Compass },
  { id: 'calendario', label: 'Calendario', icon: CalendarCheck },
  { id: 'estadisticas', label: 'Estadísticas', icon: ChartPie },
  { id: 'resumen', label: 'Resumen mensual', icon: BookHeart },
]
