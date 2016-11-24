if ("undefined" == typeof(wdw_cardbookRenameField)) {
	var wdw_cardbookRenameField = {
		
		load: function () {
			if (window.arguments[0].context === "Cat") {
				document.getElementById('wdw_cardbookRenameField').setAttribute('class', 'cardbookBackgroundColorClass');
			} else {
				document.getElementById('wdw_cardbookRenameField').removeAttribute('class');
			}
			var strBundle = document.getElementById("cardbook-strings");
			document.title = strBundle.getString("wdw_cardbookRenameField" + window.arguments[0].context + "Title");
			document.getElementById('typeLabel').value = strBundle.getString(window.arguments[0].context + "Label");
			document.getElementById('typeTextBox').value = window.arguments[0].type;
			document.getElementById('typeTextBox').focus();
		},

		save: function () {
			window.arguments[0].type = document.getElementById('typeTextBox').value;
			window.arguments[0].typeAction="SAVE";
			close();
		},

		cancel: function () {
			window.arguments[0].typeAction="CANCEL";
			close();
		}

	};

};

window.addEventListener("popupshowing", wdw_cardEdition.loadRichContext, true);
