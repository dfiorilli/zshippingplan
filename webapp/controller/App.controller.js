sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"it/deloitte/copilot/zshippingplan/model/API",
	"it/deloitte/copilot/zshippingplan/model/Constants",
	"sap/ui/model/json/JSONModel",
	"sap/m/ColumnListItem",
	"sap/m/Label",
	"sap/m/Token",
	"sap/ui/core/ValueState",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/Text",
	"sap/ui/core/Fragment"

], function (Controller, API, Constants, JSONModel, ColumnListItem, Label, Token, ValueState, MessageToast, Dialog, DialogType, Button,
	ButtonType, Text, Fragment) {
	"use strict";

	const oAppController = Controller.extend("it.deloitte.copilot.zshippingplan.controller.App", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * -------------------------------------------------------------------------------------------------------------------
		 */
		onInit: function () {
			this.oComponent = this.getOwnerComponent();
			this.dStartDateFilter = new Date();
			this.dStartDateFilter.setHours(0, 0, 0, 0);
			this.oMultiInputPlants = this.getView().byId("_IDEGen_multiinput0");
			this.oMultiInputMaterials = this.getView().byId("_IDEGen_multiinput1");
			this.oMRPArea = this.getView().byId("idAreaCB");
			// add validator
			var fnValidator = function (args) {
				return new Token({
					key: args.text,
					text: args.text
				});
			};
			this.oMultiInputMaterials.addValidator(fnValidator);

			this.API = new API(this.oComponent);
			this.oColModel = new JSONModel(sap.ui.require.toUrl("it/deloitte/copilot/zshippingplan/model") + "/columnsModel.json");

			//0. call ZZ1_MATCHCODE_PLANT_EXTERN_CDS
			this.oComponent.busy(true);
			const oPromiseZZ1MatchCodePlantExternCDS = new Promise((resolve, reject) => {
				this.API.callZZ1MatchCodePlantExternCDSService(
					this.getView().getModel("zz1MatchCodePlantExternModel"),
					resolve,
					reject
				);
			});
			oPromiseZZ1MatchCodePlantExternCDS.then(aResultsCDS => {
				this.oPlants = aResultsCDS;
				this.oComponent.resetAllBusy();
			}, oError => {
				//show dialog
				MessageToast.show(this.oComponent.i18n().getText("msg.error.api.plant.text"));
				this.oComponent.resetAllBusy();
			});
		},

		/**
		 * Standard lifecycle hook of the SAPUI5 framework. Called by the framework before the rendering of the control
		 * has completed triggers after every (re)rendering
		 * ------------------------------------------------------------------------------------------------------------
		 */
		onBeforeRendering: function () {},

		/**
		 * Standard lifecycle hook of the SAPUI5 framework. Called by the framework after the rendering of the control
		 * has completed triggers after every (re)rendering
		 * -----------------------------------------------------------------------------------------------------------
		 */
		onAfterRendering: function () {},

		/**
		 * Standard lifecycle hook of the SAPUI5 framework. Called by the framework exit the rendering of the control
		 * has completed triggers after every (re)rendering
		 * ----------------------------------------------------------------------------------------------------------
		 */
		onExit: function () {
			if (this._oPopover) {
				this._oPopover.destroy();
			}
		},

		/**
		 * On value help requested handler
		 * -------------------------------
		 * @param oEvent - event
		 */
		onValueHelpRequested: function () {
			let aCols = this.oColModel.getData().cols;

			this.oValueHelpDialog = sap.ui.xmlfragment("it.deloitte.copilot.zshippingplan.view.partials.ValueHelpDialog", this);
			this.getView().addDependent(this.oValueHelpDialog);

			this.oValueHelpDialog.getTableAsync().then(function (oTable) {
				oTable.setModel(this.oPlants);
				oTable.setModel(this.oColModel, "columns");

				if (oTable.bindRows) {
					oTable.bindAggregation("rows", "/Plants");
				}

				if (oTable.bindItems) {
					oTable.bindAggregation("items", "/Plants", function () {
						return new ColumnListItem({
							cells: aCols.map(function (column) {
								return new Label({
									text: "{" + column.template + "}"
								});
							})
						});
					});
				}
				this.oValueHelpDialog.update();
			}.bind(this));

			this.oValueHelpDialog.setTokens(this.oMultiInputPlants.getTokens());
			this.oValueHelpDialog.open();
		},

		/**
		 * On value help ok handler
		 * ------------------------
		 * @param oEvent - event
		 */
		onValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			let oFoundPlant = aTokens.filter(x => Constants.MRPAreaPlant.includes(x.getKey()));
			if (oFoundPlant.length > 0) {
				let oBindingComboBox = this.oMRPArea.getBinding("items"),
					aFiltersComboBox = [];
				oFoundPlant.forEach(x => {
					let oFilterComboBox = new sap.ui.model.Filter("MRPAreaPlant", sap.ui.model.FilterOperator.EQ, x.getKey());
					aFiltersComboBox.push(oFilterComboBox);
				});
				oBindingComboBox.filter(aFiltersComboBox);
				this.oMRPArea.setEnabled(true);
			} else {
				this.oMRPArea.setEnabled(false);
				this.oMRPArea.setSelectedItem(null);
			}
			this.oMultiInputPlants.setTokens(aTokens);
			this.oValueHelpDialog.close();
		},
		checkPlant: function (oEvent) {
			let oFoundRemovedPlant = oEvent.getParameter("removedTokens").find(x => Constants.MRPAreaPlant.includes(x.getKey()));
			if (oFoundRemovedPlant) {
				this.oMRPArea.setEnabled(false);
				this.oMRPArea.setSelectedItem(null);
			}
			let oFoundAddedPlant = oEvent.getParameter("addedTokens").filter(x => Constants.MRPAreaPlant.includes(x.getKey()));
			if (oFoundAddedPlant.length > 0) {
				let oBindingComboBox = this.oMRPArea.getBinding("items"),
					aFiltersComboBox = [];
				oFoundAddedPlant.forEach(x => {
					let oFilterComboBox = new sap.ui.model.Filter("MRPAreaPlant", sap.ui.model.FilterOperator.EQ, x.getKey());
					aFiltersComboBox.push(oFilterComboBox);
				});
				oBindingComboBox.filter(aFiltersComboBox);
				this.oMRPArea.setEnabled(true);
			}
		},

		/**
		 * On value help cancel handler
		 * ----------------------------
		 * @param oEvent - event
		 */
		onValueHelpCancelPress: function () {
			this.oValueHelpDialog.close();
		},

		/**
		 * On value help after close handler
		 * ---------------------------------
		 * @param oEvent - event
		 */
		onValueHelpAfterClose: function () {
			this.oValueHelpDialog.destroy();
		},

		/**
		 * On run handler
		 * --------------
		 * @param oEvent - event
		 */
		onRun: function () {
			this.oMultiInputPlants.setValueState(ValueState.Error);
			this.oMultiInputPlants.setValueStateText(this.oComponent.i18n().getText("msg.ui.requiredplants"));
			this.oMultiInputMaterials.setValueState(ValueState.Error);
			this.oMultiInputMaterials.setValueStateText(this.oComponent.i18n().getText("msg.ui.requiredmaterials"));

			if (this.oMultiInputPlants.getTokens() && this.oMultiInputPlants.getTokens().length > 0) {
				this.oMultiInputPlants.setValueState(ValueState.None);
				this.oMultiInputPlants.setValueStateText("");
			}
			if (this.oMultiInputMaterials.getTokens() && this.oMultiInputMaterials.getTokens().length > 0) {
				this.oMultiInputMaterials.setValueState(ValueState.None);
				this.oMultiInputMaterials.setValueStateText("");
			}
			let validMRP = true;
			let oFoundPlant = this.oMultiInputPlants.getTokens().find(x => Constants.MRPAreaPlant.includes(x.getKey()));
			if (oFoundPlant) {
				validMRP = false;
				this.oMRPArea.setValueState(ValueState.Error);
			}

			if (this.oMRPArea.getSelectedKey()) {
				this.oMRPArea.setValueState(ValueState.None);
				validMRP = true;
			}

			//call service
			if (this.oMultiInputPlants.getTokens() && this.oMultiInputPlants.getTokens().length > 0 &&
				this.oMultiInputMaterials.getTokens() && this.oMultiInputMaterials.getTokens().length > 0 && validMRP) {
				this._run();
			}
		},

		/**
		 * On status button handler
		 * ------------------------
		 * @param oSource - source
		 * @param sQuantityList - quantity list
		 */
		onStatusPress: function (oSource, sQuantityList) {
			this._showPopupOver(oSource, sQuantityList);
		},

		/**
		 * On close popupover
		 * ------------------
		 */
		onClosePopover: function () {
			this._oPopover.close();
		},

		/**
		 * On export handler
		 * -----------------
		 */
		onExport: function () {
			//download excel
			const aRows = this.getView().getModel("appModel").getProperty("/rows");
			if (aRows && aRows.length > 0) {

				this._onExport(this.oComponent.cloneObj(aRows));
				//toast
				MessageToast.show(this.oComponent.i18n().getText("msg.ui.download.text1"));
			} else {
				//toast
				MessageToast.show(this.oComponent.i18n().getText("msg.ui.download.text2"));
			}
		},

		/**
		 * On filter date handler
		 * ----------------------
		 */
		// onFilterDateChange: function (oEvent) {
		// 	//fix datepicker hour issue
		// 	this.dStartDateFilter = new Date(Date.parse(oEvent.getParameter("newValue")));
		// 	this.dStartDateFilter.setHours(this.dStartDateFilter.getHours() - (this.dStartDateFilter.getTimezoneOffset() / 60));
		// 	this.getView().byId("_IDEGen_DP1").setValueState(ValueState.None);
		// 	this.getView().byId("_IDEGen_DP1").setValueStateText("");
		// }
	});

	/*************************************************************************************************************/
	/************************************************** PRIVATE **************************************************/
	/*************************************************************************************************************/

	/**
	 * On run
	 * ------
	 * @param aData - data
	 * @private
	 */
	oAppController.prototype._run = function () {
		debugger;
		this.oComponent.busy(true);
		const oProgressBar = this.getView().byId("_IDEGen_progressindicator0");
		oProgressBar.setVisible(true);
		this._setPercentageProgressBar(oProgressBar, Constants.PROGRESS_BAR_VALUE_INIT);

		//const oAppModel = this.getView().getModel("appModel");
		//const sMaterialFilter = oAppModel.getProperty("/MaterialFilter").trim();
		const aPlantFilters = [];
		this.oMultiInputPlants.getTokens().map(o => {
			aPlantFilters.push(o.getProperty("key"));
		});
		const aMaterialFilters = [];
		this.oMultiInputMaterials.getTokens().map(o => {
			aMaterialFilters.push(o.getProperty("key"));
		});
		//0. call /ZZ1_MRPAREAReportShipP
		let oPromiseStorageLocation = Promise.resolve();
		oPromiseStorageLocation = oPromiseStorageLocation.then(() => {
			return this.API.callStorageLocationService(
				Object,
				this.getView().getModel("StorageLocationModel"),
				aPlantFilters,
				this.oMRPArea.getSelectedKey()
			);
		});
		oPromiseStorageLocation.then(aResultsStorageLocation => {
			//1. call API_PRODUCT_SRV
			let oPromiseProduct = Promise.resolve();
			oPromiseProduct = oPromiseProduct.then(() => {
				return this.API.callProductService(
					Object,
					this.getView().getModel("productModel"),
					aPlantFilters,
					aMaterialFilters
				);
			});
			oPromiseProduct.then(aResults => {
				if (aResults && aResults.length > 0) {
					//2. call API_CLFN_PRODUCT
					let oPromiseClfnProduct1 = Promise.resolve();
					oPromiseClfnProduct1 = oPromiseClfnProduct1.then(() => {
						return this.API.callClfnProduct1Service(
							Object,
							this.getView().getModel("clfnProductModel"),
							aResults
						);
					});
					oPromiseClfnProduct1.then(() => {
						this._setPercentageProgressBar(oProgressBar, Constants.PROGRESS_BAR_VALUE_STEP);
					});

					//3. call API_CLFN_PRODUCT
					let oPromiseClfnProduct2 = Promise.resolve();
					oPromiseClfnProduct2 = oPromiseClfnProduct2.then(() => {
						return this.API.callClfnProduct2Service(
							Object,
							this.getView().getModel("clfnProductModel"),
							aResults
						);
					});
					oPromiseClfnProduct2.then(() => {
						this._setPercentageProgressBar(oProgressBar, Constants.PROGRESS_BAR_VALUE_STEP);
					});

					//4. call ZZ1_GETCHARBYNAME_CDS
					let oPromiseZZ1GetCharByName = Promise.resolve();
					oPromiseZZ1GetCharByName = oPromiseZZ1GetCharByName.then(() => {
						return this.API.callZZ1GetCharByNameCDSService(
							Object,
							this.getView().getModel("characteristicModel"),
							aResults
						);
					});
					oPromiseZZ1GetCharByName.then(() => {
						this._setPercentageProgressBar(oProgressBar, Constants.PROGRESS_BAR_VALUE_STEP);
					});

					//5. call API_MATERIAL_STOCK_SRV
					let oPromiseMaterialStock = Promise.resolve();
					aResults.map(o => {
						oPromiseMaterialStock = oPromiseMaterialStock.then(() => {
							return this.API.callMaterialStockService(
								this.getView().getModel("materialStockModel"),
								o,
								aResultsStorageLocation
							);
						});
					});

					oPromiseMaterialStock.then(() => {
						this._setPercentageProgressBar(oProgressBar, Constants.PROGRESS_BAR_VALUE_STEP);
						//6. call API_MRP_MATERIALS_SRV_01
						let oPromiseMRPMaterials = Promise.resolve();
						aResults.map(o => {
							oPromiseMRPMaterials = oPromiseMRPMaterials.then(() => {
								return this.API.callMRPMaterialsService(
									this.getView().getModel("mrpMaterialsModel"),
									o,
									this.dStartDateFilter,
									this.oMRPArea.getSelectedKey()
								);
							});
						});
						oPromiseMRPMaterials.then(() => {
							this._setPercentageProgressBar(oProgressBar, Constants.PROGRESS_BAR_VALUE_STEP);
							Promise.all([oPromiseClfnProduct1,
								oPromiseClfnProduct2,
								oPromiseZZ1GetCharByName,
								oPromiseMaterialStock
							]).then(() => {
								oProgressBar.setVisible(false);
								oProgressBar.setPercentValue(0);
								this._setTableModel(aResults);
								this.oComponent.resetAllBusy();
							});
						});
					});
				} else {
					//show dialog
					this.oComponent.resetAllBusy();
					oProgressBar.setVisible(false);
					oProgressBar.setPercentValue(0);
					this._showDialog(this.oComponent.i18n().getText("msg.warning.api.nodata"),
						this.oComponent.i18n().getText("msg.error.api.title"),
						ValueState.Error);
					this._setTableModel([]);
				}
			}, oError => {
				//show dialog
				this.oComponent.resetAllBusy();
				MessageToast.show(this.oComponent.i18n().getText("msg.error.api.product.text"));
			});
		}, oError => {
			//show dialog
			this.oComponent.resetAllBusy();
			MessageToast.show(this.oComponent.i18n().getText("msg.error.api.storagelocation.text"));
		});
	};

	/**
	 * On export
	 * ---------
	 * @param aData - data
	 * @private
	 */
	oAppController.prototype._onExport = function (aData) {
		let dToday = new Date();
		const sDay = String(dToday.getDate()).padStart(2, "0");
		const sMonth = String(dToday.getMonth() + 1).padStart(2, "0");
		const sYear = dToday.getFullYear();
		dToday = Constants.DATE_SEPARATOR + sDay + Constants.DATE_SEPARATOR + sMonth + Constants.DATE_SEPARATOR + sYear;

		//choose column to show in the excel
		aData.map(o => {
			delete o.to_ProductUnitsOfMeasure_USE_INTERNAL;
		});

		//download excel
		const oWorksheet = XLSX.utils.json_to_sheet(aData);
		const oWorkbook = {
			Sheets: {
				"Data": oWorksheet //"Data" deve essere dello stesso nome del Contants.SHEET_NAME
			},
			SheetNames: [Constants.SHEET_NAME]
		};
		XLSX.writeFile(oWorkbook, this.oComponent.i18n().getText("lbl.Filename") + dToday + Constants.XLSX_EXTENSION);
	};
	/**
	 * Set percentage progress bar
	 * ---------------------------
	 * @param oProgressBar - progress bar
	 * @param nValue - value
	 */
	oAppController.prototype._setPercentageProgressBar = function (oProgressBar, nValue) {
		const nValuePB = oProgressBar.getPercentValue() + nValue;
		oProgressBar.setPercentValue(nValuePB);
		oProgressBar.setDisplayValue(nValuePB + Constants.PERCENTAGE);
	};
	/**
	 * Show dialog
	 * -----------
	 * @param sMessage - message
	 * @param sTitle - title
	 * @param sState - state
	 * @param bAction - if fire action
	 */
	oAppController.prototype._showDialog = function (sMessage, sTitle, sState, bAction) {
		const oDialog = new Dialog({
			title: sTitle,
			type: DialogType.Message,
			state: (sState) ? sState : ValueState.None,
			content: new Text({
				text: sMessage
			}),
			beginButton: new Button({
				type: ButtonType.Emphasized,
				text: this.oComponent.i18n().getText("lbl.Ok"),
				press: () => {
					/*if (bAction) {
						//empty table Validus
						this._setTableValidusModelEmpty();
						//init Registri Wine
						this._initRegistriWine();
					}*/
					oDialog.close();
				}
			}),
			afterClose: () => oDialog.destroy()
		});
		return oDialog.open();
	};

	/**
	 * Set table model 
	 * ---------------
	 * @param aProducts - products
	 * @private
	 */
	oAppController.prototype._setTableModel = function (aProducts) {
		//set model: concat new batch of data to previous model
		const oAppModel = this.getView().getModel("appModel");
		const oTable = this.getView().byId("tableProducts");
		oAppModel.setProperty("/rows", aProducts);
		oTable.setModel(oAppModel);
		oTable.bindRows("/rows");
		oTable.getColumns().map((col, index) => {
			if (index !== 1) oTable.autoResizeColumn(index)
		});
		oTable.sort(oTable.getColumns()[0]);
		oAppModel.refresh(true);
		this.oComponent.resetAllBusy();
		this.getView().byId("_IDEGen_column0").focus();
	};

	/**
	 * Show dialog
	 * -----------
	 * @param oSource - source
	 * @param sText - text
	 * @param sType - type
	 */
	oAppController.prototype._showPopupOver = function (oSource, sQuantityList) {
		this.getView().getModel("appModel").setProperty("/messages", sQuantityList);
		if (!this._oPopover) {
			Fragment.load({
				id: "PopoverStatus",
				name: "it.deloitte.copilot.zshippingplan.view.partials.Popover",
				controller: this
			}).then(oPopover => {
				this._oPopover = oPopover;
				this.getView().addDependent(this._oPopover);
				this._oPopover.attachAfterOpen(() => {
					this._disablePointerEvents();
				}, this);
				this._oPopover.attachAfterClose(() => {
					this._enablePointerEvents();
				}, this);
				this._oPopover.toggle(oSource);
			});
		} else {
			this._oPopover.toggle(oSource);
		}
	};

	oAppController.prototype._disablePointerEvents = function () {
		this.byId("tableProducts").getDomRef().style["pointer-events"] = "none";
	};

	oAppController.prototype._enablePointerEvents = function () {
		this.byId("tableProducts").getDomRef().style["pointer-events"] = "auto";
	};

	return oAppController;
});