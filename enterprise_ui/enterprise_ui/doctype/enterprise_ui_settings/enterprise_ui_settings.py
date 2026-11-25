from __future__ import annotations

from frappe.model.document import Document


class EnterpriseUISettings(Document):
	def on_update(self):
		from enterprise_ui.services.cache import clear_ui_cache

		clear_ui_cache()
