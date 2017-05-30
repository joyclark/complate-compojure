var render = (function () {
'use strict';

// cf. https://www.w3.org/TR/html5/syntax.html#void-elements
var VOID_ELEMENTS = {}; // poor man's set
["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"].forEach(function (tag) {
	VOID_ELEMENTS[tag] = true;
});

function generateHTML(tag, params) {
	for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
		children[_key - 2] = arguments[_key];
	}

	return function (stream) {
		stream.write("<" + tag + generateAttributes(params) + ">");

		// NB:
		// * discarding blank values to avoid conditionals within JSX (passing
		//   `null`/`undefined` is much simpler)
		// * `children` might contain nested arrays due to the use of
		//   collections within JSX (`{items.map(item => <span>item</span>)}`)
		flatCompact(children).forEach(function (child) {
			if (child.call) {
				child(stream);
			} else {
				var txt = htmlEncode(child.toString());
				stream.write(txt);
			}
		});

		// void elements must not have closing tags
		if (!VOID_ELEMENTS[tag]) {
			stream.write("</" + tag + ">");
		}
		stream.flush();
	};
}

function generateAttributes(params) {
	if (!params) {
		return "";
	}

	return " " + Object.keys(params).map(function (name) {
		var value = params[name];
		switch (value) {
			// boolean attributes (e.g. `<input … autofocus>`)
			case true:
				return name;
			case false:
				return;
			// regular attributes
			default:
				if (typeof value === "number") {
					value = value.toString();
				} else if (!value.substr) {
					throw new Error("invalid attribute value: `" + JSON.stringify(value) + "`");
				}

				// cf. https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
				if (/ |"|'|>|'|\/|=/.test(name)) {
					throw new Error("invalid attribute name: `" + JSON.stringify(name) + "`");
				}
				value = value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

				return name + "=\"" + value + "\"";
		}
	}).join(" ");
}

// adapted from TiddlyWiki <http://tiddlywiki.com>
function htmlEncode(str) {
	// XXX: insufficient?
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// flatten array while discarding blank values
function flatCompact(items) {
	return items.reduce(function (memo, item) {
		return item === null || item === undefined ? memo : memo.concat(item.pop ? flatCompact(item) : item);
	}, []);
}

var CUSTOM_ELEMENTS = {};

var createDOMNode = (function (tag, params) {
	for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
		children[_key - 2] = arguments[_key];
	}

	if (!tag.contains("-")) {
		// regular element
		return generateHTML.apply(undefined, [tag, params].concat(children));
	}

	// custom element
	var fn = CUSTOM_ELEMENTS[tag];
	if (!fn) {
		raise(tag);
	}
	return fn.apply(undefined, [params].concat(children));
});

function registerElement(tag, fn) {
	if (!tag.contains("-")) {
		raise(tag, "must contain a hyphen");
	}

	if (CUSTOM_ELEMENTS[tag]) {
		raise(tag, "already registered");
	}

	CUSTOM_ELEMENTS[tag] = fn;
}

function raise(tag, msg) {
	var err = "invalid custom element: <" + tag + ">";
	throw new Error(msg ? err + " " + msg : err);
}

registerElement("content-panel", function (_ref) {
	for (var _len = arguments.length, content = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		content[_key - 1] = arguments[_key];
	}

	var title = _ref.title,
	    meta = _ref.meta;

	return createDOMNode(
		"div",
		{ "class": "panel panel-default" },
		createDOMNode(
			"div",
			{ "class": "panel-heading" },
			meta && createDOMNode(
				"div",
				{ "class": "pull-right" },
				meta
			),
			createDOMNode(
				"h3",
				{ "class": "panel-title" },
				title
			)
		),
		createDOMNode(
			"div",
			{ "class": "panel-body" },
			content
		)
	);
});

var renderArticle = (function (stream, author, title, content) {
	var meta = createDOMNode(
		"span",
		null,
		"by ",
		createDOMNode(
			"a",
			{ href: "#" },
			author
		)
	);

	stream.writeln("<h1>article</h1>");
	var streamer = createDOMNode(
		"content-panel",
		{ title: title, meta: meta },
		createDOMNode(
			"p",
			null,
			content
		)
	);

	streamer(stream);
});

registerElement("list-group", function (_) {
	for (var _len = arguments.length, items = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		items[_key - 1] = arguments[_key];
	}

	items = flatCompact(items); // XXX: smell (required due to use of `#map` within JSX)

	return createDOMNode(
		"ul",
		{ "class": "list-group" },
		items.map(function (item) {
			return createDOMNode(
				"li",
				{ "class": "list-group-item" },
				item
			);
		})
	);
});

/* global Java */
registerElement("product-item", renderProduct);

var renderProducts = (function (stream, products) {
	products = Java.from(products);

	stream.writeln("<h1>products</h1>");
	var streamer = createDOMNode(
		"list-group",
		null,
		products.map(function (product) {
			return createDOMNode("product-item", { product: product });
		})
	);

	streamer(stream);
});

function renderProduct(_ref) {
	var product = _ref.product;

	return createDOMNode(
		"article",
		{ id: product.id },
		createDOMNode(
			"span",
			null,
			product.name
		),
		" ",
		createDOMNode(
			"span",
			null,
			"$",
			product.price
			//product.getPrice()
		)
	);
}

var STYLESHEETS = [{
	uri: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css",
	hash: "sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"
}];

// FIXME: this indirection is only required because we don't know yet how to
//        make Nashorn understand `invokeFunction("VIEWS.renderArticle", …)`
var index = (function (template, stream) {
	for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
		args[_key - 2] = arguments[_key];
	}

	var fn = {
		index: renderIndex,
		article: renderArticle,
		products: renderProducts
	}[template];

	stream.writeln("<!DOCTYPE html>");
	stream.writeln("<html>");
	var streamer = createDOMNode(
		"head",
		null,
		createDOMNode("meta", { charset: "utf-8" }),
		STYLESHEETS.map(function (_ref) {
			var uri = _ref.uri,
			    hash = _ref.hash;

			return createDOMNode("link", { rel: "stylesheet", href: uri,
				integrity: hash, crossorigin: "anonymous" });
		})
	);
	streamer(stream);

	stream.writeln('<body class="container-fluid">');
	fn.apply(undefined, [stream].concat(args));
	stream.writeln("</body> </html>");
});

function renderIndex(stream) {
	stream.writeln("<h1>index</h1>");
	var streamer = createDOMNode(
		"list-group",
		null,
		createDOMNode(
			"a",
			{ href: "/article" },
			"article"
		),
		createDOMNode(
			"a",
			{ href: "/products" },
			"products"
		)
	);

	streamer(stream);
}

return index;

}());
