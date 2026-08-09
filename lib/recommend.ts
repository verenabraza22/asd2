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

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface Suggestion extends BookMetadata {
  /** why this was suggested, e.g. "Porque te gustó Fantasía" */
  reason: string
}

/**
 * Build reading suggestions from the reader profile, excluding books the
 * user already owns (library) or has on their wishlist.
 */
export async function getRecommendations(
  profile: ReaderProfile,
  library: Book[],
  wishlist: WishlistItem[],
): Promise<Suggestion[]> {
  const queries: { q: string; reason: string }[] = []
  for (const author of profile.topAuthors) {
    queries.push({ q: author, reason: `Más de ${author}` })
  }
  for (const genre of profile.topGenres) {
    queries.push({ q: genre, reason: `Porque te gustó ${genre}` })
  }
  if (queries.length === 0) return []

  const owned = new Set(
    [...library, ...wishlist].map((b) => `${norm(b.title)}|${norm(b.author)}`),
  )
  const ownedTitles = new Set([...library, ...wishlist].map((b) => norm(b.title)))

  const settled = await Promise.all(
    queries.map(async ({ q, reason }) => {
      const res = await searchBooks(q, 6)
      return res.results.map((r) => ({ ...r, reason }) as Suggestion)
    }),
  )

  const seen = new Set<string>()
  const out: Suggestion[] = []
  for (const group of settled) {
    for (const s of group) {
      const key = `${norm(s.title)}|${norm(s.author)}`
      if (owned.has(key) || ownedTitles.has(norm(s.title))) continue
      if (seen.has(key)) continue
      seen.add(key)
      out.push(s)
    }
  }

  // Interleave so the list isn't dominated by a single author/genre.
  return out.slice(0, 12)
}
