if ("undefined" == typeof(wdw_cardbook)) {
	var wdw_cardbook = {

		currentType : "",
		currentIndex : "",
		currentCardOfListId : "",
		currentAccount : "",
		cutAndPaste : [],

		cardbookrefresh : false,

		sortAccounts: function() {
			var myTree = document.getElementById('accountsOrCatsTree');
			
			// get Account selected for categories
			var mySelectedIndex = myTree.currentIndex;
			if (mySelectedIndex !== -1) {
				var myAccountId = myTree.view.getCellText(mySelectedIndex, {id: "accountId"});
			} else {
				var myAccountId = myTree.view.getCellText(0, {id: "accountId"});
			}

			// collect open container
			var listOfOpenedContainer = [];			
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][2]) {
					listOfOpenedContainer.push(cardbookRepository.cardbookAccounts[i][4]);
				}
			}

			// close opened container
			for (var i = 0; i < listOfOpenedContainer.length; i++) {
				var treeIndex = cardbookUtils.getPositionOfAccountId(listOfOpenedContainer[i]);
				if (treeIndex != -1)  {
					myTree.view.toggleOpenState(treeIndex);
				}
			}
			
			// sort accounts
			cardbookRepository.cardbookAccounts = cardbookRepository.cardbookAccounts.sort(function(a,b) {
				return a[0].localeCompare(b[0], 'en', {'sensitivity': 'base'});
			});
			// open opened containers
			for (var i = 0; i < listOfOpenedContainer.length; i++) {
				var treeIndex = cardbookUtils.getPositionOfAccountId(listOfOpenedContainer[i]);
				if (treeIndex != -1)  {
					myTree.view.toggleOpenState(treeIndex);
				}
			}
			
			//  select back category
			if (mySelectedIndex !== -1 && myAccountId.indexOf("::") >= 0) {
				var myTree = document.getElementById('cardsTree');
				var myFirstVisibleRow = myTree.boxObject.getFirstVisibleRow();
				var listOfUid = [];
				listOfUid = cardbookUtils.getSelectedCards();
				wdw_cardbook.selectAccountOrCat(myAccountId);
				cardbookUtils.setSelectedCards(listOfUid, myFirstVisibleRow);
				if (listOfUid.length == 1) {
					var myPrefId = cardbookUtils.getAccountId(myAccountId);
					if (cardbookRepository.cardbookCards[myPrefId+"::"+listOfUid[0]]) {
						wdw_cardbook.displayCard(cardbookRepository.cardbookCards[myPrefId+"::"+listOfUid[0]]);
					} else {
						wdw_cardbook.clearCard();
					}
				} else {
					wdw_cardbook.clearCard();
				}
			}
		},

		removeAccountFromWindow: function() {
			try {
				var myTree = document.getElementById('accountsOrCatsTree');
				if (myTree.currentIndex != -1) {
					var myParentIndex = myTree.view.getParentIndex(myTree.currentIndex);
					if (myParentIndex == -1) {
						myParentAccountId = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
						myParentAccountName = myTree.view.getCellText(myTree.currentIndex, {id: "accountName"});
						myParentAccountType = myTree.view.getCellText(myTree.currentIndex, {id: "accountType"});
					} else {
						myParentAccountId = myTree.view.getCellText(myParentIndex, {id: "accountId"});
						myParentAccountName = myTree.view.getCellText(myParentIndex, {id: "accountName"});
						myParentAccountType = myTree.view.getCellText(myParentIndex, {id: "accountType"});
					}
	
					var cardbookPrefService = new cardbookPreferenceService(myParentAccountId);
					var myPrefUrl = cardbookPrefService.getUrl();
					
					var strBundle = document.getElementById("cardbook-strings");
					var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
					var confirmTitle = strBundle.getString("confirmTitle");
					var confirmMsg = strBundle.getFormattedString("accountDeletionConfirmMessage", [myParentAccountName]);
					var returnFlag = false;
					var deleteContentFlag = {value: false};
					
					if (myParentAccountType === "FILE") {
						var myFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
						myFile.initWithPath(myPrefUrl);
						var deleteContentMsg = strBundle.getFormattedString("accountDeletiondeleteContentFileMessage", [myFile.leafName]);
						returnFlag = prompts.confirmCheck(window, confirmTitle, confirmMsg, deleteContentMsg, deleteContentFlag);
					} else if (myParentAccountType === "DIRECTORY") {
						var myFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
						myFile.initWithPath(myPrefUrl);
						var deleteContentMsg = strBundle.getFormattedString("accountDeletiondeleteContentDirMessage", [myFile.leafName]);
						returnFlag = prompts.confirmCheck(window, confirmTitle, confirmMsg, deleteContentMsg, deleteContentFlag);
					} else {
						returnFlag = prompts.confirm(window, confirmTitle, confirmMsg);
					}
					if (returnFlag) {
						cardbookRepository.removeAccountFromRepository(myParentAccountId);
						let cardbookPrefService = new cardbookPreferenceService(myParentAccountId);
						cardbookPrefService.delBranch();
						wdw_cardbook.refreshWindow(myParentAccountId, "", "REMOVE");
						cardbookUtils.formatStringForOutput("addressbookClosed", [myParentAccountName]);
						wdw_cardbook.loadCssRules();
						if (myFile && deleteContentFlag.value) {
							wdw_cardbooklog.updateStatusProgressInformationWithDebug2("debug mode : deleting : " + myFile.path);
							myFile.remove(true);
						}
					}
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.removeAccountFromWindow error : " + e, "Error");
			}
		},

   	firstOpen: function () {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var firstOpen = prefs.getBoolPref("extensions.cardbook.firstOpen");
		if (firstOpen && cardbookRepository.cardbookAccounts.length == 0) {
			wdw_cardbook.addAddressbook("first");
			prefs.setBoolPref("extensions.cardbook.firstOpen", false);
			prefs.setBoolPref("extensions.cardbook.listTabView", false);
			prefs.setBoolPref("extensions.cardbook.mailPopularityTabView", false);
			prefs.setBoolPref("extensions.cardbook.technicalTabView", false);
			prefs.setBoolPref("extensions.cardbook.vcardTabView", false);
		}
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var firstOpenModern = prefs.getBoolPref("extensions.cardbook.firstOpenModern");
		var panesView = prefs.getComplexValue("extensions.cardbook.panesView", Components.interfaces.nsISupportsString).data;
		if (firstOpenModern && panesView == "modern") {
			document.getElementById('dispadr').setAttribute('hidden', 'true');
			document.getElementById('disptel').setAttribute('hidden', 'true');
			document.getElementById('dispemail').setAttribute('hidden', 'true');
			prefs.setBoolPref("extensions.cardbook.firstOpenModern", true);
		}
		wdw_cardbook.showCorrectTabs();
		wdw_cardbook.setElementLabelWithBundle('cardbookToolbarEditButton', "cardbookToolbarEditButtonLabel");
		wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuEditCard', "cardbookToolbarEditButtonLabel");
		wdw_cardbook.setElementLabelWithBundle('editCardFromCards', "cardbookToolbarEditButtonLabel");
		wdw_cardbook.setElementLabelWithBundle('cardbookToolbarRemoveButton', "cardbookToolbarRemoveButtonLabel");
		wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuRemoveCard', "cardbookToolbarRemoveButtonLabel");
		wdw_cardbook.setElementLabelWithBundle('removeCardFromCards', "cardbookToolbarRemoveButtonLabel");
	},

   	setToolbarCustom: function () {
		var toolbox = document.getElementById("cardbook-toolbox");
		toolbox.customizeDone = function(aEvent) {
			MailToolboxCustomizeDone(aEvent, "CustomizeCardBookToolbar");
		};
		toolbox.setAttribute('toolbarHighlight','true');
	},

   	showCorrectTabs: function () {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		document.getElementById('listTab').setAttribute("collapsed", !prefs.getBoolPref("extensions.cardbook.listTabView"));
		document.getElementById('mailPopularityTab').setAttribute("collapsed", !prefs.getBoolPref("extensions.cardbook.mailPopularityTabView"));
		document.getElementById('technicalTab').setAttribute("collapsed", !prefs.getBoolPref("extensions.cardbook.technicalTabView"));
		document.getElementById('vcardTab').setAttribute("collapsed", !prefs.getBoolPref("extensions.cardbook.vcardTabView"));
	},

   	loadFirstWindow: function () {
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
		wdw_cardbook.setSyncControl();
		wdw_cardbook.setToolbarCustom();
		wdw_cardbook.setNoSearchMode();
		wdw_cardbook.setNoComplexSearchMode();
		wdw_cardbook.clearCard();
		wdw_cardbook.clearAccountOrCat();
		wdw_cardbook.firstOpen();
		window.setTimeout(function() { wdw_cardbook.loadCssRules(); wdw_cardbook.refreshAccountsInDirTree(); wdw_cardbook.selectAccountOrCat();}, 1000);
	},

		syncAccounts: function () {
			if (cardbookRepository.cardbookSyncMode === "NOSYNC") {
				var cardbookPrefService = new cardbookPreferenceService();
				var result = [];
				result = cardbookPrefService.getAllPrefIds();
				for (let i = 0; i < result.length; i++) {
					var myPrefId = result[i];
					var cardbookPrefService1 = new cardbookPreferenceService(myPrefId);
					var myPrefName = cardbookPrefService1.getName();
					var myPrefType = cardbookPrefService1.getType();
					if (myPrefType !== "FILE" && myPrefType !== "CACHE" && myPrefType !== "DIRECTORY" && myPrefType !== "SEARCH") {
						cardbookSynchronization.initSync(myPrefId);
						cardbookSynchronization.syncAccount(myPrefId);
					}
				}
			}
		},

		syncAccountFromAccountsOrCats: function () {
			try {
				if (cardbookRepository.cardbookSyncMode === "NOSYNC") {
					var myTree = document.getElementById('accountsOrCatsTree');
					var myPrefId = cardbookUtils.getAccountId(myTree.view.getCellText(myTree.currentIndex, {id: "accountId"}));
					var myPrefName = cardbookUtils.getPrefNameFromPrefId(myPrefId);
					
					cardbookSynchronization.initSync(myPrefId);
					cardbookSynchronization.syncAccount(myPrefId);
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.syncAccountFromAccountsOrCats error : " + e, "Error");
			}
		},

		displayAccountOrCat: function (aCardList) {
			var accountsOrCatsTreeView = {
				get rowCount() { return aCardList.length; },
				isContainer: function(row) { return false },
				cycleHeader: function(row) { return false },
				getRowProperties: function(row) {
					if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
						return "SEARCH color_" + aCardList[row].dirPrefId;
					} else {
						return "NOSEARCH";
					}
				}, 
				getCellText: function(row,column){
					if (column.id == "lastname") return aCardList[row].lastname;
					else if (column.id == "firstname") return aCardList[row].firstname;
					else if (column.id == "othername") return aCardList[row].othername;
					else if (column.id == "prefixname") return aCardList[row].prefixname;
					else if (column.id == "suffixname") return aCardList[row].suffixname;
					else if (column.id == "fn") return aCardList[row].fn;
					else if (column.id == "nickname") return aCardList[row].nickname;
					else if (column.id == "gender") return aCardList[row].gender;
					else if (column.id == "bday") return aCardList[row].bday;
					else if (column.id == "dispadr") return aCardList[row].dispadr;
					else if (column.id == "disphomeadr") return aCardList[row].disphomeadr;
					else if (column.id == "dispworkadr") return aCardList[row].dispworkadr;
					else if (column.id == "disptel") return aCardList[row].disptel;
					else if (column.id == "disphometel") return aCardList[row].disphometel;
					else if (column.id == "dispworktel") return aCardList[row].dispworktel;
					else if (column.id == "dispcelltel") return aCardList[row].dispcelltel;
					else if (column.id == "dispemail") return aCardList[row].dispemail;
					else if (column.id == "disphomeemail") return aCardList[row].disphomeemail;
					else if (column.id == "dispworkemail") return aCardList[row].dispworkemail;
					else if (column.id == "mailer") return aCardList[row].mailer;
					else if (column.id == "tz") return aCardList[row].tz;
					else if (column.id == "geo") return aCardList[row].geo;
					else if (column.id == "title") return aCardList[row].title;
					else if (column.id == "role") return aCardList[row].role;
					else if (column.id == "org") return aCardList[row].org;
					else if (column.id == "dispcategories") return aCardList[row].dispcategories;
					else if (column.id == "note") return aCardList[row].note;
					else if (column.id == "prodid") return aCardList[row].prodid;
					else if (column.id == "sortstring") return aCardList[row].sortstring;
					else if (column.id == "uid") return aCardList[row].uid;
					else if (column.id == "dispurl") return aCardList[row].dispurl;
					else if (column.id == "version") return aCardList[row].version;
					else if (column.id == "class1") return aCardList[row].class1;
					else if (column.id == "dispimpp") return aCardList[row].dispimpp;
					else if (column.id == "dirPrefId") return aCardList[row].dirPrefId;
					else if (column.id == "kind") return aCardList[row].kind;
					else if (column.id == "rev") return aCardList[row].rev;
					else if (column.id == "cardurl") return aCardList[row].cardurl;
					else if (column.id == "etag") return aCardList[row].etag;
					else return "false";
				}
			}
			document.getElementById('cardsTree').view = accountsOrCatsTreeView;
		},

		clearCard: function () {
			cardbookUtils.clearCard();
			document.getElementById('categoriesTextBox').value = "";
			cardbookElementTools.deleteRows('addedCardsBox');
			cardbookUtils.adjustFields();
		},
		
		displayCard: function (aCard) {
			wdw_cardbook.clearCard();
			cardbookUtils.displayCard(aCard, true);
			document.getElementById('vcardTextBox').value = cardbookUtils.cardToVcardData(aCard, false);
			document.getElementById('vcardTextBox').setAttribute('readonly', 'true');
			cardbookUtils.adjustFields();
		},
		
		selectAccountOrCatInNoSearch: function () {
			var myTree = document.getElementById('accountsOrCatsTree');
			var mySelectedIndex = myTree.currentIndex;
			if (mySelectedIndex !== -1) {
				var myAccountId = myTree.view.getCellText(mySelectedIndex, {id: "accountId"});
			} else {
				var myAccountId = myTree.view.getCellText(0, {id: "accountId"});
			}
			if (wdw_cardbook.currentAccount != mySelectedIndex + "::" + myAccountId) {
				wdw_cardbook.setNoSearchMode();
				wdw_cardbook.clearCard();
				var myCurrentDirPrefId = cardbookUtils.getAccountId(myAccountId);
				var cardbookPrefService = new cardbookPreferenceService(myCurrentDirPrefId);
				if (cardbookPrefService.getType() === "SEARCH") {
					wdw_cardbook.complexSearch(myAccountId);
				} else {
					wdw_cardbook.setNoComplexSearchMode();
				}
				wdw_cardbook.selectAccountOrCat(myAccountId);
			}
		},

		selectAccountOrCat: function (aAccountOrCat) {
			var myTree = document.getElementById('accountsOrCatsTree');

			if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
				var myTree = document.getElementById('cardsTree');
				var mySelectedAccount = cardbookRepository.cardbookSearchValue;
				if (cardbookRepository.cardbookDisplayCards[mySelectedAccount]) {
					wdw_cardbook.sortCardsTreeCol();
					if (cardbookRepository.cardbookDisplayCards[mySelectedAccount].length == 1) {
						wdw_cardbook.displayCard(cardbookRepository.cardbookCards[cardbookRepository.cardbookDisplayCards[mySelectedAccount][0].dirPrefId+"::"+cardbookRepository.cardbookDisplayCards[mySelectedAccount][0].uid]);
						if (myTree.currentIndex != 0) {
							myTree.view.selection.select(0);
						}
					} else if (cardbookUtils.getSelectedCardsCount() == 1) {
						// force refresh
						wdw_cardbook.displayCard(cardbookRepository.cardbookCards[cardbookRepository.cardbookDisplayCards[mySelectedAccount][myTree.currentIndex].dirPrefId+"::"+cardbookRepository.cardbookDisplayCards[mySelectedAccount][myTree.currentIndex].uid]);
					} else {
						wdw_cardbook.clearCard();
					}
				} else {
					wdw_cardbook.clearAccountOrCat();
					wdw_cardbook.clearCard();
				}
			} else if (aAccountOrCat != null && aAccountOrCat !== undefined && aAccountOrCat != "") {
				if (cardbookUtils.getPositionOfAccountId(aAccountOrCat) != -1) {
					if (myTree.currentIndex != cardbookUtils.getPositionOfAccountId(aAccountOrCat)) {
						myTree.view.selection.select(cardbookUtils.getPositionOfAccountId(aAccountOrCat));
						var myTree = document.getElementById('cardsTree');
						myTree.view.selection.clearSelection();
					} else {
						var myTree = document.getElementById('cardsTree');
					}
					wdw_cardbook.sortCardsTreeCol();
					if (cardbookRepository.cardbookDisplayCards[aAccountOrCat].length == 1) {
						wdw_cardbook.displayCard(cardbookRepository.cardbookCards[cardbookRepository.cardbookDisplayCards[aAccountOrCat][0].dirPrefId+"::"+cardbookRepository.cardbookDisplayCards[aAccountOrCat][0].uid]);
						if (myTree.currentIndex != 0) {
							myTree.view.selection.select(0);
						}
					} else if (cardbookUtils.getSelectedCardsCount() == 1) {
						// force refresh
						wdw_cardbook.displayCard(cardbookRepository.cardbookCards[cardbookRepository.cardbookDisplayCards[aAccountOrCat][myTree.currentIndex].dirPrefId+"::"+cardbookRepository.cardbookDisplayCards[aAccountOrCat][myTree.currentIndex].uid]);
					} else {
						wdw_cardbook.clearCard();
					}
				} else if (cardbookUtils.getPositionOfAccountId(cardbookUtils.getAccountId(aAccountOrCat)) != -1) {
					aAccountOrCat = cardbookUtils.getAccountId(aAccountOrCat);
					myTree.view.selection.select(cardbookUtils.getPositionOfAccountId(aAccountOrCat));
					var myTree = document.getElementById('cardsTree');
					myTree.view.selection.clearSelection();
					wdw_cardbook.sortCardsTreeCol();
					if (cardbookRepository.cardbookDisplayCards[aAccountOrCat].length == 1) {
						wdw_cardbook.displayCard(cardbookRepository.cardbookCards[cardbookRepository.cardbookDisplayCards[aAccountOrCat][0].dirPrefId+"::"+cardbookRepository.cardbookDisplayCards[aAccountOrCat][0].uid]);
						if (myTree.currentIndex != 0) {
							myTree.view.selection.select(0);
						}
					} else if (cardbookUtils.getSelectedCardsCount() == 1) {
						// force refresh
						wdw_cardbook.displayCard(cardbookRepository.cardbookCards[cardbookRepository.cardbookDisplayCards[aAccountOrCat][myTree.currentIndex].dirPrefId+"::"+cardbookRepository.cardbookDisplayCards[aAccountOrCat][myTree.currentIndex].uid]);
					} else {
						wdw_cardbook.clearCard();
					}
				} else {
					wdw_cardbook.clearAccountOrCat();
					wdw_cardbook.clearCard();
				}
			} else {
				if (cardbookRepository.cardbookAccounts) {
					myTree.view.selection.select(0);
					var mySelectedAccount = myTree.view.getCellText(myTree.currentIndex, myTree.columns.getNamedColumn("accountId"));
					if (cardbookRepository.cardbookDisplayCards[mySelectedAccount]) {
						var myTree = document.getElementById('cardsTree');
						wdw_cardbook.sortCardsTreeCol();
						if (cardbookRepository.cardbookDisplayCards[mySelectedAccount].length == 1) {
							wdw_cardbook.displayCard(cardbookRepository.cardbookCards[cardbookRepository.cardbookDisplayCards[mySelectedAccount][0].dirPrefId+"::"+cardbookRepository.cardbookDisplayCards[mySelectedAccount][0].uid]);
							if (myTree.currentIndex != 0) {
								myTree.view.selection.select(0);
							}
						} else if (cardbookUtils.getSelectedCardsCount() == 1) {
							// force refresh
							wdw_cardbook.displayCard(cardbookRepository.cardbookCards[cardbookRepository.cardbookDisplayCards[mySelectedAccount][myTree.currentIndex].dirPrefId+"::"+cardbookRepository.cardbookDisplayCards[mySelectedAccount][myTree.currentIndex].uid]);
						} else {
							wdw_cardbook.clearCard();
						}
					} else {
						wdw_cardbook.clearAccountOrCat();
						wdw_cardbook.clearCard();
					}
				}
			}
			wdw_cardbook.updateStatusInformation();
		},

		selectCard: function (aEvent) {
			var myTree = document.getElementById('cardsTree');
			var numRanges = myTree.view.selection.getRangeCount();
			var start = new Object();
			var end = new Object();
			var numberOfSelectedCard = 0;
			var positionOfSelectedCard = 0;
			for (let i = 0; i < numRanges; i++) {
				myTree.view.selection.getRangeAt(i,start,end);
			    for (let k = start.value; k <= end.value; k++) {
					numberOfSelectedCard++;
					positionOfSelectedCard = k;
				}
			}
			if ( numberOfSelectedCard != 1 ) {
				wdw_cardbook.clearCard();
			} else {
				var mySelectedCard = myTree.view.getCellText(positionOfSelectedCard, myTree.columns.getNamedColumn("dirPrefId"))+"::"+myTree.view.getCellText(positionOfSelectedCard, myTree.columns.getNamedColumn("uid"));
				if (cardbookRepository.cardbookCards[mySelectedCard]) {
					wdw_cardbook.displayCard(cardbookRepository.cardbookCards[mySelectedCard]);
				} else {
					wdw_cardbook.clearCard();
				}
			}
			if (aEvent) {
				aEvent.stopPropagation();
			}
		},

		removeCardFromWindow: function (aCard, aCacheDeletion) {
			try {
				cardbookRepository.removeCardFromRepository(aCard, aCacheDeletion);
				wdw_cardbook.refreshWindow("", aCard, "REMOVE");
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.removeCardFromWindow error : " + e, "Error");
			}
		},

		addCardToWindow: function (aCard, aMode, aFileName) {
			try {
				cardbookRepository.addCardToRepository(aCard, aMode, aFileName);
				wdw_cardbook.refreshWindow("", aCard, "ADD");
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.addCardToWindow error : " + e, "Error");
			}
		},

		clearAccountOrCat: function () {
			wdw_cardbook.displayAccountOrCat([]);
			var myTree = document.getElementById('accountsOrCatsTree');
			myTree.view.selection.select(-1);
			wdw_cardbook.updateStatusInformation();
		},

		refreshWindow2: function () {
			wdw_cardbook.refreshAccountsInDirTree();
			wdw_cardbook.selectAccountOrCat();
		},

		refreshWindow: function(aAccountId, aCard, aMode) {
			try {
				if (document.getElementById('accountsOrCatsTree')) {
					var myTree = document.getElementById('accountsOrCatsTree');
					if (myTree.currentIndex != -1) {
						var myCurrentAccountId = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
						var myCurrentDirPrefId = cardbookUtils.getAccountId(myCurrentAccountId);
					} else {
						var myCurrentDirPrefId = -1;
					}
	
					// Add account or remove Account
					if (aAccountId != null && aAccountId !== undefined && aAccountId != "") {
						if (aMode === "REMOVE") {
							if (cardbookRepository.cardbookAccounts[0]) {
								var firstAccountToSelect = cardbookRepository.cardbookAccounts[0][4];
								for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
									var myAccountId = cardbookRepository.cardbookAccounts[i][4];
									if (cardbookRepository.cardbookDisplayCards[myAccountId]) {
										if (cardbookRepository.cardbookDisplayCards[myAccountId].length > 0) {
											firstAccountToSelect = myAccountId;
											break;
										}
									}
								}
								wdw_cardbook.selectAccountOrCat(firstAccountToSelect);
								wdw_cardbook.refreshAccountsInDirTree();
							} else {
								wdw_cardbook.clearAccountOrCat();
								wdw_cardbook.refreshAccountsInDirTree();
								wdw_cardbook.clearCard();
							}
						} else {
							wdw_cardbook.refreshAccountsInDirTree();
							wdw_cardbook.selectAccountOrCat(aAccountId);
						}
						
					// Add card or remove card
					} else if (aCard.dirPrefId != null && aCard.dirPrefId !== undefined && aCard.dirPrefId != "") {
						// Search mode first
						var myTree = document.getElementById('cardsTree');
						if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
							var myCurrentAccountId = cardbookRepository.cardbookSearchValue;
							if (cardbookRepository.cardbookDisplayCards[myCurrentAccountId]) {
								wdw_cardbook.refreshAccountsInDirTree();
								wdw_cardbook.sortCardsTreeCol();
								if (cardbookRepository.cardbookDisplayCards[myCurrentAccountId].length == 1) {
									wdw_cardbook.displayCard(cardbookRepository.cardbookCards[cardbookRepository.cardbookDisplayCards[myCurrentAccountId][0].dirPrefId+"::"+cardbookRepository.cardbookDisplayCards[myCurrentAccountId][0].uid]);
									myTree.view.selection.select(0);
								} else if (cardbookUtils.getSelectedCardsCount() === 0) {
									cardbookUtils.setSelectedCards([aCard.uid]);
									wdw_cardbook.displayCard(aCard);
								}
							} else {
								wdw_cardbook.clearAccountOrCat();
								wdw_cardbook.clearCard();
							}
						// Work inside the same prefId
						} else if (aCard.dirPrefId == myCurrentDirPrefId || myCurrentDirPrefId === -1) {
							wdw_cardbook.refreshAccountsInDirTree();
							wdw_cardbook.sortCardsTreeCol();
							wdw_cardbook.updateStatusInformation();
							if (aMode === "REMOVE") {
								if (cardbookUtils.getSelectedCardsCount() === 0) {
									wdw_cardbook.clearCard();
								}
							} else if (cardbookRepository.cardbookDisplayCards[myCurrentAccountId].length !== 0) {
								if (cardbookUtils.getSelectedCardsCount() === 0) {
									cardbookUtils.setSelectedCards([aCard.uid]);
									wdw_cardbook.displayCard(aCard);
								}
							}
						// Work outside the prefId
						} else {
							wdw_cardbook.refreshAccountsInDirTree();
						}
					}
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.refreshWindow error : " + e, "Error");
			}
		},

		refreshAccountsInDirTree: function() {
			try {
				if (document.getElementById('accountsOrCatsTree')) {
					var myTree = document.getElementById('accountsOrCatsTree');
					cardbookDirTree.childData = cardbookRepository.cardbookAccountsCategories;
					cardbookDirTree.visibleData = cardbookRepository.cardbookAccounts;
					myTree.view = cardbookDirTree;
					if (cardbookRepository.cardbookAccounts.length != 0) {
						wdw_cardbook.sortAccounts();
					}
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.refreshAccountsInDirTree error : " + e, "Error");
			}
		},

		saveCard: function (aCard, aOldDirPrefId) {
			try {
				if (aCard != null && aCard !== undefined && aCard != "") {
					var aModifiedCard = aCard;
				} else {
					return;
				}
				if (cardbookUtils.validateCategories(aModifiedCard)) {
					cardbookUtils.setCalculatedFields(aModifiedCard);
					// Existing card
					if (aModifiedCard.uid != null && aModifiedCard.uid !== undefined && aModifiedCard.uid != "" && aOldDirPrefId == aModifiedCard.dirPrefId) {
						var cardbookPrefService = new cardbookPreferenceService(aModifiedCard.dirPrefId);
						var myCurrentDirPrefIdName = cardbookPrefService.getName();
						var myCurrentDirPrefIdType = cardbookPrefService.getType();
						var myCurrentDirPrefIdUrl = cardbookPrefService.getUrl();

						var myOldCard = cardbookRepository.cardbookCards[aOldDirPrefId+"::"+aModifiedCard.uid];
						if (myCurrentDirPrefIdType === "CACHE" || myCurrentDirPrefIdType === "DIRECTORY") {
							// if aCard and aModifiedCard have the same cached medias
							cardbookUtils.changeMediaFromFileToContent(aModifiedCard);
							wdw_cardbook.removeCardFromWindow(myOldCard, true);
							wdw_cardbook.addCardToWindow(aModifiedCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(aModifiedCard, myCurrentDirPrefIdType));
						} else if (myCurrentDirPrefIdType === "FILE") {
							// if aCard and aModifiedCard have the same cached medias
							cardbookUtils.changeMediaFromFileToContent(aModifiedCard);
							wdw_cardbook.removeCardFromWindow(myOldCard, true);
							wdw_cardbook.addCardToWindow(aModifiedCard, "WINDOW");
							cardbookSynchronization.writeCardsToFile(myCurrentDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[aModifiedCard.dirPrefId], true);
						} else {
							// if aCard and aModifiedCard have the same cached medias
							cardbookUtils.changeMediaFromFileToContent(aModifiedCard);
							if (!(cardbookUtils.searchTagCreated(aModifiedCard))) {
								cardbookUtils.addTagUpdated(aModifiedCard);
							}
							wdw_cardbook.removeCardFromWindow(myOldCard, true);
							wdw_cardbook.addCardToWindow(aModifiedCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(aModifiedCard, myCurrentDirPrefIdType));
						}
						cardbookUtils.formatStringForOutput("cardUpdatedOK", [myCurrentDirPrefIdName, aModifiedCard.fn]);
					// New card
					} else {
						if (aModifiedCard.dirPrefId == "") {
							var myTree = document.getElementById('accountsOrCatsTree');
							var myCurrentAccountId = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
							var myCurrentDirPrefId = cardbookUtils.getAccountId(myCurrentAccountId);
						} else {
							var myCurrentAccountId = aModifiedCard.dirPrefId;
							var myCurrentDirPrefId = aModifiedCard.dirPrefId;
						}
						var cardbookPrefService = new cardbookPreferenceService(myCurrentDirPrefId);
						var myCurrentDirPrefIdName = cardbookPrefService.getName();
						var myCurrentDirPrefIdType = cardbookPrefService.getType();
						var myCurrentDirPrefIdUrl = cardbookPrefService.getUrl();

						aModifiedCard.uid = cardbookUtils.getUUID();
						aModifiedCard.dirPrefId = myCurrentDirPrefId;
						var mySepPosition = myCurrentAccountId.indexOf("::",0);
						if (mySepPosition != -1) {
							var myCategory = myCurrentAccountId.substr(mySepPosition+2,myCurrentAccountId.length);
							aModifiedCard.categories.push(myCategory);
							cardbookUtils.validateCategories(aModifiedCard);
							aModifiedCard.categories = cardbookUtils.formatCategories(aModifiedCard.categories);
						}

						if (myCurrentDirPrefIdType === "CACHE" || myCurrentDirPrefIdType === "DIRECTORY") {
							wdw_cardbook.addCardToWindow(aModifiedCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(aModifiedCard, myCurrentDirPrefIdType));
						} else if (myCurrentDirPrefIdType === "FILE") {
							wdw_cardbook.addCardToWindow(aModifiedCard, "WINDOW");
							cardbookSynchronization.writeCardsToFile(myCurrentDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[aModifiedCard.dirPrefId], true);
						} else {
							cardbookUtils.addTagCreated(aModifiedCard);
							cardbookUtils.addEtag(aModifiedCard, "0");
							wdw_cardbook.addCardToWindow(aModifiedCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(aModifiedCard, myCurrentDirPrefIdType));
						}
						cardbookUtils.formatStringForOutput("cardCreatedOK", [myCurrentDirPrefIdName, aModifiedCard.fn]);
						wdw_cardbooklog.addActivity("cardCreatedOK", [myCurrentDirPrefIdName, aModifiedCard.fn], "addItem");
					}
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.saveCard error : " + e, "Error");
			}
		},

		cancelCard: function () {
			wdw_cardbook.selectCard();
		},

		createCard: function () {
			wdw_cardbook.setNoComplexSearchMode();
			wdw_cardbook.setNoSearchMode();
			var myTree = document.getElementById('cardsTree');
			myTree.view.selection.clearSelection();
			wdw_cardbook.clearCard();
			var myNewCard = new cardbookCardParser();
			var myTree = document.getElementById('accountsOrCatsTree');
			if (myTree.currentIndex != -1) {
				var myCurrentAccountId = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
				myNewCard.dirPrefId = cardbookUtils.getAccountId(myCurrentAccountId);
				var mySepPosition = myCurrentAccountId.indexOf("::",0);
				if (mySepPosition != -1) {
					var myCategory = myCurrentAccountId.substr(mySepPosition+2, myCurrentAccountId.length);
					myNewCard.categories.push(myCategory);
				}
			}
			cardbookUtils.openEditionWindow(myNewCard, "CreateCard");
		},

		editCard: function () {
			var listOfSelectedCard = cardbookUtils.getCardsFromCards();
			if (listOfSelectedCard.length == 1) {
				var myCard = cardbookUtils.getCardsFromCards()[0];
				var myOutCard = new cardbookCardParser();
				cardbookUtils.cloneCard(myCard, myOutCard);
				var cardbookPrefService = new cardbookPreferenceService(myCard.dirPrefId);
				if (cardbookPrefService.getReadOnly()) {
					cardbookUtils.openEditionWindow(myOutCard, "ViewCard");
				} else {
					cardbookUtils.openEditionWindow(myOutCard, "EditCard");
				}
			}
		},

		editCardFromCard: function (aCard) {
			if (aCard) {
				var myOutCard = new cardbookCardParser();
				cardbookUtils.cloneCard(aCard, myOutCard);
				var cardbookPrefService = new cardbookPreferenceService(aCard.dirPrefId);
				if (cardbookPrefService.getReadOnly()) {
					cardbookUtils.openEditionWindow(myOutCard, "ViewCard");
				} else {
					cardbookUtils.openEditionWindow(myOutCard, "EditCard");
				}
			}
		},

		editCardFromList: function () {
			var myCard = cardbookRepository.cardbookCards[document.getElementById('dirPrefIdTextBox').value+"::"+document.getElementById('uidTextBox').value];
			var myCardToDisplay = cardbookRepository.cardbookCards[wdw_cardbook.currentCardOfListId];
			wdw_cardbook.editCardFromCard(myCardToDisplay)
			cardbookTypes.loadStaticList(myCard);
		},

		mergeCards: function () {
			try {
				var listOfSelectedCard = [];
				listOfSelectedCard = cardbookUtils.getCardsFromCards();

				var myArgs = {cardsIn: listOfSelectedCard, cardsOut: [], hideCreate: false, action: ""};
				var myWindow = window.openDialog("chrome://cardbook/content/wdw_mergeCards.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.action == "CREATE") {
					wdw_cardbook.saveCard(myArgs.cardsOut[0], myArgs.cardsOut[0].dirPrefId);
				} else if (myArgs.action == "CREATEANDREPLACE") {
					wdw_cardbook.saveCard(myArgs.cardsOut[0], myArgs.cardsOut[0].dirPrefId);
					wdw_cardbook.deleteCards(myArgs.cardsIn);
				}
				wdw_cardbook.selectAccountOrCat();
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.mergeCards error : " + e, "Error");
			}
		},

		duplicateCards: function () {
			try {
				var listOfSelectedCard = [];
				listOfSelectedCard = cardbookUtils.getCardsFromCards();

				for (var i = 0; i < listOfSelectedCard.length; i++) {
					var myOutCard = new cardbookCardParser();
					cardbookUtils.cloneCard(listOfSelectedCard[i], myOutCard);
					myOutCard.uid = "";
					myOutCard.cardurl = "";
					wdw_cardbook.saveCard(myOutCard);
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.duplicateCards error : " + e, "Error");
			}
		},

		findDuplicatesFromAccountsOrCats: function () {
			try {
				var myTree = document.getElementById('accountsOrCatsTree');
				if (myTree.currentIndex != -1) {
					var myDirPrefId = cardbookUtils.getAccountId(myTree.view.getCellText(myTree.currentIndex, {id: "accountId"}));
					wdw_cardbook.findDuplicates(myDirPrefId);
				} else {
					return;
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.findDuplicatesFromAccountsOrCats error : " + e, "Error");
			}
		},

		findDuplicates: function (aDirPrefId) {
			try {
				var myArgs = {dirPrefId: aDirPrefId};
				var myWindow = window.openDialog("chrome://cardbook/content/findDuplicates/wdw_findDuplicates.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				wdw_cardbook.selectAccountOrCat();
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.findDuplicates error : " + e, "Error");
			}
		},

		deleteCardsAndValidate: function (aCardList, aMessage) {
			try {
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
				var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
				var strBundle = stringBundleService.createBundle("chrome://cardbook/locale/cardbook.properties");
				var confirmTitle = strBundle.GetStringFromName("confirmTitle");
				if (aCardList && aCardList.constructor === Array) {
					var cardsCount = aCardList.length;
					var myDirPrefId = aCardList[0].dirPrefId;
				} else {
					var cardsCount = cardbookUtils.getSelectedCardsCount();
					var myTree = document.getElementById('accountsOrCatsTree');
					var myDirPrefId = cardbookUtils.getAccountId(myTree.view.getCellText(myTree.currentIndex, {id: "accountId"}));
				}
				var myDirPrefName = cardbookUtils.getPrefNameFromPrefId(myDirPrefId);
				if (aMessage != null && aMessage !== undefined && aMessage != "") {
					var confirmMsg = aMessage;
				} else {
					if (cardsCount > 1) {
						var confirmMsg = strBundle.formatStringFromName("selectedCardsDeletionConfirmMessage", [cardsCount, myDirPrefName], 2);
					} else {
						var confirmMsg = strBundle.formatStringFromName("selectedCardDeletionConfirmMessage", [myDirPrefName], 1);
					}
				}
				if (prompts.confirm(window, confirmTitle, confirmMsg)) {
					wdw_cardbook.deleteCards(aCardList);
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.deleteCardsAndValidate error : " + e, "Error");
			}
		},

		deleteCards: function (aListOfCards) {
			try {
				if (aListOfCards != null && aListOfCards !== undefined && aListOfCards != "") {
					var listOfSelectedCard = aListOfCards;
				} else {
					var listOfSelectedCard = [];
					listOfSelectedCard = cardbookUtils.getCardsFromCards();
				}
				var listOfFileToRewrite = [];

				for (var i = 0; i < listOfSelectedCard.length; i++) {
					if (!cardbookUtils.isMyAccountReadOnly(listOfSelectedCard[i].dirPrefId)) {
						var cardbookPrefService = new cardbookPreferenceService(listOfSelectedCard[i].dirPrefId);
						var myDirPrefIdName = cardbookPrefService.getName();
						var myDirPrefIdType = cardbookPrefService.getType();
						if (myDirPrefIdType === "FILE") {
							cardbookRepository.removeCardFromRepository(listOfSelectedCard[i], false);
							listOfFileToRewrite.push(listOfSelectedCard[i].dirPrefId);
						} else if (myDirPrefIdType === "CACHE" || myDirPrefIdType === "DIRECTORY") {
							cardbookRepository.removeCardFromRepository(listOfSelectedCard[i], true);
						} else {
							if (cardbookUtils.searchTagCreated(listOfSelectedCard[i])) {
								cardbookRepository.removeCardFromRepository(listOfSelectedCard[i], true);
							} else {
								cardbookUtils.addTagDeleted(listOfSelectedCard[i]);
								cardbookRepository.addCardToCache(listOfSelectedCard[i], "WINDOW", cardbookUtils.getFileCacheNameFromCard(listOfSelectedCard[i]));
								cardbookRepository.removeCardFromRepository(listOfSelectedCard[i], false);
							}
						}
						cardbookUtils.formatStringForOutput("cardDeletedOK", [myDirPrefIdName, listOfSelectedCard[i].fn]);
						wdw_cardbooklog.addActivity("cardDeletedOK", [myDirPrefIdName, listOfSelectedCard[i].fn], "deleteMail");
					}
				}
				
				listOfFileToRewrite = cardbookRepository.arrayUnique(listOfFileToRewrite);
				for (var i = 0; i < listOfFileToRewrite.length; i++) {
					var cardbookPrefService = new cardbookPreferenceService(listOfFileToRewrite[i]);
					var myDirPrefIdUrl = cardbookPrefService.getUrl();
					cardbookSynchronization.writeCardsToFile(myDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[listOfFileToRewrite[i]], true);
				}
				wdw_cardbook.clearCard();
				wdw_cardbook.refreshAccountsInDirTree();
				wdw_cardbook.selectAccountOrCat();
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.deleteCards error : " + e, "Error");
			}
		},

		exportCardsFromAccountsOrCats: function (aMenu) {
			try {
				var listOfSelectedCard = [];
				listOfSelectedCard = cardbookUtils.getCardsFromAccountsOrCats();
				if (aMenu.id == "cardbookAccountMenuExportToFile" || aMenu.id == "exportCardsToFileFromAccountsOrCats") {
					if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
						var defaultFileName = cardbookRepository.cardbookSearchValue + ".vcf";
					} else {
						var myTree = document.getElementById('accountsOrCatsTree');
						var defaultFileName = myTree.view.getCellText(myTree.currentIndex, {id: "accountName"}) + ".vcf";
					}
					wdw_cardbook.exportCardsToFile(listOfSelectedCard, defaultFileName);
				} else if (aMenu.id == "cardbookAccountMenuExportToDir" || aMenu.id == "exportCardsToDirFromAccountsOrCats") {
					wdw_cardbook.exportCardsToDir(listOfSelectedCard);
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.exportCardsFromAccountsOrCats error : " + e, "Error");
			}
		},

		exportCardsFromCards: function (aMenu) {
			try {
				var listOfSelectedCard = [];
				listOfSelectedCard = cardbookUtils.getCardsFromCards();
				if (aMenu.id == "exportCardsToFileFromCards" || aMenu.id == "cardbookContactsMenuExportCardsToFile") {
					if (listOfSelectedCard.length == 1) {
						var myTree = document.getElementById('cardsTree');
						var defaultFileName = myTree.view.getCellText(myTree.currentIndex, {id: "fn"}) + ".vcf";
					} else {
						var defaultFileName = "export.vcf";
					}
					wdw_cardbook.exportCardsToFile(listOfSelectedCard, defaultFileName);
				} else if (aMenu.id == "exportCardsToDirFromCards" || aMenu.id == "cardbookContactsMenuExportCardsToDir") {
					wdw_cardbook.exportCardsToDir(listOfSelectedCard);
				}
					
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.exportCardsFromCards error : " + e, "Error");
			}
		},

		exportCardsToFile: function (aListOfSelectedCard, aDefaultFileName) {
			try {
				var myFile = cardbookUtils.callFilePicker("fileSaveTitle", "SAVE", "EXPORTFILE", aDefaultFileName);
				if (myFile != null && myFile !== undefined && myFile != "") {
					if (myFile.exists() == false){
						myFile.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );
					}
	
					if (cardbookUtils.isFileAlreadyOpen(myFile.path)) {
						cardbookUtils.formatStringForOutput("fileAlreadyOpen", [myFile.leafName]);
						return;
					}

					if (cardbookUtils.getExtension(myFile.path).toLowerCase() == "csv") {
						cardbookSynchronization.writeCardsToCSVFile(myFile.path, myFile.leafName, aListOfSelectedCard);
					} else {
						cardbookSynchronization.writeCardsToFile(myFile.path, aListOfSelectedCard, true);
						if (aListOfSelectedCard.length > 1) {
							cardbookUtils.formatStringForOutput("exportsOKIntoFile", [myFile.leafName]);
						} else {
							cardbookUtils.formatStringForOutput("exportOKIntoFile", [myFile.leafName]);
						}
					}
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.exportCardsToFile error : " + e, "Error");
			}
		},

		exportCardsToDir: function (aListOfSelectedCard) {
			try {
				var myDir = cardbookUtils.callDirPicker("dirSaveTitle");
				if (myDir != null && myDir !== undefined && myDir != "") {
					if (myDir.exists() == false){
						myDir.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, 0774 );
					}
	
					if (cardbookUtils.isDirectoryAlreadyOpen(myDir.path)) {
						cardbookUtils.formatStringForOutput("directoryAlreadyOpen", [myDir.leafName]);
						return;
					}
	
					cardbookSynchronization.writeCardsToDir(myDir.path, aListOfSelectedCard, true);

					if (aListOfSelectedCard.length > 1) {
						cardbookUtils.formatStringForOutput("exportsOKIntoDir", [myDir.leafName]);
					} else {
						cardbookUtils.formatStringForOutput("exportOKIntoDir", [myDir.leafName]);
					}
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.exportCardsToDir error : " + e, "Error");
			}
		},

		importCardsFromFile: function () {
			try {
				var myTree = document.getElementById('accountsOrCatsTree');
				var myTarget = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
				var myDirPrefId = cardbookUtils.getAccountId(myTarget);
				var cardbookPrefService = new cardbookPreferenceService(myDirPrefId);
				var myDirPrefIdUrl = cardbookPrefService.getUrl();
				var myDirPrefIdName = cardbookPrefService.getName();

				var myFile = cardbookUtils.callFilePicker("fileImportTitle", "OPEN", "EXPORTFILE");
				if (myFile != null && myFile !== undefined && myFile != "") {
					// search if file is already open
					if (myFile.path == myDirPrefIdUrl) {
						cardbookUtils.formatStringForOutput("importNotIntoSameFile");
						return;
					}
					cardbookSynchronization.initSync(myDirPrefId);
					cardbookRepository.cardbookFileRequest[myDirPrefId]++;
					if (cardbookUtils.getExtension(myFile.path).toLowerCase() == "csv") {
						cardbookSynchronization.loadCSVFile(myFile, myTarget, "WINDOW", wdw_cardbook.refreshWindow2);
					} else {
						cardbookSynchronization.loadFile(myFile, myTarget, "", "WINDOW", wdw_cardbook.refreshWindow2);
					}
					cardbookSynchronization.waitForImportFinished(myDirPrefId, myDirPrefIdName);
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.importCardsFromFile error : " + e, "Error");
			}
		},

		importCardsFromDir: function () {
			try {
				var myTree = document.getElementById('accountsOrCatsTree');
				var myTarget = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
				var myDirPrefId = cardbookUtils.getAccountId(myTarget);
				var cardbookPrefService = new cardbookPreferenceService(myDirPrefId);
				var myDirPrefIdUrl = cardbookPrefService.getUrl();
				var myDirPrefIdName = cardbookPrefService.getName();

				var myDir = cardbookUtils.callDirPicker("dirImportTitle");
				if (myDir != null && myDir !== undefined && myDir != "") {
					// search if dir is already open
					if (myDir.path == myDirPrefIdUrl) {
						cardbookUtils.formatStringForOutput("importNotIntoSameDir");
						return;
					}
					cardbookSynchronization.initSync(myDirPrefId);
					cardbookRepository.cardbookDirRequest[myDirPrefId]++;
					cardbookSynchronization.loadDir(myDir, myTarget, "", "WINDOW", wdw_cardbook.refreshWindow2);
					cardbookSynchronization.waitForImportFinished(myDirPrefId, myDirPrefIdName);
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.importCardsFromDir error : " + e, "Error");
			}
		},

		cutCardsFromAccountsOrCats: function () {
			try {
				var listOfSelectedCard = [];
				listOfSelectedCard = cardbookUtils.getCardsFromAccountsOrCats();
				wdw_cardbook.copyCards(listOfSelectedCard, "CUT");
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.cutCardsFromAccountsOrCats error : " + e, "Error");
			}
		},

		copyCardsFromAccountsOrCats: function () {
			try {
				var listOfSelectedCard = [];
				listOfSelectedCard = cardbookUtils.getCardsFromAccountsOrCats();
				wdw_cardbook.copyCards(listOfSelectedCard, "COPY");
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.copyCardsFromAccountsOrCats error : " + e, "Error");
			}
		},

		cutCardsFromCards: function () {
			try {
				var listOfSelectedCard = [];
				listOfSelectedCard = cardbookUtils.getCardsFromCards();
				wdw_cardbook.copyCards(listOfSelectedCard, "CUT");
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.cutCardsFromCards error : " + e, "Error");
			}
		},

		copyCardsFromCards: function () {
			try {
				var listOfSelectedCard = [];
				listOfSelectedCard = cardbookUtils.getCardsFromCards();
				wdw_cardbook.copyCards(listOfSelectedCard, "COPY");
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.copyCardsFromCards error : " + e, "Error");
			}
		},

		copyCards: function (aListOfSelectedCard, aMode) {
			try {
				var listOfSelectedUid = [];
				for (var i = 0; i < aListOfSelectedCard.length; i++) {
					listOfSelectedUid.push(aListOfSelectedCard[i].dirPrefId + "::" + aListOfSelectedCard[i].uid);
					var myDirPrefId = aListOfSelectedCard[i].dirPrefId;
				}
				let myText = listOfSelectedUid.join("@@@@@");
				if (myText != null && myText !== undefined && myText != "") {
					var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
					var strBundle = stringBundleService.createBundle("chrome://cardbook/locale/cardbook.properties");
					var cardsCount = listOfSelectedUid.length;
					if (cardsCount > 1) {
						var myMessage = strBundle.GetStringFromName("contactsCopied");
					} else {
						var myMessage = strBundle.GetStringFromName("contactCopied");
					}
					cardbookUtils.clipboardSet(myText, myMessage);
					if (aMode == "CUT") {
						var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
						var strBundle = document.getElementById("cardbook-strings");
						var myDirPrefName = cardbookUtils.getPrefNameFromPrefId(myDirPrefId);
						if (cardsCount > 1) {
							wdw_cardbook.cutAndPaste = strBundle.getFormattedString("movedCardsDeletionConfirmMessage", [cardsCount, myDirPrefName]);
						} else {
							wdw_cardbook.cutAndPaste = strBundle.getFormattedString("movedCardDeletionConfirmMessage", [myDirPrefName]);
						}
					} else {
						wdw_cardbook.cutAndPaste = "";
					}
				} else {
					wdw_cardbooklog.updateStatusProgressInformation("Nothing selected to be copied");
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.copyCards error : " + e, "Error");
			}
		},

		pasteCards: function () {
			try {
				let str = cardbookUtils.clipboardGet();
				if (str) {
					var myTree = document.getElementById('accountsOrCatsTree');
					var myTarget = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
					var myDirPrefId = cardbookUtils.getAccountId(myTarget);
					var cardbookPrefService = new cardbookPreferenceService(myDirPrefId);
					var myDirPrefIdType = cardbookPrefService.getType();
					var myDirPrefIdUrl = cardbookPrefService.getUrl();
					var myListOfCard = [];
					
					var dataArray = str.split("@@@@@");
					if (dataArray.length) {
						for (var i = 0; i < dataArray.length; i++) {
							if (cardbookRepository.cardbookCards[dataArray[i]]) {
								var myCard = cardbookRepository.cardbookCards[dataArray[i]];
								cardbookSynchronization.importCard(myCard, myTarget, false);
								myListOfCard.push(myCard);
							} else {
								cardbookUtils.formatStringForOutput("clipboardWrong");
							}
						}
						if (myDirPrefIdType === "FILE") {
							cardbookSynchronization.writeCardsToFile(myDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[myDirPrefId], true);
						}
						if (wdw_cardbook.cutAndPaste != "") {
							wdw_cardbook.deleteCardsAndValidate(myListOfCard, wdw_cardbook.cutAndPaste);
							wdw_cardbook.cutAndPaste = "";
						}
						wdw_cardbook.refreshAccountsInDirTree();
						wdw_cardbook.selectAccountOrCat();
					} else {
						cardbookUtils.formatStringForOutput("clipboardEmpty");
					}
				} else {
					cardbookUtils.formatStringForOutput("clipboardEmpty");
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.pasteCards error : " + e, "Error");
			}
		},

		chooseActionTreeForClick: function (aEvent) {
			wdw_cardbook.setCurrentTypeFromEvent(aEvent);
			// only left click
			if (aEvent.button == 0) {
				var myCursorPosition = wdw_cardbook.currentType + '_' + wdw_cardbook.currentIndex + '_valueBox';
				var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				if (wdw_cardbook.currentType == "email") {
					wdw_cardbook.emailCardFromTree("to");
				} else if (wdw_cardbook.currentType == "url") {
					wdw_cardbook.openURLFromTree();
				} else if (wdw_cardbook.currentType == "adr") {
					wdw_cardbook.localizeCardFromTree();
				} else if (wdw_cardbook.currentType == "impp") {
					wdw_cardbook.openIMPPFromTree();
				}
			}
			aEvent.stopPropagation();
		},
		
		chooseActionForKey: function (aEvent) {
			if (aEvent.ctrlKey && !aEvent.shiftKey) {
				switch(aEvent.key) {
					case "a":
					case "A":
						wdw_cardbook.selectAllKey();
						aEvent.stopPropagation();
						break;
					case "c":
					case "C":
						wdw_cardbook.copyKey();
						aEvent.stopPropagation();
						break;
					case "f":
					case "F":
					case "g":
					case "G":
						wdw_cardbook.findKey();
						aEvent.stopPropagation();
						break;
					case "k":
					case "K":
						wdw_cardbook.editComplexSearch();
						aEvent.stopPropagation();
						break;
					case "n":
					case "N":
						wdw_cardbook.newKey();
						aEvent.stopPropagation();
						break;
					case "v":
					case "V":
						wdw_cardbook.pasteKey();
						aEvent.stopPropagation();
						break;
					case "x":
					case "X":
						wdw_cardbook.cutKey();
						aEvent.stopPropagation();
						break;
				}
			} else if (aEvent.ctrlKey && aEvent.shiftKey) {
				switch(aEvent.key) {
					case "k":
					case "K":
						wdw_cardbook.findKey();
						aEvent.stopPropagation();
						break;
				}
			} else {
				if (aEvent.key == "Enter") {
					wdw_cardbook.returnKey();
					aEvent.stopPropagation();
				} else if (aEvent.key == "Delete") {
					wdw_cardbook.deleteKey();
					aEvent.stopPropagation();
				} else if (aEvent.key == "F8") {
					wdw_cardbook.F8Key();
					aEvent.stopPropagation();
				} else if (aEvent.key == "F9") {
					wdw_cardbook.F9Key();
					aEvent.stopPropagation();
				}
			}
		},
		
		emailCardFromTree: function (aAction) {
			var myCard = cardbookRepository.cardbookCards[document.getElementById('dirPrefIdTextBox').value+"::"+document.getElementById('uidTextBox').value];
			wdw_cardbook.emailCards(null, [document.getElementById('fnTextBox').value.replace(/,/g, " ").replace(/;/g, " "), myCard.email[wdw_cardbook.currentIndex][0][0]], aAction);
		},
		
		findEmailsFromTree: function () {
			var myCard = cardbookRepository.cardbookCards[document.getElementById('dirPrefIdTextBox').value+"::"+document.getElementById('uidTextBox').value];
			wdw_cardbook.findEmails(null, [myCard.email[wdw_cardbook.currentIndex][0]]);
		},

		localizeCardFromTree: function () {
			var myCard = cardbookRepository.cardbookCards[document.getElementById('dirPrefIdTextBox').value+"::"+document.getElementById('uidTextBox').value];
			wdw_cardbook.localizeCards(null, [myCard.adr[wdw_cardbook.currentIndex][0]]);
		},

		openURLFromTree: function () {
			var myCard = cardbookRepository.cardbookCards[document.getElementById('dirPrefIdTextBox').value+"::"+document.getElementById('uidTextBox').value];
			wdw_cardbook.openURLCards(null, [myCard.url[wdw_cardbook.currentIndex][0]]);
		},

		openIMPPFromTree: function () {
			var myCard = cardbookRepository.cardbookCards[document.getElementById('dirPrefIdTextBox').value+"::"+document.getElementById('uidTextBox').value];
			if (document.getElementById('impp_' + wdw_cardbook.currentIndex + '_valueBox').getAttribute('link') == "true") {
				cardbookUtils.openExternalURL([myCard.impp[wdw_cardbook.currentIndex][0]]);
			}
		},

		doubleClickCardsTree: function (aEvent) {
			if (cardbookRepository.cardbookSyncMode === "SYNC") {
				return;
			}
			if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
				var myTree = document.getElementById('cardsTree');
				var row = { }, col = { }, child = { };
				myTree.treeBoxObject.getCellAt(aEvent.clientX, aEvent.clientY, row, col, child);
				if (row.value != -1) {
					wdw_cardbook.chooseActionCardsTree();
				}
			} else {
				var myTree = document.getElementById('accountsOrCatsTree');
				if (myTree.currentIndex != -1) {
					var myTree = document.getElementById('cardsTree');
					var row = { }, col = { }, child = { };
					myTree.treeBoxObject.getCellAt(aEvent.clientX, aEvent.clientY, row, col, child);
					if (row.value != -1) {
						wdw_cardbook.chooseActionCardsTree();
					} else {
						var myTree = document.getElementById('accountsOrCatsTree');
						var myTarget = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
						var myDirPrefId = cardbookUtils.getAccountId(myTarget);
						var cardbookPrefService = new cardbookPreferenceService(myDirPrefId);
						if (!cardbookPrefService.getReadOnly() && cardbookPrefService.getEnabled()) {
							wdw_cardbook.createCard();
						}
					}
				}
			}
		},

		chooseActionCardsTree: function () {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var preferEmailEdition = prefs.getBoolPref("extensions.cardbook.preferEmailEdition");
			if (preferEmailEdition) {
				wdw_cardbook.editCard();
			} else {
				wdw_cardbook.emailCardsFromCards("to");
			}
		},

		emailCardsFromAccountsOrCats: function (aAction) {
			listOfSelectedCard = cardbookUtils.getCardsFromAccountsOrCats();
			wdw_cardbook.emailCards(listOfSelectedCard, null, aAction);
		},

		emailCardsFromCards: function (aAction) {
			listOfSelectedCard = cardbookUtils.getCardsFromCards();
			wdw_cardbook.emailCards(listOfSelectedCard, null, aAction);
		},

		openURLFromCards: function () {
			var listOfSelectedCard = [];
			listOfSelectedCard = cardbookUtils.getCardsFromCards();
			wdw_cardbook.openURLCards(listOfSelectedCard, null);
		},


		findEmailsFromCards: function () {
			var listOfSelectedCard = [];
			listOfSelectedCard = cardbookUtils.getCardsFromCards();
			wdw_cardbook.findEmails(listOfSelectedCard, null);
		},

		localizeCardsFromCards: function () {
			var listOfSelectedCard = [];
			listOfSelectedCard = cardbookUtils.getCardsFromCards();
			wdw_cardbook.localizeCards(listOfSelectedCard, null);
		},

		emailCards: function (aListOfSelectedCard, aListOfSelectedMails, aMsgField) {
			var listOfEmail = [];
			if (aListOfSelectedCard != null && aListOfSelectedCard !== undefined && aListOfSelectedCard != "") {
				listOfEmail = cardbookUtils.getMimeEmailsFromCardsAndLists(aListOfSelectedCard);
			} else if (aListOfSelectedMails != null && aListOfSelectedMails !== undefined && aListOfSelectedMails != "") {
				listOfEmail.push(MailServices.headerParser.makeMimeAddress(aListOfSelectedMails[0], aListOfSelectedMails[1]));
				cardbookMailPopularity.updateMailPopularity(aListOfSelectedMails[1]);
			}
			
			if (listOfEmail.length != 0) {
				var msgComposeType = Components.interfaces.nsIMsgCompType;
				var msgComposFormat = Components.interfaces.nsIMsgCompFormat;
				var msgComposeService = Components.classes["@mozilla.org/messengercompose;1"].getService();
				var params = Components.classes["@mozilla.org/messengercompose/composeparams;1"].createInstance(Components.interfaces.nsIMsgComposeParams);
				msgComposeService = msgComposeService.QueryInterface(Components.interfaces.nsIMsgComposeService);
				if (params) {
					params.type = msgComposeType.New;
					params.format = msgComposFormat.Default;
					var composeFields = Components.classes["@mozilla.org/messengercompose/composefields;1"].createInstance(Components.interfaces.nsIMsgCompFields);
					if (composeFields) {
						composeFields[aMsgField] = listOfEmail.join(" , ");
						params.composeFields = composeFields;
						msgComposeService.OpenComposeWindowWithParams(null, params);
					}
				}
			}
		},

		findEmails: function (aListOfSelectedCard, aListOfSelectedEmails) {
			var listOfEmail = [];
			if (aListOfSelectedCard != null && aListOfSelectedCard !== undefined && aListOfSelectedCard != "") {
				for (var i = 0; i < aListOfSelectedCard.length; i++) {
					if (!aListOfSelectedCard[i].isAList) {
						listOfEmail = listOfEmail.concat(aListOfSelectedCard[i].emails);
					} else {
						listOfEmail.push(aListOfSelectedCard[i].fn.replace('"', '\"'));
					}
				}
			} else if (aListOfSelectedEmails != null && aListOfSelectedEmails !== undefined && aListOfSelectedEmails != "") {
				listOfEmail = JSON.parse(JSON.stringify(aListOfSelectedEmails));
			}
			
			var tabmail = document.getElementById("tabmail");
			if (!tabmail) {
				// Try opening new tabs in an existing 3pane window
				let mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("mail:3pane");
				if (mail3PaneWindow) {
					tabmail = mail3PaneWindow.document.getElementById("tabmail");
					mail3PaneWindow.focus();
				}
			}
            tabmail.openTab("glodaFacet", {
            		searcher: new GlodaMsgSearcher(null, '"' + listOfEmail.join('" "') + '"', false)
            });
		},

		localizeCards: function (aListOfSelectedCard, aListOfSelectedAddresses) {
			var listOfAddresses = [];
			if (aListOfSelectedCard != null && aListOfSelectedCard !== undefined && aListOfSelectedCard != "") {
				listOfAddresses = cardbookUtils.getAddressesFromCards(aListOfSelectedCard);
			} else if (aListOfSelectedAddresses != null && aListOfSelectedAddresses !== undefined && aListOfSelectedAddresses != "") {
				listOfAddresses = JSON.parse(JSON.stringify(aListOfSelectedAddresses));
			}
			
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var localizeEngine = prefs.getComplexValue("extensions.cardbook.localizeEngine", Components.interfaces.nsISupportsString).data;
			var urlEngine = "";
			if (localizeEngine === "GoogleMaps") {
				urlEngine = "https://www.google.com/maps?q=";
			} else if (localizeEngine === "OpenStreetMap") {
				urlEngine = "https://www.openstreetmap.org/search?query=";
			} else if (localizeEngine === "BingMaps") {
				urlEngine = "https://www.bing.com/maps/?q=";
			} else {
				return;
			}

			for (var i = 0; i < listOfAddresses.length; i++) {
				var url = urlEngine + listOfAddresses[i][2].replace(/[\n\u0085\u2028\u2029]|\r\n?/g, "+").replace(/ /g, "+") + "+"
									+ listOfAddresses[i][3].replace(/[\n\u0085\u2028\u2029]|\r\n?/g, "+").replace(/ /g, "+") + "+"
									+ listOfAddresses[i][4].replace(/[\n\u0085\u2028\u2029]|\r\n?/g, "+").replace(/ /g, "+") + "+"
									+ listOfAddresses[i][5].replace(/[\n\u0085\u2028\u2029]|\r\n?/g, "+").replace(/ /g, "+") + "+"
									+ listOfAddresses[i][6].replace(/[\n\u0085\u2028\u2029]|\r\n?/g, "+").replace(/ /g, "+");
				cardbookUtils.openURL(url);
			}
		},

		openURLCards: function (aListOfSelectedCard, aListOfSelectedURLs) {
			var listOfURLs = [];
			if (aListOfSelectedCard != null && aListOfSelectedCard !== undefined && aListOfSelectedCard != "") {
				listOfURLs = cardbookUtils.getURLsFromCards(aListOfSelectedCard);
			} else if (aListOfSelectedURLs != null && aListOfSelectedURLs !== undefined && aListOfSelectedURLs != "") {
				listOfURLs = JSON.parse(JSON.stringify(aListOfSelectedURLs));
			}
			
			for (var i = 0; i < listOfURLs.length; i++) {
				var url = listOfURLs[i][0];
				cardbookUtils.openURL(url);
			}
		},

		cardsTreeContextShowing: function () {
			var target = document.popupNode;
			// If a column header was clicked, show the column picker.
			if (target.localName == "treecol") {
				let treecols = target.parentNode;
				let nodeList = document.getAnonymousNodes(treecols);
				let treeColPicker;
				for (let i = 0; i < nodeList.length; i++) {
					if (nodeList.item(i).localName == "treecolpicker") {
						treeColPicker = nodeList.item(i);
						break;
					}
				}
				let popup = document.getAnonymousElementByAttribute(treeColPicker, "anonid", "popup");
				treeColPicker.buildPopup(popup);
				popup.openPopup(target, "after_start", 0, 0, true);
				return false;
			}
			wdw_cardbook.cardsTreeContextShowingNext();
			return true;
		},

		sortTrees: function (aEvent) {
			if (aEvent.button != 0) {
				return;
			}
			var target = aEvent.originalTarget;
			if (target.localName == "treecol") {
				wdw_cardbook.sortCardsTreeCol(target);
			} else {
				wdw_cardbook.selectCard(aEvent);
			}
		},

		sortCardsTreeColFromCol: function (aEvent, aColumn) {
			if (aEvent.button == 0) {
				wdw_cardbook.sortCardsTreeCol(aColumn);
			}
		},

		sortCardsTreeCol: function (aColumn) {
			var myTree = document.getElementById('accountsOrCatsTree');
			if (wdw_cardbook.currentAccount == myTree.currentIndex + "::" + myTree.view.getCellText(myTree.currentIndex, myTree.columns.getNamedColumn("accountId"))) {
				var reselect = true;
			} else {
				var reselect = false;
			}
			var myTree = document.getElementById('cardsTree');
			var myFirstVisibleRow = myTree.boxObject.getFirstVisibleRow();

			// get selected cards
			if (reselect) {
				var listOfUid = [];
				listOfUid = cardbookUtils.getSelectedCards();
			}

			var columnName;
			var order = myTree.getAttribute("sortDirection") == "ascending" ? 1 : -1;
			
			// if the column is passed and it's already sorted by that column, reverse sort
			if (aColumn) {
				columnName = aColumn.id;
				if (myTree.getAttribute("sortResource") == columnName) {
					order *= -1;
				}
			} else {
				columnName = myTree.getAttribute("sortResource");
			}
			
			if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
				var mySelectedAccount = cardbookRepository.cardbookSearchValue;
			} else {
				var myTree = document.getElementById('accountsOrCatsTree');
				if (myTree.currentIndex != -1) {
					var mySelectedAccount = myTree.view.getCellText(myTree.currentIndex, myTree.columns.getNamedColumn("accountId"));
				} else {
					return;
				}
			}
			if (cardbookRepository.cardbookDisplayCards[mySelectedAccount]) {
				cardbookRepository.cardbookDisplayCards[mySelectedAccount].sort(function(a,b) {
					if (a[columnName].toUpperCase() > b[columnName].toUpperCase()) return 1 * order;
					if (a[columnName].toUpperCase() < b[columnName].toUpperCase()) return -1 * order;
					return 0;
				});
			} else {
				return;
			}

			//setting these will make the sort option persist
			var myTree = document.getElementById('cardsTree');
			myTree.setAttribute("sortDirection", order == 1 ? "ascending" : "descending");
			myTree.setAttribute("sortResource", columnName);
			
			wdw_cardbook.displayAccountOrCat(cardbookRepository.cardbookDisplayCards[mySelectedAccount]);
			
			//set the appropriate attributes to show to indicator
			var cols = myTree.getElementsByTagName("treecol");
			for (var i = 0; i < cols.length; i++) {
				cols[i].removeAttribute("sortDirection");
			}
			document.getElementById(columnName).setAttribute("sortDirection", order == 1 ? "ascending" : "descending");

			// select Cards back
			if (reselect) {
				cardbookUtils.setSelectedCards(listOfUid, myFirstVisibleRow);
			} else {
				var myTree = document.getElementById('accountsOrCatsTree');
				wdw_cardbook.currentAccount = myTree.currentIndex + "::" + myTree.view.getCellText(myTree.currentIndex, myTree.columns.getNamedColumn("accountId"));
			}
		},

		startDrag: function (aEvent, aTreeChildren) {
			try {
				var listOfUid = [];
				cardbookDirTree.dragMode = "dragMode";
				if (aTreeChildren.id == "cardsTreeChildren") {
					var myTree = document.getElementById('cardsTree');
					var numRanges = myTree.view.selection.getRangeCount();
					var start = new Object();
					var end = new Object();
					for (var i = 0; i < numRanges; i++) {
						myTree.view.selection.getRangeAt(i,start,end);
						for (var j = start.value; j <= end.value; j++){
							var myId = myTree.view.getCellText(j, {id: "dirPrefId"})+"::"+myTree.view.getCellText(j, {id: "uid"});
							listOfUid.push(myId);
						}
					}
				} else if (aTreeChildren.id == "accountsOrCatsTreeChildren") {
					var myTree = document.getElementById('accountsOrCatsTree');
					if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
						var myAccountPrefId = cardbookRepository.cardbookSearchValue;
					} else {
						var myAccountPrefId = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
					}
					for (var i = 0; i < cardbookRepository.cardbookDisplayCards[myAccountPrefId].length; i++) {
						var myId = cardbookRepository.cardbookDisplayCards[myAccountPrefId][i].dirPrefId+"::"+cardbookRepository.cardbookDisplayCards[myAccountPrefId][i].uid;
						listOfUid.push(myId);
					}
				}
				aEvent.dataTransfer.setData("text/plain", listOfUid.join("@@@@@"));
				// aEvent.dataTransfer.effectAllowed = "copy";
				// aEvent.dataTransfer.dropEffect = "copy";

				var myCanvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
				var myContext = myCanvas.getContext('2d');
				var myImage = new Image();
				var myIconMaxSize = 26;
				var myIconMaxNumber = 5;
				myCanvas.id = 'dragCanvas';
				myCanvas.height = myIconMaxSize;
				// need to know the canvas size before
				if (listOfUid.length >= myIconMaxNumber) {
					var myLength = myIconMaxNumber;
				} else {
					var myLength = listOfUid.length;
				}
				myCanvas.width = (myLength + 1) * myIconMaxSize;
				// concatenate images
				for (var i = 0; i < myLength; i++) {
					var myId = listOfUid[i];
					var myPhoto = cardbookRepository.cardbookCards[myId].photo.localURI;
					if (myPhoto != null && myPhoto !== undefined && myPhoto != "") {
						myImage.src = myPhoto;
					} else {
						myImage.src = "chrome://cardbook/skin/missing_photo_200_214.png";
					}
					myContext.drawImage(myImage, i*myIconMaxSize, 0, myIconMaxSize, myIconMaxSize);
				}
				if (listOfUid.length > myIconMaxNumber) {
					// Concatenate a triangle
					var path=new Path2D();
					path.moveTo(myIconMaxSize*myIconMaxNumber,0);
					path.lineTo(myIconMaxSize*(myIconMaxNumber+1),myIconMaxSize/2);
					path.lineTo(myIconMaxSize*myIconMaxNumber,myIconMaxSize);
					myContext.fill(path);
				}
				aEvent.dataTransfer.setDragImage(myCanvas, 0, 0);
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.startDrag error : " + e, "Error");
			}
		},

		dragCards: function (aEvent) {
			cardbookDirTree.dragMode = "";
			var myTree = document.getElementById('accountsOrCatsTree');
			var row = { }, col = { }, child = { };
			myTree.treeBoxObject.getCellAt(aEvent.clientX, aEvent.clientY, row, col, child);
			var myTarget = myTree.view.getCellText(row.value, {id: "accountId"});
			var myDirPrefId = cardbookUtils.getAccountId(myTarget);
			var cardbookPrefService = new cardbookPreferenceService(myDirPrefId);
			var myDirPrefIdType = cardbookPrefService.getType();
			var myDirPrefIdUrl = cardbookPrefService.getUrl();
			var myDirPrefIdEnabled = cardbookPrefService.getEnabled();
			var myDirPrefIdReadOnly = cardbookPrefService.getReadOnly();

			if (myDirPrefIdType !== "SEARCH") {
				if (myDirPrefIdEnabled) {
					if (!myDirPrefIdReadOnly) {
						aEvent.preventDefault();
						var dataArray = aEvent.dataTransfer.getData("text/plain").split("@@@@@");
						if (dataArray.length) {
							for (var i = 0; i < dataArray.length; i++) {
								if (cardbookRepository.cardbookCards[dataArray[i]]) {
									var myCard = cardbookRepository.cardbookCards[dataArray[i]];
									cardbookSynchronization.importCard(myCard, myTarget, false);
								} else {
									cardbookUtils.formatStringForOutput("draggableWrong");
								}
							}
							if (myDirPrefIdType === "FILE") {
								cardbookSynchronization.writeCardsToFile(myDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[myDirPrefId], true);
							}
							wdw_cardbook.refreshAccountsInDirTree();
							wdw_cardbook.selectAccountOrCat(myDirPrefId);
						} else {
							cardbookUtils.formatStringForOutput("draggableWrong");
						}
					} else {
						var myDirPrefIdName = cardbookPrefService.getName();
						cardbookUtils.formatStringForOutput("addressbookReadOnly", [myDirPrefIdName]);
					}
				} else {
					var myDirPrefIdName = cardbookPrefService.getName();
					cardbookUtils.formatStringForOutput("addressbookDisabled", [myDirPrefIdName]);
				}
			}
		},

		editComplexSearch: function () {
			wdw_cardbook.addAddressbook("search");
		},

		complexSearch: function (aDirPrefId) {
			wdw_cardbook.setComplexSearchMode();
			var myTree = document.getElementById('accountsOrCatsTree');
			myTree.view.selection.select(cardbookUtils.getPositionOfAccountId(aDirPrefId));
			cardbookComplexSearch.startComplexSearch(aDirPrefId);
		},

		search: function () {
			wdw_cardbook.setSearchMode();
			cardbookRepository.cardbookSearchValue = document.getElementById('cardbookSearchInput').value.replace(/[\s+\-+\.+\,+\;+]/g, "").toUpperCase();

			if (cardbookRepository.cardbookSearchValue != "") {
				cardbookRepository.cardbookDisplayCards[cardbookRepository.cardbookSearchValue] = [];
				var myTree = document.getElementById('accountsOrCatsTree');
				myTree.view.selection.clearSelection();
				wdw_cardbook.clearAccountOrCat();
				wdw_cardbook.clearCard();
				for (var i in cardbookRepository.cardbookCardSearch1) {
					if (i.indexOf(cardbookRepository.cardbookSearchValue) >= 0) {
						for (var j = 0; j < cardbookRepository.cardbookCardSearch1[i].length; j++) {
							cardbookRepository.cardbookDisplayCards[cardbookRepository.cardbookSearchValue].push(cardbookRepository.cardbookCardSearch1[i][j]);
						}
					}
				}
				wdw_cardbook.selectAccountOrCat();
			} else {
				wdw_cardbook.clearAccountOrCat();
				wdw_cardbook.clearCard();
			}
		},

		displayBirthdayList: function() {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			if (cardbookRepository.cardbookBirthdayPopup == 0) {
				cardbookRepository.cardbookBirthdayPopup++;
				var MyWindows = window.openDialog("chrome://cardbook/content/birthdays/wdw_birthdayList.xul", "", "chrome,centerscreen,modal,resizable");
				cardbookRepository.cardbookBirthdayPopup--;
			}
		},
	
		displaySyncList: function() {
			var MyWindows = window.openDialog("chrome://cardbook/content/birthdays/wdw_birthdaySync.xul", "", "chrome,centerscreen,modal,resizable");
		},

		setSyncControl: function () {
			var nIntervId = setInterval(wdw_cardbook.windowControlShowing, 1000);
		},

		setComplexSearchMode: function () {
			cardbookRepository.cardbookComplexSearchAB = "allAddressBooks";
			cardbookRepository.cardbookComplexMatchAll = true;
			cardbookRepository.cardbookComplexRules = [];
			wdw_cardbook.setNoSearchMode();
			cardbookRepository.cardbookComplexSearchMode = "SEARCH";
			var myTree = document.getElementById('accountsOrCatsTree');
			myTree.view.selection.clearSelection();
			wdw_cardbook.clearAccountOrCat();
			wdw_cardbook.clearCard();
		},

		setSearchMode: function () {
			wdw_cardbook.setNoComplexSearchMode();
			cardbookRepository.cardbookSearchMode = "SEARCH";
			wdw_cardbook.disableCardCreation();
		},

		setNoComplexSearchMode: function () {
			cardbookRepository.cardbookComplexSearchAB = "allAddressBooks";
			cardbookRepository.cardbookComplexMatchAll = true;
			cardbookRepository.cardbookComplexRules = [];
			cardbookRepository.cardbookComplexSearchMode = "NOSEARCH";
		},

		setNoSearchMode: function () {
			cardbookRepository.cardbookSearchMode = "NOSEARCH";
			cardbookRepository.cardbookSearchValue = "";
			if (document.getElementById('cardbookSearchInput')) {
				document.getElementById('cardbookSearchInput').value = "";
				var strBundle = document.getElementById("cardbook-strings");
				document.getElementById('cardbookSearchInput').placeholder = strBundle.getString("cardbookSearchInputDefault");
			}
		},

		openLogEdition: function () {
			if (document.getElementById('cardboookModeBroadcaster').getAttribute('mode') == 'cardbook') {
				var myWindow = window.openDialog("chrome://cardbook/content/wdw_logEdition.xul", "", "chrome,modal,resizable,centerscreen");
			}
		},

		openOptionsEdition: function () {
			var myWindow = window.openDialog("chrome://cardbook/content/wdw_cardbookConfiguration.xul", "", "chrome,modal,resizable,centerscreen");
		},

		addAddressbook: function (aAction, aSearchId) {
			if (cardbookRepository.cardbookSyncMode === "NOSYNC") {
				cardbookRepository.cardbookSyncMode = "SYNC";
				var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime);
				var myArgs = {action: aAction, searchId: aSearchId, rootWindow: window, serverCallback: wdw_cardbook.createAddressbook};
				var myWindow = window.openDialog("chrome://cardbook/content/addressbooksconfiguration/wdw_addressbooksAdd.xul", "",
												   // Workaround for Bug 1151440 - the HTML color picker won't work
												   // in linux when opened from modal dialog
												   (xulRuntime.OS == 'Linux') ? "chrome,resizable,centerscreen" : "modal,chrome,resizable,centerscreen"
												   , myArgs);
			}
		},
		
		createAddressbook: function (aFinishAction, aFinishParams) {
			for (var i = 0; i < aFinishParams.length; i++) {
				let cardbookPrefService = new cardbookPreferenceService(aFinishParams[i][8]);
				if (cardbookPrefService.getType() === "SEARCH") {
					cardbookRepository.removeAccountFromRepository(aFinishParams[i][8]);
				} else if (cardbookPrefService.getName() != "") {
					return;
				}
			}

			if (aFinishAction === "GOOGLE" || aFinishAction === "CARDDAV" || aFinishAction === "APPLE") {
				wdw_cardbook.setNoComplexSearchMode();
				wdw_cardbook.setNoSearchMode();
				cardbookSynchronization.nullifyMultipleOperations();
				for (var i = 0; i < aFinishParams.length; i++) {
					cardbookRepository.addAccountToRepository(aFinishParams[i][8], aFinishParams[i][3], aFinishAction, aFinishParams[i][2], aFinishParams[i][4], aFinishParams[i][5], true, true, aFinishParams[i][6], aFinishParams[i][7], true);
					wdw_cardbook.refreshWindow(aFinishParams[i][8], "", "ADD");
					wdw_cardbook.loadCssRules();
					cardbookSynchronization.initSync(aFinishParams[i][8]);
					cardbookSynchronization.syncAccount(aFinishParams[i][8]);
				}
			} else if (aFinishAction === "SEARCH") {
				cardbookRepository.cardbookSyncMode = "NOSYNC";
				wdw_cardbook.setNoComplexSearchMode();
				wdw_cardbook.setNoSearchMode();
				cardbookSynchronization.nullifyMultipleOperations();
				for (var i = 0; i < aFinishParams.length; i++) {
					var myFile = cardbookRepository.getRuleFile(aFinishParams[i][8]);
					if (myFile.exists()) {
						myFile.remove(true);
					}
					myFile.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );
					cardbookSynchronization.writeContentToFile(myFile.path, aFinishParams[i][0], "UTF8");
					cardbookRepository.addAccountToRepository(aFinishParams[i][8], aFinishParams[i][3], aFinishAction, myFile.path, aFinishParams[i][4], aFinishParams[i][5], aFinishParams[i][7], true, aFinishParams[i][6], false, true);
					wdw_cardbook.refreshWindow(aFinishParams[i][8], "", "ADD");
					wdw_cardbook.complexSearch(aFinishParams[i][8]);
				}
			} else if (aFinishAction === "STANDARD") {
				wdw_cardbook.setNoComplexSearchMode();
				wdw_cardbook.setNoSearchMode();
				cardbookSynchronization.nullifyMultipleOperations();
				for (var i = 0; i < aFinishParams.length; i++) {
					var myRootDirName = aFinishParams[i][2];
					var myDirName = cardbookUtils.getFreeFileName(myRootDirName, aFinishParams[i][3], aFinishParams[i][8], "");
					var myDir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
					myDir.initWithPath(myRootDirName);
					myDir.append(myDirName);
					// read and write permissions to owner and group, read-only for others.
					myDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0774);
					if (aFinishParams[i][9]) {
						cardbookRepository.addAccountToCollected(aFinishParams[i][8]);
					}
					cardbookRepository.addAccountToRepository(aFinishParams[i][8], aFinishParams[i][3], "DIRECTORY", myDir.path, aFinishParams[i][4], aFinishParams[i][5], true, true, aFinishParams[i][6], aFinishParams[i][7], true);
					wdw_cardbook.refreshWindow(aFinishParams[i][8], "", "ADD");
					wdw_cardbook.loadCssRules();
					cardbookSynchronization.initSync(aFinishParams[i][8]);
					cardbookRepository.cardbookDirRequest[aFinishParams[i][8]]++;
					var myMode = "WINDOW";
					wdw_migrate.importCards(aFinishParams[i][0], aFinishParams[i][8], aFinishParams[i][3], myMode);
					cardbookSynchronization.waitForDirFinished(aFinishParams[i][8], aFinishParams[i][3], myMode);
				}
			} else if (aFinishAction === "FILE") {
				wdw_cardbook.setNoComplexSearchMode();
				wdw_cardbook.setNoSearchMode();
				cardbookSynchronization.nullifyMultipleOperations();
				for (var i = 0; i < aFinishParams.length; i++) {
					cardbookRepository.addAccountToRepository(aFinishParams[i][8], aFinishParams[i][3], aFinishAction, aFinishParams[i][2], aFinishParams[i][4], aFinishParams[i][5], true, true, aFinishParams[i][6], aFinishParams[i][7], true);
					wdw_cardbook.refreshWindow(aFinishParams[i][8], "", "ADD");
					wdw_cardbook.loadCssRules();
					cardbookSynchronization.initSync(aFinishParams[i][8]);
					cardbookRepository.cardbookFileRequest[aFinishParams[i][8]]++;
					var myFile = aFinishParams[i][1];
					if (aFinishParams[i][0] === "CREATEFILE") {
						if (myFile.exists()) {
							myFile.remove(true);
						}
						myFile.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );
					}
					var myMode = "WINDOW";
					cardbookSynchronization.loadFile(myFile, "", aFinishParams[i][8], myMode);
					cardbookSynchronization.waitForDirFinished(aFinishParams[i][8], aFinishParams[i][3], myMode);
				}
			} else if (aFinishAction === "DIRECTORY") {
				wdw_cardbook.setNoComplexSearchMode();
				wdw_cardbook.setNoSearchMode();
				cardbookSynchronization.nullifyMultipleOperations();
				for (var i = 0; i < aFinishParams.length; i++) {
					var myDir = aFinishParams[i][1];
					if (aFinishParams[i][0] === "CREATEDIRECTORY") {
						if (myDir.exists()) {
							var aListOfFileName = [];
							aListOfFileName = cardbookSynchronization.getFilesFromDir(myDir.path);
							if (aListOfFileName.length > 0) {
								var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
								var strBundle = document.getElementById("cardbook-strings");
								var confirmTitle = strBundle.getString("confirmTitle");
								var confirmMsg = strBundle.getFormattedString("directoryDeletionConfirmMessage", [myDir.leafName]);
								if (prompts.confirm(window, confirmTitle, confirmMsg)) {
									myDir.remove(true);
									myDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0774);
								} else {
									cardbookSynchronization.nullifyMultipleOperations();
									cardbookRepository.cardbookSyncMode = "NOSYNC";
									return;
								}
							} else {
								myDir.remove(true);
								myDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0774);
							}
						} else {
							myDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0774);
						}
					}
					cardbookRepository.addAccountToRepository(aFinishParams[i][8], aFinishParams[i][3], aFinishAction, aFinishParams[i][2], aFinishParams[i][4], aFinishParams[i][5], true, true, aFinishParams[i][6], aFinishParams[i][7], true);
					wdw_cardbook.refreshWindow(aFinishParams[i][8], "", "ADD");
					wdw_cardbook.loadCssRules();
					cardbookSynchronization.initSync(aFinishParams[i][8]);
					cardbookRepository.cardbookDirRequest[aFinishParams[i][8]]++;
					var myMode = "WINDOW";
					cardbookSynchronization.loadDir(myDir, "", aFinishParams[i][8], myMode);
					cardbookSynchronization.waitForDirFinished(aFinishParams[i][8], aFinishParams[i][3], myMode);
				}
			} else {
				cardbookSynchronization.nullifyMultipleOperations();
				cardbookRepository.cardbookSyncMode = "NOSYNC";
			}
		},

		returnKey: function () {
			if (document.commandDispatcher.focusedElement.getAttribute('id') == "cardsTree") {
				wdw_cardbook.chooseActionCardsTree();
			} else if (document.commandDispatcher.focusedElement.getAttribute('id') == "accountsOrCatsTree") {
				var myTree = document.getElementById('accountsOrCatsTree');
				if (myTree.currentIndex != -1) {
					if (myTree.view.isContainer(myTree.currentIndex)) {
						wdw_cardbook.editAddressbook();
					} else {
						var myAccountId = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
						var mySepPosition = myAccountId.indexOf("::",0);
						var myDirPrefId = myAccountId.substr(0, mySepPosition);
						var myCategoryName = myAccountId.substr(mySepPosition+2, myAccountId.length);
						if (myCategoryName != cardbookRepository.cardbookUncategorizedCards) {
							wdw_cardbook.renameCategory(myDirPrefId, myCategoryName);
							wdw_cardbook.refreshAccountsInDirTree();
							wdw_cardbook.selectAccountOrCat();
						}
					}
				}
			}
		},

		newKey: function () {
			var myTree = document.getElementById('accountsOrCatsTree');
			if (myTree.currentIndex != -1) {
				var myTarget = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
				var myDirPrefId = cardbookUtils.getAccountId(myTarget);
				var cardbookPrefService = new cardbookPreferenceService(myDirPrefId);
				if (!cardbookPrefService.getReadOnly() && cardbookPrefService.getEnabled()) {
					wdw_cardbook.createCard();
				}
			}
		},

		deleteKey: function () {
			var myTree = document.getElementById('accountsOrCatsTree');
			if (myTree.currentIndex != -1) {
				var myAccountId = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
				if (document.commandDispatcher.focusedElement.getAttribute('id') == "cardsTree") {
					var myPrefId = cardbookUtils.getAccountId(myAccountId);
					if (cardbookUtils.isMyAccountEnabled(myPrefId)) {
						if (!cardbookUtils.isMyAccountReadOnly(myPrefId)) {
							wdw_cardbook.deleteCardsAndValidate();
						}
					}
				} else if (document.commandDispatcher.focusedElement.getAttribute('id') == "accountsOrCatsTree") {
					if (myTree.view.isContainer(myTree.currentIndex)) {
						wdw_cardbook.removeAddressbook();
					} else {
						var mySepPosition = myAccountId.indexOf("::",0);
						var myDirPrefId = myAccountId.substr(0, mySepPosition);
						var myCategoryName = myAccountId.substr(mySepPosition+2, myAccountId.length);
						if (myCategoryName != cardbookRepository.cardbookUncategorizedCards) {
							if (cardbookUtils.isMyAccountEnabled(myPrefId)) {
								if (!cardbookUtils.isMyAccountReadOnly(myPrefId)) {
									wdw_cardbook.removeCategory(myDirPrefId, myCategoryName);
									wdw_cardbook.refreshAccountsInDirTree();
									wdw_cardbook.selectAccountOrCat();
								}
							}
						}
					}
				}
			}
		},

		selectAllKey: function () {
			var myTree = document.getElementById('accountsOrCatsTree');
			if (myTree.currentIndex != -1) {
				var myCardsTree = document.getElementById('cardsTree');
				myCardsTree.view.selection.selectAll();
			}
		},

		F8Key: function () {
			ovl_cardbookLayout.changeResizePanes('viewABContact');
		},

		F9Key: function () {
			if (document.getElementById('cardbook-menupopup')) {
				document.getElementById('cardbook-menupopup').openPopup(document.getElementById('cardbook-menupopup'), "after_start", 0, 0, false, false);
			}
		},

		copyKey: function () {
			var myTree = document.getElementById('accountsOrCatsTree');
			if (myTree.currentIndex != -1) {
				if (document.commandDispatcher.focusedElement.getAttribute('id') == "cardsTree") {
					wdw_cardbook.copyCardsFromCards();
				} else if (document.commandDispatcher.focusedElement.getAttribute('id') == "accountsOrCatsTree") {
					wdw_cardbook.copyCardsFromAccountsOrCats();
				}
			}
		},

		pasteKey: function () {
			var myTree = document.getElementById('accountsOrCatsTree');
			if (myTree.currentIndex != -1) {
				wdw_cardbook.pasteCards();
			}
		},

		cutKey: function () {
			var myTree = document.getElementById('accountsOrCatsTree');
			if (myTree.currentIndex != -1) {
				if (document.commandDispatcher.focusedElement.getAttribute('id') == "cardsTree") {
					wdw_cardbook.cutCardsFromCards();
				} else if (document.commandDispatcher.focusedElement.getAttribute('id') == "accountsOrCatsTree") {
					wdw_cardbook.cutCardsFromAccountsOrCats();
				}
			}
		},

		findKey: function () {
			if (document.getElementById('cardbookSearchInput')) {
				document.getElementById('cardbookSearchInput').focus();
				wdw_cardbook.search();
			}
		},

		doubleClickAccountOrCat: function (aEvent) {
			if (cardbookRepository.cardbookSyncMode === "SYNC") {
				return;
			}
			var myTree = document.getElementById('accountsOrCatsTree');
			var row = { }, col = { }, child = { };
			myTree.treeBoxObject.getCellAt(aEvent.clientX, aEvent.clientY, row, col, child);
			var myTarget = myTree.view.getCellText(row.value, {id: "accountId"});
			if (myTarget == "false") {
				wdw_cardbook.addAddressbook();
			} else if (myTarget == cardbookUtils.getAccountId(myTarget)) {
				wdw_cardbook.editAddressbook();
			} else {
				wdw_cardbook.selectCategoryToAction('RENAME');
			}
		},

		editAddressbook: function () {
			var myTree = document.getElementById('accountsOrCatsTree');
			if (myTree.currentIndex != -1) {
				var myPrefId = cardbookUtils.getAccountId(myTree.view.getCellText(myTree.currentIndex, {id: "accountId"}));
				var cardbookPrefService = new cardbookPreferenceService(myPrefId);
				var myPrefIdType = cardbookPrefService.getType();
				if (myPrefIdType === "SEARCH") {
					wdw_cardbook.addAddressbook("search", myPrefId);
				} else {
					var myPrefIdName = cardbookPrefService.getName();
					var myPrefIdUrl = cardbookPrefService.getUrl();
					var myPrefIdUser = cardbookPrefService.getUser();
					var myPrefIdColor = cardbookPrefService.getColor();
					var myPrefIdVCard = cardbookPrefService.getVCard();
					var myPrefIdReadOnly = cardbookPrefService.getReadOnly();
					var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime);
					var myArgs = {serverEditionName: myPrefIdName, serverEditionType: myPrefIdType, serverEditionUrl: myPrefIdUrl, serverEditionUser: myPrefIdUser,
									serverEditionReadOnly: myPrefIdReadOnly, serverEditionColor: myPrefIdColor, serverEditionVCard: myPrefIdVCard,
									serverEditionId: myPrefId, serverCallback: wdw_cardbook.modifyAddressbook};
					var myWindow = window.openDialog("chrome://cardbook/content/wdw_serverEdition.xul", "",
													   // Workaround for Bug 1151440 - the HTML color picker won't work
													   // in linux when opened from modal dialog
													   (xulRuntime.OS == 'Linux') ? "chrome,resizable,centerscreen" : "modal,chrome,resizable,centerscreen"
													   , myArgs);
				}
			}
		},

		removeAddressbook: function () {
			try {
				if (cardbookRepository.cardbookAccounts.length != 0) {
					cardbookRepository.cardbookSyncMode = "SYNC";
					wdw_cardbook.removeAccountFromWindow();
					cardbookRepository.cardbookSyncMode = "NOSYNC";
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.removeAddressbook error : " + e, "Error");
			}
		},

		modifyAddressbook: function (aDirPrefId, aName, aColor, aVCard, aReadOnly) {
			var cardbookPrefService = new cardbookPreferenceService(aDirPrefId);
			cardbookPrefService.setName(aName);
			cardbookPrefService.setColor(aColor);
			cardbookPrefService.setVCard(aVCard);
			cardbookPrefService.setReadOnly(aReadOnly);
			wdw_cardbook.loadCssRules();
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][4] === aDirPrefId) {
					cardbookRepository.cardbookAccounts[i][0] = aName;
					cardbookRepository.cardbookAccounts[i][7] = aReadOnly;
					break;
				}
			}
			wdw_cardbook.refreshAccountsInDirTree();
		},

		enableOrDisableAddressbook: function (aDirPrefId, aValue) {
			if (!(aDirPrefId != null && aDirPrefId !== undefined && aDirPrefId != "")) {
				var myTree = document.getElementById('accountsOrCatsTree');
				if (myTree.currentIndex != -1) {
					aDirPrefId = cardbookUtils.getAccountId(myTree.view.getCellText(myTree.currentIndex, {id: "accountId"}));
					var cardbookPrefService = new cardbookPreferenceService(aDirPrefId);
					var aValue = !cardbookPrefService.getEnabled();
				} else {
					return;
				}
			}
			if (!aValue) {
				cardbookRepository.removeAccountFromCollected(aDirPrefId);
				cardbookRepository.removeAccountFromBirthday(aDirPrefId);
			}
			var cardbookPrefService = new cardbookPreferenceService(aDirPrefId);
			cardbookPrefService.setEnabled(aValue);
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][4] === aDirPrefId) {
					cardbookRepository.cardbookAccounts[i][5] = aValue;
					break;
				}
			}
			wdw_cardbook.loadCssRules();
			wdw_cardbook.refreshAccountsInDirTree();
			var myDirPrefIdName = cardbookPrefService.getName();
			if (aValue) {
				cardbookSynchronization.loadAccount(aDirPrefId, true, false, "WINDOW");
				cardbookUtils.formatStringForOutput("addressbookEnabled", [myDirPrefIdName]);
			} else {
				cardbookRepository.emptyAccountFromRepository(aDirPrefId);
				cardbookUtils.formatStringForOutput("addressbookDisabled", [myDirPrefIdName]);
			}
			wdw_cardbook.refreshAccountsInDirTree();
			wdw_cardbook.selectAccountOrCat(aDirPrefId);
			if (cardbookPrefService.getType() === "SEARCH") {
				wdw_cardbook.complexSearch(aDirPrefId);
			}
		},

		readOnlyOrReadWriteAddressbook: function () {
			cardbookRepository.cardbookSyncMode = "SYNC";
			var myTree = document.getElementById('accountsOrCatsTree');
			if (myTree.currentIndex != -1) {
				var myDirPrefId = cardbookUtils.getAccountId(myTree.view.getCellText(myTree.currentIndex, {id: "accountId"}));
				var cardbookPrefService = new cardbookPreferenceService(myDirPrefId);
				var myValue = !cardbookPrefService.getReadOnly();
			} else {
				return;
			}
			if (myValue) {
				cardbookRepository.removeAccountFromCollected(myDirPrefId);
			}
			cardbookPrefService.setReadOnly(myValue);
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][4] === myDirPrefId) {
					cardbookRepository.cardbookAccounts[i][7] = myValue;
					break;
				}
			}
			wdw_cardbook.loadCssRules();
			wdw_cardbook.refreshAccountsInDirTree();
			cardbookRepository.cardbookSyncMode = "NOSYNC";
		},

		expandOrContractAddressbook: function (aDirPrefId, aValue) {
			var cardbookPrefService = new cardbookPreferenceService(aDirPrefId);
			var myDirPrefIdType = cardbookPrefService.getType();
			cardbookPrefService.setExpanded(aValue);
		},

		loadCssRules: function () {
			for (var prop in document.styleSheets) {
				var styleSheet = document.styleSheets[prop];
				if (styleSheet.href == "chrome://cardbook/skin/cardbookTreeChildrens.css") {
					cardbookRepository.cardbookDynamicCssRules[styleSheet.href] = [];
					cardbookRepository.deleteCssAllRules(styleSheet);
					var createSearchRules = cardbookRepository.isthereSearchRulesToCreate();
					for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
						if (cardbookRepository.cardbookAccounts[i][1]) {
							var dirPrefId = cardbookRepository.cardbookAccounts[i][4];
							var cardbookPrefService = new cardbookPreferenceService(dirPrefId);
							var color = cardbookPrefService.getColor()
							cardbookRepository.createCssAccountRules(styleSheet, dirPrefId, color);
							if (createSearchRules && cardbookRepository.cardbookAccounts[i][5]) {
								cardbookRepository.createCssCardRules(styleSheet, dirPrefId, color);
							}
						}
					}
					cardbookRepository.reloadCss(styleSheet.href);
				}
			}
		},

		renameCategory: function (aDirPrefId, aCategoryName) {
			try {
				if (cardbookRepository.cardbookSyncMode == "NOSYNC") {
					cardbookRepository.cardbookSyncMode = "SYNC";
				} else {
					return;
				}
				var myArgs = {type: aCategoryName, context: "Cat", typeAction: ""};
				var myWindow = window.openDialog("chrome://cardbook/content/wdw_cardbookRenameField.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.typeAction == "SAVE" && myArgs.type != "" && myArgs.type != aCategoryName) {
					var myNewCategoryName = myArgs.type;
					var cardbookPrefService = new cardbookPreferenceService(aDirPrefId);
					var myDirPrefIdName = cardbookPrefService.getName();
					var myDirPrefIdType = cardbookPrefService.getType();
					var myDirPrefIdUrl = cardbookPrefService.getUrl();
					
					var myCards = cardbookRepository.cardbookDisplayCards[aDirPrefId+"::"+aCategoryName];
					for (var i = 0; i < myCards.length; i++) {
						var myCard = myCards[i];
						var myOutCard = new cardbookCardParser();
						cardbookUtils.cloneCard(myCard, myOutCard);
						if (myDirPrefIdType === "FILE") {
							// if aCard and aModifiedCard have the same cached medias
							cardbookUtils.changeMediaFromFileToContent(myCard);
							cardbookRepository.removeCardFromRepository(myCard, true);
							cardbookRepository.renameCategoryFromCards(myOutCard, aCategoryName, myNewCategoryName);
							cardbookUtils.setCalculatedFields(myOutCard);
							cardbookRepository.addCardToRepository(myOutCard, "WINDOW");
						} else if (myDirPrefIdType === "CACHE" || myDirPrefIdType === "DIRECTORY") {
							// if aCard and aModifiedCard have the same cached medias
							cardbookUtils.changeMediaFromFileToContent(myCard);
							cardbookRepository.removeCardFromRepository(myCard, true);
							cardbookRepository.renameCategoryFromCards(myOutCard, aCategoryName, myNewCategoryName);
							cardbookUtils.setCalculatedFields(myOutCard);
							cardbookRepository.addCardToRepository(myOutCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myOutCard, myDirPrefIdType));
						} else {
							// if aCard and aModifiedCard have the same cached medias
							cardbookUtils.changeMediaFromFileToContent(myCard);
							cardbookRepository.removeCardFromRepository(myCard, true);
							if (!(cardbookUtils.searchTagCreated(myOutCard))) {
								cardbookUtils.addTagUpdated(myOutCard);
							}
							cardbookRepository.renameCategoryFromCards(myOutCard, aCategoryName, myNewCategoryName);
							cardbookUtils.setCalculatedFields(myOutCard);
							cardbookRepository.addCardToRepository(myOutCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myOutCard, myDirPrefIdType));
						}
						cardbookUtils.formatStringForOutput("cardRemovedFromCategory", [myDirPrefIdName, myOutCard.fn, aCategoryName]);
					}
					
					cardbookRepository.removeCategoryFromCategories(aDirPrefId, aCategoryName);
					cardbookRepository.removeCategoryFromAccounts(aDirPrefId+"::"+aCategoryName);
					cardbookRepository.removeCategoryFromDisplay(aDirPrefId+"::"+aCategoryName);
					if (myDirPrefIdType === "FILE") {
						cardbookSynchronization.writeCardsToFile(myDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[aDirPrefId], true);
					}
					cardbookUtils.formatStringForOutput("categoryRenamedOK", [myDirPrefIdName, aCategoryName]);
				}
				cardbookRepository.cardbookSyncMode = "NOSYNC";
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.renameCategory error : " + e, "Error");
			}
		},

		removeCategory: function (aDirPrefId, aCategoryName) {
			try {
				if (cardbookRepository.cardbookSyncMode == "NOSYNC") {
					cardbookRepository.cardbookSyncMode = "SYNC";
				} else {
					return;
				}
				var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
				var strBundle = stringBundleService.createBundle("chrome://cardbook/locale/cardbook.properties");
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
				var confirmTitle = strBundle.GetStringFromName("confirmTitle");
				if (cardbookRepository.cardbookDisplayCards[aDirPrefId+"::"+aCategoryName].length > 1) {
					var confirmMsg = strBundle.formatStringFromName("catDeletionsConfirmMessage", [aCategoryName, cardbookRepository.cardbookDisplayCards[aDirPrefId+"::"+aCategoryName].length], 2);
				} else {
					var confirmMsg = strBundle.formatStringFromName("catDeletionConfirmMessage", [aCategoryName], 1);
				}

				if (prompts.confirm(window, confirmTitle, confirmMsg)) {
					var cardbookPrefService = new cardbookPreferenceService(aDirPrefId);
					var myDirPrefIdName = cardbookPrefService.getName();
					var myDirPrefIdType = cardbookPrefService.getType();
					var myDirPrefIdUrl = cardbookPrefService.getUrl();
					
					var myCards = cardbookRepository.cardbookDisplayCards[aDirPrefId+"::"+aCategoryName];
					for (var i = 0; i < myCards.length; i++) {
						var myCard = myCards[i];
						var myOutCard = new cardbookCardParser();
						cardbookUtils.cloneCard(myCard, myOutCard);
						if (myDirPrefIdType === "FILE") {
							// if aCard and aModifiedCard have the same cached medias
							cardbookUtils.changeMediaFromFileToContent(myCard);
							cardbookRepository.removeCardFromRepository(myCard, true);
							cardbookRepository.removeCategoryFromCards(myOutCard, aCategoryName);
							cardbookUtils.setCalculatedFields(myOutCard);
							cardbookRepository.addCardToRepository(myOutCard, "WINDOW");
						} else if (myDirPrefIdType === "CACHE" || myDirPrefIdType === "DIRECTORY") {
							// if aCard and aModifiedCard have the same cached medias
							cardbookUtils.changeMediaFromFileToContent(myCard);
							cardbookRepository.removeCardFromRepository(myCard, true);
							cardbookRepository.removeCategoryFromCards(myOutCard, aCategoryName);
							cardbookUtils.setCalculatedFields(myOutCard);
							cardbookRepository.addCardToRepository(myOutCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myOutCard, myDirPrefIdType));
						} else {
							// if aCard and aModifiedCard have the same cached medias
							cardbookUtils.changeMediaFromFileToContent(myCard);
							cardbookRepository.removeCardFromRepository(myCard, true);
							if (!(cardbookUtils.searchTagCreated(myOutCard))) {
								cardbookUtils.addTagUpdated(myOutCard);
							}
							cardbookRepository.removeCategoryFromCards(myOutCard, aCategoryName);
							cardbookUtils.setCalculatedFields(myOutCard);
							cardbookRepository.addCardToRepository(myOutCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myOutCard, myDirPrefIdType));
						}
						cardbookUtils.formatStringForOutput("cardRemovedFromCategory", [myDirPrefIdName, myOutCard.fn, aCategoryName]);
					}
					
					cardbookRepository.removeCategoryFromCategories(aDirPrefId, aCategoryName);
					cardbookRepository.removeCategoryFromAccounts(aDirPrefId+"::"+aCategoryName);
					cardbookRepository.removeCategoryFromDisplay(aDirPrefId+"::"+aCategoryName);
					if (myDirPrefIdType === "FILE") {
						cardbookSynchronization.writeCardsToFile(myDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[aDirPrefId], true);
					}
					cardbookUtils.formatStringForOutput("categoryDeletedOK", [myDirPrefIdName, aCategoryName]);
					wdw_cardbooklog.addActivity("categoryDeletedOK", [myDirPrefIdName, aCategoryName], "deleteMail");
				}
				cardbookRepository.cardbookSyncMode = "NOSYNC";
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.removeCategory error : " + e, "Error");
			}
		},

		selectCategoryToAction: function (aAction) {
			try {
				var myTree = document.getElementById('accountsOrCatsTree');
				if (myTree.view.isContainer(myTree.currentIndex)) {
					return;
				} else {
					var myCategory = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
					var mySepPosition = myCategory.indexOf("::",0);
					if (mySepPosition != -1) {
						var myDirPrefId = myCategory.substr(0, mySepPosition);
						var myCategoryName = myCategory.substr(mySepPosition+2, myCategory.length);
						if (myCategoryName != cardbookRepository.cardbookUncategorizedCards) {
							if (aAction === "REMOVE") {
								wdw_cardbook.removeCategory(myDirPrefId, myCategoryName);
							} else if (aAction === "RENAME") {
								wdw_cardbook.renameCategory(myDirPrefId, myCategoryName);
							}
							wdw_cardbook.refreshAccountsInDirTree();
							wdw_cardbook.selectAccountOrCat();
						}
					}
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.selectCategoryToAction error : " + e, "Error");
			}
		},

		convertListToCategory: function () {
			try {
				cardbookRepository.cardbookSyncMode = "SYNC";
				var myDirPrefId = document.getElementById('dirPrefIdTextBox').value;
				var cardbookPrefService = new cardbookPreferenceService(myDirPrefId);
				var myCard = cardbookRepository.cardbookCards[myDirPrefId+"::"+document.getElementById('uidTextBox').value];
				if (!myCard.isAList || cardbookPrefService.getReadOnly()) {
					cardbookRepository.cardbookSyncMode = "NOSYNC";
					return;
				} else {
					var myDirPrefIdName = cardbookPrefService.getName();
					var myDirPrefIdType = cardbookPrefService.getType();
					var myDirPrefIdUrl = cardbookPrefService.getUrl();
					var myCategoryName = myCard.fn;
					if (myCard.version == "4.0") {
						for (var k = 0; k < myCard.member.length; k++) {
							var uid = myCard.member[k].replace("urn:uuid:", "");
							if (cardbookRepository.cardbookCards[myCard.dirPrefId+"::"+uid]) {
								var myTargetCard = cardbookRepository.cardbookCards[myCard.dirPrefId+"::"+uid];
								if (myDirPrefIdType === "FILE") {
									// if aCard and aModifiedCard have the same cached medias
									cardbookUtils.changeMediaFromFileToContent(myTargetCard);
									cardbookRepository.removeCardFromRepository(myTargetCard, true);
									myTargetCard.categories.push(myCategoryName);
									cardbookUtils.setCalculatedFields(myTargetCard);
									cardbookRepository.addCardToRepository(myTargetCard, "WINDOW");
								} else if (myDirPrefIdType === "CACHE" || myDirPrefIdType === "DIRECTORY") {
									// if aCard and aModifiedCard have the same cached medias
									cardbookUtils.changeMediaFromFileToContent(myTargetCard);
									cardbookRepository.removeCardFromRepository(myTargetCard, true);
									myTargetCard.categories.push(myCategoryName);
									cardbookUtils.setCalculatedFields(myTargetCard);
									cardbookRepository.addCardToRepository(myTargetCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myTargetCard, myDirPrefIdType));
								} else {
									// if aCard and aModifiedCard have the same cached medias
									cardbookUtils.changeMediaFromFileToContent(myTargetCard);
									if (!(cardbookUtils.searchTagCreated(myTargetCard))) {
										cardbookUtils.addTagUpdated(myTargetCard);
									}
									cardbookRepository.removeCardFromRepository(myTargetCard, true);
									myTargetCard.categories.push(myCategoryName);
									cardbookUtils.setCalculatedFields(myTargetCard);
									cardbookRepository.addCardToRepository(myTargetCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myTargetCard, myDirPrefIdType));
								}
								cardbookUtils.formatStringForOutput("cardAddedToCategory", [myDirPrefIdName, myTargetCard.fn, myCategoryName]);
							}
						}
					} else if (myCard.version == "3.0") {
						var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
						var memberCustom = prefs.getComplexValue("extensions.cardbook.memberCustom", Components.interfaces.nsISupportsString).data;
						for (var k = 0; k < myCard.others.length; k++) {
							var localDelim1 = myCard.others[k].indexOf(":",0);
							if (localDelim1 >= 0) {
								var header = myCard.others[k].substr(0,localDelim1);
								var trailer = myCard.others[k].substr(localDelim1+1,myCard.others[k].length);
								if (header == memberCustom) {
									if (cardbookRepository.cardbookCards[myCard.dirPrefId+"::"+trailer.replace("urn:uuid:", "")]) {
										var myTargetCard = cardbookRepository.cardbookCards[myCard.dirPrefId+"::"+trailer.replace("urn:uuid:", "")];
										if (myDirPrefIdType === "FILE") {
											// if aCard and aModifiedCard have the same cached medias
											cardbookUtils.changeMediaFromFileToContent(myTargetCard);
											cardbookRepository.removeCardFromRepository(myTargetCard, true);
											myTargetCard.categories.push(myCategoryName);
											cardbookUtils.setCalculatedFields(myTargetCard);
											cardbookRepository.addCardToRepository(myTargetCard, "WINDOW");
										} else if (myDirPrefIdType === "CACHE" || myDirPrefIdType === "DIRECTORY") {
											// if aCard and aModifiedCard have the same cached medias
											cardbookUtils.changeMediaFromFileToContent(myTargetCard);
											cardbookRepository.removeCardFromRepository(myTargetCard, true);
											myTargetCard.categories.push(myCategoryName);
											cardbookUtils.setCalculatedFields(myTargetCard);
											cardbookRepository.addCardToRepository(myTargetCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myTargetCard, myDirPrefIdType));
										} else {
											// if aCard and aModifiedCard have the same cached medias
											cardbookUtils.changeMediaFromFileToContent(myTargetCard);
											if (!(cardbookUtils.searchTagCreated(myTargetCard))) {
												cardbookUtils.addTagUpdated(myTargetCard);
											}
											cardbookRepository.removeCardFromRepository(myTargetCard, true);
											myTargetCard.categories.push(myCategoryName);
											cardbookUtils.setCalculatedFields(myTargetCard);
											cardbookRepository.addCardToRepository(myTargetCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myTargetCard, myDirPrefIdType));
										}
										cardbookUtils.formatStringForOutput("cardAddedToCategory", [myDirPrefIdName, myTargetCard.fn, myCategoryName]);
									}
								}
							}
						}
					}
					if (myDirPrefIdType === "FILE") {
						cardbookSynchronization.writeCardsToFile(myDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[myDirPrefId], true);
					}
					wdw_cardbook.deleteCards([myCard]);
					wdw_cardbook.refreshAccountsInDirTree();
					wdw_cardbook.selectAccountOrCat();
					cardbookRepository.cardbookSyncMode = "NOSYNC";
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_cardbook.convertListToCategory error : " + e, "Error");
			}
		},

		copyCardTree: function () {
			var myCard = cardbookRepository.cardbookCards[document.getElementById('dirPrefIdTextBox').value+"::"+document.getElementById('uidTextBox').value];
			var myResult = myCard[wdw_cardbook.currentType][wdw_cardbook.currentIndex][0].join(" ");
			if (wdw_cardbook.currentType == "adr") {
				myResult = document.getElementById('fnTextBox').value + "\n" + myResult;
			}
			var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
			var strBundle = stringBundleService.createBundle("chrome://cardbook/locale/cardbook.properties");
			var myMessage = strBundle.GetStringFromName("lineCopied");
			cardbookUtils.clipboardSet(myResult, myMessage);
		},

		setCurrentTypeFromEvent: function (aEvent) {
			var myElement = document.elementFromPoint(aEvent.clientX, aEvent.clientY);
			var myTempArray = myElement.id.split('_');
			wdw_cardbook.currentType = myTempArray[0];
			wdw_cardbook.currentIndex = myTempArray[1];
		},

		setCurrentListFromEvent: function (aEvent) {
			var myElement = document.elementFromPoint(aEvent.clientX, aEvent.clientY);
			var myTempArray = myElement.id.split('_');
			wdw_cardbook.currentCardOfListId = myTempArray[0];
		},

		cardListContextShowing: function (aEvent) {
			wdw_cardbook.setCurrentListFromEvent(aEvent);
		},

		enableOrDisableElement: function (aArray, aValue) {
			for (var i = 0; i < aArray.length; i++) {
				if (document.getElementById(aArray[i])) {
					document.getElementById(aArray[i]).disabled=aValue;
				}
			}
		},

		setElementLabelWithBundle: function (aElementId, aValue) {
			var strBundle = document.getElementById("cardbook-strings");
			wdw_cardbook.setElementLabel(aElementId, strBundle.getString(aValue));
		},

		setElementLabel: function (aElementId, aValue) {
			if (document.getElementById(aElementId)) {
				document.getElementById(aElementId).label=aValue;
			}
		},

		cardbookAccountMenuContextShowing: function () {
			var myTree = document.getElementById('accountsOrCatsTree');
			if (myTree.currentIndex != -1) {
				var myPrefId = cardbookUtils.getAccountId(myTree.view.getCellText(myTree.currentIndex, {id: "accountId"}));
				var cardbookPrefService = new cardbookPreferenceService(myPrefId);
				wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuEditServer', 'cardbookAccountMenuCloseServer', 'cardbookAccountMenuEnableOrDisableAddressbook', 'cardbookAccountMenuReadOnlyOrReadWriteAddressbook'], false);
				if (cardbookPrefService.getEnabled()) {
					if (cardbookPrefService.getType() === "FILE" || cardbookPrefService.getType() === "CACHE" || cardbookPrefService.getType() === "DIRECTORY") {
						wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuSync'], true);
					} else {
						wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuSync'], false);
					}
					wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuEnableOrDisableAddressbook', "disableFromAccountsOrCats");
				} else {
					wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuSync'], true);
					wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuEnableOrDisableAddressbook', "enableFromAccountsOrCats");
				}
				if (cardbookPrefService.getReadOnly()) {
					wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuReadOnlyOrReadWriteAddressbook', "readWriteFromAccountsOrCats");
				} else {
					wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuReadOnlyOrReadWriteAddressbook', "readOnlyFromAccountsOrCats");
				}

				if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
					wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuImportFromFile', 'cardbookAccountMenuImportFromDir'], true);
					if (document.getElementById('cardsTree').view.rowCount == 0) {
						wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToFile', "exportCardToFileLabel");
						wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToDir', "exportCardToDirLabel");
						wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuExportToFile', 'cardbookAccountMenuExportToDir'], true);
					} else if (document.getElementById('cardsTree').view.rowCount == 1) {
						wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToFile', "exportCardToFileLabel");
						wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToDir', "exportCardToDirLabel");
						wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuExportToFile', 'cardbookAccountMenuExportToDir'], false);
					} else {
						wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToFile', "exportCardsToFileLabel");
						wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToDir', "exportCardsToDirLabel");
						wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuExportToFile', 'cardbookAccountMenuExportToDir'], false);
					}
				} else if (cardbookUtils.isMyAccountEnabled(myPrefId)) {
					if (cardbookUtils.isMyAccountReadOnly(myPrefId)) {
						wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuImportFromFile', 'cardbookAccountMenuImportFromDir'], true);
					} else {
						wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuImportFromFile', 'cardbookAccountMenuImportFromDir'], false);
					}
					if (document.getElementById('cardsTree').view.rowCount == 0) {
						wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToFile', "exportCardToFileLabel");
						wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToDir', "exportCardToDirLabel");
						wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuExportToFile', 'cardbookAccountMenuExportToDir'], true);
					} else if (document.getElementById('cardsTree').view.rowCount == 1) {
						wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToFile', "exportCardToFileLabel");
						wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToDir', "exportCardToDirLabel");
						wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuExportToFile', 'cardbookAccountMenuExportToDir'], false);
					} else {
						wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToFile', "exportCardsToFileLabel");
						wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToDir', "exportCardsToDirLabel");
						wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuExportToFile', 'cardbookAccountMenuExportToDir'], false);
					}
				} else {
					wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToFile', "exportCardToFileLabel");
					wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToDir', "exportCardToDirLabel");
					wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuExportToFile', 'cardbookAccountMenuImportFromFile', 'cardbookAccountMenuExportToDir', 'cardbookAccountMenuImportFromDir'], true);
				}
				if (cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
					wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuEditServer', 'cardbookAccountMenuCloseServer', 'cardbookAccountMenuEnableOrDisableAddressbook', 
														'cardbookAccountMenuExportToFile', 'cardbookAccountMenuExportToDir', ''], false);
					wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuReadOnlyOrReadWriteAddressbook', 'cardbookAccountMenuSync', 'cardbookAccountMenuImportFromFile', 'cardbookAccountMenuImportFromDir'], true);
				}
			} else {
				wdw_cardbook.enableOrDisableElement(['cardbookAccountMenuEditServer', 'cardbookAccountMenuCloseServer', 'cardbookAccountMenuEnableOrDisableAddressbook', 
													'cardbookAccountMenuReadOnlyOrReadWriteAddressbook', 'cardbookAccountMenuSync', 'cardbookAccountMenuExportToFile', 'cardbookAccountMenuImportFromFile',
													'cardbookAccountMenuExportToDir', 'cardbookAccountMenuImportFromDir'], true);
				wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuEnableOrDisableAddressbook', "disableFromAccountsOrCats");
				wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuReadOnlyOrReadWriteAddressbook', "readWriteFromAccountsOrCats");
				wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToFile', "exportCardToFileLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookAccountMenuExportToDir', "exportCardToDirLabel");
			}
		},
	
		cardbookContactsMenuContextShowing: function () {
			cardbookUtils.addToIMPPMenuSubMenu('cardbookContactsMenuIMPPCardsMenuPopup');
			var myTree = document.getElementById('accountsOrCatsTree');
			if (cardbookUtils.getSelectedCardsCount() == 0) {
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuToEmailCards', "toEmailCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuCcEmailCards', "ccEmailCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuBccEmailCards', "bccEmailCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuFindEmails', "findEmailsCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuLocalizeCards', "localizeCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuOpenURL', "openURLCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuCutCards', "cutCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuCopyCards', "copyCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuPasteCards', "pasteCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuExportCardsToFile', "exportCardToFileLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuExportCardsToDir', "exportCardToDirLabel");
				wdw_cardbook.enableOrDisableElement(['cardbookContactsMenuToEmailCards', 'cardbookContactsMenuCcEmailCards', 'cardbookContactsMenuBccEmailCards', 'cardbookContactsMenuFindEmails', 'cardbookContactsMenuLocalizeCards',
													'cardbookContactsMenuOpenURL', 'cardbookContactsMenuCutCards', 'cardbookContactsMenuCopyCards', 'cardbookContactsMenuPasteCards', 'cardbookContactsMenuExportCardsToFile',
													'cardbookContactsMenuExportCardsToDir', 'cardbookContactsMenuMergeCards', 'cardbookContactsMenuDuplicateCards'], true);
			} else if (cardbookUtils.getSelectedCardsCount() == 1) {
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuToEmailCards', "toEmailCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuCcEmailCards', "ccEmailCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuBccEmailCards', "bccEmailCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuFindEmails', "findEmailsCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuLocalizeCards', "localizeCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuOpenURL', "openURLCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuCutCards', "cutCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuCopyCards', "copyCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuPasteCards', "pasteCardFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuExportCardsToFile', "exportCardToFileLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuExportCardsToDir', "exportCardToDirLabel");
				wdw_cardbook.enableOrDisableElement(['cardbookContactsMenuToEmailCards', 'cardbookContactsMenuCcEmailCards', 'cardbookContactsMenuBccEmailCards', 'cardbookContactsMenuFindEmails', 'cardbookContactsMenuLocalizeCards',
													'cardbookContactsMenuOpenURL', 'cardbookContactsMenuCutCards', 'cardbookContactsMenuCopyCards', 'cardbookContactsMenuPasteCards', 'cardbookContactsMenuExportCardsToFile',
													'cardbookContactsMenuExportCardsToDir', 'cardbookContactsMenuDuplicateCards'], false);
				wdw_cardbook.enableOrDisableElement(['cardbookContactsMenuMergeCards'], true);
			} else {
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuToEmailCards', "toEmailCardsFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuCcEmailCards', "ccEmailCardsFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuBccEmailCards', "bccEmailCardsFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuFindEmails', "findEmailsCardsFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuLocalizeCards', "localizeCardsFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuOpenURL', "openURLCardsFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuCutCards', "cutCardsFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuCopyCards', "copyCardsFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuPasteCards', "pasteCardsFromCardsLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuExportCardsToFile', "exportCardsToFileLabel");
				wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuExportCardsToDir', "exportCardsToDirLabel");
				wdw_cardbook.enableOrDisableElement(['cardbookContactsMenuToEmailCards', 'cardbookContactsMenuCcEmailCards', 'cardbookContactsMenuBccEmailCards', 'cardbookContactsMenuFindEmails', 'cardbookContactsMenuLocalizeCards',
													'cardbookContactsMenuOpenURL', 'cardbookContactsMenuCutCards', 'cardbookContactsMenuCopyCards', 'cardbookContactsMenuPasteCards', 'cardbookContactsMenuExportCardsToFile',
													'cardbookContactsMenuExportCardsToDir', 'cardbookContactsMenuMergeCards', 'cardbookContactsMenuDuplicateCards'], false);
			}
			if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
				wdw_cardbook.enableOrDisableElement(['cardbookContactsMenuPasteCards'], true);
			} else {
				if (myTree.currentIndex != -1) {
					var myPrefId = cardbookUtils.getAccountId(myTree.view.getCellText(myTree.currentIndex, {id: "accountId"}));
					var cardbookPrefService = new cardbookPreferenceService(myPrefId);
					if (cardbookPrefService.getEnabled()) {
						if (cardbookPrefService.getReadOnly()) {
							wdw_cardbook.enableOrDisableElement(['cardbookContactsMenuPasteCards'], true);
						} else {
							wdw_cardbook.enableOrDisableElement(['cardbookContactsMenuPasteCards'], false);
						}
					} else {
						wdw_cardbook.enableOrDisableElement(['cardbookContactsMenuPasteCards'], true);
					}
				} else {
					wdw_cardbook.enableOrDisableElement(['cardbookContactsMenuPasteCards'], true);
				}
			}
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			if (!prefs.getBoolPref("mailnews.database.global.indexer.enabled")) {
				wdw_cardbook.enableOrDisableElement(['cardbookContactsMenuFindEmails'], true);
			}
		},

		cardbookToolsMenuSyncLightning: function(addon) {
			if (addon.isActive) {
				wdw_cardbook.enableOrDisableElement(['cardbookToolsSyncLightning'], false);
			} else {
				wdw_cardbook.enableOrDisableElement(['cardbookToolsSyncLightning'], true);
			}
		},

		cardbookToolsMenuContextShowing: function () {
			Components.utils.import("resource://gre/modules/AddonManager.jsm");  
			AddonManager.getAddonByID(cardbookRepository.LIGHTNING_ID, wdw_cardbook.cardbookToolsMenuSyncLightning);
		},

		accountsOrCatsTreeContextShowing: function () {
			wdw_cardbook.setElementLabelWithBundle('enableOrDisableFromAccountsOrCats', "disableFromAccountsOrCats");
			wdw_cardbook.setElementLabelWithBundle('readOnlyOrReadWriteFromAccountsOrCats', "readOnlyFromAccountsOrCats");
			if (cardbookRepository.cardbookSyncMode === "NOSYNC") {
				var myTree = document.getElementById('accountsOrCatsTree');
				if (myTree.currentIndex != -1) {
					var myAccountId = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
					var myPrefId = cardbookUtils.getAccountId(myAccountId);
					var cardbookPrefService = new cardbookPreferenceService(myPrefId);
					if (cardbookPrefService.getEnabled()) {
						if (cardbookPrefService.getReadOnly()) {
							wdw_cardbook.enableOrDisableElement(['pasteCardsFromAccountsOrCats', 'importCardsFromFileFromAccountsOrCats', 'importCardsFromDirFromAccountsOrCats'], true);
						} else {
							wdw_cardbook.enableOrDisableElement(['pasteCardsFromAccountsOrCats', 'importCardsFromFileFromAccountsOrCats', 'importCardsFromDirFromAccountsOrCats'], false);
						}
						wdw_cardbook.setElementLabelWithBundle('enableOrDisableFromAccountsOrCats', "disableFromAccountsOrCats");
						if (cardbookPrefService.getType() === "FILE" || cardbookPrefService.getType() === "CACHE" || cardbookPrefService.getType() === "DIRECTORY") {
							wdw_cardbook.enableOrDisableElement(['syncAccountFromAccountsOrCats'], true);
						} else {
							wdw_cardbook.enableOrDisableElement(['syncAccountFromAccountsOrCats'], false);
						}
					} else {
						wdw_cardbook.setElementLabelWithBundle('enableOrDisableFromAccountsOrCats', "enableFromAccountsOrCats");
						wdw_cardbook.enableOrDisableElement(['pasteCardsFromAccountsOrCats', 'importCardsFromFileFromAccountsOrCats', 'importCardsFromDirFromAccountsOrCats', 'syncAccountFromAccountsOrCats'], true);
					}
					if (cardbookPrefService.getReadOnly()) {
						wdw_cardbook.setElementLabelWithBundle('readOnlyOrReadWriteFromAccountsOrCats', "readWriteFromAccountsOrCats");
					} else {
						wdw_cardbook.setElementLabelWithBundle('readOnlyOrReadWriteFromAccountsOrCats', "readOnlyFromAccountsOrCats");
					}
					if (myTree.view.isContainer(myTree.currentIndex)) {
						wdw_cardbook.enableOrDisableElement(['removeCatFromAccountsOrCats', 'renameCatFromAccountsOrCats'], true);
					} else {
						var mySepPosition = myAccountId.indexOf("::",0);
						var myCategoryName = myAccountId.substr(mySepPosition+2, myAccountId.length);
						if (myCategoryName != cardbookRepository.cardbookUncategorizedCards) {
							wdw_cardbook.enableOrDisableElement(['removeCatFromAccountsOrCats', 'renameCatFromAccountsOrCats'], false);
						} else {
							wdw_cardbook.enableOrDisableElement(['removeCatFromAccountsOrCats', 'renameCatFromAccountsOrCats'], true);
						}
					}
				} else {
					wdw_cardbook.enableOrDisableElement(['renameCatFromAccountsOrCats', 'removeCatFromAccountsOrCats', 'pasteCardsFromAccountsOrCats', 'importCardsFromFileFromAccountsOrCats',
														'importCardsFromDirFromAccountsOrCats', 'syncAccountFromAccountsOrCats'], true);
				}
				wdw_cardbook.enableOrDisableElement(['addAccountFromAccountsOrCats', 'editAccountFromAccountsOrCats', 'removeAccountFromAccountsOrCats',
													'enableOrDisableFromAccountsOrCats', 'readOnlyOrReadWriteFromAccountsOrCats'], false);
				if (document.getElementById('cardsTree').view.rowCount == 0) {
					wdw_cardbook.setElementLabelWithBundle('toEmailCardsFromAccountsOrCats', "toEmailCardFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('ccEmailCardsFromAccountsOrCats', "ccEmailCardFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('bccEmailCardsFromAccountsOrCats', "bccEmailCardFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('cutCardsFromAccountsOrCats', "cutCardFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('copyCardsFromAccountsOrCats', "copyCardFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('exportCardsToFileFromAccountsOrCats', "exportCardToFileLabel");
					wdw_cardbook.setElementLabelWithBundle('exportCardsToDirFromAccountsOrCats', "exportCardToDirLabel");
					wdw_cardbook.enableOrDisableElement(['toEmailCardsFromAccountsOrCats', 'ccEmailCardsFromAccountsOrCats', 'bccEmailCardsFromAccountsOrCats', 'cutCardsFromAccountsOrCats',
														'copyCardsFromAccountsOrCats', 'exportCardsToFileFromAccountsOrCats', 'exportCardsToDirFromAccountsOrCats', 'findDuplicatesFromAccountsOrCats',
														'renameCatFromAccountsOrCats', 'removeCatFromAccountsOrCats'], true);
				} else if (document.getElementById('cardsTree').view.rowCount == 1) {
					wdw_cardbook.setElementLabelWithBundle('toEmailCardsFromAccountsOrCats', "toEmailCardFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('ccEmailCardsFromAccountsOrCats', "ccEmailCardFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('bccEmailCardsFromAccountsOrCats', "bccEmailCardFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('cutCardsFromAccountsOrCats', "cutCardFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('copyCardsFromAccountsOrCats', "copyCardFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('exportCardsToFileFromAccountsOrCats', "exportCardToFileLabel");
					wdw_cardbook.setElementLabelWithBundle('exportCardsToDirFromAccountsOrCats', "exportCardToDirLabel");
					wdw_cardbook.enableOrDisableElement(['toEmailCardsFromAccountsOrCats', 'ccEmailCardsFromAccountsOrCats', 'bccEmailCardsFromAccountsOrCats', 'cutCardsFromAccountsOrCats',
														'copyCardsFromAccountsOrCats', 'exportCardsToFileFromAccountsOrCats', 'exportCardsToDirFromAccountsOrCats', 'findDuplicatesFromAccountsOrCats'], false);
				} else {
					wdw_cardbook.setElementLabelWithBundle('toEmailCardsFromAccountsOrCats', "toEmailCardsFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('ccEmailCardsFromAccountsOrCats', "ccEmailCardsFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('bccEmailCardsFromAccountsOrCats', "bccEmailCardsFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('cutCardsFromAccountsOrCats', "cutCardsFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('copyCardsFromAccountsOrCats', "copyCardsFromAccountsOrCatsLabel");
					wdw_cardbook.setElementLabelWithBundle('exportCardsToFileFromAccountsOrCats', "exportCardsToFileLabel");
					wdw_cardbook.setElementLabelWithBundle('exportCardsToDirFromAccountsOrCats', "exportCardsToDirLabel");
					wdw_cardbook.enableOrDisableElement(['toEmailCardsFromAccountsOrCats', 'ccEmailCardsFromAccountsOrCats', 'bccEmailCardsFromAccountsOrCats', 'cutCardsFromAccountsOrCats',
														'copyCardsFromAccountsOrCats', 'exportCardsToFileFromAccountsOrCats', 'exportCardsToDirFromAccountsOrCats', 'findDuplicatesFromAccountsOrCats'], false);
				}
				if (cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
					wdw_cardbook.enableOrDisableElement(['toEmailCardsFromAccountsOrCats', 'ccEmailCardsFromAccountsOrCats', 'bccEmailCardsFromAccountsOrCats', 'cutCardsFromAccountsOrCats',
														'copyCardsFromAccountsOrCats', 'exportCardsToFileFromAccountsOrCats', 'exportCardsToDirFromAccountsOrCats',
														'addAccountFromAccountsOrCats', 'editAccountFromAccountsOrCats', 'removeAccountFromAccountsOrCats', 'enableOrDisableFromAccountsOrCats'], false);
					wdw_cardbook.enableOrDisableElement(['pasteCardsFromAccountsOrCats', 'importCardsFromFileFromAccountsOrCats', 'importCardsFromDirFromAccountsOrCats',
														'readOnlyOrReadWriteFromAccountsOrCats', 'syncAccountFromAccountsOrCats', 'findDuplicatesFromAccountsOrCats',
														'renameCatFromAccountsOrCats', 'removeCatFromAccountsOrCats'], true);
				}
			} else {
				wdw_cardbook.enableOrDisableElement(['toEmailCardsFromAccountsOrCats', 'ccEmailCardsFromAccountsOrCats', 'bccEmailCardsFromAccountsOrCats', 'cutCardsFromAccountsOrCats', 'copyCardsFromAccountsOrCats',
													'pasteCardsFromAccountsOrCats', 'exportCardsToFileFromAccountsOrCats', 'exportCardsToDirFromAccountsOrCats', 'importCardsFromFileFromAccountsOrCats',
													'importCardsFromDirFromAccountsOrCats', 'addAccountFromAccountsOrCats', 'editAccountFromAccountsOrCats', 'removeAccountFromAccountsOrCats',
													'renameCatFromAccountsOrCats', 'removeCatFromAccountsOrCats', 'enableOrDisableFromAccountsOrCats', 'readOnlyOrReadWriteFromAccountsOrCats',
													'syncAccountFromAccountsOrCats', 'findDuplicatesFromAccountsOrCats'], true);
			}
		},
	
		cardsTreeContextShowingNext: function () {
			cardbookUtils.addToIMPPMenuSubMenu('IMPPCardFromCardsMenuPopup');
			if (cardbookRepository.cardbookSyncMode === "NOSYNC") {
				if (cardbookUtils.getSelectedCardsCount() == 0) {
					wdw_cardbook.setElementLabelWithBundle('toEmailCardsFromCards', "toEmailCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('ccEmailCardsFromCards', "ccEmailCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('bccEmailCardsFromCards', "bccEmailCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('findEmailsFromCards', "findEmailsCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('localizeCardsFromCards', "localizeCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('openURLFromCards', "openURLCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('cutCardsFromCards', "cutCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('copyCardsFromCards', "copyCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('pasteCardsFromCards', "pasteCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('exportCardsToFileFromCards', "exportCardToFileLabel");
					wdw_cardbook.setElementLabelWithBundle('exportCardsToDirFromCards', "exportCardToDirLabel");
					wdw_cardbook.enableOrDisableElement(['toEmailCardsFromCards', 'ccEmailCardsFromCards', 'bccEmailCardsFromCards', 'findEmailsFromCards', 'localizeCardsFromCards',
														'openURLFromCards', 'cutCardsFromCards', 'copyCardsFromCards', 'pasteCardsFromCards', 'exportCardsToFileFromCards',
														'exportCardsToDirFromCards', 'mergeCardsFromCards', 'duplicateCardsFromCards', 'convertListToCategoryFromCards'], true);
				} else if (cardbookUtils.getSelectedCardsCount() == 1) {
					wdw_cardbook.setElementLabelWithBundle('toEmailCardsFromCards', "toEmailCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('ccEmailCardsFromCards', "ccEmailCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('bccEmailCardsFromCards', "bccEmailCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('findEmailsFromCards', "findEmailsCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('localizeCardsFromCards', "localizeCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('openURLFromCards', "openURLCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('cutCardsFromCards', "cutCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('copyCardsFromCards', "copyCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('pasteCardsFromCards', "pasteCardFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('exportCardsToFileFromCards', "exportCardToFileLabel");
					wdw_cardbook.setElementLabelWithBundle('exportCardsToDirFromCards', "exportCardToDirLabel");
					wdw_cardbook.enableOrDisableElement(['toEmailCardsFromCards', 'ccEmailCardsFromCards', 'bccEmailCardsFromCards', 'findEmailsFromCards', 'localizeCardsFromCards',
														'openURLFromCards', 'cutCardsFromCards', 'copyCardsFromCards', 'pasteCardsFromCards', 'exportCardsToFileFromCards',
														'exportCardsToDirFromCards', 'duplicateCardsFromCards'], false);
					wdw_cardbook.enableOrDisableElement(['mergeCardsFromCards'], true);
					var myDirPrefId = document.getElementById('dirPrefIdTextBox').value;
					var cardbookPrefService = new cardbookPreferenceService(myDirPrefId);
					var myCard = cardbookRepository.cardbookCards[myDirPrefId+"::"+document.getElementById('uidTextBox').value];
					if (myCard) {
						if (!myCard.isAList || cardbookPrefService.getReadOnly()) {
							wdw_cardbook.enableOrDisableElement(['convertListToCategoryFromCards'], true);
						} else {
							wdw_cardbook.enableOrDisableElement(['convertListToCategoryFromCards'], false);
						}
					} else {
						wdw_cardbook.enableOrDisableElement(['convertListToCategoryFromCards'], false);
					}
				} else {
					wdw_cardbook.setElementLabelWithBundle('toEmailCardsFromCards', "toEmailCardsFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('ccEmailCardsFromCards', "ccEmailCardsFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('bccEmailCardsFromCards', "bccEmailCardsFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('findEmailsFromCards', "findEmailsCardsFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('localizeCardsFromCards', "localizeCardsFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('openURLFromCards', "openURLCardsFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('cutCardsFromCards', "cutCardsFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('copyCardsFromCards', "copyCardsFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('pasteCardsFromCards', "pasteCardsFromCardsLabel");
					wdw_cardbook.setElementLabelWithBundle('exportCardsToFileFromCards', "exportCardsToFileLabel");
					wdw_cardbook.setElementLabelWithBundle('exportCardsToDirFromCards', "exportCardsToDirLabel");
					wdw_cardbook.enableOrDisableElement(['toEmailCardsFromCards', 'ccEmailCardsFromCards', 'bccEmailCardsFromCards', 'findEmailsFromCards', 'localizeCardsFromCards',
														'openURLFromCards', 'cutCardsFromCards', 'copyCardsFromCards', 'pasteCardsFromCards', 'exportCardsToFileFromCards',
														'exportCardsToDirFromCards', 'mergeCardsFromCards', 'duplicateCardsFromCards'], false);
					wdw_cardbook.enableOrDisableElement(['convertListToCategoryFromCards'], true);
				}
				if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
					wdw_cardbook.enableOrDisableElement(['pasteCardsFromCards'], true);
				} else {
					var myTree = document.getElementById('accountsOrCatsTree');
					if (myTree.currentIndex != -1) {
						var myPrefId = cardbookUtils.getAccountId(myTree.view.getCellText(myTree.currentIndex, {id: "accountId"}));
						var cardbookPrefService = new cardbookPreferenceService(myPrefId);
						if (cardbookPrefService.getEnabled()) {
							if (cardbookPrefService.getReadOnly()) {
								wdw_cardbook.enableOrDisableElement(['pasteCardsFromCards'], true);
							} else {
								wdw_cardbook.enableOrDisableElement(['pasteCardsFromCards'], false);
							}
						} else {
							wdw_cardbook.enableOrDisableElement(['pasteCardsFromCards'], true);
						}
					} else {
						wdw_cardbook.enableOrDisableElement(['pasteCardsFromCards'], true);
					}
				}
			} else {
				wdw_cardbook.enableOrDisableElement(['toEmailCardsFromCards', 'ccEmailCardsFromCards', 'bccEmailCardsFromCards', 'findEmailsFromCards', 'localizeCardsFromCards',
													'openURLFromCards', 'cutCardsFromCards', 'copyCardsFromCards', 'pasteCardsFromCards', 'exportCardsToFileFromCards',
													'exportCardsToDirFromCards', 'mergeCardsFromCards', 'duplicateCardsFromCards', 'convertListToCategoryFromCards'], true);
			}
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			if (!prefs.getBoolPref("mailnews.database.global.indexer.enabled")) {
				wdw_cardbook.enableOrDisableElement(['findEmailsFromCards'], true);
			}
		},
	
		emailTreeContextShowing: function () {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			wdw_cardbook.enableOrDisableElement(['findemailemailTree'], !prefs.getBoolPref("mailnews.database.global.indexer.enabled"));
		},

		enableCardDeletion: function () {
			if (cardbookRepository.cardbookAccounts.length === 0) {
				wdw_cardbook.disableCardDeletion();
			} else {
				wdw_cardbook.enableOrDisableElement(['cardbookToolbarRemoveButton'], false);
				wdw_cardbook.enableOrDisableElement(['cardbookContactsMenuRemoveCard'], false);
				wdw_cardbook.enableOrDisableElement(['removeCardFromCards'], false);
				if (cardbookUtils.getSelectedCardsCount() > 1) {
					wdw_cardbook.setElementLabelWithBundle('cardbookToolbarRemoveButton', "deleteCardsButtonLabel");
					wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuRemoveCard', "deleteCardsButtonLabel");
					wdw_cardbook.setElementLabelWithBundle('removeCardFromCards', "deleteCardsButtonLabel");
				} else if (cardbookUtils.getSelectedCardsCount() == 1) {
					wdw_cardbook.setElementLabelWithBundle('cardbookToolbarRemoveButton', "cardbookToolbarRemoveButtonLabel");
					wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuRemoveCard', "cardbookToolbarRemoveButtonLabel");
					wdw_cardbook.setElementLabelWithBundle('removeCardFromCards', "cardbookToolbarRemoveButtonLabel");
				}
			}
		},
	
		enableCardCreation: function () {
			if (cardbookRepository.cardbookAccounts.length === 0) {
				wdw_cardbook.disableCardCreation();
			} else {
				wdw_cardbook.enableOrDisableElement(['cardbookToolbarAddButton', 'cardbookContactsMenuAddCard', 'addCardFromCards'], false);
			}
		},
	
		enableCardModification: function () {
			if (cardbookRepository.cardbookAccounts.length === 0) {
				wdw_cardbook.disableCardModification();
			} else {
				var myTree = document.getElementById('accountsOrCatsTree');
				var myPrefId = cardbookUtils.getAccountId(myTree.view.getCellText(myTree.currentIndex, {id: "accountId"}));
				if (cardbookUtils.isMyAccountReadOnly(myPrefId)) {
					wdw_cardbook.setElementLabelWithBundle('cardbookToolbarEditButton', "viewCardButtonLabel");
					wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuEditCard', "viewCardButtonLabel");
					wdw_cardbook.setElementLabelWithBundle('editCardFromCards', "viewCardButtonLabel");
				} else {
					wdw_cardbook.setElementLabelWithBundle('cardbookToolbarEditButton', "cardbookToolbarEditButtonLabel");
					wdw_cardbook.setElementLabelWithBundle('cardbookContactsMenuEditCard', "cardbookToolbarEditButtonLabel");
					wdw_cardbook.setElementLabelWithBundle('editCardFromCards', "cardbookToolbarEditButtonLabel");
				}
				wdw_cardbook.enableOrDisableElement(['cardbookToolbarEditButton', 'cardbookContactsMenuEditCard', 'editCardFromCards'], false);
			}
		},
	
		disableCardDeletion: function () {
			wdw_cardbook.enableOrDisableElement(['cardbookToolbarRemoveButton', 'cardbookContactsMenuRemoveCard', 'removeCardFromCards'], true);
		},
		
		disableCardCreation: function () {
			wdw_cardbook.enableOrDisableElement(['cardbookToolbarAddButton', 'cardbookContactsMenuAddCard', 'addCardFromCards'], true);
		},
		
		disableCardModification: function () {
			wdw_cardbook.enableOrDisableElement(['cardbookToolbarEditButton', 'cardbookContactsMenuEditCard', 'editCardFromCards'], true);
		},

		updateStatusProgressInformationField: function() {
			if (document.getElementById('cardboookModeBroadcaster').getAttribute('mode') == 'cardbook') {
				if (cardbookRepository.statusInformation.length === 0) {
					wdw_cardbook.setElementLabel('totalMessageCount', "");
				} else {
					if (cardbookRepository.statusInformation[cardbookRepository.statusInformation.length - 1][0] == cardbookRepository.statusInformation[cardbookRepository.statusInformation.length - 1][0].substr(0,150)) {
						wdw_cardbook.setElementLabel('totalMessageCount', cardbookRepository.statusInformation[cardbookRepository.statusInformation.length - 1][0]);
					} else {
						wdw_cardbook.setElementLabel('totalMessageCount', cardbookRepository.statusInformation[cardbookRepository.statusInformation.length - 1][0].substr(0,147) + "...");
	
					}
				}
				document.getElementById("totalMessageCount").hidden=false;
			}
		},
	
		updateStatusInformation: function() {
			if (document.getElementById('cardboookModeBroadcaster').getAttribute('mode') == 'cardbook' && cardbookRepository.cardbookSyncMode !== "SYNC") {
				var myTree = document.getElementById('accountsOrCatsTree');
				var strBundle = document.getElementById("cardbook-strings");
				if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
					var myAccountId = cardbookRepository.cardbookSearchValue;
					if (cardbookRepository.cardbookDisplayCards[myAccountId]) {
						var myMessage = strBundle.getFormattedString("numberContactsFound", [cardbookRepository.cardbookDisplayCards[myAccountId].length]);
					} else {
						var myMessage = "";
					}
				} else {
					try {
						var myAccountId = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
						var myMessage = strBundle.getFormattedString("numberContacts", [cardbookRepository.cardbookDisplayCards[myAccountId].length]);
					}
					catch(e) {
						var myMessage = "";
					}
				}
				document.getElementById("statusText").hidden=false;
				document.getElementById("unreadMessageCount").hidden=true;
				wdw_cardbook.setElementLabel('statusText', myMessage);
			}
		},
	
		windowControlShowing: function () {
			if (cardbookRepository.cardbookAccounts.length === 0) {
				wdw_cardbook.enableOrDisableElement(['cardbookToolbarSyncButton', 'cardbookAccountMenuSyncs'], true);
				wdw_cardbook.disableCardCreation();
				wdw_cardbook.disableCardModification();
				wdw_cardbook.disableCardDeletion();
			} else {
				if (cardbookRepository.cardbookSyncMode === "SYNC") {
					wdw_cardbook.disableCardDeletion();
					wdw_cardbook.disableCardCreation();
					wdw_cardbook.disableCardModification();
					wdw_cardbook.enableOrDisableElement(['cardbookToolbarSyncButton', 'cardbookAccountMenuSyncs'], true);
				} else if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
					wdw_cardbook.disableCardCreation();
					if (cardbookUtils.getSelectedCardsCount() >= 2 || cardbookUtils.getSelectedCardsCount() == 0) {
						wdw_cardbook.disableCardModification();
					} else {
						wdw_cardbook.enableCardModification();
					}
					if (cardbookUtils.getSelectedCardsCount() == 0) {
						wdw_cardbook.disableCardDeletion();
					} else {
						wdw_cardbook.enableCardDeletion();
					}
					wdw_cardbook.enableOrDisableElement(['cardbookToolbarSyncButton', 'cardbookAccountMenuSyncs'], !cardbookUtils.isThereNetworkAccountToSync());
				} else {
					var myTree = document.getElementById('accountsOrCatsTree');
					if (myTree.currentIndex != -1) {
						var myPrefId = cardbookUtils.getAccountId(myTree.view.getCellText(myTree.currentIndex, {id: "accountId"}));
						if (cardbookUtils.isMyAccountEnabled(myPrefId)) {
							if (cardbookUtils.isMyAccountReadOnly(myPrefId)) {
								wdw_cardbook.disableCardCreation();
								wdw_cardbook.disableCardDeletion();
							} else {
								wdw_cardbook.enableCardCreation();
								if (cardbookUtils.getSelectedCardsCount() == 0) {
									wdw_cardbook.disableCardDeletion();
								} else {
									wdw_cardbook.enableCardDeletion();
								}
							}
							if (cardbookUtils.getSelectedCardsCount() >= 2 || cardbookUtils.getSelectedCardsCount() == 0) {
								wdw_cardbook.disableCardModification();
							} else {
								wdw_cardbook.enableCardModification();
							}
						} else {
							wdw_cardbook.disableCardDeletion();
							wdw_cardbook.disableCardCreation();
							wdw_cardbook.disableCardModification();
						}
					} else {
						wdw_cardbook.disableCardDeletion();
						wdw_cardbook.disableCardCreation();
						wdw_cardbook.disableCardModification();
					}
					wdw_cardbook.enableOrDisableElement(['cardbookToolbarSyncButton', 'cardbookAccountMenuSyncs'], !cardbookUtils.isThereNetworkAccountToSync());
				}
			}
	
			if (cardbookRepository.cardbookSyncMode === "SYNC") {
				wdw_cardbook.enableOrDisableElement(['cardbookToolbarAddServerButton', 'cardbookToolbarConfigurationButton', 'accountsOrCatsTreeContextMenu', 'cardsTreeContextMenu',
													'cardbookAccountMenu', 'cardbookContactsMenu', 'cardbookToolsMenu'], true);
			} else {
				wdw_cardbook.enableOrDisableElement(['cardbookToolbarAddServerButton', 'cardbookToolbarConfigurationButton', 'accountsOrCatsTreeContextMenu', 'cardsTreeContextMenu',
													'cardbookAccountMenu', 'cardbookContactsMenu', 'cardbookToolsMenu'], false);
			}
	
			wdw_cardbook.updateStatusInformation();
			wdw_cardbook.updateStatusProgressInformationField();
	
			if (cardbookRepository.cardbookSyncMode === "SYNC") {
				wdw_cardbook.cardbookrefresh = true;
				wdw_cardbook.refreshAccountsInDirTree();
				wdw_cardbook.sortCardsTreeCol();
			} else if (wdw_cardbook.cardbookrefresh) {
				if (cardbookRepository.cardbookSearchMode === "SEARCH") {
					wdw_cardbook.search();
				} else if (cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
					wdw_cardbook.complexSearch(wdw_cardbook.currentAccount.replace(/^([^:]*)::(.*)/, "$2"));
				} else {
					wdw_cardbook.refreshAccountsInDirTree();
					wdw_cardbook.sortCardsTreeCol();
				}
				wdw_cardbook.cardbookrefresh = false;
			}
			
			if (cardbookRepository.cardbookSearchMode !== "SEARCH" && cardbookRepository.cardbookComplexSearchMode !== "SEARCH") {
				var myTree = document.getElementById('accountsOrCatsTree');
				if (myTree.currentIndex == -1) {
					if (cardbookRepository.cardbookAccounts) {
						myTree.view.selection.select(0);
					}
				}
			} else {
				wdw_cardbook.refreshAccountsInDirTree();
				wdw_cardbook.sortCardsTreeCol();
			}
			wdw_cardbook.showCorrectTabs();
			ovl_cardbookLayout.orientPanes();
			ovl_cardbookLayout.resizePanes();
		}

	};
};
