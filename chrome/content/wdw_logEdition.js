if ("undefined" == typeof(wdw_logEdition)) {
	var wdw_logEdition = {
		
		validateLook: function (aPrefValue) {
			if (aPrefValue) {
				cardbookRepository.unregisterCss("chrome://cardbook/skin/logEditionNull.css");
				cardbookRepository.reloadCss("chrome://cardbook/skin/logEditionBlue.css");
			} else {
				cardbookRepository.unregisterCss("chrome://cardbook/skin/logEditionBlue.css");
				cardbookRepository.reloadCss("chrome://cardbook/skin/logEditionNull.css");
			}
		},

		load: function () {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var defaultLook = prefs.getBoolPref("extensions.cardbook.defaultLook");
			wdw_logEdition.validateLook(defaultLook);

			var myLogArray = cardbookRepository.statusInformation;
			var myTreeView = {
				rowCount : myLogArray.length,
				isContainer: function(row) { return false },
				cycleHeader: function(row) { return false },
				getRowProperties: function(row) { return myLogArray[row][1] },
				getCellText : function(row,column){
					if (column.id == "logEditionValue") return myLogArray[row][0];
					else if (column.id == "logEditionType") return myLogArray[row][1];
				}
			}
			document.getElementById('logEditionTree').view = myTreeView;
		},

		selectAllKey: function () {
			var myTree = document.getElementById('logEditionTree');
			myTree.view.selection.selectAll();
		},

		clipboard: function () {
			try {
				var myTree = document.getElementById('logEditionTree');
				var myLogArray = [];
				var numRanges = myTree.view.selection.getRangeCount();
				if (numRanges > 0) {
					for (var i = 0; i < numRanges; i++) {
						var start = new Object();
						var end = new Object();
						myTree.view.selection.getRangeAt(i,start,end);
						for (var j = start.value; j <= end.value; j++){
							myLogArray.push(myTree.view.getCellText(j, {id: "logEditionValue"}));
						}
					}
					cardbookUtils.clipboardSet(myLogArray.join("\n"));
				}
			}
			catch (e) {
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
				var errorTitle = "clipboard error";
				prompts.alert(null, errorTitle, e);
			}
		},

		flush: function () {
			cardbookRepository.statusInformation = [];
			wdw_logEdition.load();
		},

		cancel: function () {
			close();
		}

	};

};