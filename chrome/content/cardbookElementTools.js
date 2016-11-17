if ("undefined" == typeof(cardbookElementTools)) {
	var cardbookElementTools = {
		
		deleteRowsType: function (aType) {
			cardbookElementTools.deleteRows(aType + 'Groupbox');
		},

		deleteRows: function (aObjectName) {
			var aListRows = document.getElementById(aObjectName);
			while (aListRows.firstChild) {
				aListRows.removeChild(aListRows.firstChild);
			}
		},

		addCaption: function (aType, aParent) {
			var strBundle = document.getElementById("cardbook-strings");
			var aCaption = document.createElement('caption');
			aParent.appendChild(aCaption);
			aCaption.setAttribute('id', aType + '_caption');
			aCaption.setAttribute('label', strBundle.getString(aType + "GroupboxLabel"));
			aCaption.setAttribute('class', 'header');
		},
		
		addHBox: function (aType, aIndex, aParent) {
			var aHBox = document.createElement('hbox');
			aParent.appendChild(aHBox);
			aHBox.setAttribute('id', aType + '_' + aIndex + '_hbox');
			aHBox.setAttribute('flex', '1');
			aHBox.setAttribute('align', 'center');
			// dirty hack to have the lines not shrinked on Linux only with blue.css
			aHBox.setAttribute('style', 'min-height:32px;');
			return aHBox;
		},
		
		addTextbox: function (aParent, aId, aValue, aParameters) {
			var aTextbox = document.createElement('textbox');
			aParent.appendChild(aTextbox);
			aTextbox.setAttribute('id', aId);
			aTextbox.setAttribute('value', aValue);
			for (var prop in aParameters) {
				aTextbox.setAttribute(prop, aParameters[prop]);
			}
		},

		addMenuCaselist: function (aParent, aType, aIndex, aValue) {
			var strBundle = document.getElementById("cardbook-strings");
			var aMenulist = document.createElement('menulist');
			aParent.appendChild(aMenulist);
			aMenulist.setAttribute('id', aType + '_' + aIndex + '_menulistCase');
			var aMenupopup = document.createElement('menupopup');
			aMenulist.appendChild(aMenupopup);
			aMenupopup.setAttribute('id', aType + '_' + aIndex + '_menupopupCase');
			cardbookElementTools.deleteRows(aMenupopup.id);
			var found = false;
			var caseOperators = [['ig', 'ignoreCaseLabel'], ['g', 'matchCaseLabel']]
			for (var i = 0; i < caseOperators.length; i++) {
				var menuItem = document.createElement("menuitem");
				menuItem.setAttribute('id', aType + '_' + aIndex + '_menuitemCase_' + i);
				menuItem.setAttribute("label", strBundle.getString(caseOperators[i][1]));
				menuItem.setAttribute("value", caseOperators[i][0]);
				aMenupopup.appendChild(menuItem);
				if (aValue == caseOperators[i][0]) {
					aMenulist.selectedIndex = i;
					found = true;
				}
			}
			if (!found) {
				aMenulist.selectedIndex = 0;
			}
		},

		addMenuObjlist: function (aParent, aType, aIndex, aValue) {
			var aMenulist = document.createElement('menulist');
			aParent.appendChild(aMenulist);
			aMenulist.setAttribute('id', aType + '_' + aIndex + '_menulistObj');
			var aMenupopup = document.createElement('menupopup');
			aMenulist.appendChild(aMenupopup);
			aMenupopup.setAttribute('id', aType + '_' + aIndex + '_menupopupObj');
			cardbookElementTools.deleteRows(aMenupopup.id);
			var myColumns = cardbookUtils.getAllAvailableColumns("all");
			var found = false;
			for (var i = 0; i < myColumns.length; i++) {
				var menuItem = document.createElement("menuitem");
				menuItem.setAttribute('id', aType + '_' + aIndex + '_menuitemObj_' + i);
				menuItem.setAttribute("label", myColumns[i][1]);
				menuItem.setAttribute("value", myColumns[i][0]);
				aMenupopup.appendChild(menuItem);
				if (aValue == myColumns[i][0]) {
					aMenulist.selectedIndex = i;
					found = true;
				}
			}
			if (!found) {
				aMenulist.selectedIndex = 0;
			}
		},

		addMenuTermlist: function (aParent, aType, aIndex, aValue) {
			var aMenulist = document.createElement('menulist');
			aParent.appendChild(aMenulist);
			aMenulist.setAttribute('id', aType + '_' + aIndex + '_menulistTerm');
			var aMenupopup = document.createElement('menupopup');
			aMenulist.appendChild(aMenupopup);
			aMenupopup.setAttribute('id', aType + '_' + aIndex + '_menupopupTerm');
			cardbookElementTools.deleteRows(aMenupopup.id);
			var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
			var strBundle = stringBundleService.createBundle("chrome://messenger/locale/search-operators.properties");
			var found = false;
			var operators = ['Contains', 'DoesntContain', 'Is', 'Isnt', 'BeginsWith', 'EndsWith', 'IsEmpty', 'IsntEmpty']
			for (var i = 0; i < operators.length; i++) {
				var menuItem = document.createElement("menuitem");
				menuItem.setAttribute('id', aType + '_' + aIndex + '_menuitemTerm_' + i);
				menuItem.setAttribute("label", strBundle.GetStringFromName(Components.interfaces.nsMsgSearchOp[operators[i]]));
				menuItem.setAttribute("value", operators[i]);
				aMenupopup.appendChild(menuItem);
				if (aValue == operators[i]) {
					aMenulist.selectedIndex = i;
					found = true;
				}
			}
			if (!found) {
				aMenulist.selectedIndex = 0;
			}

			function fireMenuTerm(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				cardbookComplexSearch.showOrHideForEmpty(this.id);
			};
			aMenulist.addEventListener("command", fireMenuTerm, false);
		},

		addEditButton: function (aParent, aType, aIndex, aVersion, aButtonType, aFunction) {
			var strBundle = document.getElementById("cardbook-strings");
			var aEditButton = document.createElement('button');
			aParent.appendChild(aEditButton);
			aEditButton.setAttribute('id', aType + '_' + aIndex + '_' + aVersion + '_cardbook' + aButtonType + 'Button');
			aEditButton.setAttribute('flex', '1');
			aEditButton.setAttribute('class', 'editionButtonClass');
			aEditButton.setAttribute('buttonType', aButtonType);
			aEditButton.setAttribute('tooltiptext', strBundle.getString(aButtonType + "EntryTooltip"));
			aEditButton.addEventListener("click", aFunction, false);
			aEditButton.addEventListener("input", aFunction, false);
		}
	};

};