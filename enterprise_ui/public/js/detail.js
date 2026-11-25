/**
 * Reusable Detail View presentation helpers (Enterprise UI).
 * Presentation only — callers supply secured payloads from enterprise_core (or other apps).
 */
frappe.provide("enterprise_ui.detail");

(() => {
	"use strict";

	const esc = (v) => frappe.utils.escape_html(String(v == null ? "" : v));

	function dash(v) {
		if (v === 0 || v === false) return String(v);
		if (v == null || v === "") return "—";
		return String(v);
	}

	function formatDate(v) {
		if (!v) return "—";
		try {
			return frappe.datetime.str_to_user(String(v).slice(0, 10)) || "—";
		} catch (e) {
			return esc(v);
		}
	}

	function formatDatetime(v) {
		if (!v) return "—";
		try {
			return frappe.datetime.str_to_user(String(v).slice(0, 19)) || "—";
		} catch (e) {
			return esc(v);
		}
	}

	function formatMoney(amount, currency) {
		try {
			return format_currency(amount || 0, currency);
		} catch (e) {
			return String(amount == null ? 0 : amount);
		}
	}

	function statusBadge(label, tone) {
		const t = tone || "muted";
		return `<span class="eui-status-badge eui-status-badge--${esc(t)}">${esc(label || "—")}</span>`;
	}

	function toneForStatus(status) {
		const s = String(status || "").toLowerCase();
		if (["active", "published", "resolved", "repaid", "approved"].includes(s)) return "success";
		if (["draft", "scheduled", "submitted", "under review", "in progress"].includes(s)) return "info";
		if (["escalated", "urgent", "pending"].includes(s)) return "warn";
		if (["cancelled", "left", "archived", "withdrawn", "rejected"].includes(s)) return "danger";
		return "muted";
	}

	function pageShell(opts) {
		opts = opts || {};
		const width = opts.width || "wide"; // readable | medium | wide
		const extra = opts.className || "";
		return `<div class="eui-page eui-detail-page eui-detail-page--${esc(width)} ${esc(extra)}">
			${opts.body || ""}
		</div>`;
	}

	function backLink(label, onAttr) {
		return `<button type="button" class="eui-detail-back" ${onAttr || "data-eui-back"}>
			<span class="eui-detail-back__icon" aria-hidden="true">←</span>
			<span>${esc(label || __("Back"))}</span>
		</button>`;
	}

	function detailHeader(opts) {
		opts = opts || {};
		const meta = (opts.meta || [])
			.filter(Boolean)
			.map((m) => {
				if (m && typeof m === "object" && m.html != null) {
					return `<span class="eui-detail-meta-item">${m.html}</span>`;
				}
				return `<span class="eui-detail-meta-item">${esc(m)}</span>`;
			})
			.join('<span class="eui-detail-meta-sep">•</span>');
		const badge = opts.status
			? statusBadge(opts.status, opts.statusTone || toneForStatus(opts.status))
			: "";
		const actions = opts.actionsHtml || "";
		return `<header class="eui-detail-header">
			<div class="eui-detail-header__main">
				${opts.eyebrow ? `<p class="eui-detail-eyebrow">${esc(opts.eyebrow)}</p>` : ""}
				<div class="eui-detail-header__title-row">
					<h1 class="eui-detail-title">${esc(opts.title || "")}</h1>
					${badge}
				</div>
				${meta ? `<div class="eui-detail-meta">${meta}</div>` : ""}
				${opts.subtitle ? `<p class="eui-detail-subtitle">${esc(opts.subtitle)}</p>` : ""}
			</div>
			<div class="eui-detail-header__actions eui-action-toolbar">${actions}</div>
		</header>`;
	}

	function actionToolbar(buttons) {
		return (buttons || [])
			.filter(Boolean)
			.map((b) => {
				if (b.html) return b.html;
				const cls = b.primary
					? "btn btn-primary btn-sm"
					: b.danger
					? "btn btn-danger btn-sm"
					: "btn btn-default btn-sm";
				return `<button type="button" class="${cls}" ${b.attrs || ""}>${esc(b.label)}</button>`;
			})
			.join("");
	}

	function section(title, bodyHtml, extraClass) {
		if (!bodyHtml) return "";
		return `<section class="eui-detail-section ${esc(extraClass || "")}">
			${title ? `<h2 class="eui-detail-section__title">${esc(title)}</h2>` : ""}
			<div class="eui-detail-section__body">${bodyHtml}</div>
		</section>`;
	}

	function heroBanner(opts) {
		opts = opts || {};
		return `<div class="eui-detail-hero">
			${opts.kicker ? `<p class="eui-detail-hero__kicker">${esc(opts.kicker)}</p>` : ""}
			<div class="eui-detail-hero__title-row">
				<h1 class="eui-detail-hero__title">${esc(opts.title || "")}</h1>
				${opts.status ? statusBadge(opts.status, opts.statusTone || toneForStatus(opts.status)) : ""}
			</div>
			${opts.metaHtml ? `<div class="eui-detail-hero__meta">${opts.metaHtml}</div>` : ""}
			${opts.subtitle ? `<p class="eui-detail-hero__sub">${esc(opts.subtitle)}</p>` : ""}
		</div>`;
	}

	function summaryGrid(items, cols) {
		const cells = (items || [])
			.filter((it) => it && (it.value != null || it.html || it.optional === false))
			.filter((it) => !(it.optional && (it.value == null || it.value === "") && !it.html))
			.map((it) => {
				const valueHtml = it.html != null ? it.html : esc(dash(it.value));
				return `<div class="eui-kv">
					<div class="eui-kv__label">${esc(it.label || "")}</div>
					<div class="eui-kv__value">${valueHtml}</div>
				</div>`;
			})
			.join("");
		if (!cells) return "";
		const colClass = cols === 3 ? "eui-kv-grid--3" : cols === 1 ? "eui-kv-grid--1" : "eui-kv-grid--2";
		return `<div class="eui-kv-grid ${colClass}">${cells}</div>`;
	}

	function metricStrip(items) {
		const cells = (items || [])
			.map(
				(it) => `<div class="eui-metric">
				<div class="eui-metric__label">${esc(it.label || "")}</div>
				<div class="eui-metric__value">${it.html != null ? it.html : esc(dash(it.value))}</div>
			</div>`
			)
			.join("");
		if (!cells) return "";
		return `<div class="eui-metric-strip">${cells}</div>`;
	}

	function longContent(html, plain) {
		if (html) {
			return `<div class="eui-long-content eui-long-content--html">${html}</div>`;
		}
		if (plain) {
			return `<div class="eui-long-content"><pre class="eui-long-content__pre">${esc(plain)}</pre></div>`;
		}
		return "";
	}

	function progressBar(pct, label) {
		const p = Math.max(0, Math.min(100, Math.round(flt(pct) || 0)));
		return `<div class="eui-progress" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100">
			${label ? `<div class="eui-progress__label">${esc(label)}</div>` : ""}
			<div class="eui-progress__track"><div class="eui-progress__fill" style="width:${p}%"></div></div>
			<div class="eui-progress__pct">${p}%</div>
		</div>`;
	}

	function attachments(files) {
		const list = files || [];
		if (!list.length) {
			return `<div class="eui-empty-state eui-empty-state--compact"><p>${esc(
				__("No attachments")
			)}</p></div>`;
		}
		const rows = list
			.map((f) => {
				const name = f.file_name || f.name || __("File");
				const url = f.file_url || "#";
				return `<a class="eui-attach-item" href="${esc(url)}" target="_blank" rel="noopener">
					<span class="eui-attach-item__name">${esc(name)}</span>
				</a>`;
			})
			.join("");
		return `<div class="eui-attach-list">${rows}</div>`;
	}

	function emptyState(message, hint) {
		return `<div class="eui-empty-state">
			<p>${esc(message || __("Nothing to show"))}</p>
			${hint ? `<p class="eui-empty-state__hint">${esc(hint)}</p>` : ""}
		</div>`;
	}

	function errorState(title, message, backLabel) {
		return `<div class="eui-detail-error">
			<h2>${esc(title || __("Unable to load this record."))}</h2>
			<p>${esc(message || "")}</p>
			${
				backLabel
					? `<button type="button" class="btn btn-primary btn-sm" data-eui-back>${esc(backLabel)}</button>`
					: ""
			}
		</div>`;
	}

	function skeleton(opts) {
		opts = opts || {};
		const sections = cint(opts.sections) || 3;
		return `<div class="eui-detail-skeleton" aria-busy="true" aria-live="polite">
			<div class="eui-skel eui-skel--title"></div>
			<div class="eui-skel eui-skel--meta"></div>
			${Array.from({ length: sections })
				.map(
					() => `<div class="eui-skel-block">
					<div class="eui-skel eui-skel--heading"></div>
					<div class="eui-skel eui-skel--line"></div>
					<div class="eui-skel eui-skel--line eui-skel--short"></div>
				</div>`
				)
				.join("")}
		</div>`;
	}

	function serverMessage(r) {
		if (!r) return "";
		if (r.message && typeof r.message === "string") return r.message;
		if (r._server_messages) {
			try {
				const msgs = JSON.parse(r._server_messages);
				const first = msgs && msgs[0];
				if (typeof first === "string") {
					try {
						return JSON.parse(first).message || first;
					} catch (e) {
						return first;
					}
				}
				if (first && first.message) return first.message;
			} catch (e) {
				/* ignore */
			}
		}
		if (r.exc) return __("Permission Denied");
		return "";
	}

	function bindBack($root, routeArgs) {
		$root.find("[data-eui-back]").on("click", () => {
			if (typeof routeArgs === "function") {
				routeArgs();
				return;
			}
			if (Array.isArray(routeArgs)) {
				frappe.set_route(...routeArgs);
			}
		});
	}

	enterprise_ui.detail = {
		version: 1,
		ready: true,
		esc,
		dash,
		formatDate,
		formatDatetime,
		formatMoney,
		statusBadge,
		toneForStatus,
		pageShell,
		backLink,
		detailHeader,
		heroBanner,
		actionToolbar,
		section,
		summaryGrid,
		metricStrip,
		longContent,
		progressBar,
		attachments,
		emptyState,
		errorState,
		skeleton,
		serverMessage,
		bindBack,
	};

	frappe.provide("enterprise_ui.components.profile");
	enterprise_ui.components.profile = enterprise_ui.detail;
})();
