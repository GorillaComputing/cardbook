if ("undefined" == typeof(wdw_imageEdition)) {
	var wdw_imageEdition = {

		purgeImageCache: function (aFileURI) {
			// for images having the same name we have to clear the cached image
			var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
			var uri = ios.newURI(aFileURI,null,null);
			if (uri) {
				var cache = Components.classes["@mozilla.org/image/tools;1"].getService(Components.interfaces.imgITools).getImgCacheForDocument(null);
				try {
					cache.removeEntry(uri);
				} catch(e) {}
			}
		},

		displayImageCard: function (aCard) {
			if (aCard.photo.localURI != null && aCard.photo.localURI !== undefined && aCard.photo.localURI != "") {
				wdw_imageEdition.resizeImageCard(aCard.photo.localURI);
			} else {
				wdw_imageEdition.resizeImageCard("chrome://cardbook/skin/missing_photo_200_214.png");
			}
		},

		resizeImageCard: function (aFileURI) {
			var myImage = document.getElementById('defaultCardImage');
			var myDummyImage = document.getElementById('imageForSizing');
			
			myImage.src = "";
			myDummyImage.src = "";
			wdw_imageEdition.purgeImageCache(aFileURI);
			myDummyImage.src = aFileURI;
			myDummyImage.onload = function() {
				var myImageWidth = 170;
				var myImageHeight = 170;
				if (myDummyImage.width >= myDummyImage.height) {
					widthFound = myImageWidth + "px" ;
					heightFound = Math.round(myDummyImage.height * myImageWidth / myDummyImage.width) + "px" ;
				} else {
					widthFound = Math.round(myDummyImage.width * myImageHeight / myDummyImage.height) + "px" ;
					heightFound = myImageHeight + "px" ;
				}
				myImage.width = widthFound;
				myImage.height = heightFound;
				myImage.src = aFileURI;
			}
			myDummyImage.onerror = function() {
				if (document.getElementById('photolocalURITextBox')) {
					document.getElementById('photolocalURITextBox').value = "";
				}
				if (document.getElementById('photoURITextBox')) {
					document.getElementById('photoURITextBox').value = "";
				}
				if (document.getElementById('photoExtensionTextBox')) {
					document.getElementById('photoExtensionTextBox').value = "";
				}
				cardbookUtils.adjustFields();
				wdw_imageEdition.resizeImageCard("chrome://cardbook/skin/missing_photo_200_214.png");
			}
		},

		addImageCardFromFile: function () {
			if (document.getElementById('photolocalURITextBox').value == "") {
				var myFile = cardbookUtils.callFilePicker("imageSelectionTitle", "OPEN", "IMAGES");
				var myExtension = cardbookUtils.getExtension(myFile.path);
				var myExtensionLower = myExtension.toLowerCase();
				if (myExtensionLower == "jpg" || myExtensionLower == "jpeg" || myExtensionLower == "png" || myExtensionLower == "gif") {
					var myCard = window.arguments[0].cardIn;
					var targetFile = cardbookUtils.getTempFile("CardBookPhotoTemp." + myExtensionLower);
					var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
					var myFileURISpec = "file:///" + targetFile.path;
					var myFileURI = ioService.newURI(myFileURISpec, null, null);
					var myFile1 = myFileURI.QueryInterface(Components.interfaces.nsIFileURL).file;
					myFile.copyToFollowingLinks(myFile1.parent,myFile1.leafName);
					cardbookUtils.formatStringForOutput("imageSavedToFile", [myFile1.path]);
					wdw_imageEdition.addImageCard(myFile1, myCard, myExtensionLower);
				} else {
					cardbookUtils.formatStringForOutput("imageWrongFormat", [myUrlExtension]);
				}
			}
		},

		addImageCardFromUrl: function () {
			if (document.getElementById('photolocalURITextBox').value == "") {
				var myUrl = cardbookUtils.clipboardGet();
				var myExtension = cardbookUtils.getExtension(myUrl);
				var myExtensionLower = myExtension.toLowerCase();
				if (myExtensionLower == "jpg" || myExtensionLower == "jpeg" || myExtensionLower == "png" || myExtensionLower == "gif") {
					var myCard = window.arguments[0].cardIn;
					var targetFile = cardbookUtils.getTempFile("CardBookPhotoTemp." + myExtensionLower);
					
					Components.utils.import("resource://gre/modules/Downloads.jsm");
					Components.utils.import("resource://gre/modules/Task.jsm");
					try {
						Task.spawn(function () {
							// Fetch a file in the background.
							let download_1 = Downloads.fetch(myUrl, targetFile);
							yield Promise.all([download_1]);
							
							// Do something with the saved files.
							cardbookUtils.formatStringForOutput("urlDownloaded", [myUrl]);
							wdw_imageEdition.addImageCard(targetFile, myCard, myExtensionLower);
						});
					}
					catch(e) {
						cardbookUtils.formatStringForOutput("imageErrorWithMessage", [e]);
					}
				} else {
					cardbookUtils.formatStringForOutput("imageWrongFormat", [myUrlExtension]);
				}
			}
		},

		addImageCardFromClipboard: function () {
			if (document.getElementById('photolocalURITextBox').value == "") {
				var myExtensionLower = "png";
				var myCard = window.arguments[0].cardIn;
				var targetFile = cardbookUtils.getTempFile("CardBookPhotoTemp." + myExtensionLower);
				var myResult = cardbookUtils.clipboardGetImage(targetFile);
				if (myResult) {
					wdw_imageEdition.addImageCard(targetFile, myCard, myExtensionLower);
				} else {
					cardbookUtils.formatStringForOutput("imageError");
				}
			}
		},

		addImageCard: function (aFile, aCard, aExtension) {
			if (aFile != null && aFile !== undefined && aFile != "") {
				document.getElementById('photoURITextBox').value = "";
				document.getElementById('photolocalURITextBox').value = "file:///" + aFile.path;
				document.getElementById('photoExtensionTextBox').value = aExtension;
				window.arguments[0].cardIn.photo.URI = "";
				window.arguments[0].cardIn.photo.localURI = "file:///" + aFile.path;
				window.arguments[0].cardIn.photo.extension = aExtension;
				wdw_imageEdition.displayImageCard(window.arguments[0].cardIn);
			}
		},

		saveImageCard: function () {
			if (document.getElementById('photolocalURITextBox').value !== "") {
				var myFile = cardbookUtils.callFilePicker("imageSaveTitle", "SAVE", "IMAGES");
				if (myFile != null && myFile !== undefined && myFile != "") {
					var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
					var myFileURISpec = document.getElementById('photolocalURITextBox').value;
					var myFileURI = ioService.newURI(myFileURISpec, null, null);
					var myFile1 = myFileURI.QueryInterface(Components.interfaces.nsIFileURL).file;
					myFile1.copyToFollowingLinks(myFile.parent,myFile.leafName);
					cardbookUtils.formatStringForOutput("imageSavedToFile", [myFile.path]);
				}
			}
		},

		deleteImageCard: function () {
			var myCard = cardbookRepository.cardbookCards[document.getElementById('dirPrefIdTextBox').value+"::"+document.getElementById('uidTextBox').value];
			document.getElementById('defaultCardImage').src = "chrome://cardbook/skin/missing_photo_200_214.png";
			document.getElementById('photolocalURITextBox').value = "";
			document.getElementById('photoURITextBox').value = "";
			window.arguments[0].cardIn.photo.URI = "";
			window.arguments[0].cardIn.photo.localURI = "";
			window.arguments[0].cardIn.photo.extension = "";
			wdw_imageEdition.displayImageCard(window.arguments[0].cardIn);
		},

		imageCardContextShowing: function () {
			if (document.getElementById('defaultCardImage').src == "chrome://cardbook/skin/missing_photo_200_214.png") {
				document.getElementById('addImageCardFromFile').disabled=false;
				document.getElementById('addImageCardFromClipboard').disabled=false;
				document.getElementById('addImageCardFromUrl').disabled=false;
				document.getElementById('saveImageCard').disabled=true;
				document.getElementById('deleteImageCard').disabled=true;
			} else {
				document.getElementById('addImageCardFromFile').disabled=true;
				document.getElementById('addImageCardFromClipboard').disabled=true;
				document.getElementById('addImageCardFromUrl').disabled=true;
				document.getElementById('saveImageCard').disabled=false;
				document.getElementById('deleteImageCard').disabled=false;
			}
		}

	};

};
