if ("undefined" == typeof(cardbookTabType)) {
	var cardbookTabMonitor = {
		monitorName: "cardbook",
		onTabTitleChanged: function() {},
		onTabOpened: function(aTab) {
			if (aTab.mode.name == "cardbook") {
				wdw_cardbook.loadFirstWindow();
			}
		},
		onTabClosing: function(aTab) {
			if (aTab.mode.name == "cardbook") {
				document.getElementById("cardboookModeBroadcaster").setAttribute("mode", "mail");
			}
		},
		onTabPersist: function() {},
		onTabRestored: function() {},
		onTabSwitched: function(aNewTab, aOldTab) {
			if (aNewTab.mode.name == "cardbook") {
				document.getElementById("cardboookModeBroadcaster").setAttribute("mode", "cardbook");
			} else {
				wdw_cardbook.setElementLabel('statusText', "");
				document.getElementById("cardboookModeBroadcaster").setAttribute("mode", "mail");
			}
		}
	};

	var cardbookTabType = {
		name: "cardbook",
		panelId: "cardbookTabPanel",
		modes: {
			cardbook: {
				type: "cardbookTab",
				maxTabs: 1,
				openTab: function(aTab, aArgs) {
					aTab.title = aArgs["title"];
				},

				showTab: function(aTab) {
				},

				closeTab: function(aTab) {
				},
				
				persistTab: function(aTab) {
					let tabmail = document.getElementById("tabmail");
					return {
						background: (aTab != tabmail.currentTabInfo)
						};
				},
				
				restoreTab: function(aTabmail, aState) {
					var strBundle = document.getElementById("cardbook-strings");
					aState.title = strBundle.getString("cardbookTitle");
					cardbookUtils.orientBoxes();
					aTabmail.openTab('cardbook', aState);
				},
				
				onTitleChanged: function(aTab) {
					var strBundle = document.getElementById("cardbook-strings");
					aTab.title = strBundle.getString("cardbookTitle");
				},
				
				supportsCommand: function supportsCommand(aCommand, aTab) {
					return false;
				},
				
				isCommandEnabled: function isCommandEnabled(aCommand, aTab) {
					return false;
				},
				
				doCommand: function doCommand(aCommand, aTab) {
					return false;
				},

				onEvent: function(aEvent, aTab) {}
			}
		},

		saveTabState: function(aTab) {
		}
	};
};

if ("undefined" == typeof(ovl_cardbook)) {
	var ovl_cardbook = {
		open: function() {
			cardbookUtils.orientBoxes();
			var strBundle = document.getElementById("cardbook-strings");
			document.getElementById('tabmail').openTab('cardbook', {title: strBundle.getString("cardbookTitle")});
		}
	};
};

window.addEventListener("load", function(e) {
	let tabmail = document.getElementById('tabmail');
	if (tabmail) {
		tabmail.registerTabType(cardbookTabType);
		tabmail.registerTabMonitor(cardbookTabMonitor);
	}

	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	var firstRun = prefs.getBoolPref("extensions.cardbook.firstRun");

	if (firstRun) {
		var toolbar = document.getElementById("mail-bar3");
		if (toolbar) {
			var toolbarItems = toolbar.currentSet.split(",");
			var found = false;
			for (var i=0; i<toolbarItems.length; i++) {
				if (toolbarItems[i] == "cardbookToolbarButton") {
					found = true;
					break;
				}
			}
			if (!found) {
				toolbar.insertItem("cardbookToolbarButton");
				toolbar.setAttribute("currentset", toolbar.currentSet);
				document.persist(toolbar.id, "currentset");
			}
		}
		prefs.setBoolPref("extensions.cardbook.firstRun", false);
	}

	window.removeEventListener('load', arguments.callee, true);
}, false);
