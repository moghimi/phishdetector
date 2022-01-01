window.onload = function () {
	$("#copyright").html("&copy;2013-" + (new Date).getFullYear() + ",&nbsp;PhishDetector&reg;&nbsp;" + chrome.app.getDetails().version)
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, { type: "getFeatures" }, function (response) {
			var data = { Result: 'Unknown', Confidence: 0, Rule: 0, Info: "PDIE v" + chrome.app.getDetails().version };
			var result = "Communication Error!<br> Check your connection to internet and try again. ";
			if (typeof response == 'undefined' || response.length == 0 || response == null) {
				$("#result").removeClass('loading').addClass("Unknown").html("Please refresh the webpage and try again. ");
			}
			else {
				var Domain = response.Domain;
				//console.log(response);
				var _url = response.URL,
					_f2 = response.F2,
					_f4 = response.F4,
					_f5 = response.F5,
					_f8 = response.F8,
					_f13 = response.F13,
					_f16 = response.F16,
					_f17 = response.F17;

				if (_f2 == 1 && _f16 > 0.588 && _f13 > 0.315) {
					data.Result = "Phishing";
					data.Confidence = "1";
					data.Rule = "1";
				}
				if (_f2 == 1 && _f16 > 0.588 && _f13 <= 0.315) {
					data.Result = "Legitimate";
					data.Confidence = "1";
					data.Rule = "2";
				}
				if (_f2 == 1 && _f16 <= 0.588 && _f8 > 0.067) {
					data.Result = "Phishing";
					data.Confidence = "1";
					data.Rule = "3";
				}
				if (_f2 == 1 && _f16 <= 0.588 && _f8 <= 0.067 && _f4 > 0.018 && _f13 > 0.790 && _f17 > 0.686) {
					data.Result = "Phishing";
					data.Confidence = "1";
					data.Rule = "4";
				}
				if (_f2 == 1 && _f16 <= 0.588 && _f8 <= 0.067 && _f4 > 0.018 && _f13 > 0.790 && _f17 <= 0.686) {
					data.Result = "Legitimate";
					data.Confidence = "1";
					data.Rule = "5";
				}
				if (_f2 == 1 && _f16 <= 0.588 && _f8 <= 0.067 && _f4 > 0.018 && _f13 <= 0.790) {
					data.Result = "Legitimate";
					data.Confidence = "1";
					data.Rule = "6";
				}
				if (_f2 == 1 && _f16 <= 0.588 && _f8 <= 0.067 && _f4 <= 0.018) {
					data.Result = "Phishing";
					data.Confidence = "1";
					data.Rule = "7";
				}
				if (_f2 == 0 && _f8 > -1) {
					data.Result = "Phishing";
					data.Confidence = "1";
					data.Rule = "8";
				}
				if (_f2 == 0 && _f8 <= -1 && _f16 > 0.140) {
					data.Result = "Phishing";
					data.Confidence = "1";
					data.Rule = "9";
				}
				if (_f2 == 0 && _f8 <= -1 && _f16 <= 0.140 && _f4 > 0.036 && _f13 > 0.471) {
					data.Result = "Phishing";
					data.Confidence = "1";
					data.Rule = "10";
				}
				if (_f2 == 0 && _f8 <= -1 && _f16 <= 0.140 && _f4 > 0.036 && _f13 <= 0.471 && _f13 > 0.004) {
					data.Result = "Legitimate";
					data.Confidence = "1";
					data.Rule = "11";
				}
				if (_f2 == 0 && _f8 <= -1 && _f16 <= 0.140 && _f4 > 0.041 && _f13 <= 0.004) {
					data.Result = "Legitimate";
					data.Confidence = "1";
					data.Rule = "12";
				}
				if (_f2 == 0 && _f8 <= -1 && _f16 <= 0.140 && _f4 > 0.036 && _f13 <= 0.004 && _f4 <= 0.041) {
					data.Result = "Phishing";
					data.Confidence = "0.5";
					data.Rule = "13";
				}
				if (_f2 == 0 && _f8 <= -1 && _f16 <= 0.140 && _f4 <= 0.036) {
					data.Result = "Phishing";
					data.Confidence = "1";
					data.Rule = "14";
				}

				if (data.Result == "Phishing") {
					result = "Based on content review, this page is supposed to be a<span class='domain'>phishing</span>attack or may<span class='domain'>not safe</span>for browsing. <br> " +
						"Please be careful if you have to submit your sensitive information.";
				}
				if (data.Result == "Legitimate") {
					result = "Page domain is: " + "<p class='domain'>";
					if ((Domain.match(/./g) || []).length)
						result += (Domain.split('.')[Domain.split('.').length - 2].length == 2 ? Domain.split('.')[Domain.split('.').length - 3] + "." : "") + Domain.split('.')[Domain.split('.').length - 2] + "." + Domain.split('.')[Domain.split('.').length - 1];
					else
						result += Domain;
					result += "</p><br/>";
					result += "Based on content review, this page is safe for browsing, but it's very important to" +
						"<b>be careful what you submit to this webpage.</b>";
				}
				if (data.Result == "Unknown") {
					result = "Unfortunately we couldn't inspect the page which you are browsing. " +
						"<b>Please be careful to submit your sensetive information.</b>";
				}
				$("#result").removeClass('loading').addClass(data.Result).html(result);
			}
		});
	});
};

