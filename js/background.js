// Google Analytics
var _g = _g || [];
_g.push(['_setAccount', 'UA-64798919-2']);
_g.push(['_trackPageview']);

(function () {
	var ga = document.createElement('script');
	ga.type = 'text/javascript';
	ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(ga, s);
})();

chrome.runtime.onInstalled.addListener(function (details) {
	if (details.reason == 'install') {
		console.log('Installed successfuly');
	} else if (details.reason == "update") {
		var thisVersion = chrome.runtime.getManifest().version;
		console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
	}
});

