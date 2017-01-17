if ("undefined" == typeof(ovl_cardbookMailContacts)) {
	var ovl_cardbookMailContacts = {
		getCardBookDisplayNameFromEmail: function(aEmail, aDefaultDisplay) {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			cardbookRepository.jsInclude(["chrome://cardbook/content/cardbookUtils.js"]);
			var found = false;
			var myResult = "";
			if (aEmail != null && aEmail !== undefined && aEmail != "") {
				var myTestString = aEmail.toLowerCase();
				var i = cardbookRepository.cardbookAccounts.length;
				while (i--) {
					if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][5] && (cardbookRepository.cardbookAccounts[i][6] != "SEARCH")) {
						var myDirPrefId = cardbookRepository.cardbookAccounts[i][4];
						if (cardbookRepository.cardbookCardEmails[myDirPrefId]) {
							if (cardbookRepository.cardbookCardEmails[myDirPrefId][myTestString]) {
								myResult = cardbookRepository.cardbookCardEmails[myDirPrefId][myTestString][0].fn;
								found = true;
								break;
							}
						}
					}
				}
			}
			if (found) {
				return myResult;
			} else if (aDefaultDisplay != null && aDefaultDisplay !== undefined && aDefaultDisplay != "") {
				return aDefaultDisplay;
			} else {
				return aEmail;
			}
		},

		getCardFromEmail: function(aEmail) {
			var myTestString = aEmail.toLowerCase();
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][5] && (cardbookRepository.cardbookAccounts[i][6] != "SEARCH")) {
					var myDirPrefId = cardbookRepository.cardbookAccounts[i][4];
					if (cardbookRepository.cardbookCardEmails[myDirPrefId]) {
						if (cardbookRepository.cardbookCardEmails[myDirPrefId][myTestString]) {
							return cardbookRepository.cardbookCardEmails[myDirPrefId][myTestString][0];
						}
					}
				}
			}
		},

		addToCardBook: function(aDirPrefId) {
			try {
				var myNewCard = new cardbookCardParser();
				myNewCard.dirPrefId = aDirPrefId;
				var myPopupNode = document.popupNode;
				var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
				var myEmail = myEmailNode.getAttribute('emailAddress');
				myNewCard.email.push([[myEmail], [], "", []]);
				myNewCard.fn = myEmailNode.getAttribute('displayName');
				if (myNewCard.fn == "") {
					myNewCard.fn = myEmail.substr(0, myEmail.indexOf("@")).replace("."," ").replace("_"," ");
				}
				var myDisplayNameArray = myNewCard.fn.split(" ");
				if (myDisplayNameArray.length > 1) {
					myNewCard.lastname = myDisplayNameArray[myDisplayNameArray.length - 1];
					var removed = myDisplayNameArray.splice(myDisplayNameArray.length - 1, 1);
					myNewCard.firstname = myDisplayNameArray.join(" ");
				}
				cardbookUtils.openEditionWindow(myNewCard, "AddEmail");

				var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
				var myEmail = myEmailNode.getAttribute('emailAddress');
				UpdateEmailNodeDetails(myEmail, myEmailNode);
			}
			catch (e) {
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
				var errorTitle = "addToCardBook";
				prompts.alert(null, errorTitle, e);
			}
		},

		editOrViewContact: function() {
			var myPopupNode = document.popupNode;
			var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
			var myEmail = myEmailNode.getAttribute('emailAddress');
			var isEmailRegistered = cardbookRepository.isEmailRegistered(myEmail);
	
			if (isEmailRegistered) {
				var myCard = ovl_cardbookMailContacts.getCardFromEmail(myEmail);
				var myOutCard = new cardbookCardParser();
				cardbookUtils.cloneCard(myCard, myOutCard);
				var cardbookPrefService = new cardbookPreferenceService(myCard.dirPrefId);
				if (cardbookPrefService.getReadOnly()) {
					cardbookUtils.openEditionWindow(myOutCard, "ViewCard");
				} else {
					cardbookUtils.openEditionWindow(myOutCard, "EditCard");
				}
				UpdateEmailNodeDetails(myEmail, myEmailNode);
			}
		},

		hideOldAddressbook: function () {
			document.getElementById("addToAddressBookItem").setAttribute("hidden", true);
			document.getElementById("editContactItem").setAttribute("hidden", true);
			document.getElementById("viewContactItem").setAttribute("hidden", true);
		},
		
		hideOrShowNewAddressbook: function (aValue) {
			if (aValue) {
				document.getElementById("addToCardBookMenu").setAttribute("hidden", true);
				document.getElementById("editInCardBookMenu").removeAttribute('hidden');
			} else {
				var count = 0;
				for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
					if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][5] && (cardbookRepository.cardbookAccounts[i][6] != "SEARCH") && !cardbookRepository.cardbookAccounts[i][7]) {
						count++;
					}
				}
				if (count !== 0) {
					document.getElementById("addToCardBookMenu").removeAttribute('hidden');
				} else {
					document.getElementById("addToCardBookMenu").setAttribute("hidden", true);
				}
				document.getElementById("editInCardBookMenu").setAttribute("hidden", true);
			}
		}
		
	};
};

// for the contact menu popup
// setupEmailAddressPopup
(function() {
	// Keep a reference to the original function.
	var _original = setupEmailAddressPopup;
	
	// Override a function.
	setupEmailAddressPopup = function() {
		// Execute original function.
		var rv = _original.apply(null, arguments);
		
		// Execute some action afterwards.
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var exclusive = prefs.getBoolPref("extensions.cardbook.exclusive");
		if (exclusive) {
			ovl_cardbookMailContacts.hideOldAddressbook();
		}
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
		var myEmail = arguments[0].getAttribute('emailAddress');
		var isEmailRegistered = cardbookRepository.isEmailRegistered(myEmail);
		ovl_cardbookMailContacts.hideOrShowNewAddressbook(isEmailRegistered);

		if (isEmailRegistered) {
			var myCard = ovl_cardbookMailContacts.getCardFromEmail(myEmail);
			var cardbookPrefService = new cardbookPreferenceService(myCard.dirPrefId);
			var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
			var strBundle = stringBundleService.createBundle("chrome://cardbook/locale/cardbook.properties");
			document.getElementById("editInCardBookMenu").setAttribute("cardbookId", myCard.dirPrefId+"::"+myCard.uid);
			if (cardbookPrefService.getReadOnly()) {
				document.getElementById('editInCardBookMenu').label=strBundle.GetStringFromName("viewInCardBookMenuLabel");
			} else {
				document.getElementById('editInCardBookMenu').label=strBundle.GetStringFromName("editInCardBookMenuLabel");
			}
			
			cardbookUtils.addCardToIMPPMenuSubMenu(myCard, 'IMPPCardsMenuPopup');
		} else {
			cardbookUtils.addCardToIMPPMenuSubMenu(null, 'IMPPCardsMenuPopup');
		}
		var emailAddressPlaceHolder = document.getElementById("emailAddressPlaceHolder");
		emailAddressPlaceHolder.setAttribute("label", MailServices.headerParser.makeMimeAddress(arguments[0].getAttribute("displayName"), arguments[0].getAttribute('emailAddress')));
		
		// return the original result
		return rv;
	};

})();

// for the yellow star
// UpdateEmailNodeDetails
(function() {
	// Keep a reference to the original function.
	var _original = UpdateEmailNodeDetails;

	// Override a function.
	UpdateEmailNodeDetails = function() {

		var rv = _original.apply(null, arguments);

		// Execute some action afterwards.
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var exclusive = prefs.getBoolPref("extensions.cardbook.exclusive");
		var showCondensedAddresses = prefs.getBoolPref("mail.showCondensedAddresses");
		var cardFound = cardbookRepository.isEmailRegistered(arguments[0]);
		if (exclusive || cardFound) {
			arguments[1].setAttribute("hascard", cardFound.toString());
		}
		if (showCondensedAddresses && cardFound) {
			var displayName = ovl_cardbookMailContacts.getCardBookDisplayNameFromEmail(arguments[0], arguments[1].getAttribute("displayName"));
			arguments[1].setAttribute("label", displayName);
		}
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
