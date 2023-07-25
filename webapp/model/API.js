/*
 * © 2021 - Deloitte
 */
sap.ui.define([
	"sap/ui/base/Object",
	"it/deloitte/copilot/zshippingplan/model/Constants",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Filter",
	"it/deloitte/copilot/zshippingplan/model/Formatter"
], function (
	Object,
	Constants,
	FilterOperator,
	Filter,
	Formatter
) {
	"use strict";

	const oAPI = Object.extend("it.deloitte.copilot.zshippingplan.model.API", {
		Formatter: Formatter,

		/**
		 * Constructor
		 * -----------
		 * @param oComponent - component
		 */
		constructor: function (oComponent) {
			if (oComponent) {
				this.oComponent = oComponent;
			}
		},

		/**
		 * Get component
		 * -------------
		 */
		getComponent: function () {
			return this.oComponent;
		},

		/******************************************** ZZ1_MATCHCODE_PLANT_EXTERN_CDS ********************************************/

		/**
		 * Call ZZ1_MATCHCODE_PLANT_EXTERN_CDS
		 * -----------------------------------
		 * @param oModel - model
		 * @param aPayload - payload body
		 * @param resolve - resolve promise
		 * @param reject - reject promise
		 */
		callZZ1MatchCodePlantExternCDSService: function (oModel, resolve, reject) {
			oModel.read(Constants.API.ZZ1_MATCHCODE_PLANT_EXTERN_CDS.SERVICE, {
				success: (oData) => this._successZZ1MatchCodePlantExternCDSService(oData, resolve),
				error: (oError) => this._errorZZ1MatchCodePlantExternCDSService(oError, reject)
			}, [], true);
		},

		/******************************************** ZZ1_MRPAREAReportShipPln ********************************************/

		/**
		 * Call ZZ1_MRPAREAReportShipPln
		 * --------------------
		 * @param oObject - context
		 * @param oModel - model 
		 * @param aPlantFilters - plant filters 
		 * @param sMRPArea - MRP Area
		 */
		callStorageLocationService: function (oObject, oModel, aPlantFilters, sMRPArea) {
			return new Promise((resolve, reject) => {
				const aFilters = [];
				/*
				  const aPlantFilter = [];
					aPlantFilters.map(o => {
						aPlantFilter.push(new Filter(Constants.API.STORAGELOCATION.FILTER1, FilterOperator.EQ, o));
					});
					const aPlantFinalFilter = new Filter({
						filters: aPlantFilter,
						and: false //OR
					});
					aFilters.push(aPlantFinalFilter);
					*/
				let aPlantMRP = [];
				Constants.MRPAreaPlant.forEach(x => {
					aPlantMRP.push(new Filter(Constants.API.STORAGELOCATION.FILTER1, FilterOperator.EQ, x));
				});
				let oFilterPlant = new Filter({
					filters: aPlantMRP,
					and: false
				});
				aFilters.push(oFilterPlant);
				aFilters.push(new Filter(Constants.API.STORAGELOCATION.FILTER2, FilterOperator.EQ, sMRPArea));
				if (aPlantFilters.some(item => Constants.MRPAreaPlant.includes(item))) {
					oModel.read(Constants.API.STORAGELOCATION.SERVICE, {
						filters: aFilters,
						success: (oData) => this.successStorageLocationService(oData, resolve),
						error: (oError) => this._errorStorageLocationService(oError, reject)
					}, [], true);
				} else {
					resolve([]);
				}
			});
		},

		/******************************************** API_PRODUCT_SRV ********************************************/

		/**
		 * Call API_PRODUCT_SRV
		 * --------------------
		 * @param oObject - context
		 * @param oModel - model 
		 * @param aPlantFilters - plant filters 
		 * @param sMaterialFilter - material filters
		 */
		callProductService: function (oObject, oModel, aPlantFilters, aMaterialFilters) {
			return new Promise((resolve, reject) => {
				const aFilters = [];
				aMaterialFilters.map(o => {
					aFilters.push(new Filter(Constants.API.PRODUCT.FILTER, FilterOperator.EQ, o));
				});

				oModel.read(Constants.API.PRODUCT.SERVICE, {
					urlParameters: {
						"$expand": Constants.API.PRODUCT.EXPAND1 + "," + Constants.API.PRODUCT.EXPAND2 + "," + Constants.API.PRODUCT.EXPAND3
					},
					filters: aFilters,
					success: (oData) => {
						let oDataAll = [];
						oData.results.forEach(oDataRow => oDataAll.push(oDataRow));
						//se next allora fare chiamata "ciclica";
						this._checkNextProduct(oData.__next, oDataAll, resolve, aPlantFilters, oModel, aFilters, reject);
						//this.successProductService(oData, aPlantFilters, resolve),
					},
					error: (oError) => this._errorProductService(oError, reject)
				}, [], true);
			});
		},

		_checkNextProduct: function (sNext, oDataAll, resolve, aPlantFilters, oModel, aFilters, reject) {
			if (sNext) {
				var url = new URL(sNext);
				var sSkipToken = url.search.split("skiptoken=")[1];
				oModel.read(Constants.API.PRODUCT.SERVICE, {
					urlParameters: {
						"$skiptoken": sSkipToken,
						"$expand": Constants.API.PRODUCT.EXPAND1 + "," + Constants.API.PRODUCT.EXPAND2 + "," + Constants.API.PRODUCT.EXPAND3
					},
					filters: aFilters,
					success: (oData) => {
						oData.results.forEach(oDataRow => oDataAll.push(oDataRow));
						this._checkNextProduct(oData.__next, oDataAll, resolve, aPlantFilters, oModel, aFilters, reject);
					},
					error: (oError) => this._errorProductService(oError, reject)
				}, [], true);
			} else {
				this.successProductService(oDataAll, aPlantFilters, resolve);
			}
		},

		/******************************************* API_CLFN_PRODUCT_SRV*****************************************/

		/**
		 * Call API_CLFN_PRODUCT_SRV
		 * -------------------------
		 * @param oObject - object
		 * @param oModel - model
		 * @param oProducts - products	
		 */
		callClfnProduct1Service: function (oObject, oModel, oProducts) {
			return new Promise((resolve, reject) => {
				//group by key and create filters based on keys
				const oGrouped = this.oComponent.groupBy(oProducts, Constants.API.CLFN_PRODUCT.GROUPBY1);
				const aKeys = oObject.keys(oGrouped);
				const aFilters = [];
				aKeys.map(o => {
					if (o) {
						aFilters.push(new Filter(Constants.API.PRODUCT.FILTER, FilterOperator.EQ, o));
					}
				});
				if (aFilters.length > 0) {
					oModel.read(Constants.API.CLFN_PRODUCT.SERVICE1, {
							filters: aFilters,
							success: (oData) => {
								for (const [key, aValue] of oObject.entries(oGrouped)) {
									if (key !== "") {
										const aProductDescriptions = oData.results.filter(x => {
											return x.Product === key;
										});
										if (aProductDescriptions) {
											aValue.map(o => {
												this._successClfnProduct1Service(aProductDescriptions, o);
											});
										}
									}
									resolve();
								}
							},
							error: (oError) => this._errorService(oError, resolve)
						}, [],
						true);
				} else {
					resolve();
				}
			});
		},

		/**
		 * Call API_CLFN_PRODUCT_SRV
		 * -------------------------
		 * @param oObject - object
		 * @param oModel - model
		 * @param oProducts - products	
		 */
		callClfnProduct2Service: function (oObject, oModel, oProducts) {
			return new Promise((resolve, reject) => {
				//group by key and create filters based on keys
				const oGrouped = this.oComponent.groupBy(oProducts, Constants.API.CLFN_PRODUCT.GROUPBY1);
				const aKeys = oObject.keys(oGrouped);
				const aFilters = [];
				aKeys.map(o => {
					if (o) {
						aFilters.push(new Filter(Constants.API.PRODUCT.FILTER, FilterOperator.EQ, o));
					}
				});
				if (aFilters.length > 0) {
					oModel.read(Constants.API.CLFN_PRODUCT.SERVICE2, {
						filters: aFilters,
						success: (oData) => {
							for (const [key, aValue] of oObject.entries(oGrouped)) {
								if (key !== "") {
									const aLegalDescriptions = oData.results.filter(x => {
										return x.Product === key;
									});
									if (aLegalDescriptions) {
										aValue.map(o => {
											this._successClfnProduct2Service(aLegalDescriptions, o);
										});
									}
								}
								resolve();
							}
						},
						error: (oError) => this._errorService(oError, resolve)
					}, [], true);
				} else {
					resolve();
				}
			});
		},

		/**
		 * Call ZZ1_GETCHARBYNAME_CDS
		 * -------------------------
		 * @param oObject - object
		 * @param oModel - model
		 * @param oProducts - products	
		 */
		callZZ1GetCharByNameCDSService: function (oObject, oModel, oProducts) {
			return new Promise((resolve, reject) => {
				//group by key and create filters based on keys
				const oGrouped = this.oComponent.groupBy(oProducts, Constants.API.ZZ1_GETCHARBYNAME_CDS.GROUPBY);
				const aKeys = oObject.keys(oGrouped);
				const oFinalFilter = new Filter({
					filters: [],
					and: false //OR
				});
				aKeys.map(o => {
					if (o) {
						const oFilter = new Filter({
							filters: [],
							and: true
						});

						const oFilterCharacteristic = new Filter({
							filters: [
								new Filter(Constants.API.ZZ1_GETCHARBYNAME_CDS.FILTER1, FilterOperator.EQ, Constants.API.ZZ1_GETCHARBYNAME_CDS.VINTAGE),
								new Filter(Constants.API.ZZ1_GETCHARBYNAME_CDS.FILTER1, FilterOperator.EQ, Constants.API.ZZ1_GETCHARBYNAME_CDS.ITEM_PACK_TYPE),
								new Filter(Constants.API.ZZ1_GETCHARBYNAME_CDS.FILTER1, FilterOperator.EQ, Constants.API.ZZ1_GETCHARBYNAME_CDS.LABEL),
							],
							and: false
						});
						const oFilterClfnObjectID = new Filter(Constants.API.ZZ1_GETCHARBYNAME_CDS.FILTER2, FilterOperator.EQ, Formatter.formatZeroPad(
							o, Constants.API.ZZ1_GETCHARBYNAME_CDS.MATERIAL_MAX_DIGIT)); //TODO LEADING ZERO
						const oFilterClassType = new Filter(Constants.API.ZZ1_GETCHARBYNAME_CDS.FILTER3, FilterOperator.EQ, Constants.API.ZZ1_GETCHARBYNAME_CDS
							.CLASS_TYPE); //TODO LEADING ZERO

						oFilter.aFilters.push(oFilterCharacteristic); //and
						oFilter.aFilters.push(oFilterClfnObjectID); //and
						oFilter.aFilters.push(oFilterClassType); //and

						oFinalFilter.aFilters.push(oFilter) //or
					}
				});
				if (oFinalFilter.aFilters.length > 0) {
					oModel.read(Constants.API.ZZ1_GETCHARBYNAME_CDS.SERVICE, {
						filters: [oFinalFilter],
						success: (oData) => {
							for (const [key, aValue] of oObject.entries(oGrouped)) {
								if (key !== "") {
									const aChars = oData.results.filter(x => {
										return Formatter.formatZeroPadRemove(x.ClfnObjectID) === key;
									});
									if (aChars) {
										aValue.map(o => {
											this._successZZ1GetCharByNameCDSService(aChars, o);
										});
									}
								}
								resolve();
							}
						},
						error: (oError) => this._errorService(oError, resolve)
					}, [], true);
				} else {
					resolve();
				}
			});
		},

		/**
		 * Call API_MATERIAL_STOCK_SRV
		 * ---------------------------
		 * @param oModel - model
		 * @param oProduct - product	
		 * @param aPlantFilters - plant filters	
		 */
		callMaterialStockService: function (oModel, oProduct, aStorageLocation) {
			return new Promise((resolve, reject) => {
				oModel.read(Constants.API.API_MATERIAL_STOCK_SRV.SERVICE + "('" + oProduct.Material + "')" + Constants.API.API_MATERIAL_STOCK_SRV
					.NAVIGATION_PROPERTY, {
						urlParameters: {
							"$expand": Constants.API.API_MATERIAL_STOCK_SRV.EXPAND
						},
						success: (oData) => this._successMaterialStockService(oData, oProduct, aStorageLocation, resolve),
						error: (oError) => this._errorService(oError, resolve)
					}, [],
					true);
			});
		},

		/**
		 * Call API_MRP_MATERIALS_SRV_01
		 * -----------------------------
		 * @param oModel - model
		 * @param oProduct - product	
		 * @param aPlantFilters - plant filters	
		 * @param dDateFilter - start date filter	
		 */
		callMRPMaterialsService: function (oModel, oProduct, dDateFilter, MRPArea) {
			return new Promise((resolve, reject) => {
				//(MRPArea eq 'IT16' or MRPArea eq 'IT13' ) and MRPElementAvailyOrRqmtDate eq '1606435200000'  and Material eq '8001827119'
				const oFinalFilter = new Filter({
					filters: [],
					and: true
				});
				/* RR 06/09/2021 */
				if (Constants.MRPAreaPlant.includes(oProduct.Plant)) {
					oFinalFilter.aFilters.push(new Filter(Constants.API.API_MRP_MATERIALS_SRV_01.FILTER1, FilterOperator.EQ, MRPArea));
				} else {
					oFinalFilter.aFilters.push(new Filter(Constants.API.API_MRP_MATERIALS_SRV_01.FILTER1, FilterOperator.EQ, oProduct.Plant));
				}
				oFinalFilter.aFilters.push(new Filter(Constants.API.API_MRP_MATERIALS_SRV_01.FILTER4, FilterOperator.EQ, oProduct.Plant));
				oFinalFilter.aFilters.push(new Filter(Constants.API.API_MRP_MATERIALS_SRV_01.FILTER3, FilterOperator.EQ, oProduct.Material));
				if (oFinalFilter.aFilters.length > 0) {
					oModel.read(Constants.API.API_MRP_MATERIALS_SRV_01.SERVICE, {
							filters: [oFinalFilter],
							success: (oData) => this._successMRPMaterialsService(oData, oProduct, dDateFilter, resolve),
							error: (oError) => this._errorService(oError, resolve)
						}, [],
						true);
				} else {
					resolve();
				}
			});
		},

	});

	/*************************************************************************************************************/
	/************************************************** PRIVATE **************************************************/
	/*************************************************************************************************************/

	/**
	 * Success API_MATERIAL_STOCK_SRV
	 * ------------------------------
	 * @param oData - data
	 * @param oProduct - product
	 * @param resolve - resolve
	 * @private
	 */
	oAPI.prototype._successMaterialStockService = function (oData, oProduct, aStorageLocation, resolve) {
		if (typeof oData !== 'undefined' && typeof oData.results !== "undefined" && oData.results.length > 0) {
			//const oMaterialStock = oData.results.find(o => {
			const oMaterialStock = oData.results.filter(o => {
				return o.Plant === oProduct.Plant && o.InventoryStockType === Constants.API.API_MATERIAL_STOCK_SRV.INVENTORYSTOCKTYPE && o.MaterialBaseUnit ===
					Constants.API.API_MATERIAL_STOCK_SRV.BASEUNIT;
			});
			oMaterialStock.forEach(x => {
				if (
					(Constants.MRPAreaPlant.includes(x.Plant) && aStorageLocation.some(e => e.MRPAreaStorageLocation === x.StorageLocation)) ||
					(x.Plant === Constants.IT16 && Constants.API.API_MATERIAL_STOCK_SRV.IT16.includes(x.StorageLocation) === false) ||
					(!Constants.MRPAreaPlant.includes(x.Plant) && x.Plant !== Constants.IT16)
				) {
					oProduct.QuantitaOnHold = oProduct.QuantitaOnHold + parseFloat(x.MatlWrhsStkQtyInMatlBaseUnit);
				}
			});

			//oProduct.QuantitaOnHold += oMaterialStock.MatlWrhsStkQtyInMatlBaseUnit;
		}
		resolve();
	};

	/**
	 * Success API_MRP_MATERIALS_SRV_01
	 * -----------------------------
	 * @param oData - data
	 * @param oProduct - product
	 * @param dDateFilter - start date filter
	 * @param resolve - resolve
	 * @private
	 */
	oAPI.prototype._successMRPMaterialsService = function (oData, oProduct, dDateFilter, resolve) {
		//dDateFilter to this Sunday
		const aRange1 = this._getFirstRange(dDateFilter);
		const aRange2 = this._getSecondRange(dDateFilter);
		const aRange3 = this._getThirdRange(dDateFilter);
		const aRange4 = this._getFourthRange(dDateFilter);

		let nConversionValue = 1;
		const oProductUnitsOfMeasureCV = oProduct.to_ProductUnitsOfMeasure_USE_INTERNAL.results.find(x => {
			return x.AlternativeUnit === Constants.API.PRODUCT.ALTERNATIVE_UNIT_CV && x.BaseUnit === Constants.API.PRODUCT.ENTRY_UNIT_EA;
		});
		if (oProductUnitsOfMeasureCV) {
			nConversionValue = parseFloat(oProductUnitsOfMeasureCV.QuantityDenominator) /
				parseFloat(oProductUnitsOfMeasureCV.QuantityNumerator);
		}

		//Giacenza
		const aQtyStock = oData.results.filter(o => {
			let dDate = o.MRPElementAvailyOrRqmtDate;
			dDate.setHours(0, 0, 0, 0);
			//GSA - INC0803941 - Modifica Group Name - Start
			//ToBe
			/*return o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.STOCK && o.ReceiptCategoryGroupName === Constants.API.API_MRP_MATERIALS_SRV_01
				.STOCK_NAME &&
				dDate.getTime() === dDateFilter.getTime(); */
			return o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.STOCK  && dDate.getTime() === dDateFilter.getTime();				
			//GSA - INC0803941 -  Modifica Group Name - End	
		});
		if (aQtyStock && aQtyStock.length > 0) {
			if (aQtyStock[0]) {
				oProduct.QuantitaInGiacenza = Math.ceil((aQtyStock[0].MRPElementOpenQuantity ? parseFloat(aQtyStock[0].MRPElementOpenQuantity) : 0) *
					nConversionValue);
			}
		}

		//Order
		const aQtyOrders1 = oData.results.filter(o => {
			return (o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.ORDER ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.DELIVERY ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.FOC_DEL) &&
				o.MRPElementAvailyOrRqmtDate <= aRange1[1];
		});
		aQtyOrders1.forEach(o => {
			oProduct.QuantitaOnOrder1 += (o.MRPElementOpenQuantity ? parseFloat(o.MRPElementOpenQuantity) : 0);
		});
		if (oProduct.QuantitaOnOrder1 < 0) {
			oProduct.QuantitaOnOrder1 = Math.floor(oProduct.QuantitaOnOrder1 * nConversionValue);
		} else {
			oProduct.QuantitaOnOrder1 = Math.ceil(oProduct.QuantitaOnOrder1 * nConversionValue);
		}

		const aQtyOrders2 = oData.results.filter(o => {
			return (o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.ORDER ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.DELIVERY ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.FOC_DEL) &&
				(o.MRPElementAvailyOrRqmtDate >= aRange2[0] && o.MRPElementAvailyOrRqmtDate <= aRange2[1]);
		});
		aQtyOrders2.forEach(o => {
			oProduct.QuantitaOnOrder2 += (o.MRPElementOpenQuantity ? parseFloat(o.MRPElementOpenQuantity) : 0);
		});
		if (oProduct.QuantitaOnOrder2 < 0) {
			oProduct.QuantitaOnOrder2 = Math.floor(oProduct.QuantitaOnOrder2 * nConversionValue);
		} else {
			oProduct.QuantitaOnOrder2 = Math.ceil(oProduct.QuantitaOnOrder2 * nConversionValue);
		}

		const aQtyOrders3 = oData.results.filter(o => {
			return (o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.ORDER ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.DELIVERY ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.FOC_DEL) &&
				(o.MRPElementAvailyOrRqmtDate >= aRange3[0] && o.MRPElementAvailyOrRqmtDate <= aRange3[1]);
		});
		aQtyOrders3.forEach(o => {
			oProduct.QuantitaOnOrder3 += (o.MRPElementOpenQuantity ? parseFloat(o.MRPElementOpenQuantity) : 0);
		});
		if (oProduct.QuantitaOnOrder3 < 0) {
			oProduct.QuantitaOnOrder3 = Math.floor(oProduct.QuantitaOnOrder3 * nConversionValue);
		} else {
			oProduct.QuantitaOnOrder3 = Math.ceil(oProduct.QuantitaOnOrder3 * nConversionValue);
		}

		const aQtyOrders4 = oData.results.filter(o => {
			return (o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.ORDER ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.DELIVERY ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.FOC_DEL) &&
				(o.MRPElementAvailyOrRqmtDate >= aRange4[0]);
		});
		aQtyOrders4.forEach(o => {
			oProduct.QuantitaOnOrder4 += (o.MRPElementOpenQuantity ? parseFloat(o.MRPElementOpenQuantity) : 0);
		});
		if (oProduct.QuantitaOnOrder4 < 0) {
			oProduct.QuantitaOnOrder4 = Math.floor(oProduct.QuantitaOnOrder4 * nConversionValue);
		} else {
			oProduct.QuantitaOnOrder4 = Math.ceil(oProduct.QuantitaOnOrder4 * nConversionValue);
		}

		//WO
		const aQtyWO1 = oData.results.filter(o => {
			return (o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.PLND_ORDER || o.MRPElementCategory ===
					Constants.API.API_MRP_MATERIALS_SRV_01.PRODORDER) &&
				o.MRPElementAvailyOrRqmtDate <= aRange1[1];
		});
		aQtyWO1.forEach(o => {
			oProduct.QuantitaOnWO1 += (o.MRPElementOpenQuantity ? parseFloat(o.MRPElementOpenQuantity) : 0);
		});
		if (oProduct.QuantitaOnWO1 < 0) {
			oProduct.QuantitaOnWO1 = Math.floor(oProduct.QuantitaOnWO1 * nConversionValue);
		} else {
			oProduct.QuantitaOnWO1 = Math.ceil(oProduct.QuantitaOnWO1 * nConversionValue);
		}

		const aQtyWO2 = oData.results.filter(o => {
			return (o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.PLND_ORDER || o.MRPElementCategory ===
					Constants.API.API_MRP_MATERIALS_SRV_01.PRODORDER) &&
				(o.MRPElementAvailyOrRqmtDate >= aRange2[0] && o.MRPElementAvailyOrRqmtDate <= aRange2[1]);
		});
		aQtyWO2.forEach(o => {
			oProduct.QuantitaOnWO2 += (o.MRPElementOpenQuantity ? parseFloat(o.MRPElementOpenQuantity) : 0);
		});
		if (oProduct.QuantitaOnWO2 < 0) {
			oProduct.QuantitaOnWO2 = Math.floor(oProduct.QuantitaOnWO2 * nConversionValue);
		} else {
			oProduct.QuantitaOnWO2 = Math.ceil(oProduct.QuantitaOnWO2 * nConversionValue);
		}

		const aQtyWO3 = oData.results.filter(o => {
			return (o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.PLND_ORDER || o.MRPElementCategory ===
					Constants.API.API_MRP_MATERIALS_SRV_01.PRODORDER) &&
				(o.MRPElementAvailyOrRqmtDate >= aRange3[0] && o.MRPElementAvailyOrRqmtDate <= aRange3[1]);
		});
		aQtyWO3.forEach(o => {
			oProduct.QuantitaOnWO3 += (o.MRPElementOpenQuantity ? parseFloat(o.MRPElementOpenQuantity) : 0);
		});
		if (oProduct.QuantitaOnWO3 < 0) {
			oProduct.QuantitaOnWO3 = Math.floor(oProduct.QuantitaOnWO3 * nConversionValue);
		} else {
			oProduct.QuantitaOnWO3 = Math.ceil(oProduct.QuantitaOnWO3 * nConversionValue);
		}

		const aQtyWO4 = oData.results.filter(o => {
			return (o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.PLND_ORDER || o.MRPElementCategory ===
					Constants.API.API_MRP_MATERIALS_SRV_01.PRODORDER) &&
				o.MRPElementAvailyOrRqmtDate >= aRange4[0];
		});
		aQtyWO4.forEach(o => {
			oProduct.QuantitaOnWO4 += (o.MRPElementOpenQuantity ? parseFloat(o.MRPElementOpenQuantity) : 0);
		});
		if (oProduct.QuantitaOnWO4 < 0) {
			oProduct.QuantitaOnWO4 = Math.floor(oProduct.QuantitaOnWO4 * nConversionValue);
		} else {
			oProduct.QuantitaOnWO4 = Math.ceil(oProduct.QuantitaOnWO4 * nConversionValue);
		}

		//PO
		const aQtyPO1 = oData.results.filter(o => {
			return (o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.PO_ITEM ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.QM_LOT ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.SHPGNT ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.ORDER_REL ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.RETURNS_ITEM) &&
				o.MRPElementAvailyOrRqmtDate <= aRange1[1];
		});
		aQtyPO1.forEach(o => {
			oProduct.QuantitaOnPO1 += (o.MRPElementOpenQuantity ? parseFloat(o.MRPElementOpenQuantity) : 0);
		});
		if (oProduct.QuantitaOnPO1 < 0) {
			oProduct.QuantitaOnPO1 = Math.floor(oProduct.QuantitaOnPO1 * nConversionValue);
		} else {
			oProduct.QuantitaOnPO1 = Math.ceil(oProduct.QuantitaOnPO1 * nConversionValue);
		}

		const aQtyPO2 = oData.results.filter(o => {
			return (o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.PO_ITEM ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.QM_LOT ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.SHPGNT ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.ORDER_REL ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.RETURNS_ITEM) &&
				(o.MRPElementAvailyOrRqmtDate >= aRange2[0] && o.MRPElementAvailyOrRqmtDate <= aRange2[1]);
		});
		aQtyPO2.forEach(o => {
			oProduct.QuantitaOnPO2 += (o.MRPElementOpenQuantity ? parseFloat(o.MRPElementOpenQuantity) : 0);
		});
		if (oProduct.QuantitaOnPO2 < 0) {
			oProduct.QuantitaOnPO2 = Math.floor(oProduct.QuantitaOnPO2 * nConversionValue);
		} else {
			oProduct.QuantitaOnPO2 = Math.ceil(oProduct.QuantitaOnPO2 * nConversionValue);
		}

		const aQtyPO3 = oData.results.filter(o => {
			return (o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.PO_ITEM ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.QM_LOT ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.SHPGNT ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.ORDER_REL ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.RETURNS_ITEM) &&
				(o.MRPElementAvailyOrRqmtDate >= aRange3[0] && o.MRPElementAvailyOrRqmtDate <= aRange3[1]);
		});
		aQtyPO3.forEach(o => {
			oProduct.QuantitaOnPO3 += (o.MRPElementOpenQuantity ? parseFloat(o.MRPElementOpenQuantity) : 0);
		});
		if (oProduct.QuantitaOnPO3 < 0) {
			oProduct.QuantitaOnPO3 = Math.floor(oProduct.QuantitaOnPO3 * nConversionValue);
		} else {
			oProduct.QuantitaOnPO3 = Math.ceil(oProduct.QuantitaOnPO3 * nConversionValue);
		}

		const aQtyPO4 = oData.results.filter(o => {
			return (o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.PO_ITEM ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.QM_LOT ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.SHPGNT ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.ORDER_REL ||
					o.MRPElementCategory === Constants.API.API_MRP_MATERIALS_SRV_01.RETURNS_ITEM) &&
				o.MRPElementAvailyOrRqmtDate >= aRange4[0];
		});
		aQtyPO4.forEach(o => {
			oProduct.QuantitaOnPO4 += (o.MRPElementOpenQuantity ? parseFloat(o.MRPElementOpenQuantity) : 0);
		});
		if (oProduct.QuantitaOnPO4 < 0) {
			oProduct.QuantitaOnPO4 = Math.floor(oProduct.QuantitaOnPO4 * nConversionValue);
		} else {
			oProduct.QuantitaOnPO4 = Math.ceil(oProduct.QuantitaOnPO4 * nConversionValue);
		}

		//Available
		let nQuantitaOnHold = oProduct.QuantitaOnHold ? parseFloat(oProduct.QuantitaOnHold) : 0;
		if (nQuantitaOnHold < 0) {
			nQuantitaOnHold = Math.floor(nQuantitaOnHold * nConversionValue);
		} else {
			nQuantitaOnHold = Math.ceil(nQuantitaOnHold * nConversionValue);
		}
		oProduct.QuantitaOnHold = nQuantitaOnHold; // RR 31/05/2021
		const aQtyAvailable1 = oData.results.filter(o => {
			return o.MRPElementAvailyOrRqmtDate <= aRange1[1] && o.MRPElementCategory !== Constants.API.API_MRP_MATERIALS_SRV_01.STOCK && o.ReceiptCategoryGroupName !==
				Constants.API.API_MRP_MATERIALS_SRV_01.STOCK_NAME;
		});
		aQtyAvailable1.sort((a, b) =>
			b.MRPElementAvailyOrRqmtDate - a.MRPElementAvailyOrRqmtDate
		);
		if (aQtyAvailable1[0]) {
			let oQtyAvailable1 = aQtyAvailable1[0];
			/*
			//check if there is another MRPElement / MRPElementItem with the same date, in that case take the higher MRPElementScheduleLine
			const aFiltered = aQtyAvailable1.filter(x => {
				return x.MRPElement === oQtyAvailable1.MRPElement && x.MRPElementItem === oQtyAvailable1.MRPElementItem;
			});
			if (aFiltered && aFiltered.length > 1) {
				aFiltered.sort((a, b) =>
					b.MRPElementScheduleLine - a.MRPElementScheduleLine
				);
				oQtyAvailable1 = aFiltered[0];
			}
			*/
			const aFiltered = aQtyAvailable1.filter(x => {
				return x.MRPElementAvailyOrRqmtDate.toDateString() === oQtyAvailable1.MRPElementAvailyOrRqmtDate.toDateString();
			});
			if (aFiltered && aFiltered.length > 1) {
				oQtyAvailable1 = aFiltered[aFiltered.length - 1];
			}
			oProduct.QuantitaOnAvailable1 = (oQtyAvailable1.MRPAvailableQuantity ? parseFloat(oQtyAvailable1.MRPAvailableQuantity) : 0) -
				nQuantitaOnHold;
			if (oProduct.QuantitaOnAvailable1 < 0) {
				oProduct.QuantitaOnAvailable1 = Math.floor(oProduct.QuantitaOnAvailable1 * nConversionValue);
			} else {
				oProduct.QuantitaOnAvailable1 = Math.ceil(oProduct.QuantitaOnAvailable1 * nConversionValue);
			}
		}
		const aQtyAvailable2 = oData.results.filter(o => {
			return o.MRPElementAvailyOrRqmtDate >= aRange2[0] && o.MRPElementAvailyOrRqmtDate <= aRange2[1] && o.MRPElementCategory !==
				Constants.API.API_MRP_MATERIALS_SRV_01.STOCK && o.ReceiptCategoryGroupName !== Constants.API.API_MRP_MATERIALS_SRV_01.STOCK_NAME;
		});
		aQtyAvailable2.sort((a, b) => b.MRPElementAvailyOrRqmtDate - a.MRPElementAvailyOrRqmtDate);
		if (aQtyAvailable2[0]) {
			let oQtyAvailable2 = aQtyAvailable2[0];
			/*
			//check if there is another MRPElement / MRPElementItem with the same date, in that case take the higher MRPElementScheduleLine
			const aFiltered = aQtyAvailable2.filter(x => {
				return x.MRPElement === oQtyAvailable2.MRPElement && x.MRPElementItem === oQtyAvailable2.MRPElementItem;
			});
			if (aFiltered && aFiltered.length > 1) {
				aFiltered.sort((a, b) =>
					b.MRPElementScheduleLine - a.MRPElementScheduleLine
				);
				oQtyAvailable2 = aFiltered[0];
			}
			*/
			const aFiltered = aQtyAvailable2.filter(x => {
				return x.MRPElementAvailyOrRqmtDate.toDateString() === oQtyAvailable2.MRPElementAvailyOrRqmtDate.toDateString();
			});
			if (aFiltered && aFiltered.length > 1) {
				oQtyAvailable2 = aFiltered[aFiltered.length - 1];
			}
			oProduct.QuantitaOnAvailable2 = (oQtyAvailable2.MRPAvailableQuantity ? parseFloat(oQtyAvailable2.MRPAvailableQuantity) : 0) -
				nQuantitaOnHold;
			if (oProduct.QuantitaOnAvailable2 < 0) {
				oProduct.QuantitaOnAvailable2 = Math.floor(oProduct.QuantitaOnAvailable2 * nConversionValue);
			} else {
				oProduct.QuantitaOnAvailable2 = Math.ceil(oProduct.QuantitaOnAvailable2 * nConversionValue);
			}
		}
		const aQtyAvailable3 = oData.results.filter(o => {
			return o.MRPElementAvailyOrRqmtDate >= aRange3[0] && o.MRPElementAvailyOrRqmtDate <= aRange3[1] && o.MRPElementCategory !==
				Constants.API.API_MRP_MATERIALS_SRV_01.STOCK && o.ReceiptCategoryGroupName !== Constants.API.API_MRP_MATERIALS_SRV_01.STOCK_NAME;
		});
		aQtyAvailable3.sort((a, b) => b.MRPElementAvailyOrRqmtDate - a.MRPElementAvailyOrRqmtDate);
		if (aQtyAvailable3[0]) {
			let oQtyAvailable3 = aQtyAvailable3[0];
			/*
			//check if there is another MRPElement / MRPElementItem with the same date, in that case take the higher MRPElementScheduleLine
			const aFiltered = aQtyAvailable3.filter(x => {
				return x.MRPElement === oQtyAvailable3.MRPElement && x.MRPElementItem === oQtyAvailable3.MRPElementItem;
			});
			if (aFiltered && aFiltered.length > 1) {
				aFiltered.sort((a, b) =>
					b.MRPElementScheduleLine - a.MRPElementScheduleLine
				);
				oQtyAvailable3 = aFiltered[0];
			}
			*/
			const aFiltered = aQtyAvailable3.filter(x => {
				return x.MRPElementAvailyOrRqmtDate.toDateString() === oQtyAvailable3.MRPElementAvailyOrRqmtDate.toDateString();
			});
			if (aFiltered && aFiltered.length > 1) {
				oQtyAvailable3 = aFiltered[aFiltered.length - 1];
			}
			oProduct.QuantitaOnAvailable3 = (oQtyAvailable3.MRPAvailableQuantity ? parseFloat(oQtyAvailable3.MRPAvailableQuantity) : 0) -
				nQuantitaOnHold;
			if (oProduct.QuantitaOnAvailable3 < 0) {
				oProduct.QuantitaOnAvailable3 = Math.floor(oProduct.QuantitaOnAvailable3 * nConversionValue);
			} else {
				oProduct.QuantitaOnAvailable3 = Math.ceil(oProduct.QuantitaOnAvailable3 * nConversionValue);
			}
		}
		const aQtyAvailable4 = oData.results.filter(o => {
			return o.MRPElementAvailyOrRqmtDate >= aRange4[0] && o.MRPElementCategory !== Constants.API.API_MRP_MATERIALS_SRV_01.STOCK && o.ReceiptCategoryGroupName !==
				Constants.API.API_MRP_MATERIALS_SRV_01.STOCK_NAME;
		});
		aQtyAvailable4.sort((a, b) => b.MRPElementAvailyOrRqmtDate - a.MRPElementAvailyOrRqmtDate);
		if (aQtyAvailable4[0]) {
			let oQtyAvailable4 = aQtyAvailable4[0];
			/*
			//check if there is another MRPElement / MRPElementItem with the same date, in that case take the higher MRPElementScheduleLine
			const aFiltered = aQtyAvailable4.filter(x => {
				return x.MRPElement === oQtyAvailable4.MRPElement && x.MRPElementItem === oQtyAvailable4.MRPElementItem;
			});
			if (aFiltered && aFiltered.length > 1) {
				aFiltered.sort((a, b) =>
					b.MRPElementScheduleLine - a.MRPElementScheduleLine
				);
				oQtyAvailable4 = aFiltered[0];
			}
			*/
			const aFiltered = aQtyAvailable4.filter(x => {
				return x.MRPElementAvailyOrRqmtDate.toDateString() === oQtyAvailable4.MRPElementAvailyOrRqmtDate.toDateString();
			});
			if (aFiltered && aFiltered.length > 1) {
				oQtyAvailable4 = aFiltered[aFiltered.length - 1];
			}
			oProduct.QuantitaOnAvailable4 = (oQtyAvailable4.MRPAvailableQuantity ? parseFloat(oQtyAvailable4.MRPAvailableQuantity) : 0) -
				nQuantitaOnHold;
			if (oProduct.QuantitaOnAvailable4 < 0) {
				oProduct.QuantitaOnAvailable4 = Math.floor(oProduct.QuantitaOnAvailable4 * nConversionValue);
			} else {
				oProduct.QuantitaOnAvailable4 = Math.ceil(oProduct.QuantitaOnAvailable4 * nConversionValue);
			}
		}
		resolve();
	};

	/**
	 * Success ZZ1_GETCHARBYNAME_CDS
	 * -----------------------------
	 * @param oData - data
	 * @param oProduct - product
	 * @private
	 */
	oAPI.prototype._successZZ1GetCharByNameCDSService = function (oData, oProduct) {
		const oVintage = oData.find(o => {
			return o.Characteristic === Constants.API.ZZ1_GETCHARBYNAME_CDS.VINTAGE;
		});
		if (oVintage) {
			oProduct.Vintage = oVintage.CharcValue;
		}
		const oPackSize = oData.find(o => {
			return o.Characteristic === Constants.API.ZZ1_GETCHARBYNAME_CDS.ITEM_PACK_TYPE
		});
		if (oPackSize) {
			oProduct.PackSize = oPackSize.CharcValue;
		}

		const oLabel = oData.find(o => {
			return o.Characteristic === Constants.API.ZZ1_GETCHARBYNAME_CDS.LABEL;
		});
		if (oLabel) {
			oProduct.Label = oLabel.CharcValue;
		}
	};
	/**
	 * Success ZZ1_MATCHCODE_PLANT_EXTERN_CDS
	 * --------------------------------------
	 * @param oData - data
	 * @param resolve - resolve
	 * @private
	 */
	oAPI.prototype._successZZ1MatchCodePlantExternCDSService = function (oData, resolve) {
		let oModel = [];
		if (typeof oData.results !== "undefined" && oData.results.length > 0) {
			function compare(a, b) {
				if (a.Plant < b.Plant) {
					return -1;
				}
				if (a.Plant > b.Plant) {
					return 1;
				}
				return 0;
			}
			oModel = new sap.ui.model.json.JSONModel();
			oModel.setProperty("/Plants", oData.results.sort(compare));
		}
		resolve(oModel);
	};

	/**
	 * Success ZZ1_MRPAREAReportShipPln
	 * -----------------------
	 * @param oData - data
	 * @param resolve - resolve
	 * @private
	 */
	oAPI.prototype.successStorageLocationService = function (oData, resolve) {
		resolve(oData.results);
	};

	/**
	 * Success API_PRODUCT_SRV
	 * -----------------------
	 * @param oData - data
	 * @param aPlantFilters - plant filters
	 * @param resolve - resolve
	 * @private
	 */
	oAPI.prototype.successProductService = function (oData, aPlantFilters, resolve) {
		let aProducts = [];
		oData.map(p => {
			p.to_Plant.results.map(o => {
				aPlantFilters.map(f => {
					if (o.Plant === f) {
						const oProduct = {
							"Material": o.Product,
							"Plant": o.Plant,
							"ProductDescriptionIT": "",
							"ProductDescriptionEN": "",
							"LegalDescriptionIT": "",
							"LegalDescriptionEN": "",
							"GLClass": "",
							"Vintage": "",
							"PackSize": "",
							"Label": "",
							"QuantitaInGiacenza": 0,
							"QuantitaOnOrder1": 0,
							"QuantitaOnWO1": 0,
							"QuantitaOnPO1": 0,
							"QuantitaOnAvailable1": 0,
							"QuantitaOnOrder2": 0,
							"QuantitaOnWO2": 0,
							"QuantitaOnPO2": 0,
							"QuantitaOnAvailable2": 0,
							"QuantitaOnOrder3": 0,
							"QuantitaOnWO3": 0,
							"QuantitaOnPO3": 0,
							"QuantitaOnAvailable3": 0,
							"QuantitaOnOrder4": 0,
							"QuantitaOnWO4": 0,
							"QuantitaOnPO4": 0,
							"QuantitaOnAvailable4": 0,
							"QuantitaOnHold": 0,
							"to_ProductUnitsOfMeasure_USE_INTERNAL": p.to_ProductUnitsOfMeasure
						};
						const oLegalDescriptionIT = this.getComponent().findObjectByLanguage(p.to_ProductBasicText.results, Constants.IT);
						if (oLegalDescriptionIT && oLegalDescriptionIT.LongText) {
							oProduct.LegalDescriptionIT = oLegalDescriptionIT.LongText;
						}
						const oLegalDescriptionEN = this.getComponent().findObjectByLanguage(p.to_ProductBasicText.results, Constants.EN);
						if (oLegalDescriptionEN && oLegalDescriptionEN.LongText) {
							oProduct.LegalDescriptionEN = oLegalDescriptionEN.LongText;
						}
						aProducts.push(oProduct);
					}
				});
			});
		});
		resolve(aProducts);
	};

	/**
	 * Success API_CLFN_PRODUCT_SRV
	 * ----------------------------
	 * @param oData - data
	 * @param oProduct - product	
	 * @private
	 */
	oAPI.prototype._successClfnProduct1Service = function (oData, oProduct) {
		const oProductDescriptionIT = this.getComponent().findObjectByLanguage(oData, Constants.IT);
		if (oProductDescriptionIT) {
			oProduct.ProductDescriptionIT = oProductDescriptionIT.ProductDescription;
		}
		const oProductDescriptionEN = this.getComponent().findObjectByLanguage(oData, Constants.EN);
		if (oProductDescriptionEN) {
			oProduct.ProductDescriptionEN = oProductDescriptionEN.ProductDescription;
		}
	};
	/**
	 * Success API_CLFN_PRODUCT_SRV
	 * ----------------------------
	 * @param oData - data
	 * @param oProduct - product	
	 * @private
	 */
	oAPI.prototype._successClfnProduct2Service = function (oData, oProduct) {
		//if first value is empty, search a filled one
		if (oData.length > 0) {
			if (oData[0].AccountDetnProductGroup) {
				oProduct.GLClass = oData[0].AccountDetnProductGroup
			} else {
				//take the first one among the found ones
				const oAccountDetnProductGroup = oData.find(o => {
					return o.AccountDetnProductGroup !== "";
				})
				if (oAccountDetnProductGroup) {
					oProduct.GLClass = oAccountDetnProductGroup.AccountDetnProductGroup;
				}
			}
		}
	};

	/**
	 * Error Service
	 * -------------	 
	 * @param oError - error
	 * @param reject - reject
	 * @private
	 */
	oAPI.prototype._errorZZ1MatchCodePlantExternCDSService = function (oError, reject) {
		//return the list of current movements without enriching it with the product information of the current material
		reject();
	};
	/**
	 * Error Service
	 * -------------	 
	 * @param oError - error
	 * @param reject - reject
	 * @private
	 */
	oAPI.prototype._errorProductService = function (oError, reject) {
		//return the list of current movements without enriching it with the product information of the current material
		reject();
	};

	/**
	 * Error Service
	 * -------------	 
	 * @param oError - error
	 * @param reject - reject
	 * @private
	 */
	oAPI.prototype._errorStorageLocationService = function (oError, reject) {
		//return the list of current movements without enriching it with the product information of the current material
		reject();
	};

	/**
	 * Error Service
	 * -------------	 
	 * @param oError - error
	 * @param resolve - resolve
	 * @private
	 */
	oAPI.prototype._errorService = function (oError, resolve) {
		//return the list of current movements without enriching it with the product information of the current material
		resolve();
	};

	/**
	 * Get first range
	 * ---------------	 
	 * @param dDate - date
	 * @private
	 */
	oAPI.prototype._getFirstRange = function (dDate) {
		let dStartDate = dDate;
		let dEndDate = this.oComponent.cloneObj(dDate);
		dEndDate = new Date(dEndDate.setDate(dDate.getDate() - (dDate.getDay() - 1) + 6)); //next Sunday
		return [dStartDate, dEndDate];
	};
	oAPI.prototype._getSecondRange = function (dDate) {
		let dStartDate = this.oComponent.cloneObj(dDate);
		dStartDate = new Date(dStartDate.setDate(dStartDate.getDate() - (dStartDate.getDay() - 1) + 7)); //	next week monday
		let dEndDate = this.oComponent.cloneObj(dStartDate);
		dEndDate = new Date(dEndDate.setDate(dEndDate.getDate() - (dEndDate.getDay() - 1) + 6)); //	next week sunday
		return [dStartDate, dEndDate];
	};
	oAPI.prototype._getThirdRange = function (dDate) {
		let dStartDate = this.oComponent.cloneObj(dDate);
		dStartDate = new Date(dStartDate.setDate(dStartDate.getDate() - (dStartDate.getDay() - 1) + 14)); //	next next week monday
		let dEndDate = this.oComponent.cloneObj(dStartDate);
		dEndDate = new Date(dEndDate.setDate(dEndDate.getDate() - (dEndDate.getDay() - 1) + 6)); //	next next week sunday
		return [dStartDate, dEndDate];
	};
	oAPI.prototype._getFourthRange = function (dDate) {
		let dStartDate = this.oComponent.cloneObj(dDate);
		dStartDate = new Date(dStartDate.setDate(dStartDate.getDate() - (dStartDate.getDay() - 1) + 21)); //	next next next week monday
		return [dStartDate];
	};

	return oAPI;
});