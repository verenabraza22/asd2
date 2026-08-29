export interface BookMetadata {
  title: string
  author: string
  coverUrl?: string
  pages?: number
  genre?: string
  synopsis?: string
}

const GENRE_MAP: Record<string, string> = {
  fiction: 'Ficción',
  fantasy: 'Fantasía',
  romance: 'Romance',
  history: 'Historia',
  'self-help': 'Desarrollo Personal',
  'science fiction': 'Ciencia Ficción',
  juvenile: 'Ficción',
  biography: 'Biografía',
  poetry: 'Poesía',
  mystery: 'Misterio',
  horror: 'Terror',
}

function mapGenre(categories?: string[]): string | undefined {
  if (!categories || categories.length === 0) return undefined
  const raw = categories[0].toLowerCase()
  for (const key of Object.keys(GENRE_MAP)) {
    if (raw.includes(key)) return GENRE_MAP[key]
  }
  return categories[0]
}

function bestCover(imageLinks?: Record<string, string>): string | undefined {
  if (!imageLinks) return undefined
  const url =
    imageLinks.extraLarge ||
    imageLinks.large ||
    imageLinks.medium ||
    imageLinks.thumbnail ||
    imageLinks.smallThumbnail
  return url ? url.replace('http://', 'https://').replace('&edge=curl', '') : undefined
}

export interface SearchResult {
  status: 'ok' | 'empty' | 'error'
  results: BookMetadata[]
}

async function searchGoogleBooks(
  query: string,
  max: number,
  startIndex = 0,
): Promise<SearchResult> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    query.trim(),
  )}&maxResults=${max}&startIndex=${startIndex}&langRestrict=es&printType=books`
  const res = await fetch(url)
  if (!res.ok) {
    // 429 (rate limit) / other non-OK responses are transient failures.
    return { status: 'error', results: [] }
  }
  const json = await res.json()
  const items = (json.items ?? []) as any[]
  const results = items.map((item) => {
    const v = item.volumeInfo ?? {}
    return {
      title: v.title ?? 'Sin título',
      author: (v.authors ?? []).join(', ') || 'Autor desconocido',
      coverUrl: bestCover(v.imageLinks),
      pages: typeof v.pageCount === 'number' ? v.pageCount : undefined,
      genre: mapGenre(v.categories),
      synopsis: v.description,
    } as BookMetadata
  })
  return { status: results.length ? 'ok' : 'empty', results }
}

async function searchOpenLibrary(
  query: string,
  max: number,
  startIndex = 0,
): Promise<SearchResult> {
  const page = Math.floor(startIndex / Math.max(1, max)) + 1
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    query.trim(),
  )}&limit=${max}&page=${page}&fields=title,author_name,cover_i,number_of_pages_median,first_sentence,subject`
  const res = await fetch(url)
  if (!res.ok) return { status: 'error', results: [] }
  const json = await res.json()
  const docs = (json.docs ?? []) as any[]
  const results = docs.map((d) => {
    const cover =
      typeof d.cover_i === 'number'
        ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
        : undefined
    return {
      title: d.title ?? 'Sin título',
      author: (d.author_name ?? []).join(', ') || 'Autor desconocido',
      coverUrl: cover,
      pages:
        typeof d.number_of_pages_median === 'number'
          ? d.number_of_pages_median
          : undefined,
      genre: mapGenre(d.subject),
      synopsis: Array.isArray(d.first_sentence)
        ? d.first_sentence[0]
        : d.first_sentence,
    } as BookMetadata
  })
  return { status: results.length ? 'ok' : 'empty', results }
}

/**
 * Search books with a multi-origin fallback: Google Books first, then
 * Open Library if Google errors out or returns nothing.
 */
export async function searchBooks(
  query: string,
  max = 6,
  startIndex = 0,
): Promise<SearchResult> {
  if (!query.trim()) return { status: 'empty', results: [] }

  let primary: SearchResult
  try {
    primary = await searchGoogleBooks(query, max, startIndex)
  } catch {
    primary = { status: 'error', results: [] }
  }
  if (primary.status === 'ok') return primary

  // Google failed or returned no results — try Open Library.
  try {
    const secondary = await searchOpenLibrary(query, max, startIndex)
    if (secondary.status === 'ok') return secondary
    // Prefer a definitive "empty" over an "error" when either says empty.
    if (secondary.status === 'empty' || primary.status === 'empty') {
      return { status: 'empty', results: [] }
    }
    return { status: 'error', results: [] }
  } catch {
    return primary.status === 'empty'
      ? { status: 'empty', results: [] }
      : { status: 'error', results: [] }
  }
}
