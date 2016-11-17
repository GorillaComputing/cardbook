if ("undefined" == typeof(wdw_findDuplicates)) {
	var wdw_findDuplicates = {
		
		gResults: [],
		gResultsDirPrefId: [],
		gDynamicCss: {},

		deleteCssAllRules: function (aStyleSheet) {
			for (var i = wdw_findDuplicates.gDynamicCss[aStyleSheet.href].length - 1 ; i >= 0; i--) {
				try {
					aStyleSheet.deleteRule(wdw_findDuplicates.gDynamicCss[aStyleSheet.href][i]);
				} catch(e) {}
			}
			wdw_findDuplicates.gDynamicCss[aStyleSheet.href] = [];
		},

		createCssTextBoxRules: function (aStyleSheet, aDirPrefId, aColor) {
			var ruleString = ".cardbookBackgroundColorClass textbox[findDuplicates=color_" + aDirPrefId + "] {-moz-appearance: none !important; background-color: " + aColor + " !important; border: 1px !important;}";
			var ruleIndex = aStyleSheet.insertRule(ruleString, aStyleSheet.cssRules.length);
			wdw_findDuplicates.gDynamicCss[aStyleSheet.href].push(ruleIndex);
		},

		loadCssRules: function () {
			for each (var styleSheet in document.styleSheets) {
				if (styleSheet.href == "chrome://cardbook/skin/findDuplicates.css") {
					wdw_findDuplicates.gDynamicCss[styleSheet.href] = [];
					wdw_findDuplicates.deleteCssAllRules(styleSheet);
					for (var i = 0; i < wdw_findDuplicates.gResultsDirPrefId.length; i++) {
						var dirPrefId = wdw_findDuplicates.gResultsDirPrefId[i];
						var cardbookPrefService = new cardbookPreferenceService(dirPrefId);
						var color = cardbookPrefService.getColor()
						wdw_findDuplicates.createCssTextBoxRules(styleSheet, dirPrefId, color);
					}
					cardbookRepository.reloadCss(styleSheet.href);
				}
			}
		},

		generateCardArray: function (aCard) {
			try {
				var myResultTry = [];
				var myResultSure = [];
				var myFields = [ "firstname" , "lastname" ];
				for (var i = 0; i < myFields.length; i++) {
					if (aCard[myFields[i]] != "") {
						myResultTry.push(aCard[myFields[i]].replace(/([\\\/\:\*\?\"\'\-\<\>\| ]+)/g, "").replace(/([0123456789]+)/g, "").toLowerCase());
					}
				}
				for (var i = 0; i < aCard.email.length; i++) {
					var myCleanEmail = aCard.email[i][0][0].replace(/([\\\/\:\*\?\"\'\-\<\>\| ]+)/g, "").replace(/([0123456789]+)/g, "").toLowerCase();
					var myEmailArray = myCleanEmail.split("@");
					var myEmailArray1 = myEmailArray[0].replace(/([^\+]*)(.*)/, "$1").split(".");
					myResultTry = myResultTry.concat(myEmailArray1);
					myResultSure.push(myCleanEmail);
				}
				for (var i = 0; i < aCard.tel.length; i++) {
					var myTel = aCard.tel[i][0][0].replace(/\D/g, "");
					if (myTel != "") {
						myResultSure.push(myTel);
					}
				}
				myResultTry = cardbookRepository.arrayUnique(myResultTry);
				return {resultTry : myResultTry, resultSure : myResultSure};
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_findDuplicates.generateCardArray error : " + e, "Error");
			}
		},

		compareCardArrayTry: function (aArray1, aArray2) {
			try {
				if (aArray1.length == 1) {
					if (aArray2.length != 1) {
						return false;
					} else if (aArray1[0] == aArray2[0]) {
						return true;
					} else {
						return false;
					}
				} else {
					var count = 0;
					for (var i = 0; i < aArray1.length; i++) {
						for (var j = 0; j < aArray2.length; j++) {
							if (aArray1[i] == aArray2[j]) {
								count++;
								break;
							}
						}
						if (count == 2) {
							return true;
						}
					}
				}
				return false;
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_findDuplicates.compareCardArrayTry error : " + e, "Error");
			}
		},

		compareCardArraySure: function (aArray1, aArray2) {
			try {
				for (var i = 0; i < aArray1.length; i++) {
					for (var j = 0; j < aArray2.length; j++) {
						if (aArray1[i] == aArray2[j]) {
							return true;
							break;
						}
					}
				}
				return false;
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_findDuplicates.compareCardArraySure error : " + e, "Error");
			}
		},

		compareCards: function (aDirPrefId) {
			try {
				var myCardArray = [];
				wdw_findDuplicates.gResults = [];
				var myTmpResultDirPrefId = [];
				wdw_findDuplicates.gResultsDirPrefId = [];
				if (aDirPrefId != null && aDirPrefId !== undefined && aDirPrefId != "") {
					for (var i = 0; i < cardbookRepository.cardbookDisplayCards[aDirPrefId].length; i++) {
						var myCard = cardbookRepository.cardbookDisplayCards[aDirPrefId][i];
						if (!cardbookUtils.isMyCardAList(myCard)) {
							myCardArray.push([wdw_findDuplicates.generateCardArray(myCard), myCard, true]);
						}
					}
				} else {
					for (i in cardbookRepository.cardbookCards) {
						var myCard = cardbookRepository.cardbookCards[i];
						if (!cardbookUtils.isMyCardAList(myCard)) {
							myCardArray.push([wdw_findDuplicates.generateCardArray(myCard), myCard, true]);
						}
					}
				}
				
				for (var i = 0; i < myCardArray.length-1; i++) {
					var myTmpResult = [myCardArray[i][1]];
					for (var j = i+1; j < myCardArray.length; j++) {
						if (myCardArray[j][2] && wdw_findDuplicates.compareCardArrayTry(myCardArray[i][0].resultTry, myCardArray[j][0].resultTry)) {
							myTmpResult.push(myCardArray[j][1]);
							myCardArray[j][2] = false;
						} else if (myCardArray[j][2] && wdw_findDuplicates.compareCardArraySure(myCardArray[i][0].resultSure, myCardArray[j][0].resultSure)) {
							myTmpResult.push(myCardArray[j][1]);
							myCardArray[j][2] = false;
						}
					}
					if (myTmpResult.length > 1) {
						wdw_findDuplicates.gResults.push(myTmpResult);
						myTmpResultDirPrefId = myTmpResultDirPrefId.concat(myTmpResult);
					}
				}
				for (var i = 0; i < myTmpResultDirPrefId.length; i++) {
					wdw_findDuplicates.gResultsDirPrefId.push(myTmpResultDirPrefId[i].dirPrefId);
				}
				wdw_findDuplicates.gResultsDirPrefId = cardbookRepository.arrayUnique(wdw_findDuplicates.gResultsDirPrefId);
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_findDuplicates.compareCards error : " + e, "Error");
			}
		},
		
		saveCard: function (aCard) {
			var cardbookPrefService = new cardbookPreferenceService(aCard.dirPrefId);
			var myDirPrefIdName = cardbookPrefService.getName();
			var myDirPrefIdType = cardbookPrefService.getType();
			var myDirPrefIdUrl = cardbookPrefService.getUrl();
			aCard.uid = cardbookUtils.getUUID();
			cardbookUtils.setCalculatedFields(aCard);

			if (myDirPrefIdType === "CACHE" || myDirPrefIdType === "DIRECTORY") {
				cardbookRepository.addCardToRepository(aCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(aCard, myDirPrefIdType));
			} else if (myDirPrefIdType === "FILE") {
				cardbookRepository.addCardToRepository(aCard, "WINDOW");
				cardbookSynchronization.writeCardsToFile(myDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[aCard.dirPrefId], true);
			} else {
				cardbookUtils.addTagCreated(aCard);
				cardbookUtils.addEtag(aCard, "0");
				cardbookRepository.addCardToRepository(aCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(aCard, myDirPrefIdType));
			}
			cardbookUtils.formatStringForOutput("cardCreatedOK", [myDirPrefIdName, aCard.fn]);
			wdw_cardbooklog.addActivity("cardCreatedOK", [myDirPrefIdName, aCard.fn], "addItem");
		},

		deleteCards: function (aCardList) {
			var listOfFileToRewrite = [];

			for (var i = 0; i < aCardList.length; i++) {
				cardbookUtils.jsInclude(["chrome://cardbook/content/preferences/cardbookPreferences.js"]);
				var cardbookPrefService = new cardbookPreferenceService(aCardList[i].dirPrefId);
				var myDirPrefIdName = cardbookPrefService.getName();
				var myDirPrefIdType = cardbookPrefService.getType();
				if (myDirPrefIdType === "FILE") {
					cardbookRepository.removeCardFromRepository(aCardList[i], false);
					listOfFileToRewrite.push(aCardList[i].dirPrefId);
				} else if (myDirPrefIdType === "CACHE" || myDirPrefIdType === "DIRECTORY") {
					cardbookRepository.removeCardFromRepository(aCardList[i], true);
				} else {
					if (cardbookUtils.searchTagCreated(aCardList[i])) {
						cardbookRepository.removeCardFromRepository(aCardList[i], true);
					} else {
						cardbookUtils.addTagDeleted(aCardList[i]);
						cardbookRepository.addCardToCache(aCardList[i], "WINDOW", cardbookUtils.getFileCacheNameFromCard(aCardList[i]));
						cardbookRepository.removeCardFromRepository(aCardList[i], false);
					}
				}
				cardbookUtils.formatStringForOutput("cardDeletedOK", [myDirPrefIdName, aCardList[i].fn]);
				wdw_cardbooklog.addActivity("cardDeletedOK", [myDirPrefIdName, aCardList[i].fn], "deleteMail");
			}
			
			listOfFileToRewrite = cardbookRepository.arrayUnique(listOfFileToRewrite);
			for (var i = 0; i < listOfFileToRewrite.length; i++) {
				var cardbookPrefService = new cardbookPreferenceService(listOfFileToRewrite[i]);
				var myDirPrefIdUrl = cardbookPrefService.getUrl();
				cardbookSynchronization.writeCardsToFile(myDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[listOfFileToRewrite[i]], true);
			}
		},

		createRow: function (aParent) {
			var aRow = document.createElement('row');
			aParent.appendChild(aRow);
			aRow.setAttribute('align', 'center');
			aRow.setAttribute('flex', '1');
			// dirty hack to have the lines not shrinked on Linux only with blue.css
			aRow.setAttribute('style', 'min-height:32px;');
			return aRow
		},

		createTextbox: function (aRow, aName, aValue, aDirPrefId) {
			var aTextbox = document.createElement('textbox');
			aRow.appendChild(aTextbox);
			aTextbox.setAttribute('id', aName);
			aTextbox.setAttribute('value', aValue);
			aTextbox.setAttribute("findDuplicates", "color_" + aDirPrefId);
		},

		createButton: function (aRow, aName, aLabel) {
			var aButton = document.createElement('button');
			aRow.appendChild(aButton);
			aButton.setAttribute('id', aName);
			aButton.setAttribute('label', aLabel);
			aButton.setAttribute('flex', '1');
			function fireButton(event) {
				var myArgs = {cardsIn: wdw_findDuplicates.gResults[this.id], cardsOut: [], hideCreate: false, action: ""};
				var myWindow = window.openDialog("chrome://cardbook/content/wdw_mergeCards.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.action == "CREATE") {
					wdw_findDuplicates.saveCard(myArgs.cardsOut[0]);
				} else if (myArgs.action == "CREATEANDREPLACE") {
					wdw_findDuplicates.saveCard(myArgs.cardsOut[0]);
					wdw_findDuplicates.deleteCards(myArgs.cardsIn);
				}
				wdw_findDuplicates.load();
			};
			aButton.addEventListener("click", fireButton, false);
			aButton.addEventListener("input", fireButton, false);
		},

		displayResults: function () {
			cardbookElementTools.deleteRows('fieldsVbox');
			var aListRows = document.getElementById('fieldsVbox');
			var strBundle = document.getElementById("cardbook-strings");
			var buttonLabel = strBundle.getString("mergeCardsLabel");

			for (var i = 0; i < wdw_findDuplicates.gResults.length; i++) {
				var aRow = wdw_findDuplicates.createRow(aListRows);
				for (var j = 0; j < wdw_findDuplicates.gResults[i].length; j++) {
					var myCard = wdw_findDuplicates.gResults[i][j];
					wdw_findDuplicates.createTextbox(aRow, i+"::"+j, myCard.fn, myCard.dirPrefId);
				}
				wdw_findDuplicates.createButton(aRow, i, buttonLabel);
			}
			if (wdw_findDuplicates.gResults.length == 0) {
				document.getElementById('noContactsFoundDesc').value = strBundle.getString("noContactsDuplicated");
				document.getElementById('noContactsFoundDesc').hidden = false;
			} else {
				document.getElementById('noContactsFoundDesc').hidden = true;
			}
		},

		load: function () {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			wdw_findDuplicates.compareCards(window.arguments[0].dirPrefId);
			if (!(window.arguments[0].dirPrefId != null && window.arguments[0].dirPrefId !== undefined && window.arguments[0].dirPrefId != "")) {
				wdw_findDuplicates.loadCssRules();
			}
			wdw_findDuplicates.displayResults();
		},

		cancel: function () {
			close();
		}

	};

};