if ("undefined" == typeof(ovl_cardbookComposeMsg)) {
	var ovl_cardbookComposeMsg = {
		
		setAB: function() {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var exclusive = prefs.getBoolPref("extensions.cardbook.exclusive");
			if (exclusive) {
				document.getElementById('tasksMenuAddressBook').setAttribute('hidden', 'true');
			} else {
				document.getElementById('tasksMenuAddressBook').removeAttribute('hidden');
			}
		}

	};
	
	ovl_cardbookComposeMsg.setAB();

};
