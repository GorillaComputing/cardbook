if ("undefined" == typeof(cardbookTypes)) {
	var cardbookTypes = {
		
		validateDynamicTypes: function () {
			var limit = 100;
			var typesList = [ 'email', 'tel', 'impp', 'url', 'adr' ];
			for (var i in typesList) {
				if (document.getElementById(typesList[i] + 'Groupbox')) {
					var aListRows = document.getElementById(typesList[i] + 'Groupbox');
					var j = 0;
					while (true) {
						if (document.getElementById(typesList[i] + '_' + j + '_prefWeightBox')) {
							var field = document.getElementById(typesList[i] + '_' + j + '_prefWeightBoxLabel').value.toLowerCase();
							var data = document.getElementById(typesList[i] + '_' + j + '_prefWeightBox').value;
							var dummy = data.replace(/[0-9]*/g, "");
							if (data == "") {
								j++;
								continue;
							} else if (dummy == "") {
								if (data >=1 && data <= limit) {
									j++;
									continue;
								}
							}
							var strBundle = document.getElementById("cardbook-strings");
							var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
							var errorTitle = strBundle.getString("errorTitle");
							var validateIntegerMsg = strBundle.getFormattedString("validateIntegerMsg", [field, limit, data]);
							prompts.alert(null, errorTitle, validateIntegerMsg);
							return false;
						} else {
							break;
						}
					}
				}
			}
			return true;
		},

		validateMailPopularity: function () {
			var limit = 100000;
			var i = 0;
			while (true) {
				if (document.getElementById('mailPopularity_' + i + '_row')) {
					var field = document.getElementById('mailPopularityTab').label.toLowerCase();
					var data = document.getElementById('popularity_' + i + '_Textbox').value;
					var dummy = data.replace(/[0-9]*/g, "");
					if (data == "") {
						i++;
						continue;
					} else if (dummy == "") {
						if (data >=1 && data <= limit) {
							i++;
							continue;
						}
					}
					var strBundle = document.getElementById("cardbook-strings");
					var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
					var errorTitle = strBundle.getString("errorTitle");
					var validateIntegerMsg = strBundle.getFormattedString("validateIntegerMsg", [field, limit, data]);
					prompts.alert(null, errorTitle, validateIntegerMsg);
					return false;
				} else {
					break;
				}
			}
			return true;
		},

		getTypeForLine: function (aType, aIndex) {
			var myLineResult = [];
			var myLineTypeResult = [];
			
			var myPrefBox = document.getElementById(aType + '_' + aIndex + '_prefCheckbox');
			if (document.getElementById('versionTextBox').value === "4.0") {
				if (myPrefBox.checked) {
					var aPrefWeightBoxValue = document.getElementById(aType + '_' + aIndex + '_prefWeightBox').value;
					if (aPrefWeightBoxValue != null && aPrefWeightBoxValue !== undefined && aPrefWeightBoxValue != "") {
						myLineTypeResult.push("PREF=" + aPrefWeightBoxValue);
					} else {
						myLineTypeResult.push("PREF");
					}
				}
			} else {
				if (myPrefBox.checked) {
					myLineTypeResult.push("TYPE=PREF");
				}
			}
			var myLineOtherType = document.getElementById(aType + '_' + aIndex + '_othersTypesBox').value;
			if (myLineOtherType != null && myLineOtherType !== undefined && myLineOtherType != "") {
				myLineTypeResult = myLineTypeResult.concat(myLineOtherType.split(','));
			}
			
			var j = 0;
			var myLineTypeType = [];
			while (true) {
				if (document.getElementById(aType + '_' + aIndex + '_typeBox_' + j)) {
					var myTypeBox = document.getElementById(aType + '_' + aIndex + '_typeBox_' + j);
					if (myTypeBox.checked) {
						var cardbookPrefService = new cardbookPreferenceService();
						var myTypeValue = cardbookPrefService.getTypeCode(aType, myTypeBox.label);
						myLineTypeType.push("TYPE=" + myTypeValue);
					}
					j++;
				} else {
					break;
				}
			}
			var myLinepgTypeType = [];
			if (document.getElementById(aType + '_' + aIndex + '_pgtypeBox')) {
				var mypgTypeBox = document.getElementById(aType + '_' + aIndex + '_pgtypeBox');
				if (mypgTypeBox.checked) {
					var mypgTypeValue = document.getElementById(aType + '_' + aIndex + '_pgtypeBoxLabel').value;
					myLinepgTypeType.push(mypgTypeValue);
				}
			}
			
			if (myLineTypeType.length > 0) {
				myLineTypeResult = myLineTypeResult.concat(myLineTypeType);
				var myOutputPg = [];
				var myPgName = "";
			} else if (myLinepgTypeType.length > 0) {
				var myOutputPg = myLinepgTypeType;
				var myPgName = document.getElementById(aType + '_' + aIndex + '_pgNameBox').value;
			} else {
				var myOutputPg = [];
				var myPgName = "";
			}
			
			if (aType == "adr") {
				var j = 0;
				var myLineTypeValue = [];
				while (true) {
					if (document.getElementById(aType + '_' + aIndex + '_valueBox_' + j)) {
						var myTypeValue = document.getElementById(aType + '_' + aIndex + '_valueBox_' + j).value.replace(/\\n/g, "\n");
						myLineTypeValue.push(myTypeValue);
						j++;
					} else {
						break;
					}
				}
			} else {
				var myLineTypeValue = [document.getElementById(aType + '_' + aIndex + '_valueBox').value];
			}
			
			return [myLineTypeValue, myLineTypeResult, myPgName, myOutputPg];
		},

		getAllTypes: function (aType) {
			var i = 0;
			var myResult = [];
			while (true) {
				if (document.getElementById(aType + '_' + i + '_hbox')) {
					var lineResult = cardbookTypes.getTypeForLine(aType, i);
					if (lineResult[0].join("") != "") {
						myResult.push(lineResult);
					}
					i++;
				} else {
					break;
				}
			}
			return myResult;
		},

		disableButtons: function (aType, aIndex, aVersion) {
			for (var i = 0; i < aIndex; i++) {
				document.getElementById(aType + '_' + i + '_' + aVersion + '_cardbookaddButton').disabled = true;
				document.getElementById(aType + '_' + i + '_' + aVersion + '_cardbookdownButton').disabled = false;
			}
			document.getElementById(aType + '_' + aIndex + '_' + aVersion + '_cardbookdownButton').disabled = true;
			document.getElementById(aType + '_0_' + aVersion + '_cardbookupButton').disabled = true;
		},

		findNextLine: function (aType) {
			var i = 0;
			while (true) {
				if (document.getElementById(aType + '_' + i + '_hbox') || document.getElementById(aType + '_' + i + '_row')) {
					i++;
				} else {
					return i;
				}
			}
		},

		constructDynamicRows: function (aType, aArray, aVersion) {
			var start = cardbookTypes.findNextLine(aType);
			for (var i = 0; i < aArray.length; i++) {
				cardbookTypes.loadDynamicTypes(aType, i+start, aArray[i][1], aArray[i][2], aArray[i][3], aArray[i][0], aVersion);
			}
			if (aArray.length == 0) {
				cardbookTypes.loadDynamicTypes(aType, start, [], "", [], [""], aVersion);
			}
		},

		constructDynamicMailPopularity: function (aArray) {
			for (var i = 0; i < aArray.length; i++) {
				cardbookTypes.loadDynamicMailPopularity(i, aArray[i]);
			}
		},

		constructStaticRows: function (aType, aArray, aVersion) {
			for (var i = 0; i < aArray.length; i++) {
				cardbookTypes.loadStaticTypes(aType, i, aArray[i][1], aArray[i][2], aArray[i][3], aArray[i][0], aVersion);
			}
			if (aArray.length == 0) {
				cardbookTypes.loadStaticTypes(aType, 0, [], "", [], [""], aVersion);
			}
		},

		constructStaticMailPopularity: function (aArray) {
			for (var i = 0; i < aArray.length; i++) {
				cardbookTypes.loadStaticMailPopularity(i, aArray[i]);
			}
		},

		display40: function (aVersion) {
			var typesList = [ 'email', 'tel', 'impp', 'url', 'adr' ];
			for (var i in typesList) {
				if (document.getElementById(typesList[i] + 'Groupbox')) {
					var j = 0;
					while (true) {
						if (document.getElementById(typesList[i] + '_' + j + '_prefWeightBox')) {
							var myPrefWeightBoxLabel = document.getElementById(typesList[i] + '_' + j + '_prefWeightBoxLabel');
							var myPrefWeightBox = document.getElementById(typesList[i] + '_' + j + '_prefWeightBox');
							if (aVersion === "4.0") {
								myPrefWeightBoxLabel.removeAttribute('hidden');
								myPrefWeightBox.removeAttribute('hidden');
							} else {
								myPrefWeightBoxLabel.setAttribute('hidden', 'true');
								myPrefWeightBox.setAttribute('hidden', 'true');
							}
							if (document.getElementById(typesList[i] + '_' + j + '_prefCheckbox').checked) {
								myPrefWeightBoxLabel.removeAttribute('readonly');
							} else {
								myPrefWeightBoxLabel.setAttribute('readonly', 'true');
							}
							j++;
						} else {
							break;
						}
					}
				}
			}
		},

		constructOrg: function (aReadOnly, aOrgValue, aTitleValue, aRoleValue, aCustomField1OrgValue, aCustomField1OrgLabel, aCustomField2OrgValue, aCustomField2OrgLabel) {
			var strBundle = document.getElementById("cardbook-strings");
			var aOrigBox = document.getElementById('orgRows');
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var orgStructure = prefs.getComplexValue("extensions.cardbook.orgStructure", Components.interfaces.nsISupportsString).data;
			var currentRow;
			if (orgStructure != "") {
				var myOrgStructure = cardbookUtils.unescapeArray(cardbookUtils.escapeString(orgStructure).split(";"));
				var myOrgValue = cardbookUtils.unescapeArray(cardbookUtils.escapeString(aOrgValue).split(";"));
				for (var i = 0; i < myOrgStructure.length; i++) {
					var myValue = "";
					if (myOrgValue[i]) {
						myValue = myOrgValue[i];
					}
					if (aReadOnly) {
						if (myValue != "") {
							currentRow = cardbookTypes.addRow(aOrigBox, 'orgRow_' + i);
							cardbookTypes.addLabel(currentRow, 'orgLabel_' + i, myOrgStructure[i], 'orgTextBox_' + i, {class: 'header'});
							cardbookElementTools.addTextbox(currentRow, 'orgTextBox_' + i, myValue, {flex: '1', readonly: 'true'});
						}
					} else {
						currentRow = cardbookTypes.addRow(aOrigBox, 'orgRow_' + i);
						cardbookTypes.addLabel(currentRow, 'orgLabel_' + i, myOrgStructure[i], 'orgTextBox_' + i, {class: 'header'});
						cardbookElementTools.addTextbox(currentRow, 'orgTextBox_' + i, myValue, {flex: '1'});
					}
				}
			} else {
				if (aReadOnly) {
					if (aOrgValue != "") {
						currentRow = cardbookTypes.addRow(aOrigBox, 'orgRow');
						cardbookTypes.addLabel(currentRow, 'orgLabel', strBundle.getString("orgLabel"), 'orgTextBox', {class: 'header'});
						cardbookElementTools.addTextbox(currentRow, 'orgTextBox', aOrgValue, {flex: '1', readonly: 'true'});
					}
				} else {
					currentRow = cardbookTypes.addRow(aOrigBox, 'orgRow');
					cardbookTypes.addLabel(currentRow, 'orgLabel', strBundle.getString("orgLabel"), 'orgTextBox', {class: 'header'});
					cardbookElementTools.addTextbox(currentRow, 'orgTextBox', aOrgValue, {flex: '1'});
				}
			}
			if (aReadOnly) {
				if (aTitleValue != "") {
					currentRow = cardbookTypes.addRow(aOrigBox, 'titleRow');
					cardbookTypes.addLabel(currentRow, 'titleLabel', strBundle.getString("titleLabel"), 'titleTextBox', {class: 'header'});
					cardbookElementTools.addTextbox(currentRow, 'titleTextBox', aTitleValue, {flex: '1', readonly: 'true'});
				}
				if (aRoleValue != "") {
					currentRow = cardbookTypes.addRow(aOrigBox, 'roleRow');
					cardbookTypes.addLabel(currentRow, 'roleLabel', strBundle.getString("roleLabel"), 'roleTextBox', {class: 'header'});
					cardbookElementTools.addTextbox(currentRow, 'roleTextBox', aRoleValue, {flex: '1', readonly: 'true'});
				}
				if (aCustomField1OrgValue != "") {
					currentRow = cardbookTypes.addRow(aOrigBox, 'customField1OrgRow');
					cardbookTypes.addLabel(currentRow, 'customField1OrgLabel', aCustomField1OrgLabel, 'customField1OrgTextBox', {class: 'header'});
					cardbookElementTools.addTextbox(currentRow, 'customField1OrgTextBox', aCustomField1OrgValue, {flex: '1', readonly: 'true'});
				}
				if (aCustomField2OrgValue != "") {
					currentRow = cardbookTypes.addRow(aOrigBox, 'customField2OrgRow');
					cardbookTypes.addLabel(currentRow, 'customField2OrgLabel', aCustomField2OrgLabel, 'customField2OrgTextBox', {class: 'header'});
					cardbookElementTools.addTextbox(currentRow, 'customField2OrgTextBox', aCustomField2OrgValue, {flex: '1', readonly: 'true'});
				}
			} else {
				currentRow = cardbookTypes.addRow(aOrigBox, 'titleRow');
				cardbookTypes.addLabel(currentRow, 'titleLabel', strBundle.getString("titleLabel"), 'titleTextBox', {class: 'header'});
				cardbookElementTools.addTextbox(currentRow, 'titleTextBox', aTitleValue, {flex: '1'});
				currentRow = cardbookTypes.addRow(aOrigBox, 'roleRow');
				cardbookTypes.addLabel(currentRow, 'roleLabel', strBundle.getString("roleLabel"), 'roleTextBox', {class: 'header'});
				cardbookElementTools.addTextbox(currentRow, 'roleTextBox', aRoleValue, {flex: '1'});
				if (aCustomField1OrgLabel != "") {
					currentRow = cardbookTypes.addRow(aOrigBox, 'customField1OrgRow');
					cardbookTypes.addLabel(currentRow, 'customField1OrgLabel', aCustomField1OrgLabel, 'customField1OrgTextBox', {class: 'header'});
					cardbookElementTools.addTextbox(currentRow, 'customField1OrgTextBox', aCustomField1OrgValue, {flex: '1'});
				}
				if (aCustomField2OrgLabel != "") {
					currentRow = cardbookTypes.addRow(aOrigBox, 'customField2OrgRow');
					cardbookTypes.addLabel(currentRow, 'customField2OrgLabel', aCustomField2OrgLabel, 'customField2OrgTextBox', {class: 'header'});
					cardbookElementTools.addTextbox(currentRow, 'customField2OrgTextBox', aCustomField2OrgValue, {flex: '1'});
				}
			}
		},

		addRow: function (aOrigBox, aId) {
			var aRow = document.createElement('row');
			aOrigBox.appendChild(aRow);
			aRow.setAttribute('id', aId);
			aRow.setAttribute('align', 'center');
			return aRow;
		},

		addLabel: function (aOrigBox, aId, aValue, aControl, aParameters) {
			var aLabel = document.createElement('label');
			aOrigBox.appendChild(aLabel);
			aLabel.setAttribute('id', aId);
			aLabel.setAttribute('value', aValue);
			aLabel.setAttribute('control', aControl);
			for (var prop in aParameters) {
				aLabel.setAttribute(prop, aParameters[prop]);
			}
		},

		loadDynamicTypes: function (aType, aIndex, aInputTypes, aPgName, aPgType, aCardValue, aVersion) {
			var strBundle = document.getElementById("cardbook-strings");
			var aOrigBox = document.getElementById(aType + 'Groupbox');
			
			if (aIndex == 0) {
				cardbookElementTools.addCaption(aType, aOrigBox);
			}
			
			var aHBox = cardbookElementTools.addHBox(aType, aIndex, aOrigBox);

			var cardbookPrefService = new cardbookPreferenceService();
			var myPrefTypes = [];
			myPrefTypes = cardbookPrefService.getAllTypesByType(aType);
			var myInputTypes = [];
			myInputTypes = cardbookUtils.getOnlyTypesFromTypes(aInputTypes);
			var myOthersTypes = cardbookUtils.getNotTypesFromTypes(aInputTypes);
			
			var aPrefBox = document.createElement('checkbox');
			aHBox.appendChild(aPrefBox);
			aPrefBox.setAttribute('id', aType + '_' + aIndex + '_prefCheckbox');
			aPrefBox.setAttribute('checked', cardbookUtils.getPrefBooleanFromTypes(aInputTypes));
			aPrefBox.setAttribute('label', cardbookPrefService.getPrefLabel());

			cardbookTypes.addLabel(aHBox, aType + '_' + aIndex + '_prefWeightBoxLabel', cardbookPrefService.getPrefValueLabel(), aType + '_' + aIndex + '_prefWeightBox', {tooltip: strBundle.getString("prefWeightTooltip")});
			cardbookElementTools.addTextbox(aHBox, aType + '_' + aIndex + '_prefWeightBox', cardbookUtils.getPrefValueFromTypes(aInputTypes, document.getElementById('versionTextBox').value), {size: "5"});
			if (aPrefBox.checked) {
				document.getElementById(aType + '_' + aIndex + '_prefWeightBoxLabel').disabled = false;
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').disabled = false;
			} else {
				document.getElementById(aType + '_' + aIndex + '_prefWeightBoxLabel').disabled = true;
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').disabled = true;
			}

			function firePrefCheckBox(event) {
				var myIdArray = this.id.split('_');
				var myPrefWeightBoxLabel = document.getElementById(myIdArray[0] + '_' + myIdArray[1] + '_prefWeightBoxLabel');
				var myPrefWeightBox = document.getElementById(myIdArray[0] + '_' + myIdArray[1] + '_prefWeightBox');
				if (this.checked) {
					myPrefWeightBoxLabel.disabled = false;
					myPrefWeightBox.disabled = false;
				} else {
					myPrefWeightBoxLabel.disabled = true;
					myPrefWeightBox.disabled = true;
				}
				myPrefWeightBox.value = "";
			};
			aPrefBox.addEventListener("command", firePrefCheckBox, false);

			if (document.getElementById('versionTextBox').value === "4.0") {
				document.getElementById(aType + '_' + aIndex + '_prefWeightBoxLabel').removeAttribute('hidden');
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').removeAttribute('hidden');
			} else {
				document.getElementById(aType + '_' + aIndex + '_prefWeightBoxLabel').setAttribute('hidden', 'true');
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').setAttribute('hidden', 'true');
			}

			cardbookElementTools.addTextbox(aHBox, aType + '_' + aIndex + '_othersTypesBox', myOthersTypes, {hidden: "true"});

			var checked = false;
			for (var i = 0; i < myPrefTypes.length; i++) {
				var aCheckbox = document.createElement('checkbox');
				aHBox.appendChild(aCheckbox);
				aCheckbox.setAttribute('id', aType + '_' + aIndex + '_typeBox_' + i);
				aCheckbox.setAttribute('checked', false);
				aCheckbox.setAttribute('label', myPrefTypes[i][1]);
				aCheckbox.setAttribute('tooltip', strBundle.getString("typesTooltip"));
				for (var j = 0; j < myInputTypes.length; j++) {
					if (myInputTypes[j].toLowerCase() == myPrefTypes[i][0].toLowerCase()) {
						aCheckbox.setAttribute('checked', true);
						var removed = myInputTypes.splice(j, 1);
						checked = true;
						break;
					}
				}
				for (var j = 0; j < aPgType.length; j++) {
					if (aPgType[j].toLowerCase() == myPrefTypes[i][0].toLowerCase()) {
						aCheckbox.setAttribute('checked', true);
						checked = true;
						break;
					}
				}
			}
			for (var j = 0; j < myInputTypes.length; j++) {
				var index = i+j;
				var aCheckbox = document.createElement('checkbox');
				aHBox.appendChild(aCheckbox);
				aCheckbox.setAttribute('id', aType + '_' + aIndex + '_typeBox_' + index);
				aCheckbox.setAttribute('checked', true);
				aCheckbox.setAttribute('label', myInputTypes[j]);
				aCheckbox.setAttribute('tooltip', strBundle.getString("typesTooltip"));
				checked = true;
			}
			if (!checked && aPgType.length != 0 && aPgName != "") {
				var aCheckbox = document.createElement('checkbox');
				aHBox.appendChild(aCheckbox);
				aCheckbox.setAttribute('id', aType + '_' + aIndex + '_pgtypeBox');
				aCheckbox.setAttribute('checked', true);
				aCheckbox.setAttribute('label', aPgType[0]);
				cardbookElementTools.addTextbox(aHBox, aType + '_' + aIndex + '_pgNameBox', aPgName, {hidden: "true"});
			}

			cardbookElementTools.addTextbox(aHBox, aType + '_' + aIndex + '_valueBox', aCardValue.join(" "), {flex: "1"});
			if (aType == "adr") {
				function fireEditAdr(event) {
					var myIdArray = this.id.split('_');
					var myArgs = {version: document.getElementById('versionTextBox').value, adrLine: [], action: ""};
					var myTempResult = cardbookTypes.getTypeForLine(myIdArray[0], myIdArray[1]);
					if (myTempResult.length == 0) {
						myArgs.adrLine = [ ["", "", "", "", "", "", ""], [""], "", [""] ];
					} else {
						myArgs.adrLine = myTempResult;
					}
					var myWindow = window.openDialog("chrome://cardbook/content/cardEdition/wdw_adrEdition.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
					var myAllValuesArray = cardbookTypes.getAllTypes(myIdArray[0]);
					cardbookElementTools.deleteRowsType(myIdArray[0]);
					if (myAllValuesArray.length == 0) {
						cardbookTypes.constructDynamicRows(myIdArray[0], [myArgs.adrLine], myIdArray[2]);
					} else {
						var removed = myAllValuesArray.splice(myIdArray[1], 1, myArgs.adrLine);
						cardbookTypes.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
					}
				};
				document.getElementById(aType + '_' + aIndex + '_valueBox').addEventListener("click", fireEditAdr, false);
				document.getElementById(aType + '_' + aIndex + '_valueBox').addEventListener("input", fireEditAdr, false);
			}
		
			for (var i = 0; i < aCardValue.length; i++) {
				cardbookElementTools.addTextbox(aHBox, aType + '_' + aIndex + '_valueBox_' + i, aCardValue[i].replace(/\n/g, "\\n"), {hidden: "true"});
			}
			
			function fireUpButton(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				var myIdArray = this.id.split('_');
				var myAllValuesArray = cardbookTypes.getAllTypes(myIdArray[0]);
				if (myAllValuesArray.length <= 1) {
					return;
				}
				var temp = myAllValuesArray[myIdArray[1]*1-1];
				myAllValuesArray[myIdArray[1]*1-1] = myAllValuesArray[myIdArray[1]];
				myAllValuesArray[myIdArray[1]] = temp;
				cardbookElementTools.deleteRowsType(myIdArray[0]);
				cardbookTypes.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
			};
			cardbookElementTools.addEditButton(aHBox, aType, aIndex, aVersion, "up", fireUpButton);
			
			function fireDownButton(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				var myIdArray = this.id.split('_');
				var myAllValuesArray = cardbookTypes.getAllTypes(myIdArray[0]);
				if (myAllValuesArray.length <= 1) {
					return;
				}
				var temp = myAllValuesArray[myIdArray[1]*1+1];
				myAllValuesArray[myIdArray[1]*1+1] = myAllValuesArray[myIdArray[1]];
				myAllValuesArray[myIdArray[1]] = temp;
				cardbookElementTools.deleteRowsType(myIdArray[0]);
				cardbookTypes.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
			};
			cardbookElementTools.addEditButton(aHBox, aType, aIndex, aVersion, "down", fireDownButton);

			function fireRemoveButton(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				var myIdArray = this.id.split('_');
				var myAllValuesArray = cardbookTypes.getAllTypes(myIdArray[0]);
				cardbookElementTools.deleteRowsType(myIdArray[0]);
				if (myAllValuesArray.length == 0) {
					cardbookTypes.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
				} else {
					var removed = myAllValuesArray.splice(myIdArray[1], 1);
					cardbookTypes.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
				}
			};
			cardbookElementTools.addEditButton(aHBox, aType, aIndex, aVersion, "remove", fireRemoveButton);
			
			function fireAddButton(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				var myIdArray = this.id.split('_');
				var myValue = document.getElementById(myIdArray[0] + '_' + myIdArray[1] + '_valueBox').value;
				if (myValue == "") {
					return;
				}
				var myNextIndex = 1+ 1*myIdArray[1];
				cardbookTypes.loadDynamicTypes(myIdArray[0], myNextIndex, [], "", [], [""], myIdArray[2]);
			};
			cardbookElementTools.addEditButton(aHBox, aType, aIndex, aVersion, "add", fireAddButton);

			cardbookTypes.disableButtons(aType, aIndex, aVersion);
		},

		loadStaticTypes: function (aType, aIndex, aInputTypes, aPgName, aPgType, aCardValue, aVersion) {
			if (aCardValue.join(" ") == "") {
				return;
			}
			var strBundle = document.getElementById("cardbook-strings");
			var aOrigBox = document.getElementById(aType + 'Groupbox');
			
			if (aIndex == 0) {
				cardbookElementTools.addCaption(aType, aOrigBox);
			}
			
			var aRow = document.createElement('row');
			aOrigBox.appendChild(aRow);
			aRow.setAttribute('id', aType + '_' + aIndex + '_row');
			aRow.setAttribute('flex', '1');
			aRow.setAttribute('align', 'center');
			aRow.setAttribute('context', aType + 'TreeContextMenu');
			function fireClick(event) {
				if (wdw_cardbook) {
					wdw_cardbook.chooseActionTreeForClick(event)
				}
			};
			aRow.addEventListener("click", fireClick, false);

			var myInputTypes = [];
			myInputTypes = cardbookUtils.getOnlyTypesFromTypes(aInputTypes);
			var cardbookPrefService = new cardbookPreferenceService();
			var myDisplayedTypes = [];
			for (let i = 0; i < myInputTypes.length; i++) {
				myDisplayedTypes.push(cardbookPrefService.getTypeLabel(aType, myInputTypes[i]));
			}
			if (aPgType[0] != "") {
				myDisplayedTypes.push(aPgType[0]);
			}
			
			var aPrefImage = document.createElement('image');
			aRow.appendChild(aPrefImage);
			aPrefImage.setAttribute('id', aType + '_' + aIndex + '_prefCheckbox');
			aPrefImage.setAttribute('context', aType + 'TreeContextMenu');
			if (cardbookUtils.getPrefBooleanFromTypes(aInputTypes)) {
				aPrefImage.setAttribute('class', 'cardbookPrefClass');
			} else {
				aPrefImage.setAttribute('class', 'cardbookNotPrefClass');
			}

			cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_prefWeightBox', cardbookUtils.getPrefValueFromTypes(aInputTypes, document.getElementById('versionTextBox').value),
										{context: aType + 'TreeContextMenu', readonly: 'true'});
			if (document.getElementById('versionTextBox').value === "4.0") {
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').setAttribute('hidden', 'false');
			} else {
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').setAttribute('hidden', 'true');
			}

			myInputTypes = myInputTypes.concat(aPgType);
			cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_typeBox', myDisplayedTypes.join(" "), {context: aType + 'TreeContextMenu', readonly: 'true'});

			cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_valueBox', aCardValue.join(" "), {context: aType + 'TreeContextMenu', flex: '1'});
			if (aType == "url" || aType == "email" || aType == "adr") {
				document.getElementById(aType + '_' + aIndex + '_valueBox').setAttribute('link', 'true');
			} else {
				document.getElementById(aType + '_' + aIndex + '_valueBox').setAttribute('readonly', 'true');
			}
		},

		loadStaticMailPopularity: function (aIndex, aInputTypes) {
			var aOrigRows = document.getElementById('mailPopularityRows');
			
			var aRow = document.createElement('row');
			aOrigRows.appendChild(aRow);
			aRow.setAttribute('id', 'mailPopularity_' + aIndex + '_row');
			aRow.setAttribute('flex', '1');

			var myEmail = aInputTypes[0][0].toLowerCase(); 
			if (cardbookRepository.cardbookMailPopularityIndex[myEmail]) {
				var mailPopularityValue = cardbookRepository.cardbookMailPopularityIndex[myEmail];
			} else {
				var mailPopularityValue = "";
			}
			cardbookElementTools.addTextbox(aRow, 'popularity_' + aIndex + '_Textbox', mailPopularityValue, {readonly: 'true'});
			cardbookElementTools.addTextbox(aRow, 'email_' + aIndex + '_Textbox', myEmail, {readonly: 'true'});
		},

		loadDynamicMailPopularity: function (aIndex, aInputTypes) {
			var aOrigRows = document.getElementById('mailPopularityRows');
			
			var aRow = document.createElement('row');
			aOrigRows.appendChild(aRow);
			aRow.setAttribute('id', 'mailPopularity_' + aIndex + '_row');
			aRow.setAttribute('flex', '1');

			var myEmail = aInputTypes[0][0].toLowerCase(); 
			if (cardbookRepository.cardbookMailPopularityIndex[myEmail]) {
				var mailPopularityValue = cardbookRepository.cardbookMailPopularityIndex[myEmail];
			} else {
				var mailPopularityValue = "";
			}
			cardbookElementTools.addTextbox(aRow, 'popularity_' + aIndex + '_Textbox', mailPopularityValue);
			cardbookElementTools.addTextbox(aRow, 'email_' + aIndex + '_Textbox', myEmail);
		},

		getEmailsFromCards: function (aCard) {
			var result = [];
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var preferEmailPref = prefs.getBoolPref("extensions.cardbook.preferEmailPref");
			var listOfEmail = cardbookUtils.getDisplayNameAndEmailFromCards([aCard], preferEmailPref);
			for (var i = 0; i < listOfEmail.length; i++) {
				result.push(listOfEmail[i][1]);
			}
			return result;
		},

		loadStaticList: function (aCard) {
			cardbookElementTools.deleteRows('addedCardsBox');
			var strBundle = document.getElementById("cardbook-strings");
			var aOrigBox = document.getElementById('addedCardsBox');
			
			var addedCards = [];
			if (aCard.version == "4.0") {
				for (var i = 0; i < aCard.member.length; i++) {
					var uid = aCard.member[i].replace("urn:uuid:", "");
					if (cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+uid]) {
						var cardFound = cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+uid];
						if (cardbookUtils.isMyCardAList(cardFound)) {
							addedCards.push([cardFound.fn, [""], cardFound.dirPrefId+"::"+cardFound.uid]);
						} else {
							addedCards.push([cardFound.fn, cardbookTypes.getEmailsFromCards(cardFound), cardFound.dirPrefId+"::"+cardFound.uid]);
						}
					}
				}
			} else if (aCard.version == "3.0") {
				var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				var kindCustom = prefs.getComplexValue("extensions.cardbook.kindCustom", Components.interfaces.nsISupportsString).data;
				var memberCustom = prefs.getComplexValue("extensions.cardbook.memberCustom", Components.interfaces.nsISupportsString).data;
				for (var i = 0; i < aCard.others.length; i++) {
					var localDelim1 = aCard.others[i].indexOf(":",0);
					if (localDelim1 >= 0) {
						var header = aCard.others[i].substr(0,localDelim1);
						var trailer = aCard.others[i].substr(localDelim1+1,aCard.others[i].length);
						if (header == memberCustom) {
							if (cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+trailer.replace("urn:uuid:", "")]) {
								var cardFound = cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+trailer.replace("urn:uuid:", "")];
								if (cardbookUtils.isMyCardAList(cardFound)) {
									addedCards.push([cardFound.fn, [""], cardFound.dirPrefId+"::"+cardFound.uid]);
								} else {
									addedCards.push([cardFound.fn, cardbookTypes.getEmailsFromCards(cardFound), cardFound.dirPrefId+"::"+cardFound.uid]);
								}
							}
						}
					}
				}
			}

			for (var i = 0; i < addedCards.length; i++) {
				var aRow = document.createElement('row');
				aOrigBox.appendChild(aRow);
				aRow.setAttribute('id', addedCards[i][2] + '_row');
				aRow.setAttribute('flex', '1');
				aRow.setAttribute('align', 'center');
				aRow.setAttribute('context', 'listsContextMenu');
				function fireDblClick(event) {
					var myId = this.id.replace(/_row$/, "");
					var myCardToDisplay = cardbookRepository.cardbookCards[myId];
					wdw_cardbook.editCardFromCard(myCardToDisplay)
					var myCardToRefresh = cardbookRepository.cardbookCards[document.getElementById('dirPrefIdTextBox').value+"::"+document.getElementById('uidTextBox').value];
					cardbookTypes.loadStaticList(myCardToRefresh);
				};
				aRow.addEventListener("dblclick", fireDblClick, false);
	
				cardbookElementTools.addTextbox(aRow, addedCards[i][2] + '_fnBox', addedCards[i][0], {context: 'listsContextMenu', readonly: 'true'});
	
				cardbookElementTools.addTextbox(aRow, addedCards[i][2] + '_mailBox', addedCards[i][1].join(" "), {context: 'listsContextMenu', flex: '1', readonly: 'true'});
			}
		}

	};

};