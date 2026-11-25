"""Site-safe Enterprise UI cache helpers.

Uses frappe.cache() which is site-aware. Never store site-specific data in
module-level globals.
"""

from __future__ import annotations

import frappe

CACHE_NAMESPACE = "enterprise_ui"
BOOT_CACHE_KEY = "boot_settings"
FORM_CONFIG_PREFIX = "form_config:"


def _site_key(key: str) -> str:
	# frappe.cache() is already site-scoped; prefix keeps keys grouped.
	return f"{CACHE_NAMESPACE}:{key}"


def clear_ui_cache(*_args, **_kwargs):
	"""Invalidate all Enterprise UI caches for the current site."""
	try:
		frappe.cache().delete_keys(f"{CACHE_NAMESPACE}:*")
	except Exception:
		# Fallback for older redis helpers
		frappe.cache().delete_value(_site_key(BOOT_CACHE_KEY))
	frappe.clear_cache()


def get_cached_boot_settings():
	return frappe.cache().get_value(_site_key(BOOT_CACHE_KEY))


def set_cached_boot_settings(payload: dict):
	frappe.cache().set_value(_site_key(BOOT_CACHE_KEY), payload, expires_in_sec=3600)


def get_cached_form_config(doctype: str):
	return frappe.cache().get_value(_site_key(f"{FORM_CONFIG_PREFIX}{doctype}"))


def set_cached_form_config(doctype: str, payload: dict | None):
	frappe.cache().set_value(_site_key(f"{FORM_CONFIG_PREFIX}{doctype}"), payload, expires_in_sec=3600)
