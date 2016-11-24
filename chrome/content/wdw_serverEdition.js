if ("undefined" == typeof(wdw_serverEdition)) {
	var wdw_serverEdition = {

		load: function () {
			document.getElementById("serverNameTextBox").value = window.arguments[0].serverEditionName;
			document.getElementById("serverTypeTextBox").value = window.arguments[0].serverEditionType;
			document.getElementById("serverUserTextBox").value = window.arguments[0].serverEditionUser;
			document.getElementById("serverUrlTextBox").value = window.arguments[0].serverEditionUrl;
			document.getElementById("serverColorInput").value = window.arguments[0].serverEditionColor;
			if (window.arguments[0].serverEditionVCard == "3.0") {
				document.getElementById("serverVCardVersionMenu").selectedIndex = 0;
			} else {
				document.getElementById("serverVCardVersionMenu").selectedIndex = 1;
			}
			document.getElementById("serverReadOnlyCheckBox").setAttribute('checked', window.arguments[0].serverEditionReadOnly);
		},

		save: function () {
			window.arguments[0].serverCallback(window.arguments[0].serverEditionId, document.getElementById('serverNameTextBox').value,
												document.getElementById('serverColorInput').value, document.getElementById('serverVCardVersionMenu').value,
												document.getElementById('serverReadOnlyCheckBox').checked);
			close();
		},

		cancel: function () {
			close();
		}

	};

};