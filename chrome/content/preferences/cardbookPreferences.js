function cardbookPreferenceService(uniqueId) {
    this.mPreferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    this.prefCardBookRoot = "extensions.cardbook.";
    this.prefCardBookData = this.prefCardBookRoot + "data.";
    this.prefCardBookTypes = this.prefCardBookRoot + "types.";
    this.prefCardBookCustoms = this.prefCardBookRoot + "customs.";
    this.prefCardBookMailAccount = this.prefCardBookRoot + "mailAccount.";
    this.prefPath = this.prefCardBookData + uniqueId + ".";
}

cardbookPreferenceService.prototype = {
    mPreferencesService: null,
    prefPath: null,

	_arrayUnique: function (array) {
		var a = array.concat();
		for(var i=0; i<a.length; ++i) {
			for(var j=i+1; j<a.length; ++j) {
				if(a[i] === a[j])
					a.splice(j--, 1);
			}
		}
		return a;
	},
	
    _getBoolRootPref: function (prefName) {
		try {
			let value = this.mPreferencesService.getBoolPref(prefName);
			return value;
		}
		catch(e) {
			return false;
		}
    },

    _getBoolPref: function (prefName, aDefault) {
		try {
			let value = this.mPreferencesService.getBoolPref(this.prefPath + prefName);
			return value;
		}
		catch(e) {
			return aDefault;
		}
    },

    _setBoolRootPref: function (prefName, value) {
		try {
			this.mPreferencesService.setBoolPref(prefName, value);
		}
		catch(e) {
			dump("cardbookPreferenceService._setBoolRootPref : failed to set" + prefName + "\n" + e + "\n");
		}
    },

    _setBoolPref: function (prefName, value) {
		try {
			this.mPreferencesService.setBoolPref(this.prefPath + prefName, value);
		}
		catch(e) {
			dump("cardbookPreferenceService._setBoolPref : failed to set" + this.prefPath + prefName + "\n" + e + "\n");
		}
    },

    _getPref: function (prefName) {
		try {
			let value = this.mPreferencesService.getComplexValue(this.prefPath + prefName, Components.interfaces.nsISupportsString).data;
			return value;
		}
		catch(e) {
			return "";
		}
    },

    _setPref: function (prefName, value) {
		try {
			var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			str.data = value;
			this.mPreferencesService.setComplexValue(this.prefPath + prefName, Components.interfaces.nsISupportsString, str);
		}
		catch(e) {
			dump("cardbookPreferenceService._setPref : failed to set" + this.prefPath + prefName + "\n" + e + "\n");
		}
    },

    insertAdrSeedTypes: function () {
		this.setTypes("adr",1,"HOME");
		this.setTypes("adr",2,"WORK");
    },

    insertEmailSeedTypes: function () {
		this.setTypes("email",1,"HOME");
		this.setTypes("email",2,"WORK");
    },

    insertImppSeedTypes: function () {
		this.setTypes("impp",1,"HOME");
		this.setTypes("impp",1,"WORK");
    },

    insertTelSeedTypes: function () {
		this.setTypes("tel",1,"CELL");
		this.setTypes("tel",2,"FAX");
		this.setTypes("tel",3,"HOME");
		this.setTypes("tel",4,"WORK");
    },

    insertUrlSeedTypes: function () {
		this.setTypes("url",1,"HOME");
		this.setTypes("url",2,"WORK");
    },

    getAllTypesCategory: function () {
		try {
			var count = {};
			var finalResult = [];
			var result = this.mPreferencesService.getChildList(this.prefCardBookTypes, count);
			
			for (let i = 0; i < result.length; i++) {
				finalResult.push(result[i].replace(this.prefCardBookTypes,""));
			}
			finalResult = this._arrayUnique(finalResult);
			finalResult = finalResult.sort(function(a,b) {
				return a[0].localeCompare(b[0], 'en', {'sensitivity': 'base'});
			});
			return finalResult;
		}
		catch(e) {
			dump("cardbookPreferenceService.getAllTypesCategory error : " + e + "\n");
		}
    },

    getAllTypesByType: function (aType) {
		try {
			var count = {};
			var finalResult = [];
			var finalResult1 = [];
			if (aType === "adr" || aType === "address") {
				var result = this.mPreferencesService.getChildList(this.prefCardBookTypes + "adr" + ".", count);
				if (result.length == 0) {
					var result = this.mPreferencesService.getChildList(this.prefCardBookTypes + "address" + ".", count);
				}
			} else {
				var result = this.mPreferencesService.getChildList(this.prefCardBookTypes + aType + ".", count);
			}
			
			for (let i = 0; i < result.length; i++) {
				var prefName = result[i].replace(this.prefCardBookTypes, "");
				finalResult.push(this.getTypes(prefName));
			}
			finalResult = this._arrayUnique(finalResult);
			for (let i = 0; i < finalResult.length; i++) {
				if (finalResult[i].indexOf(":") > 0) {
					var tmpArray = finalResult[i].split(":");
					if (tmpArray[1] != null && tmpArray[1] !== undefined && tmpArray[1] != "") {
						finalResult1.push([tmpArray[0], tmpArray[1]]);
					} else {
						finalResult1.push([tmpArray[0], tmpArray[0]]);
					}
				} else {
					try {
						var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
						var strBundle = stringBundleService.createBundle("chrome://cardbook/locale/cardbook.properties");
						var translated = strBundle.GetStringFromName("types." + aType.toLowerCase() + "." + finalResult[i].toLowerCase());
						if (translated != null && translated !== undefined && translated != "") {
							finalResult1.push([finalResult[i], translated]);
						} else {
							finalResult1.push([finalResult[i], finalResult[i]]);
						}
					}
					catch(e) {
						finalResult1.push([finalResult[i], finalResult[i]]);
					}
				}
			}
			finalResult1 = finalResult1.sort(function(a,b) {
				return a[1].localeCompare(b[1], 'en', {'sensitivity': 'base'});
			});
			return finalResult1;
		}
		catch(e) {
			dump("cardbookPreferenceService.getAllTypesByType error : " + e + "\n");
		}
    },

    getAllTypes: function () {
		try {
			var finalResult = {};
			var typesList = [ 'email', 'tel', 'impp', 'url', 'adr' ];
			for (var i in typesList) {
				var type = typesList[i];
				finalResult[type] = [];
				finalResult[type] = this.getAllTypesByType(type);
			}
			return finalResult;
		}
		catch(e) {
			dump("cardbookPreferenceService.getAllTypes error : " + e + "\n");
		}
    },

    getTypeLabel: function (aType, aCode) {
		try {
			var resultTmp = [];
			resultTmp = this.getAllTypesByType(aType);
			for (let i = 0; i < resultTmp.length; i++) {
				if (resultTmp[i][0].toLowerCase() == aCode.toLowerCase()) {
					return resultTmp[i][1];
				}
			}
			return aCode;
		}
		catch(e) {
			dump("cardbookPreferenceService.getTypeLabel error : " + e + "\n");
		}
    },

    getTypeCode: function (aType, aLabel) {
		try {
			var resultTmp = [];
			resultTmp = this.getAllTypesByType(aType);
			for (let i = 0; i < resultTmp.length; i++) {
				if (resultTmp[i][1] == aLabel) {
					return resultTmp[i][0];
				}
			}
			return aLabel;
		}
		catch(e) {
			dump("cardbookPreferenceService.getTypeCode error : " + e + "\n");
		}
    },

    getAllCustoms: function () {
		try {
			let count = {};
			let finalResult = [];
			let result = this.mPreferencesService.getChildList(this.prefCardBookCustoms, count);
			for (let i = 0; i < result.length; i++) {
				finalResult.push(result[i].replace(this.prefCardBookCustoms,"") + ":" + this.getCustoms(result[i]));
			}
			return this._arrayUnique(finalResult);
		}
		catch(e) {
			dump("cardbookPreferenceService.getAllCustoms error : " + e + "\n");
		}
    },

    getAllPrefIds: function () {
		try {
			let count = {};
			let finalResult = [];
			let result = this.mPreferencesService.getChildList(this.prefCardBookData, count);
			for (let i = 0; i < result.length; i++) {
				result[i] = result[i].replace(this.prefCardBookData,"");
				finalResult.push(result[i].substring(0, result[i].indexOf(".")));
			}
			return this._arrayUnique(finalResult);
		}
		catch(e) {
			dump("cardbookPreferenceService.getAllPrefIds error : " + e + "\n");
		}
    },

    getAllMailAccounts: function () {
		try {
			let count = {};
			let finalResult = [];
			let result = this.mPreferencesService.getChildList(this.prefCardBookMailAccount, count);
			for (let i = 0; i < result.length; i++) {
				result[i] = result[i].replace(this.prefCardBookMailAccount,"");
				finalResult.push(result[i].substring(0, result[i].indexOf(".")));
			}
			return this._arrayUnique(finalResult);
		}
		catch(e) {
			return [];
		}
    },

    getTypes: function (prefName) {
		try {
			let value = this.mPreferencesService.getComplexValue(this.prefCardBookTypes + prefName, Components.interfaces.nsISupportsString).data;
			return value;
		}
		catch(e) {
			dump("cardbookPreferenceService.getTypes : failed to get" + this.prefCardBookTypes + prefName + "\n" + e + "\n");
		}
    },

    setTypes: function (aType, prefName, value) {
		try {
			var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			str.data = value;
			this.mPreferencesService.setComplexValue(this.prefCardBookTypes + aType + "." + prefName, Components.interfaces.nsISupportsString, str);
		}
		catch(e) {
			dump("cardbookPreferenceService.setTypes : failed to set" + this.prefCardBookTypes + aType + "." + prefName + "\n" + e + "\n");
		}
    },

    delTypes: function (aType) {
		try {
			if (aType != null && aType !== undefined && aType != "") {
				this.mPreferencesService.deleteBranch(this.prefCardBookTypes + aType);
			} else {
				this.mPreferencesService.deleteBranch(this.prefCardBookTypes);
			}
		}
		catch(e) {
			dump("cardbookPreferenceService.delTypes : failed to delete" + this.prefCardBookTypes + aType + "\n" + e + "\n");
		}
    },

    getCustoms: function (prefName) {
		try {
			let value = this.mPreferencesService.getComplexValue(prefName, Components.interfaces.nsISupportsString).data;
			return value;
		}
		catch(e) {
			dump("cardbookPreferenceService.getCustoms : failed to get" + prefName + "\n" + e + "\n");
		}
    },

    setCustoms: function (prefName, value) {
		try {
			var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			str.data = value;
			this.mPreferencesService.setComplexValue(this.prefCardBookCustoms + prefName, Components.interfaces.nsISupportsString, str);
		}
		catch(e) {
			dump("cardbookPreferenceService.setCustoms : failed to set" + this.prefCardBookCustoms + prefName + "\n" + e + "\n");
		}
    },

    delCustoms: function () {
		try {
			this.mPreferencesService.deleteBranch(this.prefCardBookCustoms);
		}
		catch(e) {
			dump("cardbookPreferenceService.delCustoms : failed to delete" + this.prefCardBookCustoms + "\n" + e + "\n");
		}
    },

    getMailAccountEnabled: function (aMailAccount) {
		try {
			let value = this.mPreferencesService.getBoolPref(this.prefCardBookMailAccount + aMailAccount + ".enabled");
			return value;
		}
		catch(e) {
			return false;
		}
    },

    getMailAccountFileName: function (aMailAccount) {
		try {
			let value = this.mPreferencesService.getComplexValue(this.prefCardBookMailAccount + aMailAccount + ".filename", Components.interfaces.nsISupportsString).data;
			return value;
		}
		catch(e) {
			return "";
		}
    },

    getMailAccountUid: function (aMailAccount) {
		try {
			let value = this.mPreferencesService.getComplexValue(this.prefCardBookMailAccount + aMailAccount + ".uid", Components.interfaces.nsISupportsString).data;
			return value;
		}
		catch(e) {
			return "";
		}
    },

    getMailAccountDirPrefId: function (aMailAccount) {
		try {
			let value = this.mPreferencesService.getComplexValue(this.prefCardBookMailAccount + aMailAccount + ".dirprefid", Components.interfaces.nsISupportsString).data;
			return value;
		}
		catch(e) {
			return "";
		}
    },

    setMailAccountEnabled: function (aMailAccount, value) {
		try {
			this.mPreferencesService.setBoolPref(this.prefCardBookMailAccount + aMailAccount + ".enabled", value);
		}
		catch(e) {
			dump("cardbookPreferenceService.setMailAccountEnabled : failed to set" + this.prefCardBookMailAccount + aMailAccount + ".enabled" + "\n" + e + "\n");
		}
    },

    setMailAccountFileName: function (aMailAccount, value) {
		try {
			var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			str.data = value;
			this.mPreferencesService.setComplexValue(this.prefCardBookMailAccount + aMailAccount + ".filename", Components.interfaces.nsISupportsString, str);
		}
		catch(e) {
			dump("cardbookPreferenceService.setMailAccountFileName : failed to set" + this.prefCardBookMailAccount + aMailAccount + ".filename" + "\n" + e + "\n");
		}
    },

    setMailAccountUid: function (aMailAccount, value) {
		try {
			var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			str.data = value;
			this.mPreferencesService.setComplexValue(this.prefCardBookMailAccount + aMailAccount + ".uid", Components.interfaces.nsISupportsString, str);
		}
		catch(e) {
			dump("cardbookPreferenceService.setMailAccountFileName : failed to set" + this.prefCardBookMailAccount + aMailAccount + ".uid" + "\n" + e + "\n");
		}
    },

    setMailAccountDirPrefId: function (aMailAccount, value) {
		try {
			var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			str.data = value;
			this.mPreferencesService.setComplexValue(this.prefCardBookMailAccount + aMailAccount + ".dirprefid", Components.interfaces.nsISupportsString, str);
		}
		catch(e) {
			dump("cardbookPreferenceService.setMailAccountDirPrefId : failed to set" + this.prefCardBookMailAccount + aMailAccount + ".dirprefid" + "\n" + e + "\n");
		}
    },

    delMailAccount: function (aMailAccount) {
		try {
			if (aMailAccount != null && aMailAccount !== undefined && aMailAccount != "") {
				this.mPreferencesService.deleteBranch(this.prefCardBookMailAccount + aMailAccount);
			} else {
				this.mPreferencesService.deleteBranch(this.prefCardBookMailAccount);
			}
		}
		catch(e) {
			dump("cardbookPreferenceService.delMailAccount : failed to delete" + this.prefCardBookMailAccount + aMailAccount + "\n" + e + "\n");
		}
    },

    getId: function () {
        return this._getPref("id");
    },

    setId: function (id) {
        this._setPref("id", id);
    },

    getName: function () {
        return this._getPref("name");
    },

    setName: function (name) {
        this._setPref("name", name);
    },

    getUrl: function () {
        let url = this._getPref("url");
        let type = this._getPref("type");
        if (type !== "FILE" && type !== "CACHE" && type !== "DIRECTORY") {
			if (url) {
				if (url[url.length - 1] != '/') {
					url += '/';
				}
			}
			return url;
		// for file opened with version <= 3.7
		} else {
			if (url !== "0") {
				return url;
			} else {
				let newUrl = this._getPref("name");
				this.setUrl(newUrl);
				return newUrl;
			}
		}
    },

    setUrl: function (url) {
        this._setPref("url", url);
    },

    getUser: function () {
        return this._getPref("user");
    },

    setUser: function (user) {
        this._setPref("user", user);
    },

    getType: function () {
        return this._getPref("type");
    },

    setType: function (type) {
        this._setPref("type", type);
    },

    getEnabled: function () {
        return this._getBoolPref("enabled", true);
    },

    setEnabled: function (enabled) {
        this._setBoolPref("enabled", enabled);
    },

    getReadOnly: function () {
        return this._getBoolPref("readonly", false);
    },

    setReadOnly: function (readonly) {
        this._setBoolPref("readonly", readonly);
    },

    getExpanded: function () {
        return this._getBoolPref("expanded", true);
    },

    setExpanded: function (expanded) {
        this._setBoolPref("expanded", expanded);
    },

   getColor: function () {
        let color = this._getPref("color");
        if (color != null && color !== undefined && color != "") {
        	return color;
        } else {
        	return "#A8C2E1";
        }
    },

    setColor: function (color) {
        this._setPref("color", color);
    },

    getHideHeaders: function () {
        let hideheaders = this._getBoolRootPref(this.prefCardBookRoot + "hideheaders");
        if (hideheaders === true) return true;
        else return false;
    },

    setHideHeaders: function (hideheaders) {
        this._setBoolRootPref(this.prefCardBookRoot + "hideheaders", hideheaders);
    },

   getVCard: function () {
        let vCard = this._getPref("vCard");
        if (vCard != null && vCard !== undefined && vCard != "") {
        	return vCard;
        } else {
        	vCard = this._getBoolRootPref(this.prefCardBookRoot + "cardCreationVersion");
	if (vCard != null && vCard !== undefined && vCard != "") {
		return vCard;
	} else {
		return "3.0";
	}
        }
    },

    setVCard: function (aVCard) {
        this._setPref("vCard", aVCard);
    },

   getPrefLabel: function () {
		let prefLabel = this.mPreferencesService.getComplexValue(this.prefCardBookRoot + "preferenceLabel", Components.interfaces.nsISupportsString).data;
        if (prefLabel != null && prefLabel !== undefined && prefLabel != "") {
        	return prefLabel;
        } else {
	let stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
	let strBundle = stringBundleService.createBundle("chrome://cardbook/locale/cardbook.properties");
        	return strBundle.GetStringFromName("prefLabel");
        }
    },

    setPrefLabel: function (aPrefLabel) {
		var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
		str.data = aPrefLabel;
		this.mPreferencesService.setComplexValue(this.prefCardBookRoot + "preferenceLabel", Components.interfaces.nsISupportsString, str);
    },

   getPrefValueLabel: function () {
		let prefValueLabel = this.mPreferencesService.getComplexValue(this.prefCardBookRoot + "preferenceValueLabel", Components.interfaces.nsISupportsString).data;
        if (prefValueLabel != null && prefValueLabel !== undefined && prefValueLabel != "") {
        	return prefValueLabel;
        } else {
	let stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
	let strBundle = stringBundleService.createBundle("chrome://cardbook/locale/cardbook.properties");
        	return strBundle.GetStringFromName("prefValueLabel");
        }
    },

    setPrefValueLabel: function (aPrefValueLabel) {
		var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
		str.data = aPrefValueLabel;
		this.mPreferencesService.setComplexValue(this.prefCardBookRoot + "aPrefValueLabel", Components.interfaces.nsISupportsString, str);
    },

    delBranch: function () {
		try {
			this.mPreferencesService.deleteBranch(this.prefPath);
		}
		catch(e) {
			dump("cardbookPreferenceService.delBranch : failed to delete" + this.prefPath + "\n" + e + "\n");
		}
    },

};
