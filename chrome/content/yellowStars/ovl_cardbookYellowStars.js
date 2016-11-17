// for the yellow star
// UpdateEmailNodeDetails
(function() {
	// Keep a reference to the original function.
	var _original = UpdateEmailNodeDetails;

	// Override a function.
	UpdateEmailNodeDetails = function() {
		// Execute original function.
		var rv = _original.apply(null, arguments);
		
		// Execute some action afterwards.
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var exclusive = prefs.getBoolPref("extensions.cardbook.exclusive");
		if (exclusive) {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			var cardFound = cardbookRepository.isEmailRegistered(arguments[0]);
			arguments[1].setAttribute("hascard", cardFound.toString());
		} else if (arguments[1].getAttribute("hascard") == "false") {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			var cardFound = cardbookRepository.isEmailRegistered(arguments[0]);
			arguments[1].setAttribute("hascard", cardFound.toString());
		}
		
		// return the original result
		return rv;
	};

})();

// nothing happens when click the yellow star
// 	
(function() {
	// Keep a reference to the original function.
	var _original = onClickEmailStar;
	
	// Override a function.
	onClickEmailStar = function() {
		return;
	};

})();
