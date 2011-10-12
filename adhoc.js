/* adhoc.js */

enyo.kind({
    name: "enyo.Adhoc",
    kind: enyo.VFlexBox,
	align: "center",
    events: { onRecieve: "" },
    components: [
        {
            name: "getPreferencesCall",
            kind: "PalmService",
            service: "palm://com.palm.systemservice/",
            method: "getPreferences",
            onSuccess: "getPreferencesSuccess",
            onFailure: "getPreferencesFailure"
        },
        {
            name: "setPreferencesCall",
            kind: "PalmService",
            service: "palm://com.palm.systemservice/",
            method: "setPreferences",
            onSuccess: "setPreferencesSuccess",
            onFailure: "setPreferencesFailure"
        },
		{ 
			name: "versionCheckCall", 
			kind: "PalmService",
	      	service: "palm://uk.co.nicbedford.adhoc/",
			method: "version",
	      	onSuccess: "onVersionCheck"
		},
		{ 
			name: "startAdhocCall", 
			kind: "PalmService",
	      	service: "palm://uk.co.nicbedford.adhoc/",
			method: "startAdhoc",
	      	onSuccess: "startAdhocSuccess",
			onFailure: "startAdhocFailure"
		},
		{ 
			name: "stopAdhocCall", 
			kind: "PalmService",
	      	service: "palm://uk.co.nicbedford.adhoc/",
			method: "stopAdhoc",
	      	onSuccess: "stopAdhocSuccess",
			onFailure: "stopAdhocFailure"
		},
		{ 
			name: "queryAdhocStateCall", 
			kind: "PalmService",
	      	service: "palm://uk.co.nicbedford.adhoc/",
			method: "queryAdhocState",
	      	onSuccess: "queryAdhocStateSuccess",
			onFailure: "queryAdhocStateFailure"
		},
		{ 
			name: "setDebugLoggingCall", 
			kind: "PalmService",
	      	service: "palm://uk.co.nicbedford.adhoc/",
			method: "setDebugLog",
	      	onSuccess: "setDebugLoggingSuccess"
		},
		{ kind: "AppMenu", lazy: false, components: [
			{ caption: "About", onclick: "aboutModalOpen" },
			{ name: "debugMenu", caption: "", onclick: "doToggleDebugLogging" }
		]},
        { kind: "Header", style: "width: 100%; height: 60px;", components: [
            { content: "Ad-Hoc", flex: 1 },
			{ name: "wifiActive", kind: "Image", style: "width: 0px; height: 0px;"}
        ]},
		{ name:"aboutModal", kind:"ModalDialog", components: [
			{ kind: "aboutDialog", onClose: "aboutModalClose" }
		]},
        { kind: "RowGroup", caption: "Ad-Hoc Network Settings", style: "width: 460px; margin-top: 20px;", align: "center", components: [ 
			{ kind: "HFlexBox", align: "center", components: [
				{ content: "SSID: ", flex: 1 },
				{ name: "ssid", kind: "Input", flex: 2, onchange: "doSave" }
			]},
			{ kind: "HFlexBox", align: "center",components: [
				{ content: "Prefered DNS: ", flex: 1 },
				{ name: "preferedDNS", kind: "Input", flex: 2, onkeypress: "filterInputKeypress", onchange: "doSave" }
			]},
			{ kind: "HFlexBox", align: "center",components: [
				{ content: "Alternate DNS: ", flex: 1 },
				{ name: "alternateDNS", kind: "Input", flex: 2, onkeypress: "filterInputKeypress", onchange: "doSave" }
			]},
        ]},
		{ name: "startButton", kind: "Button", content: "Start Ad-Hoc Mode", style: "width: 460px;", className: "enyo-button-affirmative", onclick: "doStartAdhoc" },
		{ name: "stopButton", kind: "Button", content: "Stop Ad-Hoc Mode", style: "width: 460px;", onclick: "doStopAdhoc" },
		{ name: "scrim", kind: "Scrim", layoutKind: "VFlexLayout", align: "center", pack: "center", components: [
			{ name: 'spinner', kind: "SpinnerLarge", showing: true }
		]},
		{ name: "errorMessage", kind: "HFlexBox", flex: 1, style: "margin-top: 10px;", components: [
			{ content: "", flex: 1 }
		]},
    ],
    create: function () {
        this.inherited(arguments);
		this.$.versionCheckCall.call();
        this.$.getPreferencesCall.call({
            keys: ["ssid", "preferedDNS", "alternateDNS", "debugLogging"]
        });
        this.savedSSID = "";
        this.savedPreferedDNS = "";
        this.savedAlternateDNS = "";
		this.debugLogging = false;
		this.adhocConnected = false;
    },
    getPreferencesSuccess: function (inSender, inResponse) {
		enyo.log("getPreferencesSuccess");
        this.savedSSID = inResponse.ssid;
        this.savedPreferedDNS = inResponse.preferedDNS;
        this.savedAlternateDNS = inResponse.alternateDNS;
		this.debugLogging = inResponse.debugLogging;
		enyo.log("ssid: " + this.savedSSID + ", preferedDNS: " + this.savedPreferedDNS + ", alternateDNS: " + this.savedAlternateDNS, "debugLogging: " + this.debugLogging);
        this.$.ssid.setValue(this.savedSSID);
        this.$.preferedDNS.setValue(this.savedPreferedDNS);
        this.$.alternateDNS.setValue(this.savedAlternateDNS);

		if(this.debugLogging == true) {
			this.$.debugMenu.setCaption("Disable debug logging");
		}
		else {
			this.$.debugMenu.setCaption("Enable debug logging");
		}
		this.$.setDebugLoggingCall.call({"enableDebugLogging": this.debugLogging});
    },
    getPreferencesFailure: function (inSender, inResponse) {
        enyo.log("getPreferencesFailure");
    },
    setPreferencesSuccess: function (inSender, inResponse) {
        enyo.log("setPreferencesSuccess");
    },
    setPreferencesFailure: function (inSender, inResponse) {
        enyo.log("setPreferencesFailure");
    },
	onVersionCheck: function (inSender, inResponse) {
		enyo.log("onVersionCheck");
		if(!inResponse) {
			this.$.errorMessage.content.setValue("Error connecting to service, please restart device and try again!");		
			this.$.errorMessage.show();
		}
		else {
			enyo.log("apiVersion: " + inResponse.apiVersion);
			this.$.queryAdhocStateCall.call();
		}
	},
    showingChanged: function () {
        this.$.ssid.setValue(this.savedSSID);
        this.$.preferedDNS.setValue(this.savedPreferedDNS);
        this.$.alternateDNS.setValue(this.savedAlternateDNS);
    },
    doSave: function (inSender, inEvent) {
        enyo.log("doSave");

        var newSSIDValue = this.$.ssid.getValue();
        var newPreferedDNSValue = this.$.preferedDNS.getValue();
        var newAlternateDNSValue = this.$.alternateDNS.getValue();

        this.$.setPreferencesCall.call({
            "ssid": newSSIDValue,
            "preferedDNS": newPreferedDNSValue,
            "alternateDNS": newAlternateDNSValue,
			"debugLogging": this.debugLogging
        });

        this.savedSSID = newSSIDValue;
        this.savedPreferedDNS = newPreferedDNSValue;
        this.savedAlternateDNS = newAlternateDNSValue;
    },
    doStartAdhoc: function (inSender, inEvent) {
        enyo.log("doStartAdhoc");
		this.doSave(inSender, inEvent);
		enyo.log("ssid: " + this.savedSSID + ", preferedDNS: " + this.savedPreferedDNS + ", alternateDNS: " + this.savedAlternateDNS);
        this.$.startAdhocCall.call({
            "ssid": this.savedSSID,
            "preferedDNS": this.savedPreferedDNS,
            "alternateDNS": this.savedAlternateDNS
        });
		this.$.wifiActive.setStyle("width: 0px; height: 0px;");
		this.$.wifiActive.setSrc("$base-themes-default-theme/images/blank.gif");
		this.$.scrim.show();
    },
    doStopAdhoc: function (inSender, inEvent) {
        enyo.log("doStopAdhoc");
        this.$.stopAdhocCall.call();
		this.$.wifiActive.setStyle("width: 0px; height: 0px;");
		this.$.wifiActive.setSrc("$base-themes-default-theme/images/blank.gif");
		this.$.scrim.show();
    },
    startAdhocSuccess: function (inSender, inResponse) {
        enyo.log("startAdhocSuccess");	
		enyo.windows.addBannerMessage("Ad-Hoc connected: " + inResponse.address, "{}");
		this.$.scrim.hide();
		this.$.wifiActive.setStyle("width: 32px; height: 23px;");
		this.$.wifiActive.setSrc("images/wifi.png");
		this.$.startButton.removeClass("enyo-button-affirmative");
		this.$.stopButton.addClass("enyo-button-negative");
    },
    startAdhocFailure: function (inSender, inResponse) {
        enyo.log("startAdhocFailure");
		enyo.windows.addBannerMessage(inResponse.errorText, "{}");
		this.$.scrim.hide();
		this.$.wifiActive.setStyle("width: 0px; height: 0px;");
		this.$.wifiActive.setSrc("$base-themes-default-theme/images/blank.gif");
    },
    stopAdhocSuccess: function (inSender, inResponse) {
        enyo.log("stopAdhocSuccess");
		this.$.scrim.hide();
		this.$.wifiActive.setStyle("width: 0px; height: 0px;");
		this.$.wifiActive.setSrc("$base-themes-default-theme/images/blank.gif");
		this.$.stopButton.removeClass("enyo-button-negative");
		this.$.startButton.addClass("enyo-button-affirmative");
    },
    stopAdhocFailure: function (inSender, inResponse) {
        enyo.log("stopAdhocFailure");
		this.$.scrim.hide();
		this.$.wifiActive.setStyle("width: 0px; height: 0px;");
		this.$.wifiActive.setSrc("$base-themes-default-theme/images/blank.gif");
    },
	queryAdhocStateSuccess: function (inSender, inResponse) {
		enyo.log("queryAdhocStateSuccess");		
		this.adhocConnected = inResponse.connected;
		if(this.adhocConnected == true) {
			var response = JSON.parse("{ \"returnValue\": true, \"address\": \"" + inResponse.address + "\"}");
			this.startAdhocSuccess(inSender, response);
		}
		else {
			this.stopAdhocSuccess(inSender, inResponse);
		}
	},
	queryAdhocStateFailure: function (inSender, inResponse) {
		enyo.log("queryAdhocStateFailure");
		this.adhocConnected = false;
		this.stopAdhocSuccess(inSender, inResponse);
	},
	setDebugLoggingSuccess: function (inSender, inResponse) {
		enyo.log("setDebugLoggingSuccess");
		if(inResponse.debugLoggingEnabled == true) {
			this.debugLogging = true;
			this.$.debugMenu.setCaption("Disable debug log");
		}
		else {
			this.debugLogging = false;
			this.$.debugMenu.setCaption("Enable debug log");
		} 
		this.doSave(inSender, inResponse);
	},
	aboutModalOpen: function (inSender, inResponse) {
		enyo.log("aboutModalOpen");
		this.$.aboutModal.openAtCenter();
	},
	aboutModalClose: function (inSender, inResponse) {
		enyo.log("aboutModalClose");
		this.$.aboutModal.close();
	},
	doToggleDebugLogging: function (inSender, inResponse) {
		enyo.log("doToggleDebugLogging");
		var toggleLogging = !this.debugLogging;
		this.$.setDebugLoggingCall.call({"enableDebugLogging": toggleLogging});
	},
	filterInputKeypress: function (inSender, inEvent) {
		enyo.log("filterInputKeypress");
		if(inEvent && ((inEvent.keyCode >= 49 && inEvent.keyCode <= 57) || inEvent.keyCode == 46) ) {
			inEvent.returnValue = true;
		}
		else {
			inEvent.returnValue = false;
		}
	}
});
