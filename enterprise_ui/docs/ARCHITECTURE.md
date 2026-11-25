# Enterprise UI Architecture

## Responsibility split

| App | Owns |
| --- | --- |
| `frappe` / ERPNext / HRMS | Native form engine, validation, save/submit, permissions, grids, workflow |
| `enterprise_core` | Business logic, DocTypes, workflows, services, security |
| `enterprise_shell` | Launcher, sidebar, navigation, brand tokens |
| `enterprise_ui` | Form presentation only (theme, density, width, Auto Grid, optional layouts) |

## What Enterprise UI styles

- Desk standard Form View page background, header, sections, controls
- Tabs, child tables (visual only), sidebar, timeline
- Density: Comfortable / Compact
- Content width: Medium / Wide / Full
- Section style: Standard / Rich (optional metadata)
- **Top-aligned labels** (floating labels are not used)
- **Auto Grid**: responsive 2-column arrangement for normal fields

## What it deliberately does NOT override

- `frappe.ui.form.Form` class / prototype
- `frm.save()` / submit / cancel / amend
- Workflow engine, permissions, child Grid implementation
- Quick Entry dialogs, Web Forms, Print Formats, List View
- Business validation, mandatory rules, defaults
- Native control widgets (Link, Date, Select, Check, Table, …)

## Layout precedence

```text
1. Explicit Frappe DocType Layout / Column Break
        ↓ highest priority

2. Enterprise Form Configuration
   (Use Native / Grid Mode / section Columns / Field Spans)
        ↓

3. Enterprise UI Auto Grid
   (responsive 2-column only for a single effective .form-column)
        ↓

4. Native Frappe fallback
```

### Column Breaks win

Frappe v16 renders each section as:

```text
.form-section
  .section-head
  .section-body
    .form-column          (one per Column Break, plus the first column)
      form
        .frappe-control[data-fieldname][data-fieldtype]
```

If a section has **2 or more effective** `.form-column` nodes (each holding at least
one field that is not `.hide-control`), Enterprise UI does **not** auto-split it.
Native `col-sm-*` columns stay as authored. A later DocType Layout does the same:
Auto Grid steps aside for the whole form.

Native `.section-body` must not use `column-gap`. Frappe assigns `flex: 0 0 50%`
(or 33% / 25%). A gap on top of that makes the columns wrap, so a real two-column
section paints as one stacked list. Horizontal separation comes from the column
padding Frappe already applies. Auto Grid gap (`--eui-grid-gap-x` / `--eui-grid-gap-y`)
is only on the inner `<form>` of a single-column section.

A column that contains only hidden / `depends_on` fields is not effective, so it
does not block Auto Grid and does not leave an empty grid cell. That column is
marked `eui-column-vacant` and collapsed (`display: none`) so the empty Column
Break cannot sit as a blank flex row under the remaining fields. When a field
in it becomes visible, the class change re-runs layout and the Column Break
wins again.

### Auto Grid target

Auto Grid is **not** applied to `.section-body`. That element only wraps columns.
The grid is applied to the `<form>` inside the single `.form-column`, via
`data-eui-grid="2"` (attribute, not a class — `Column.refresh()` strips classes).

```text
single effective .form-column
  → data-eui-grid="2"
  → form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)) }
```

Default is 2 columns when the column content is at least ~560px wide (container
query on the column, not the browser window). Narrower columns fall back to 1
column. Native multi-column sections also stack when the section content is
under ~560px. Viewports at 767px and below always use one column.
**3 columns happen only** when Enterprise Form Configuration asks for them
(`grid_mode` or section Columns = 3) and the column is at least ~1040px wide.

Fields are never moved or cloned. Full-width types (`Table`, `Long Text`,
`Text Editor`, `Code`, `HTML`, …) get `data-eui-span="full"` and
`grid-column: 1 / -1`. Hidden fields use `display: none` and the grid reflows.

### Full-width fields

These span the full grid row by default:

- Long Text / Text Editor / Code / HTML / Markdown / JSON
- Table / Table MultiSelect
- Heading / Signature / Geolocation

Half-width by default: Data, Link, Select, Date, Datetime, Time, Phone, Currency,
Percent, Int, Float, Check, etc.

## Design tokens

- Source: `enterprise_ui/branding/tokens.py` + `public/css/tokens.css`
- CSS variables: `--eui-*`
- Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 32
- If `enterprise_shell` is installed, primary colors inherit `--es-brand-*`
- No client-specific hard-coding (company name, logo, domain)

## Configuration

### Enterprise UI Settings (Single)

Kill switch: **Enable Enterprise Forms = No** → native Frappe forms.

Defaults include density, content width, section style, and **Default Grid Mode**
(`Auto` | `Native` | `1 Column` | `2 Columns` | `3 Columns`).

### Enterprise Form Configuration (optional, one per DocType)

- Density / Content Width / Section Style
- **Grid Mode**: Inherit / Auto / Native / 1 / 2 / 3 Columns
- **Default Field Span**: Auto
- Optional **Sections** child (icon, subtitle, per-section Columns)
- Optional **Field Spans** child (fieldname → 1 / 2 / full) for rare exceptions
- `Use Native Form Appearance` short-circuits theming for that DocType

Absence of a configuration ⇒ global defaults apply automatically.

### Example customizations

| Request | Configuration |
| --- | --- |
| Employee Overview → 3 columns | Form Configuration `Grid Mode = 3 Columns` (or section Columns) |
| Purchase Order → stay native | `Use Native Form Appearance = Yes` or `Grid Mode = Native` |
| One section full width | Section row `Columns = Full Width` |

## Kill switch / uninstall

1. Disable **Enable Enterprise Forms**, or
2. `bench --site SITE uninstall-app enterprise_ui`

Business records are untouched. No data migration required to return to native styling.

## DocType Layout strategy

- Prefer global Auto Grid for all normal forms first
- Use native Frappe **DocType Layout** when field organization is intentionally custom
- Presentation layouts may live in `enterprise_ui`; business semantics stay in `enterprise_core`
- Do not invent a custom layout engine or clone/move field DOM nodes

## Profile pages (future)

- Hosted in `enterprise_ui` as presentation
- Data/actions from `enterprise_core` APIs
- Existing Employee Profile is **not** migrated in phase 1

## Assets

```text
app_include_css = enterprise_ui.bundle.css
app_include_js  = enterprise_ui.bundle.js
```

Build with `bench build --app enterprise_ui`. Do not invent manual `?v=` cache busting.

Concatenate CSS sources into `public/css/enterprise_ui.bundle.css` before build
(see `scripts/concat_css.sh`).

## Multi-site safety

Caches use `frappe.cache()` (site-aware). No module-level site settings globals.
Invalidation on update of Settings / Form Configuration.
