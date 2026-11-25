# Enterprise UI

Optional modern Enterprise Form Theme and presentation layer for Frappe Desk.

## Architecture

```text
enterprise_core   → business logic, DocTypes, workflows, permissions
enterprise_shell  → launcher, sidebar, navigation, branding tokens
enterprise_ui     → Form View presentation only
```

`enterprise_ui` does **not** replace the Frappe Form engine. It styles native
`frappe.ui.form` views through scoped CSS and minimal lifecycle JS.

## Presentation defaults

- Top-aligned labels (no floating labels)
- Light outlined controls (~40px / 8px radius)
- Responsive **Auto Grid** (2 columns) when Column Breaks are not meaningful
- Compact section cards, consistent spacing scale (4–32)

### Layout precedence

```text
DocType Layout
  > Enterprise Form Configuration (Grid Mode / section Columns / Field Spans)
  > Auto Grid
  > native Frappe fallback
```

## Install

```bash
bench get-app /path/to/enterprise_ui   # or clone into apps/
bench --site SITE install-app enterprise_ui
bash apps/enterprise_ui/scripts/concat_css.sh
bench build --app enterprise_ui
bench --site SITE migrate
bench --site SITE clear-cache
```

## Kill switch

Open **Enterprise UI Settings** and set **Enable Enterprise Forms** to `No`.
Forms immediately return to native Frappe presentation.

## Documentation

See `enterprise_ui/docs/ARCHITECTURE.md`.
