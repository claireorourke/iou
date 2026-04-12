# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # TypeScript check + production build
npm run tsc       # Type-check only (tsc -b)
npm run preview   # Preview production build
```

No test runner is configured. Formatting uses Prettier with `tabWidth: 4`.

## Architecture

IOU is a client-side-only React 19 + TypeScript app built with Vite. All state lives in memory — there is no backend, database, or authentication.

**State model** (`src/types.ts`):
- `AppState` holds two arrays: `people: Person[]` and `transactions: Transaction[]`.
- Each `Transaction` has a `splits` array of `SplitEntry`, where each entry references a `personId` and specifies either a `percent` or `amount` share.
- `CsvImportSession` is ephemeral import state (raw rows, column mapping, preview transactions) held separately from `AppState`.

**App shell** (`src/App.tsx`):
- Single `useState<AppState>` owns all persisted data. All mutation functions (`addPerson`, `removePerson`, `updateTransaction`, `deleteTransaction`, `commitImport`, `importState`) live here and are passed down as props.
- A second `useState<CsvImportSession | null>` tracks in-progress CSV imports.
- Tab routing is a simple `useState<Tab>` string — no router library.

**Tabs** (each is a top-level component under `src/components/`):
| Tab | Component | Purpose |
|-----|-----------|---------|
| People | `people/PeopleTab` | Add/remove people |
| Import | `import/ImportTab` | Multi-step CSV import flow (upload → column map → preview → commit) |
| Transactions | `transactions/TransactionsTab` | List transactions; inline `SplitEditor` for editing splits |
| Summary | `summary/SummaryTab` | Per-person balance totals via `computeBalances` |
| Save/Load | `saveload/SaveLoadTab` | JSON export and import of the full `AppState` |

**Utilities** (`src/utils.ts`): Pure functions for split arithmetic (`equalSplits`, `equalAmountSplits`, `validateSplits`), CSV-to-transaction conversion (`buildPreview`, `parseDate`), balance computation (`computeBalances`), and JSON save/load validation (`validateAppState`).

**Imports**: All internal imports use `.js` extensions (Vite/ESM convention with TypeScript `"moduleResolution": "bundler"` implied).
