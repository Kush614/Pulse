# PULSE Mobile Frontend

Light-mode mobile app for the PULSE frontend and integration work.

## Current Status

Person 1 is implemented in a runnable Expo app:

- focus setup
- personalized feed
- story detail
- source lens

These flows are mock-driven on purpose so frontend discovery is finished before API integration, chat, and decision persistence land.

## Run It

```bash
cd mobile
npm install
npm run start
```

Optional verification commands:

```bash
npm run typecheck
npx expo export --platform web
```

## Target Stack

- Expo + React Native + TypeScript
- Existing PULSE backend for feed, signals, portfolio impact, and briefing
- Person 2 later adds API client, local persistence, and navigation glue

## Folder Structure

```text
mobile/
|-- App.tsx
|-- app/
|   `-- README.md
`-- src/
    |-- api/
    |   `-- README.md
    |-- contracts/
    |   `-- README.md
    |-- navigation/
    |   `-- README.md
    |-- state/
    |   `-- README.md
    |-- theme/
    |   |-- README.md
    |   |-- tokens.ts
    |   |-- ui.tsx
    |   `-- usePulseFonts.ts
    `-- features/
        |-- focus/
        |   |-- FocusSetupScreen.tsx
        |   `-- README.md
        |-- feed/
        |   |-- FeedScreen.tsx
        |   |-- StoryCard.tsx
        |   |-- story-helpers.ts
        |   `-- README.md
        |-- story/
        |   |-- StoryDetailScreen.tsx
        |   |-- types.ts
        |   `-- README.md
        |-- sources/
        |   |-- SourceLensScreen.tsx
        |   `-- README.md
        |-- chat/
        |   `-- README.md
        |-- history/
        |   `-- README.md
        `-- decision/
            `-- README.md
```

## Ownership Split

- Person 1: focus, feed, story detail, source reporting, light-mode visual system.
- Person 2: AI chat, previous chat history, decision workspace, API client layer, local persistence, navigation glue.

## Shared Rule

`mobile/src/contracts/` is frozen first and then treated as read-mostly. Both people build against the same route params and data shapes.
