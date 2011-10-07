/* Ad-Hoc app.js */

enyo.kind({
    name: "enyo.Adhoc",
    kind: enyo.VFlexBox,
	align: "center",
    events: {
        onRecieve: ""
    },
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
		{kind: "AppMenu", components: [
			{caption: "About", onclick: "doAbout"}
		]},
        { kind: "Header", style: "width: 100%; height: 60px;", components: [
            { content: "Ad-Hoc", flex: 1 },
			{ name: "wifiActive", kind: "Image", style: "width: 0px; height: 0px;"}
        ]},
        { kind: "RowGroup", caption: "Ad-Hoc Network Settings", style: "width: 460px; margin-top: 20px;", align: "center", components: [ 
			{ kind: "HFlexBox", align: "center", components: [
				{ content: "SSID: ", flex: 1 },
				{ name: "ssid", kind: "Input", flex: 2, onchange: "doSave" }
			]},
			{ kind: "HFlexBox", align: "center",components: [
				{ content: "Prefered DNS: ", flex: 1 },
				{ name: "preferedDNS", kind: "Input", flex: 2, onchange: "doSave" }
			]},
			{ kind: "HFlexBox", align: "center",components: [
				{ content: "Alternate DNS: ", flex: 1 },
				{ name: "alternateDNS", kind: "Input", flex: 2, onchange: "doSave" }
			]},
        ]},
		{ name: "startButton", kind: "Button", content: "Start Ad-Hoc Mode", style: "width: 460px;", className: "enyo-button-affirmative", onclick: "doStartAdhoc" },
		{ name: "stopButton", kind: "Button", content: "Stop Ad-Hoc Mode", style: "width: 460px;", onclick: "doStopAdhoc" },
		{ name: "scrim", kind: "Scrim", layoutKind: "VFlexLayout", align: "center", pack: "center", onclick: "simulateScrimOff", components: [
			{ name: 'spinner', kind: "SpinnerLarge", showing: true }
		]}
    ],
	buttonClick: function() {
		this.$.scrim.show();
	},
	button2Click: function() {
		this.$.spinner.show();
	},
	scrimClick: function() {
		this.$.scrim.hide();
	},
    create: function () {
        this.inherited(arguments);
        this.$.getPreferencesCall.call(
        {
            keys: ["ssid", "preferedDNS", "alternateDNS"]
        });
        this.savedSSID = "";
        this.savedPreferedDNS = "";
        this.savedAlternateDNS = "";
	
		this.$.queryAdhocStateCall.call();
		this.adhocConnected = false;
    },
    getPreferencesSuccess: function (inSender, inResponse) {
        this.savedSSID = inResponse.ssid;
        this.savedPreferedDNS = inResponse.preferedDNS;
        this.savedAlternateDNS = inResponse.alternateDNS;

		enyo.log("ssid: " + this.savedSSID + ", preferedDNS: " + this.savedPreferedDNS + ", alternateDNS: " + this.savedAlternateDNS);

        this.$.ssid.setValue(this.savedSSID);
        this.$.preferedDNS.setValue(this.savedPreferedDNS);
        this.$.alternateDNS.setValue(this.savedAlternateDNS);
    },
    getPreferencesFailure: function (inSender, inResponse) {
        enyo.log("getPreferencesFailure: failed to read preferences");
    },
    setPreferencesSuccess: function (inSender, inResponse) {
        enyo.log("setPreferencesSuccess: preferences saved successfully");
    },
    setPreferencesFailure: function (inSender, inResponse) {
        enyo.log("setPreferencesFailure: failed to write preferences");
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

        this.$.setPreferencesCall.call(
        {
            "ssid": newSSIDValue,
            "preferedDNS": newPreferedDNSValue,
            "alternateDNS": newAlternateDNSValue
        });

        this.savedSSID = newSSIDValue;
        this.savedPreferedDNS = newPreferedDNSValue;
        this.savedAlternateDNS = newAlternateDNSValue;
    },
    doStartAdhoc: function (inSender, inEvent) {
        enyo.log("doStartAdhoc");
		this.doSave(inSender, inEvent);
		enyo.log("ssid: " + this.savedSSID + ", preferedDNS: " + this.savedPreferedDNS + ", alternateDNS: " + this.savedAlternateDNS);
        this.$.startAdhocCall.call(
        {
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
		enyo.log("errorCde: " + inResponse.errorCode + ", errorText: " + inResponse.errorText);
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
	doAbout: function (inSender, inResponse) {
		enyo.log("doAbout");
	}
});
