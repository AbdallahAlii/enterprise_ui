"""Whitelisted helpers for Enterprise Form presentation config."""

from __future__ import annotations

import frappe

from enterprise_ui.services.form_resolver import get_boot_settings, resolve_form_presentation


@frappe.whitelist()
def get_ui_settings():
	"""Return global settings + form configs (authenticated Desk users)."""
	if frappe.session.user == "Guest":
		frappe.throw("Not permitted", frappe.PermissionError)
	return get_boot_settings()


@frappe.whitelist()
def resolve_form(doctype: str | None = None):
	"""Resolve presentation for one DocType."""
	if frappe.session.user == "Guest":
		frappe.throw("Not permitted", frappe.PermissionError)
	doctype = (doctype or "").strip()
	if not doctype:
		frappe.throw("doctype is required")
	return resolve_form_presentation(doctype)
