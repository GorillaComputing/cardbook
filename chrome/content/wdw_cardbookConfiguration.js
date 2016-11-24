if ("undefined" == typeof(wdw_cardbookConfiguration)) {
	var wdw_cardbookConfiguration = {

		allTypes: {},
		allOrg: [],
		allMailAccounts: [],
		
		displayMailAccounts: function () {
			var mailAccountsTreeView = {
				get rowCount() { return wdw_cardbookConfiguration.allMailAccounts.length; },
				isContainer: function(idx) { return false },
				cycleHeader: function(idx) { return false },
				isEditable: function(idx, column) {
					if (column.id == "mailAccountsEnabled") return true;
					else return false;
				},
				getCellText: function(idx, column) {
					if (column.id == "mailAccountsEnabled") return wdw_cardbookConfiguration.allMailAccounts[idx][0];
					else if (column.id == "mailAccountsId") return wdw_cardbookConfiguration.allMailAccounts[idx][1];
					else if (column.id == "mailAccountsName") return wdw_cardbookConfiguration.allMailAccounts[idx][2];
					else if (column.id == "mailAccountsFileName") return wdw_cardbookConfiguration.allMailAccounts[idx][3];
					else if (column.id == "mailAccountsDirPrefId") return wdw_cardbookConfiguration.allMailAccounts[idx][4];
					else if (column.id == "mailAccountsUid") return wdw_cardbookConfiguration.allMailAccounts[idx][5];
					else if (column.id == "mailAccountsFn") return wdw_cardbookConfiguration.allMailAccounts[idx][6];
				},
				getCellValue: function(idx, column) {
					if (column.id == "mailAccountsEnabled") return wdw_cardbookConfiguration.allMailAccounts[idx][0];
				},
				setCellValue: function(idx, column) {
					if (column.id == "mailAccountsEnabled") {
						wdw_cardbookConfiguration.allMailAccounts[idx][0] = !wdw_cardbookConfiguration.allMailAccounts[idx][0];
					}
				}
			}
			document.getElementById('mailAccountsTree').view = mailAccountsTreeView;
		},

		loadMailAccounts: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			wdw_cardbookConfiguration.allMailAccounts = [];
			var accounts = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager).accounts;
			var accountsLength = (typeof accounts.Count === 'undefined') ? accounts.length : accounts.Count();
			for (var i = 0; i < accountsLength; i++) {
				var account = accounts.queryElementAt ? accounts.queryElementAt(i, Components.interfaces.nsIMsgAccount) : accounts.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgAccount);
				
				if (!account.incomingServer) {
					continue;
				}
				
				var identitiesLength = (typeof account.identities.Count === 'undefined') ? account.identities.length : account.identities.Count();
				for (var j = 0; j < identitiesLength; j++) {
					var identity = account.identities.queryElementAt ? account.identities.queryElementAt(j, Components.interfaces.nsIMsgIdentity) : account.identities.GetElementAt(j).QueryInterface(Components.interfaces.nsIMsgIdentity);
					var mailAccountServer = account.incomingServer;
					if (mailAccountServer.type == "pop3" || mailAccountServer.type == "imap") {
						var accountPrettyName = mailAccountServer.prettyName; // gets mail account name
						var enabled = cardbookPrefService.getMailAccountEnabled(identity.key);
						var filename = cardbookPrefService.getMailAccountFileName(identity.key);
						var dirPrefId = cardbookPrefService.getMailAccountDirPrefId(identity.key);
						var uid = cardbookPrefService.getMailAccountUid(identity.key);
						if (cardbookRepository.cardbookCards[dirPrefId+"::"+uid]) {
							var fn = cardbookRepository.cardbookCards[dirPrefId+"::"+uid].fn;
						} else {
							var dirPrefId = "";
							var uid = "";
							var fn = "";
						}
						wdw_cardbookConfiguration.allMailAccounts.push([enabled, identity.key, accountPrettyName, filename, dirPrefId, uid, fn]);
					}
				}
			}
		},

		validateMailAccounts: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			var mailAccountTemp = [];
			mailAccountTemp = cardbookPrefService.getAllMailAccounts();
			for (var i = 0; i < wdw_cardbookConfiguration.allMailAccounts.length; i++) {
				cardbookPrefService.setMailAccountEnabled(wdw_cardbookConfiguration.allMailAccounts[i][1], wdw_cardbookConfiguration.allMailAccounts[i][0]);
				cardbookPrefService.setMailAccountFileName(wdw_cardbookConfiguration.allMailAccounts[i][1], wdw_cardbookConfiguration.allMailAccounts[i][3]);
				cardbookPrefService.setMailAccountDirPrefId(wdw_cardbookConfiguration.allMailAccounts[i][1], wdw_cardbookConfiguration.allMailAccounts[i][4]);
				cardbookPrefService.setMailAccountUid(wdw_cardbookConfiguration.allMailAccounts[i][1], wdw_cardbookConfiguration.allMailAccounts[i][5]);
				function filterArray(element) {
					return (element != wdw_cardbookConfiguration.allMailAccounts[i][1]);
				}
				mailAccountTemp = mailAccountTemp.filter(filterArray);
			}
			for (var i = 0; i < mailAccountTemp.length; i++) {
				cardbookPrefService.delMailAccount(mailAccountTemp[i]);
			}
		},

		choosevCard: function () {
			var myTree = document.getElementById('mailAccountsTree');
			if (myTree.currentIndex != -1) {
				var myMailAccountId = myTree.view.getCellText(myTree.currentIndex, {id: "mailAccountsId"});
				var myMailAccountFilename = myTree.view.getCellText(myTree.currentIndex, {id: "mailAccountsFileName"});
				var myArgs = {filename: myMailAccountFilename, cardbookId: "", typeAction: ""};
				var myWindow = window.openDialog("chrome://cardbook/content/wdw_cardbookConfigurationSearchCard.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.typeAction == "SAVE") {
					var tmpArray = myArgs.cardbookId.split("::");
					if (cardbookRepository.cardbookCards[myArgs.cardbookId]) {
						var fn = cardbookRepository.cardbookCards[myArgs.cardbookId].fn;
					} else {
						var fn = "";
					}
					for (var i = 0; i < wdw_cardbookConfiguration.allMailAccounts.length; i++) {
						if (wdw_cardbookConfiguration.allMailAccounts[i][1] == myMailAccountId) {
							wdw_cardbookConfiguration.allMailAccounts[i][0] = true;
							wdw_cardbookConfiguration.allMailAccounts[i][3] = myArgs.filename;
							wdw_cardbookConfiguration.allMailAccounts[i][4] = tmpArray[0];
							wdw_cardbookConfiguration.allMailAccounts[i][5] = tmpArray[1];
							wdw_cardbookConfiguration.allMailAccounts[i][6] = fn;
							break;
						}
					}
					wdw_cardbookConfiguration.displayMailAccounts();
				}
			}
		},

		displayvCard: function () {
			var myTree = document.getElementById('mailAccountsTree');
			if (myTree.currentIndex != -1) {
				var myMailAccountsDirPrefId = myTree.view.getCellText(myTree.currentIndex, {id: "mailAccountsDirPrefId"});
				var myMailAccountsUid = myTree.view.getCellText(myTree.currentIndex, {id: "mailAccountsUid"});
				if (cardbookRepository.cardbookCards[myMailAccountsDirPrefId+"::"+myMailAccountsUid]) {
					var myCard = cardbookRepository.cardbookCards[myMailAccountsDirPrefId+"::"+myMailAccountsUid];
					var myMailAccountFilename = myTree.view.getCellText(myTree.currentIndex, {id: "mailAccountsFileName"});
					var myArgs = {filename: myMailAccountFilename, data: cardbookUtils.getvCardForEmail(myCard)};
					var myWindow = window.openDialog("chrome://cardbook/content/wdw_cardbookConfigurationDisplayCard.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				}
			}
		},

		loadEventEntryTitle: function () {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var eventEntryTitle = prefs.getComplexValue("extensions.cardbook.eventEntryTitle", Components.interfaces.nsISupportsString).data;
			if (eventEntryTitle == "") {
				var strBundle = document.getElementById("cardbook-strings");
				document.getElementById('calendarEntryTitleTextBox').value=strBundle.getString("eventEntryTitleMessage");
			}
		},

		showTab: function () {
			if (window.arguments) {
				if (window.arguments[0].showTab != null && window.arguments[0].showTab !== undefined && window.arguments[0].showTab != "") {
					document.getElementById('advancedPrefs').selectedTab = document.getElementById(window.arguments[0].showTab);
				}
			}
		},

		remindViaPopup: function () {
			if (document.getElementById('showPopupOnStartupCheckBox').checked || document.getElementById('showPeriodicPopupCheckBox').checked) {
				document.getElementById('showPopupEvenIfNoBirthdayCheckBox').disabled=false;
			} else {
				document.getElementById('showPopupEvenIfNoBirthdayCheckBox').disabled=true;
			}
			if (document.getElementById('showPeriodicPopupCheckBox').checked) {
				document.getElementById('periodicPopupTimeTextBox').disabled=false;
				document.getElementById('periodicPopupTimeLabel').disabled=false;
			} else {
				document.getElementById('periodicPopupTimeTextBox').disabled=true;
				document.getElementById('periodicPopupTimeLabel').disabled=true;
			}
		},

		wholeDay: function () {
			if (document.getElementById('calendarEntryWholeDayCheckBox').checked) {
				document.getElementById('calendarEntryTimeTextBox').disabled=true;
				document.getElementById('calendarEntryTimeLabel').disabled=true;
			} else {
				document.getElementById('calendarEntryTimeTextBox').disabled=false;
				document.getElementById('calendarEntryTimeLabel').disabled=false;
			}
		},

		LightningInstallation: function (aValue) {
			document.getElementById('calendarsGoupbox').disabled = aValue;
			document.getElementById('calendarsCheckbox').disabled = aValue;
			document.getElementById('calendarsListbox').disabled = aValue;
			document.getElementById('numberOfDaysForWritingLabel').disabled = aValue;
			document.getElementById('numberOfDaysForWritingTextBox').disabled = aValue;
			document.getElementById('syncWithLightningOnStartupCheckBox').disabled = aValue;
			document.getElementById('calendarEntryTitleLabel').disabled = aValue;
			document.getElementById('calendarEntryTitleTextBox').disabled = aValue;
			if (!aValue) {
				if (document.getElementById('calendarEntryWholeDayCheckBox').checked) {
					document.getElementById('calendarEntryTimeTextBox').disabled=true;
					document.getElementById('calendarEntryTimeLabel').disabled=true;
				} else {
					document.getElementById('calendarEntryTimeTextBox').disabled=false;
					document.getElementById('calendarEntryTimeLabel').disabled=false;
				}
			} else {
				document.getElementById('calendarEntryWholeDayLabel').disabled = aValue;
				document.getElementById('calendarEntryWholeDayCheckBox').disabled = aValue;
				document.getElementById('calendarEntryTimeLabel').disabled = aValue;
				document.getElementById('calendarEntryTimeTextBox').disabled = aValue;
			}
			document.getElementById('calendarEntryAlarmLabel').disabled = aValue;
			document.getElementById('calendarEntryAlarmTextBox').disabled = aValue;
			document.getElementById('calendarEntryCategoriesLabel').disabled = aValue;
			document.getElementById('calendarEntryCategoriesTextBox').disabled = aValue;
		},

		changeCalendarsPref: function () {
			var aCheckBox = document.getElementById('calendarsCheckbox');
			var aListBox = document.getElementById('calendarsListbox');
			var calendarsNameList = [];
			for (var i=0; i<aListBox.itemCount; i++) {
				var aItem = aListBox.getItemAtIndex(i);
				aItem.setAttribute('checked', aCheckBox.checked);
				if (aCheckBox.checked) {
					calendarsNameList.push(aItem.getAttribute('value'));
				}
			}
			var aPref = document.getElementById('extensions.cardbook.calendarsNameList');
			aPref.value = calendarsNameList.join(',');
		},

		changeCalendarPref: function () {
			var aCheckBox = document.getElementById('calendarsCheckbox');
			var aListBox = document.getElementById('calendarsListbox');
			var calendarsNameList = [];
			var totalChecked = 0;
			for (var i=0; i<aListBox.itemCount; i++) {
				var aItem = aListBox.getItemAtIndex(i);
				var aItemChecked = aItem.getAttribute('checked');
				aItemChecked = typeof aItemChecked == "boolean" ? aItemChecked : (aItemChecked == 'true' ? true : false);
				if (aItemChecked) {
					totalChecked++;
					calendarsNameList.push(aItem.getAttribute('value'));
				}
			}
			if (totalChecked === aListBox.itemCount) {
				aCheckBox.checked = true;
			} else {
				aCheckBox.checked = false;
			}
			var aPref = document.getElementById('extensions.cardbook.calendarsNameList');
			aPref.value = calendarsNameList.join(',');
		},
		
		loadCalendars: function (addon) {
			if (addon.isActive) {
				var aCheckBox = document.getElementById('calendarsCheckbox');
				var aListBox = document.getElementById('calendarsListbox');
				var aPref = document.getElementById('extensions.cardbook.calendarsNameList');
		
				var sortedCalendars = [];
				var calendarManager = Components.classes["@mozilla.org/calendar/manager;1"].getService(Components.interfaces.calICalendarManager);
				var calendars = calendarManager.getCalendars({});
				for each (var cal in calendars) {
					sortedCalendars.push([cal.name, cal.id]);
				}
				sortedCalendars = sortedCalendars.sort(function(a,b) {
					return a[0].localeCompare(b[0], 'en', {'sensitivity': 'base'});
				});
		
				var totalChecked = 0;
				for (var i = 0; i < sortedCalendars.length; i++) {
					var aItem = aListBox.appendItem(sortedCalendars[i][0], sortedCalendars[i][1]);
					aItem.setAttribute('type', 'checkbox');
					if (aPref.value.indexOf(sortedCalendars[i][1]) >= 0) {
						totalChecked++;
						aItem.setAttribute('checked', true);
					} else {
						aItem.setAttribute('checked', false);
					}
					aItem.addEventListener("command", function(event) {
							wdw_cardbookConfiguration.changeCalendarPref();
						}, false);
					}
				if (totalChecked === aListBox.itemCount) {
					aCheckBox.checked = true;
				} else {
					aCheckBox.checked = false;
				}
				wdw_cardbookConfiguration.LightningInstallation(false);
			} else {
				wdw_cardbookConfiguration.LightningInstallation(true);
			}
		},
	
		changeAddressBooksPref: function (aCheckboxName) {
			var aCheckBox = document.getElementById(aCheckboxName);
			var aListBox = document.getElementById(aCheckboxName.replace('Checkbox', 'Listbox'));
			var addressBooksNameList = [];

			for (var i=0; i<aListBox.itemCount; i++) {
				var aItem = aListBox.getItemAtIndex(i);
				aItem.setAttribute('checked', aCheckBox.checked);
				if (aCheckBox.checked) {
					addressBooksNameList.push(aItem.getAttribute('value'));
				}
			}

			var aPref = document.getElementById('extensions.cardbook.' + aCheckboxName.replace('Checkbox', ''));
			aPref.value = addressBooksNameList.join(',');
		},

		changeAddressBookPref: function (aCheckboxName) {
			var aCheckBox = document.getElementById(aCheckboxName);
			var aListBox = document.getElementById(aCheckboxName.replace('Checkbox', 'Listbox'));
			var addressBooksNameList = [];
			var totalChecked = 0;

			for (var i=0; i<aListBox.itemCount; i++) {
				var aItem = aListBox.getItemAtIndex(i);
				var aItemChecked = aItem.getAttribute('checked');
				aItemChecked = typeof aItemChecked == "boolean" ? aItemChecked : (aItemChecked == 'true' ? true : false);
				if (aItemChecked) {
					totalChecked++;
					addressBooksNameList.push(aItem.getAttribute('value'));
				}
			}
			
			if (totalChecked === aListBox.itemCount) {
				aCheckBox.checked = true;
			} else {
				aCheckBox.checked = false;
			}

			var aPref = document.getElementById('extensions.cardbook.' + aCheckboxName.replace('Checkbox', ''));
			aPref.value = addressBooksNameList.join(',');
		},
		
		loadAddressBooks: function (aType, aNotReadOnly) {
			var aCheckBox = document.getElementById(aType + 'Checkbox');
			var aListBox = document.getElementById(aType + 'Listbox');
			var aPref = document.getElementById('extensions.cardbook.' + aType);

			var sortedAddressBooks = [];
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (aNotReadOnly) {
					if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][6] && !cardbookRepository.cardbookAccounts[i][7]) {
						sortedAddressBooks.push([cardbookRepository.cardbookAccounts[i][0], cardbookRepository.cardbookAccounts[i][4]]);
					}
				} else {
					if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][6]) {
						sortedAddressBooks.push([cardbookRepository.cardbookAccounts[i][0], cardbookRepository.cardbookAccounts[i][4]]);
					}
				}
			}
			sortedAddressBooks = sortedAddressBooks.sort(function(a,b) {
				return a[0].localeCompare(b[0], 'en', {'sensitivity': 'base'});
			});

			var totalChecked = 0;
			for (var i = 0; i < sortedAddressBooks.length; i++) {
				var aItem = aListBox.appendItem(sortedAddressBooks[i][0], sortedAddressBooks[i][1]);
				aItem.setAttribute('id', aCheckBox.id + '_' + i);
				aItem.setAttribute('type', 'checkbox');
				if ( (aPref.value.indexOf(sortedAddressBooks[i][1]) >= 0) || (aPref.value === "allAddressBooks") ) {
					totalChecked++;
					aItem.setAttribute('checked', true);
				} else {
					aItem.setAttribute('checked', false);
				}
				aItem.addEventListener("command", function(event) {
						var myCheckBoxIdArray = this.id.split('_');
						wdw_cardbookConfiguration.changeAddressBookPref(myCheckBoxIdArray[0]);
					}, false);
			}
			if (totalChecked === aListBox.itemCount) {
				aCheckBox.checked = true;
			} else {
				aCheckBox.checked = false;
			}
		},
	
		validateEventEntryTitle: function () {
			var checkTest = document.getElementById('calendarEntryTitleTextBox').value.split("%S").length - 1;
			if (checkTest != 2) {
				var strBundle = document.getElementById("cardbook-strings");
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
				var errorTitle = strBundle.getString("eventEntryTitleProblemTitle");
				var errorMsg = strBundle.getString("eventEntryTitleProblemMessage") + ' (' + strBundle.getString("eventEntryTitleMessage") + ').';
				prompts.alert(null, errorTitle, errorMsg);
				var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
				str.data = strBundle.getString("eventEntryTitleMessage");
				prefs.setComplexValue("extensions.cardbook.eventEntryTitle", Components.interfaces.nsISupportsString, str);
			}
		},

		//needed for linux
		addAcceptButton: function(e) {
			var buttonAccept = document.documentElement.getButton('accept');
			buttonAccept.hidden = false;
			buttonAccept.disabled = false;
		},

		selectTypes: function() {
			var btnEdit = document.getElementById("renameTypeLabel");
			var myTree = document.getElementById("typesTree");
			if (myTree.view.selection.getRangeCount() > 0) {
				btnEdit.disabled = false;
			} else {
				btnEdit.disabled = true;
			}
			document.getElementById("deleteTypeLabel").disabled = btnEdit.disabled;
		},

		selectOrg: function() {
			var btnEdit = document.getElementById("renameOrgLabel");
			var listBox = document.getElementById("orgListbox");
			if (listBox.selectedCount > 0) {
				btnEdit.disabled = false;
			} else {
				btnEdit.disabled = true;
			}
			document.getElementById("deleteOrgLabel").disabled = btnEdit.disabled;
		},

		loadCustoms: function () {
			for (var i in cardbookRepository.customFields) {
				document.getElementById(cardbookRepository.customFields[i] + 'Name').value = cardbookRepository.customFieldsValue[cardbookRepository.customFields[i]];
				document.getElementById(cardbookRepository.customFields[i] + 'Label').value = cardbookRepository.customFieldsLabel[cardbookRepository.customFields[i]];
			}
		},
		
		refreshListBoxOrg: function () {
			var myListBox = document.getElementById('orgListbox');
			var count = myListBox.itemCount;
			while(count-- > 0){
				myListBox.removeItemAt(0);
			}
			
			if (wdw_cardbookConfiguration.allOrg.length != 0) {
				for (var i = 0; i < wdw_cardbookConfiguration.allOrg.length; i++) {
					var aItem = myListBox.appendItem(wdw_cardbookConfiguration.allOrg[i], wdw_cardbookConfiguration.allOrg[i]);
				}
			}
		},

		loadOrg: function () {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var orgStructure = prefs.getComplexValue("extensions.cardbook.orgStructure", Components.interfaces.nsISupportsString).data;
			if (orgStructure != "") {
				wdw_cardbookConfiguration.allOrg = cardbookUtils.unescapeArray(cardbookUtils.escapeString(orgStructure).split(";"));
			} else {
				wdw_cardbookConfiguration.allOrg = [];
			}
		},
		
		displayOrg: function () {
			wdw_cardbookConfiguration.refreshListBoxOrg();
		},
		
		addOrg: function () {
			var myListBox = document.getElementById('orgListbox');
			var myArgs = {type: "", context: "Org", typeAction: ""};
			var myWindow = window.openDialog("chrome://cardbook/content/wdw_cardbookRenameField.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
			if (myArgs.typeAction == "SAVE" && myArgs.type != "") {
				wdw_cardbookConfiguration.allOrg = [];
				for (var i = 0; i < myListBox.itemCount; i++) {
					wdw_cardbookConfiguration.allOrg.push(myListBox.getItemAtIndex(i).getAttribute("value"));
				}
				wdw_cardbookConfiguration.allOrg.push(myArgs.type);
				wdw_cardbookConfiguration.refreshListBoxOrg();
			}
		},
		
		renameOrg: function () {
			var myListBox = document.getElementById('orgListbox');
			if (myListBox.selectedIndex == -1) {
				return;
			} else {
				var myItem = myListBox.getSelectedItem(0);
				var myArgs = {type: myItem.getAttribute("value"), context: "Org", typeAction: ""};
				var myWindow = window.openDialog("chrome://cardbook/content/wdw_cardbookRenameField.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.typeAction == "SAVE" && myArgs.type != "") {
					wdw_cardbookConfiguration.allOrg = [];
					for (let i = 0; i < myListBox.itemCount; i++) {
						if (i === myListBox.selectedIndex) {
							wdw_cardbookConfiguration.allOrg.push(myArgs.type);
						} else {
							wdw_cardbookConfiguration.allOrg.push(myListBox.getItemAtIndex(i).getAttribute("value"));
						}
					}
					wdw_cardbookConfiguration.refreshListBoxOrg();
				}
			}
		},
		
		deleteOrg: function () {
			var myListBox = document.getElementById('orgListbox');
			if (myListBox.selectedIndex == -1) {
				return;
			} else {
				wdw_cardbookConfiguration.allOrg = [];
				for (let i = 0; i < myListBox.itemCount; i++) {
					if (i !== myListBox.selectedIndex) {
						wdw_cardbookConfiguration.allOrg.push(myListBox.getItemAtIndex(i).getAttribute("value"));
					}
				}
				wdw_cardbookConfiguration.refreshListBoxOrg();
			}
		},
		
		validateOrg: function () {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			str.data = cardbookUtils.escapeArrays2(wdw_cardbookConfiguration.allOrg).join(";");
			prefs.setComplexValue("extensions.cardbook.orgStructure", Components.interfaces.nsISupportsString, str);
		},

		loadPref: function () {
			if (document.getElementById('preferenceTextbox').value == "") {
				var cardbookPrefService = new cardbookPreferenceService();
				document.getElementById('preferenceTextbox').value = cardbookPrefService.getPrefLabel();
			}
			if (document.getElementById('preferenceValueTextbox').value == "") {
				document.getElementById('preferenceValueTextbox').value = cardbookPrefService.getPrefValueLabel();
			}
		},
		
		loadTypes: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			wdw_cardbookConfiguration.allTypes = cardbookPrefService.getAllTypes();
		},
		
		displayTypes: function () {
			var typesTreeView = {
				typeField: document.getElementById('typesCategoryRadiogroup').selectedItem.value,
				get rowCount() { 
					if (wdw_cardbookConfiguration.allTypes[this.typeField]) {
						return wdw_cardbookConfiguration.allTypes[this.typeField].length;
					} else {
						return 0;
					}
				},
				isContainer: function(idx) { return false },
				cycleHeader: function(idx) { return false },
				isEditable: function(idx, column) { return false },
				getCellText: function(idx, column) {
					if (column.id == "typesCode") return wdw_cardbookConfiguration.allTypes[this.typeField][idx][0];
					else if (column.id == "typesLabel") return wdw_cardbookConfiguration.allTypes[this.typeField][idx][1];
				}
			}
			document.getElementById('typesTree').view = typesTreeView;
			wdw_cardbookConfiguration.selectTypes();
		},
		
		addType: function () {
			var type = document.getElementById('typesCategoryRadiogroup').selectedItem.value;
			var myArgs = {code: "", label: "", typeAction: ""};
			var myWindow = window.openDialog("chrome://cardbook/content/wdw_cardbookAddType.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
			if (myArgs.typeAction == "SAVE") {
				wdw_cardbookConfiguration.allTypes[type].push([myArgs.code, myArgs.label]);
				wdw_cardbookConfiguration.allTypes[type] = wdw_cardbookConfiguration.allTypes[type].sort(function(a,b) {
					return a[1].localeCompare(b[1], 'en', {'sensitivity': 'base'});
				});
				wdw_cardbookConfiguration.displayTypes();
			}
		},
		
		renameType: function () {
			var type = document.getElementById('typesCategoryRadiogroup').selectedItem.value;
			var myTree = document.getElementById('typesTree');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myCode = myTree.view.getCellText(myTree.currentIndex, {id: "typesCode"});
				var myLabel = myTree.view.getCellText(myTree.currentIndex, {id: "typesLabel"});
				var myArgs = {code: myCode, label: myLabel, typeAction: ""};
				var myWindow = window.openDialog("chrome://cardbook/content/wdw_cardbookAddType.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.typeAction == "SAVE") {
					var result = [];
					for (let i = 0; i < wdw_cardbookConfiguration.allTypes[type].length; i++) {
						if (myCode === wdw_cardbookConfiguration.allTypes[type][i][0]) {
							result.push([myArgs.code, myArgs.label]);
						} else {
							result.push(wdw_cardbookConfiguration.allTypes[type][i]);
						}
					}
					wdw_cardbookConfiguration.allTypes[type] = JSON.parse(JSON.stringify(result));
					wdw_cardbookConfiguration.allTypes[type] = wdw_cardbookConfiguration.allTypes[type].sort(function(a,b) {
						return a[1].localeCompare(b[1], 'en', {'sensitivity': 'base'});
					});
					wdw_cardbookConfiguration.displayTypes();
				}
			}
		},
		
		deleteType: function () {
			var type = document.getElementById('typesCategoryRadiogroup').selectedItem.value;
			var myTree = document.getElementById('typesTree');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myCode = myTree.view.getCellText(myTree.currentIndex, {id: "typesCode"});
				var result = [];
				for (let i = 0; i < wdw_cardbookConfiguration.allTypes[type].length; i++) {
					if (myCode !== wdw_cardbookConfiguration.allTypes[type][i][0]) {
						result.push(wdw_cardbookConfiguration.allTypes[type][i]);
					}
				}
				wdw_cardbookConfiguration.allTypes[type] = JSON.parse(JSON.stringify(result));
				wdw_cardbookConfiguration.displayTypes();
			}
		},
		
		validateTypes: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			cardbookPrefService.delTypes();
			for (var i in wdw_cardbookConfiguration.allTypes) {
				for (var j = 0; j < wdw_cardbookConfiguration.allTypes[i].length; j++) {
					cardbookPrefService.setTypes(i, j, wdw_cardbookConfiguration.allTypes[i][j][0] + ":" + wdw_cardbookConfiguration.allTypes[i][j][1]);
				}
			}
		},

		loadPeriodicSync: function () {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var autoSync = prefs.getBoolPref("extensions.cardbook.autoSync");
			if (!(autoSync)) {
				document.getElementById('autoSyncInterval').disabled = true;
				document.getElementById('autoSyncIntervalTextBox').disabled = true;
			}
		},

		validateCustomFieldName: function (aValue) {
			var strBundle = document.getElementById("cardbook-strings");
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
			var customFieldsErrorTitle = strBundle.getString("customFieldsError");
			if (aValue.toUpperCase() !== aValue) {
				var customFieldsErrorMsg = strBundle.getFormattedString("customFieldsErrorUPPERCASE", [aValue]);
				prompts.alert(null, customFieldsErrorTitle, customFieldsErrorMsg);
				return false;
			} else if (!(aValue.toUpperCase().startsWith("X-"))) {
				var customFieldsErrorMsg = strBundle.getFormattedString("customFieldsErrorX", [aValue]);
				prompts.alert(null, customFieldsErrorTitle, customFieldsErrorMsg);
				return false;
			} else if (aValue.toUpperCase() === "X-THUNDERBIRD-ETAG") {
				var customFieldsErrorMsg = strBundle.getFormattedString("customFieldsErrorETAG", [aValue]);
				prompts.alert(null, customFieldsErrorTitle, customFieldsErrorMsg);
				return false;
			} else if (aValue.indexOf(":") >= 1 || aValue.indexOf(",") >= 1 || aValue.indexOf(";") >= 1 || aValue.indexOf(".") >= 1) {
				var customFieldsErrorMsg = strBundle.getFormattedString("customFieldsErrorCHAR", [aValue]);
				prompts.alert(null, customFieldsErrorTitle, customFieldsErrorMsg);
				return false;
			}
			return true;
		},
		
		validateUniqueCustomFieldName: function (aList) {
			if (cardbookUtils.cleanArray(aList).length !== cardbookUtils.cleanArray(cardbookRepository.arrayUnique(aList)).length) {
				var strBundle = document.getElementById("cardbook-strings");
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
				var customFieldsErrorTitle = strBundle.getString("customFieldsError");
				var customFieldsErrorMsg = strBundle.getString("customFieldsErrorUNIQUE");
				prompts.alert(null, customFieldsErrorTitle, customFieldsErrorMsg);
				return false;
			}
			return true;
		},
		
		validateCustoms: function () {
			var allcustomFieldNames = [];
			for (var i in cardbookRepository.customFields) {
				var name = document.getElementById(cardbookRepository.customFields[i] + 'Name');
				var nameValue = name.value;
				var label = document.getElementById(cardbookRepository.customFields[i] + 'Label');
				var labelValue = label.value;
				allcustomFieldNames.push(nameValue);
				if (nameValue != null && nameValue !== undefined && nameValue != "") {
					if (wdw_cardbookConfiguration.validateCustomFieldName(nameValue)) {
						if (!(labelValue != null && labelValue !== undefined && labelValue != "")) {
							var strBundle = document.getElementById("cardbook-strings");
							var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
							var customFieldsErrorTitle = strBundle.getString("customFieldsError");
							var customFieldsErrorMsg = strBundle.getString("customFieldsErrorLABEL");
							prompts.alert(null, customFieldsErrorTitle, customFieldsErrorMsg);
							return false;
						}
					} else {
						return false;
					}
				}
			}
			var customLists = ['kindCustom', 'memberCustom'];
			for (var i in customLists) {
				var nameValue = document.getElementById(customLists[i] + 'TextBox').value;
				allcustomFieldNames.push(nameValue);
				if (!(wdw_cardbookConfiguration.validateCustomFieldName(nameValue))) {
					return false;
				}
			}
			if (!(wdw_cardbookConfiguration.validateUniqueCustomFieldName(allcustomFieldNames))) {
				return false;
			}
			wdw_cardbookConfiguration.setCustoms();
			return true;
		},
		
		setCustoms: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			cardbookPrefService.delCustoms();
			for (var i in cardbookRepository.customFields) {
				var name = document.getElementById(cardbookRepository.customFields[i] + 'Name');
				var nameValue = name.value;
				var label = document.getElementById(cardbookRepository.customFields[i] + 'Label');
				var labelValue = label.value;
				if (nameValue != null && nameValue !== undefined && nameValue != "") {
					cardbookPrefService.setCustoms(cardbookRepository.customFields[i], nameValue + ":" + labelValue);
					cardbookRepository.customFieldsLabel[cardbookRepository.customFields[i]] = labelValue;
				} else {
					cardbookPrefService.setCustoms(cardbookRepository.customFields[i], "");
					cardbookRepository.customFieldsLabel[cardbookRepository.customFields[i]] = "";
				}
				cardbookRepository.customFieldsValue[cardbookRepository.customFields[i]] = nameValue;
			}
		},
		
		validateStatusInformationLineNumber: function () {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			if (document.getElementById('statusInformationLineNumberTextBox').value < 10) {
				document.getElementById('statusInformationLineNumberTextBox').value = 10;
			}
			while (cardbookRepository.statusInformation.length > document.getElementById('statusInformationLineNumberTextBox').value) {
				cardbookRepository.statusInformation.splice(0,1);
			}
		},

		showautoSyncInterval: function () {
			if (document.getElementById('autoSyncCheckBox').checked) {
				document.getElementById('autoSyncInterval').disabled = false;
				document.getElementById('autoSyncIntervalTextBox').disabled = false;
			} else {
				document.getElementById('autoSyncInterval').disabled = true;
				document.getElementById('autoSyncIntervalTextBox').disabled = true;
			}
		},

		load: function () {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			wdw_cardbookConfiguration.addAcceptButton();
			wdw_cardbookConfiguration.loadTypes();
			wdw_cardbookConfiguration.displayTypes();
			wdw_cardbookConfiguration.loadPref();
			wdw_cardbookConfiguration.loadOrg();
			wdw_cardbookConfiguration.displayOrg();
			wdw_cardbookConfiguration.loadPeriodicSync();
			wdw_cardbookConfiguration.loadCustoms();
			wdw_cardbookConfiguration.loadAddressBooks("emailsCollection", true);
			wdw_cardbookConfiguration.loadAddressBooks("addressBooksNameList", false);
			wdw_cardbookConfiguration.loadMailAccounts();
			wdw_cardbookConfiguration.displayMailAccounts();
			Components.utils.import("resource://gre/modules/AddonManager.jsm");  
			AddonManager.getAddonByID(cardbookBirthdaysUtils.LIGHTNING_ID, wdw_cardbookConfiguration.loadCalendars);
			wdw_cardbookConfiguration.remindViaPopup();
			wdw_cardbookConfiguration.loadEventEntryTitle();
			wdw_cardbookConfiguration.showTab();
		},
		
		accept: function () {
			wdw_cardbookConfiguration.validateStatusInformationLineNumber();
			wdw_cardbookConfiguration.validateTypes();
			wdw_cardbookConfiguration.validateOrg();
			wdw_cardbookConfiguration.validateMailAccounts();
			wdw_cardbookConfiguration.validateEventEntryTitle();
			ovl_cardbookLayout.orientPanes();
			if (!(wdw_cardbookConfiguration.validateCustoms())) {
				// don't work
				// return false;
				throw "CardBook validation error";
			}
			cardbookRepository.validateLook(document.getElementById('defaultLookCheckBox').checked);
		},
		

		cancel: function () {
			close();
		}
	};
};