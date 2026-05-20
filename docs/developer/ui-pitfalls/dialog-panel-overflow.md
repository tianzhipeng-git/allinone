# Dialog and panel overflow

Dialogs, sidebars, and scroll panels often contain user-controlled strings such as file paths. Those strings are usually unbroken, so the browser gives them a large intrinsic minimum width. In flex or grid layouts this can push inputs, preview rows, or bordered containers outside their parent even when the visible text uses `truncate`.

When adding long text to a dialog or panel:

- Put `min-w-0` on the dialog child, flex row, scroll area, list item, and the text wrapper that should shrink.
- Put `overflow-hidden` on the visual boundary that must clip content, such as a bordered preview box.
- Use `truncate` only when losing the hidden tail is acceptable. For paths or identifiers users need to inspect, keep the text `whitespace-nowrap` inside an `overflow-auto` container instead.
- Mark fixed controls such as checkboxes and action buttons with `shrink-0` so the remaining space is assigned to the text.

```tsx
<div className="min-w-0 overflow-hidden rounded-md border">
  <div className="flex min-w-0 items-center gap-2">
    <Checkbox className="shrink-0" />
    <span className="min-w-0 flex-1 truncate">{label}</span>
    <Button className="shrink-0">...</Button>
  </div>
</div>
```

For full file paths, prefer a scrollable row:

```tsx
<div className="min-w-0 overflow-auto">
  <ul className="w-max min-w-full">
    <li className="min-w-0">
      <label className="flex min-w-max items-center gap-2">
        <Checkbox className="shrink-0" />
        <span className="whitespace-nowrap">{path}</span>
      </label>
    </li>
  </ul>
</div>
```
