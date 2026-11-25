/**
 * Detail / profile presentation building blocks.
 *
 * Runtime implementation lives in public/js/detail.js (bundled via
 * enterprise_ui.bundle.js). This module documents the surface for developers.
 *
 * Reusable pieces:
 *   - Detail Page Shell
 *   - Detail Header
 *   - Status Badge
 *   - Summary Grid / Metric Strip
 *   - Section
 *   - Key/Value Details
 *   - Long Content Section
 *   - Attachment Section
 *   - Progress Indicator
 *   - Action Toolbar
 *   - Empty / Error / Skeleton states
 *
 * Do NOT put DocType business rules here.
 */
frappe.provide("enterprise_ui.components.profile");

if (frappe.boot && enterprise_ui && enterprise_ui.detail) {
	enterprise_ui.components.profile = enterprise_ui.detail;
}
