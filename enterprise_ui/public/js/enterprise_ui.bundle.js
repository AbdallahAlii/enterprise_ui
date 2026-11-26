/**
 * enterprise_ui.bundle.js
 *
 * Fingerprinted Desk entry point. `bench build` emits
 * /assets/enterprise_ui/dist/js/enterprise_ui.bundle.[hash].js
 *
 * Load order:
 * 1. form_config.js  — boot settings + resolver
 * 2. form_enhancer.js — scoped class application on Form views
 * 3. bootstrap.js    — bind lifecycle + apply CSS variables
 */
import "./form_config.js";
import "./form_enhancer.js";
import "./bootstrap.js";
import "./detail.js";
import "./page.js";
