export type ThemeName = 'cream' | 'mocha' | 'pastel'

export type BookType = 'book' | 'audiobook'

export type ReadingStatus = 'reading' | 'finished' | 'abandoned'

export const GENRES = [
  'Ficción',
  'Fantasía',
  'Romance',
  'Historia',
  'Desarrollo Personal',
  'Ciencia Ficción',
  'Misterio',
  'Poesía',
  'Biografía',
  'Ensayo',
  'Terror',
  'Clásico',
] as const

export const ABANDON_REASONS = [
  'No me gustó',
  'No es mi estilo',
  'Muy denso',
  'Perdí el interés',
  'Falta de tiempo',
  'Otro',
] as const

export interface Book {
  id: string
  type: BookType
  title: string
  author: string
  coverUrl?: string
  /** Total pages for a physical/ebook */
  pages?: number
  /** Audiobook duration */
  durationHours?: number
  durationMinutes?: number
  chapters?: number
  genre?: string
  synopsis?: string
  /** DD/MM/AAAA */
  startDate?: string
  endDate?: string
  status: ReadingStatus
  abandonReason?: string
  rating: number
  recommended: boolean
  reflections?: string
  createdAt: number
}

export interface WishlistItem {
  id: string
  type: BookType
  title: string
  author: string
  coverUrl?: string
  pages?: number
  synopsis?: string
  genre?: string
  checked: boolean
  createdAt: number
}

export interface YearGoal {
  annual: number
  monthly?: number
}

export interface AppData {
  theme: ThemeName
  activeYear: number
  books: Book[]
  wishlist: WishlistItem[]
  /** goals keyed by year */
  goals: Record<number, YearGoal>
  /** favorite book id keyed by `${year}-${month}` (month 0-11) */
  favorites: Record<string, string>
  /** reading habit keyed by `YYYY-MM-DD` */
  habits: Record<string, boolean>
  /**
   * Goals already celebrated, so the achievement modal isn't shown twice.
   * Keyed by `annual-${year}` or `monthly-${year}-${month}`; value is the
   * goal number that was met when celebrated.
   */
  achievements: Record<string, number>
  /** Extra genres/authors the user added manually to shape recommendations. */
  recommendPrefs?: {
    extraGenres: string[]
    extraAuthors: string[]
  }
  /** Suggestion keys (`title|author`, normalized) dismissed via "Ya lo leí". */
  dismissedSuggestions?: string[]
}

export const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export const QUOTES: { text: string; author?: string }[] = [
  { text: 'Un libro es un sueño que tienes en la mano.', author: 'Neil Gaiman' },
  { text: 'Leer es estar soñando con los ojos abiertos.' },
  { text: 'Estar a solas con un buen libro es tener la mejor compañía.' },
  { text: 'Un hogar sin libros es como un cuerpo sin alma.', author: 'Cicerón' },
  { text: 'Leemos para saber que no estamos solos.', author: 'C.S. Lewis' },
  {
    text: 'Un lector vive mil vidas antes de morir. El que nunca lee solo vive una.',
    author: 'George R.R. Martin',
  },
  {
    text: 'Siempre imaginé que el Paraíso sería alguna especie de biblioteca.',
    author: 'Jorge Luis Borges',
  },
  { text: 'Los libros son una magia única y portátil.', author: 'Stephen King' },
]
