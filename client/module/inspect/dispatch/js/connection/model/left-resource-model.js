/**
 * Created by Zhangyu on 2015/4/21.
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
				//获取灯杆信息列表
				Get_Lightbar_List: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map_new/lamppost",
				//获取警车信息列表
				Get_Police_List: _isUseMock ? "js/npmap-new/model/gps.json" : _serviceHost + _serviceContext + "map_new/GPSName",
				//获取警员信息列表
				Get_Policeman_List: _isUseMock ? "js/npmap-new/model/get_350_data.json" : _serviceHost + _serviceContext + "map_new/gps?type=2",
				//获取警力的详细信息
				Get_Gps_Details: _isUseMock ? "js/connection/model/gps-detail.json" : _serviceHost + _serviceContext + "map_new/gps"
			};

		/**
		 * 获取灯杆信息列表
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.GetLightbarList = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Lightbar_List, data, custom);
		};

		/**
		 * 获取警车信息列表
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.GetPoliceList = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Police_List, data, custom);
		};

		/**
		 * 获取警员信息列表
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.GetPolicemanList = function(data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Policeman_List, data, custom);
		};

		/**
		 * 获取警力的详细信息
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getGpsDetails = function(data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Gps_Details, data, custom);
		};

		return scope;

	}({}));
});