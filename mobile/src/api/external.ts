// External API wrappers: AllSides, GDELT, Apify

// ── AllSides bias lookup ──────────────────────────────────────────────

export type BiasRating =
  | 'Left'
  | 'Lean Left'
  | 'Center'
  | 'Lean Right'
  | 'Right';

export interface OutletBias {
  outlet: string;
  rating: BiasRating;
}

/**
 * Look up media-outlet bias via AllSides data.
 * In production this would hit an AllSides API or cached dataset.
 * Stubbed for now — returns a lookup from a static map.
 */
const BIAS_MAP: Record<string, BiasRating> = {
  'AP News': 'Center',
  Reuters: 'Center',
  'Fox News': 'Right',
  CNN: 'Lean Left',
  MSNBC: 'Left',
  'Wall Street Journal': 'Lean Right',
  'New York Times': 'Lean Left',
  Bloomberg: 'Center',
  'Washington Post': 'Lean Left',
  Breitbart: 'Right',
};

export function lookupOutletBias(outlet: string): OutletBias {
  return { outlet, rating: BIAS_MAP[outlet] ?? 'Center' };
}

// ── GDELT DOC 2.0 — tone & coverage ──────────────────────────────────

export interface GdeltToneResult {
  averageTone: number;
  articleCount: number;
  sources: string[];
}

export async function fetchGdeltTone(
  query: string,
  signal?: AbortSignal,
): Promise<GdeltToneResult> {
  const params = new URLSearchParams({
    query,
    mode: 'ToneChart',
    format: 'json',
  });
  const res = await fetch(
    `https://api.gdeltproject.org/api/v2/doc/doc?${params}`,
    { signal },
  );
  if (!res.ok) throw new Error(`GDELT DOC request failed: ${res.status}`);
  const data = await res.json();
  return {
    averageTone: data.tone?.averageTone ?? 0,
    articleCount: data.articleCount ?? 0,
    sources: data.sources ?? [],
  };
}

// ── GDELT Context 2.0 — sentence-level framing ───────────────────────

export interface GdeltContextSnippet {
  sentence: string;
  source: string;
  tone: number;
}

export async function fetchGdeltContext(
  query: string,
  signal?: AbortSignal,
): Promise<GdeltContextSnippet[]> {
  const params = new URLSearchParams({
    query,
    mode: 'Context',
    format: 'json',
  });
  const res = await fetch(
    `https://api.gdeltproject.org/api/v2/context/context?${params}`,
    { signal },
  );
  if (!res.ok) throw new Error(`GDELT Context request failed: ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).map((r: any) => ({
    sentence: r.sentence ?? '',
    source: r.source ?? '',
    tone: r.tone ?? 0,
  }));
}

// ── Apify — full article extraction ───────────────────────────────────

export interface ExtractedArticle {
  title: string;
  text: string;
  url: string;
  publishedAt: string;
}

const APIFY_TOKEN = process.env.EXPO_PUBLIC_APIFY_TOKEN ?? '';

export async function extractArticle(
  url: string,
  signal?: AbortSignal,
): Promise<ExtractedArticle> {
  const res = await fetch(
    'https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${APIFY_TOKEN}`,
      },
      body: JSON.stringify({
        startUrls: [{ url }],
        pageFunction: `async function pageFunction(context) {
          const { request, document } = context;
          const title = document.querySelector('title')?.textContent ?? '';
          const text = document.querySelector('article')?.textContent ?? document.body.textContent ?? '';
          const publishedAt = document.querySelector('meta[property="article:published_time"]')?.content ?? '';
          return { title, text: text.slice(0, 5000), url: request.url, publishedAt };
        }`,
      }),
      signal,
    },
  );
  if (!res.ok) throw new Error(`Apify request failed: ${res.status}`);
  const items: ExtractedArticle[] = await res.json();
  return items[0] ?? { title: '', text: '', url, publishedAt: '' };
}
