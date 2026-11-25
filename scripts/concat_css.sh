#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CSS_DIR="$ROOT/enterprise_ui/public/css"
OUT="$CSS_DIR/enterprise_ui.bundle.css"
{
  echo '/** enterprise_ui.bundle.css — concatenated for Frappe esbuild fingerprinting. */'
  echo ''
  for f in tokens.css forms.css sections.css controls.css tabs.css grids.css sidebar.css timeline.css pages.css responsive.css; do
    echo "/* ===== $f ===== */"
    cat "$CSS_DIR/$f"
    echo ''
  done
} > "$OUT"
echo "Wrote $OUT ($(wc -l < "$OUT") lines)"
