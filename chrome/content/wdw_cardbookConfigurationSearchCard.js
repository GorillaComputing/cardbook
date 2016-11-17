if ("undefined" == typeof(wdw_cardbookConfigurationSearchCard)) {
	var wdw_cardbookConfigurationSearchCard = {
		
		contactNotLoaded : true,

		loadAddressBooks: function (aAddressBookId) {
			var myPopup = document.getElementById("addressbookMenupopup");
			while (myPopup.hasChildNodes()) {
				myPopup.removeChild(myPopup.firstChild);
			}
			var j = 0;
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
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
			}
		},
				
		removeContacts: function () {
			document.getElementById("contactMenulist").selectedIndex = 0;
			var myPopup = document.getElementById("contactMenupopup");
			while (myPopup.hasChildNodes()) {
				myPopup.removeChild(myPopup.firstChild);
			}
			wdw_cardbookConfigurationSearchCard.contactNotLoaded = true;
		},
				
		loadContacts: function () {
			if (wdw_cardbookConfigurationSearchCard.contactNotLoaded) {
				var myPopup = document.getElementById("contactMenupopup");
				var myAddressBookId = document.getElementById('addressbookMenulist').selectedItem.value;
				var menuItem = document.createElement("menuitem");
				menuItem.setAttribute("label", "");
				menuItem.setAttribute("value", "");
				myPopup.appendChild(menuItem);
				document.getElementById("contactMenulist").selectedIndex = 0;
				var mySortedContacts = [];
				for (var i = 0; i < cardbookRepository.cardbookDisplayCards[myAddressBookId].length; i++) {
					var myCard = cardbookRepository.cardbookDisplayCards[myAddressBookId][i];
					mySortedContacts.push([myCard.fn, myCard.uid]);
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
				wdw_cardbookConfigurationSearchCard.contactNotLoaded = false;
			}
		},
				
		changeAddressbook: function () {
			wdw_cardbookConfigurationSearchCard.removeContacts();
		},
				
		load: function () {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			document.getElementById("filenameLabel").value = window.arguments[0].filename
			wdw_cardbookConfigurationSearchCard.loadAddressBooks();
		},

		save: function () {
			if (document.getElementById('addressbookMenulist').selectedItem && document.getElementById('contactMenulist').selectedItem) {
				window.arguments[0].cardbookId = document.getElementById('addressbookMenulist').selectedItem.value+"::"+document.getElementById('contactMenulist').selectedItem.value;
			}
			window.arguments[0].filename=document.getElementById("filenameLabel").value;
			window.arguments[0].typeAction="SAVE";
			close();
		},

		cancel: function () {
			window.arguments[0].typeAction="CANCEL";
			close();
		}

	};

};