from __future__ import annotations

from frappe.model.document import Document


class EnterpriseFormConfiguration(Document):
	def on_update(self):
		from enterprise_ui.services.cache import clear_ui_cache

		clear_ui_cache()

	def on_trash(self):
		from enterprise_ui.services.cache import clear_ui_cache

		clear_ui_cache()
