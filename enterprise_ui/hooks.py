app_name = "enterprise_ui"
app_title = "Enterprise UI"
app_publisher = "abdullahi"
app_description = "Optional modern Enterprise Form Theme and presentation layer for Frappe Desk"
app_email = "abdullahi@gmail.com"
app_license = "mit"

# Independently installable. No hard dependency on enterprise_core / enterprise_shell.
# required_apps is intentionally empty so CLIENT C (frappe + erpnext + enterprise_ui) works.

# Hashed *.bundle.* files: after `bench build` (+ clear-cache), desk.html picks
# the new filename from assets.json. Do NOT use manual ?v= on absolute /assets/ paths.

app_include_css = [
	"enterprise_ui.bundle.css",
]

app_include_js = [
	"enterprise_ui.bundle.js",
]

extend_bootinfo = "enterprise_ui.boot.extend_bootinfo"

after_install = "enterprise_ui.setup.install.after_install"
after_migrate = "enterprise_ui.setup.install.after_migrate"

doc_events = {
	"Enterprise UI Settings": {
		"on_update": "enterprise_ui.services.cache.clear_ui_cache",
	},
	"Enterprise Form Configuration": {
		"on_update": "enterprise_ui.services.cache.clear_ui_cache",
		"on_trash": "enterprise_ui.services.cache.clear_ui_cache",
	},
}

add_to_apps_screen = [
	{
		"name": "enterprise_ui",
		"title": "Enterprise UI",
		"route": "/app/enterprise-ui-settings",
	}
]
