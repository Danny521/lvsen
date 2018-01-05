/**
 * Created by Mayue on 2014/12/17.
 */
define(['ajaxModel'], function(ajaxModel) {

	var Module = function() {
		var self = this;
	};

	Module.prototype = {
		URLS: {
			SEARCH_CAMERAS: "/service/resourceRole/getResourceByOrgId"
		},
		abortTreeSearchAjax:function(){
			ajaxModel.abortAjax(SEARCH_CAMERA);
		},
		getCameras:function(obj){
			return ajaxModel.getData(this.URLS.SEARCH_CAMERAS,obj);
		}
	};

	return new Module();
});