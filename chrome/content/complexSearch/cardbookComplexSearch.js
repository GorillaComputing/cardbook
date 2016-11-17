if ("undefined" == typeof(cardbookComplexSearch)) {
	var cardbookComplexSearch = {
		matchAll: false,
		
		isMyCardFound: function (aCard) {
			var myRegexp;
			var inverse;
			var myField = [];
			var result;
		
			function buildRegExp(aCard, aCase, aField, aTerm, aValue) {
				myField = cardbookUtils.getCardValueByField(aCard, aField);
				if (aTerm == "Contains") {
					myRegexp = new RegExp("(.*)" + aValue + "(.*)", aCase);
					inverse = false;
				} else if (aTerm == "DoesntContain") {
					myRegexp = new RegExp("(.*)" + aValue + "(.*)", aCase);
					inverse = true;
				} else if (aTerm == "Is") {
					myRegexp = new RegExp("^" + aValue + "$", aCase);
					inverse = false;
				} else if (aTerm == "Isnt") {
					myRegexp = new RegExp("^" + aValue + "$", aCase);
					inverse = true;
				} else if (aTerm == "BeginsWith") {
					myRegexp = new RegExp("^" + aValue + "(.*)", aCase);
					inverse = false;
				} else if (aTerm == "EndsWith") {
					myRegexp = new RegExp("(.*)" + aValue + "$", aCase);
					inverse = false;
				} else if (aTerm == "IsEmpty") {
					myRegexp = new RegExp("^$", aCase);
					inverse = false;
				} else if (aTerm == "IsntEmpty") {
					myRegexp = new RegExp("^$", aCase);
					inverse = true;
				}
			};

			for (var i = 0; i < cardbookRepository.cardbookComplexRules.length; i++) {
				buildRegExp(aCard, cardbookRepository.cardbookComplexRules[i][0], cardbookRepository.cardbookComplexRules[i][1], cardbookRepository.cardbookComplexRules[i][2], cardbookRepository.cardbookComplexRules[i][3]);
				function searchArray(element) {
					return element.search(myRegexp) != -1;
				};
				if (myField.length == 0) {
					if (cardbookRepository.cardbookComplexRules[i][2] == "IsEmpty") {
						var found = true;
					} else if (cardbookRepository.cardbookComplexRules[i][2] == "IsntEmpty") {
						var found = true;
					}
				} else if (myField.find(searchArray) == undefined) {
					var found = false;
				} else {
					var found = true;
				}
				
				if (cardbookRepository.cardbookComplexMatchAll) {
					result = true;
					if ((!found && !inverse) || (found && inverse)) {
						result = false;
						break;
					}
				} else {
					result = false;
					if ((found && !inverse) || (!found && inverse)) {
						result = true;
						break;
					}
				}
			}
			return result;
		},

		searchEngine: function () {
			var myAddressBook = document.getElementById('addressbookMenulist').selectedItem.value;
			cardbookRepository.cardbookComplexRules = cardbookComplexSearch.getAllArray("searchTerms");
			cardbookRepository.cardbookComplexMatchAll = document.getElementById('booleanAndGroup').selectedItem.value == "and" ? true : false;
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][6]) {
					var myDirPrefId = cardbookRepository.cardbookAccounts[i][4];
					if ((myAddressBook == myDirPrefId) || (myAddressBook === "allAddressBooks")) {
						var myDirPrefName = cardbookUtils.getPrefNameFromPrefId(myDirPrefId);
						for (var j = 0; j < cardbookRepository.cardbookDisplayCards[myDirPrefId].length; j++) {
							var myCard = cardbookRepository.cardbookDisplayCards[myDirPrefId][j];
							if (cardbookComplexSearch.isMyCardFound(myCard)) {
								cardbookRepository.cardbookDisplayCards[cardbookRepository.cardbookSearchValue].push(myCard);
							}
						}
					}
				}
			}
		},

		loadAddressBooks: function () {
			var myPopup = document.getElementById("addressbookMenupopup");
			cardbookElementTools.deleteRows('addressbookMenupopup');
			var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
			var strBundle = stringBundleService.createBundle("chrome://messenger/locale/addressbook/addressBook.properties");
			var menuItem = document.createElement("menuitem");
			menuItem.setAttribute("label", strBundle.GetStringFromName("allAddressBooks"));
			menuItem.setAttribute("value", "allAddressBooks");
			myPopup.appendChild(menuItem);
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][6]) {
					var menuItem = document.createElement("menuitem");
					menuItem.setAttribute("label", cardbookRepository.cardbookAccounts[i][0]);
					menuItem.setAttribute("value", cardbookRepository.cardbookAccounts[i][4]);
					myPopup.appendChild(menuItem);
				}
			}
			document.getElementById("addressbookMenulist").selectedIndex = 0;
		},

		getAllArray: function (aType) {
			var i = 0;
			var myResult = [];
			while (true) {
				if (document.getElementById(aType + '_' + i + '_hbox')) {
					var mySearchCase = document.getElementById(aType + '_' + i + '_menulistCase').selectedItem.value;
					var mySearchObj = document.getElementById(aType + '_' + i + '_menulistObj').selectedItem.value;
					var mySearchTerm = document.getElementById(aType + '_' + i + '_menulistTerm').selectedItem.value;
					var mySearchValue = document.getElementById(aType + '_' + i + '_valueBox').value;
					myResult.push([mySearchCase, mySearchObj, mySearchTerm, mySearchValue]);
					i++;
				} else {                                                                             
					break;
				}
			}
			return myResult;
		},

		enableOrDisableAllTerms: function (aType, aValue) {
			var i = 0;
			while (true) {
				if (document.getElementById(aType + '_' + i + '_hbox')) {
					document.getElementById(aType + '_' + i + '_menulistObj').disabled=aValue;
					document.getElementById(aType + '_' + i + '_menulistTerm').disabled=aValue;
					document.getElementById(aType + '_' + i + '_valueBox').disabled=aValue;
					i++;
				} else {                                                                             
					break;
				}
			}
			document.getElementById("booleanAndGroup").disabled=aValue;
			document.getElementById("addressbookMenulist").disabled=aValue;
		},

		showOrHideForEmpty: function (aId) {
			var myIdArray = aId.split('_');
			if (document.getElementById(aId).selectedItem.value == "IsEmpty" || document.getElementById(aId).selectedItem.value == "IsntEmpty") {
				document.getElementById(myIdArray[0] + '_' + myIdArray[1] + '_valueBox').hidden = true;
				document.getElementById(myIdArray[0] + '_' + myIdArray[1] + '_menulistCase').hidden = true;
			} else {
				document.getElementById(myIdArray[0] + '_' + myIdArray[1] + '_valueBox').hidden = false;
				document.getElementById(myIdArray[0] + '_' + myIdArray[1] + '_menulistCase').hidden = false;
			}
		},

		loadDynamicTypes: function (aType, aIndex, aArray, aVersion) {
			var strBundle = document.getElementById("cardbook-strings");
			var aOrigBox = document.getElementById(aType + 'Groupbox');
			
			if (aIndex == 0) {
				cardbookElementTools.addCaption(aType, aOrigBox);
			}
			
			var aHBox = cardbookElementTools.addHBox(aType, aIndex, aOrigBox);

			cardbookElementTools.addMenuCaselist(aHBox, aType, aIndex, aArray[0]);
			cardbookElementTools.addMenuObjlist(aHBox, aType, aIndex, aArray[1]);
			cardbookElementTools.addMenuTermlist(aHBox, aType, aIndex, aArray[2]);
			cardbookElementTools.addTextbox(aHBox, aType + '_' + aIndex + '_valueBox', aArray[3], {hidden: "false"});

			function fireUpButton(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				var myIdArray = this.id.split('_');
				var myAllValuesArray = cardbookComplexSearch.getAllArray(myIdArray[0]);
				if (myAllValuesArray.length <= 1) {
					return;
				}
				var temp = myAllValuesArray[myIdArray[1]*1-1];
				myAllValuesArray[myIdArray[1]*1-1] = myAllValuesArray[myIdArray[1]];
				myAllValuesArray[myIdArray[1]] = temp;
				cardbookElementTools.deleteRowsType(myIdArray[0]);
				cardbookComplexSearch.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
			};
			cardbookElementTools.addEditButton(aHBox, aType, aIndex, aVersion, "up", fireUpButton);
			
			function fireDownButton(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				var myIdArray = this.id.split('_');
				var myAllValuesArray = cardbookComplexSearch.getAllArray(myIdArray[0]);
				if (myAllValuesArray.length <= 1) {
					return;
				}
				var temp = myAllValuesArray[myIdArray[1]*1+1];
				myAllValuesArray[myIdArray[1]*1+1] = myAllValuesArray[myIdArray[1]];
				myAllValuesArray[myIdArray[1]] = temp;
				cardbookElementTools.deleteRowsType(myIdArray[0]);
				cardbookComplexSearch.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
			};
			cardbookElementTools.addEditButton(aHBox, aType, aIndex, aVersion, "down", fireDownButton);

			function fireRemoveButton(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				var myIdArray = this.id.split('_');
				var myAllValuesArray = cardbookComplexSearch.getAllArray(myIdArray[0]);
				cardbookElementTools.deleteRowsType(myIdArray[0]);
				if (myAllValuesArray.length == 0) {
					cardbookComplexSearch.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
				} else {
					var removed = myAllValuesArray.splice(myIdArray[1], 1);
					cardbookComplexSearch.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
				}
			};
			cardbookElementTools.addEditButton(aHBox, aType, aIndex, aVersion, "remove", fireRemoveButton);
			
			function fireAddButton(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				var myIdArray = this.id.split('_');
				var myValue = document.getElementById(myIdArray[0] + '_' + myIdArray[1] + '_valueBox').value;
				var myTerm = document.getElementById(myIdArray[0] + '_' + myIdArray[1] + '_menulistTerm').selectedItem.value;
				if (myValue == "" && myTerm !== "IsEmpty" && myTerm !== "IsntEmpty") {
					return;
				}
				var myNextIndex = 1+ 1*myIdArray[1];
				cardbookComplexSearch.loadDynamicTypes(myIdArray[0], myNextIndex, ["","","",""], myIdArray[2]);
			};
			cardbookElementTools.addEditButton(aHBox, aType, aIndex, aVersion, "add", fireAddButton);

			cardbookTypes.disableButtons(aType, aIndex, aVersion);
			cardbookComplexSearch.showOrHideForEmpty(aType + '_' + aIndex + '_menulistTerm');
		},

		constructDynamicRows: function (aType, aArray, aVersion) {
			cardbookElementTools.deleteRowsType(aType);
			for (var i = 0; i < aArray.length; i++) {
				cardbookComplexSearch.loadDynamicTypes(aType, i, aArray[i], aVersion);
			}
			if (aArray.length == 0) {
				cardbookComplexSearch.loadDynamicTypes(aType, 0, ["","","",""], aVersion);
			}
		},

		setStartLabel: function () {
			var gSearchBundle = document.getElementById("bundle_search");
			var gSearchButton = document.getElementById("cardbookComplexSearchButton");
			gSearchButton.setAttribute("label", gSearchBundle.getString("labelForSearchButton"));
			gSearchButton.setAttribute("accesskey", gSearchBundle.getString("labelForSearchButton.accesskey"));
		},

		setStopLabel: function () {
			var gSearchBundle = document.getElementById("bundle_search");
			var gSearchButton = document.getElementById("cardbookComplexSearchButton");
			gSearchButton.setAttribute("label", gSearchBundle.getString("labelForStopButton"));
			gSearchButton.setAttribute("accesskey", gSearchBundle.getString("labelForStopButton.accesskey"));
		},

		initComplexSearch: function () {
			wdw_cardbook.setComplexSearchMode();
			cardbookComplexSearch.setStartLabel();
			cardbookComplexSearch.enableOrDisableAllTerms("searchTerms", false);
			cardbookComplexSearch.loadAddressBooks();
			cardbookComplexSearch.constructDynamicRows("searchTerms", [["","","",""]], "3.0");
			document.getElementById('searchTerms_0_valueBox').focus();
		},

		search: function (aEvent) {
			var gSearchBundle = document.getElementById("bundle_search");
			if (aEvent.target.label == gSearchBundle.getString("labelForSearchButton")) {
				cardbookComplexSearch.startSearch();
			} else {
				cardbookComplexSearch.stopSearch();
			}
		},
		
		startSearch: function () {
			cardbookComplexSearch.setStopLabel();
			cardbookComplexSearch.enableOrDisableAllTerms("searchTerms", true);
			cardbookRepository.cardbookSearchValue=cardbookRepository.cardbookComplexSearchMode;
			cardbookRepository.cardbookDisplayCards[cardbookRepository.cardbookSearchValue] = [];
			cardbookComplexSearch.searchEngine();
			cardbookComplexSearch.stopSearch();
		},
		
		stopSearch: function () {
			cardbookComplexSearch.setStartLabel();
			cardbookComplexSearch.enableOrDisableAllTerms("searchTerms", false);
		},

		clearSearch: function () {
			cardbookComplexSearch.stopSearch();
			cardbookRepository.cardbookSearchValue=cardbookRepository.cardbookComplexSearchMode;
			cardbookRepository.cardbookDisplayCards[cardbookRepository.cardbookSearchValue] = [];
			cardbookComplexSearch.constructDynamicRows("searchTerms", [["","","",""]], "3.0");
		}

	};
};
