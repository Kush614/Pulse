# PULSE Mobile Frontend Plan

This frontend plan is for a **light-mode mobile app** focused on:

- personalized sector-based discovery
- transparent left / center / right source framing
- AI discussion before any investment decision
- previous chat history and saved decision continuity

## Product Loop

1. User selects sectors, tickers, and topic interests.
2. App loads a personalized feed from the backend.
3. User opens a story and sees:
   summary, source count, objectivity score, bias framing, related tickers, and source reporting detail.
4. User opens the AI chat to discuss potential impacts.
5. User records a personal decision:
   watch, avoid, alert, or high-conviction.
6. User can revisit the same story later from chat history or saved decisions.

## Screen List

### 1. Focus Setup

- Light background with chip selectors
- Inputs:
  sectors, tickers, risk horizon, story types, and notification preference
- Output:
  a saved focus profile used to rank the feed

### 2. Personalized Feed

- Story cards with:
  topic tag, headline, objectivity score, source count, time, impact hint, related tickers
- Quick filter pills:
  `My Sectors`, `Breaking`, `Policy`, `Earnings`, `Supply Chain`, `Saved`

### 3. Story Detail

- Hero headline
- 2-3 sentence summary
- why this matters block
- related sectors and tickers
- buttons:
  `Discuss With AI`, `View Sources`, `Save Decision`

### 4. Source Lens

- Three framing columns:
  Left, Center, Right
- Each column shows:
  short framing summary, outlet chips, source count, and how the wording differs

### 5. AI Discussion

- Chat header pinned to the active story
- Suggested prompts:
  `Bull case`, `Bear case`, `Second-order effects`, `What should I monitor next?`
- Chat history is visible and resumable

### 6. Decision Workspace

- User-owned decision, not auto-trading
- Actions:
  `Do Nothing`, `Watchlist`, `Set Alert`, `Need More Research`, `High Conviction`
- Stores note, timestamp, linked story, and linked chat

### 7. History

- Previous chat threads
- Saved decisions
- Recently viewed stories
- Resume directly into a thread or decision record

## Light-Mode Design Direction

- Background: `#F6F7F4`
- Card: `#FFFFFF`
- Primary text: `#111827`
- Secondary text: `#667085`
- Border: `#E7ECF2`
- Accent: `#0EA5E9`
- Positive: `#1F9D55`
- Warning: `#D97706`
- Negative: `#D64545`
- Left bias: `#3B82F6`
- Center bias: `#94A3B8`
- Right bias: `#F97316`

## Demo Flow

1. User opens the app and selects `Semiconductors`, `Materials`, and `Geopolitics`.
2. Feed shows a top story on `China rare earth export controls`.
3. Story detail shows why the story matters to `MP`, `XLB`, and `SMH`.
4. Source Lens shows how left, center, and right outlets frame the same topic.
5. User opens AI chat and asks:
   `What are the first and second-order effects on semis?`
6. User saves:
   `SMH -> set alert`, `MP -> watchlist`.
7. Later, the user opens History and resumes the same thread.

## Shared Contract Rule

Both frontend people build against fixed backend shapes and fixed route params. Shared contracts are written once, then treated as frozen.
