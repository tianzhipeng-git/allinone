# GTD sidebar tree (react-arborist + Tauri)

Maintenance notes so we avoid regressing UX that bit us during DND/refactor.

1. **WebKit lacks reliable HTML5 DnD**  
   Inside Tauri/WKWebView, `react-dnd-html5-backend` drag often fails. Use `react-dnd-touch-backend` with `createDragDropManager(backend, _, { enableMouseEvents: true })` and pass the returned manager as arborist **`dndManager`** (direct deps: `dnd-core`, `react-dnd-touch-backend`, aligned with `react-dnd` @14).

2. **Drag handle UX**  
   Keep **`dragHandle`** on a **narrow grip** only—not the whole row. Target a slim column (e.g. **`h-7 w-4`**, icon `size-3`), **small row padding** (`ps-1`, optional **`indent`** 12), and **separate** folder/file icon (`size-4` + **`size-3`** glyph) so the leading chrome does not eat the label. **Show the grip icon only on row hover** (`opacity-0` + `group-hover/gtd-tree-row:opacity-100`, keep visible while `node.isDragging`). Tooltip copy lives under `modules.gtd.sidebar.dragHandleHint`.

3. **Folder row clicks: expand/collapse ≠ navigation**  
   Calling arborist **`node.handleClick()`** on folders runs **`select` + `activate`**, which invokes `onActivate` → `handleSelectTreeItem` → e.g. `setSelectedDocumentId(null)`. That **clears the main editor**.  
   **Rule:** ordinary folder-row clicks (`GtdTreeRow`) **only call `node.toggle()`** (with modifier exclusions as needed); **do not call `handleClick`** for folders. Document rows **must still** call `handleClick`.

4. **Controlled `selection` vs `scrollTo(document)`**  
   If folder rows mistakenly call `handleClick` before toggle while a document under that folder stays the controlled `selection` prop, arborist runs `select(doc)`/`scrollTo` → **`openParents(doc)`**, which **re-opens a folder right after collapsing**. Fixing (3) removes the main symptom; historically we also experimented with reordering toggle/select.

5. **Never auto-pick “first document” on `selectedDocumentId === null`**  
   Logic like `useEffect(..., setSelectedDocumentId(documents[0]))` jumps the editor whenever the user clears the document (folder-only tree focus, dialogs, moves). Prefer an **explicit empty/editor placeholder** (`GtdApp`).

6. **Hidden Inbox root**  
   Stored tree has a synthetic parent for top-level visibility; arborist `"root"` is internal. See `TREE_ROOT_ID` mapping in `GtdRightSidebar` `handleMoveTreeItem`.

7. **`disableDrop`**  
   Only allow dropping onto **`group`** parents (documents are leaves). Arborist passes the **destination parent** node, not necessarily the hovered row’s own data shape—check **`parentNode.isRoot`** as well.

**Runtime behavior summary:** The GTD tree uses `react-arborist`. **Folder clicks only toggle.** **Dragging** uses **`dndManager` + grip-only **`dragHandle`**. **Moves** normalize root drops via the hidden inbox group in **`GtdRightSidebar`**.
