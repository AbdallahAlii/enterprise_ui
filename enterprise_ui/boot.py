"""Expose Enterprise UI settings on Frappe boot for early, layout-stable form theming."""

from __future__ import annotations

import frappe

from enterprise_ui.branding.tokens import get_css_variables, get_token_payload
from enterprise_ui.services.form_resolver import get_boot_settings


def extend_bootinfo(bootinfo):
	try:
		bootinfo.enterprise_ui = get_boot_settings()
		bootinfo.enterprise_ui_tokens = get_token_payload()
		bootinfo.enterprise_ui_css_variables = get_css_variables()
	except Exception:
		frappe.log_error(frappe.get_traceback(), "enterprise_ui: boot failed")
		bootinfo.enterprise_ui = {
			"enabled": 0,
			"enable_enterprise_forms": 0,
			"default_form_density": "Comfortable",
			"default_content_width": "Wide",
			"default_section_style": "Standard",
			"enable_form_header_styling": 1,
			"enable_child_table_styling": 1,
			"enable_timeline_styling": 1,
			"enable_profile_pages": 0,
			"form_configs": {},
			"error": True,
		}
		bootinfo.enterprise_ui_tokens = {}
		bootinfo.enterprise_ui_css_variables = {}
