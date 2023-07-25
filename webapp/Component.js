/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "it/deloitte/copilot/zshippingplan/model/models"
], function (UIComponent, Constants) {
    "use strict";

    const oAppComponent = UIComponent.extend("it.deloitte.copilot.zshippingplan.Component", {
        metadata: {
            manifest: "json"
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();
        }
    });

    /**
     * Get resource bundle
     * -------------------
     * @returns {jQuery.sap.util.ResourceBundle|Promise|*}
     */
    oAppComponent.prototype.i18n = function () {
        return this.getModel("i18n").getResourceBundle();
    };

    /**
     * Control busy indicators holder
     * ------------------------------
     */
    oAppComponent.prototype._oBusyControl = {};

    /**
     * Handler for busy indicators
     * ---------------------------
     */
    oAppComponent.prototype.busy = function (bState, oControl) {
        if (oControl) {
            if (!this._oBusyControl[oControl.sId]) {
                this._oBusyControl[oControl.sId] = oControl;
            }
            oControl.setBusy(bState);
        } else {
            (bState) ? sap.ui.core.BusyIndicator.show() : sap.ui.core.BusyIndicator.hide();
        }
    };

    /**
     * Reset all active busy indicators
     * --------------------------------
     */
    oAppComponent.prototype.resetAllBusy = function () {
        Object.keys(this._oBusyControl).forEach((sId) => {
            const oControl = sap.ui.getCore().byId(sId);
            if (oControl && oControl.isBusy()) {
                oControl.setBusy(false);
            }
        });

        sap.ui.core.BusyIndicator.hide();
    };

    /**
     * Clone obj
     * ---------
     * @param oObj - object to copy
     */
    oAppComponent.prototype.cloneObj = function (oObj) {
        let oCopy;

        // Handle the 3 simple types, and null or undefined
        if (null == oObj || "object" != typeof oObj) return oObj;

        // Handle Date
        if (oObj instanceof Date) {
            oCopy = new Date();
            oCopy.setTime(oObj.getTime());
            return oCopy;
        }

        // Handle Array
        if (oObj instanceof Array) {
            oCopy = [];
            for (let i = 0, len = oObj.length; i < len; i++) {
                oCopy[i] = this.cloneObj(oObj[i]);
            }
            return oCopy;
        }

        // Handle Object
        if (oObj instanceof Object) {
            oCopy = {};
            for (let attr in oObj) {
                if (oObj.hasOwnProperty(attr)) oCopy[attr] = this.cloneObj(oObj[attr]);
            }
            return oCopy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    };

    /**
     * Get actual system language
     * --------------------------
     */
    oAppComponent.prototype.getActualLanguage = function () {
        const aLang = sap.ui.getCore().getConfiguration().getLanguage().split("-");
        // Return only language value
        return aLang[0];
    };

    /**
     * Check Regex
     * -----------
     * @param oRegex - regex expression
     * @param sValue - value to check
     */
    oAppComponent.prototype.checkRegex = function (oRegex, sValue) {
        let bMatch = false;
        let o;
        while ((o = oRegex.exec(sValue)) !== null) {
            if (o.index === oRegex.lastIndex) {
                oRegex.lastIndex++;
            }
            o.forEach((match, groupIndex) => {
                bMatch = true;
            });
        }
        return bMatch;
    };

    /* Find product description by language
     * ------------------------------------
     * @param aData - data
     * @param sLanguage - language
     */
    oAppComponent.prototype.findProductDescriptionByLanguage = function (aData, sLanguage) {
        return aData.find(o => {
            return o.Language === sLanguage;
        });
    };

    /* Find object by language
     * -----------------------
     * @param aData - data
     * @param sLanguage - language
     */
    oAppComponent.prototype.findObjectByLanguage = function (aData, sLanguage) {
        //if not IT, select EN
        sLanguage = sLanguage !== Constants.IT ? Constants.EN : Constants.IT;
        return aData.find(o => {
            return o.Language === sLanguage;
        });
    };

    /* Group by keys
     * -------------
     * @param aData - data
     * @param aKeys -keys
     */
    oAppComponent.prototype.groupBy = function (aData, aKeys) { // `aData` is an array of objects, `aKeys` is the array of keys (or property accessor) to group by
        // reduce runs this anonymous function on each element of `aData` (the `item` parameter,
        // returning the `storage` parameter at the end
        return aData.reduce((storage, item) => {
            // returns an object containing keys and values of each item
            const groupValues = aKeys.reduce((values, key) => {
                values[key] = item[key];
                return values;
            }, {});

            // get the first instance of the key by which we're grouping
            const group = Object.values(groupValues).join(',');

            // set `storage` for this instance of group to the outer scope (if not empty) or initialize it
            storage[group] = storage[group] || [];

            // add this item to its group within `storage`
            if (aKeys.every((key) => item[key] === groupValues[key])) {
                storage[group].push(item);
            }

            // return the updated storage to the reduce function, which will then loop through the next 
            return storage;
        }, {}); // {} is the initial value of the storage
    };
    return oAppComponent;
});