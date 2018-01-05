/**
 * Created by Zhangyu on 2015/4/17.
 */
define(["ajaxModel"], function(ajaxModel) {

	return (function (scope) {

		var//标记是否使用模拟数据
			_isUseMock = false,

			//设置请求的根路径
			_serviceHost = "/service/",

			//设置请求上下文
			_serviceContext = "",

			//设置请求的url集合
			_ACTIONS_URL = {
				//获取分组
				Get_Groups: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map/search_group_info/",
				//获取视野范围内分组摄像机
				Get_Group_Cameras_In_Scope: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/group_search_result",
				//获取视野范围内的GPS
				Get_Gps_In_Scope: _isUseMock ? "js/npmap-new/model/gps.json" : _serviceHost + _serviceContext + "map_new/gps/range",
				//获取视野范围内的灯杆
				Get_Lightbar_In_Scope: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map_new/lamppost/gis",
				//获取视野范围内摄像机
				Get_Cameras_In_Scope: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map/view/cameras",
				//获取视野范围内的卡口（废弃）
				Get_Bayonet_In_Scope: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/gps/range",
				//获取视野范围内的350M
				Get_350M_In_Scope: _isUseMock ? "js/npmap-new/model/get_350_data.json" : _serviceHost + _serviceContext + "map_new/gps/range",
				//获取视野范围内的报警信息
				Get_Alarm_In_Scope: _isUseMock ? "js/npmap-new/model/get_350_data.json" : _serviceHost + _serviceContext + "events/gis"
			};

		/**
		 * 获取分组
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getGroups = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Groups, data, custom);
		};

		/**
		 * 获取视野范围内分组摄像机s
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getGroupCamerasInScope = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Group_Cameras_In_Scope, data, custom);
		};

		/**
		 * 获取视野范围内的GPS
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getGpsInScope = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Gps_In_Scope, data, custom);
		};

		/**
		 * 获取视野范围内的灯杆
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getLightbarInScope = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Lightbar_In_Scope, data, custom);
		};

		/**
		 * 获取视野范围内摄像机
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getCameraInscope = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Cameras_In_Scope, data, custom);
		};

		/**
		 * 获取视野范围内的卡口
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getBayonetInscope = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Bayonet_In_Scope, data, custom);
		};

		/**
		 * 获取视野范围内的350M
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.get350MInscope = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_350M_In_Scope, data, custom);
		};

		/**
		 * 获取视野范围内的350M
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getAlarmInscope = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Alarm_In_Scope, data, custom);
		};

		return scope;

	}({}));
});