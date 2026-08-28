'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type {
  AppData,
  Book,
  ThemeName,
  WishlistItem,
  YearGoal,
} from './types'

const STORAGE_KEY = 'entre-paginas-data-v1'
const DEFAULT_YEAR = 2026

function createDefaultData(): AppData {
  return {
    theme: 'cream',
    activeYear: DEFAULT_YEAR,
    books: [],
    wishlist: [],
    goals: { [DEFAULT_YEAR]: { annual: 15 } },
    favorites: {},
    habits: {},
    achievements: {},
    recommendPrefs: { extraGenres: [], extraAuthors: [] },
    dismissedSuggestions: [],
  }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/**
 * Parse a user/imported date into a Date (or null).
 * Accepts DD/MM/YYYY, DD/MM/YY (interpreted as 20YY) and ISO YYYY-MM-DD.
 */
export function parseDate(value?: string): Date | null {
  if (!value) return null
  const trimmed = value.trim()

  // ISO: YYYY-MM-DD
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    const [, y, mo, d] = iso
    const date = new Date(Number(y), Number(mo) - 1, Number(d))
    return Number.isNaN(date.getTime()) ? null : date
  }

  // DD/MM/YYYY or DD/MM/YY
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/)
  if (dmy) {
    const [, d, mo, rawY] = dmy
    const year = rawY.length === 2 ? 2000 + Number(rawY) : Number(rawY)
    const date = new Date(year, Number(mo) - 1, Number(d))
    return Number.isNaN(date.getTime()) ? null : date
  }

  return null
}

/** The reading year a finished/abandoned book counts towards. */
export function bookYear(book: Book): number | null {
  const ref = parseDate(book.endDate) ?? parseDate(book.startDate)
  if (ref) return ref.getFullYear()
  // Fallback: a book with no dates still counts toward the year it was
  // added, so finished books are never silently dropped from the totals.
  if (book.createdAt) return new Date(book.createdAt).getFullYear()
  return null
}

interface StoreContextValue {
  data: AppData
  ready: boolean
  setTheme: (t: ThemeName) => void
  setActiveYear: (y: number) => void
  addYear: (y: number) => void
  years: number[]
  setGoal: (year: number, goal: Partial<YearGoal>) => void
  addBook: (book: Omit<Book, 'id' | 'createdAt'>) => Book
  updateBook: (id: string, patch: Partial<Book>) => void
  deleteBook: (id: string) => void
  addWishlist: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => WishlistItem
  updateWishlist: (id: string, patch: Partial<WishlistItem>) => void
  deleteWishlist: (id: string) => void
  setFavorite: (year: number, month: number, bookId: string | null) => void
  toggleHabit: (dateKey: string) => void
  markGoalCelebrated: (key: string, value: number) => void
  addRecommendPref: (kind: 'genre' | 'author', value: string) => void
  removeRecommendPref: (kind: 'genre' | 'author', value: string) => void
  dismissSuggestion: (key: string) => void
  importData: (raw: AppData) => void
  exportData: () => AppData
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(createDefaultData)
  const [ready, setReady] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AppData
        setData({ ...createDefaultData(), ...parsed })
      }
    } catch {
      // ignore corrupt storage
    }
    setReady(true)
  }, [])

  // Persist on change
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // storage may be full or unavailable
    }
  }, [data, ready])

  // Apply theme class to <html>
  useEffect(() => {
    const el = document.documentElement
    el.classList.remove('theme-cream', 'theme-mocha', 'theme-pastel')
    el.classList.add(`theme-${data.theme}`)
  }, [data.theme])

  const setTheme = useCallback((theme: ThemeName) => {
    setData((d) => ({ ...d, theme }))
  }, [])

  const setActiveYear = useCallback((activeYear: number) => {
    setData((d) => ({ ...d, activeYear }))
  }, [])

  const addYear = useCallback((y: number) => {
    setData((d) => {
      if (d.goals[y]) return { ...d, activeYear: y }
      return {
        ...d,
        activeYear: y,
        goals: { ...d.goals, [y]: { annual: 15 } },
      }
    })
  }, [])

  const setGoal = useCallback((year: number, goal: Partial<YearGoal>) => {
    setData((d) => ({
      ...d,
      goals: {
        ...d.goals,
        [year]: { annual: 15, ...d.goals[year], ...goal },
      },
    }))
  }, [])

  const addBook = useCallback((book: Omit<Book, 'id' | 'createdAt'>) => {
    const full: Book = { ...book, id: uid(), createdAt: Date.now() }
    setData((d) => ({ ...d, books: [full, ...d.books] }))
    return full
  }, [])

  const updateBook = useCallback((id: string, patch: Partial<Book>) => {
    setData((d) => ({
      ...d,
      books: d.books.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }))
  }, [])

  const deleteBook = useCallback((id: string) => {
    setData((d) => ({ ...d, books: d.books.filter((b) => b.id !== id) }))
  }, [])

  const addWishlist = useCallback(
    (item: Omit<WishlistItem, 'id' | 'createdAt'>) => {
      const full: WishlistItem = { ...item, id: uid(), createdAt: Date.now() }
      setData((d) => ({ ...d, wishlist: [full, ...d.wishlist] }))
      return full
    },
    [],
  )

  const updateWishlist = useCallback(
    (id: string, patch: Partial<WishlistItem>) => {
      setData((d) => ({
        ...d,
        wishlist: d.wishlist.map((w) =>
          w.id === id ? { ...w, ...patch } : w,
        ),
      }))
    },
    [],
  )

  const deleteWishlist = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      wishlist: d.wishlist.filter((w) => w.id !== id),
    }))
  }, [])

  const setFavorite = useCallback(
    (year: number, month: number, bookId: string | null) => {
      const key = `${year}-${month}`
      setData((d) => {
        const favorites = { ...d.favorites }
        if (bookId) favorites[key] = bookId
        else delete favorites[key]
        return { ...d, favorites }
      })
    },
    [],
  )

  const toggleHabit = useCallback((dateKey: string) => {
    setData((d) => {
      const habits = { ...d.habits }
      if (habits[dateKey]) delete habits[dateKey]
      else habits[dateKey] = true
      return { ...d, habits }
    })
  }, [])

  const markGoalCelebrated = useCallback((key: string, value: number) => {
    setData((d) => ({
      ...d,
      achievements: { ...d.achievements, [key]: value },
    }))
  }, [])

  const addRecommendPref = useCallback(
    (kind: 'genre' | 'author', value: string) => {
      const v = value.trim()
      if (!v) return
      setData((d) => {
        const prefs = d.recommendPrefs ?? { extraGenres: [], extraAuthors: [] }
        const key = kind === 'genre' ? 'extraGenres' : 'extraAuthors'
        if (prefs[key].some((x) => x.toLowerCase() === v.toLowerCase()))
          return d
        return { ...d, recommendPrefs: { ...prefs, [key]: [...prefs[key], v] } }
      })
    },
    [],
  )

  const removeRecommendPref = useCallback(
    (kind: 'genre' | 'author', value: string) => {
      setData((d) => {
        const prefs = d.recommendPrefs ?? { extraGenres: [], extraAuthors: [] }
        const key = kind === 'genre' ? 'extraGenres' : 'extraAuthors'
        return {
          ...d,
          recommendPrefs: { ...prefs, [key]: prefs[key].filter((x) => x !== value) },
        }
      })
    },
    [],
  )

  const dismissSuggestion = useCallback((key: string) => {
    setData((d) => {
      const list = d.dismissedSuggestions ?? []
      if (list.includes(key)) return d
      return { ...d, dismissedSuggestions: [...list, key] }
    })
  }, [])

  const importData = useCallback((raw: AppData) => {
    setData({ ...createDefaultData(), ...raw })
  }, [])

  const exportData = useCallback(() => data, [data])

  const years = useMemo(() => {
    const set = new Set<number>(Object.keys(data.goals).map(Number))
    set.add(data.activeYear)
    set.add(DEFAULT_YEAR)
    return Array.from(set).sort((a, b) => b - a)
  }, [data.goals, data.activeYear])

  const value: StoreContextValue = {
    data,
    ready,
    setTheme,
    setActiveYear,
    addYear,
    years,
    setGoal,
    addBook,
    updateBook,
    deleteBook,
    addWishlist,
    updateWishlist,
    deleteWishlist,
    setFavorite,
    toggleHabit,
    markGoalCelebrated,
    addRecommendPref,
    removeRecommendPref,
    dismissSuggestion,
    importData,
    exportData,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
