/**
 * Created by Zhangyu on 2015/4/24.
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
				//分页获取防控圈分组列表
				Get_Defence_Circle_Groups: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/defenseCircleGroups",
				//根据防空圈ID获取防控圈信息
				Get_Circles_By_GroupID: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/defenseCircleGroup/",
				//根据防空圈分组ID删除分组
				Del_Defence_Circle_Group: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/defenseCircleGroup/",
				//验证防控圈分组名字是否重名
				Check_Circle_Group_Name_Exists: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/defenseCircleGroup/exists",
				//新建/编辑防空圈分组
				Save_Or_Edit_Circle_Group: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/defenseCircleGroup",
				//根据id删除防空圈
				Del_Defence_Circle_By_Id: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/defenseCircle/",
				//获取防空圈信息
				Get_Circle_Info: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/defenseCircles/",
				//获取防控圈组下防控圈个数
				Get_Defence_CircleNums_In_Group: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/defenseCircleGroup/",
				//新建或者编辑防空圈
				Save_Or_Edit_Defence_Circle: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/defenseCircle",
				//验证防控圈名字是否重名
				Check_Circle_Name_Exists: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/defenseCircle/exists",
				//搜索防空圈
				Get_Search_Defence_Circles: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/defenseCircles"
			};

		/**
		 * 分页获取防控圈分组列表
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getDefenceCircleGroups = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Defence_Circle_Groups, data, custom);
		};
		/**
		 * 根据防空圈分组ID获取防控圈列表
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getCirclesByGroupID = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Circles_By_GroupID + data.id + "/defenseCircles", data, custom);
		};

		/**
		 * 根据防空圈分组ID删除分组
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.delDefenceCircleGroup = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Del_Defence_Circle_Group + data.id, data, custom);
		};

		/**
		 * 验证防控圈分组名字是否重名
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.checkCircleGroupNameExists = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Check_Circle_Group_Name_Exists, data, custom);
		};

		/**
		 * 新建/编辑防空圈分组
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.saveOrEditCircleGroup = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Save_Or_Edit_Circle_Group, data, custom);
		};

		/**
		 * 根据id删除防空圈
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.delDefenceCircleById = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Del_Defence_Circle_By_Id + data.id, data, custom);
		};

		/**
		 * 获取防空圈信息
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getCircleInfo = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Circle_Info + data.id, {}, custom);
		};

		/**
		 * 获取防控圈组下防控圈个数
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getDefenceCircleNumsInGroup = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Defence_CircleNums_In_Group + data.id + "/defenseCircles", data, custom);
		};

		/**
		 * 新建或者编辑防空圈
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.saveOrEditDefenceCircle = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Save_Or_Edit_Defence_Circle, data, custom);
		};

		/**
		 * 验证防空圈名字重名
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.checkCircleNameExists = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Check_Circle_Name_Exists, data, custom);
		};
		/**
		 * 搜索防空圈
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getSearchDefenceCircles = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Search_Defence_Circles, data, custom);
		};

		return scope;

	}({}));
});