# Native menu and WebView text editing

When the app calls `menu.setAsAppMenu()`, it replaces the platform default menu. On macOS this means the default Edit menu is no longer present unless the app explicitly adds it. Keep a standard Edit submenu with predefined `Undo`, `Redo`, `Cut`, `Copy`, `Paste`, and `SelectAll` items so WebView text inputs keep native editing behavior such as Cmd+A, Cmd+C, Cmd+V, and Cmd+X.

Do not patch individual inputs with custom clipboard shortcut handlers to recover these basics. Fix the application menu unless a specific component has a separate interaction bug.

## Troubleshooting

| Issue                                              | Solution                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------- |
| Text fields cannot paste, cut, copy, or select all | Ensure the app menu includes the standard Edit submenu with predefined edit items |
