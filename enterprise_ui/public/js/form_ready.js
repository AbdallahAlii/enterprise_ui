/**
 * Pure Enterprise Form readiness states.
 * Shared by form_enhancer.js and node tests. No DOM, no Frappe.
 *
 * native  — not an Enterprise form (disabled, opt-out, dialog, non-form)
 * pending — eligible form shown, essential classes not applied yet
 * ready   — essential form class, density, and grid/layout markers applied
 * failed  — enhancer failed; do not keep the page covered
 */
(function (root, factory) {
	const api = factory();
	if (typeof module !== "undefined" && module.exports) {
		module.exports = api;
	}
	if (root) root.enterprise_ui_form_ready = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
	"use strict";

	function readinessAfter(event, current, ctx) {
		const input = ctx || {};
		const state = current || "";
		if (event === "show") {
			if (!input.eligible) return "native";
			if (state === "ready" && input.sameDoctype) return "ready";
			return "pending";
		}
		if (event === "enhanced") {
			return input.eligible === false ? "native" : "ready";
		}
		if (event === "opt-out" || event === "disabled") return "native";
		if (event === "error" || event === "failsafe") return "failed";
		if (event === "refresh") {
			if (state === "ready" || state === "native" || state === "failed") return state;
			return state;
		}
		return state;
	}

	function isReadyState(state) {
		return state !== "pending";
	}

	return {
		readinessAfter: readinessAfter,
		isReadyState: isReadyState,
	};
});
