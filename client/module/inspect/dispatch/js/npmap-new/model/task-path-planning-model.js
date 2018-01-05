/**
 * [路径规划数据模型]
 * @author Li Dan
 * @date   2015-07-27
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
				//通过名称获取地址
				GET_ADDRESS_BY_NAME: mapConfig.nameAddressMatchService + "/poiname",
				//通过坐标获取地址
				GET_NAME_BY_COOR: mapConfig.nameAddressMatchService + "/poicoord",
				//保存常用地点
				SAVE_SEARCHED_ADDRESS: _serviceHost + _serviceContext + "map_new/favoritePositionHistory",
				//分页查询历史收藏地点
				GET_HISTORY_ADDRESS: _serviceHost + _serviceContext + "map_new/favoritePositionHistorys",
				//清空历史搜索地址
				CLEAR_HISTORY_ADDRESS: _serviceHost + _serviceContext + "map_new/favoritePositionHistorys",
				//缓冲区搜索
				SEARCH_CAMERA_BY_GEOMETRY: _serviceHost + _serviceContext + "map_new/get_geometry_camera"
			};
		/**
		 * 通过名称获取地址
		 * @author Li Dan
		 * @date   2015-08-07
		 * @param  {[type]}   data   [description]
		 * @param  {[type]}   custom [description]
		 */
		scope.GetAddressByName = function(data, custom) {
			return ajaxModel.getData(_ACTION_URL.GET_ADDRESS_BY_NAME + "?keyWord=" + data.keyWord+"&maxResult="+ data.maxResult, "", custom);
		};
		/**
		 * 通过坐标获取地址名称
		 * @author Li Dan
		 * @date   2015-08-11
		 * @param  {[type]}   data   [description]
		 * @param  {[type]}   custom [description]
		 */
		scope.GetNameByCoor = function(data, custom) {
			return ajaxModel.getData(_ACTION_URL.GET_NAME_BY_COOR + "?coord=" + data.lon + "," + data.lat, "", custom);
		};
		/**
		 * 保存搜索过的地址
		 * @author Li Dan
		 * @date   2015-08-11
		 * @param  {[type]}   data   [description]
		 * @param  {[type]}   custom [description]
		 */
		scope.SaveSearchedAddress = function(data, custom) {
			return ajaxModel.postData(_ACTION_URL.SAVE_SEARCHED_ADDRESS, data, custom);
		};
		/**
		 * 分页查询搜索过的地址
		 * @author Li Dan
		 * @date   2015-08-11
		 * @param  {[type]}   data   [description]
		 * @param  {[type]}   custom [description]
		 */
		scope.SearchHistoryAddress = function(data, custom) {
			return ajaxModel.getData(_ACTION_URL.GET_HISTORY_ADDRESS, data, custom);
		};
		/**
		 * 清空历史搜索地址
		 * @author Li Dan
		 * @date   2015-08-12
		 * @param  {[type]}   data   [description]
		 * @param  {[type]}   custom [description]
		 */
		scope.ClearHistoryAddress = function(data, custom) {
			return ajaxModel.postData(_ACTION_URL.CLEAR_HISTORY_ADDRESS, data, custom);
		};
		/**
		 * 缓冲区搜索
		 * @author Li Dan
		 * @date   2015-08-13
		 * @param  {[type]}   data   [description]
		 * @param  {[type]}   custom [description]
		 * @return {[type]}          [description]
		 */
		scope.searchCameraByGeometry = function(data, custom) {
			return ajaxModel.postData(_ACTION_URL.SEARCH_CAMERA_BY_GEOMETRY, data, custom);
		};
		return scope;
	}({}));
});