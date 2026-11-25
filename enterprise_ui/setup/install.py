"""Idempotent install/migrate for Enterprise UI."""

from __future__ import annotations

import frappe

SETUP_VERSION = "2026.11.23.03"
SETUP_VERSION_KEY = "enterprise_ui_setup_version"

# Optional starter Form Configurations (created only when missing).
# Configuration-driven — no frontend DocType if/else chains.
# Transaction docs default to Native grid so intentional Column Breaks win.
OPTIONAL_FORM_PRESETS = [
	{
		"document_type": "Purchase Order",
		"density": "Compact",
		"content_width": "Full",
		"section_style": "Standard",
		"grid_mode": "Native",
	},
	{
		"document_type": "Sales Invoice",
		"density": "Compact",
		"content_width": "Full",
		"section_style": "Standard",
		"grid_mode": "Native",
	},
	{
		"document_type": "Journal Entry",
		"density": "Compact",
		"content_width": "Full",
		"section_style": "Standard",
		"grid_mode": "Native",
	},
	{
		"document_type": "Stock Entry",
		"density": "Compact",
		"content_width": "Full",
		"section_style": "Standard",
		"grid_mode": "Native",
	},
	{
		"document_type": "Payment Entry",
		"density": "Compact",
		"content_width": "Full",
		"section_style": "Standard",
		"grid_mode": "Native",
	},
	{
		"document_type": "Employee",
		"density": "Comfortable",
		"content_width": "Wide",
		"section_style": "Rich",
		"grid_mode": "Auto",
	},
	{
		"document_type": "Department",
		"density": "Comfortable",
		"content_width": "Wide",
		"section_style": "Standard",
		"grid_mode": "Native",
	},
	{
		"document_type": "Leave Application",
		"density": "Comfortable",
		"content_width": "Wide",
		"section_style": "Standard",
		"grid_mode": "Native",
	},
	{
		"document_type": "Leave Type",
		"density": "Comfortable",
		"content_width": "Wide",
		"section_style": "Standard",
		"grid_mode": "Auto",
	},
]


def after_install():
	ensure_settings(force=True)
	ensure_optional_form_presets()
	ensure_employee_doctype_layout()
	frappe.clear_cache()


def after_migrate():
	ensure_settings(force=False)
	# Do not recreate deleted presets on migrate — only fill missing ones once per setup version bump.
	ensure_optional_form_presets()
	ensure_transaction_native_grid()
	ensure_default_grid_mode()
	ensure_employee_doctype_layout()


def ensure_settings(force: bool = False):
	"""Create Enterprise UI Settings with safe defaults. Never reset client preferences."""
	if not frappe.db.exists("DocType", "Enterprise UI Settings"):
		return

	if not frappe.db.exists("Enterprise UI Settings", "Enterprise UI Settings"):
		doc = frappe.get_doc(
			{
				"doctype": "Enterprise UI Settings",
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
		)
		doc.insert(ignore_permissions=True)
		frappe.db.commit()
		print("✅ enterprise_ui: Enterprise UI Settings created with safe defaults")
	elif force:
		# Do not overwrite existing preferences on reinstall/migrate.
		pass

	applied = str(frappe.db.get_default(SETUP_VERSION_KEY) or "").strip()
	if force or applied != SETUP_VERSION:
		frappe.db.set_default(SETUP_VERSION_KEY, SETUP_VERSION)


def ensure_optional_form_presets():
	"""Create a few optional dense/master presets if the DocType exists and config is absent."""
	if not frappe.db.exists("DocType", "Enterprise Form Configuration"):
		return

	created = 0
	for preset in OPTIONAL_FORM_PRESETS:
		doctype = preset["document_type"]
		if not frappe.db.exists("DocType", doctype):
			continue
		if frappe.db.exists("Enterprise Form Configuration", doctype):
			continue
		doc = frappe.get_doc(
			{
				"doctype": "Enterprise Form Configuration",
				"document_type": doctype,
				"enabled": 1,
				"use_native_form_appearance": 0,
				"density": preset["density"],
				"content_width": preset["content_width"],
				"section_style": preset["section_style"],
				"grid_mode": preset.get("grid_mode") or "Inherit",
				"default_field_span": "Auto",
			}
		)
		doc.insert(ignore_permissions=True)
		created += 1

	if created:
		frappe.db.commit()
		print(f"✅ enterprise_ui: created {created} optional Form Configuration preset(s)")


def _meta_has_field(doctype: str, fieldname: str) -> bool:
	try:
		meta = frappe.get_meta(doctype)
		return any(df.fieldname == fieldname for df in meta.fields)
	except Exception:
		return False


def ensure_default_grid_mode():
	"""Backfill Default Grid Mode on existing settings (idempotent)."""
	if not frappe.db.exists("DocType", "Enterprise UI Settings"):
		return
	if not _meta_has_field("Enterprise UI Settings", "default_grid_mode"):
		return
	try:
		current = frappe.db.get_single_value("Enterprise UI Settings", "default_grid_mode")
	except Exception:
		return
	if not current:
		frappe.db.set_single_value("Enterprise UI Settings", "default_grid_mode", "Auto")


def ensure_transaction_native_grid():
	"""Ensure transaction presets keep intentional Column Break layouts (Native grid)."""
	if not frappe.db.exists("DocType", "Enterprise Form Configuration"):
		return
	if not _meta_has_field("Enterprise Form Configuration", "grid_mode"):
		return

	native_types = {
		p["document_type"] for p in OPTIONAL_FORM_PRESETS if p.get("grid_mode") == "Native"
	}
	updated = 0
	for doctype in native_types:
		if not frappe.db.exists("Enterprise Form Configuration", doctype):
			continue
		mode = frappe.db.get_value("Enterprise Form Configuration", doctype, "grid_mode")
		if mode in (None, "", "Inherit"):
			frappe.db.set_value(
				"Enterprise Form Configuration",
				doctype,
				"grid_mode",
				"Native",
				update_modified=False,
			)
			updated += 1
	if updated:
		frappe.db.commit()
		print(f"✅ enterprise_ui: set Native grid_mode on {updated} transaction preset(s)")


def ensure_employee_doctype_layout():
	"""Idempotent DocType Layout for Employee — presentation-only field order.

	The standard Employee form also uses enterprise_core Property Setters to
	convert Tab Breaks → Section Breaks. This layout is available as an
	alternate Desk route and documents the intended section order.
	"""
	if not frappe.db.exists("DocType", "DocType Layout"):
		return
	if not frappe.db.exists("DocType", "Employee"):
		return

	layout_name = "Employee - Enterprise"
	fieldnames = [
		"basic_details_tab",
		"full_name",
		"ec_mothers_full_name",
		"date_of_birth",
		"marital_status",
		"passport_number",
		"ec_overview_column",
		"branch",
		"salutation",
		"gender",
		"ec_nationality",
		"blood_group",
		"ec_photo_section",
		"image",
		"ec_photo_preview",
		"ec_contact_address_tab",
		"ec_contacts_section",
		"ec_contacts",
		"ec_emergency_contacts_section",
		"ec_emergency_contacts",
		"ec_residential_address_section",
		"ec_address_country",
		"ec_address_city",
		"ec_residential_address_column",
		"ec_address_state_region",
		"ec_address_district",
		"ec_street_address_section",
		"current_address",
		"ec_documents_tab",
		"ec_documents_section",
		"ec_cv_resume",
		"ec_cv_preview",
		"ec_documents_column",
		"ec_passport_id_document",
		"ec_passport_preview",
		"ec_educational_documents_section",
		"ec_educational_documents",
		"ec_educational_preview",
		"ec_employment_tab",
		"date_of_joining",
		"department",
		"designation",
		"ec_employment_category",
		"ec_employment_section",
		"reports_to",
		"ec_directorate",
		"status",
		"relieving_date",
		"ec_financial_tab",
		"ec_financial_section",
		"bank_name",
		"bank_ac_no",
		"ec_financial_column",
		"ec_bank_account_name",
	]

	meta = frappe.get_meta("Employee", cached=False)
	label_by_field = {df.fieldname: (df.label or df.fieldname) for df in meta.fields if df.fieldname}
	rows = [
		{"fieldname": fn, "label": label_by_field.get(fn) or fn}
		for fn in fieldnames
		if fn in label_by_field
	]
	if not rows:
		return

	if frappe.db.exists("DocType Layout", layout_name):
		doc = frappe.get_doc("DocType Layout", layout_name)
		doc.set("fields", [])
		for row in rows:
			doc.append("fields", row)
		doc.save(ignore_permissions=True)
	else:
		doc = frappe.get_doc(
			{
				"doctype": "DocType Layout",
				"name": layout_name,
				"document_type": "Employee",
				"route": "employee-enterprise",
				"fields": rows,
			}
		)
		doc.insert(ignore_permissions=True)

	frappe.db.commit()
	print(f"✅ enterprise_ui: Employee DocType Layout '{layout_name}' synced")
