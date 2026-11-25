"""Resolve Enterprise Form presentation settings.

Layout precedence (site-safe, no DocType if/else chains in frontend):

1. DocType Layout (detected client-side when active)
2. Enterprise Form Configuration (grid_mode / section columns / field spans)
3. Enterprise UI Auto Grid (responsive 2-column when Column Breaks are not meaningful)
4. Native Frappe fallback

Also:

1. Global Enterprise UI Settings
2. Optional Enterprise Form Configuration for the DocType
3. Inherit / override density, width, section style, grid mode
4. Use Native Form Appearance short-circuits theming for that DocType
"""

from __future__ import annotations

from typing import Any

import frappe

from enterprise_ui.services.cache import (
	get_cached_boot_settings,
	get_cached_form_config,
	set_cached_boot_settings,
	set_cached_form_config,
)

DEFAULTS = {
	"enabled": 1,
	"enable_enterprise_forms": 1,
	"default_form_density": "Comfortable",
	"default_content_width": "Wide",
	"default_section_style": "Standard",
	"default_grid_mode": "Auto",
	"enable_form_header_styling": 1,
	"enable_child_table_styling": 1,
	"enable_timeline_styling": 1,
	"enable_profile_pages": 0,
}


def _settings_exist() -> bool:
	return bool(frappe.db.exists("DocType", "Enterprise UI Settings"))


def get_settings_doc() -> dict[str, Any]:
	if not _settings_exist():
		return dict(DEFAULTS)
	try:
		doc = frappe.get_cached_doc("Enterprise UI Settings")
		return {
			"enabled": int(doc.get("enabled") or 0),
			"enable_enterprise_forms": int(doc.get("enable_enterprise_forms") or 0),
			"default_form_density": doc.get("default_form_density") or DEFAULTS["default_form_density"],
			"default_content_width": doc.get("default_content_width") or DEFAULTS["default_content_width"],
			"default_section_style": doc.get("default_section_style") or DEFAULTS["default_section_style"],
			"default_grid_mode": doc.get("default_grid_mode") or DEFAULTS["default_grid_mode"],
			"enable_form_header_styling": int(doc.get("enable_form_header_styling") or 0),
			"enable_child_table_styling": int(doc.get("enable_child_table_styling") or 0),
			"enable_timeline_styling": int(doc.get("enable_timeline_styling") or 0),
			"enable_profile_pages": int(doc.get("enable_profile_pages") or 0),
		}
	except Exception:
		return dict(DEFAULTS)


def get_form_configs_map() -> dict[str, dict[str, Any]]:
	"""Load all enabled form configurations once for boot (small set expected)."""
	if not frappe.db.exists("DocType", "Enterprise Form Configuration"):
		return {}

	rows = frappe.get_all(
		"Enterprise Form Configuration",
		filters={"enabled": 1},
		fields=[
			"name",
			"document_type",
			"enabled",
			"density",
			"content_width",
			"section_style",
			"grid_mode",
			"default_field_span",
			"use_native_form_appearance",
		],
	)
	configs: dict[str, dict[str, Any]] = {}
	for row in rows:
		doctype = row.get("document_type")
		if not doctype:
			continue
		sections = []
		if frappe.db.exists("DocType", "Enterprise Form Section"):
			sections = frappe.get_all(
				"Enterprise Form Section",
				filters={"parent": row.name, "parenttype": "Enterprise Form Configuration"},
				fields=["section_fieldname", "icon", "subtitle", "style", "columns"],
				order_by="idx asc",
			)
		field_spans = []
		if frappe.db.exists("DocType", "Enterprise Form Field Span"):
			field_spans = frappe.get_all(
				"Enterprise Form Field Span",
				filters={"parent": row.name, "parenttype": "Enterprise Form Configuration"},
				fields=["fieldname", "span"],
				order_by="idx asc",
			)
		configs[doctype] = {
			"name": row.name,
			"document_type": doctype,
			"enabled": int(row.enabled or 0),
			"density": row.density or "Inherit",
			"content_width": row.content_width or "Inherit",
			"section_style": row.section_style or "Inherit",
			"grid_mode": row.get("grid_mode") or "Inherit",
			"default_field_span": row.get("default_field_span") or "Auto",
			"use_native_form_appearance": int(row.use_native_form_appearance or 0),
			"sections": sections,
			"field_spans": field_spans,
		}
	return configs


def get_boot_settings() -> dict[str, Any]:
	cached = get_cached_boot_settings()
	if cached:
		return cached

	settings = get_settings_doc()
	payload = {
		**settings,
		"form_configs": get_form_configs_map(),
	}
	set_cached_boot_settings(payload)
	return payload


def get_form_config(doctype: str) -> dict[str, Any] | None:
	if not doctype:
		return None
	cached = get_cached_form_config(doctype)
	if cached is not None:
		return cached or None

	boot = get_boot_settings()
	config = (boot.get("form_configs") or {}).get(doctype)
	set_cached_form_config(doctype, config or {})
	return config


def resolve_form_presentation(doctype: str) -> dict[str, Any]:
	"""Resolve final presentation attributes for a DocType."""
	settings = get_settings_doc()
	result = {
		"active": False,
		"density": settings["default_form_density"],
		"content_width": settings["default_content_width"],
		"section_style": settings["default_section_style"],
		"grid_mode": settings.get("default_grid_mode") or "Auto",
		"default_field_span": "Auto",
		"header_styling": bool(settings["enable_form_header_styling"]),
		"child_table_styling": bool(settings["enable_child_table_styling"]),
		"timeline_styling": bool(settings["enable_timeline_styling"]),
		"sections": [],
		"field_spans": [],
		"use_native": False,
	}

	if not settings.get("enabled") or not settings.get("enable_enterprise_forms"):
		return result

	config = get_form_config(doctype)
	if config and config.get("use_native_form_appearance"):
		result["use_native"] = True
		return result

	if config:
		if config.get("density") and config["density"] != "Inherit":
			result["density"] = config["density"]
		if config.get("content_width") and config["content_width"] != "Inherit":
			result["content_width"] = config["content_width"]
		if config.get("section_style") and config["section_style"] != "Inherit":
			result["section_style"] = config["section_style"]
		if config.get("grid_mode") and config["grid_mode"] != "Inherit":
			result["grid_mode"] = config["grid_mode"]
		if config.get("default_field_span") and config["default_field_span"] != "Inherit":
			result["default_field_span"] = config["default_field_span"]
		result["sections"] = config.get("sections") or []
		result["field_spans"] = config.get("field_spans") or []

	result["active"] = True
	return result
