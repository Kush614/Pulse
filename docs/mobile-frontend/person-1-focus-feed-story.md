# Person 1 Task: Focus, Feed, Story, and Source Lens

## Owner

Frontend Person 1

## Write Scope

- `mobile/src/theme/**`
- `mobile/src/features/focus/**`
- `mobile/src/features/feed/**`
- `mobile/src/features/story/**`
- `mobile/src/features/sources/**`

Do not edit:

- `mobile/src/api/**`
- `mobile/src/state/**`
- `mobile/src/navigation/**`
- `mobile/src/features/chat/**`
- `mobile/src/features/history/**`
- `mobile/src/features/decision/**`

## Objective

Build the entire user-facing discovery flow in light mode.

## Screens To Build

### 1. Focus Setup

- sector chips
- ticker chips
- topic chips
- optional risk horizon selector
- save profile button

### 2. Personalized Feed

- story card list
- objectivity score
- source count
- related tickers
- impact hint
- filter pills

### 3. Story Detail

- headline
- summary
- why it matters
- related sectors and tickers
- entry points to source lens, chat, and decision

### 4. Source Lens

- Left / Center / Right tabs or columns
- outlet chips
- short framing summaries
- source count per bucket

## Data Contract To Assume

Person 1 builds against mock data only.

Required incoming data:

- story id
- headline
- brief summary
- objectivity score
- source count
- urgency
- related tickers
- sector impact
- source bias buckets
- framing summaries

## Acceptance Criteria

- fully light mode
- no backend dependency during development
- complete feed -> story -> source lens flow
- visual hierarchy feels premium, not generic
- cards and detail screens work on phone-sized viewports

## Demo Responsibility

This person can independently demo:

- selecting preferences
- browsing personalized stories
- opening detail
- comparing source framing
