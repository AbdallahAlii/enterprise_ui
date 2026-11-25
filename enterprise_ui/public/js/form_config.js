/**
 * form_config.js — resolve Enterprise UI presentation from boot + optional refresh.
 * No per-DocType if/else chains. One resolver, configuration-driven.
 *
 * Layout precedence (documented for developers):
 *   1. Explicit Frappe DocType Layout / Column Break
 *      A section with 2+ effective .form-column nodes keeps native columns.
 *      An active DocType Layout disables Auto Grid for the whole form.
 *   2. Enterprise Form Configuration
 *      (Use Native / Grid Mode / per-section Columns / Field Spans)
 *   3. Enterprise UI Auto Grid
 *      Single effective column → responsive 2-column grid on that column's <form>.
 *      3 columns only when configuration asks for them and the column is wide enough.
 *   4. Native Frappe fallback
 */
frappe.provide("enterprise_ui.config");

(function () {
	"use strict";

	const DEFAULTS = {
		enabled: 0,
		enable_enterprise_forms: 0,
		default_form_density: "Comfortable",
		default_content_width: "Wide",
		default_section_style: "Standard",
		default_grid_mode: "Auto",
		enable_form_header_styling: 1,
		enable_child_table_styling: 1,
		enable_timeline_styling: 1,
		form_configs: {},
	};

	function bootSettings() {
		const boot = (window.frappe && frappe.boot && frappe.boot.enterprise_ui) || {};
		return Object.assign({}, DEFAULTS, boot);
	}

	/**
	 * Apply boot tokens carefully.
	 * Do NOT inline light-mode surface colors onto :root — that would override
	 * html[data-theme="dark"] CSS and break dark mode. Brand + density tokens only.
	 */
	function applyCssVariables() {
		const variables =
			(window.frappe && frappe.boot && frappe.boot.enterprise_ui_css_variables) || {};
		const root = document.documentElement;
		// Never inline surface/input colors. Those must stay in tokens.css so
		// html[data-theme="dark"] can replace them. Inline :root values would
		// freeze light-mode inputs on top of a dark page.
		const colorProps = [
			"--eui-page-bg",
			"--eui-surface",
			"--eui-surface-muted",
			"--eui-section-bg",
			"--eui-text",
			"--eui-text-muted",
			"--eui-text-placeholder",
			"--eui-label-color",
			"--eui-border",
			"--eui-border-strong",
			"--eui-input-bg",
			"--eui-input-bg-hover",
			"--eui-input-bg-focus",
			"--eui-input-bg-readonly",
			"--eui-input-border",
			"--eui-input-border-hover",
			"--eui-input-border-focus",
			"--eui-input-filled-bg",
			"--eui-input-filled-bg-hover",
			"--eui-input-filled-border",
		];
		colorProps.forEach(function (name) {
			root.style.removeProperty(name);
		});

		const allow =
			/^(--eui-primary|--eui-primary-hover|--eui-primary-soft|--eui-primary-focus|--eui-form-medium-width|--eui-form-wide-width|--eui-form-max-width|--eui-radius-|--eui-density-|--eui-control-height|--eui-checkbox-size|--eui-label-size|--eui-body-size|--eui-helper-size|--eui-grid-gap-|--eui-section-padding|--eui-section-radius|--eui-toolbar-)/i;
		Object.keys(variables).forEach(function (name) {
			if (!/^--eui-[a-z0-9-]+$/i.test(name)) return;
			if (!allow.test(name)) return;
			const value = String(variables[name] || "").trim();
			if (value) root.style.setProperty(name, value);
		});
	}

	/**
	 * Resolve presentation for a DocType.
	 * Order: global settings → optional DocType config → inherit overrides.
	 */
	function resolve(doctype) {
		const settings = bootSettings();
		const result = {
			active: false,
			density: settings.default_form_density || "Comfortable",
			content_width: settings.default_content_width || "Wide",
			section_style: settings.default_section_style || "Standard",
			grid_mode: settings.default_grid_mode || "Auto",
			default_field_span: "Auto",
			header_styling: !!cint(settings.enable_form_header_styling),
			child_table_styling: !!cint(settings.enable_child_table_styling),
			timeline_styling: !!cint(settings.enable_timeline_styling),
			sections: [],
			field_spans: [],
			use_native: false,
			has_doctype_layout: false,
		};

		if (!cint(settings.enabled) || !cint(settings.enable_enterprise_forms)) {
			return result;
		}

		const configs = settings.form_configs || {};
		const config = (doctype && configs[doctype]) || null;

		if (config && cint(config.use_native_form_appearance)) {
			result.use_native = true;
			return result;
		}

		if (config) {
			if (config.density && config.density !== "Inherit") {
				result.density = config.density;
			}
			if (config.content_width && config.content_width !== "Inherit") {
				result.content_width = config.content_width;
			}
			if (config.section_style && config.section_style !== "Inherit") {
				result.section_style = config.section_style;
			}
			if (config.grid_mode && config.grid_mode !== "Inherit") {
				result.grid_mode = config.grid_mode;
			}
			if (config.default_field_span && config.default_field_span !== "Inherit") {
				result.default_field_span = config.default_field_span;
			}
			result.sections = config.sections || [];
			result.field_spans = config.field_spans || [];
		}

		result.active = true;
		return result;
	}

	function cint(v) {
		return v === true || v === 1 || v === "1" ? 1 : 0;
	}

	enterprise_ui.config = {
		bootSettings,
		applyCssVariables,
		resolve,
		cint,
	};
})();
