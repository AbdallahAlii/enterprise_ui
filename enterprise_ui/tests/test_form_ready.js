/**
 * Enterprise Form readiness contract.
 * Run: node apps/enterprise_ui/enterprise_ui/tests/test_form_ready.js
 *
 * Same reducer the form enhancer uses. Pending is recorded before page-change,
 * so either page-change handler order still sees an unenhanced form as not ready.
 */
"use strict";

const { readinessAfter, isReadyState } = require("../public/js/form_ready.js");

function assert(cond, msg) {
	if (!cond) throw new Error(msg);
}

assert(isReadyState(""), "non-form page has no enterprise state and is ready");
assert(isReadyState("native"), "native page is ready");
assert(!isReadyState("pending"), "pending page is not ready");
assert(isReadyState("ready"), "enhanced page is ready");
assert(isReadyState("failed"), "failed page is revealed rather than held");

assert(
	readinessAfter("show", "", { eligible: false, sameDoctype: false }) === "native",
	"disabled form is ready immediately"
);
assert(
	readinessAfter("disabled", "pending", {}) === "native",
	"disabled resolution does not stay pending"
);
assert(
	readinessAfter("opt-out", "pending", {}) === "native",
	"native appearance opt-out is ready immediately"
);
assert(isReadyState(readinessAfter("show", "", { eligible: false })), "opt-out show is ready");

let state = readinessAfter("show", "", { eligible: true, sameDoctype: false });
assert(state === "pending", "eligible form is pending before enhancement");
assert(!isReadyState(state), "shell page-change before enhancer still sees pending");
assert(!isReadyState(state), "enhancer page-change before shell still sees pending");

state = readinessAfter("enhanced", state, { eligible: true });
assert(state === "ready", "essential classes and layout mark the form ready");
assert(isReadyState(state), "ready form can be revealed");

assert(readinessAfter("refresh", state, {}) === "ready", "refresh keeps a ready form ready");
assert(
	readinessAfter("show", "ready", { eligible: true, sameDoctype: true }) === "ready",
	"revisiting the same enhanced form does not go pending again"
);

const previous = "ready";
const opened = readinessAfter("show", "", { eligible: true, sameDoctype: false });
assert(previous === "ready" && opened === "pending", "a new route does not inherit the previous page");
assert(isReadyState(previous) && !isReadyState(opened), "previous readiness cannot satisfy the new page");

assert(readinessAfter("error", "pending", {}) === "failed", "enhancer exception fails open");
assert(readinessAfter("failsafe", "pending", {}) === "failed", "fail-safe fails open");
assert(readinessAfter("enhanced", "pending", { eligible: false }) === "native", "ineligible enhance is native");

console.log("form readiness contract: ok");
