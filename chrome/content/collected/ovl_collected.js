if ("undefined" == typeof(ovl_collected)) {
	var ovl_collected = {
		
		collectToCardBook: function () {
			var msgtype = document.getElementById("msgcomposeWindow").getAttribute("msgtype");
			if (msgtype != Components.interfaces.nsIMsgCompDeliverMode.Now && msgtype != Components.interfaces.nsIMsgCompDeliverMode.Later) {
				return;
			}
			Components.utils.import("resource:///modules/jsmime.jsm");
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var emailsCollection = prefs.getComplexValue("extensions.cardbook.emailsCollection", Components.interfaces.nsISupportsString).data;
			wdw_cardbooklog.updateStatusProgressInformationWithDebug2("debug mode : start of emails collection : " + emailsCollection);
			if (emailsCollection != "") {
				var myFields = gMsgCompose.compFields;
				var listToCollect = ["replyTo", "to", "cc", "fcc", "bcc", "followupTo"];
				for (var i = 0; i < listToCollect.length; i++) {
					if (myFields[listToCollect[i]]) {
						if (myFields[listToCollect[i]] != null && myFields[listToCollect[i]] !== undefined && myFields[listToCollect[i]] != "") {
							var emailsCollectionList = [];
							emailsCollectionList = emailsCollection.split(',');
							var listOfEmails = [];
							Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
							listOfEmails = cardbookUtils.getDisplayNameAndEmailFromEmails(jsmime.headerparser.decodeRFC2047Words(myFields[listToCollect[i]]));
							for (var j = 0; j < listOfEmails.length; j++) {
								if (!cardbookRepository.isEmailRegistered(listOfEmails[j][1])) {
									for (var k = 0; k < emailsCollectionList.length; k++) {
										var dirPrefIdName = cardbookUtils.getPrefNameFromPrefId(emailsCollectionList[k]);
										wdw_cardbooklog.updateStatusProgressInformationWithDebug2(dirPrefIdName + " : debug mode : trying to collect contact " + listOfEmails[j][0]);
										cardbookRepository.addCardFromDisplayAndEmail(emailsCollectionList[k], listOfEmails[j][0], listOfEmails[j][1]);
									}
								}
							}
						}
					}
				}
			}
		}

	}
};

window.addEventListener("compose-send-message", function(e) { ovl_collected.collectToCardBook(e); }, true);
