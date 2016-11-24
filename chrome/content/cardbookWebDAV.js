Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function XMLToJSONParser(doc) {
	this._buildTree(doc);
}

XMLToJSONParser.prototype = {
	_buildTree: function XMLToJSONParser_buildTree(doc) {
		let nodeName = doc.documentElement.localName;
		this[nodeName] = [this._translateNode(doc.documentElement)];
	},
	
	_translateNode: function XMLToJSONParser_translateNode(node) {
		let value = null;
		if (node.childNodes.length) {
			let textValue = "";
			let dictValue = {};
			let hasElements = false;
			for (let i = 0; i < node.childNodes.length; i++) {
				let currentNode = node.childNodes[i];
				let nodeName = currentNode.localName;
				if (currentNode.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
					textValue += currentNode.nodeValue;
				} else if (currentNode.nodeType == Components.interfaces.nsIDOMNode.CDATA_SECTION_NODE) {
					textValue += currentNode.nodeValue;
				} else if (currentNode.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
					hasElements = true;
					let nodeValue = this._translateNode(currentNode);
					if (!dictValue[nodeName]) {
						dictValue[nodeName] = [];
					}
					dictValue[nodeName].push(nodeValue);
				}
			}
			if (hasElements) {
				value = dictValue;
			} else {
				value = textValue;
			}
		}
		return value;
	}
};

function cardbookWebDAV(connection, target, etag, asJSON) {
	this.prefId = connection.connPrefId;
	this.url = connection.connUrl;
	this.logDescription = connection.connDescription;
	this.target = target;
	this.etag = etag;
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	var requestsTimeout = prefs.getComplexValue("extensions.cardbook.requestsTimeout", Components.interfaces.nsISupportsString).data;
	this.timeout = requestsTimeout * 1000;

	this.requestJSONResponse = false;
	this.requestXMLResponse = false;
	if (typeof asJSON != "undefined") {
		this.requestJSONResponse = asJSON;
		this.requestXMLResponse = !asJSON;
	}
	
	this.username = connection.connUser;
	this.password = "";
	this.accessToken = connection.accessToken;
	this.reportLength = 0;
}

cardbookWebDAV.prototype = {
	jsInclude: function(files, target) {
		var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
		for (var i = 0; i < files.length; i++) {
			try {
				loader.loadSubScript(files[i], target);
			}
			catch(e) {
				dump("cardbookWebDAV.jsInclude : failed to include '" + files[i] + "'\n" + e + "\n");
			}
		}
	},

	_getCredentials: function (aHeader) {
		this.jsInclude(["chrome://cardbook/content/preferences/cardbookPreferences.js", "chrome://cardbook/content/cardbookPasswordManager.js"]);
		if (this.accessToken != null && this.accessToken !== undefined && this.accessToken != "") {
			if (this.accessToken !== "NOACCESSTOKEN") {
				aHeader["Authorization"] = this.accessToken;
				aHeader["GData-Version"] = "3";
			}
			this.username = "";
			this.password = "";
		} else {
			if (!(this.username != null && this.username !== undefined && this.username != "")) {
				if (this.prefId != null && this.prefId !== undefined && this.prefId != "") {
					var cardbookPrefService = new cardbookPreferenceService(this.prefId);
					this.username = cardbookPrefService.getUser();
				} else {
					this.username = "";
				}
			}
			if (this.username != null && this.username !== undefined && this.username != "") {
				this.password = cardbookPasswordManager.getNotNullPassword(this.username, this.prefId);
			}
			aHeader["Authorization"] = "Basic " + btoa(this.username + ':' + this.password);
		}
	},

    _sendHTTPRequest: function(method, body, headers, aOverrideMime) {
    	try {
		let httpChannel = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
		httpChannel.loadFlags |= Components.interfaces.nsIRequest.LOAD_ANONYMOUS | Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE | Components.interfaces.nsIRequest.INHIBIT_PERSISTENT_CACHING;
		httpChannel.notificationCallbacks = this;

			if (this.timeout != null && this.timeout !== undefined && this.timeout != "") {
				httpChannel.timeout = this.timeout;
			}

			headers["X-client"] = "CardBook (Thunderbird)";
			// needed for Apple
			headers["User-Agent"] = "Thunderbird";

			// let httpAuthManager = Components.classes["@mozilla.org/network/http-auth-manager;1"].getService(Components.interfaces.nsIHttpAuthManager);
			// httpAuthManager.clearAll();
			this._getCredentials(headers);

			// if (this.username != null && this.username !== undefined && this.username != "") {
				// httpChannel.overrideMimeType("text/xml");
			// }

            let this_ = this;
			httpChannel.onerror = function(aEvent) {
				this_._handleHTTPResponse(httpChannel, aEvent.target.status, aEvent.target.responseText.length, aEvent.target.responseText);
			};
			httpChannel.ontimeout = function(aEvent) {
				this_._handleHTTPResponse(httpChannel, 408, aEvent.target.responseText.length, aEvent.target.responseText);
			};
			httpChannel.onload = function(aEvent) {
				this_._handleHTTPResponse(httpChannel, aEvent.target.status, aEvent.target.responseText.length, aEvent.target.responseText);
			};

			wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : method : ", method);
			wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : body : ", body);
			if (headers) {
				wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : headers : ", headers.toSource());
			}
			wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : username : ", this.username);
			wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : url : ", this.url);

			httpChannel.open(method, this.url, true, this.username, this.password);
			
			if (aOverrideMime) {
				httpChannel.overrideMimeType('text/plain; charset=x-user-defined');
			}
			if (headers) {
				for (let header in headers) {
					httpChannel.setRequestHeader(header, headers[header]);
				}
			}

			if (body) {
				let converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
				converter.charset = "UTF-8";
				let stream = converter.convertToInputStream(body);
				httpChannel.send(stream);
			} else {
				httpChannel.send();
			}

		}
		catch(e) {
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
			var errorTitle = "_sendHTTPRequest error";
			prompts.alert(null, errorTitle, e);
		}
    },

    _handleHTTPResponse: function(aChannel, aStatus, aResultLength, aResult) {
		var status = aStatus;
		var headers = {};
		var response = null;
		wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : response text : ", aResult);
		wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : response code : ", aStatus);
		wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : response etag : ", aChannel.getResponseHeader("etag"));
		if (status !== 499 && status !== 0 && status !== 408) {
			if (aResultLength > 0) {
				var responseText = aResult;
				if (this.requestJSONResponse || this.requestXMLResponse) {
					let xmlParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);
					let responseXML = xmlParser.parseFromString(responseText, "text/xml");
					if (this.requestJSONResponse) {
						let parser = new XMLToJSONParser(responseXML);
						response = parser;
					} else {
						response = responseXML;
					}
				} else {
					response = responseText;
				}
			}
		}
		if (this.target && this.target.onDAVQueryComplete) {
			this.target.onDAVQueryComplete(status, response, aChannel.getResponseHeader("ETag"), this.reportLength);
		}
    },

    load: function(operation, parameters) {
        if (operation == "GET") {
			var headers = {};
			if (parameters.accept !== null) {
				headers.accept = parameters.accept;
			}
			this._sendHTTPRequest(operation, null, headers);
        } else if (operation == "GETIMAGE") {
			var headers = {};
			if (parameters.accept !== null) {
				headers.accept = parameters.accept;
			}
			this._sendHTTPRequest("GET", null, headers, "override");
        } else if (operation == "PUT") {
			if ((this.etag != null && this.etag !== undefined && this.etag != "") && (this.etag != "0")) {
				this._sendHTTPRequest(operation, parameters.data, { "content-type": parameters.contentType,
																	"If-Match": this.etag });
			} else {
				this._sendHTTPRequest(operation, parameters.data, { "content-type": parameters.contentType,
																	"If-None-Match": "*" });
			}
        } else if (operation == "PROPFIND") {
			let headers = { "depth": (parameters.deep ? "1": "0"), "content-type": "application/xml; charset=utf-8"};
			let query = this._propfindQuery(parameters.props);
			this._sendHTTPRequest(operation, query, headers);
       } else if (operation == "REPORT") {
			let headers = { "depth": (parameters.deep ? "1": "0"), "content-type": "application/xml; charset=utf-8"};
			let query = this._reportQuery(parameters.props);
			this._sendHTTPRequest(operation, query, headers);
        } else if (operation == "DELETE") {
        	this._sendHTTPRequest(operation, parameters, {});
        }
    },

	get: function(accept) {
		this.load("GET", {accept: accept});
	},

	getimage: function(accept) {
		this.load("GETIMAGE", {accept: accept});
	},

	put: function(data, contentType) {
		this.load("PUT", {data: data, contentType: contentType});
	},

	propfind: function(props, deep) {
		if (typeof deep == "undefined") {
			deep = true;
		}
		this.load("PROPFIND", {props: props, deep: deep});
	},

	report: function(props, deep) {
		if (typeof deep == "undefined") {
			deep = true;
		}
		this.load("REPORT", {props: props, deep: deep});
	},

	googleToken: function(aType, aParams, aHeaders) {
		var paramsString = "";
		for (var param in aParams) {
			if (!(paramsString != null && paramsString !== undefined && paramsString != "")) {
				paramsString = param + "=" + encodeURIComponent(aParams[param]);
			} else {
				paramsString = paramsString + "&" + param + "=" + encodeURIComponent(aParams[param]);
			}
		}
		var body = paramsString;

		this._sendHTTPRequest(aType, body, aHeaders);
	},
	
	delete: function() {
		this.load("DELETE");
	},
	
	_propfindQuery: function(props) {
		let nsDict = { "DAV:": "D" };
		let propPart = "";
		let nsCount = 0;
		for each (let prop in props) {
			let propParts = prop.split(" ");
			let ns = propParts[0];
			let nsS = nsDict[ns];
			if (!nsS) {
				nsS = "x" + nsCount;
				nsDict[ns] = nsS;
				nsCount++;
			}
			propPart += "<" + nsS + ":" + propParts[1] + "/>";
		}
		let query = "<?xml version=\"1.0\" encoding=\"utf-8\"?><D:propfind";
		for (let ns in nsDict) {
			query += " xmlns:" + nsDict[ns] + "=\"" + ns + "\"";
		}
		query += ("><D:prop>" + propPart + "</D:prop></D:propfind>");
		return query;
	},

	_reportQuery: function(props) {
		var query = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
		query = query + "<C:addressbook-multiget xmlns:D=\"DAV:\" xmlns:C=\"urn:ietf:params:xml:ns:carddav\">";
		query = query + "<D:prop><D:getetag/><C:address-data content-type='text/vcard'/></D:prop>";
		for (var i = 0; i < props.length; i++) {
			this.reportLength++;
			query = query + "<D:href>" + this._formatRelativeHref(props[i]) + "</D:href>";
		}
		query = query + "</C:addressbook-multiget>";
		return query;
	},

	_formatRelativeHref: function(aString) {
		var relative = aString.match("(https?)(://[^/]*)/([^#?]*)");
		if (relative && relative[3]) {
			var relativeHrefArray = [];
			relativeHrefArray = relative[3].split("/");
			for (var i = 0; i < relativeHrefArray.length; i++) {
				relativeHrefArray[i] = decodeURIComponent(relativeHrefArray[i]);
			}
			return "/" + relativeHrefArray.join("/");
		}
		wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : can not parse relative href : ", aString);
		return "";
	}
};
	