# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run tsc       # Type-check only (tsc -b)
npm run build     # Production build (Vite only — run tsc separately to type-check)
npm run preview   # Preview production build
npm run deploy    # Build + push dist/ to the `pages` branch for GitHub Pages
```

No test runner is configured. Formatting uses Prettier with `tabWidth: 4`.

## UI conventions

All hardcoded UI text (labels, button text, placeholders, error messages, headings, empty states) must be **lowercase**. This includes acronyms like "csv" and "json". User-entered content (names, transaction descriptions) is rendered as-is — do not apply `text-transform: lowercase` via CSS, as that would affect user data too.

## Architecture

IOU is a client-side-only React 19 + TypeScript app built with Vite. There is no backend, database, or authentication. State is persisted to `localStorage` (key `"iou-state"`) and rehydrated on load via `validateAppState`.

**State model** (`src/types.ts`):

- `AppState` holds two arrays: `people: Person[]` and `transactions: Transaction[]`.
- Each `Transaction` has a `splits` array of `SplitEntry` (each referencing a `personId` with either a `percent` or `amount` share) and a `status` of `"pending" | "confirmed"`.
- `CsvImportSession` is ephemeral import state (raw rows, column mapping, preview transactions) held separately from `AppState`.

**App shell** (`src/App.tsx`):

- Single `useState<AppState>` owns all persisted data. Mutation functions (`addPerson`, `removePerson`, `updateTransaction`, `deleteTransaction`, `confirmTransaction`, `deleteTransactions`, `commitImport`, `importState`) live here and are passed down as props.
- A second `useState<CsvImportSession | null>` tracks in-progress CSV imports.
- Tab routing is a simple `useState<Tab>` string — no router library.

**Tabs** (each is a top-level component under `src/components/`):
| Tab | Component | Purpose |
|-----|-----------|---------|
| People | `people/PeopleTab` | Add/remove people |
| Import | `import/ImportTab` | Multi-step CSV import flow (upload → column map → preview → commit) |
| Transactions | `transactions/TransactionsTab` | List transactions; inline `SplitEditor` for editing splits |
| Summary | `summary/SummaryTab` | Per-person balance totals (`computeBalances`) and `SpendingPieChart` |
| Save/Load | `saveload/SaveLoadTab` | JSON export and import of the full `AppState` |

**Utilities** (`src/utils.ts`): Pure functions for split arithmetic (`equalSplits`, `equalAmountSplits`, `validateSplits`), CSV-to-transaction conversion (`buildPreview`, `parseDate`), balance computation (`computeBalances`), and JSON save/load validation (`validateAppState`).

**Imports**: All internal imports use `.js` extensions (Vite/ESM convention with TypeScript `"moduleResolution": "bundler"` implied).
