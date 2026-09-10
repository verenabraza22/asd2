export interface BookMetadata {
  title: string
  author: string
  coverUrl?: string
  pages?: number
  genre?: string
  synopsis?: string
  /** 1–5 average rating, when the source reports one. */
  averageRating?: number
  /** How many people rated it — the main signal of how well-known it is. */
  ratingsCount?: number
}

// Order matters: Google/Open Library often label things like
// "Fiction / Thrillers" or "Juvenile Fiction / Fantasy" — if we checked
// the generic "fiction" first it would win every time and mask the more
// specific genre. So specific genres are listed first, and "fiction" is
// the last, catch-all fallback.
const GENRE_RULES: [string, string][] = [
  ['thriller', 'Thriller'],
  ['true crime', 'Policial'],
  ['mystery', 'Misterio'],
  ['detective', 'Policial'],
  ['crime', 'Policial'],
  ['dystopia', 'Distopía'],
  ['science fiction', 'Ciencia Ficción'],
  ['fantasy', 'Fantasía'],
  ['horror', 'Terror'],
  ['romance', 'Romance'],
  ['adventure', 'Aventura'],
  ['biography', 'Biografía'],
  ['autobiography', 'Biografía'],
  ['memoir', 'Biografía'],
  ['poetry', 'Poesía'],
  ['essay', 'Ensayo'],
  ['history', 'Historia'],
  ['self-help', 'Desarrollo Personal'],
  ['self help', 'Desarrollo Personal'],
  ['personal growth', 'Desarrollo Personal'],
  ['comic', 'Cómic'],
  ['graphic novel', 'Cómic'],
  ['drama', 'Drama'],
  ['young adult', 'Juvenil'],
  ['juvenile fiction', 'Juvenil'],
  ['juvenile', 'Infantil'],
  ['children', 'Infantil'],
  ['classic', 'Clásico'],
  ['fiction', 'Ficción'],
]

function mapGenre(categories?: string[]): string | undefined {
  if (!categories || categories.length === 0) return undefined
  const raw = categories[0].toLowerCase()
  for (const [key, label] of GENRE_RULES) {
    if (raw.includes(key)) return label
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
      averageRating:
        typeof v.averageRating === 'number' ? v.averageRating : undefined,
      ratingsCount:
        typeof v.ratingsCount === 'number' ? v.ratingsCount : undefined,
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
  )}&limit=${max}&page=${page}&lang=spa&language=spa&sort=new&fields=title,author_name,cover_i,number_of_pages_median,first_sentence,subject,language,ratings_average,ratings_count`
  const res = await fetch(url)
  if (!res.ok) return { status: 'error', results: [] }
  const json = await res.json()
  const docs = (json.docs ?? []) as any[]
  const results = docs
    // Belt-and-suspenders: some entries have multiple editions in mixed
    // languages, so also check the language field directly when present.
    .filter((d) => !Array.isArray(d.language) || d.language.includes('spa'))
    .map((d) => {
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
        averageRating:
          typeof d.ratings_average === 'number' ? d.ratings_average : undefined,
        ratingsCount:
          typeof d.ratings_count === 'number' ? d.ratings_count : undefined,
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
