chrome.runtime.onInstalled.addListener(function (details) {
	if (details.reason == 'install') {
		console.log('Installed successfuly');
	} else if (details.reason == "update") {
		var thisVersion = chrome.runtime.getManifest().version;
		console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
	}
});

