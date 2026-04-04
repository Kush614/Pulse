# External API, Bias, and Personalization Plan

## Important Clarification

`Left / Center / Right bias` is **not** the same thing as `positive / negative sentiment`.

Use a layered approach:

1. **Source bias lookup**
   Determine whether an outlet is left, center, or right.
2. **Story tone / emotional intensity**
   Determine whether coverage is calm, neutral, negative, or emotionally charged.
3. **Narrative comparison**
   Compare how left, center, and right outlets describe the same story.

That means we should **not** build our own full bias engine first. We should use existing datasets and free APIs wherever possible.

## APIs and Datasets To Use

### 1. PULSE Backend

Use first:

- `GET /api/feed`
- `GET /api/signals`
- `POST /api/portfolio-impact`
- `GET /api/briefing`

What to do:

- Use `GET /api/feed` as the source of truth for story cards.
- Filter and rank it in the mobile app using the user’s selected sectors, tickers, and topic interests.
- Use `GET /api/signals` only inside story detail, AI discussion context, and decision workspace.

### 2. AllSides Ratings + GitHub Mirror

Use for source-bias lookup.

Recommended implementation:

- Use AllSides as the methodology and source reference.
- For hackathon speed, seed a local outlet-bias lookup from the `AllSideR` GitHub dataset mirror.
- Store a normalized lookup in the frontend integration layer by domain and outlet name.

What to do:

- Map each source domain to `left`, `lean-left`, `center`, `lean-right`, or `right`.
- Compress the UI into `Left`, `Center`, `Right` by collapsing `lean-left` into left and `lean-right` into right.
- If an outlet is missing, show `Unrated`.

Why this is the right tradeoff:

- avoids building a custom bias model
- keeps bias labels explainable
- works well for U.S.-centric political framing

### 3. GDELT DOC 2.0 API

Use for free story-level tone and article expansion.

What to do:

- Query the story topic or headline keywords in `DOC 2.0`.
- Use the tone-related query features to see whether coverage is highly negative, neutral, or emotionally intense.
- Use returned article lists to validate that the current story is actually getting broad coverage.

Recommended uses:

- show `coverage intensity`
- show `tone volatility`
- show `supporting article count`

### 4. GDELT Context 2.0 API

Use for same-sentence context snippets.

What to do:

- Query the main event terms together in `Context 2.0`.
- Pull sentence-level snippets showing how outlets are actually phrasing the same event.
- Use this to power the `Source Lens` screen instead of generating everything yourself.

Recommended uses:

- short “how it’s being framed” cards
- quick quote-like context snippets
- comparison of wording across outlet groups

### 5. Apify

Use only when feed snippets are too short.

What to do:

- Use an RSS or article extraction actor to fetch full article body when a story detail view needs more text.
- Do not use Apify for every feed item.
- Only call it for opened stories or cached story-detail enrichment.

Recommended uses:

- article body extraction on demand
- missing image extraction
- fallback when RSS summary is poor

### 6. MiniMax

Use for synthesis, narrative comparison, and chat reasoning.

What to do:

- summarize the three framing buckets
- answer AI discussion prompts
- produce “potential impact” explanation blocks

Do **not** use MiniMax to invent bias labels from scratch if a source-bias lookup already exists.

## Bias Pipeline for the App

### Step 1. Classify the outlet

- Use outlet domain -> AllSides lookup -> `Left`, `Center`, `Right`, or `Unrated`

### Step 2. Measure tone

- Use GDELT DOC 2.0 to estimate:
  negative tone, neutral tone, or emotionally intense tone

### Step 3. Build the lens view

- Group fetched/supporting coverage by `Left`, `Center`, and `Right`
- Show outlet names and short context snippets
- Summarize each bucket with MiniMax

### Step 4. Show confidence

- If only one side has enough coverage, show `limited perspective coverage`
- If all three sides are represented, show `balanced perspective coverage`

## Personalization Rules

The app should feel personal from the first screen.

Store:

- preferred sectors
- watched tickers
- preferred story types
- risk horizon:
  short-term, swing, long-term
- previous chat threads
- saved decisions

Ranking rules for the feed:

1. Sector match
2. Ticker match
3. Saved-focus topic match
4. Urgency
5. Objectivity
6. Resume-history relevance

## Previous Chat History

Persist locally first:

- `focus_preferences`
- `chat_threads`
- `saved_decisions`
- `recent_story_views`

Thread model:

- `threadId`
- `storyId`
- `headline`
- `createdAt`
- `lastUpdatedAt`
- `messages`
- `linkedDecisionId`

This lets the user reopen an old story and continue the same discussion instead of starting over.

## Recommended Deliverables

- Bias lookup adapter
- GDELT tone adapter
- GDELT context adapter
- Apify enrichment adapter
- Personalized feed ranking helper
- Chat history persistence helper

## Source Links

- AllSides Media Bias Ratings: https://www.allsides.com/MEDIA-BIAS/RATINGS
- AllSides methodology and BY-NC note: https://www.allsides.com/media-bias/media-bias-rating-methods
- AllSideR GitHub mirror: https://github.com/favstats/AllSideR
- GDELT DOC 2.0: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
- GDELT Context 2.0: https://blog.gdeltproject.org/announcing-the-gdelt-context-2-0-api/
- Apify RSS/article scraper example: https://apify.com/scrapepilot/news-rss-feed-scraper
