if ("undefined" == typeof(cardbookUtils)) {
	var cardbookUtils = {
		
		jsInclude: function(files, target) {
			var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
			for (var i = 0; i < files.length; i++) {
				try {
					loader.loadSubScript(files[i], target);
				}
				catch(e) {
					loader.loadSubScript("chrome://cardbook/content/wdw_log.js");
					wdw_cardbooklog.updateStatusProgressInformation("cardbookUtils.jsInclude : failed to include '" + files[i] + "'\n" + e + "\n");
					dump("cardbookUtils.jsInclude : failed to include '" + files[i] + "'\n" + e + "\n");
				}
			}
		},

		formatCategories: function (aCategory) {
			function filterCategories(element) {
				return (element != cardbookRepository.cardbookUncategorizedCards);
			}
			return cardbookRepository.arrayUnique(aCategory.filter(filterCategories));
		},

		sumElements: function (aObject) {
			var sum = 0;
			for (var i in aObject) {
				sum = sum + aObject[i];
			}
			return sum;
		},
		
		arrayUnique2D: function (aArray) {
			for (var i=0; i<aArray.length; i++) {
				var listI = aArray[i];
				loopJ: for (var j=0; j<aArray.length; j++) {
					var listJ = aArray[j];
					if (listI === listJ) continue; //Ignore itself
					for (var k=listJ.length; k>=0; k--) {
						if (listJ[k] !== listI[k]) continue loopJ;
					}
					// At this point, their values are equal.
					aArray.splice(j, 1);
				}
			}
			return aArray;
		},
		
		splitLine: function (vString) {
			var lLineLength = 75;
			var lResult = "";
			while (vString.length) {
				if (lResult == "") {
					lResult = vString.substr(0, lLineLength);
					vString = vString.substr(lLineLength);
				} else {
					lResult = lResult + "\r\n " + vString.substr(0, lLineLength - 1);
					vString = vString.substr(lLineLength - 1);
				}
			}
			return lResult;
		},
	
		undefinedToBlank: function (vString1) {
			if (vString1 != null && vString1 !== undefined && vString1 != "") {
				return vString1;
			} else {
				return "";
			}
		},

		notNull: function (vArray1, vArray2) {
			var vString1 = vArray1.join("");
			if (vString1 != null && vString1 !== undefined && vString1 != "") {
				return vArray1;
			} else {
				return vArray2;
			}
		},

		appendArrayToVcardData: function (aInitialValue, aField, aVersion, aArray) {
			var aResultValue = aInitialValue;
			for (let i = 0; i < aArray.length; i++) {
				if (aArray[i][2] != null && aArray[i][2] !== undefined && aArray[i][2] != "") {
					if (cardbookUtils.getPrefBooleanFromTypes(aArray[i][1])) {
						if (aVersion == "4.0") {
							var lString = "PREF=" + cardbookUtils.getPrefValueFromTypes(aArray[i][1], aVersion) + ":";
						} else {
							var lString = "TYPE=PREF:";
						}
					} else {
						var lString = "";
					}
					aResultValue = this.appendToVcardData(aResultValue, aArray[i][2] + "." + aField, false, lString + this.escapeArrays2(aArray[i][0]).join(";"));
					aResultValue = this.appendToVcardData(aResultValue, aArray[i][2] + ".X-ABLABEL", false, aArray[i][3][0]);
				} else {
					var lString = aArray[i][1].join(";");
					if (lString != "") {
						lString = lString + ":";
					}
					aResultValue = this.appendToVcardData(aResultValue, aField, false, lString + this.escapeArrays2(aArray[i][0]).join(";"));
				}
			}
			return aResultValue;
		},
		
		appendToVcardData: function (vString1, vString2, vBool1, vString3) {
			var lResult = "";
			if (vBool1) {
				lResult = vString1 + vString2 + "\r\n";
			} else {
				if (vString3 != null && vString3 !== undefined && vString3 != "") {
					if (vString2 != null && vString2 !== undefined && vString2 != "") {
						var lString4 = vString3.toUpperCase();
						if (lString4.indexOf("TYPE=") != -1 || lString4.indexOf("PREF") != -1 || lString4.indexOf("ENCODING=") != -1 || lString4.indexOf("VALUE=") != -1) {
							lResult = vString1 + this.splitLine(vString2 + ";" + vString3) + "\r\n";
						} else {
							lResult = vString1 + this.splitLine(vString2 + ":" + vString3) + "\r\n";
						}
					} else {
						lResult = vString1 + this.splitLine(vString3) + "\r\n";
					}
				} else {
					lResult = vString1;
				}
			}
			return lResult;
		},
		
		escapeString: function (vString) {
			return vString.replace(/\\;/g,"@ESCAPEDSEMICOLON@").replace(/\\,/g,"@ESCAPEDCOMMA@");
		},
	
		escapeArray: function (vArray) {
			for (let i = 0; i<vArray.length; i++){
				if (vArray[i] && vArray[i] != ""){
					vArray[i] = vArray[i].replace(/\\;/g,"@ESCAPEDSEMICOLON@").replace(/\\,/g,"@ESCAPEDCOMMA@");
				}
			}
			return vArray;
		},
	
		replaceArrayComma: function (vArray) {
			vArrayNew = [];
			vArrayNew = JSON.parse(JSON.stringify(vArray));
			for (let i = 0; i<vArrayNew.length; i++){
				if (vArrayNew[i] && vArrayNew[i] != ""){
					vArrayNew[i] = vArrayNew[i].replace(/\\n/g,"\n").replace(/,/g,"\n");
				}
			}
			return vArrayNew;
		},
	
		escapeArrayComma: function (vArray) {
			vArrayNew = [];
			vArrayNew = JSON.parse(JSON.stringify(vArray));
			for (let i = 0; i<vArrayNew.length; i++){
				if (vArrayNew[i] && vArrayNew[i] != ""){
					vArrayNew[i] = vArrayNew[i].replace(/,/g,"@ESCAPEDCOMMA@");
				}
			}
			return vArrayNew;
		},
	
		unescapeArrayComma1: function (vArray) {
			vArrayNew = [];
			vArrayNew = JSON.parse(JSON.stringify(vArray));
			for (let i = 0; i<vArrayNew.length; i++){
				if (vArrayNew[i] && vArrayNew[i] != ""){
					vArrayNew[i] = vArrayNew[i].replace(/@ESCAPEDCOMMA@/g,"\\,");
				}
			}
			return vArrayNew;
		},
	
		unescapeArrayComma2: function (vArray) {
			vArrayNew = [];
			vArrayNew = JSON.parse(JSON.stringify(vArray));
			for (let i = 0; i<vArrayNew.length; i++){
				if (vArrayNew[i] && vArrayNew[i] != ""){
					vArrayNew[i] = vArrayNew[i].replace(/@ESCAPEDCOMMA@/g,"\,");
				}
			}
			return vArrayNew;
		},
	
		unescapeString: function (vString) {
			return vString.replace(/@ESCAPEDSEMICOLON@/g,";").replace(/\\;/g,";").replace(/@ESCAPEDCOMMA@/g,",").replace(/\\,/g,",");
		},
	
		unescapeArray: function (vArray) {
			for (let i = 0; i<vArray.length; i++){
				if (vArray[i] && vArray[i] != ""){
					vArray[i] = vArray[i].replace(/@ESCAPEDSEMICOLON@/g,";").replace(/\\;/g,";").replace(/@ESCAPEDCOMMA@/g,",").replace(/\\,/g,",");
				}
			}
			return vArray;
		},
	
		escapeStrings: function (vString) {
			return vString.replace(/;/g,"\\;").replace(/,/g,"\\,").split("\n").join("\\n");
		},

		escapeArrays2: function (vArray) {
			vArrayNew = [];
			vArrayNew = JSON.parse(JSON.stringify(vArray));
			for (let i = 0; i<vArrayNew.length; i++){
				if (vArrayNew[i] && vArrayNew[i] != ""){
					vArrayNew[i] = this.escapeStrings(vArrayNew[i]);
				}
			}
			return vArrayNew;
		},

		cleanArray: function (vArray) {
			var newArray = [];
			for(let i = 0; i<vArray.length; i++){
				if (vArray[i] && vArray[i] != ""){
					newArray.push(vArray[i]);
				}
			}
			return newArray;
		},
		
		parseArray: function (vArray) {
			var lTemp = "";
			for (let vArrayIndex = 0; vArrayIndex < vArray.length; vArrayIndex++) {
				if (vArrayIndex === 0) {
					lTemp = this.cleanArray(vArray[vArrayIndex]).join(" ");
				} else {
					lTemp = lTemp + "\n" + this.cleanArray(vArray[vArrayIndex]).join(" ");
				}
			}
			return lTemp;
		},
		
		parseArrayByType: function (vArray) {
			var lTemp1 = "";
			for (let i = 0; i < vArray.length; i++) {
				if (i === 0) {
					lTemp1 = lTemp1 + vArray[i][0][0];
				} else {
					lTemp1 = lTemp1 + " " + vArray[i][0][0];
				}
			}
			return lTemp1;
		},
		
		cardToVcardData: function (vCard, aMediaConversion) {
			if (vCard.uid == "") {
				return "";
			}
			var vCardData = "";
			vCardData = this.appendToVcardData(vCardData,"BEGIN:VCARD",true,"");
			vCardData = this.appendToVcardData(vCardData,"VERSION",false,vCard.version);
			vCardData = this.appendToVcardData(vCardData,"PRODID",false,vCard.prodid);
			vCardData = this.appendToVcardData(vCardData,"UID",false,vCard.uid);
			vCardData = this.appendToVcardData(vCardData,"CATEGORIES",false,this.unescapeArrayComma1(this.escapeArrayComma(vCard.categories)).join(","));
			if (vCard.version == "3.0") {
				vCardData = this.appendToVcardData(vCardData,"N",false,this.escapeStrings(vCard.lastname) + ";" + this.escapeStrings(vCard.firstname) + ";" +
														this.escapeStrings(vCard.othername) + ";" + this.escapeStrings(vCard.prefixname) + ";" + this.escapeStrings(vCard.suffixname));
			} else if (!(vCard.lastname == "" && vCard.firstname == "" && vCard.othername == "" && vCard.prefixname == "" && vCard.suffixname == "")) {
				vCardData = this.appendToVcardData(vCardData,"N",false,this.escapeStrings(vCard.lastname) + ";" + this.escapeStrings(vCard.firstname) + ";" +
														this.escapeStrings(vCard.othername) + ";" + this.escapeStrings(vCard.prefixname) + ";" + this.escapeStrings(vCard.suffixname));
			}
			vCardData = this.appendToVcardData(vCardData,"FN",false,this.escapeStrings(vCard.fn));
			vCardData = this.appendToVcardData(vCardData,"NICKNAME",false,this.escapeStrings(vCard.nickname));
			vCardData = this.appendToVcardData(vCardData,"SORT-STRING",false,vCard.sortstring);
			vCardData = this.appendToVcardData(vCardData,"GENDER",false,vCard.gender);
			vCardData = this.appendToVcardData(vCardData,"BDAY",false,vCard.bday);
			vCardData = this.appendToVcardData(vCardData,"TITLE",false,this.escapeStrings(vCard.title));
			vCardData = this.appendToVcardData(vCardData,"ROLE",false,this.escapeStrings(vCard.role));
			vCardData = this.appendToVcardData(vCardData,"ORG",false,this.escapeStrings(vCard.org));
			vCardData = this.appendToVcardData(vCardData,"CLASS",false,vCard.class1);
			vCardData = this.appendToVcardData(vCardData,"REV",false,vCard.rev);

			vCardData = this.appendArrayToVcardData(vCardData, "ADR", vCard.version, vCard.adr);
			vCardData = this.appendArrayToVcardData(vCardData, "TEL", vCard.version, vCard.tel);
			vCardData = this.appendArrayToVcardData(vCardData, "EMAIL", vCard.version, vCard.email);
			vCardData = this.appendArrayToVcardData(vCardData, "URL", vCard.version, vCard.url);
			vCardData = this.appendArrayToVcardData(vCardData, "IMPP", vCard.version, vCard.impp);

			vCardData = this.appendToVcardData(vCardData,"NOTE",false,this.escapeStrings(vCard.note));
			vCardData = this.appendToVcardData(vCardData,"GEO",false,vCard.geo);
			vCardData = this.appendToVcardData(vCardData,"MAILER",false,vCard.mailer);
			
			if (vCard.version == "4.0") {
				vCardData = this.appendToVcardData(vCardData,"KIND",false,vCard.kind);
				for (let i = 0; i < vCard.member.length; i++) {
					vCardData = this.appendToVcardData(vCardData,"MEMBER",false,vCard.member[i]);
				}
			}

			vCardData = this.appendToVcardData(vCardData,"PHOTO",false,cardbookUtils.getMediaContentForCard(vCard, "photo", aMediaConversion));
			vCardData = this.appendToVcardData(vCardData,"LOGO",false,cardbookUtils.getMediaContentForCard(vCard, "logo", aMediaConversion));
			vCardData = this.appendToVcardData(vCardData,"SOUND",false,cardbookUtils.getMediaContentForCard(vCard, "sound", aMediaConversion));
			
			vCardData = this.appendToVcardData(vCardData,"AGENT",false,vCard.agent);
			vCardData = this.appendToVcardData(vCardData,"TZ",false,this.escapeStrings(vCard.tz));
			vCardData = this.appendToVcardData(vCardData,"KEY",false,vCard.key);

			for (let i = 0; i < vCard.others.length; i++) {
				vCardData = this.appendToVcardData(vCardData,"",false,vCard.others[i]);
			}

			vCardData = this.appendToVcardData(vCardData,"END:VCARD",true,"");

			return vCardData;
		},

		getvCardForEmail: function(aCard) {
			var cardContent = cardbookUtils.cardToVcardData(aCard, true);
			var re = /[\n\u0085\u2028\u2029]|\r\n?/;
			var tmpArray = cardContent.split(re);
			function filterArray(element) {
				return (element.search(/^UID:/) == -1 &&
							element.search(/^PRODID:/) == -1 &&
							element.search(/^REV:/) == -1 &&
							element.search(/^X-THUNDERBIRD-MODIFICATION:/) == -1 &&
							element.search(/^X-THUNDERBIRD-ETAG:/) == -1);
			}
			tmpArray = tmpArray.filter(filterArray);
			return tmpArray.join("\r\n");
		},

		getMediaContentForCard: function(aCard, aType, aMediaConversion) {
			try {
				var result = "";
				if (aMediaConversion) {
					if (aCard[aType].URI != null && aCard[aType].URI !== undefined && aCard[aType].URI != "") {
						result = "VALUE=uri:" + aCard[aType].URI;
					} else if (aCard[aType].localURI != null && aCard[aType].localURI !== undefined && aCard[aType].localURI != "") {
						result = "VALUE=uri:" + aCard[aType].localURI;
						var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
						var myFileURI = ioService.newURI(aCard[aType].localURI, null, null);
						var content = btoa(cardbookSynchronization.getFileBinary(myFileURI));
						if (aCard.version === "4.0") {
							if (aCard[aType].extension != "") {
								result = "data:image/" + aCard[aType].extension + ";base64," + content;
							} else {
								result = "base64," + content;
							}
						} else if (aCard.version === "3.0") {
							if (aCard[aType].extension != "") {
								result = "ENCODING=b;TYPE=" + aCard[aType].extension + ":" + content;
							} else {
								result = "ENCODING=b:" + content;
							}
						}
					}
				} else {
					if (aCard[aType].URI != null && aCard[aType].URI !== undefined && aCard[aType].URI != "") {
						result = "VALUE=uri:" + aCard[aType].URI;
					} else if (aCard[aType].localURI != null && aCard[aType].localURI !== undefined && aCard[aType].localURI != "") {
						result = "VALUE=uri:" + aCard[aType].localURI;
					}
				}
				return result;
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookUtils.getMediaContentForCard error : " + e, "Error");
			}
		},

		getDisplayedName: function(aOldFn, aNewFn, aOldN, aNewN, aOldOrg, aNewOrg) {
			var fnString = "";
			if (aOldFn == "") {
				if (aNewFn == "") {
					fnString = cardbookUtils.cleanArray(aNewN).join(" ");
					if (fnString == "") {
						fnString = cardbookUtils.cleanArray(aOldN).join(" ");
						if (fnString == "") {
							fnString = aNewOrg;
							if (fnString == "") {
								fnString = aOldOrg;
							}
						}
					}
				} else {
					fnString = aNewFn;
				}
			} else {
				if (aNewFn == aOldFn) {
					if (cardbookUtils.cleanArray(aOldN).join(" ") == aOldFn) {
						fnString = cardbookUtils.cleanArray(aNewN).join(" ");
						if (fnString == "") {
							fnString = aNewOrg;
						}
					} else if (aOldOrg == aOldFn) {
						fnString = aNewOrg;
					} else {
						fnString = aOldFn;
					}
				} else if (aNewFn == "") {
					if (cardbookUtils.cleanArray(aNewN).join(" ") == "") {
						fnString = aNewOrg;
					} else {
						fnString = cardbookUtils.cleanArray(aNewN).join(" ");
					}
				} else {
					fnString = aNewFn;
				}
			}
			return fnString;
		},

		parseLists: function(aCard, aMemberLines, aKindValue) {
			if (aCard.version == "4.0") {
				aCard.member = [];
				for (var i = 0; i < aMemberLines.length; i++) {
					if (i === 0) {
						if (aKindValue != null && aKindValue !== undefined && aKindValue != "") {
							aCard.kind = aKindValue;
						} else {
							aCard.kind = "group";
						}
					}
					aCard.member.push(aMemberLines[i][0]);
				}
			} else if (aCard.version == "3.0") {
				var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				var kindCustom = prefs.getComplexValue("extensions.cardbook.kindCustom", Components.interfaces.nsISupportsString).data;
				var memberCustom = prefs.getComplexValue("extensions.cardbook.memberCustom", Components.interfaces.nsISupportsString).data;
				for (var i = 0; i < aCard.others.length; i++) {
					localDelim1 = aCard.others[i].indexOf(":",0);
					if (localDelim1 >= 0) {
						var header = aCard.others[i].substr(0,localDelim1);
						var trailer = aCard.others[i].substr(localDelim1+1,aCard.others[i].length);
						if (header == kindCustom || header == memberCustom) {
							aCard.others.splice(i, 1);
							i--;
							continue;
						}
					}
				}
				for (var i = 0; i < aMemberLines.length; i++) {
					if (i === 0) {
						if (aKindValue != null && aKindValue !== undefined && aKindValue != "") {
							aCard.others.push(kindCustom + ":" + aKindValue);
						} else {
							aCard.others.push(kindCustom + ":group");
						}
					}
					aCard.others.push(memberCustom + ":" + aMemberLines[i][0]);
				}
			}
		},

		parseAdrsCard: function(aCard) {
			aCard.dispadr = "";
			aCard.disphomeadr = "";
			aCard.dispworkadr = "";
			for (var i = 0; i < aCard.adr.length; i++) {
				let value = aCard.adr[i][0];
				let type = cardbookUtils.getOnlyTypesFromTypes(aCard.adr[i][1]);
				for (var j = 0; j < type.length; j++) {
					switch (type[j].toUpperCase()) {
						case "HOME":
							if (aCard.disphomeadr == "") {
								aCard.disphomeadr = cardbookUtils.parseArray([value]);
							} else {
								aCard.disphomeadr = aCard.disphomeadr + " " + cardbookUtils.parseArray([value]);
							}
							break;
						case "WORK":
							if (aCard.dispworkadr == "") {
								aCard.dispworkadr = cardbookUtils.parseArray([value]);
							} else {
								aCard.dispworkadr = aCard.dispworkadr + " " + cardbookUtils.parseArray([value]);
							}
							break;
					}
				}
				if (aCard.dispadr == "") {
					aCard.dispadr = cardbookUtils.parseArray([value]);
				} else {
					aCard.dispadr = aCard.dispadr + " " + cardbookUtils.parseArray([value]);
				}
			}
		},

		parseEmailsCard: function(aCard) {
			aCard.dispemail = "";
			aCard.disphomeemail = "";
			aCard.dispworkemail = "";
			for (var i = 0; i < aCard.email.length; i++) {
				let value = aCard.email[i][0][0];
				let type = cardbookUtils.getOnlyTypesFromTypes(aCard.email[i][1]);
				for (var j = 0; j < type.length; j++) {
					switch (type[j].toUpperCase()) {
						case "HOME":
							if (aCard.disphomeemail == "") {
								aCard.disphomeemail = value;
							} else {
								aCard.disphomeemail = aCard.disphomeemail + " " + value;
							}
							break;
						case "WORK":
							if (aCard.dispworkemail == "") {
								aCard.dispworkemail = value;
							} else {
								aCard.dispworkemail = aCard.dispworkemail + " " + value;
							}
							break;
					}
				}
				if (aCard.dispemail == "") {
					aCard.dispemail = value;
				} else {
					aCard.dispemail = aCard.dispemail + " " + value;
				}
			}
		},

		parseTelsCard: function(aCard) {
			aCard.disptel = "";
			aCard.disphometel = "";
			aCard.dispworktel = "";
			aCard.dispcelltel = "";
			for (var i = 0; i < aCard.tel.length; i++) {
				let value = aCard.tel[i][0][0];
				let type = cardbookUtils.getOnlyTypesFromTypes(aCard.tel[i][1]);
				for (var j = 0; j < type.length; j++) {
					switch (type[j].toUpperCase()) {
						case "HOME":
							if (aCard.disphometel == "") {
								aCard.disphometel = value;
							} else {
								aCard.disphometel = aCard.disphometel + " " + value;
							}
							break;
						case "WORK":
							if (aCard.dispworktel == "") {
								aCard.dispworktel = value;
							} else {
								aCard.dispworktel = aCard.dispworktel + " " + value;
							}
							break;
						case "CELL":
							if (aCard.dispcelltel == "") {
								aCard.dispcelltel = value;
							} else {
								aCard.dispcelltel = aCard.dispcelltel + " " + value;
							}
							break;
					}
				}
				if (aCard.disptel == "") {
					aCard.disptel = value;
				} else {
					aCard.disptel = aCard.disptel + " " + value;
				}
			}
		},

		clearCard: function () {
			var fieldArray = [ "fn", "lastname", "firstname", "othername", "prefixname", "suffixname", "nickname", "bday",
								"gender", "note", "mailer", "geo", "sortstring", "class1", "tz",
								"agent", "key", "prodid", "uid", "version", "dirPrefId", "cardurl", "rev", "etag", "others", "vcard",
								"photolocalURI", "logolocalURI", "soundlocalURI", "photoURI", "logoURI", "soundURI" ];
			for (var i = 0; i < fieldArray.length; i++) {
				if (document.getElementById(fieldArray[i] + 'TextBox')) {
					document.getElementById(fieldArray[i] + 'TextBox').value = "";
				}
			}

			cardbookElementTools.deleteRows('orgRows');
			
			var typesList = [ 'email', 'tel', 'impp', 'url', 'adr' ];
			for (var i in typesList) {
				cardbookElementTools.deleteRowsType(typesList[i]);
			}
			for (var j in cardbookRepository.customFields) {
				if (document.getElementById(cardbookRepository.customFields[j] + 'TextBox')) {
					document.getElementById(cardbookRepository.customFields[j] + 'TextBox').value = "";
				}
			}
			document.getElementById('defaultCardImage').src = "";
			cardbookElementTools.deleteRows('mailPopularityRows');
		},

		displayCard: function (aCard, aReadOnly) {
			var fieldArray = [ "fn", "lastname", "firstname", "othername", "prefixname", "suffixname", "nickname", "bday",
								"gender", "note", "mailer", "geo", "sortstring", "class1", "tz", "agent", "key", "prodid",
								"uid", "version", "dirPrefId", "cardurl", "rev", "etag" ];
			for (var i = 0; i < fieldArray.length; i++) {
				if (document.getElementById(fieldArray[i] + 'TextBox')) {
					document.getElementById(fieldArray[i] + 'TextBox').value = aCard[fieldArray[i]];
					if (aReadOnly) {
						document.getElementById(fieldArray[i] + 'TextBox').setAttribute('readonly', 'true');
					} else {
						document.getElementById(fieldArray[i] + 'TextBox').removeAttribute('readonly');
					}
				}
			}

			var cardbookPrefService = new cardbookPreferenceService(aCard.dirPrefId);
			var myDirPrefIdType = cardbookPrefService.getType();
			var myDirPrefIdUrl = cardbookPrefService.getUrl();
			if (myDirPrefIdType === "DIRECTORY") {
				var myFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
				myFile.initWithPath(myDirPrefIdUrl);
				myFile.append(aCard.cacheuri);
			} else if (myDirPrefIdType === "FILE") {
				var myFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
				myFile.initWithPath(myDirPrefIdUrl);
			} else {
				var myFile = cardbookRepository.getLocalDirectory();
				myFile.append(aCard.dirPrefId);
				myFile.append(aCard.cacheuri);
			}
			var fieldArray = [ "cacheuri" ];
			for (var i = 0; i < fieldArray.length; i++) {
				if (document.getElementById(fieldArray[i] + 'TextBox')) {
					document.getElementById(fieldArray[i] + 'TextBox').value = myFile.path;
					if (aReadOnly) {
						document.getElementById(fieldArray[i] + 'TextBox').setAttribute('readonly', 'true');
					} else {
						document.getElementById(fieldArray[i] + 'TextBox').removeAttribute('readonly');
					}
				}
			}

			var myCustomField1OrgValue = "";
			var myCustomField2OrgValue = "";
			var myCustomField1OrgLabel = "";
			var myCustomField2OrgLabel = "";
			var othersTemp = JSON.parse(JSON.stringify(aCard.others));

			for (var i in cardbookRepository.customFields) {
				if (cardbookRepository.customFields[i] == "customField1Org" ) {
					myCustomField1OrgLabel = cardbookRepository.customFieldsLabel[cardbookRepository.customFields[i]];
				} else if (cardbookRepository.customFields[i] == "customField2Org" ) {
					myCustomField2OrgLabel = cardbookRepository.customFieldsLabel[cardbookRepository.customFields[i]];
				} else {
					document.getElementById(cardbookRepository.customFields[i] + 'Label').value = cardbookRepository.customFieldsLabel[cardbookRepository.customFields[i]];
				}
				for (var j = 0; j < othersTemp.length; j++) {
					var othersTempArray = othersTemp[j].split(":");
					if (cardbookRepository.customFieldsValue[cardbookRepository.customFields[i]] == othersTempArray[0]) {
						if (cardbookRepository.customFields[i] == "customField1Org" ) {
							myCustomField1OrgValue = othersTempArray[1];
							myCustomField1OrgLabel = cardbookRepository.customFieldsLabel[cardbookRepository.customFields[i]];
						} else if (cardbookRepository.customFields[i] == "customField2Org" ) {
							myCustomField2OrgValue = othersTempArray[1];
							myCustomField2OrgLabel = cardbookRepository.customFieldsLabel[cardbookRepository.customFields[i]];
						} else {
							document.getElementById(cardbookRepository.customFields[i] + 'TextBox').value = othersTempArray[1];
						}
						var dummy = othersTemp.splice(j,1);
						j--;
					}
				}
			}
			
			document.getElementById('othersTextBox').value = othersTemp.join("\n");
			if (aReadOnly) {
				document.getElementById('othersTextBox').setAttribute('readonly', 'true');
			} else {
				document.getElementById('othersTextBox').removeAttribute('readonly');
			}

			var fieldArray = [ [ "photo", "localURI" ] , [ "photo", "URI" ], [ "logo", "localURI" ] , [ "logo", "URI" ], [ "sound", "localURI" ] , [ "sound", "URI" ] ];
			for (var i = 0; i < fieldArray.length; i++) {
				if (document.getElementById(fieldArray[i][0] + fieldArray[i][1] + 'TextBox')) {
					document.getElementById(fieldArray[i][0] + fieldArray[i][1] + 'TextBox').value = aCard[fieldArray[i][0]][fieldArray[i][1]];
					if (aReadOnly) {
						document.getElementById(fieldArray[i][0] + fieldArray[i][1] + 'TextBox').setAttribute('readonly', 'true');
					} else {
						document.getElementById(fieldArray[i][0] + fieldArray[i][1] + 'TextBox').removeAttribute('readonly');
					}
				}
			}
			
			cardbookTypes.constructOrg(aReadOnly, aCard.org, aCard.title, aCard.role, myCustomField1OrgValue, myCustomField1OrgLabel, myCustomField2OrgValue, myCustomField2OrgLabel);
			
			wdw_imageEdition.displayImageCard(aCard);
			wdw_cardEdition.displayCustomsName(aReadOnly);
			wdw_cardEdition.display40(aCard.version, aReadOnly);
			
			document.getElementById('categoriesTextBox').value = aCard.categories.join(" ");
			if (aReadOnly) {
				document.getElementById('categoriesTextBox').setAttribute('readonly', 'true');
			} else {
				document.getElementById('categoriesTextBox').removeAttribute('readonly');
			}

			var typesList = [ 'email', 'tel', 'impp', 'url', 'adr' ];
			for (var i in typesList) {
				if (aReadOnly) {
					cardbookTypes.constructStaticRows(typesList[i], aCard[typesList[i]], aCard.version);
				} else {
					cardbookTypes.constructDynamicRows(typesList[i], aCard[typesList[i]], aCard.version);
				}
			}
			if (aReadOnly) {
				cardbookTypes.loadStaticList(aCard);
				cardbookTypes.constructStaticMailPopularity(aCard.email);
			} else {
				wdw_cardEdition.displayLists(aCard);
				cardbookTypes.constructDynamicMailPopularity(aCard.email);
			}
		},

		adjustFields: function () {
			var nullableFields = {fn: [ 'fn' ],
									pers: [ 'lastname', 'firstname', 'othername', 'prefixname', 'suffixname', 'nickname', 'gender', 'bday', 'customField1Name', 'customField2Name' ],
									categories: [ 'categories' ],
									note: [ 'note' ],
									misc: [ 'mailer', 'geo', 'sortstring', 'class1', 'tz', 'agent', 'key', 'photolocalURI', 'photoURI', 'logolocalURI', 'logoURI', 'soundlocalURI', 'soundURI' ],
									tech: [ 'dirPrefId', 'version', 'prodid', 'uid', 'cardurl', 'rev', 'etag' ],
									others: [ 'others' ],
									vcard: [ 'vcard' ],
									};
			for (var i in nullableFields) {
				var found = false;
				for (var j = 0; j < nullableFields[i].length; j++) {
					var row = document.getElementById(nullableFields[i][j] + 'Row');
					var textbox = document.getElementById(nullableFields[i][j] + 'TextBox');
					var label = document.getElementById(nullableFields[i][j] + 'Label');
					if (textbox) {
						var myTestValue = ""; 
						if (textbox.value) {
							myTestValue = textbox.value;
						} else {
							myTestValue = textbox.getAttribute('value');
						}
						if (myTestValue != "") {
							if (row) {
								row.removeAttribute('hidden');
							}
							if (textbox) {
								textbox.removeAttribute('hidden');
							}
							if (label) {
								label.removeAttribute('hidden');
							}
							found = true;
						} else {
							if (row) {
								row.setAttribute('hidden', 'true');
							}
							if (textbox) {
								textbox.setAttribute('hidden', 'true');
							}
							if (label) {
								label.setAttribute('hidden', 'true');
							}
						}
					}
				}
				var groupbox = document.getElementById(i + 'Groupbox');
				if (groupbox) {
					if (found) {
						groupbox.removeAttribute('hidden');
					} else {
						groupbox.setAttribute('hidden', 'true');
					}
				}
			}
			
			var groupbox = document.getElementById('orgGroupbox');
			if (document.getElementById('orgRows').childElementCount != "0") {
				groupbox.removeAttribute('hidden');
			} else {
				groupbox.setAttribute('hidden', 'true');
			}
			
			var typesList = [ 'email', 'tel', 'impp', 'url', 'adr' ];
			for (var i in typesList) {
				var box = document.getElementById(typesList[i] + 'Groupbox');
				if (document.getElementById(typesList[i] + '_0_valueBox')) {
					box.removeAttribute('hidden');
				} else {
					box.setAttribute('hidden', 'true');
				}
			}
		},

		setCalculatedFields: function(aCard) {
			cardbookUtils.parseAdrsCard(aCard);
			cardbookUtils.parseTelsCard(aCard);
			cardbookUtils.parseEmailsCard(aCard);
			aCard.dispimpp = cardbookUtils.parseArrayByType(aCard.impp)
			aCard.dispurl = cardbookUtils.parseArrayByType(aCard.url)
			aCard.dispn = aCard.lastname + ";" + aCard.firstname + ";" + aCard.othername + ";" + aCard.prefixname + ";" + aCard.suffixname;
			aCard.dispcategories = aCard.categories.join(" ");
			cardbookUtils.updateRev(aCard);
		},

		cloneCard: function(sourceCard, targetCard) {
			targetCard.dirPrefId = sourceCard.dirPrefId;
			targetCard.cardurl = sourceCard.cardurl;
			targetCard.etag = sourceCard.etag;
	
			targetCard.lastname = sourceCard.lastname;
			targetCard.firstname = sourceCard.firstname;
			targetCard.othername = sourceCard.othername;
			targetCard.prefixname = sourceCard.prefixname;
			targetCard.suffixname = sourceCard.suffixname;
			targetCard.fn = sourceCard.fn;
			targetCard.nickname = sourceCard.nickname;
			targetCard.gender = sourceCard.gender;
			targetCard.bday = sourceCard.bday;

			targetCard.adr = JSON.parse(JSON.stringify(sourceCard.adr));
			targetCard.tel = JSON.parse(JSON.stringify(sourceCard.tel));
			targetCard.email = JSON.parse(JSON.stringify(sourceCard.email));
			targetCard.url = JSON.parse(JSON.stringify(sourceCard.url));
			targetCard.impp = JSON.parse(JSON.stringify(sourceCard.impp));
			targetCard.categories = JSON.parse(JSON.stringify(sourceCard.categories));

			targetCard.mailer = sourceCard.mailer;
			targetCard.tz = sourceCard.tz;
			targetCard.geo = sourceCard.geo;
			targetCard.title = sourceCard.title;
			targetCard.role = sourceCard.role;
			targetCard.agent = sourceCard.agent;
			targetCard.org = sourceCard.org;
			targetCard.note = sourceCard.note;
			targetCard.prodid = sourceCard.prodid;
			targetCard.sortstring = sourceCard.sortstring;
			targetCard.uid = sourceCard.uid;
			cardbookUtils.setCalculatedFields(targetCard);

			targetCard.member = JSON.parse(JSON.stringify(sourceCard.member));
			targetCard.kind = sourceCard.kind;

			targetCard.photo = JSON.parse(JSON.stringify(sourceCard.photo));
			targetCard.logo = JSON.parse(JSON.stringify(sourceCard.logo));
			targetCard.sound = JSON.parse(JSON.stringify(sourceCard.sound));

			targetCard.version = sourceCard.version;
			targetCard.class1 = sourceCard.class1;
			targetCard.key = sourceCard.key;

			targetCard.updated = sourceCard.updated;
			targetCard.created = sourceCard.created;
			targetCard.deleted = sourceCard.deleted;

			targetCard.others = sourceCard.others;
			
			targetCard.dispn = sourceCard.dispn;
			targetCard.dispadr = sourceCard.dispadr;
			targetCard.disphomeadr = sourceCard.disphomeadr;
			targetCard.dispworkadr = sourceCard.dispworkadr;
			targetCard.disptel = sourceCard.disptel;
			targetCard.disphometel = sourceCard.disphometel;
			targetCard.dispworktel = sourceCard.dispworktel;
			targetCard.dispcelltel = sourceCard.dispcelltel;
			targetCard.dispemail = sourceCard.dispemail;
			targetCard.disphomeemail = sourceCard.disphomeemail;
			targetCard.dispworkemail = sourceCard.dispworkemail;
			targetCard.dispimpp = sourceCard.dispimpp;
			targetCard.dispurl = sourceCard.dispurl;
			targetCard.dispcategories = sourceCard.dispcategories;
		},

		getCustomValue: function(aCard, aCustomElement) {
			for (var i = 0; i < aCard.others.length; i++) {
				var othersTempArray = aCard.others[i].split(":");
				if (cardbookRepository.customFieldsValue[aCustomElement] == othersTempArray[0]) {
					return othersTempArray[1];
				}
			}
			return "";
		},

		getCardValueByField: function(aCard, aField) {
			var result = [];
			if (aField.indexOf(".") > 0) {
				var myFieldArray = aField.split(".");
				var myField = myFieldArray[0];
				var myPosition = myFieldArray[1];
				var myType = myFieldArray[2];
				if (myType == "all") {
					if (aCard[myField]) {
						for (var i = 0; i < aCard[myField].length; i++) {
							if (aCard[myField][i][0][myPosition] != "") {
								result.push(aCard[myField][i][0][myPosition]);
							}
						}
					}
				} else {
					if (aCard[myField]) {
						for (var i = 0; i < aCard[myField].length; i++) {
							if (aCard[myField][i][1].length == 0 && myType == "notype") {
								result.push(aCard[myField][i][0][myPosition]);
							} else {
								for (var j = 0; j < aCard[myField][i][1].length; j++) {
									if (aCard[myField][i][1][j].toLowerCase() == "type=" + myType.toLowerCase()) {
										result.push(aCard[myField][i][0][myPosition]);
										break;
									}
								}
							}
						}
					}
				}
			} else {
				if (aCard[aField]) {
					result.push(aCard[aField]);
				} else {
					for (var i = 0; i < aCard.others.length; i++) {
						var othersTempArray = aCard.others[i].split(":");
						if (aField == othersTempArray[0]) {
							result.push(othersTempArray[1]);
							return result;
						}
					}
				}
			}
			return result;
		},

		setCardValueByField: function(aCard, aField, aValue) {
			aValue = aValue.replace(/^\"|\"$/g, "");
			if (aValue == "") {
				return;
			} else if (aField == "blank") {
				return;
			} else if (aField.indexOf(".") > 0) {
				var myFieldArray = aField.split(".");
				var myField = myFieldArray[0];
				var myPosition = myFieldArray[1];
				var myType = myFieldArray[2];
				if (aCard[myField]) {
					if (myField == "adr") {
						for (var i = 0; i < aCard[myField].length; i++) {
							var found = false;
							if (aCard[myField][i][1][0].toLowerCase() == "type=" + myType.toLowerCase()) {
								aCard[myField][i][0][myPosition] = aValue;
								found = true;
								break;
							}
						}
						if (!found) {
							if (myType == "notype") {
								var myType2 = "";
							} else {
								var myType2 = "type=" + myType;
							}
							aCard[myField].push([ ["", "", "", "", "", "", ""], [myType2], "", [] ]);
							aCard[myField][i][0][myPosition] = aValue;
						}
					} else {
						if (myType == "notype") {
							var myType2 = "";
						} else {
							var myType2 = "type=" + myType;
						}
						var re = /[\n\u0085\u2028\u2029]|\r\n?/;
						var myValueArray = aValue.split(re);
						for (var i = 0; i < myValueArray.length; i++) {
							aCard[myField].push([ [myValueArray[i]], [myType2], "", [] ]);
						}
					}
				}
			} else {
				var found = false;
				for (var i in cardbookRepository.customFields) {
					if (cardbookRepository.customFieldsValue[cardbookRepository.customFields[i]] == aField) {
						aCard.others.push(aField + ":" + aValue);
						found = true;
					}
				}
				if (!found) {
					aCard[aField] = aValue;
				}
			}
		},

		getPrefBooleanFromTypes: function(aArray) {
			for (var i = 0; i < aArray.length; i++) {
				var upperElement = aArray[i].toUpperCase();
				if (upperElement === "PREF" || upperElement === "TYPE=PREF") {
					return true;
				} else if (upperElement.replace(/PREF=[0-9]*/i,"PREF") == "PREF") {
					return true;
				} else if (upperElement.replace(/^TYPE=/ig,"") !== upperElement) {
					var tmpArray = aArray[i].replace(/^TYPE=/ig,"").split(",");
					for (var j = 0; j < tmpArray.length; j++) {
						var upperElement1 = tmpArray[j].toUpperCase();
						if (upperElement1 === "PREF") {
							return true;
						} else if (upperElement1.replace(/PREF=[0-9]*/i,"PREF") == "PREF") {
							return true;
						}
					}
				}
			}
			return false;
		},

		getPrefValueFromTypes: function(aArray, aVersion) {
			if (aVersion == "3.0") {
				return "";
			} else if (cardbookUtils.getPrefBooleanFromTypes(aArray)) {
				for (var i = 0; i < aArray.length; i++) {
					var upperElement = aArray[i].toUpperCase();
					if (upperElement === "PREF" || upperElement === "TYPE=PREF") {
						continue;
					} else if (upperElement.replace(/PREF=[0-9]*/i,"PREF") == "PREF") {
						return upperElement.replace(/PREF=/i,"");
					} else if (upperElement.replace(/^TYPE=/i,"") !== upperElement) {
						var tmpArray = aArray[i].replace(/^TYPE=/ig,"").split(",");
						for (var j = 0; j < tmpArray.length; j++) {
							var upperElement1 = tmpArray[j].toUpperCase();
							if (upperElement1 === "PREF") {
								continue;
							} else if (upperElement1.replace(/PREF=[0-9]*/i,"PREF") == "PREF") {
								return upperElement1.replace(/PREF=/i,"");
							}
						}
					}
				}
			}
			return "";
		},

		getOnlyTypesFromTypes: function(aArray) {
			function deletePrefs(element) {
				return !(element.toUpperCase().replace(/TYPE=PREF/i,"PREF").replace(/PREF=[0-9]*/i,"PREF") == "PREF");
			}
			var result = [];
			for (var i = 0; i < aArray.length; i++) {
				var upperElement = aArray[i].toUpperCase();
				if (upperElement === "PREF" || upperElement === "TYPE=PREF") {
					continue;
				} else if (upperElement === "HOME" || upperElement === "FAX" || upperElement === "CELL" || upperElement === "WORK" || upperElement === "PHONE" || upperElement === "BUSINESS"
					 || upperElement === "VOICE"|| upperElement === "OTHER") {
					result.push(aArray[i]);
				} else if (upperElement.replace(/^TYPE=/i,"") !== upperElement) {
					var tmpArray = aArray[i].replace(/^TYPE=/ig,"").split(",").filter(deletePrefs);
					for (var j = 0; j < tmpArray.length; j++) {
						result.push(tmpArray[j]);
					}
				}
			}
			return result;
		},

		getNotTypesFromTypes: function(aArray) {
			var result = [];
			for (var i = 0; i < aArray.length; i++) {
				var upperElement = aArray[i].toUpperCase();
				if (upperElement === "PREF" || upperElement === "TYPE=PREF") {
					continue;
				} else if (upperElement === "HOME" || upperElement === "FAX" || upperElement === "CELL" || upperElement === "WORK" || upperElement === "PHONE" || upperElement === "BUSINESS"
					 || upperElement === "VOICE"|| upperElement === "OTHER") {
					continue;
				} else if (upperElement.replace(/PREF=[0-9]*/i,"PREF") == "PREF") {
					continue;
				} else if (upperElement.replace(/^TYPE=/i,"") === upperElement) {
					result.push(aArray[i]);
				}
			}
			return result.join(",");
		},

		getDataForUpdatingFile: function(aList, aMediaConversion) {
			var dataForExport = "";
			var k = 0;
			for (var i = 0; i < aList.length; i++) {
				if (k === 0) {
					dataForExport = cardbookUtils.cardToVcardData(aList[i], aMediaConversion);
					k = 1;
				} else {
					dataForExport = dataForExport + "\r\n" + cardbookUtils.cardToVcardData(aList[i], aMediaConversion);
				}
			}
			return dataForExport;
		},

		getSelectedCardsForList: function (aTree) {
			var myTreeName = aTree.id.replace("Tree", "");
			var listOfUid = [];
			var numRanges = aTree.view.selection.getRangeCount();
			var start = new Object();
			var end = new Object();
			for (var i = 0; i < numRanges; i++) {
				aTree.view.selection.getRangeAt(i,start,end);
				for (var j = start.value; j <= end.value; j++){
					listOfUid.push([aTree.view.getCellText(j, {id: myTreeName + "Id"}), aTree.view.getCellText(j, {id: myTreeName + "Name"}), j]);
				}
			}
			return listOfUid;
		},

		setSelectedCardsForList: function (aTree, aListOfUid) {
			var myTreeName = aTree.id.replace("Tree", "");
			for (let i = 0; i < aTree.view.rowCount; i++) {
				for (let j = 0; j < aListOfUid.length; j++) {
					if (aTree.view.getCellText(i, {id: myTreeName + "Id"}) == aListOfUid[j][0]) {
						aTree.view.selection.rangedSelect(i,i,true);
						break;
					}
				}
			}
		},

		getSelectedCards: function () {
			var myTree = document.getElementById('cardsTree');
			var listOfUid = [];
			var numRanges = myTree.view.selection.getRangeCount();
			var start = new Object();
			var end = new Object();
			for (var i = 0; i < numRanges; i++) {
				myTree.view.selection.getRangeAt(i,start,end);
				for (var j = start.value; j <= end.value; j++){
					listOfUid.push(myTree.view.getCellText(j, {id: "uid"}));
				}
			}
			return listOfUid;
		},

		getSelectedCardsCount: function () {
			var listOfUid = [];
			listOfUid = cardbookUtils.getSelectedCards();
			return listOfUid.length;
		},

		setSelectedCards: function (aListOfUid, aFirstVisibleRow) {
			var found = false;
			var foundIndex;
			var myTree = document.getElementById('cardsTree');
			for (var i = 0; i < aListOfUid.length; i++) {
				for (var j = 0; j < myTree.view.rowCount; j++) {
					if (myTree.view.getCellText(j, {id: "uid"}) == aListOfUid[i]) {
						myTree.view.selection.rangedSelect(j,j,true);
						found = true
						foundIndex = j;
						break;
					}
				}
			}
			if ((aFirstVisibleRow == 0) || (aFirstVisibleRow != null && aFirstVisibleRow !== undefined && aFirstVisibleRow != "")) {
				myTree.boxObject.scrollToRow(aFirstVisibleRow);
			} else if (found) {
				myTree.boxObject.scrollToRow(foundIndex);
			}
		},

		validateCategories: function(aCard) {
			var newArray = [];
			newArray = this.cleanArray(cardbookRepository.arrayUnique(this.unescapeArrayComma2(this.escapeArrayComma(aCard.categories).join(",").replace(/;/g,",").split(","))));
			aCard.categories = newArray;
			return true;
		},
		
		getAccountId: function(aPrefId) {
			var mySepPosition = aPrefId.indexOf("::",0);
			if (mySepPosition != -1) {
				return aPrefId.substr(0,mySepPosition);
			} else {
				return aPrefId;
			}
		},

		getPositionOfAccountId: function(aAccountId) {
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][4] == aAccountId) {
					return i;
				}
			}
			return -1;
		},

		isThereNetworkAccountToSync: function() {
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][5] != "FILE" && cardbookRepository.cardbookAccounts[i][5] != "CACHE" 
					&& cardbookRepository.cardbookAccounts[i][5] != "DIRECTORY" && cardbookRepository.cardbookAccounts[i][6]) {
					return true;
				}
			}
			return false;
		},

		isFileAlreadyOpen: function(aAccountPath) {
			cardbookUtils.jsInclude(["chrome://cardbook/content/preferences/cardbookPreferences.js"]);
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][6] && cardbookRepository.cardbookAccounts[i][5] == "FILE") {
					var cardbookPrefService = new cardbookPreferenceService(cardbookRepository.cardbookAccounts[i][4]);
					if (cardbookPrefService.getUrl() == aAccountPath) {
						return true;
					}
				}
			}
			return false;
		},

		isDirectoryAlreadyOpen: function(aAccountPath) {
			cardbookUtils.jsInclude(["chrome://cardbook/content/preferences/cardbookPreferences.js"]);
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][6] && cardbookRepository.cardbookAccounts[i][5] == "DIRECTORY") {
					var cardbookPrefService = new cardbookPreferenceService(cardbookRepository.cardbookAccounts[i][4]);
					if (cardbookPrefService.getUrl() == aAccountPath) {
						return true;
					}
				}
			}
			return false;
		},

		isToggleOpen: function(aPrefId) {
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][4] == aPrefId) {
					if (cardbookRepository.cardbookAccounts[i][2]) {
						return true;
					} else {
						return false;
					}
				}
			}
			return false;
		},

		searchTagCreated: function(aCard) {
			for (var i = 0; i < aCard.others.length; i++) {
				if (aCard.others[i].indexOf("X-THUNDERBIRD-MODIFICATION:CREATED") >= 0) {
					return true;
				}
			}
			return false;
		},

		addTagCreated: function(aCard) {
			cardbookUtils.nullifyTagModification(aCard);
			aCard.others.push("X-THUNDERBIRD-MODIFICATION:CREATED");
			aCard.created = true;
		},

		addTagUpdated: function(aCard) {
			cardbookUtils.nullifyTagModification(aCard);
			aCard.others.push("X-THUNDERBIRD-MODIFICATION:UPDATED");
			aCard.updated = true;
		},

		addTagDeleted: function(aCard) {
			cardbookUtils.nullifyTagModification(aCard);
			aCard.others.push("X-THUNDERBIRD-MODIFICATION:DELETED");
			aCard.deleted = true;
		},

		nullifyTagModification: function(aCard) {
			function removeTagModification(element) {
				return (element.indexOf("X-THUNDERBIRD-MODIFICATION:") == -1);
			}
			aCard.others = aCard.others.filter(removeTagModification);
			aCard.created = false;
			aCard.updated = false;
			aCard.deleted = false;
		},

		updateRev: function(aCard) {
			var sysdate = new Date();
			var year = sysdate.getFullYear();
			var month = ("0" + (sysdate.getMonth() + 1)).slice(-2);
			var day = ("0" + sysdate.getDate()).slice(-2);
			var hour = ("0" + sysdate.getHours()).slice(-2);
			var min = ("0" + sysdate.getMinutes()).slice(-2);
			var sec = ("0" + sysdate.getSeconds()).slice(-2);
			aCard.rev = year + month + day + "T" + hour + min + sec + "Z";
		},

		addEtag: function(aCard, aEtag) {
			if (!(aEtag != null && aEtag !== undefined && aEtag != "")) {
				aEtag = "0";
			} else {
				var cardbookPrefService = new cardbookPreferenceService(aCard.dirPrefId);
				var myPrefType = cardbookPrefService.getType();
				if (myPrefType != "FILE" || myPrefType != "CACHE"|| myPrefType != "DIRECTORY") {
					cardbookUtils.nullifyEtag(aCard);
					aCard.others.push("X-THUNDERBIRD-ETAG:" + aEtag);
					aCard.etag = aEtag;
				}
			}
		},

		nullifyEtag: function(aCard) {
			function removeEtag(element) {
				return (element.indexOf("X-THUNDERBIRD-ETAG:") == -1);
			}
			aCard.others = aCard.others.filter(removeEtag);
			aCard.etag = "";
		},

		prepareCardForCreation: function(aCard, aPrefType, aUrl) {
			if (aUrl[aUrl.length - 1] != '/') {
				aUrl += '/';
			}
			if (aPrefType === "GOOGLE") {
				aCard.cardurl = aUrl + aCard.uid;
			} else {
				aCard.cardurl = aUrl + aCard.uid + ".vcf";
			}
		},
		
		getCardsFromAccountsOrCats: function () {
			try {
				var listOfSelectedCard = [];
				var myTree = document.getElementById('accountsOrCatsTree');
				if (cardbookRepository.cardbookSearchMode === "SEARCH" || cardbookRepository.cardbookComplexSearchMode === "SEARCH") {
					var myAccountPrefId = cardbookRepository.cardbookSearchValue;
				} else {
					var myAccountPrefId = myTree.view.getCellText(myTree.currentIndex, {id: "accountId"});
				}
				for (var i = 0; i < cardbookRepository.cardbookDisplayCards[myAccountPrefId].length; i++) {
					listOfSelectedCard.push(cardbookRepository.cardbookDisplayCards[myAccountPrefId][i]);
				}
				return listOfSelectedCard;
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookUtils.getCardsFromAccountsOrCats error : " + e, "Error");
			}
		},

		getCardsFromCards: function () {
			try {
				var listOfSelectedCard = [];
				var myTree = document.getElementById('cardsTree');
				var numRanges = myTree.view.selection.getRangeCount();
				var start = new Object();
				var end = new Object();
				for (var i = 0; i < numRanges; i++) {
					myTree.view.selection.getRangeAt(i,start,end);
					for (var j = start.value; j <= end.value; j++){
						listOfSelectedCard.push(cardbookRepository.cardbookCards[myTree.view.getCellText(j, {id: "dirPrefId"})+"::"+myTree.view.getCellText(j, {id: "uid"})]);
					}
				}
				return listOfSelectedCard;
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookUtils.getCardsFromCards error : " + e, "Error");
			}
		},

		getMediaCacheFile: function (aUid, aDirPrefId, aEtag, aType, aExtension) {
			try {
				aEtag = cardbookUtils.cleanEtag(aEtag);
				var mediaFile = cardbookRepository.getLocalDirectory();
				mediaFile.append(aDirPrefId);
				mediaFile.append("mediacache");
				if (!mediaFile.exists() || !mediaFile.isDirectory()) {
					// read and write permissions to owner and group, read-only for others.
					mediaFile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0774);
				}
				var fileName = aUid + "." + aEtag + "." + aType + "." + aExtension;
				fileName = fileName.replace(/([\\\/\:\*\?\"\<\>\|]+)/g, '-');
				mediaFile.append(fileName);
				return mediaFile;
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookUtils.getMediaCacheFile error : " + e, "Error");
			}
		},

		changeMediaFromFileToContent: function (aCard) {
			try {
				var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
				var mediaName = [ 'photo', 'logo', 'sound' ];

				for (var i in mediaName) {
					if (aCard[mediaName[i]].localURI != null && aCard[mediaName[i]].localURI !== undefined && aCard[mediaName[i]].localURI != "") {
						var myFileURISpec = aCard[mediaName[i]].localURI.replace("VALUE=uri:","");
						if (myFileURISpec.indexOf("file:///") === 0) {
							var myFileURI = ioService.newURI(myFileURISpec, null, null);
							aCard[mediaName[i]].value = cardbookSynchronization.getFileBinary(myFileURI);
							aCard[mediaName[i]].localURI = "";
						}
					}
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookUtils.changeMediaFromFileToContent error : " + e, "Error");
			}
		},

		clipboardSet: function (aText, aMessage) {
			let ss = Components.classes['@mozilla.org/supports-string;1'].createInstance(Components.interfaces.nsISupportsString);
			if (!ss)
				return;
	
			let trans = Components.classes['@mozilla.org/widget/transferable;1'].createInstance(Components.interfaces.nsITransferable);
			if (!trans)
				return;
	
			let clipid = Components.interfaces.nsIClipboard;
			let clipboard   = Components.classes['@mozilla.org/widget/clipboard;1'].getService(clipid);
			if (!clipboard)
				return;
	
			ss.data = aText;
			trans.addDataFlavor('text/unicode');
			trans.setTransferData('text/unicode', ss, aText.length * 2);
			clipboard.setData(trans, null, clipid.kGlobalClipboard);
			
			if (aMessage != null && aMessage !== undefined && aMessage != "") {
				wdw_cardbooklog.updateStatusProgressInformation(aMessage);
			}
		},

		clipboardGet: function () {
			try {
				let clipboard = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
	
				let trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
				trans.addDataFlavor("text/unicode");
	
				clipboard.getData(trans, clipboard.kGlobalClipboard);
	
				let str       = {};
				let strLength = {};
	
				trans.getTransferData("text/unicode", str, strLength);
				if (str)
					str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
	
				return str ? str.data.substring(0, strLength.value / 2) : null;
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookUtils.clipboardGet error : " + e, "Error");
			}
		},

		clipboardGetImage: function(aFile) {
			var extension = "png";
			var clip = Components.classes["@mozilla.org/widget/clipboard;1"].createInstance(Components.interfaces.nsIClipboard);
			var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
			trans.addDataFlavor("image/" + extension);
			clip.getData(trans,clip.kGlobalClipboard);
			var data = {};
			var dataLength = {};
			trans.getTransferData("image/" + extension,data,dataLength);
			if (data && data.value) {
				// remove an existing image (overwrite)
				if (aFile.exists()) {
					aFile.remove(true);
				}
				aFile.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );
				var outStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
				outStream.init(aFile, 0x04 | 0x08 | 0x20, -1, 0); // readwrite, create, truncate
				var inputStream = data.value.QueryInterface(Components.interfaces.nsIInputStream)
				var binInputStream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
				binInputStream.setInputStream(inputStream);
				try {
					while(true) {
						var len = Math.min(512,binInputStream.available());
						if (len == 0) break;
						var data = binInputStream.readBytes(len);
						if (!data || !data.length) break; outStream.write(data, data.length);
					}
				}
				catch(e) { return false; }
				try {
					inputStream.close();
					binInputStream.close();
					outStream.close();
				}
				catch(e) { return false; }
			} else {
				return false;
			}
			return true;
		},

		callFilePicker: function (aTitle, aMode, aType, aDefaultFileName) {
			try {
				var strBundle = document.getElementById("cardbook-strings");
				var myWindowTitle = strBundle.getString(aTitle);
				var nsIFilePicker = Components.interfaces.nsIFilePicker;
				var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
				if (aMode === "SAVE") {
					fp.init(window, myWindowTitle, nsIFilePicker.modeSave);
				} else if (aMode === "OPEN") {
					fp.init(window, myWindowTitle, nsIFilePicker.modeOpen);
				}
				if (aType === "VCF") {
					fp.appendFilter("VCF File","*.vcf");
				} else if (aType === "EXPORTFILE") {
					//bug 545091 on linux and macosx
					fp.defaultExtension = "vcf";
					fp.appendFilter("VCF File","*.vcf");
					fp.appendFilter("CSV File","*.csv");
				} else if (aType === "IMAGES") {
					fp.appendFilters(nsIFilePicker.filterImages);
				}
				fp.appendFilters(fp.filterAll);
				if (aDefaultFileName != null && aDefaultFileName !== undefined && aDefaultFileName != "") {
					fp.defaultString = aDefaultFileName;
				}
				var ret = fp.show();
				if (ret == nsIFilePicker.returnOK || ret == nsIFilePicker.returnReplace) {
					return fp.file;
				}
				return "";
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookUtils.callFilePicker error : " + e, "Error");
			}
		},

		callDirPicker: function (aTitle) {
			try {
				var strBundle = document.getElementById("cardbook-strings");
				var myWindowTitle = strBundle.getString(aTitle);
				var nsIFilePicker = Components.interfaces.nsIFilePicker;
				var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
				fp.init(window, myWindowTitle, nsIFilePicker.modeGetFolder);
				var ret = fp.show();
				if (ret == nsIFilePicker.returnOK || ret == nsIFilePicker.returnReplace) {
					return fp.file;
				}
				return "";
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookUtils.callDirPicker error : " + e, "Error");
			}
		},

		getTempFile: function (aFileName) {
			var myFile = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);
			myFile.append(aFileName);
			return myFile;
		},
			
		getExtension: function (aFile) {
			var myFileArray = aFile.split(".");
			if (myFileArray.length == 1) {
				var myExtension = "";
			} else {
				var myExtension = myFileArray[myFileArray.length-1];
			}
			return myExtension;
		},
			
		cleanEtag: function (aEtag) {
			if (aEtag) {
				if (aEtag.indexOf("https://") == 0 || aEtag.indexOf("http://") == 0 ) {
					// for open-exchange
					var myEtagArray = aEtag.split("/");
					aEtag = myEtagArray[myEtagArray.length - 1];
					aEtag = aEtag.replace(/(.*)_([^_]*)/, "$2");
				}
				return aEtag;
			}
			return "";
		},
			
		getPrefNameFromPrefId: function(aPrefId) {
			cardbookUtils.jsInclude(["chrome://cardbook/content/preferences/cardbookPreferences.js"]);
			let cardbookPrefService = new cardbookPreferenceService(aPrefId);
			return cardbookPrefService.getName();
		},
		
		getFreeFileName: function(aDirName, aName, aId, aExtension) {
			var myFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
			myFile.initWithPath(aDirName);
			myFile.append(aName.replace(/([\\\/\:\*\?\"\<\>\|]+)/g, '-') + aExtension);
			if (myFile.exists()) {
				var i = 0;
				while (i < 100) {
					var myFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
					myFile.initWithPath(aDirName);
					myFile.append(aName.replace(/([\\\/\:\*\?\"\<\>\|]+)/g, '-') + "." + i + aExtension);
					if (!(myFile.exists())) {
						return myFile.leafName;
					}
					i++;
				}
				return aId + aExtension;
			} else {
				return myFile.leafName;
			}
		},

		getFileNameForCard: function(aDirName, aName, aId) {
			return cardbookUtils.getFreeFileName(aDirName, aName, aId, ".vcf");
		},

		getFileNameFromUrl: function(aUrl) {
			var keyArray = aUrl.split("/");
			var key = decodeURIComponent(keyArray[keyArray.length - 1]);
			return key.replace(/([\\\/\:\*\?\"\<\>\|]+)/g, '-');
		},

		getFileCacheNameFromCard: function(aCard, aPrefIdType) {
			if (aCard.cacheuri != "") {
				return aCard.cacheuri;
			} else if (aPrefIdType === "DIRECTORY") {
				var cardbookPrefService = new cardbookPreferenceService(aCard.dirPrefId);
				var myDirPrefIdUrl = cardbookPrefService.getUrl();
				return cardbookUtils.getFileNameForCard(myDirPrefIdUrl, aCard.fn, aCard.uid);
			} else {
				if (aCard.cardurl != null && aCard.cardurl !== undefined && aCard.cardurl != "") {
					return cardbookUtils.getFileNameFromUrl(aCard.cardurl);
				} else {
					if (aPrefIdType === "GOOGLE") {
						return cardbookUtils.getFileNameFromUrl(aCard.uid);
					} else {
						return cardbookUtils.getFileNameFromUrl(aCard.uid) + ".vcf";
					}
				}
			}
		},

		randomChannel: function(brightness) {
			var r = 255-brightness;
			var n = 0|((Math.random() * r) + brightness);
			var s = n.toString(16);
			return (s.length==1) ? '0'+s : s;
		},

		randomColor: function(brightness) {
			return '#' + cardbookUtils.randomChannel(brightness) + cardbookUtils.randomChannel(brightness) + cardbookUtils.randomChannel(brightness);
		},

		isMyAccountEnabled: function(aDirPrefId) {
			cardbookUtils.jsInclude(["chrome://cardbook/content/preferences/cardbookPreferences.js"]);
			var cardbookPrefService = new cardbookPreferenceService(aDirPrefId);
			return cardbookPrefService.getEnabled();
		},

		isMyAccountReadOnly: function(aDirPrefId) {
			cardbookUtils.jsInclude(["chrome://cardbook/content/preferences/cardbookPreferences.js"]);
			var cardbookPrefService = new cardbookPreferenceService(aDirPrefId);
			return cardbookPrefService.getReadOnly();
		},

		getDisplayNameAndEmailFromEmails: function (aEmails) {
			var lString = aEmails.replace(/\;/g, " ").replace(/\,/g, " ");
			lString = lString.replace(/\\/g, " ").replace(/\"/g, " ");
			var listOfEmails = [];
			var myDisplayName = "";
			var myEmail = "";
			var cleanEmail = "";
			var enclosed = false;
			listOfEmails = lString.split(/[\s]+/);
			if (listOfEmails.length == 1) {
				var found = listOfEmails[0].replace(/</g, "").replace(/>/g, "");
				return [[found, found]];
			} else {
				var result = [];
				for (var i = 0; i < listOfEmails.length; i++) {
					if (listOfEmails[i].indexOf("<") >= 0) {
						enclosed = true;
					}
					if (enclosed) {
						if (listOfEmails[i].indexOf(">") >= 0) {
							cleanEmail = listOfEmails[i].replace(/</g, "").replace(/>/g, "");
							if (cleanEmail != "") {
								if (myEmail == "") {
									myEmail = cleanEmail;
								} else {
									myEmail = myEmail + " " + cleanEmail;
								}
							}
							if (myDisplayName == "") {
								myDisplayName = myEmail;
							}
							result.push([myDisplayName, myEmail]);
							myDisplayName = "";
							myEmail = "";
							enclosed = false;
						} else {
							cleanEmail = listOfEmails[i].replace(/</g, "");
							if (cleanEmail != "") {
								if (myEmail == "") {
									myEmail = cleanEmail;
								} else {
									myEmail = myEmail + " " + cleanEmail;
								}
							}
						}
					} else {
						if (listOfEmails[i].indexOf("@") >= 0) {
							var myEmail = listOfEmails[i];
							if (myDisplayName == "") {
								myDisplayName = myEmail;
							}
							result.push([myDisplayName, myEmail]);
							myDisplayName = "";
							myEmail = "";
						} else {
							if (myDisplayName == "") {
								myDisplayName = listOfEmails[i];
							} else {
								myDisplayName = myDisplayName + " " + listOfEmails[i];
							}
						}
					}
				}
				return cardbookUtils.arrayUnique2D(result);
			}
		},
				
		formatFnForEmail: function (aFn) {
			return aFn.replace(/;/g,"").replace(/,/g,"").replace(/</g,"").replace(/>/g,"");
		},

		getDisplayNameAndEmailFromCards: function (aListOfCards, aEmailPref) {
			var listOfEmail = [];
			cardbookUtils.jsInclude(["chrome://cardbook/content/cardbookMailPopularity.js", "chrome://cardbook/content/cardbookSynchronization.js", "chrome://cardbook/content/wdw_log.js"]);
			if (aListOfCards != null && aListOfCards !== undefined && aListOfCards != "") {
				for (var i = 0; i < aListOfCards.length; i++) {
					var notfoundOnePrefEmail = true;
					var listOfPrefEmail = [];
					var myPrefValue;
					var myOldPrefValue = 0;
					for (var j = 0; j < aListOfCards[i].email.length; j++) {
						var email = aListOfCards[i].email[j][0][0];
						var emailText = [cardbookUtils.formatFnForEmail(aListOfCards[i].fn), email];
						if (aEmailPref) {
							for (var k = 0; k < aListOfCards[i].email[j][1].length; k++) {
								if (aListOfCards[i].email[j][1][k].toUpperCase().indexOf("PREF") >= 0) {
									if (aListOfCards[i].email[j][1][k].toUpperCase().indexOf("PREF=") >= 0) {
										myPrefValue = aListOfCards[i].email[j][1][k].toUpperCase().replace("PREF=","");
									} else {
										myPrefValue = 1;
									}
									if (myPrefValue == myOldPrefValue || myOldPrefValue === 0) {
										listOfPrefEmail.push(emailText);
										myOldPrefValue = myPrefValue;
									} else if (myPrefValue < myOldPrefValue) {
										listOfPrefEmail = [];
										listOfPrefEmail.push(emailText);
										myOldPrefValue = myPrefValue;
									}
									notfoundOnePrefEmail = false;
								}
							}
						} else {
							listOfEmail.push(emailText);
							notfoundOnePrefEmail = false;
						}
					}
					if (notfoundOnePrefEmail) {
						for (var j = 0; j < aListOfCards[i].email.length; j++) {
							var email = aListOfCards[i].email[j][0][0];
							var emailText = [cardbookUtils.formatFnForEmail(aListOfCards[i].fn), email];
							listOfEmail.push(emailText);
						}
					} else {
						for (var j = 0; j < listOfPrefEmail.length; j++) {
							listOfEmail.push(listOfPrefEmail[j]);
						}
					}
				}
			}
			return listOfEmail;
		},

		getDisplayNameAndEmailFromList: function (aList, aEmailPref) {
			var emailResult = [];
			var recursiveList = [];
			
			function _verifyRecursivity(aList1) {
				for (var i = 0; i < recursiveList.length; i++) {
					if (recursiveList[i] == aList1) {
						cardbookUtils.formatStringForOutput("errorInfiniteLoopRecursion", [recursiveList.toSource()], "Error");
						return false;
					}
				}
				recursiveList.push(aList1);
				return true;
			};
					
			function _getEmails(aCard, aPrefEmails) {
				if (cardbookUtils.isMyCardAList(aCard)) {
					var myList = cardbookUtils.formatFnForEmail(aCard.fn).toLowerCase();
					if (_verifyRecursivity(aCard)) {
						_convert(aCard);
					}
				} else {
					var listOfEmail = []
					listOfEmail = cardbookUtils.getDisplayNameAndEmailFromCards([aCard], aPrefEmails);
					for (var i = 0; i < listOfEmail.length; i++) {
						emailResult.push([listOfEmail[i][0], listOfEmail[i][1]]);
					}
				}
			};
					
			function _convert(aList) {
				recursiveList.push(aList.fn);
				if (aList.version == "4.0") {
					for (var k = 0; k < aList.member.length; k++) {
						var uid = aList.member[k].replace("urn:uuid:", "");
						if (cardbookRepository.cardbookCards[aList.dirPrefId+"::"+uid]) {
							var myTargetCard = cardbookRepository.cardbookCards[aList.dirPrefId+"::"+uid];
							_getEmails(myTargetCard, aEmailPref);
						}
					}
				} else if (aList.version == "3.0") {
					var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
					var memberCustom = prefs.getComplexValue("extensions.cardbook.memberCustom", Components.interfaces.nsISupportsString).data;
					for (var k = 0; k < aList.others.length; k++) {
						var localDelim1 = aList.others[k].indexOf(":",0);
						if (localDelim1 >= 0) {
							var header = aList.others[k].substr(0,localDelim1);
							var trailer = aList.others[k].substr(localDelim1+1,aList.others[k].length);
							if (header == memberCustom) {
								if (cardbookRepository.cardbookCards[aList.dirPrefId+"::"+trailer.replace("urn:uuid:", "")]) {
									var myTargetCard = cardbookRepository.cardbookCards[aList.dirPrefId+"::"+trailer.replace("urn:uuid:", "")];
									_getEmails(myTargetCard, aEmailPref);
								}
							}
						}
					}
				}
			};
			
			_convert(aList);
			return emailResult;
		},

		getEmailsFromCards: function (aListOfCards, aEmailPref) {
			var listOfEmail = [];
			var result = [];
			listOfEmail = cardbookUtils.getDisplayNameAndEmailFromCards(aListOfCards, aEmailPref);
			for (var i = 0; i < listOfEmail.length; i++) {
				result.push(listOfEmail[i][0] + " <" + listOfEmail[i][1] + ">");
			}
			return result;
		},

		getEmailsFromCardsAndLists: function (aListOfCards, aEmailPref) {
			var result = [];
			for (var i = 0; i < aListOfCards.length; i++) {
				var listOfEmail = [];
				if (cardbookUtils.isMyCardAList(aListOfCards[i])) {
					listOfEmail = cardbookUtils.getDisplayNameAndEmailFromList(aListOfCards[i], aEmailPref);
				} else {
					listOfEmail = cardbookUtils.getDisplayNameAndEmailFromCards([aListOfCards[i]], aEmailPref);
				}
				for (var j = 0; j < listOfEmail.length; j++) {
					result.push(listOfEmail[j][0] + " <" + listOfEmail[j][1] + ">");
				}
			}
			return result;
		},

		getAddressesFromCards: function (aListOfCards) {
			var listOfAddresses= [];
			if (aListOfCards != null && aListOfCards !== undefined && aListOfCards != "") {
				for (var i = 0; i < aListOfCards.length; i++) {
					for (var j = 0; j < aListOfCards[i].adr.length; j++) {
						var adress = aListOfCards[i].adr[j][0];
						listOfAddresses.push(adress);
					}
				}
			}
			return listOfAddresses;
		},

		getURLsFromCards: function (aListOfCards) {
			var listOfURLs= [];
			if (aListOfCards != null && aListOfCards !== undefined && aListOfCards != "") {
				for (var i = 0; i < aListOfCards.length; i++) {
					for (var j = 0; j < aListOfCards[i].url.length; j++) {
						var url = aListOfCards[i].url[j][0];
						listOfURLs.push(url);
					}
				}
			}
			return listOfURLs;
		},

		openURL: function (aUrl) {
			try {
				var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
				var uri = ioService.newURI(aUrl, null, null);
			}
			catch(e) {
				cardbookUtils.formatStringForOutput("invalidURL", [aUrl], "Error");
				return;
			}
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var localizeTarget = prefs.getComplexValue("extensions.cardbook.localizeTarget", Components.interfaces.nsISupportsString).data;
			if (localizeTarget === "in") {
				let tabmail = document.getElementById("tabmail");
				if (!tabmail) {
					// Try opening new tabs in an existing 3pane window
					let mail3PaneWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("mail:3pane");
					if (mail3PaneWindow) {
						tabmail = mail3PaneWindow.document.getElementById("tabmail");
						mail3PaneWindow.focus();
					}
				}
				if (tabmail) {
					tabmail.openTab("contentTab", {contentPage: aUrl});
				} else {
					window.openDialog("chrome://messenger/content/", "_blank","chrome,dialog=no,all", null,
					{ tabType: "contentTab", tabParams: {contentPage: aUrl} });
				}
			} else if (localizeTarget === "out") {
				var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
				var uri = ioService.newURI(aUrl, null, null);
				var externalProtocolService = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Components.interfaces.nsIExternalProtocolService);
				externalProtocolService.loadURI(uri, null);
			}
		},

		isMyCardAList: function (aCard) {
			if (aCard.version == "4.0") {
				return (aCard.kind.toLowerCase() == 'group');
			} else if (aCard.version == "3.0") {
				var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				var kindCustom = prefs.getComplexValue("extensions.cardbook.kindCustom", Components.interfaces.nsISupportsString).data;
				for (var i = 0; i < aCard.others.length; i++) {
					var localDelim1 = aCard.others[i].indexOf(":",0);
					if (localDelim1 >= 0) {
						var header = aCard.others[i].substr(0,localDelim1);
						if (header == kindCustom) {
							var trailer = aCard.others[i].substr(localDelim1+1,aCard.others[i].length);
							return (trailer.toLowerCase() == 'group');
						}
					}
				}
			}
			return false;
		},
		
		getAllAvailableColumns: function (aMode) {
			var strBundle = document.getElementById("cardbook-strings");
			var result = [];
			for (var i = 0; i < cardbookRepository.allColumns.length; i++) {
				result.push([cardbookRepository.allColumns[i], strBundle.getString(cardbookRepository.allColumns[i] + "Label")]);
			}
			for (var i in cardbookRepository.customFields) {
				if (cardbookRepository.customFieldsValue[cardbookRepository.customFields[i]] != "") {
					result.push([cardbookRepository.customFieldsValue[cardbookRepository.customFields[i]], cardbookRepository.customFieldsLabel[cardbookRepository.customFields[i]]]);
				}
			}
			if (aMode === "export" || aMode === "all") {
				for (var i = 0; i < cardbookRepository.allArrayColumns.length; i++) {
					for (var k = 0; k < cardbookRepository.allArrayColumns[i][1].length; k++) {
						result.push([cardbookRepository.allArrayColumns[i][0] + "." + k + ".all",
													strBundle.getString(cardbookRepository.allArrayColumns[i][1][k] + "Label")]);
					}
				}
			}
			if (aMode === "import" || aMode === "all") {
				for (var i = 0; i < cardbookRepository.allArrayColumns.length; i++) {
					for (var k = 0; k < cardbookRepository.allArrayColumns[i][1].length; k++) {
						if (cardbookRepository.allArrayColumns[i][0] != "adr") {
							result.push([cardbookRepository.allArrayColumns[i][0] + "." + k + ".notype",
														strBundle.getString(cardbookRepository.allArrayColumns[i][1][k] + "Label") + " (" + strBundle.getString("importNoTypeLabel") + ")"]);
						}
					}
				}
			}
			var cardbookPrefService = new cardbookPreferenceService();
			for (var i = 0; i < cardbookRepository.allArrayColumns.length; i++) {
				var myPrefTypes = cardbookPrefService.getAllTypesByType(cardbookRepository.allArrayColumns[i][0]);
				for (var j = 0; j < myPrefTypes.length; j++) {
					for (var k = 0; k < cardbookRepository.allArrayColumns[i][1].length; k++) {
						result.push([cardbookRepository.allArrayColumns[i][0] + "." + k + "." + myPrefTypes[j][0],
													strBundle.getString(cardbookRepository.allArrayColumns[i][1][k] + "Label") + " (" + myPrefTypes[j][1] + ")"]);
					}
				}
			}
			return result;
		},

		findDelimiter: function (aContent, aEnclosingField) {
			for (var i = 2; i < aContent.length; i++) {
				if (aContent[i] == aEnclosingField && aContent[i-1] != "\\") {
					return aContent[i+1];
				}
			}
			return "";
		},

		CSVToArray: function (aContent, aDelimiter) {
			var result = [];
			var re = /[\n\u0085\u2028\u2029]|\r\n?/;
			if (aContent[0] == '"' || aContent[0] == "'") {
				var myEnclosingField = aContent[0];
				var aContentArray = aContent.split(re);
				while (aContentArray[aContentArray.length - 1] == "") {
					aContentArray.pop();
				}
				if (aDelimiter != null && aDelimiter !== undefined && aDelimiter != "") {
					var myDelimiter = aDelimiter;
				} else {
					var myDelimiter = cardbookUtils.findDelimiter(aContentArray[0], myEnclosingField);
				}
				var myNewContent = [];
				for (var i = 0; i < aContentArray.length; i++) {
					var myCurrentContent = aContentArray[i];
					while (true) {
						if ((myCurrentContent[myCurrentContent.length-1] == myEnclosingField && myCurrentContent[myCurrentContent.length-2] != "\\")
							|| (myCurrentContent[myCurrentContent.length-1] == myDelimiter) && myCurrentContent[myCurrentContent.length-2] != "\\") {
							myNewContent.push(myCurrentContent);
							break;
						} else {
							i++;
							myCurrentContent = myCurrentContent + "\r\n" + aContentArray[i];
						}
					}
				}
				for (var i = 0; i < myNewContent.length; i++) {
					result.push(myNewContent[i].split(myDelimiter));
				}
				return {result: result, delimiter: myDelimiter};
			} else {
				var aContentArray = aContent.split(re);
				if (aDelimiter != null && aDelimiter !== undefined && aDelimiter != "") {
					var myDelimiter = aDelimiter;
				} else {
					return {result: aContentArray, delimiter: ""};
				}
				for (var i = 0; i < aContentArray.length; i++) {
					result.push(aContentArray[i].split(myDelimiter));
				}
				return {result: result, delimiter: myDelimiter};
			}
		},

		addToCardBookMenuSubMenu: function(aMenuName, aCallback) {
			try {
				var myPopup = document.getElementById(aMenuName);
				while (myPopup.hasChildNodes()) {
					myPopup.removeChild(myPopup.firstChild);
				}
				for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
					if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][6] && !cardbookRepository.cardbookAccounts[i][7]) {
						var menuItem = document.createElement("menuitem");
						menuItem.setAttribute("id", cardbookRepository.cardbookAccounts[i][4]);
						menuItem.addEventListener("command", function(aEvent)
							{
								aCallback(this.id);
								aEvent.stopPropagation();
							}, false);
						menuItem.setAttribute("label", cardbookRepository.cardbookAccounts[i][0]);
						myPopup.appendChild(menuItem);
					}
				}
			}
			catch (e) {
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
				var errorTitle = "addToCardBookMenuSubMenu";
				prompts.alert(null, errorTitle, e);
			}
		},

		openEditionWindow: function(aCard, aMode) {
			try {
				var myArgs = {cardIn: aCard, cardOut: {}, editionMode: aMode, cardEditionAction: ""};
				var myWindow = window.openDialog("chrome://cardbook/content/cardEdition/wdw_cardEdition.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.cardEditionAction == "SAVE") {
					if ("undefined" == typeof(wdw_cardbook)) {
						var cardbookPrefService = new cardbookPreferenceService(myArgs.cardOut.dirPrefId);
						var myDirPrefIdType = cardbookPrefService.getType();
						var myDirPrefIdName = cardbookPrefService.getName();
						var myDirPrefIdUrl = cardbookPrefService.getUrl();
						cardbookUtils.setCalculatedFields(myArgs.cardOut);
						// Existing card
						if (myArgs.cardOut.uid != null && myArgs.cardOut.uid !== undefined && myArgs.cardOut.uid != "" && aCard.dirPrefId == myArgs.cardOut.dirPrefId) {
							var myCard = cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+myArgs.cardOut.uid];
							if (myDirPrefIdType === "CACHE" || myDirPrefIdType === "DIRECTORY") {
								// if aCard and aModifiedCard have the same cached medias
								cardbookUtils.changeMediaFromFileToContent(myArgs.cardOut);
								cardbookRepository.removeCardFromRepository(myCard, true);
								cardbookRepository.addCardToRepository(myArgs.cardOut, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myArgs.cardOut, myDirPrefIdType));
							} else if (myDirPrefIdType === "FILE") {
								// if aCard and myArgs.cardOut have the same cached medias
								cardbookUtils.changeMediaFromFileToContent(myArgs.cardOut);
								cardbookRepository.removeCardFromRepository(myCard, true);
								cardbookRepository.addCardToRepository(myArgs.cardOut, "WINDOW");
								cardbookSynchronization.writeCardsToFile(myDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[myArgs.cardOut.dirPrefId], true);
							} else {
								// if aCard and myArgs.cardOut have the same cached medias
								cardbookUtils.changeMediaFromFileToContent(myArgs.cardOut);
								if (!(cardbookUtils.searchTagCreated(myArgs.cardOut))) {
									cardbookUtils.addTagUpdated(myArgs.cardOut);
								}
								cardbookRepository.removeCardFromRepository(myCard, true);
								cardbookRepository.addCardToRepository(myArgs.cardOut, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myArgs.cardOut, myDirPrefIdType));
							}
							cardbookUtils.formatStringForOutput("cardUpdatedOK", [myDirPrefIdName, myArgs.cardOut.fn]);
						// Moved card
						} else if (myArgs.cardOut.uid != null && myArgs.cardOut.uid !== undefined && myArgs.cardOut.uid != "" && aCard.dirPrefId != myArgs.cardOut.dirPrefId) {
							var myCard = cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+myArgs.cardOut.uid];
							var cardbookPrefService = new cardbookPreferenceService(myCard.dirPrefId);
							var myDirPrefIdName = cardbookPrefService.getName();
							var myDirPrefIdType = cardbookPrefService.getType();
							if (myDirPrefIdType === "FILE") {
								cardbookRepository.removeCardFromRepository(myCard, false);
								cardbookSynchronization.writeCardsToFile(myDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[myCard.dirPrefId], true);
							} else if (myDirPrefIdType === "CACHE" || myDirPrefIdType === "DIRECTORY") {
								cardbookRepository.removeCardFromRepository(myCard, true);
							} else {
								if (cardbookUtils.searchTagCreated(myCard)) {
									cardbookRepository.removeCardFromRepository(myCard, true);
								} else {
									cardbookUtils.addTagDeleted(myCard);
									cardbookRepository.addCardToCache(myCard, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myCard));
									cardbookRepository.removeCardFromRepository(myCard, false);
								}
							}
							cardbookUtils.formatStringForOutput("cardDeletedOK", [myDirPrefIdName, myCard.fn]);
							wdw_cardbooklog.addActivity("cardDeletedOK", [myDirPrefIdName, myCard.fn], "deleteMail");
							
							var cardbookPrefService = new cardbookPreferenceService(myArgs.cardOut.dirPrefId);
							var myDirPrefIdName = cardbookPrefService.getName();
							var myDirPrefIdType = cardbookPrefService.getType();
							myArgs.cardOut.cardurl = "";
							myArgs.cardOut.uid = cardbookUtils.getUUID();
							if (myDirPrefIdType === "CACHE" || myDirPrefIdType === "DIRECTORY") {
								cardbookRepository.addCardToRepository(myArgs.cardOut, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myArgs.cardOut, myDirPrefIdType));
							} else if (myDirPrefIdType === "FILE") {
								cardbookRepository.addCardToRepository(myArgs.cardOut, "WINDOW");
								cardbookSynchronization.writeCardsToFile(myCurrentDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[myArgs.cardOut.dirPrefId], true);
							} else {
								cardbookUtils.addTagCreated(myArgs.cardOut);
								cardbookUtils.addEtag(myArgs.cardOut, "0");
								cardbookRepository.addCardToRepository(myArgs.cardOut, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myArgs.cardOut, myDirPrefIdType));
							}
							cardbookUtils.formatStringForOutput("cardCreatedOK", [myDirPrefIdName, myArgs.cardOut.fn]);
							wdw_cardbooklog.addActivity("cardCreatedOK", [myDirPrefIdName, myArgs.cardOut.fn], "addItem");
						// New card
						} else {
							myArgs.cardOut.uid = cardbookUtils.getUUID();
							Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
							if (myDirPrefIdType === "CACHE" || myDirPrefIdType === "DIRECTORY") {
								cardbookRepository.addCardToRepository(myArgs.cardOut, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myArgs.cardOut, myDirPrefIdType));
							} else if (myDirPrefIdType === "FILE") {
								cardbookRepository.addCardToRepository(myArgs.cardOut, "WINDOW");
								cardbookSynchronization.writeCardsToFile(myDirPrefIdUrl, cardbookRepository.cardbookDisplayCards[myArgs.cardOut.dirPrefId], true);
							} else {
								cardbookUtils.addTagCreated(myArgs.cardOut);
								cardbookUtils.addEtag(myArgs.cardOut, "0");
								cardbookRepository.addCardToRepository(myArgs.cardOut, "WINDOW", cardbookUtils.getFileCacheNameFromCard(myArgs.cardOut, myDirPrefIdType));
							}
							cardbookUtils.formatStringForOutput("cardCreatedOK", [myDirPrefIdName, myArgs.cardOut.fn]);
							wdw_cardbooklog.addActivity("cardCreatedOK", [myDirPrefIdName, myArgs.cardOut.fn], "addItem");
						}
					} else {
						// Existing card
						if (myArgs.cardOut.uid != null && myArgs.cardOut.uid !== undefined && myArgs.cardOut.uid != "" && aCard.dirPrefId == myArgs.cardOut.dirPrefId) {
							wdw_cardbook.saveCard(myArgs.cardOut, myArgs.cardOut.dirPrefId);
						// Moved card
						} else if (myArgs.cardOut.uid != null && myArgs.cardOut.uid !== undefined && myArgs.cardOut.uid != "" && aCard.dirPrefId != myArgs.cardOut.dirPrefId) {
							var myCard = cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+myArgs.cardOut.uid];
							wdw_cardbook.deleteCards([myCard]);
							myArgs.cardOut.uid = "";
							myArgs.cardOut.cardurl = "";
							wdw_cardbook.saveCard(myArgs.cardOut, myArgs.cardOut.dirPrefId);
						// New card
						} else {
							wdw_cardbook.saveCard(myArgs.cardOut, myArgs.cardOut.dirPrefId);
						}
					}
					delete aCard;
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookUtils.openEditionWindow error : " + e, "Error");
			}
		},

		getUUID: function () {
			var uuidGen = Components.classes["@mozilla.org/uuid-generator;1"].getService(Components.interfaces.nsIUUIDGenerator);
			return uuidGen.generateUUID().toString().replace(/[{}]/g, '');
		},

		orientBoxes: function() {
			if (document.getElementById("cardsBox") && document.getElementById("resultsSplitterModern") && document.getElementById("resultsSplitterClassical")) {
				var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				var panesView = prefs.getComplexValue("extensions.cardbook.panesView", Components.interfaces.nsISupportsString).data;
				if (panesView == "modern") {
					document.getElementById("cardsBox").setAttribute("orient", "horizontal");
					document.getElementById("resultsSplitterModern").hidden=true;
					document.getElementById("resultsSplitterClassical").hidden=false;
				} else {
					document.getElementById("cardsBox").setAttribute("orient", "vertical");
					document.getElementById("resultsSplitterModern").hidden=false;
					document.getElementById("resultsSplitterClassical").hidden=true;
				}
			}
		},

		formatStringForOutput: function(aStringCode, aValuesArray, aErrorCode) {
			var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
			var strBundle = stringBundleService.createBundle("chrome://cardbook/locale/cardbook.properties");
			if (aValuesArray) {
				if (aErrorCode) {
					wdw_cardbooklog.updateStatusProgressInformation(strBundle.formatStringFromName(aStringCode, aValuesArray, aValuesArray.length), aErrorCode);
				} else {
					wdw_cardbooklog.updateStatusProgressInformation(strBundle.formatStringFromName(aStringCode, aValuesArray, aValuesArray.length));
				}
			} else {
				if (aErrorCode) {
					wdw_cardbooklog.updateStatusProgressInformation(strBundle.GetStringFromName(aStringCode), aErrorCode);
				} else {
					wdw_cardbooklog.updateStatusProgressInformation(strBundle.GetStringFromName(aStringCode));
				}
			}
		}

	};
};