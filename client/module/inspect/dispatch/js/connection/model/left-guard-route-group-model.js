/**
 * Created by Zhangyu on 2015/4/28.
 */
define(["ajaxModel"], function (ajaxModel) {

	return (function (scope) {

		var//标记是否使用模拟数据
			_isUseMock = false,

			//设置请求的根路径
			_serviceHost = "/service/",

			//设置请求上下文
			_serviceContext = "",

			//设置请求的url集合
			_ACTIONS_URL = {
				//获取警卫路线分组列表
				Get_Group_List: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/get_police_line_group",
				//获取分组下的警卫路线
				Get_Routes_In_Group: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/get_police_line_bygroupid",
				//执行删除警卫路线分组
				Deal_Del_Group: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map/policeLineGroup/",
				//分组保存时检查分组的名字是否唯一
				Check_Group_Name_Exists: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/is_in_police_line_group",
				//保存分组信息到数据库
				Deal_Save_Group: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/update_police_line_group",
				//搜索警卫路线
				Search_Guard_Routes: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/page_police_line",
				//删除警卫路线
				Del_Guard_Route: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map/delete_police_line",
				//保存警卫路线设置
				Save_Guard_Route_Config: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map/police_line_gps",
				//获取警卫路线下的摄像机列表
				Get_Cameras_In_Route: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map_new/get_cameras_list_byPoliceLineId",
				//根据gpsid获取gps即时信息
				Get_Gps_Position_By_Id: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map_new/get_gps"
			};

		/**
		 * 获取警卫路线分组列表
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getGroupList = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Group_List, data, custom);
		};
		/**
		 * 获取分组下的警卫路线
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getRoutesInGroup = function(data, custom){
			return ajaxModel.postData(_ACTIONS_URL.Get_Routes_In_Group, data, custom);
		};
		/**
		 * 删除警卫路线分组
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.dealDelGroup = function(data, custom){
			return ajaxModel.postData(_ACTIONS_URL.Deal_Del_Group + data.id, data, custom);
		};
		/**
		 * 分组保存时检查分组的名字是否唯一
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.checkGroupNameExists = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Check_Group_Name_Exists, data, custom);
		};

		/**
		 * 保存分组信息到数据库
		 * @param data - 参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.dealSaveGroup = function (data) {
			return ajaxModel.postData(_ACTIONS_URL.Deal_Save_Group, data, {});
		};

		/**
		 * 搜索警卫路线
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.searchGuardRoutes = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Search_Guard_Routes, data, custom);
		};

		/**
		 * 删除警卫路线
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.delGuardRoute = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Del_Guard_Route, data, custom);
		};

		/**
		 * 保存警卫路线设置
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.saveGuardrouteConfig = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Save_Guard_Route_Config, data, custom);
		};

		/**
		 * 获取警卫路线下的摄像机列表
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getCamerasInRoute = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Get_Cameras_In_Route, data, custom);
		};

		/**
		 * 根据gps标示获取gps即时位置信息
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getGpsPositionById = function(data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Gps_Position_By_Id, data, custom);
		};
		return scope;

	}({}));
});