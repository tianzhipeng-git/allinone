# Module Architecture

Pattern for building first-party modules as small apps inside allinone.

## Purpose

allinone is a desktop app shell that hosts independent everyday tools. Each tool should feel like a small app, but the codebase should remain a modular monolith:

- Modules are first-party code bundled with the app
- Modules are isolated by convention and folder boundaries
- Shared infrastructure stays in `src/lib`, `src/services`, `src/store`, and `src/components`
- Navigation, commands, settings, and persistence use the existing app systems

Do not build a dynamic plugin system unless the app explicitly needs third-party or runtime-loaded modules. The default architecture is simpler, typed, and easier to maintain.

## Mental Model

```
App Shell
├── Module registry
├── Navigation/sidebar
├── Command palette
├── Preferences
└── Active module surface
    ├── Notes module
    ├── Todos module
    ├── Clipboard module
    └── ...
```

The shell owns the frame. Modules own their own feature surface.

## Frontend Organization

```
src/
├── modules/              # First-party built-in apps
│   ├── registry.ts
│   ├── types.ts
│   ├── gtd/
│   └── clipboard/
├── components/           # Shared UI components only
├── lib/                  # Shared infrastructure and command system
├── services/             # Shared service wrappers
├── store/                # Global UI stores
└── types/                # Shared types
```

Each module should be self-contained:

```
src/modules/gtd/
├── index.ts              # Exports the module definition
├── GtdApp.tsx            # Main module surface
├── GtdRightSidebar.tsx   # Optional module-owned right sidebar
├── commands.ts           # Module command palette actions
├── services.ts           # Query hooks and Tauri command wrappers
├── store.ts              # Module-local UI state, if needed
├── types.ts              # Module-local domain types
├── tree.ts               # Pure business helpers
├── components/
└── __tests__/
```

## Module Definition

Use a static module registry. This keeps the app type-safe, tree-shakeable, and easy to inspect.

```typescript
export interface AppModule {
  id: string
  labelKey: string
  shortLabel: string
  aliases?: string[]
  icon: LucideIcon
  order: number
  component: React.LazyExoticComponent<React.ComponentType>
  rightSidebarComponent?: React.LazyExoticComponent<React.ComponentType>
  commands?: AppCommand[]
  quickSearch?: AppModuleQuickSearch
  settingsComponent?: React.ComponentType
}
```

```typescript
// src/modules/registry.ts
export const modules: AppModule[] = [homeModule, todosModule, notesModule].sort(
  (a, b) => a.order - b.order
)
```

Module IDs are stable API. Use lowercase kebab-case (`todos`, `daily-notes`, `clipboard-history`) and never reuse an ID for a different feature.

## Shell Integration

The app shell should use the registry as the single source of truth:

| Shell Area           | Source                                |
| -------------------- | ------------------------------------- |
| Sidebar navigation   | `modules` registry                    |
| Main content surface | Active module from registry           |
| Right sidebar        | Active module `rightSidebarComponent` |
| Command palette      | Global commands + module commands     |
| Preferences          | Global panes + module settings panes  |

Global UI state can track the active module:

```typescript
interface UIState {
  activeModuleId: string
  setActiveModuleId: (id: string) => void
}
```

Use selector syntax when reading it:

```typescript
// ✅ GOOD
const activeModuleId = useUIStore(state => state.activeModuleId)

// ❌ BAD
const { activeModuleId } = useUIStore()
```

See [state-management.md](./state-management.md) for store rules.

## State Boundaries

Follow the existing state onion inside each module.

| State Type                      | Location                        |
| ------------------------------- | ------------------------------- |
| Local presentation state        | `useState` inside components    |
| Module-local transient UI state | `src/modules/<module>/store.ts` |
| Cross-module shell UI state     | `src/store/ui-store.ts`         |
| Persistent module data          | TanStack Query + Tauri commands |
| Global preferences              | Preferences system              |

Modules should not store persistent business data directly in Zustand. Use TanStack Query over typed Tauri commands for persistent data.

## Module Isolation

Modules should not import from other modules.

```typescript
// ❌ BAD: Cross-module coupling
import { useTodoItems } from '@/modules/todos/services'

// ✅ GOOD: Extract shared behavior first
import { useTaggedItems } from '@/services/tagged-items'
```

If two modules need the same capability, move the shared part to one of these places:

| Shared Thing                | Location                       |
| --------------------------- | ------------------------------ |
| UI primitive                | `src/components/`              |
| Utility/helper              | `src/lib/`                     |
| Persistent data service     | `src/services/`                |
| Shared TypeScript type      | `src/types/`                   |
| Rust command/domain service | `src-tauri/src/` shared module |

## Commands

Each module can expose commands through its module definition.

```typescript
export const todoCommands: AppCommand[] = [
  {
    id: 'todos.create',
    labelKey: 'commands.todos.create.label',
    descriptionKey: 'commands.todos.create.description',
    group: 'todos',
    execute: () => {
      // Use store getState() or command context here
    },
  },
]
```

Command IDs must be namespaced by module ID (`todos.create`, `notes.open-today`). Labels and descriptions must use i18n keys.

See [command-system.md](./command-system.md).

## Quick Pane Search

Modules can opt into Quick Pane deep search with `quickSearch`. The Quick Pane
first searches registered modules by translated name, `shortLabel`, module ID,
and optional `aliases`. After a user highlights a module with keyboard
navigation and continues typing, the highlighted module's `quickSearch.search`
handler returns module-owned results.

```typescript
export interface AppModuleQuickSearch {
  search: (query: string) => Promise<AppModuleQuickSearchItem[]>
  submit: (itemId: string) => void | Promise<void>
}
```

The main window receives Quick Pane submissions, switches to the submitted
module, then calls that module's `quickSearch.submit`. Keep submit handlers
small and module-local: for example, the GTD module only selects the submitted
document ID in its own store.

## Persistence

Persistent module data should flow through Rust:

```
React module → TanStack Query → typed Tauri command → Rust storage/database
```

Query keys must include the module namespace:

```typescript
// ✅ GOOD
queryKey: ['module', 'todos', 'items']
queryKey: ['module', 'notes', 'note', noteId]

// ❌ BAD
queryKey: ['items']
```

For simple settings, use the preferences system. For relational or query-heavy user data, use SQLite through Rust command wrappers. Table names must be prefixed with the module ID, for example `gtd_groups` and `gtd_documents`. See [data-persistence.md](./data-persistence.md).

## Rust Organization

When a module needs backend commands, mirror the frontend module boundary:

```
src-tauri/src/
├── commands/
│   └── mod.rs
├── modules/
│   ├── gtd/
│   │   ├── commands.rs
│   │   ├── storage.rs
│   │   ├── types.rs
│   │   └── mod.rs
│   └── notes/
└── bindings.rs
```

Rust commands should still be registered through the existing tauri-specta binding flow. Frontend code must call generated commands from `@/lib/tauri-bindings`, not string-based `invoke`.

See [tauri-commands.md](./tauri-commands.md) and [rust-architecture.md](./rust-architecture.md).

## Internationalization

All module text uses translation keys.

```json
{
  "modules": {
    "todos": {
      "title": "Todos"
    }
  },
  "commands": {
    "todos": {
      "create": {
        "label": "Create todo",
        "description": "Add a new todo item"
      }
    }
  }
}
```

Use the module ID as the translation namespace under `modules`.

## When Adding a Module

1. Create `src/modules/<module-id>/`
2. Add `index.ts` with the module definition
3. Add the main module component
4. Add a right sidebar component when the module owns sidebar navigation or metadata
5. Add module commands only when they should appear globally
6. Add persistent data through typed Tauri commands when needed
7. Prefix TanStack Query keys and SQLite tables with the module ID
8. Register Rust commands in `src-tauri/src/bindings.rs` and run `pnpm run rust:bindings`
9. Register the module in `src/modules/registry.ts`
10. Add translation keys in every locale file
11. Add focused tests for business logic and module shell integration

## Anti-Patterns

| Avoid                                  | Use Instead                           |
| -------------------------------------- | ------------------------------------- |
| Dynamic runtime plugin loading         | Static module registry                |
| Module-to-module imports               | Shared service/lib extraction         |
| Persistent business data in Zustand    | TanStack Query + Tauri commands       |
| String-based Tauri `invoke`            | Generated typed commands              |
| Hardcoded module labels                | i18n translation keys                 |
| One giant `features/` folder           | One folder per built-in app module    |
| Global store fields for module details | Module-local store or component state |
