/*
 * © 2020 - Deloitte
 */
sap.ui.define([
	"it/deloitte/copilot/zshippingplan/model/Constants"
], function (Constants) {
	"use strict";

	return {
		formatZeroPad: function (num, places) {
			return String(num).padStart(places, '0'); //add zero pad before material item position
		},
		formatZeroPadRemove: function (num) {
			return num ? String(parseInt(num, 10)) : ""; //remove zero pad before material item position
		},
		formatComments: function (sCommenti, sValue) {
			return sCommenti ? sCommenti + Constants.RULES.COMMENT_SEPARATOR + sValue : sValue;
		},
		formatHistoricalStatus: function (sStatus) {
			if (sStatus) {
				return this.oComponent.i18n().getText("lbl.Changed");
			}
			return this.oComponent.i18n().getText("lbl.Sent");
		},
		formatHistoricalStatusColor: function (sStatus) {
			if (sStatus) {
				return Constants.RULES.INFORMATION;
			}
			return Constants.RULES.SUCCESS;
		},
		formatHistoricalStatusIcon: function (sStatus) {
			if (sStatus) {
				return "sap-icon://message-information";
			}
			return "sap-icon://message-success";
		},
		formatDate: function (dDate) {
			if (dDate instanceof Date) {
				let dd = dDate.getDate();
				let mm = dDate.getMonth() + 1;
				let yyyy = dDate.getFullYear();
				if (dd < 10) {
					dd = '0' + dd;
				}
				if (mm < 10) {
					mm = '0' + mm;
				}
				return dd + '/' + mm + '/' + yyyy;
			}
			return dDate;
		},
		formatThousands: function (nValue) {
			return nValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}

	};
});