/**
 * enterprise_ui.bundle.js
 *
 * Fingerprinted Desk entry point. `bench build` emits
 * /assets/enterprise_ui/dist/js/enterprise_ui.bundle.[hash].js
 *
 * Load order:
 * 1. form_ready.js   — pure pending/ready contract (also used by node tests)
 * 2. form_config.js  — boot settings + resolver
 * 3. form_enhancer.js — scoped class application on Form views
 * 4. bootstrap.js    — bind lifecycle + apply CSS variables
 */
import "./form_ready.js";
import "./form_config.js";
import "./form_enhancer.js";
import "./bootstrap.js";
import "./detail.js";
import "./page.js";
