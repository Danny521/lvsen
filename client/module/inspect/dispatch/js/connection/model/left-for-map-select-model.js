/**
 * Created by Zhangyu on 2015/5/5.
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
				//判断是否存在某分组
				Is_Group_Name_Exist: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "video_access_copy/verify_group_name",
				//添加分组
				Add_Camera_Group: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "video_access_copy/create_group_with_group"
			};

		/**
		 * 判断是否存在某分组
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.isGroupNameExist = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Is_Group_Name_Exist, data, custom);
		};

		/**
		 * 添加分组
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.addCameraGroup = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Add_Camera_Group, data, custom);
		};

		return scope;

	}({}));
});