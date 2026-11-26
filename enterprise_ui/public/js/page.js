/**
 * Enterprise Page Shell presentation helpers (list/report/custom pages).
 * Opt-in — callers add .eui-page explicitly via decorate().
 */
frappe.provide("enterprise_ui.page");

(() => {
	"use strict";

	const esc = (v) => frappe.utils.escape_html(String(v == null ? "" : v));

	const PAGE_CLASS = "eui-page";
	const FILTERS_CLASS = "eui-page-filters";

	function decorate(wrapperOrMain, opts) {
		opts = opts || {};
		const extra = opts.className ? String(opts.className).trim() : "";
		const $el = $(wrapperOrMain);
		if (!$el || !$el.length) return $el;
		const $target =
			$el.hasClass("layout-main-section") || $el.hasClass("page-content")
				? $el
				: $el.find(".layout-main-section").first().length
					? $el.find(".layout-main-section").first()
					: $el;
		$target.addClass(PAGE_CLASS);
		if (extra) {
			extra.split(/\s+/).filter(Boolean).forEach((c) => $target.addClass(c));
		}
		return $target;
	}

	function headerHtml(opts) {
		opts = opts || {};
		const actions = opts.actionsHtml || "";
		const desc = opts.description
			? `<p class="eui-page-header__description">${esc(opts.description)}</p>`
			: "";
		return `<header class="eui-page-header">
			<div class="eui-page-header__main">
				<h1 class="eui-page-header__title">${esc(opts.title || "")}</h1>
				${desc}
			</div>
			${actions ? `<div class="eui-page-header__actions">${actions}</div>` : ""}
		</header>`;
	}

	function paginationHtml(opts) {
		opts = opts || {};
		const from = opts.from == null ? 0 : Number(opts.from);
		const to = opts.to == null ? 0 : Number(opts.to);
		const total = opts.total == null ? 0 : Number(opts.total);
		const pageLength = opts.pageLength;
		const lengths = opts.lengths || [20, 50, 100];
		const summary =
			total > 0
				? __("Showing {0}–{1} of {2}", [from, to, total])
				: __("No rows");
		const lengthBtns = lengths
			.map((n) => {
				const active = Number(pageLength) === n ? " btn-primary" : " btn-default";
				return `<button type="button" class="btn btn-sm${active}" data-eui-page-length="${n}">${n}</button>`;
			})
			.join("");
		return `<div class="eui-pagination">
			<div class="eui-pagination-inner">
				<span class="eui-pagination-summary">${esc(summary)}</span>
				<div class="eui-pagination-lengths">${lengthBtns}</div>
				<div class="eui-pagination-nav">
					<button type="button" class="btn btn-default btn-sm" data-eui-page-prev>${__("Previous")}</button>
					<button type="button" class="btn btn-default btn-sm" data-eui-page-next>${__("Next")}</button>
				</div>
			</div>
		</div>`;
	}

	function emptyHtml(message, hint) {
		const msg = message || __("No data to show");
		const hintHtml = hint ? `<p class="eui-empty-state__hint">${esc(hint)}</p>` : "";
		return `<div class="eui-empty-state">
			<p>${esc(msg)}</p>
			${hintHtml}
		</div>`;
	}

	function loadingHtml(message) {
		const msg = message || __("Loading…");
		return `<div class="eui-page-loading" role="status">${esc(msg)}</div>`;
	}

	function kpiGridHtml(items) {
		const cards = (items || [])
			.filter(Boolean)
			.map((item) => {
				const tone = item.tone ? ` eui-kpi-card--${esc(item.tone)}` : "";
				const sub = item.sub ? `<p class="eui-kpi-card__sub">${esc(item.sub)}</p>` : "";
				const inner = `<p class="eui-kpi-card__label">${esc(item.label || "")}</p>
					<p class="eui-kpi-card__value">${esc(item.value != null ? item.value : "—")}</p>
					${sub}`;
				if (item.href) {
					return `<a class="eui-kpi-card${tone}" href="${esc(item.href)}">${inner}</a>`;
				}
				return `<div class="eui-kpi-card${tone}">${inner}</div>`;
			})
			.join("");
		return `<div class="eui-kpi-grid">${cards}</div>`;
	}

	enterprise_ui.page = {
		version: 1,
		PAGE_CLASS,
		FILTERS_CLASS,
		filtersClass: FILTERS_CLASS,
		decorate,
		headerHtml,
		paginationHtml,
		emptyHtml,
		loadingHtml,
		kpiGridHtml,
	};
})();