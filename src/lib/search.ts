// Web Search Module — Wikipedia API + DuckDuckGo Instant Answers
// Both support CORS from the browser without a backend or API key.

export interface SearchResult {
  title: string
  snippet: string
  url?: string
}

const WIKI_API = 'https://en.wikipedia.org/w/api.php'
const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1'

// ─── Wikipedia search ──────────────────────────────────────────────────────
async function searchWikipedia(query: string): Promise<SearchResult[]> {
  try {
    // Step 1: full-text search for matching articles
    const searchUrl =
      `${WIKI_API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5&srprop=snippet`
    const res = await fetch(searchUrl)
    if (!res.ok) return []
    const data = await res.json()
    const hits: { title: string; snippet: string }[] = data.query?.search ?? []

    // Step 2: fetch summaries for top 3 hits (for richer context)
    const summaries = await Promise.allSettled(
      hits.slice(0, 3).map(async (h) => {
        try {
          const summaryRes = await fetch(`${WIKI_REST}/page/summary/${encodeURIComponent(h.title)}`)
          if (!summaryRes.ok) throw new Error('summary 404')
          const s = await summaryRes.json()
          return {
            title: s.title as string,
            snippet: (s.extract as string | undefined)?.slice(0, 600) ??
              h.snippet.replace(/<[^>]*>/g, ''),
            url: (s.content_urls as { desktop?: { page?: string } } | undefined)?.desktop?.page,
          }
        } catch {
          return {
            title: h.title,
            snippet: h.snippet.replace(/<[^>]*>/g, ''),
          }
        }
      })
    )

    return summaries
      .filter((r): r is PromiseFulfilledResult<SearchResult> => r.status === 'fulfilled')
      .map((r) => r.value)
  } catch (err) {
    console.error('[search] Wikipedia error:', err)
    return []
  }
}

// ─── DuckDuckGo Instant Answers ────────────────────────────────────────────
// Returns abstract + related topics (no API key, CORS-enabled).
async function searchDDG(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1&t=archpal`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()

    const results: SearchResult[] = []

    if (data.Abstract) {
      results.push({
        title: data.Heading || query,
        snippet: data.Abstract,
        url: data.AbstractURL || undefined,
      })
    }

    const related: { Text?: string; FirstURL?: string }[] = data.RelatedTopics ?? []
    for (const topic of related.slice(0, 3)) {
      if (topic.Text) {
        results.push({
          title: topic.FirstURL?.split('/').pop()?.replace(/_/g, ' ') ?? '',
          snippet: topic.Text,
          url: topic.FirstURL ?? undefined,
        })
      }
    }

    return results
  } catch (err) {
    console.error('[search] DDG error:', err)
    return []
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────
export type SearchSource = 'web' | 'wikipedia'

/**
 * Run a web search and return formatted text the agent can use.
 * source='wikipedia'  → Wikipedia search only (best for concepts, history, typologies)
 * source='web'        → DDG instant answers + Wikipedia combined
 */
export async function webSearch(query: string, source: SearchSource = 'web'): Promise<string> {
  if (source === 'wikipedia') {
    const results = await searchWikipedia(query)
    if (results.length === 0)
      return 'No Wikipedia results found. Please rely on your architectural knowledge for this query.'
    return formatResults(results)
  }

  // Web: run both in parallel
  const [wikiResults, ddgResults] = await Promise.all([
    searchWikipedia(query),
    searchDDG(query),
  ])

  // Deduplicate by title and merge
  const seen = new Set<string>()
  const combined: SearchResult[] = []
  for (const r of [...ddgResults, ...wikiResults]) {
    const key = r.title.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      combined.push(r)
    }
  }

  if (combined.length === 0) {
    return 'No search results found. Respond using your architectural knowledge and training data.'
  }

  return formatResults(combined)
}

function formatResults(results: SearchResult[]): string {
  return results
    .map(
      (r, i) =>
        `[Result ${i + 1}] **${r.title}**\n${r.snippet}` +
        (r.url ? `\nSource: ${r.url}` : '')
    )
    .join('\n\n')
}
