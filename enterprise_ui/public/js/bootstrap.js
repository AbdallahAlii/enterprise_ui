/**
 * bootstrap.js — early Enterprise UI boot (tokens + lifecycle bind).
 * Loaded before form enhancer via the bundle entry.
 */
(function () {
	"use strict";

	if (window.__enterprise_ui_boot_loaded) return;
	window.__enterprise_ui_boot_loaded = true;

	function ready(fn) {
		if (window.frappe && frappe.ready) {
			frappe.ready(fn);
			return;
		}
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", fn);
		} else {
			fn();
		}
	}

	function start() {
		if (!window.enterprise_ui || !enterprise_ui.config) return;
		enterprise_ui.config.applyCssVariables();
		if (enterprise_ui.form && enterprise_ui.form.bind) {
			enterprise_ui.form.bind();
		}

		// If a form is already open (rare race), enhance it.
		try {
			const cur = window.cur_frm;
			if (cur && enterprise_ui.form) {
				enterprise_ui.form.enhanceFrm(cur);
			}
		} catch (e) {
			/* ignore */
		}
	}

	ready(start);
})();
