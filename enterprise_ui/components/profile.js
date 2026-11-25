/**
 * Future profile/detail page building blocks (presentation only).
 *
 * Prepared stubs — not wired into Desk yet. Profile pages should consume
 * enterprise_core (or other app) secured APIs for data/actions.
 *
 * Planned reusable pieces:
 *   - profile header
 *   - identity summary
 *   - status badge
 *   - metric strip
 *   - detail section
 *   - related-record table
 *   - action toolbar
 *   - empty state
 *
 * Do NOT migrate existing Employee Profile here in phase 1.
 */
frappe.provide("enterprise_ui.components.profile");

enterprise_ui.components.profile = {
	version: 1,
	ready: false,
};
