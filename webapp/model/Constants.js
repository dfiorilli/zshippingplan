/*
 * © 2020 - Deloitte
 */
sap.ui.define([], function () {
	"use strict";

	return {
		IT: "IT",
		EN: "EN",
		SHEET_NAME: "Data",
		XLSX_EXTENSION: ".xlsx",
		PROGRESS_BAR_VALUE_INIT: 4,
		PROGRESS_BAR_VALUE_STEP: 16,
		PROGRESS_BAR_VALUE_END: 0,
		NONE: "None",
		SUCCESS: "Success",
		//IT22: "IT22",
		IT16: "IT16",
		MRPAreaPlant: ["IT18", "IT22"],
		ERROR: "Error",
		INFORMATION: "Information",
		WARNING: "Warning",
		GHOST: "Ghost",
		PERCENTAGE: "%",
		DATE_SEPARATOR: "_",
		API: {
			ZZ1_MATCHCODE_PLANT_EXTERN_CDS: {
				SERVICE: "/ZZ1_Matchcode_Plant_Extern"
			},
			ZZ1_GETCHARBYNAME_CDS: {
				SERVICE: "/ZZ1_GetCharbyName",
				GROUPBY: ["Material"],
				FILTER1: "Characteristic",
				FILTER2: "ClfnObjectID",
				FILTER3: "ClassType",
				VINTAGE: "VINTAGE",
				ITEM_PACK_TYPE: "ITEM_PACK_TYPE",
				LABEL: "LABEL",
				CLASS_TYPE: "001",
				MATERIAL_MAX_DIGIT: 18
			},
			PRODUCT: {
				SERVICE: "/A_Product",
				EXPAND1: "to_Plant",
				EXPAND2: "to_ProductBasicText",
				EXPAND3: "to_ProductUnitsOfMeasure",
				FILTER: "Product",
				ALTERNATIVE_UNIT_CV: "CV",
				ENTRY_UNIT_EA: "EA"
			},
			CHARACTERISTIC: {
				SERVICE: "/A_ClfnCharacteristicForKeyDate",
				EXPAND: "to_CharacteristicDesc"
			},
			CLFN_PRODUCT: {
				SERVICE1: "/A_ProductDescription",
				SERVICE2: "/A_ProductSalesDelivery",
				GROUPBY1: ["Material"]
			},
			API_MRP_MATERIALS_SRV_01: {
				SERVICE: "/SupplyDemandItems",
				GROUPBY: ["Material"],
				FILTER1: "MRPArea",
				FILTER2: "MRPElementAvailyOrRqmtDate",
				FILTER3: "Material",
				FILTER4: "MRPPlant",
				/*				STOCK: "Stock",
								ORDER: "Order",
								DELIVERY: "Delivery",
								PLND_ORDER: "Plnd order",
								PRODORDER: "ProdOrder",
								PO_ITEM: "PO item",
								QM_LOT: "QM InspLot",
								SHPGNT: "ShpgNote",
								FOC_DEL: "FOC del.",
								ORDER_REL: "Order Rel",
								RETURNS_ITEM: "RetrnsItem",*/
				STOCK: "WB",
				STOCK_NAME: "Stock",
				ORDER: "VC",
				DELIVERY: "VJ",
				PLND_ORDER: "PA",
				PRODORDER: "FE",
				PO_ITEM: "BE",
				QM_LOT: "QM",
				SHPGNT: "LA",
				FOC_DEL: "VI",
				ORDER_REL: "U1",
				RETURNS_ITEM: "RP"
			},
			API_MATERIAL_STOCK_SRV: {
				SERVICE: "/A_MaterialStock",
				NAVIGATION_PROPERTY: "/to_MatlStkInAcctMod",
				EXPAND: "to_MaterialStock",
				INVENTORYSTOCKTYPE: "07",
				IT16: ["3095", "3096", "3097", "3098", "3094", "3099", "3100", "3101", "3102", "3103", "3123", "3125", "3126", "3127"],
				BASEUNIT: "EA"
			},
			STORAGELOCATION: {
				SERVICE: "/ZZ1_MRPAREAReportShipP",
				FILTER1: "MRPAreaPlant",
				FILTER2: "MRPArea"
			}
		}
	};
});