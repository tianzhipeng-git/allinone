# GTD Module

Implementation notes for the Global Todo module.

## Purpose

GTD gives the app a global view over local project Markdown todo files. The app registers existing `.md` or `.markdown` files, stores their grouping metadata in SQLite, and edits the original files in place.

## Frontend Shape

```
src/modules/gtd/
├── index.ts                              # Module registry entry
├── GtdApp.tsx                            # Main editor surface (no implicit document!)
├── GtdRightSidebar.tsx                   # Group/file tree wiring + dialogs
├── services.ts                           # TanStack Query hooks over typed commands
├── store.ts                              # Selected group/document UI state
├── tree.ts                               # Pure tree builder
├── components/
│   ├── GtdSidebarTree.tsx                # react-arborist tree UI (row/grip/DND)
│   └── CrepeMarkdownEditor.tsx           # Milkdown Crepe integration
└── __tests__/
```

The left sidebar only launches modules. GTD owns the right sidebar because the folder/file tree is module-specific navigation.

## Sidebar tree pitfalls (react-arborist + Tauri)

See [UI Pitfalls — GTD sidebar tree](./ui-pitfalls/gtd-sidebar-tree-arborist.md).

## State Model

| State                         | Location                    |
| ----------------------------- | --------------------------- |
| Active app module             | `src/store/ui-store.ts`     |
| Selected GTD group/document   | `src/modules/gtd/store.ts`  |
| Registered groups/documents   | TanStack Query + SQLite     |
| Current Markdown editor draft | Local state in `GtdApp.tsx` |

`selectedDocumentId` may be null while `selectedGroupId` is set (for example before any Markdown has been activated). **`GtdApp` must not substitute `documents[0]` or any other implicit document when that happens**, or the editor selection will jump unpredictably. Show the empty selection state until the user opens a Markdown file (see [UI Pitfalls — GTD sidebar tree](./ui-pitfalls/gtd-sidebar-tree-arborist.md) §5).
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
- `gtd_documents`: registered file metadata, including canonical path, first Markdown heading, and the GTD display title. The display title is an app-level alias and does not rename the original Markdown file.

Groups can be renamed, moved under another group, and deleted only when empty. Documents can be moved between groups, renamed in GTD without changing their filesystem path, and removed from GTD without deleting the original Markdown file.

Directory imports use a preview command before registration: files register directly after path validation, while directories are recursively scanned for `.md` and `.markdown` files. The preview UI must let users choose which discovered files to register instead of registering the full scan result blindly.

The Markdown content itself stays in the original local file. Rust validates the path, reads content for the editor, and saves with an atomic temporary-file rename.

## Editor

The Markdown editor uses Milkdown Crepe:

- Import the theme once in `src/App.css`
- Keep Crepe wrapped in a small component so lifecycle and `destroy()` stay contained
- Use `markdownUpdated` to sync drafts back to React state
- Keep GTD-specific ProseMirror plugins under `components/gtdMarkdownPlugins.ts`
- Keep Crepe `BlockEdit` enabled for the slash menu, but hide the floating block handle controls in GTD because they overlap folding controls and Tauri WebView drag handling is brittle there
- Limit headings to levels 1-4 and use the GTD plugin to normalize deeper headings
- Support folding for headings, whole code blocks, and whole blockquotes through decorations
- Avoid storing persistent Markdown content in Zustand; save through `gtdSaveDocument`

## Adding GTD Features

When extending GTD:

1. Add pure helpers under `src/modules/gtd/` and test them first
2. Add new persistent data in `storage.rs` with idempotent migrations
3. Expose backend operations through `commands.rs`
4. Run `pnpm run rust:bindings`
5. Add/update service hooks in `services.ts`
6. Add i18n keys in every locale file
7. Run `pnpm run check:all`
