if ("undefined" == typeof(wdw_adrEdition)) {
	var wdw_adrEdition = {
		
		load: function () {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			document.getElementById('adrPostOfficeTextBox').value = cardbookUtils.undefinedToBlank(window.arguments[0].adrLine[0][0]);
			document.getElementById('adrExtendedAddrTextBox').value = cardbookUtils.undefinedToBlank(window.arguments[0].adrLine[0][1]);
			document.getElementById('adrStreetTextBox').value = cardbookUtils.undefinedToBlank(window.arguments[0].adrLine[0][2]);
			document.getElementById('adrLocalityTextBox').value = cardbookUtils.undefinedToBlank(window.arguments[0].adrLine[0][3]);
			document.getElementById('adrRegionTextBox').value = cardbookUtils.undefinedToBlank(window.arguments[0].adrLine[0][4]);
			document.getElementById('adrPostalCodeTextBox').value = cardbookUtils.undefinedToBlank(window.arguments[0].adrLine[0][5]);
			document.getElementById('adrCountryTextBox').value = cardbookUtils.undefinedToBlank(window.arguments[0].adrLine[0][6]);
			document.getElementById('adrStreetTextBox').focus();
		},

		save: function () {
			window.arguments[0].adrLine[0][0] = document.getElementById('adrPostOfficeTextBox').value;
			window.arguments[0].adrLine[0][1] = document.getElementById('adrExtendedAddrTextBox').value;
			window.arguments[0].adrLine[0][2] = document.getElementById('adrStreetTextBox').value;
			window.arguments[0].adrLine[0][3] = document.getElementById('adrLocalityTextBox').value;
			window.arguments[0].adrLine[0][4] = document.getElementById('adrRegionTextBox').value;
			window.arguments[0].adrLine[0][5] = document.getElementById('adrPostalCodeTextBox').value;
			window.arguments[0].adrLine[0][6] = document.getElementById('adrCountryTextBox').value;
			window.arguments[0].action = "SAVE";
			close();
		},

		cancel: function () {
			window.arguments[0].action = "CANCEL";
			close();
		}

	};

};

window.addEventListener("popupshowing", wdw_cardEdition.loadRichContext, true);
