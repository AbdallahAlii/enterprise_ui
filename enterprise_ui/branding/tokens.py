"""Enterprise UI design tokens.

Standalone-safe: works without enterprise_shell.
When enterprise_shell is installed, primary brand colors inherit from shell tokens.
Never hard-code client-specific branding (company names, logos, site domains).
"""

from __future__ import annotations

from typing import Any


# Neutral Frappe-compatible fallbacks (not client-specific).
PRIMARY = "#2f6fbf"
PRIMARY_HOVER = "#275fa5"
PRIMARY_SOFT = "rgba(47, 111, 191, 0.12)"
PRIMARY_FOCUS = "rgba(47, 111, 191, 0.22)"

PAGE_BG = "#eef1f5"
SURFACE = "#ffffff"
SURFACE_MUTED = "#f7f8fa"
SECTION_BG = "#ffffff"
TEXT = "#111827"
TEXT_MUTED = "#4b5563"
TEXT_PLACEHOLDER = "#94a3b8"
BORDER = "#e5e7eb"
BORDER_STRONG = "#d1d5db"

INPUT_BG = "#fbfcfd"
INPUT_BG_HOVER = "#f8fafc"
INPUT_BG_FOCUS = "#ffffff"
INPUT_BORDER = "#d1d5db"
INPUT_BORDER_HOVER = "#9ca3af"

SUCCESS = "#15803d"
WARNING = "#b45309"
DANGER = "#b91c1c"
INFO = "#1d4ed8"
NEUTRAL = "#6b7280"

RADIUS_SM = "8px"
RADIUS_MD = "10px"
RADIUS_LG = "12px"
CONTROL_RADIUS = "8px"
SECTION_RADIUS = "10px"

FORM_MEDIUM_WIDTH = "1100px"
FORM_WIDE_WIDTH = "1280px"
FORM_MAX_WIDTH = "1100px"

COMFORTABLE = {
	"control_height": "40px",
	"field_gap": "16px",
	"section_padding": "18px",
	"section_gap": "14px",
	"section_radius": "10px",
	"label_size": "12px",
	"grid_row_height": "36px",
}

COMPACT = {
	"control_height": "34px",
	"field_gap": "12px",
	"section_padding": "16px",
	"section_gap": "12px",
	"section_radius": "10px",
	"label_size": "12px",
	"grid_row_height": "32px",
}


def _shell_theme() -> dict[str, Any]:
	"""Optional Enterprise Shell brand tokens — soft dependency."""
	try:
		import frappe

		if "enterprise_shell" not in frappe.get_installed_apps():
			return {}
		from enterprise_shell.branding.theme import get_theme

		return get_theme() or {}
	except Exception:
		return {}


def get_token_payload() -> dict[str, Any]:
	shell = _shell_theme()
	primary = str(shell.get("primary") or PRIMARY)
	primary_hover = str(shell.get("primary_hover") or PRIMARY_HOVER)
	primary_soft = str(shell.get("primary_soft") or PRIMARY_SOFT)
	primary_focus = str(shell.get("primary_focus") or PRIMARY_FOCUS)
	text = str(shell.get("content_text") or TEXT)
	text_muted = str(shell.get("content_text_muted") or TEXT_MUTED)

	return {
		"primary": primary,
		"primary_hover": primary_hover,
		"primary_soft": primary_soft,
		"primary_focus": primary_focus,
		"page_bg": PAGE_BG,
		"surface": SURFACE,
		"surface_muted": SURFACE_MUTED,
		"section_bg": SECTION_BG,
		"text": text,
		"text_muted": text_muted,
		"text_placeholder": TEXT_PLACEHOLDER,
		"border": BORDER,
		"border_strong": BORDER_STRONG,
		"input_bg": INPUT_BG,
		"input_bg_hover": INPUT_BG_HOVER,
		"input_bg_focus": INPUT_BG_FOCUS,
		"input_border": INPUT_BORDER,
		"input_border_hover": INPUT_BORDER_HOVER,
		"success": SUCCESS,
		"warning": WARNING,
		"danger": DANGER,
		"info": INFO,
		"neutral": NEUTRAL,
		"radius_sm": RADIUS_SM,
		"radius_md": RADIUS_MD,
		"radius_lg": RADIUS_LG,
		"control_radius": CONTROL_RADIUS,
		"section_radius": SECTION_RADIUS,
		"form_max_width": FORM_MAX_WIDTH,
		"form_medium_width": FORM_MEDIUM_WIDTH,
		"form_wide_width": FORM_WIDE_WIDTH,
		"comfortable": dict(COMFORTABLE),
		"compact": dict(COMPACT),
		"shell_integrated": bool(shell),
	}


def get_css_variables() -> dict[str, str]:
	tokens = get_token_payload()
	comfortable = tokens["comfortable"]
	compact = tokens["compact"]

	variables = {
		"--eui-primary": tokens["primary"],
		"--eui-primary-hover": tokens["primary_hover"],
		"--eui-primary-soft": tokens["primary_soft"],
		"--eui-primary-focus": tokens["primary_focus"],
		# Surface and input colors stay in tokens.css so dark mode can override them.
		# Do not emit them here — boot used to inline light values onto :root.
		"--eui-success": tokens["success"],
		"--eui-warning": tokens["warning"],
		"--eui-danger": tokens["danger"],
		"--eui-info": tokens["info"],
		"--eui-neutral": tokens["neutral"],
		"--eui-radius-sm": tokens["radius_sm"],
		"--eui-radius-md": tokens["radius_md"],
		"--eui-radius-lg": tokens["radius_lg"],
		"--eui-control-radius": tokens["control_radius"],
		"--eui-section-radius": tokens["section_radius"],
		"--eui-form-max-width": tokens["form_max_width"],
		"--eui-form-medium-width": tokens["form_medium_width"],
		"--eui-form-wide-width": tokens["form_wide_width"],
		"--eui-control-height": comfortable["control_height"],
		"--eui-control-height-comfortable": comfortable["control_height"],
		"--eui-control-height-compact": compact["control_height"],
		"--eui-field-gap": comfortable["field_gap"],
		"--eui-section-padding": comfortable["section_padding"],
		"--eui-section-gap": comfortable["section_gap"],
		"--eui-label-size": comfortable["label_size"],
		"--eui-body-size": "14px",
		"--eui-helper-size": "12px",
		"--eui-checkbox-size": "16px",
		"--eui-grid-gap-x": "20px",
		"--eui-grid-gap-y": comfortable["field_gap"],
		"--eui-toolbar-button-size": "32px",
		"--eui-toolbar-icon-size": "16px",
		"--eui-grid-row-height": comfortable["grid_row_height"],
		"--eui-transition-fast": "160ms",
		"--eui-density-comfortable-control-height": comfortable["control_height"],
		"--eui-density-comfortable-field-gap": comfortable["field_gap"],
		"--eui-density-comfortable-section-padding": comfortable["section_padding"],
		"--eui-density-comfortable-section-gap": comfortable["section_gap"],
		"--eui-density-comfortable-section-radius": comfortable["section_radius"],
		"--eui-density-comfortable-label-size": comfortable["label_size"],
		"--eui-density-comfortable-grid-row-height": comfortable["grid_row_height"],
		"--eui-density-compact-control-height": compact["control_height"],
		"--eui-density-compact-field-gap": compact["field_gap"],
		"--eui-density-compact-section-padding": compact["section_padding"],
		"--eui-density-compact-section-gap": compact["section_gap"],
		"--eui-density-compact-section-radius": compact["section_radius"],
		"--eui-density-compact-label-size": compact["label_size"],
		"--eui-density-compact-grid-row-height": compact["grid_row_height"],
	}

	if tokens.get("shell_integrated"):
		variables["--eui-primary"] = "var(--es-brand-primary, " + tokens["primary"] + ")"
		variables["--eui-primary-hover"] = "var(--es-brand-primary-hover, " + tokens["primary_hover"] + ")"
		variables["--eui-primary-soft"] = "var(--es-brand-primary-soft, " + tokens["primary_soft"] + ")"
		variables["--eui-primary-focus"] = "var(--es-brand-primary-focus, " + tokens["primary_focus"] + ")"

	return variables
