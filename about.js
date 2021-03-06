/* about.js */

enyo.kind({
	name:"aboutDialog",
	kind:"Control",
	events: { onClose:"" },
	components: [
		{ name: "openApplicationCall", kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open" },
		{ kind: "HFlexBox", components: [
			{ name: "appInfoHeaderIconImage", kind:"Image", style: "margin-right: 8px; padding-top: 4px;"},
			{ kind: "VFlexBox", flex: 1, components: [
				{ kind: "HtmlContent", name: "appInfoBodyTitle", className: "" },
				{ kind: "HtmlContent", name: "appInfoBodySubtitle", className: "enyo-item-secondary"}
			]}
		]},
		{ kind: "RowGroup", caption: "Support", components: [
			{ kind: "HFlexBox", pack: "justify", align:"center", onclick: "openWebsite", components: [
				{ name: "appInfoWebsiteImage", kind: "Image", src:"images/browser.png", style:"margin-right: 8px;" },
				{ content: "Website", flex: 1}
			]},
			{ kind: "HFlexBox", pack: "justify", align: "center", onclick: "openEmail", components: [
				{ name: "appInfoEmailImage", kind: "Image", src: "images/email.png", style: "margin-right: 8px;" },
				{ content: "Send Email", flex: 1 }
			]}
		]},
		{ kind: "Button", caption: "Close", onclick: "doClose" }
	],
	create: function () {
		this.inherited(arguments);
		this.appInfo = enyo.fetchAppInfo();
		this.$.appInfoHeaderIconImage.setSrc(this.appInfo.smallicon);
		this.$.appInfoBodyTitle.setContent(this.appInfo.title);
		this.$.appInfoBodySubtitle.setContent("version " + this.appInfo.version);
	},
	openWebsite: function () {
		enyo.log("openWebsite");
		this.$.openApplicationCall.call({
			id: "com.palm.app.browser", 
			params: {
				target: "http://forums.precentral.net/webos-patches/259326-patch-request-connecting-ad-hoc-wi-fi.html"
			}
		});
	},
	openEmail: function () {
		enyo.log("openEmail");
		this.$.openApplicationCall.call({
			id: "com.palm.app.email", 
			params: {
				summary: this.appInfo.title + " " + this.appInfo.version,
				recipients:[{ "type": "email", "role": 1, "value": "nbedford@gmail.com" }]
			}
		});
	}
});
