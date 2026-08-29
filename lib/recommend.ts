import { searchBooks, type BookMetadata } from './google-books'
import type { Book, WishlistItem } from './types'

export interface ReaderProfile {
  topGenres: string[]
  topAuthors: string[]
  /** number of highly-rated books analyzed */
  sampleSize: number
}

/** Books rated 4 or 5 stars define what the reader loves. */
export function readerProfile(books: Book[]): ReaderProfile {
  const loved = books.filter((b) => b.rating >= 4)
  const genreCount = new Map<string, number>()
  const authorCount = new Map<string, number>()

  for (const b of loved) {
    if (b.genre) genreCount.set(b.genre, (genreCount.get(b.genre) ?? 0) + 1)
    if (b.author && b.author !== 'Autor desconocido') {
      authorCount.set(b.author, (authorCount.get(b.author) ?? 0) + 1)
    }
  }

  const rank = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)

  return {
    topGenres: rank(genreCount).slice(0, 3),
    topAuthors: rank(authorCount).slice(0, 3),
    sampleSize: loved.length,
  }
}

export function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Normalized `title|author` key, stable across accents/casing. */
export function suggestionKey(title: string, author: string) {
  return `${norm(title)}|${norm(author)}`
}

export interface Suggestion extends BookMetadata {
  /** why this was suggested, e.g. "Porque te gustó Fantasía" */
  reason: string
}

export interface RecommendOptions {
  /** Genres to search by (own + manually added). Drives most suggestions. */
  genres: string[]
  /** Authors to actively search for more of (own top authors + manually added). */
  authorsToSearch: string[]
  library: Book[]
  wishlist: WishlistItem[]
  /** Normalized keys the reader dismissed with "Ya lo leí". */
  dismissed: string[]
  /**
   * How many times the reader has searched this session (0 = first search).
   * Each subsequent attempt asks the book APIs for a further-along page of
   * results, so "Buscar de nuevo" doesn't just repeat the same suggestions.
   */
  attempt?: number
}

/**
 * Build reading suggestions, weighted towards genre (which surfaces books
 * from other authors with a similar feel) while still allowing more books
 * from authors the reader already loves. Excludes anything already owned,
 * wishlisted, or dismissed.
 */
export async function getRecommendations(
  opts: RecommendOptions,
): Promise<Suggestion[]> {
  const { genres, authorsToSearch, library, wishlist, dismissed, attempt = 0 } =
    opts
  const perQuery = 8
  const startIndex = attempt * perQuery

  const queries: { q: string; reason: string }[] = []
  for (const genre of genres) {
    queries.push({ q: `subject:"${genre}"`, reason: `Porque te gustó ${genre}` })
    queries.push({ q: genre, reason: `Porque te gustó ${genre}` })
  }
  if (genres.length >= 2) {
    queries.push({
      q: `${genres[0]} ${genres[1]}`,
      reason: `Mezcla de tus géneros favoritos`,
    })
  }
  for (const author of authorsToSearch) {
    queries.push({ q: author, reason: `Más de ${author}` })
  }
  if (queries.length === 0) return []

  const owned = new Set(
    [...library, ...wishlist].map((b) => suggestionKey(b.title, b.author)),
  )
  const ownedTitles = new Set([...library, ...wishlist].map((b) => norm(b.title)))
  const dismissedSet = new Set(dismissed)

  const settled = await Promise.all(
    queries.map(async ({ q, reason }) => {
      const res = await searchBooks(q, perQuery, startIndex)
      return res.results.map((r) => ({ ...r, reason }) as Suggestion)
    }),
  )

  const seen = new Set<string>()
  const out: Suggestion[] = []
  for (const group of settled) {
    for (const s of group) {
      const key = suggestionKey(s.title, s.author)
      if (owned.has(key) || ownedTitles.has(norm(s.title))) continue
      if (dismissedSet.has(key)) continue
      if (seen.has(key)) continue
      seen.add(key)
      out.push(s)
    }
  }

  // A far-along page can occasionally come back thin (some queries simply
  // run out of results). Fall back to the first page rather than showing
  // the reader an empty state.
  if (out.length === 0 && startIndex > 0) {
    return getRecommendations({ ...opts, attempt: 0 })
  }

  return out.slice(0, 24)
}
