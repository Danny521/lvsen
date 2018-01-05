/**
 * [GPS监控数据模型]
 * @author SongJiang
 * @date   2015-08-27
 * @param  {[type]}   ajaxModel){} [ajax数据请求模型]
 * @return {[type]}                  [description]
 */
define(['ajaxModel'], function(ajaxModel) {

	return (function(scope) {
		var //是否使用模拟数据
			_isUseMock = false,
			//设置请求的根路径
			_serviceHost = "/service/",
			//设置请求上下文
			_serviceContext = "",
			//设置请求的URL集合
			_ACTION_URL = {
				//缓冲区搜索
				SEARCH_CAMERA_BY_GEOMETRY: _serviceHost + _serviceContext + "map_new/get_geometry_camera",
				SEARCH_GPSPOINTS: _serviceHost + _serviceContext+"map_new/gps/trail"
			};
		/**
		 * 缓冲区搜索
		 * @author Song Jiang
		 * @date   2015-08-27
		 * @param  {[type]}   data   [description]
		 * @param  {[type]}   custom [description]
		 * @return {[type]}          [description]
		 */
		scope.searchCameraByGeometry = function(data, custom) {
			return ajaxModel.postData(_ACTION_URL.SEARCH_CAMERA_BY_GEOMETRY, data, custom);
		};
		/**
		 * 获取GPS点位信息
		 * @author Song Jiang
		 * @date   2015-08-27
		 * @param  {[type]}   data   [description]
		 * @param  {[type]}   custom [description]
		 * @return {[type]}          [description]
		 */
		scope.searchGPSPoints = function(data, custom){
			return ajaxModel.getData(_ACTION_URL.SEARCH_GPSPOINTS, data, custom);
		};
		return scope;
	}({}));
});