/**
 * Created by Mayue on 2014/12/17.
 */
define(['ajaxModel'], function(ajaxModel) {

	var Module = function() {
		var self = this;
	};

	Module.prototype = {
		URLS: {
			LIST_CAMERAS: "/service/video_access_copy/list_cameras",
			SEARCH_CAMERA: "/service/video_access_copy/search_camera"
		},

		abortTreeSearchAjax:function(){
			ajaxModel.abortAjax(SEARCH_CAMERA);
		},
		/**
		 * 根据id和类型获取摄像头信息
		 * @author Mayue
		 * @date   2014-12-26
		 * @param  {[type]}   id   [description]
		 * @param  {[type]}   type  'org'  'system'  'customize'
		 * @return {[type]}        [description]
		 */
		getCameras: function(id,type) {
			return ajaxModel.getData(this.URLS.LIST_CAMERAS, {
				isRoot: 1,//1或者0
				id: id,
				type: type
			});
		},
		/**
		 * 根据关键字和类型 获取摄像头信息
		 * @author Mayue
		 * @date   2014-12-26
		 * @param  {[type]}   keyword [关键字]
		 * @param  {[type]}   type    [类型]   'org'  'system'  'customize'
		 * @return {[type]}           [description]
		 */
		searchCameras: function(keyword,type) {
			return ajaxModel.getData(this.URLS.SEARCH_CAMERA, {
				key: keyword,
				type: type,
				count: 50, //仅仅只是摄像机个数    不包含组织结构
				offset: 0
			});
		}
	};

	return new Module();
});