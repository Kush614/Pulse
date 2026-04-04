# PULSE Mobile Frontend

Light-mode mobile app scaffold for the PULSE frontend and integration work.

## Target Stack

- Expo + React Native + TypeScript
- Expo Router for screen routing
- Zustand for app state
- MMKV or AsyncStorage for local persistence
- Existing PULSE backend for feed, signals, portfolio impact, and briefing

## Folder Structure

```text
mobile/
├── app/
│   └── README.md
└── src/
    ├── api/
    │   └── README.md
    ├── contracts/
    │   └── README.md
    ├── navigation/
    │   └── README.md
    ├── state/
    │   └── README.md
    ├── theme/
    │   └── README.md
    └── features/
        ├── focus/
        │   └── README.md
        ├── feed/
        │   └── README.md
        ├── story/
        │   └── README.md
        ├── sources/
        │   └── README.md
        ├── chat/
        │   └── README.md
        ├── history/
        │   └── README.md
        └── decision/
            └── README.md
```

## Ownership Split

- Person 1
  Focus, feed, story detail, source reporting, light-mode visual system.
- Person 2
  AI chat, previous chat history, decision workspace, API client layer, local persistence, navigation glue.

## Shared Rule

`mobile/src/contracts/` is frozen first and then treated as read-mostly. Both people build against the same route params and data shapes.
