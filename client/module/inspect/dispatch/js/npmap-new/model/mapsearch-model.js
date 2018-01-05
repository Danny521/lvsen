/**
 * Created by Zhangyu on 2014/12/22.
 * 全局搜索主控制逻辑的数据读取部分
 */
define(["ajaxModel", "jquery"], function(ajaxModel, jQuery) {

	return (function (scope, $) {

		var//标记是否使用模拟数据
			_isUseMock = false,

			//设置请求的根路径
			_serviceHost = "/service/",

			//设置请求上下文
			_serviceContext = "",

			//设置请求的url集合
			_ACTIONS_URL = {
				//从数据库中获取兴趣点信息
				Get_Map_Data_By_DB: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map/interestings",
				//获取周围的摄像机资源信息
				Get_Around_Cameras: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/page_geometry_camera",
				//获取周围的报警资源信息
				Get_Around_Alarms: _isUseMock ? "js/npmap-new/model/get_alarm_round_data.json" : _serviceHost + _serviceContext + "events/geometry",
				//获取周围的警车资源信息
				Get_Around_Gpses: _isUseMock ? "js/npmap-new/model/gps.json" : _serviceHost + _serviceContext + "map_new/gps/geometry",
				//获取周围的警员资源信息
				Get_Around_350Ms: _isUseMock ? "js/npmap-new/model/get_350_data.json" : _serviceHost + _serviceContext + "map_new/gps/geometry?type=2",
				//获取周围的灯杆资源信息
				Get_Around_Lightbar: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map_new/lamppost/geometry",
				//获取周围的卡口资源信息(废弃)
				Get_Around_Bayonet: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/gps/geometry",
				//获取周围的其他资源信息（废弃）
				Get_Around_Normal: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/gps/geometry?type=2"
			};
		/**
		 * 从数据库中获取兴趣点信息
		 * @param data - 参数信息
		 * @param custom - 额外的ajax配置信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getMapDataByDB = function (data, custom) {
			return ajaxModel.getDataByAjaxObj(_ACTIONS_URL.Get_Map_Data_By_DB, data, custom);
		};

		/**
		 * 从地图搜索服务中获取兴趣点/路网信息
		 * @param service - 搜索服务句柄
		 * @param url - 搜索服务地址
		 * @param data - 搜索参数
		 * @returns {*} - 返回委托的deffered对象
		 */
		scope.getDataByService = function (service, url, data) {
			//委托deffered
			var def = $.Deferred();

			//执行查询
			var ajaxObject = service.query(url, data, function (result) {
				//deffered委托对象的成功状态
				def.resolve(result);
			}, function () {
				//deffered委托对象的失败状态
				def.reject();
			});

			return {
				deffered: def,
				ajaxObj: ajaxObject
			};
		};
		/**
		 * 获取周边的资源信息
		 * @param data - 参数信息
		 * @param custom - 额外的ajax配置信息
		 * @param dataType - 获取的数据类型
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getAroundResource = function (data, custom, dataType) {
			if (dataType === 0) {

				//获取摄像机资源
				return ajaxModel.postData(_ACTIONS_URL.Get_Around_Cameras, data, custom);

			} else if (dataType === 1) {

				//获取报警信息
				return ajaxModel.postData(_ACTIONS_URL.Get_Around_Alarms, data, custom);

			} else if (dataType === 2) {

				//获取gps信息
				return ajaxModel.getData(_ACTIONS_URL.Get_Around_Gpses, data, custom);

			} else if (dataType === 3) {

				//获取350M信息
				return ajaxModel.getData(_ACTIONS_URL.Get_Around_350Ms, data, custom);

			} else if (dataType === 4) {

				//获取灯杆信息
				return ajaxModel.postData(_ACTIONS_URL.Get_Around_Lightbar, data, custom);

			} else if (dataType === 5) {

				//获取卡口信息
				return ajaxModel.getData(_ACTIONS_URL.Get_Around_Bayonet, data, custom);

			} else if (dataType === 6) {

				//获取其他综合信息
				return ajaxModel.getData(_ACTIONS_URL.Get_Around_Normal, data, custom);

			}
		};

		return scope;

	}({}, jQuery));
});
