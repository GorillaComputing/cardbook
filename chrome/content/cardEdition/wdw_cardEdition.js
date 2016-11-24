if ("undefined" == typeof(wdw_cardEdition)) {
	var wdw_cardEdition = {

		contactNotLoaded : true,
		emailToAdd : [],
		listOfCategories : [],
		cardbookeditlists : {},
		workingCard : {},

		loadCssRules: function () {
			for each (var styleSheet in document.styleSheets) {
				if (styleSheet.href == "chrome://cardbook/skin/cardbookTreeCols.css") {
					cardbookRepository.cardbookDynamicCssRules[styleSheet.href] = [];
					let cardbookPrefService = new cardbookPreferenceService();
					if (cardbookPrefService.getHideHeaders()) {
						cardbookRepository.createCssHeaderRules(styleSheet);
						cardbookRepository.reloadCss(styleSheet.href);
					}
					cardbookRepository.reloadCss(styleSheet.href);
				}
			}
		},

		displayOrHideHeaders: function () {
			for each (var styleSheet in document.styleSheets) {
				if (styleSheet.href == "chrome://cardbook/skin/cardbookTreeCols.css") {
					if (cardbookRepository.cardbookDynamicCssRules[styleSheet.href].length >= 1) {
						cardbookRepository.deleteCssAllRules(styleSheet);
					} else {
						cardbookRepository.createCssHeaderRules(styleSheet);
					}
					let cardbookPrefService = new cardbookPreferenceService();
					cardbookPrefService.setHideHeaders(!cardbookPrefService.getHideHeaders());
					cardbookRepository.reloadCss(styleSheet.href);
					break;
				}
			}
		},

		changeDisplayOrHideHeadersLabel: function (aMenu) {
			var myTree = document.getElementById(aMenu.id.replace("ContextMenu", ""));
			var mySelectedPosition = myTree.currentIndex;

			var strBundle = document.getElementById("cardbook-strings");
			let cardbookPrefService = new cardbookPreferenceService();
			if (cardbookPrefService.getHideHeaders()) {
				document.getElementById('displayOrHideHeaders' + myTree.id).label=strBundle.getString("displayHeaders");
			} else {
				document.getElementById('displayOrHideHeaders' + myTree.id).label=strBundle.getString("hideHeaders");
			}
		},

		displayListTrees: function (aTreeName) {
			var availableCardsTreeView = {
				get rowCount() { return wdw_cardEdition.cardbookeditlists[aTreeName].length; },
				isContainer: function(idx) { return false },
				cycleHeader: function(idx) { return false },
				isEditable: function(idx, column) { return false },
				getCellText: function(idx, column) {
					if (column.id == aTreeName + "Id") {
						if (wdw_cardEdition.cardbookeditlists[aTreeName][idx]) return wdw_cardEdition.cardbookeditlists[aTreeName][idx][0];
					}
					else if (column.id == aTreeName + "Name") {
						if (wdw_cardEdition.cardbookeditlists[aTreeName][idx]) return wdw_cardEdition.cardbookeditlists[aTreeName][idx][1];
					}
				}
			}
			document.getElementById(aTreeName + 'Tree').view = availableCardsTreeView;
		},

		displayLists: function (aCard) {
			document.getElementById('searchAvailableCardsInput').value = "";
			document.getElementById('kindTextBox').value = "";
			wdw_cardEdition.cardbookeditlists.availableCards = [];
			wdw_cardEdition.cardbookeditlists.addedCards = [];
			if (aCard.version == "4.0") {
				document.getElementById('kindTextBox').value = aCard.kind;
				for (var i = 0; i < aCard.member.length; i++) {
					var uid = aCard.member[i].replace("urn:uuid:", "");
					if (cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+uid]) {
						wdw_cardEdition.cardbookeditlists.addedCards.push([aCard.member[i], cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+uid].fn]);
					}
				}
			} else if (aCard.version == "3.0") {
				document.getElementById('kindTextBox').value = "";
				var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				var kindCustom = prefs.getComplexValue("extensions.cardbook.kindCustom", Components.interfaces.nsISupportsString).data;
				var memberCustom = prefs.getComplexValue("extensions.cardbook.memberCustom", Components.interfaces.nsISupportsString).data;
				for (var i = 0; i < aCard.others.length; i++) {
					var localDelim1 = aCard.others[i].indexOf(":",0);
					if (localDelim1 >= 0) {
						var header = aCard.others[i].substr(0,localDelim1);
						var trailer = aCard.others[i].substr(localDelim1+1,aCard.others[i].length);
						if (header == kindCustom) {
							document.getElementById('kindTextBox').value = trailer;
						} else if (header == memberCustom) {
							if (cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+trailer.replace("urn:uuid:", "")]) {
								wdw_cardEdition.cardbookeditlists.addedCards.push([trailer, cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+trailer.replace("urn:uuid:", "")].fn]);
							}
						}
					}
				}
			}
			wdw_cardEdition.sortListTreeCol('addedCards', null, null);
			wdw_cardEdition.searchAvailableCards();
		},

		sortListTreeCol: function (aTreeName, aColumn, aSelectedList) {
			if (aTreeName != null && aTreeName !== undefined && aTreeName != "") {
				var myTreeName = aTreeName;
			} else {
				var myTreeName = aColumn.id.replace("Name", "").replace("Id", "");
			}
			var myTree = document.getElementById(myTreeName + 'Tree');
			
			// get selected cards
			var listOfUid = {};
			if (!(aSelectedList != null && aSelectedList !== undefined && aSelectedList != "")) {
				listOfUid[myTreeName] = cardbookUtils.getSelectedCardsForList(myTree);
			} else {
				listOfUid[myTreeName] = aSelectedList;
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
			
			if (wdw_cardEdition.cardbookeditlists[myTreeName]) {
				wdw_cardEdition.cardbookeditlists[myTreeName].sort(function(a,b) {
					if (columnName.indexOf("Name") >= 0) {
						if (a[1].toUpperCase() > b[1].toUpperCase()) return 1 * order;
						if (a[1].toUpperCase() < b[1].toUpperCase()) return -1 * order;
					} else if (columnName.indexOf("Id") >= 0) {
						if (a[0].toUpperCase() > b[0].toUpperCase()) return 1 * order;
						if (a[0].toUpperCase() < b[0].toUpperCase()) return -1 * order;
					} else {
						return 0;
					}
				});
			} else {
				return;
			}

			//setting these will make the sort option persist
			myTree.setAttribute("sortDirection", order == 1 ? "ascending" : "descending");
			myTree.setAttribute("sortResource", columnName);

			wdw_cardEdition.displayListTrees(myTreeName);

			//set the appropriate attributes to show to indicator
			var cols = myTree.getElementsByTagName("treecol");
			for (var i = 0; i < cols.length; i++) {
				cols[i].removeAttribute("sortDirection");
			}
			document.getElementById(columnName).setAttribute("sortDirection", order == 1 ? "ascending" : "descending");

			// select Cards back
			cardbookUtils.setSelectedCardsForList(myTree, listOfUid[myTreeName]);
		},

		addUidToAdded: function (aCardList) {
			var found = false;
			for (var j = 0; j < wdw_cardEdition.cardbookeditlists.addedCards.length; j++) {
				if (wdw_cardEdition.cardbookeditlists.addedCards[j][0] == aCardList[0]) {
					found = true;
					break;
				}
			}
			if (!found) {
				wdw_cardEdition.cardbookeditlists.addedCards.splice(0, 0, [aCardList[0], aCardList[1]]);
			}
		},

		removeUidFromAdded: function (aCardList) {
			function removeCardList(element) {
				return (element[0] != aCardList[0]);
			}
			wdw_cardEdition.cardbookeditlists.addedCards = wdw_cardEdition.cardbookeditlists.addedCards.filter(removeCardList);
		},

		modifyLists: function (aMenuOrTree) {
			switch (aMenuOrTree.id) {
				case "availableCardsTreeChildren":
					var myAction = "appendlistavailableCardsTree";
					break;
				case "addedCardsTreeChildren":
					var myAction = "deletelistaddedCardsTree";
					break;
				default:
					var myAction = aMenuOrTree.id.replace("Menu", "").replace("Button", "");
					break;
			}
			var myAvailableCardsTree = document.getElementById('availableCardsTree');
			var myAddedCardsTree = document.getElementById('addedCardsTree');
			var myAvailableCards = cardbookUtils.getSelectedCardsForList(myAvailableCardsTree);
			var myAddedCards = cardbookUtils.getSelectedCardsForList(myAddedCardsTree);
			switch (myAction) {
				case "appendlistavailableCardsTree":
					for (var i = 0; i < myAvailableCards.length; i++) {
						wdw_cardEdition.addUidToAdded(myAvailableCards[i]);
					}
					break;
				case "deletelistaddedCardsTree":
					for (var i = 0; i < myAddedCards.length; i++) {
						wdw_cardEdition.removeUidFromAdded(myAddedCards[i]);
					}
					break;
				default:
					break;
			}
			wdw_cardEdition.sortListTreeCol('addedCards', null, myAddedCards);
			wdw_cardEdition.searchAvailableCards(myAvailableCards);
		},

		searchAvailableCards: function (aSelectedList) {
			var listOfUid = [];
			if (!(aSelectedList != null && aSelectedList !== undefined && aSelectedList != "")) {
				var myTree = document.getElementById('availableCardsTree');
				listOfUid = cardbookUtils.getSelectedCardsForList(myTree);
			} else {
				listOfUid = aSelectedList;
			}
			var searchValue = document.getElementById('searchAvailableCardsInput').value.replace(/[\s+\-+\.+\,+\;+]/g, "").toUpperCase();
			wdw_cardEdition.cardbookeditlists.availableCards = [];
			var myCurrentDirPrefId = document.getElementById('dirPrefIdTextBox').value;
			if (myCurrentDirPrefId != "") {
				for (var i in cardbookRepository.cardbookCardSearch) {
					if (i.indexOf(searchValue) >= 0 || searchValue == "") {
						for (var j = 0; j < cardbookRepository.cardbookCardSearch[i].length; j++) {
							var myCard = cardbookRepository.cardbookCardSearch[i][j];
							if (myCard.dirPrefId == myCurrentDirPrefId) {
								var found = false;
								for (var k = 0; k < wdw_cardEdition.cardbookeditlists.addedCards.length; k++) {
									if (wdw_cardEdition.cardbookeditlists.addedCards[k][0].replace("urn:uuid:", "") == myCard.uid) {
										found = true;
										break;
									}
								}
								if (!found && myCard.uid != document.getElementById('uidTextBox').value) {
									wdw_cardEdition.cardbookeditlists.availableCards.push(["urn:uuid:" + myCard.uid, myCard.fn]);
								}
							}
						}
					}
				}
			}
			wdw_cardEdition.sortListTreeCol('availableCards', null, listOfUid);
		},

		getCategories: function () {
			var aListBox = document.getElementById('categoriesListbox');
			var myCategoryList = [];
			for (var i=0; i<aListBox.itemCount; i++) {
				var aItem = aListBox.getItemAtIndex(i);
				var aItemChecked = aItem.getAttribute('checked');
				aItemChecked = typeof aItemChecked == "boolean" ? aItemChecked : (aItemChecked == 'true' ? true : false);
				if (aItemChecked) {
					myCategoryList.push(aItem.getAttribute('value'));
				}
			}
			return myCategoryList;
		},

		loadCategories: function (aCategoryList) {
			var aListBox = document.getElementById('categoriesListbox');
			cardbookElementTools.deleteRows('categoriesListbox');
			if (wdw_cardEdition.listOfCategories) {
				for (var i = 0; i < wdw_cardEdition.listOfCategories.length; i++) {
					if (wdw_cardEdition.listOfCategories[i] != cardbookRepository.cardbookUncategorizedCards) {
						var aItem = aListBox.appendItem(wdw_cardEdition.listOfCategories[i], wdw_cardEdition.listOfCategories[i]);
						aItem.setAttribute('id', wdw_cardEdition.listOfCategories[i]);
						aItem.setAttribute('type', 'checkbox');
					}
				}
				aListBox.setAttribute('rows', wdw_cardEdition.listOfCategories.length);
				for (var i = 0; i < aCategoryList.length; i++) {
					if (document.getElementById(aCategoryList[i])) {
						var aItem = document.getElementById(aCategoryList[i]);
						aItem.setAttribute('checked', true);
					}
				}
			}
		},

		createCategory: function () {
			var myNewCategory = document.getElementById('categoryTextbox').value;
			if (myNewCategory == "") {
				return;
			}
			wdw_cardEdition.listOfCategories.push(myNewCategory);
			wdw_cardEdition.listOfCategories = cardbookRepository.arrayUnique(wdw_cardEdition.listOfCategories);
			wdw_cardEdition.listOfCategories = wdw_cardEdition.listOfCategories.sort(function(a,b) {
				return a[0].localeCompare(b[0], 'en', {'sensitivity': 'base'});
			});
			var myCheckedCategory = wdw_cardEdition.getCategories()
			myCheckedCategory.push(myNewCategory);
			wdw_cardEdition.loadCategories(myCheckedCategory);
			document.getElementById('categoryTextbox').value = "";
			document.getElementById('categoryTextbox').focus();
		},

		display40: function (aCardVersion, aReadOnly) {
			if (aCardVersion == "4.0") {
				document.getElementById('genderLabel').removeAttribute('hidden');
				document.getElementById('genderTextBox').removeAttribute('hidden');
			} else {
				document.getElementById('genderLabel').setAttribute('hidden', 'true');
				document.getElementById('genderTextBox').setAttribute('hidden', 'true');
			}
			if (aReadOnly) {
				document.getElementById('genderTextBox').setAttribute('readonly', 'true');
			} else {
				document.getElementById('genderTextBox').removeAttribute('readonly');
			}
		},

		displayCustomsName: function (aReadOnly) {
			if (cardbookRepository.customFieldsLabel['customField1Name'] != null && cardbookRepository.customFieldsLabel['customField1Name'] !== undefined && cardbookRepository.customFieldsLabel['customField1Name'] != "") {
				document.getElementById('customField1NameLabel').value = cardbookRepository.customFieldsLabel['customField1Name'];
				document.getElementById('customField1NameLabel').removeAttribute('hidden');
				document.getElementById('customField1NameTextBox').removeAttribute('hidden');
			} else {
				document.getElementById('customField1NameLabel').setAttribute('hidden', 'true');
				document.getElementById('customField1NameTextBox').setAttribute('hidden', 'true');
			}
			if (cardbookRepository.customFieldsLabel['customField2Name'] != null && cardbookRepository.customFieldsLabel['customField2Name'] !== undefined && cardbookRepository.customFieldsLabel['customField2Name'] != "") {
				document.getElementById('customField2NameLabel').value = cardbookRepository.customFieldsLabel['customField2Name'];
				document.getElementById('customField2NameLabel').removeAttribute('hidden');
				document.getElementById('customField2NameTextBox').removeAttribute('hidden');
			} else {
				document.getElementById('customField2NameLabel').setAttribute('hidden', 'true');
				document.getElementById('customField2NameTextBox').setAttribute('hidden', 'true');
			}
			if (aReadOnly) {
				document.getElementById('customField1NameTextBox').setAttribute('readonly', 'true');
				document.getElementById('customField2NameTextBox').setAttribute('readonly', 'true');
			} else {
				document.getElementById('customField1NameTextBox').removeAttribute('readonly');
				document.getElementById('customField2NameTextBox').removeAttribute('readonly');
			}
		},

		loadEditionMode: function () {
			var strBundle = document.getElementById("cardbook-strings");
			document.title=strBundle.getString("wdw_cardEdition" + window.arguments[0].editionMode + "Title");
			if (window.arguments[0].editionMode == "ViewResult") {
				document.getElementById('addressbookMenulist').disabled = false;
				document.getElementById('addressbookMenulistLabel').label = strBundle.getString("addToAddressbook");
				document.getElementById('existingDataGroupbox').setAttribute('hidden', 'true');
				document.getElementById('existingDataGroupbox').setAttribute('hidden', 'true');
				document.getElementById('contactMenulist').setAttribute('hidden', 'true');
				document.getElementById('contactMenulistLabel').setAttribute('hidden', 'true');
				document.getElementById('categoriesReadOnlyGroupbox').setAttribute('hidden', 'true');
				document.getElementById('listReadOnlyGroupbox').setAttribute('hidden', 'true');
				document.getElementById('categoriesReadWriteGroupbox').removeAttribute('hidden');
				document.getElementById('listReadWriteGroupbox').removeAttribute('hidden');
				document.getElementById('createEditionLabel').setAttribute('hidden', 'false');
				document.getElementById('createAndReplaceEditionLabel').setAttribute('hidden', 'false');
				document.getElementById('saveEditionLabel').setAttribute('hidden', 'true');
			} else if (window.arguments[0].editionMode == "ViewResultHideCreate") {
				document.getElementById('addressbookMenulist').setAttribute('hidden', 'true');
				document.getElementById('addressbookMenulistLabel').setAttribute('hidden', 'true');
				document.getElementById('addressbookMenulistGroupbox').setAttribute('hidden', 'true');
				document.getElementById('existingDataGroupbox').setAttribute('hidden', 'true');
				document.getElementById('contactMenulist').setAttribute('hidden', 'true');
				document.getElementById('contactMenulistLabel').setAttribute('hidden', 'true');
				document.getElementById('categoriesReadOnlyGroupbox').setAttribute('hidden', 'true');
				document.getElementById('listReadOnlyGroupbox').setAttribute('hidden', 'true');
				document.getElementById('categoriesReadWriteGroupbox').removeAttribute('hidden');
				document.getElementById('listReadWriteGroupbox').removeAttribute('hidden');
				document.getElementById('createEditionLabel').setAttribute('hidden', 'true');
				document.getElementById('createAndReplaceEditionLabel').setAttribute('hidden', 'false');
				document.getElementById('saveEditionLabel').setAttribute('hidden', 'true');
				document.getElementById('cardbookSwitchButton').setAttribute('hidden', 'true');
			} else if (window.arguments[0].editionMode == "ViewCard") {
				document.getElementById('addressbookMenulist').disabled = true;
				document.getElementById('addressbookMenulistLabel').label = strBundle.getString("dirPrefIdLabel");
				document.getElementById('existingDataGroupbox').setAttribute('hidden', 'true');
				document.getElementById('contactMenulist').setAttribute('hidden', 'true');
				document.getElementById('contactMenulistLabel').setAttribute('hidden', 'true');
				document.getElementById('categoriesReadOnlyGroupbox').removeAttribute('hidden');
				document.getElementById('listReadOnlyGroupbox').removeAttribute('hidden');
				document.getElementById('categoriesReadWriteGroupbox').setAttribute('hidden', 'true');
				document.getElementById('listReadWriteGroupbox').setAttribute('hidden', 'true');
				document.getElementById('defaultCardImage').removeAttribute('context');
				document.getElementById('defaultCardImage').removeAttribute('ondblclick');
				document.getElementById('createEditionLabel').setAttribute('hidden', 'true');
				document.getElementById('createAndReplaceEditionLabel').setAttribute('hidden', 'true');
				document.getElementById('saveEditionLabel').setAttribute('hidden', 'true');
				document.getElementById('cardbookSwitchButton').setAttribute('hidden', 'true');
			} else if (window.arguments[0].editionMode == "EditCard") {
				document.getElementById('addressbookMenulist').disabled = false;
				document.getElementById('addressbookMenulistLabel').label = strBundle.getString("dirPrefIdLabel");
				document.getElementById('existingDataGroupbox').setAttribute('hidden', 'true');
				document.getElementById('contactMenulist').setAttribute('hidden', 'true');
				document.getElementById('contactMenulistLabel').setAttribute('hidden', 'true');
				document.getElementById('categoriesReadOnlyGroupbox').setAttribute('hidden', 'true');
				document.getElementById('listReadOnlyGroupbox').setAttribute('hidden', 'true');
				document.getElementById('categoriesReadWriteGroupbox').removeAttribute('hidden');
				document.getElementById('listReadWriteGroupbox').removeAttribute('hidden');
				document.getElementById('createEditionLabel').setAttribute('hidden', 'true');
				document.getElementById('createAndReplaceEditionLabel').setAttribute('hidden', 'true');
			} else if (window.arguments[0].editionMode == "CreateCard" ) {
				document.getElementById('addressbookMenulist').disabled = false;
				document.getElementById('addressbookMenulistLabel').label = strBundle.getString("addToAddressbook");
				document.getElementById('existingDataGroupbox').setAttribute('hidden', 'true');
				document.getElementById('existingDataGroupbox').setAttribute('hidden', 'true');
				document.getElementById('contactMenulist').setAttribute('hidden', 'true');
				document.getElementById('contactMenulistLabel').setAttribute('hidden', 'true');
				document.getElementById('categoriesReadOnlyGroupbox').setAttribute('hidden', 'true');
				document.getElementById('listReadOnlyGroupbox').setAttribute('hidden', 'true');
				document.getElementById('categoriesReadWriteGroupbox').removeAttribute('hidden');
				document.getElementById('listReadWriteGroupbox').removeAttribute('hidden');
				document.getElementById('createEditionLabel').setAttribute('hidden', 'true');
				document.getElementById('createAndReplaceEditionLabel').setAttribute('hidden', 'true');
			} else if (window.arguments[0].editionMode == "AddEmail" ) {
				wdw_cardEdition.emailToAdd = wdw_cardEdition.workingCard.email[0];
				document.getElementById('addressbookMenulist').disabled = false;
				document.getElementById('addressbookMenulistLabel').label = strBundle.getString("addToAddressbook");
				document.getElementById('existingDataGroupbox').removeAttribute('hidden');
				document.getElementById('contactMenulist').removeAttribute('hidden');
				document.getElementById('contactMenulistLabel').removeAttribute('hidden');
				document.getElementById('categoriesReadOnlyGroupbox').setAttribute('hidden', 'true');
				document.getElementById('listReadOnlyGroupbox').setAttribute('hidden', 'true');
				document.getElementById('categoriesReadWriteGroupbox').removeAttribute('hidden');
				document.getElementById('listReadWriteGroupbox').removeAttribute('hidden');
				document.getElementById('createEditionLabel').setAttribute('hidden', 'true');
				document.getElementById('createAndReplaceEditionLabel').setAttribute('hidden', 'true');
			}
			document.getElementById('lastnameTextBox').focus();
		},

		loadDefaultVersion: function () {
			var myDirPrefId = document.getElementById('addressbookMenulist').selectedItem.value;
			var cardbookPrefService = new cardbookPreferenceService(myDirPrefId);
			document.getElementById("versionTextBox").value = cardbookPrefService.getVCard();
			wdw_cardEdition.workingCard.version = document.getElementById("versionTextBox").value;
		},

		loadAddressBooks: function (aAddressBookId) {
			var myPopup = document.getElementById("addressbookMenupopup");
			cardbookElementTools.deleteRows('addressbookMenupopup');
			var j = 0;
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (window.arguments[0].editionMode == "ViewCard") {
					if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][6]) {
						var menuItem = document.createElement("menuitem");
						menuItem.setAttribute("label", cardbookRepository.cardbookAccounts[i][0]);
						menuItem.setAttribute("value", cardbookRepository.cardbookAccounts[i][4]);
						myPopup.appendChild(menuItem);
						if (cardbookRepository.cardbookAccounts[i][4] == aAddressBookId) {
							document.getElementById("addressbookMenulist").selectedIndex = j;
						}
						j++;
					}
				} else {
					if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][6] && !cardbookRepository.cardbookAccounts[i][7]) {
						var menuItem = document.createElement("menuitem");
						menuItem.setAttribute("label", cardbookRepository.cardbookAccounts[i][0]);
						menuItem.setAttribute("value", cardbookRepository.cardbookAccounts[i][4]);
						myPopup.appendChild(menuItem);
						if (cardbookRepository.cardbookAccounts[i][4] == aAddressBookId) {
							document.getElementById("addressbookMenulist").selectedIndex = j;
						}
						j++;
					}
				}
			}
			wdw_cardEdition.listOfCategories = JSON.parse(JSON.stringify(cardbookRepository.cardbookAccountsCategories[aAddressBookId]));
		},

		removeContacts: function () {
			document.getElementById('contactMenulist').selectedIndex = 0;
			cardbookElementTools.deleteRows('contactMenupopup');
			wdw_cardEdition.contactNotLoaded = true;
		},

		loadContacts: function () {
			if (wdw_cardEdition.contactNotLoaded) {
				var myPopup = document.getElementById("contactMenupopup");
				var myAddressBookId = document.getElementById('addressbookMenulist').selectedItem.value;
				var menuItem = document.createElement("menuitem");
				menuItem.setAttribute("label", "");
				menuItem.setAttribute("value", "");
				myPopup.appendChild(menuItem);
				document.getElementById('contactMenulist').selectedIndex = 0;
				var mySortedContacts = [];
				for (var i = 0; i < cardbookRepository.cardbookDisplayCards[myAddressBookId].length; i++) {
					var myCard = cardbookRepository.cardbookDisplayCards[myAddressBookId][i];
					if (!cardbookUtils.isMyCardAList(myCard)) {
						mySortedContacts.push([myCard.fn, myCard.uid]);
					}
				}
				mySortedContacts = mySortedContacts.sort(function(a,b) {
					return a[0].localeCompare(b[0], 'en', {'sensitivity': 'base'});
				});
				for (var i = 0; i < mySortedContacts.length; i++) {
					var menuItem = document.createElement("menuitem");
					menuItem.setAttribute("label", mySortedContacts[i][0]);
					menuItem.setAttribute("value", mySortedContacts[i][1]);
					myPopup.appendChild(menuItem);
				}
				wdw_cardEdition.contactNotLoaded = false;
			}
		},

		changeAddressbook: function () {
			wdw_cardEdition.removeContacts();
			wdw_cardEdition.workingCard.dirPrefId = document.getElementById('addressbookMenulist').selectedItem.value;
			document.getElementById('dirPrefIdTextBox').value = wdw_cardEdition.workingCard.dirPrefId;
			wdw_cardEdition.listOfCategories = JSON.parse(JSON.stringify(cardbookRepository.cardbookAccountsCategories[wdw_cardEdition.workingCard.dirPrefId]));
			delete wdw_cardEdition.workingCard;
			wdw_cardEdition.workingCard = new cardbookCardParser();
			cardbookUtils.cloneCard(window.arguments[0].cardIn, wdw_cardEdition.workingCard);
			wdw_cardEdition.loadDefaultVersion();
			wdw_cardEdition.displayCard(wdw_cardEdition.workingCard);
		},

		changeContact: function () {
			var myDirPrefId = document.getElementById('addressbookMenulist').selectedItem.value;
			var myUid = document.getElementById('contactMenulist').selectedItem.value;
			if (myUid != null && myUid !== undefined && myUid != "") {
				delete wdw_cardEdition.workingCard;
				wdw_cardEdition.workingCard = new cardbookCardParser();
				cardbookUtils.cloneCard(cardbookRepository.cardbookCards[myDirPrefId+"::"+myUid], wdw_cardEdition.workingCard);
				if (window.arguments[0].editionMode == "AddEmail" ) {
					wdw_cardEdition.workingCard.email.push(wdw_cardEdition.emailToAdd);
				}
			} else {
				delete wdw_cardEdition.workingCard;
				wdw_cardEdition.workingCard = new cardbookCardParser();
				cardbookUtils.cloneCard(window.arguments[0].cardIn, wdw_cardEdition.workingCard);
			}
			wdw_cardEdition.displayCard(wdw_cardEdition.workingCard);
		},

		switchLastnameAndFirstname: function () {
			var tmpValue = document.getElementById('lastnameTextBox').value;
			document.getElementById('lastnameTextBox').value = document.getElementById('firstnameTextBox').value;
			document.getElementById('firstnameTextBox').value = tmpValue;
			document.getElementById('lastnameTextBox').focus();
		},

		displayCard: function (aCard) {
			wdw_cardEdition.clearCard();
			var cardbookPrefService = new cardbookPreferenceService(aCard.dirPrefId);
			cardbookUtils.displayCard(aCard, cardbookPrefService.getReadOnly());
			
			wdw_cardEdition.loadCategories(aCard.categories);
			document.getElementById('photoExtensionTextBox').value = aCard.photo.extension;
			if (!cardbookPrefService.getReadOnly()) {
				cardbookTypes.display40(aCard.version);
			} else {
				cardbookUtils.adjustFields();
				document.getElementById('dirPrefIdTextBox').setAttribute('hidden', 'true');
				document.getElementById('uidTextBox').setAttribute('hidden', 'true');
				document.getElementById('versionTextBox').setAttribute('hidden', 'true');
				document.getElementById('othersTextBox').setAttribute('hidden', 'true');
				document.getElementById('photolocalURITextBox').setAttribute('hidden', 'true');
				document.getElementById('photoURITextBox').setAttribute('hidden', 'true');
				document.getElementById('photoExtensionTextBox').setAttribute('hidden', 'true');
			}
		},

		clearCard: function () {
			cardbookUtils.clearCard();
			wdw_cardEdition.loadCategories([]);
		},

		loadRichContext: function(aEvent)
		{
			if (aEvent.target.inputField) {
				var strBundle = document.getElementById("cardbook-strings");
				var myMenu = document.getAnonymousElementByAttribute(aEvent.target.inputField.parentNode, "anonid", "input-box-contextmenu");
				if (document.getElementById('cardbookSeparator::' + aEvent.target.id)) {
					myMenu.removeChild(document.getElementById('cardbookSeparator::' + aEvent.target.id));
				}
				if (document.getElementById('cardbookToUpperCase::' + aEvent.target.id)) {
					myMenu.removeChild(document.getElementById('cardbookToUpperCase::' + aEvent.target.id));
				}
				if (document.getElementById('cardbookToLowerCase::' + aEvent.target.id)) {
					myMenu.removeChild(document.getElementById('cardbookToLowerCase::' + aEvent.target.id));
				}
	
				var myMenuSeparator = document.createElement("menuseparator");
				myMenuSeparator.setAttribute("id", 'cardbookSeparator::' + aEvent.target.id);
				myMenu.appendChild(myMenuSeparator);
	
				var myMenuItem = document.createElement("menuitem");
				myMenuItem.setAttribute("id", 'cardbookToUpperCase::' + aEvent.target.id);
				myMenuItem.addEventListener("command", function(aEvent)
					{
						var tmpArray = this.id.split('::');
						var myTextbox = document.getElementById(tmpArray[1]);
						var myTextboxValue = myTextbox.value;
						var result = "";
						for (var i = 0; i < myTextboxValue.length; i++) {
							if (i >= myTextbox.selectionStart && i < myTextbox.selectionEnd) {
								result = result + myTextboxValue[i].toUpperCase();
							} else {
								result = result + myTextboxValue[i];
							}
						}
						myTextbox.value = result;
					}, false);
				myMenuItem.setAttribute("label", strBundle.getString("toUpperCase"));
				myMenu.appendChild(myMenuItem);
				if (aEvent.target.getAttribute("readonly") == "true") {
					myMenuItem.disabled = true;
				} else if (aEvent.target.selectionStart == aEvent.target.selectionEnd) {
					myMenuItem.disabled = true;
				} else {
					myMenuItem.disabled = false;
				}
				
				var myMenuItem = document.createElement("menuitem");
				myMenuItem.setAttribute("id", 'cardbookToLowerCase::' + aEvent.target.id);
				myMenuItem.addEventListener("command", function(aEvent)
					{
						var tmpArray = this.id.split('::');
						var myTextbox = document.getElementById(tmpArray[1]);
						var myTextboxValue = myTextbox.value;
						var result = "";
						for (var i = 0; i < myTextboxValue.length; i++) {
							if (i >= myTextbox.selectionStart && i < myTextbox.selectionEnd) {
								result = result + myTextboxValue[i].toLowerCase();
							} else {
								result = result + myTextboxValue[i];
							}
						}
						myTextbox.value = result;
					}, false);
				myMenuItem.setAttribute("label", strBundle.getString("toLowerCase"));
				myMenu.appendChild(myMenuItem);
				if (aEvent.target.getAttribute("readonly") == "true") {
					myMenuItem.disabled = true;
				} else if (aEvent.target.selectionStart == aEvent.target.selectionEnd) {
					myMenuItem.disabled = true;
				} else {
					myMenuItem.disabled = false;
				}
			}
		},
	
		load: function () {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			cardbookRepository.validateLook();
			wdw_cardEdition.loadCssRules();
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			document.getElementById('noteTab').setAttribute("collapsed", !prefs.getBoolPref("extensions.cardbook.noteTabView"));
			document.getElementById('listTab').setAttribute("collapsed", !prefs.getBoolPref("extensions.cardbook.listTabView"));
			document.getElementById('mailPopularityTab').setAttribute("collapsed", !prefs.getBoolPref("extensions.cardbook.mailPopularityTabView"));

			wdw_cardEdition.workingCard = new cardbookCardParser();
			cardbookUtils.cloneCard(window.arguments[0].cardIn, wdw_cardEdition.workingCard);
			wdw_cardEdition.loadAddressBooks(wdw_cardEdition.workingCard.dirPrefId);

			wdw_cardEdition.loadDefaultVersion();
			wdw_cardEdition.displayCard(wdw_cardEdition.workingCard);
			wdw_cardEdition.loadEditionMode();
		},

		saveMailPopularity: function () {
			var i = 0;
			while (true) {
				if (document.getElementById('mailPopularity_' + i + '_row')) {
					var email = document.getElementById('email_' + i + '_Textbox').value;
					var emailValue = document.getElementById('popularity_' + i + '_Textbox').value;
					if (emailValue == "") {
						if (cardbookRepository.cardbookMailPopularityIndex[email]) {
							delete cardbookRepository.cardbookMailPopularityIndex[email];
						}
					} else {
						cardbookRepository.cardbookMailPopularityIndex[email] = emailValue;
					}
					i++;
				} else {
					break;
				}
			}
			if (i > 0) {
				cardbookMailPopularity.writeMailPopularity();
			}
		},

		calculateResult: function (aCard) {
			cardbookUtils.cloneCard(wdw_cardEdition.workingCard, aCard);
			aCard.dirPrefId = document.getElementById('addressbookMenulist').selectedItem.value;

			aCard.version = document.getElementById("versionTextBox").value;
			aCard.categories = wdw_cardEdition.getCategories();
			
			var myOrg = [];
			var aListRows = document.getElementById('orgRows');
			var i = 0;
			while (true) {
				if (document.getElementById('orgRow_' + i)) {
					myOrg.push(document.getElementById('orgTextBox_' + i).value);
					i++;
				} else {
					break;
				}
			}
			if (myOrg.length === 0) {
				aCard.org = document.getElementById('orgTextBox').value;
			} else {
				aCard.org = cardbookUtils.escapeArrays2(myOrg).join(";");
			}
			aCard.title = document.getElementById('titleTextBox').value;
			aCard.role = document.getElementById('roleTextBox').value;

			aCard.fn = cardbookUtils.getDisplayedName(aCard.fn, document.getElementById('fnTextBox').value,
												[aCard.prefixname, aCard.firstname, aCard.othername, aCard.lastname, aCard.suffixname],
												[document.getElementById('prefixnameTextBox').value, document.getElementById('firstnameTextBox').value, document.getElementById('othernameTextBox').value,
													document.getElementById('lastnameTextBox').value, document.getElementById('suffixnameTextBox').value],
												"", aCard.org);
			aCard.lastname = document.getElementById('lastnameTextBox').value;
			aCard.firstname = document.getElementById('firstnameTextBox').value;
			aCard.othername = document.getElementById('othernameTextBox').value;
			aCard.suffixname = document.getElementById('suffixnameTextBox').value;
			aCard.prefixname = document.getElementById('prefixnameTextBox').value;
			aCard.nickname = document.getElementById('nicknameTextBox').value;
			aCard.bday = document.getElementById('bdayTextBox').value;
			aCard.gender = document.getElementById('genderTextBox').value;
			
			aCard.note = document.getElementById('noteTextBox').value;

			aCard.photo = {};
			aCard.photo.types = [];
			aCard.photo.value = "";
			aCard.photo.URI = document.getElementById('photoURITextBox').value;
			aCard.photo.localURI = document.getElementById('photolocalURITextBox').value;
			aCard.photo.extension = document.getElementById('photoExtensionTextBox').value;

			var typesList = [ 'email', 'tel', 'impp', 'url', 'adr' ];
			for (var i in typesList) {
				aCard[typesList[i]] = cardbookTypes.getAllTypes(typesList[i]);
			}

			var othersTemp1 = [];
			for (var i in cardbookRepository.customFields) {
				if (document.getElementById(cardbookRepository.customFields[i] + 'TextBox')) {
					var customValue = document.getElementById(cardbookRepository.customFields[i] + 'TextBox').value
					if (customValue != null && customValue !== undefined && customValue != "") {
						othersTemp1.push(cardbookRepository.customFieldsValue[cardbookRepository.customFields[i]] + ":" + customValue);
					}
				}
			}
			var re = /[\n\u0085\u2028\u2029]|\r\n?/;
			var othersTemp3 = [];
			var othersTemp2 = document.getElementById('othersTextBox').value;
			if (othersTemp2 != null && othersTemp2 !== undefined && othersTemp2 != "") {
				othersTemp3 = othersTemp2.split(re);
			}
			aCard.others = othersTemp1.concat(othersTemp3);

			cardbookUtils.setCalculatedFields(aCard);

			cardbookUtils.parseLists(aCard, wdw_cardEdition.cardbookeditlists.addedCards, document.getElementById('kindTextBox').value);
		},

		saveFinal: function () {
			if (cardbookTypes.validateDynamicTypes() && cardbookTypes.validateMailPopularity() && window.arguments[0].editionMode != "ViewCard") {
				var myOutCard = new cardbookCardParser();
				wdw_cardEdition.calculateResult(myOutCard);
				wdw_cardEdition.saveMailPopularity();
				window.arguments[0].cardOut = myOutCard;
				delete wdw_cardEdition.workingCard;
				close();
			}
		},

		create: function () {
			window.arguments[0].cardEditionAction = "CREATE";
			wdw_cardEdition.saveFinal();
		},

		createAndReplace: function () {
			window.arguments[0].cardEditionAction = "CREATEANDREPLACE";
			wdw_cardEdition.saveFinal();
		},

		save: function () {
			window.arguments[0].cardEditionAction = "SAVE";
			wdw_cardEdition.saveFinal();
		},

		returnKey: function () {
			if (window.arguments[0].editionMode == "ViewResult" || window.arguments[0].editionMode == "ViewResultHideCreate") {
				return;
			}
			wdw_cardEdition.save();
		},

		cancel: function () {
			window.arguments[0].cardEditionAction = "CANCEL";
			close();
		}

	};

};

window.addEventListener("popupshowing", wdw_cardEdition.loadRichContext, true);
