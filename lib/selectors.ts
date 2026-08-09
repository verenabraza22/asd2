import { bookYear, parseDate } from './store'
import type { Book } from './types'

/** Books finished in a given year (any type unless filtered). */
export function finishedInYear(books: Book[], year: number): Book[] {
  return books.filter(
    (b) => b.status === 'finished' && bookYear(b) === year,
  )
}

/** Total pages read across finished books in a year. */
export function pagesInYear(books: Book[], year: number): number {
  return finishedInYear(books, year).reduce(
    (sum, b) => sum + (b.pages ?? 0),
    0,
  )
}

/** The month (0-11) a finished book counts towards, based on end date. */
export function finishMonth(book: Book): number | null {
  const d = parseDate(book.endDate) ?? parseDate(book.startDate)
  if (d) return d.getMonth()
  if (book.createdAt) return new Date(book.createdAt).getMonth()
  return null
}

/** Books currently being read. */
export function currentlyReading(books: Book[]): Book[] {
  return books.filter((b) => b.status === 'reading')
}

/** Group finished books of a year by month index. */
export function booksByMonth(
  books: Book[],
  year: number,
): Record<number, Book[]> {
  const map: Record<number, Book[]> = {}
  for (const b of finishedInYear(books, year)) {
    const m = finishMonth(b)
    if (m === null) continue
    ;(map[m] ??= []).push(b)
  }
  return map
}
