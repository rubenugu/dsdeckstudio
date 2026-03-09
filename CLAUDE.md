# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server on port 8080
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Run Vitest once
npm run test:watch # Vitest in watch mode
npm run preview    # Preview production build
```

## Architecture

**Active Recall Studio** is a spaced repetition flashcard app for Data Science learning. It's an offline-first SPA that syncs to Supabase.

### Data Flow

1. **Local state**: Zustand store (`src/store/useDeckStore.ts`) persists cards, streak, and study sessions to `localStorage` via the `persist` middleware.
2. **Cloud sync**: `src/hooks/useSupabaseSync.ts` handles bidirectional sync — loads on login, upserts/deletes on change.
3. **Auth**: Supabase Auth via `src/contexts/AuthContext.tsx`.

### Routing & Layout

`App.tsx` wraps everything in providers (QueryClient, AuthContext, LanguageContext). `src/index.tsx` (not `main.tsx`) is the main layout shell — it renders the Sidebar, TopBar, and routes to the 6 main pages via `AnimatedPage`.

Pages: Dashboard, Study, QuickQuiz, AllCards, AddCard, Settings, Auth.

### Spaced Repetition

SM-2 algorithm lives in `src/utils/sm2.ts`. It accepts a quality rating (0–5) and returns updated `easeFactor`, `interval`, `repetitions`, and `nextReviewDate` fields — all stored on the `Flashcard` type in the Zustand store.

### Flashcard Schema

Cards have these SM-2 fields (added recently): `easeFactor`, `interval`, `repetitions`, `nextReviewDate`. They also have `shortAnswer` (brief hint shown before revealing full answer) and `codeExample` for syntax-highlighted code blocks.

### Supabase

Client singleton at `src/integrations/supabase/client.ts`. Types at `src/integrations/supabase/types.ts`. Credentials in `.env` (not committed). Main tables: `flashcards`, `study_sessions`, `user_settings`.

### i18n

English/Spanish via `src/i18n/translations.ts` and `LanguageContext`. All user-facing strings should use the translation hook.

### UI Components

Uses shadcn-ui (`src/components/ui/`) with Radix UI primitives and Tailwind CSS. Theme (dark/light) uses CSS variables defined in `src/index.css`. Path alias `@/` maps to `src/`.

### Clean commits

NEVER ADD CLAUDE CO-AUTHOR CREDITS OR "GENERATED WITH CLAUDE CODE" FOOTERS