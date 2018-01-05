/**
 * Created by Zhangyu on 2015/1/6.
 * 在显示信息窗时，获取资源的详细信息
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
				//获取视野范围内的报警信息
				Get_Alarminfo_In_Screen: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "events/gis",
				//获取报警详细信息URL
				Get_Alarm_Detail: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "events/gis/cameras/",
				//报警处理url
				Deal_Alarm_Event: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "events/defence/"
			};

		/**
		 * 获取视野范围内的报警信息
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.GetAlarminfoInScreen = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Alarminfo_In_Screen, data, custom);
		};

		/**
		 * 获取报警详细信息
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.GetAlarmDetail = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Alarm_Detail + data.id, data, custom);
		};

		/**
		 * 报警处理
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.DealAlarmEvent = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Deal_Alarm_Event + data.id + "?_method=put", data, custom);
		};

		return scope;

	}({}));
});