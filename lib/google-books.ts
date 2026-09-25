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

// Cheap heuristic to reject descriptions that came back in English (common
// with Open Library and even some "Spanish" Google Books editions whose
// metadata was never translated). Not perfect, but good enough to avoid
// silently filling the synopsis field with the wrong language.
const SPANISH_HINTS =
  /\b(que|de|la|el|los|las|una|uno|para|con|por|su|sus|es|en|un|del|al|más|cuando|desde|hasta|entre|sin|sobre|pero|como|muy|esta|este|donde)\b/gi
const ENGLISH_HINTS =
  /\b(the|and|of|is|was|with|this|that|from|his|her|their|book|novel|story|when|where)\b/gi

function looksSpanish(text: string | undefined): text is string {
  if (!text || text.trim().length < 20) return false
  const es = (text.match(SPANISH_HINTS) ?? []).length
  const en = (text.match(ENGLISH_HINTS) ?? []).length
  return es > en
}

/**
 * A focused, best-effort lookup for a Spanish synopsis by title/author —
 * used when a search result didn't already carry a good one. Tries a
 * precise Google Books lookup first, then Open Library's full work record
 * (which has a real description, unlike its search endpoint that only
 * offers a first line).
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function tryGoogleDescription(
  q: string,
): Promise<{ desc?: string; rateLimited?: boolean }> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      q,
    )}&maxResults=5&langRestrict=es&printType=books`
    const res = await fetch(url)
    if (res.status === 429) return { rateLimited: true }
    if (!res.ok) return {}
    const json = await res.json()
    const items = (json.items ?? []) as any[]
    for (const item of items) {
      const desc = item.volumeInfo?.description as string | undefined
      if (looksSpanish(desc)) return { desc }
    }
    return {}
  } catch {
    return {}
  }
}

/**
 * A focused, best-effort lookup for a Spanish synopsis by title/author —
 * used when a search result didn't already carry a good one. Tries a
 * precise Google Books lookup first, then Open Library's full work record
 * (which has a real description, unlike its search endpoint that only
 * offers a first line).
 *
 * Google's free tier rate-limits aggressively (HTTP 429) when called many
 * times in a row — as happens when backfilling a whole library. When that
 * happens we back off instead of hammering it with a second Google call,
 * and lean on Open Library instead.
 */
export async function fetchSynopsis(
  title: string,
  author?: string,
): Promise<string | undefined> {
  // Multi-word values MUST be quoted for intitle:/inauthor: to match the
  // whole phrase — without quotes, Google only binds the operator to the
  // next single word and silently mis-parses the rest of the query.
  const quoted = `intitle:"${title}"${author ? ` inauthor:"${author}"` : ''}`
  let result = await tryGoogleDescription(quoted)
  if (result.desc) return result.desc

  if (result.rateLimited) {
    // Give Google a moment to cool down and retry once before giving up
    // on it entirely for this book.
    await sleep(1500)
    result = await tryGoogleDescription(quoted)
    if (result.desc) return result.desc
  }

  // Only spend a second Google call on the plain-text fallback if Google
  // itself wasn't the thing throttling us — otherwise this would just add
  // to the pile-up instead of helping.
  if (!result.rateLimited) {
    const plain = `${title} ${author ?? ''}`.trim()
    const plainResult = await tryGoogleDescription(plain)
    if (plainResult.desc) return plainResult.desc
  }

  try {
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(
      `${title} ${author ?? ''}`.trim(),
    )}&limit=1&lang=spa&language=spa&fields=key`
    const res = await fetch(searchUrl)
    if (res.ok) {
      const json = await res.json()
      const key = json.docs?.[0]?.key
      if (key) {
        const workRes = await fetch(`https://openlibrary.org${key}.json`)
        if (workRes.ok) {
          const work = await workRes.json()
          const raw = work.description
          const desc = typeof raw === 'string' ? raw : raw?.value
          if (looksSpanish(desc)) return desc
        }
      }
    }
  } catch {
    // give up quietly — caller treats undefined as "couldn't find one"
  }

  return undefined
}

export interface SearchResult {
  status: 'ok' | 'empty' | 'error'
  results: BookMetadata[]
}

async function searchGoogleBooks(
  query: string,
  max: number,
  startIndex = 0,
  restrictToSpanish = true,
): Promise<SearchResult & { rateLimited?: boolean }> {
  const langParam = restrictToSpanish ? '&langRestrict=es' : ''
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    query.trim(),
  )}&maxResults=${max}&startIndex=${startIndex}${langParam}&printType=books`
  const res = await fetch(url)
  if (res.status === 429) {
    return { status: 'error', results: [], rateLimited: true }
  }
  if (!res.ok) {
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
      synopsis: looksSpanish(v.description) ? v.description : undefined,
      averageRating:
        typeof v.averageRating === 'number' ? v.averageRating : undefined,
      ratingsCount:
        typeof v.ratingsCount === 'number' ? v.ratingsCount : undefined,
      language: v.language as string | undefined,
    } as BookMetadata & { language?: string }
  })
  if (!restrictToSpanish) {
    // Broader, unrestricted search — still put Spanish-tagged editions
    // first among the results rather than treating every language equally.
    results.sort((a, b) => {
      const aEs = a.language === 'es' ? 0 : 1
      const bEs = b.language === 'es' ? 0 : 1
      return aEs - bEs
    })
  }
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
    // Only keep results explicitly tagged Spanish — Open Library is our
    // last resort now, so it's better to show fewer, reliable matches
    // than let untagged (often English) entries slip through.
    .filter((d) => Array.isArray(d.language) && d.language.includes('spa'))
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
        synopsis: looksSpanish(
          Array.isArray(d.first_sentence) ? d.first_sentence[0] : d.first_sentence,
        )
          ? Array.isArray(d.first_sentence)
            ? d.first_sentence[0]
            : d.first_sentence
          : undefined,
        averageRating:
          typeof d.ratings_average === 'number' ? d.ratings_average : undefined,
        ratingsCount:
          typeof d.ratings_count === 'number' ? d.ratings_count : undefined,
      } as BookMetadata
    })
  return { status: results.length ? 'ok' : 'empty', results }
}

/**
 * Search books with a multi-step fallback:
 * 1. Google Books, restricted to Spanish editions (best quality match).
 * 2. If that finds nothing, Google Books again without the language
 *    restriction — many real books simply don't have a Spanish-tagged
 *    edition indexed, and showing nothing is worse than showing a match
 *    the reader can fix up by hand. Spanish editions are still ranked
 *    first within these broader results.
 * 3. Open Library, as a last resort.
 */
/**
 * Search books with a multi-step fallback:
 * 1. Google Books, both restricted to Spanish editions AND unrestricted,
 *    run together and merged. Running only the restricted search and
 *    stopping as soon as it finds *anything* was the problem: a common
 *    word (like a single-word translated title) can match a handful of
 *    unrelated Spanish books, which would count as "found" and mask the
 *    right book sitting in the broader, unrestricted results. Spanish
 *    editions are still ranked first within the merged list.
 * 2. Open Library, as a last resort if Google finds nothing at all.
 */
export async function searchBooks(
  query: string,
  max = 6,
  startIndex = 0,
): Promise<SearchResult> {
  if (!query.trim()) return { status: 'empty', results: [] }

  let restricted = await searchGoogleBooks(query, max, startIndex, true).catch(
    (): SearchResult => ({ status: 'error', results: [] }),
  )
  if (restricted.rateLimited) {
    await new Promise((r) => setTimeout(r, 1200))
    restricted = await searchGoogleBooks(query, max, startIndex, true).catch(
      (): SearchResult => ({ status: 'error', results: [] }),
    )
  }

  // Only spend a second Google call when the first one genuinely didn't
  // give us much to work with — a generic word can "succeed" with a
  // handful of unrelated matches, which is worth topping up, but a
  // healthy list of results isn't worth doubling our request rate for.
  // If Google is already rate-limiting us, skip straight past it instead
  // of piling on a second call it will likely also reject.
  const restrictedCount = restricted.status === 'ok' ? restricted.results.length : 0
  let broadened: SearchResult & { rateLimited?: boolean } = {
    status: 'empty',
    results: [],
  }
  if (restrictedCount < 3 && !restricted.rateLimited) {
    broadened = await searchGoogleBooks(query, max, startIndex, false).catch(
      (): SearchResult => ({ status: 'error', results: [] }),
    )
  }

  // Interleave both result sets (rather than concatenating one after the
  // other) so the broader search — which is where a disambiguated match
  // often lives, when the Spanish-restricted search instead filled up on
  // unrelated books sharing a common word — isn't pushed out of view by
  // a full page of so-so matches from the restricted one.
  const seen = new Set<string>()
  const merged: BookMetadata[] = []
  const maxLen = Math.max(restricted.results.length, broadened.results.length)
  for (let i = 0; i < maxLen; i++) {
    for (const list of [restricted.results, broadened.results]) {
      const s = list[i]
      if (!s) continue
      const key = `${s.title.toLowerCase()}|${s.author.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(s)
    }
  }

  if (merged.length > 0) {
    return { status: 'ok', results: merged.slice(0, Math.max(max, 8)) }
  }

  // Neither Google attempt found anything — try Open Library.
  try {
    const secondary = await searchOpenLibrary(query, max, startIndex)
    if (secondary.status === 'ok') return secondary
    // Prefer a definitive "empty" over an "error" when either says empty.
    if (
      secondary.status === 'empty' ||
      restricted.status === 'empty' ||
      broadened.status === 'empty'
    ) {
      return { status: 'empty', results: [] }
    }
    return { status: 'error', results: [] }
  } catch {
    return restricted.status === 'empty' || broadened.status === 'empty'
      ? { status: 'empty', results: [] }
      : { status: 'error', results: [] }
  }
}
