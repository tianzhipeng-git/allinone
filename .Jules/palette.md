## 2026-05-26 - Add aria-labels to icon-only buttons
**Learning:** Icon-only buttons using Radix UI or custom button variants often only have `title` tags for hover hints. While some screen readers read `title`, adding explicit `aria-label` using existing translation keys provides robust and standard accessibility without adding extra UI clutter.
**Action:** Always check if `size="icon"` or similar icon-only buttons have an `aria-label`. If a `title` or `tooltip` exists, use the same string for `aria-label` to ensure keyboard and screen reader accessibility.
