var URL      = require("url");
var flat     = require("q-flat");
var formJSON = require("@rill/form-json");
var location = window.history.location || window.location;

var reg = {
	rel: /(?:^|\s+)external(?:\s+|$)/
};

module.exports = {
	onURLChange: onURLChange,
	onSubmit: onSubmit,
	onClick: onClick
};

/*
 * Handle an event that changed the url (popstate or page load).
 *
 * @param {Object} event
 */
function onURLChange (e) {
	this.navigate(location.href, true);
};

/*
 * Handle intercepting forms to update the url.
 *
 * @param {Object} event
 */
function onSubmit (e) {
	// Ignore canceled events.
	if (e.defaultPrevented) return;

	// Get the <form> element.
	var el = event.target;

	// Ignore clicks from linkless elements
	if (!el.action) return;

	// Ignore the click if the element has a target.
	if (el.target && el.target !== "_self") return;
	// Ignore 'rel="external"' links.
	if (el.hasAttribute("rel") && reg.rel.test(el.getAttribute("rel"))) return;

	var data   = formJSON(el);
	var method = (el.getAttribute("method") || el.method).toUpperCase();

	if (method === "GET") {
		// On a get request a forms body is converted into a query string.
		var parsed = URL.parse(el.action);
		// We delete the search part so that a query object can be used.
		delete parsed.search;
		parsed.query = flat(data.body);
		this.navigate(URL.format(parsed));
	} else {
		this.navigate({
			url:    el.action,
			method: method,
			body:   data.body,
			files:  data.files,
			headers: {
				"content-type": el.enctype
			}
		})
	}

	if (!el.hasAttribute("data-noreset")) el.reset();
	event.preventDefault();
};

/*
 * Handle intercepting link clicks to update the url.
 *
 * @param {Object} event
 */
function onClick (e) {
	// Ignore canceled events, modified clicks, and right clicks.
	if (event.defaultPrevented ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.button !== 0) return;

	// Get the <a> element.
	var el = event.target;
	while (el != null && el.nodeName !== "A") el = el.parentNode;

	// Ignore if we couldn't find a link.
	if (!el) return;

	// Ignore clicks from linkless elements
	if (!el.href) return;
	// Ignore downloadable links.
	if (el.download) return;
	// Ignore the click if the element has a target.
	if (el.target && el.target !== "_self") return;
	// Ignore 'rel="external"' links.
	if (el.rel && reg.rel.test(el.rel)) return;

	// Attempt to navigate internally.
	if (this.navigate(el.href)) event.preventDefault();
};