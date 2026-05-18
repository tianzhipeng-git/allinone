# GTD Module

Implementation notes for the Global Todo module.

## Purpose

GTD gives the app a global view over local project Markdown todo files. The app registers existing `.md` or `.markdown` files, stores their grouping metadata in SQLite, and edits the original files in place.

## Frontend Shape

```
src/modules/gtd/
├── index.ts                         # Module registry entry
├── GtdApp.tsx                       # Main editor surface
├── GtdRightSidebar.tsx              # Group and file tree
├── services.ts                      # TanStack Query hooks over typed commands
├── store.ts                         # Selected group/document UI state
├── tree.ts                          # Pure tree builder
├── components/
│   └── CrepeMarkdownEditor.tsx      # Milkdown Crepe integration
└── __tests__/
```

The left sidebar only launches modules. GTD owns the right sidebar because the folder/file tree is module-specific navigation.

## State Model

| State                         | Location                    |
| ----------------------------- | --------------------------- |
| Active app module             | `src/store/ui-store.ts`     |
| Selected GTD group/document   | `src/modules/gtd/store.ts`  |
| Registered groups/documents   | TanStack Query + SQLite     |
| Current Markdown editor draft | Local state in `GtdApp.tsx` |

Query keys must stay module-prefixed:

```typescript
;['module', 'gtd', 'tree'][('module', 'gtd', 'document', documentId)]
```

## Backend Shape

```
src-tauri/src/modules/gtd/
├── commands.rs      # gtd_* Tauri commands
├── storage.rs       # SQLite schema, queries, file IO
├── types.rs         # GtdGroup, GtdDocument, GtdTree
└── mod.rs
```

Commands are registered in `src-tauri/src/bindings.rs` and exported with `pnpm run rust:bindings`.

## Storage

SQLite tables:

- `gtd_groups`: nested app-level groups, independent from Markdown headings
- `gtd_documents`: registered file metadata, including canonical path and first Markdown heading

The Markdown content itself stays in the original local file. Rust validates the path, reads content for the editor, and saves with an atomic temporary-file rename.

## Editor

The Markdown editor uses Milkdown Crepe:

- Import the theme once in `src/App.css`
- Keep Crepe wrapped in a small component so lifecycle and `destroy()` stay contained
- Use `markdownUpdated` to sync drafts back to React state
- Avoid storing persistent Markdown content in Zustand; save through `gtdSaveDocument`

The next editor task can add custom ProseMirror plugins for heading, code block, and blockquote folding without changing the module boundary.

## Adding GTD Features

When extending GTD:

1. Add pure helpers under `src/modules/gtd/` and test them first
2. Add new persistent data in `storage.rs` with idempotent migrations
3. Expose backend operations through `commands.rs`
4. Run `pnpm run rust:bindings`
5. Add/update service hooks in `services.ts`
6. Add i18n keys in every locale file
7. Run `pnpm run check:all`
