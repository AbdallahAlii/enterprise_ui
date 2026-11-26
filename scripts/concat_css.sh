#!/usr/bin/env bash
# Concatenate modular CSS sources into enterprise_ui.bundle.css for esbuild.
# pages.css must remain the full page/detail/table source — never a stub.
# A truncated pages.css previously caused production builds to drop UI styles
# while JS still worked (filters hide, etc.).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CSS_DIR="$ROOT/enterprise_ui/public/css"
OUT="$CSS_DIR/enterprise_ui.bundle.css"
PAGES="$CSS_DIR/pages.css"

REQUIRED_IN_PAGES=(
	".eui-page"
	".eui-detail-page"
	".eui-data-table"
	".eui-page-filters"
	".eui-kpi-grid"
)

if [[ ! -f "$PAGES" ]]; then
	echo "ERROR: missing $PAGES" >&2
	exit 1
fi

pages_lines="$(wc -l < "$PAGES" | tr -d ' ')"
if [[ "$pages_lines" -lt 400 ]]; then
	echo "ERROR: pages.css looks truncated ($pages_lines lines; expected >= 400)." >&2
	echo "       Restore full page/detail/table CSS before building, or production UI styles will be missing." >&2
	exit 1
fi

for sel in "${REQUIRED_IN_PAGES[@]}"; do
	if ! grep -qF "$sel" "$PAGES"; then
		echo "ERROR: pages.css is missing required selector: $sel" >&2
		echo "       concat aborted to protect production hashed CSS." >&2
		exit 1
	fi
done

{
	echo '/** enterprise_ui.bundle.css — concatenated for Frappe esbuild fingerprinting. */'
	echo ''
	for f in tokens.css forms.css sections.css controls.css tabs.css grids.css sidebar.css timeline.css pages.css responsive.css; do
		echo "/* ===== $f ===== */"
		cat "$CSS_DIR/$f"
		echo ''
	done
} > "$OUT"

out_lines="$(wc -l < "$OUT" | tr -d ' ')"
if [[ "$out_lines" -lt 2500 ]]; then
	echo "ERROR: enterprise_ui.bundle.css looks truncated after concat ($out_lines lines; expected >= 2500)." >&2
	exit 1
fi

echo "Wrote $OUT ($out_lines lines)"
