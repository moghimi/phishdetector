Array.prototype.diff = function (e) {
	return this.filter(function (t) {
		return !(e.indexOf(t) > -1);
	});
};

/* cleanURL */
function cu(str) {
	var url = str;
	url = url.toLowerCase().substr(0, 4) == "http" ? url : "http://" + url;
	var start = url.toLowerCase().substr(0, 5) == "http:" ? 7 : 8;
	url += url.substr(start).indexOf("/") < 0 ? "/" : "";
	var opart = url.substr(url.substr(start).indexOf("/"));
	var url = url.substr(0, url.substr(start).indexOf("/"));
	url += opart.substr(start).lastIndexOf("@") > 0 ? opart.replace(/\@/g, "$") : opart;
	return url;
}

/* parseUri */
function pu(t) {
	t = cu(t);
	for (
		var n = pu.options,
		e = n.parser[n.strictMode ? "strict" : "loose"].exec(t),
		o = {},
		r = 14;
		r--;

	)
		o[n.key[r]] = e[r] || "";
	return (
		(o[n.q.name] = {}),
		o[n.key[12]].replace(n.q.parser, function (t, e, r) {
			e && (o[n.q.name][e] = r);
		}),
		o
	);
}
pu.options = {
	strictMode: false,
	key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
	q: {
		name: "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};

// ==============================================================================================
// getNormalizedURL
// Normalize any URL
// - Input -> Output
// - Contain javascript -> ""
// - Other URLs -> removes "//", "www", "http:", "https:"
// ==============================================================================================
function gn(source, domain) {
	var javaTags = [/void(0)/g, /"/g, /javascript/g, /openwindow/g, /open/g, /popup/g, /([?*+^$[\]\\(){}|-])/g, /'/g, /;/g];

	if (source.match("chrome-extension") != null)
		source = domain;
	if (source.match("javascript") != null || (source.indexOf('(') > 0 && source.indexOf(')') > 0) || source.indexOf('"') > 0) {
		var startIndex = (source.match("javascript") != null) ? source.indexOf("javascript") : 0;
		var endIndex = (source.indexOf("\"") != -1) ? source.indexOf("\"") + 1 : (source.indexOf("\'") != -1) ? source.indexOf("\'") + 1 : source.length;
		source = source.replace(source.substr(startIndex, endIndex), "");
		startIndex = (source.indexOf("\"") != -1) ? source.indexOf("\"") : (source.indexOf("\'") != -1) ? source.indexOf("\'") : source.length;
		endIndex = source.length;
		source = source.replace(source.substr(startIndex, source.length), "");

		for (var i = javaTags.length; i-- > 0;) {
			source = source.toLowerCase().replace(javaTags[i], "");
		}
		source = "";

	}

	if (source.length > 0) {
		var i = "http:" == source.toLowerCase().substr(0, 5) ? 7 : 8;
		(source = (source += source.substr(i).indexOf("/") < 0 ? "/" : "")
			.replace("//www.", "")
			.replace("http://", "")
			.replace("https://", "")
			.replace("http:", "")
			.replace("https:", "")).indexOf("/") > 0 &&
			(source = source.substring(0, source.indexOf("/")));
	}
	return source;
}

// ==============================================================================================
// Extract top-domain level, domain and assign a code
// ==============================================================================================
var gd = function (host) {
	var domainClass = [['.com', 1], ['.info', 1], ['.net', 1], ['.org', 1],
	['.biz', 2], ['.name', 2], ['.pro', 2], ['.arpa', 3],
	['.aero', 4], ['.asia', 4], ['.cat', 4], ['.coop', 4], ['.edu', 4], ['.gov', 4], ['.int', 4], ['.jobs', 4],
	['.mil', 4], ['.mobi', 4], ['.museum', 4], ['.post', 4], ['.tel', 4], ['.travel', 4], ['.xxx', 4]]

	var topDomain = "";
	var topDomainCode = -1;
	var domainParts = [];
	var topHost = host;

	if (ip(host) === 1) {
		topDomain = "-";
		topDomainCode = 0;
	}
	else {
		var domainParts = host.split('.');
		if (domainParts.length > 1) {
			topDomain = "." + domainParts[domainParts.length - 1];
			topHost = domainParts[domainParts.length - 2] + "." + domainParts[domainParts.length - 1];
		}
		if (domainParts[domainParts.length - 1].length == 2) {
			if (domainParts[domainParts.length - 2].length == 2) {
				topDomainCode = 6;
				topDomain = "." + domainParts[domainParts.length - 2] + topDomain;
				topHost = domainParts[domainParts.length - 3] + "." + topHost;
			}
			else
				topDomainCode = 5;
		}
		else if (domainParts.length === 0) {
			topDomain = "";
			topDomainCode = -1;
		}
		else
			domainClass.forEach(function (item, index) {
				if (item[0] === topDomain)
					topDomainCode = domainClass[index][1];
			});
	}
	return [
		topDomain,
		topDomainCode,
		topHost
	];
}

// ==============================================================================================
// Calculates Resource Distance
// - Parameters :
// - resources(Array): List of resources address
// - source(string): page URL address
// - domain(string): domain of page URL
// - Input -> Output
// ==============================================================================================
var gr = function (resources, source, domain) {
	var targetList = new Array();
	var count = 0,
		resourceDistance = 0,
		sourceD = gd(pu(gn(source, domain)).host.toLowerCase())[2],
		https = 0;

	for (var i = 0; i < resources.length; i++) {
		var u = resources[i].src != null ? resources[i].src.toLowerCase() :
			resources[i].href != null ? resources[i].href.toLowerCase() :
				resources[i];
		if (u != null && u.length > 0) {
			https += u.match('https:') != null ? 1 : 0;
			var saveU = u;
			u = gn(u, domain);

			var d = gd(u);
			u = d[2];

			var flag = false;
			targetList.forEach(function (item, index) {
				if (item[0] === u) {
					item[1]++;
					flag = true;
				}
			});
			if (!flag) {
				targetList[targetList.length] = new Array(u, 1);
			}

			var score = lv(sourceD, u, { insertion_cost: 1, deletion_cost: 1, substitution_cost: 2 });

			score = score / Math.max(sourceD.length, u.length);
			resourceDistance += score;
			count++;
		}
	}
	if (count != 0) {
		resourceDistance = resourceDistance / count;
		https /= count;
	}
	if (resourceDistance === null || resourceDistance === NaN)
		resourceDistance = 0;
	resourceDistance = resourceDistance > 1 ? 1 : resourceDistance;
	var possibleTarget = targetList[0];
	targetList.forEach(function (item, index) {
		if (item[1] > possibleTarget[1])
			possibleTarget[0] = item[0];
	});
	return [
		resourceDistance, //2
		https //8
	];
}

// ==============================================================================================
// Round a number according to decimal place
// By Jack Moore, https://twitter.com/jacklmoore
// ==============================================================================================
var ro = function (value, decimals) {
	return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

// ==============================================================================================
// Check for valid IP Address in URL
// ==============================================================================================
var ip = function (host) {
	return host.match(new RegExp("^\\d+\\.\\d+\\.\\d+\\.\\d+")) == null ? 0 : 1;
}

// ==============================================================================================
// Extract all key terms from a URL
// ==============================================================================================
var gk = function (host, dir, file, query) {
	var isIP = ip(host);
	var result = [];
	host = host.toLowerCase().substr(0, 4) == "www." ? host.toLowerCase().substr(4, host.length) : host;
	if (host.split(".").length > 1) {
		host = host.substr(0, host.lastIndexOf("."));
		result[0] = isIP != 1 ? host.substr(0, host.lastIndexOf(".")).replace(/\W+/g, "|") : "";
	}
	result[1] = dir.replace(/\W+/g, "|");
	result[2] = query.replace(/\W+/g, "|") + "|" + file.replace(/\W+/g, "|");
	return [
		result[0],
		result[1],
		result[2]
	];
}

// ==============================================================================================
// Count words
// ==============================================================================================
var gw = function (str) {
	return str.split(/[\s*\.*\,\;\+?\#\|:\-\_\=\/\\\[\]\(\)\{\}$%&*]/).filter(function (e) { return e });
}
//getWordCount
var gc = function (str) {
	return gw(str).length;
}

// ==============================================================================================
// Check for keywords in directory part of a URL
// ==============================================================================================
var dk = function (dir) {
	keywords = ['wp', 'paypal', 'content', 'com', 'images', 'includes', 'www', 'admin', 'update',
		'js', 'amp', 'security', 'remax', 'fr', 'cmd', 'templates', 'uploads', 'css',
		'cache', 'dispatch', 'modules', 'de', 'components'];

	var arr = gw(dir);
	return arr.length - arr.diff(keywords).length;
}

// ==============================================================================================
// Compute the Levenshtein distance between two strings.
// Algorithm based from Speech and Language Processing - Daniel Jurafsky and James H. Martin.
// ==============================================================================================
function lv(source, target, options) {
	options = options || {};
	options.insertion_cost = options.insertion_cost || 1;
	options.deletion_cost = options.deletion_cost || 1;
	options.substitution_cost = options.substitution_cost || 2;

	var sourceLength = source.length;
	var targetLength = target.length;
	var distanceMatrix = [[0]];

	for (var row = 1; row <= sourceLength; row++) {
		distanceMatrix[row] = [];
		distanceMatrix[row][0] = distanceMatrix[row - 1][0] + options.deletion_cost;
	}

	for (var column = 1; column <= targetLength; column++) {
		distanceMatrix[0][column] = distanceMatrix[0][column - 1] + options.insertion_cost;
	}

	for (var row = 1; row <= sourceLength; row++) {
		for (var column = 1; column <= targetLength; column++) {
			var costToInsert = distanceMatrix[row][column - 1] + options.insertion_cost;
			var costToDelete = distanceMatrix[row - 1][column] + options.deletion_cost;

			var sourceElement = source[row - 1];
			var targetElement = target[column - 1];
			var costToSubstitute = distanceMatrix[row - 1][column - 1];
			if (sourceElement !== targetElement) {
				costToSubstitute = costToSubstitute + options.substitution_cost;
			}
			distanceMatrix[row][column] = Math.min(costToInsert, costToDelete, costToSubstitute);
		}
	}
	return distanceMatrix[sourceLength][targetLength];
}

/* chrome listener to return page's feature vector */
var f2 = 0, f4 = -1, f5 = -1, f8 = -1, f13 = 0, f16 = 0, f17 = 0;
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.type == "getFeatures") {
			var uri = pu(document.URL);
			if (uri.protocol === "https")
				f2 = 1;
			if (uri.host.length > 0)
				f4 = ro(1 / uri.host.length, 4);
			if (uri.directory.length > 0)
				f5 = ro(1 / uri.directory.length, 4);

			var d = gk(uri.host, uri.directory, uri.file, uri.query);
			f8 = gc(uri.directory) > 0 ? dk(uri.directory) / gc(uri.directory) : -1;

			var v;
			v = gr(document.links, uri.source, uri.protocol + "://" + uri.host + "/");
			f13 = ro(v[0], 4);
			f17 = ro(v[1], 4);

			v = gr(document.images, uri.source, uri.protocol + "://" + uri.host + "/");
			f16 = ro(v[0], 4);

			sendResponse({ URL: document.URL, Domain: uri.host, F2: f2, F4: f4, F5: f5, F8: f8, F13: f13, F16: f16, F17: f17 });
		}
	}
);


