function initModel() {
	var sUrl = "/sap/opu/odata/sap/ZZ1_MRPAREAREPORTSHIPP_CDS/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}