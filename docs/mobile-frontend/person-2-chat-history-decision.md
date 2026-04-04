# Person 2 Task: Chat, History, Decision, and Integration

## Owner

Frontend / Integration Person 2

## Write Scope

- `mobile/src/api/**`
- `mobile/src/contracts/**`
- `mobile/src/navigation/**`
- `mobile/src/state/**`
- `mobile/src/features/chat/**`
- `mobile/src/features/history/**`
- `mobile/src/features/decision/**`

Do not edit:

- `mobile/src/theme/**`
- `mobile/src/features/focus/**`
- `mobile/src/features/feed/**`
- `mobile/src/features/story/**`
- `mobile/src/features/sources/**`

## Objective

Build the intelligence and continuity layer around the feed.

## Screens To Build

### 1. AI Discussion

- story-aware chat thread
- suggested prompts
- impact analysis blocks
- resume thread support

### 2. Decision Workspace

- decision state
- personal note
- watchlist / alert / avoid / conviction actions
- linked story and linked chat summary

### 3. History

- previous chat threads
- saved decisions
- recently viewed stories

## Integration Responsibilities

### Backend

Use:

- `GET /api/feed`
- `GET /api/signals`
- `POST /api/portfolio-impact`
- `GET /api/briefing`

### External APIs

- AllSides lookup data for outlet bias
- GDELT DOC 2.0 for tone and coverage expansion
- GDELT Context 2.0 for sentence-level framing snippets
- Apify for on-demand full article extraction
- MiniMax for chat and comparison summaries

## Previous Chat History

Persist locally first.

Store:

- chat thread list
- messages per thread
- last opened thread
- decision records
- viewed story history

Recommended keys:

- `pulse.focus`
- `pulse.chatThreads`
- `pulse.decisions`
- `pulse.recentStories`

## Shared Contracts To Freeze

- `StoryContext`
- `FocusPreferences`
- `ChatThreadSummary`
- `DecisionRecord`

These should be written once at the start and then treated as stable.

## Acceptance Criteria

- user can open a story and continue an older discussion
- user can save a decision without leaving the app flow
- API code lives in one place
- local persistence survives app restart
- integration layer can be wired without touching Person 1 screens

## Demo Responsibility

This person can independently demo:

- AI discussion
- chat history
- resume conversation
- save a decision
- backend integration responses
