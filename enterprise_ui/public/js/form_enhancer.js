/**
 * form_enhancer.js — apply scoped Enterprise UI classes on standard Form Views.
 *
 * Uses native Frappe lifecycle:
 *   - form-refresh (document)
 *   - page-change (document)
 *
 * Does NOT re-render fields, replace Form/Grid, or override save/submit.
 * Layout precedence (highest first):
 *   1. Explicit Frappe DocType Layout / Column Break (2+ effective .form-column)
 *   2. Enterprise Form Configuration (grid mode, section columns, field spans)
 *   3. Enterprise UI Auto Grid — only a section with exactly one effective column
 *   4. Native Frappe fallback
 *
 * Auto Grid is applied to `.form-column[data-eui-grid] > form`, the element whose
 * direct children are `.frappe-control` wrappers. It does not clone or move fields.
 * `data-eui-grid` is an attribute because Column.refresh() strips classes.
 *
 * Native Column Break sections are NOT re-gridded. Their `.section-body` must
 * not use a CSS column-gap: Frappe sets each column to flex-basis 50% (or 33%),
 * and 50% + 50% + gap wraps the second column under the first. That wrap is
 * what made Employee / Leave Application / Department look like one long column.
 */
frappe.provide("enterprise_ui.form");

(function () {
	"use strict";

	const FORM_CLASS = "eui-form-view";
	const ATTRS = [
		"data-eui-density",
		"data-eui-width",
		"data-eui-section-style",
		"data-eui-header",
		"data-eui-grids",
		"data-eui-timeline",
		"data-eui-control-variant",
		"data-eui-grid-mode",
		"data-eui-doctype-layout",
	];

	/** Fieldtypes that normally occupy half / grid cell width. */
	const HALF_WIDTH_TYPES = {
		Data: 1,
		Link: 1,
		"Dynamic Link": 1,
		Select: 1,
		Date: 1,
		Datetime: 1,
		Time: 1,
		Int: 1,
		Float: 1,
		Currency: 1,
		Percent: 1,
		Phone: 1,
		Password: 1,
		Color: 1,
		Duration: 1,
		Autocomplete: 1,
		"Read Only": 1,
		Check: 1,
		Icon: 1,
		Rating: 1,
		Barcode: 1,
	};

	/** Fieldtypes that normally span the full row. */
	const FULL_WIDTH_TYPES = {
		"Text Editor": 1,
		Text: 1,
		"Small Text": 1,
		"Long Text": 1,
		Table: 1,
		"Table MultiSelect": 1,
		HTML: 1,
		Code: 1,
		Markdown: 1,
		"Markdown Editor": 1,
		JSON: 1,
		Heading: 1,
		Signature: 1,
		Geolocation: 1,
		Button: 1,
	};

	/** Types that count as "substantial" when detecting meaningful Column Breaks. */
	const SUBSTANTIAL_TYPES = {
		Data: 1,
		Link: 1,
		"Dynamic Link": 1,
		Select: 1,
		Date: 1,
		Datetime: 1,
		Time: 1,
		Int: 1,
		Float: 1,
		Currency: 1,
		Percent: 1,
		Phone: 1,
		Password: 1,
		Color: 1,
		Duration: 1,
		Autocomplete: 1,
		"Read Only": 1,
		Text: 1,
		"Small Text": 1,
		"Long Text": 1,
		"Text Editor": 1,
		Code: 1,
		Attach: 1,
		"Attach Image": 1,
		Image: 1,
		Icon: 1,
		Rating: 1,
	};

	const GRID_CLASSES = [
		"eui-auto-grid",
		"eui-native-columns",
		"eui-grid-cols-1",
		"eui-grid-cols-2",
		"eui-grid-cols-3",
		"eui-section-full",
	];

	const CONTROL_CLASSES = [
		"eui-float-label",
		"eui-top-label",
		"eui-has-value",
		"eui-dropzone",
		"eui-field--outlined",
		"eui-field--filled",
		"eui-span-1",
		"eui-span-2",
		"eui-span-full",
		"eui-field-check",
	];

	let activePageEl = null;
	let bound = false;
	let applying = false;

	function isQuickEntryContext() {
		return !!(
			document.querySelector(".modal.show .quick-entry-dialog") ||
			document.querySelector(".modal.show .frappe-control[data-fieldname][data-quick-entry]")
		);
	}

	function getFormPageFromFrm(frm) {
		if (!frm || !frm.page) return null;
		if (frm.page.wrapper && frm.page.wrapper.length) {
			return frm.page.wrapper.get(0);
		}
		if (frm.$wrapper && frm.$wrapper.length) {
			return frm.$wrapper.closest(".page-container").get(0) || frm.$wrapper.get(0);
		}
		return null;
	}

	function clearPresentation(el) {
		if (!el) return;
		el.classList.remove(FORM_CLASS, "eui-docstatus-0", "eui-docstatus-1", "eui-docstatus-2");
		ATTRS.forEach(function (attr) {
			el.removeAttribute(attr);
		});
		el.querySelectorAll(".eui-section-icon, .eui-section-subtitle, .eui-section-meta, .eui-section-enhanced").forEach(
			function (node) {
				node.remove();
			}
		);
		el.querySelectorAll(".form-section.eui-section-rich").forEach(function (section) {
			section.classList.remove("eui-section-rich");
		});
		el.querySelectorAll(".form-section").forEach(function (section) {
			GRID_CLASSES.forEach(function (cls) {
				section.classList.remove(cls);
			});
			section.removeAttribute("data-eui-section-grid");
		});
		el.querySelectorAll("[data-eui-grid]").forEach(function (node) {
			node.removeAttribute("data-eui-grid");
		});
		el.querySelectorAll("form.eui-auto-grid").forEach(function (node) {
			node.classList.remove("eui-auto-grid");
		});
		el.querySelectorAll(".frappe-control").forEach(function (ctrl) {
			CONTROL_CLASSES.forEach(function (cls) {
				ctrl.classList.remove(cls);
			});
			ctrl.removeAttribute("data-eui-span");
		});
		if (el.__euiObserver) {
			el.__euiObserver.disconnect();
			el.__euiObserver = null;
		}
	}

	function cleanupNonFormPages() {
		document.querySelectorAll("." + FORM_CLASS).forEach(function (el) {
			if (activePageEl && el === activePageEl) return;
			clearPresentation(el);
		});
	}

	function applyRichSections(pageEl, presentation) {
		const sections = presentation.sections || [];
		if (!sections.length) return;

		const byField = {};
		sections.forEach(function (row) {
			if (row && row.section_fieldname) {
				byField[row.section_fieldname] = row;
			}
		});

		pageEl.querySelectorAll(".form-section").forEach(function (sectionEl) {
			const fieldname =
				sectionEl.getAttribute("data-fieldname") ||
				(sectionEl.dataset && sectionEl.dataset.fieldname) ||
				"";
			const meta = byField[fieldname];
			if (!meta) return;

			const style = meta.style || "Inherit";
			const treatAsRich =
				style === "Rich" || (style === "Inherit" && presentation.section_style === "Rich");

			if (treatAsRich || meta.icon || meta.subtitle) {
				sectionEl.classList.add("eui-section-rich");
			}

			const head = sectionEl.querySelector(".section-head");
			if (!head || head.querySelector(".eui-section-enhanced")) return;

			const mark = document.createElement("span");
			mark.className = "eui-section-enhanced";
			mark.hidden = true;
			head.appendChild(mark);

			if (meta.icon && !head.querySelector(".eui-section-icon")) {
				const icon = document.createElement("span");
				icon.className = "eui-section-icon";
				icon.setAttribute("aria-hidden", "true");
				if (window.frappe && frappe.utils && frappe.utils.icon) {
					try {
						icon.innerHTML = frappe.utils.icon(meta.icon, "sm");
					} catch (e) {
						icon.textContent = "";
					}
				}
				head.insertBefore(icon, head.firstChild);
			}

			if (meta.subtitle && !head.querySelector(".eui-section-subtitle")) {
				const subtitle = document.createElement("div");
				subtitle.className = "eui-section-subtitle";
				subtitle.textContent = meta.subtitle;
				head.appendChild(subtitle);
			}
		});
	}

	function normalizeGridMode(mode) {
		const raw = String(mode || "Auto").trim();
		if (raw === "Native") return "Native";
		if (raw === "1 Column" || raw === "1") return "1";
		if (raw === "3 Columns" || raw === "3") return "3";
		if (raw === "2 Columns" || raw === "2") return "2";
		return "Auto";
	}

	function sectionConfigMap(presentation) {
		const map = {};
		(presentation.sections || []).forEach(function (row) {
			if (row && row.section_fieldname) {
				map[row.section_fieldname] = row;
			}
		});
		return map;
	}

	function fieldSpanMap(presentation) {
		const map = {};
		(presentation.field_spans || []).forEach(function (row) {
			if (row && row.fieldname) {
				map[row.fieldname] = String(row.span || "Auto").toLowerCase();
			}
		});
		return map;
	}

	function setClass(el, cls, on) {
		if (!el) return;
		const has = el.classList.contains(cls);
		if (on && !has) el.classList.add(cls);
		if (!on && has) el.classList.remove(cls);
	}

	function setAttr(el, name, value) {
		if (!el) return;
		if (value == null || value === "") {
			if (el.hasAttribute(name)) el.removeAttribute(name);
			return;
		}
		if (el.getAttribute(name) !== String(value)) el.setAttribute(name, String(value));
	}

	/**
	 * Direct .form-column children that actually hold a visible field.
	 * Hidden / depends_on fields (`.hide-control`, display:none) do not count,
	 * so a column of only hidden fields is not an explicit Column Break.
	 */
	function columnIsEffective(col) {
		if (!col || col.classList.contains("hide-control")) return false;
		const controls = col.querySelectorAll(
			":scope > form > .frappe-control[data-fieldtype], :scope > .frappe-control[data-fieldtype]"
		);
		for (let i = 0; i < controls.length; i++) {
			const ctrl = controls[i];
			if (ctrl.classList.contains("hide-control")) continue;
			const ft = ctrl.getAttribute("data-fieldtype") || "";
			if (!ft || ft === "Column Break" || ft === "Section Break" || ft === "Tab Break") continue;
			return true;
		}
		return false;
	}

	function effectiveFormColumns(sectionEl) {
		if (!sectionEl) return [];
		return Array.prototype.filter.call(
			sectionEl.querySelectorAll(":scope > .section-body > .form-column"),
			columnIsEffective
		);
	}

	function resolveSectionColumns(sectionEl, presentation, sectionMeta) {
		const globalMode = normalizeGridMode(presentation.grid_mode);
		// 1. DocType Layout and explicit Column Breaks outrank configuration.
		if (presentation.has_doctype_layout || globalMode === "Native") {
			return { mode: "native", cols: 0 };
		}

		const columns = effectiveFormColumns(sectionEl);
		if (columns.length >= 2) {
			return { mode: "native", cols: 0 };
		}
		if (!columns.length) {
			return { mode: "skip", cols: 0 };
		}

		const sectionMode = sectionMeta && sectionMeta.columns ? String(sectionMeta.columns) : "Inherit";
		if (sectionMode === "Native") return { mode: "native", cols: 0 };
		if (sectionMode === "Full Width" || sectionMode === "Full") return { mode: "full", cols: 1 };
		if (sectionMode === "1" || sectionMode === "1 Column") return { mode: "grid", cols: 1 };
		if (sectionMode === "2" || sectionMode === "2 Columns") return { mode: "grid", cols: 2 };
		if (sectionMode === "3" || sectionMode === "3 Columns") return { mode: "grid", cols: 3 };

		if (globalMode === "1") return { mode: "grid", cols: 1 };
		if (globalMode === "3") return { mode: "grid", cols: 3 };
		if (globalMode === "2") return { mode: "grid", cols: 2 };

		// Auto: single effective column only. 2+ Column Breaks already returned native.
		return { mode: "grid", cols: 2 };
	}

	function applySpan(ctrl, span) {
		setAttr(ctrl, "data-eui-span", span);
		setClass(ctrl, "eui-span-1", span === "1");
		setClass(ctrl, "eui-span-2", span === "2");
		setClass(ctrl, "eui-span-full", span === "full");
	}

	function decorateFieldSpan(ctrl, spans) {
		const ft = ctrl.getAttribute("data-fieldtype") || "";
		const fieldname = ctrl.getAttribute("data-fieldname") || "";
		const override = spans[fieldname];

		setClass(ctrl, "eui-field-check", ft === "Check");

		// Tables always consume the whole row, even if a config span says otherwise.
		if (ft === "Table" || ft === "Table MultiSelect") {
			applySpan(ctrl, "full");
			return;
		}

		if (override === "full" || override === "3") {
			applySpan(ctrl, "full");
			return;
		}
		if (override === "2") {
			applySpan(ctrl, "2");
			return;
		}
		if (override === "1") {
			applySpan(ctrl, "1");
			return;
		}

		if (FULL_WIDTH_TYPES[ft]) {
			applySpan(ctrl, "full");
			return;
		}

		// Attach / Image: half by default, not giant zones.
		applySpan(ctrl, "1");
	}

	function decorateControls(pageEl, presentation) {
		if (!pageEl) return;
		const spans = fieldSpanMap(presentation || {});

		pageEl.querySelectorAll(".form-layout .frappe-control[data-fieldtype]").forEach(function (ctrl) {
			if (ctrl.closest(".form-grid, .grid-row, .form-in-grid")) return;

			const ft = ctrl.getAttribute("data-fieldtype") || "";
			ctrl.classList.remove("eui-float-label", "eui-has-value");
			ctrl.classList.add("eui-field--outlined", "eui-top-label");

			if (ft === "Attach" || ft === "Attach Image") {
				ctrl.classList.add("eui-dropzone");
			}

			decorateFieldSpan(ctrl, spans);
		});
	}

	function columnForm(col) {
		return col ? col.querySelector(":scope > form") : null;
	}

	/**
	 * Mark the single effective `.form-column` with data-eui-grid="1|2|3".
	 * CSS grids that column's child <form>, whose direct children are the
	 * .frappe-control wrappers. Sections with 2+ effective columns are left native.
	 */
	function applyAutoGrid(pageEl, presentation) {
		if (!pageEl) return;
		const bySection = sectionConfigMap(presentation);
		const layout = pageEl.querySelector(".form-layout");
		if (!layout) return;

		const grids = new Map();

		layout.querySelectorAll(".form-section").forEach(function (sectionEl) {
			function mark(mode, cols) {
				setClass(sectionEl, "eui-native-columns", mode === "native");
				setClass(sectionEl, "eui-auto-grid", mode === "grid" || mode === "full");
				setClass(sectionEl, "eui-section-full", mode === "full" || cols === 1);
				setClass(sectionEl, "eui-grid-cols-1", cols === 1);
				setClass(sectionEl, "eui-grid-cols-2", cols === 2);
				setClass(sectionEl, "eui-grid-cols-3", cols === 3);
				const label =
					mode === "native" ? "native" : mode === "full" ? "full" : mode === "skip" ? "skip" : String(cols || "");
				setAttr(sectionEl, "data-eui-section-grid", label || null);
			}

			if (sectionEl.closest(".form-grid, .grid-row, .form-in-grid")) {
				mark("native", 0);
				return;
			}

			if (sectionEl.classList.contains("empty-section") || sectionEl.classList.contains("hide-control")) {
				mark("skip", 0);
				return;
			}

			if (sectionEl.classList.contains("form-dashboard-section")) {
				mark("native", 0);
				return;
			}

			const fieldname =
				sectionEl.getAttribute("data-fieldname") ||
				(sectionEl.dataset && sectionEl.dataset.fieldname) ||
				"";
			const meta = bySection[fieldname];
			const resolved = resolveSectionColumns(sectionEl, presentation, meta);

			if (resolved.mode === "native") {
				mark("native", 0);
				return;
			}

			if (resolved.mode === "skip") {
				mark("skip", 0);
				return;
			}

			const cols = resolved.mode === "full" ? 1 : resolved.cols || 2;
			mark(resolved.mode === "full" ? "full" : "grid", cols);

			const columns = effectiveFormColumns(sectionEl);
			if (columns.length === 1) {
				grids.set(columns[0], String(cols));
			}
		});

		layout.querySelectorAll(".form-section > .section-body > .form-column").forEach(function (col) {
			const value = grids.get(col) || null;
			setAttr(col, "data-eui-grid", value);
			setClass(columnForm(col), "eui-auto-grid", !!value);
			// A Column Break whose fields are all hidden still occupies a flex
			// slot. Collapse it so it cannot leave a blank row under the grid.
			// When a field becomes visible, the class mutation re-runs this.
			setClass(col, "eui-column-vacant", !columnIsEffective(col));
		});
	}

	function ensureObserver(pageEl) {
		if (!pageEl || pageEl.__euiObserver || typeof MutationObserver === "undefined") return;
		const root = pageEl.querySelector(".form-layout");
		if (!root) return;

		let queued = false;
		const obs = new MutationObserver(function () {
			if (applying || queued || activePageEl !== pageEl) return;
			queued = true;
			window.requestAnimationFrame(function () {
				queued = false;
				if (applying || activePageEl !== pageEl) return;
				const frm = window.cur_frm;
				if (!frm || !frm.doctype) return;
				enhanceFrm(frm);
			});
		});
		obs.observe(root, {
			subtree: true,
			attributes: true,
			attributeFilter: ["class"],
		});
		pageEl.__euiObserver = obs;
	}

	function enhanceFrm(frm) {
		if (applying) return;
		if (!frm || !frm.doctype) return;
		if (frm.meta && frm.meta.istable) return;
		if (typeof frm.is_form_builder === "function" && frm.is_form_builder()) return;
		if (isQuickEntryContext()) return;
		if (frm.doctype === "Web Form") return;

		const presentation = enterprise_ui.config.resolve(frm.doctype);
		presentation.has_doctype_layout = !!(frm.doctype_layout && frm.doctype_layout.name);
		const pageEl = getFormPageFromFrm(frm);

		if (!pageEl) return;

		applying = true;
		try {
		if (!presentation.active || presentation.use_native) {
			if (activePageEl === pageEl) activePageEl = null;
			clearPresentation(pageEl);
			cleanupNonFormPages();
			return;
		}

		if (activePageEl && activePageEl !== pageEl) {
			clearPresentation(activePageEl);
		}

		activePageEl = pageEl;
		pageEl.classList.add(FORM_CLASS);
		pageEl.setAttribute("data-eui-density", presentation.density || "Comfortable");
		pageEl.setAttribute("data-eui-width", presentation.content_width || "Wide");
		pageEl.setAttribute("data-eui-section-style", presentation.section_style || "Standard");
		pageEl.setAttribute("data-eui-header", presentation.header_styling ? "1" : "0");
		pageEl.setAttribute("data-eui-grids", presentation.child_table_styling ? "1" : "0");
		pageEl.setAttribute("data-eui-timeline", presentation.timeline_styling ? "1" : "0");
		pageEl.setAttribute("data-eui-control-variant", "Outlined");
		pageEl.setAttribute("data-eui-grid-mode", normalizeGridMode(presentation.grid_mode));
		pageEl.setAttribute("data-eui-doctype-layout", presentation.has_doctype_layout ? "1" : "0");

		pageEl.classList.remove("eui-docstatus-0", "eui-docstatus-1", "eui-docstatus-2");
		const ds = frm.doc && typeof frm.doc.docstatus !== "undefined" ? frm.doc.docstatus : 0;
		pageEl.classList.add("eui-docstatus-" + ds);

		applyRichSections(pageEl, presentation);
		decorateControls(pageEl, presentation);
		applyAutoGrid(pageEl, presentation);
		ensureObserver(pageEl);
		cleanupNonFormPages();
		} finally {
			applying = false;
		}

		window.requestAnimationFrame(function () {
			if (activePageEl !== pageEl || applying) return;
			applying = true;
			try {
				decorateControls(pageEl, presentation);
				applyAutoGrid(pageEl, presentation);
			} finally {
				applying = false;
			}
		});
	}

	function onPageChange() {
		const route = (frappe.get_route && frappe.get_route()) || [];
		const isForm = route[0] === "Form";
		if (!isForm) {
			if (activePageEl) {
				clearPresentation(activePageEl);
				activePageEl = null;
			}
			cleanupNonFormPages();
		}
	}

	function bind() {
		if (bound) return;
		bound = true;

		$(document).on("form-refresh.enterprise_ui", function (_e, frm) {
			enhanceFrm(frm);
		});

		$(document).on("page-change.enterprise_ui", function () {
			onPageChange();
		});
	}

	enterprise_ui.form = {
		enhanceFrm,
		clearPresentation,
		bind,
		decorateControls,
		applyAutoGrid,
		FORM_CLASS,
		HALF_WIDTH_TYPES,
		FULL_WIDTH_TYPES,
	};
})();
