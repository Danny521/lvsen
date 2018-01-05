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
				//检验警卫路线的名字是否已经存在
				Check_Route_Name_Exists: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map/get_police_line",
				//新建警卫路线
				Save_New_Guard_Route: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map/add_police_line",
				//编辑警卫路线
				Save_Edit_Guard_Route: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map/put/policeLine/",
				//获取摄像机组织内的摄像机列表
				Get_Tree_Camera_By_OrgIds: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "video_access_copy/recursion_list_camera?&r=" + Math.random()
			};

		/**
		 * 检验警卫路线的名字是否已经存在
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.checkRouteNameExists = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Check_Route_Name_Exists, data, custom);
		};

		/**
		 * 保存新的警卫路线
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.saveNewGuardroute = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Save_New_Guard_Route, data, custom);
		};

		/**
		 * 保存编辑的警卫路线
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.saveEditGuardroute = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Save_Edit_Guard_Route + data.routeId, data, custom);
		};

		/**
		 * 获取摄像机组织内的摄像机列表
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getTreeCameraByOrgIds = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Tree_Camera_By_OrgIds, data, custom);
		};

		return scope;

	}({}));
});