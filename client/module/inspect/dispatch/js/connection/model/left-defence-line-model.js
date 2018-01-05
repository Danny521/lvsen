/**
 * Created by Zhangyu on 2015/4/23.
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
				//获取电子防线信息列表
				Get_Defence_Line_List: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/page_eledefense_line",
				//根据id删除电子防线
				Delete_Defence_Line_By_ID: _isUseMock ? "js/npmap-new/model/gps.json" : _serviceHost + _serviceContext + "map/delete_eledefense_line",
				//判断电子防线的名字是否重名
				Check_Defence_Line_Name: _isUseMock ? "js/npmap-new/model/get_350_data.json" : _serviceHost + _serviceContext + "map/get_eledefense_line",
				//保存并创建电子防线
				Save_Defence_Line: _isUseMock ? "js/npmap-new/model/get_350_data.json" : _serviceHost + _serviceContext + "map/save_eledefense_line"
			};

		/**
		 * 获取电子防线信息列表
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getDefenceLineList = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Get_Defence_Line_List, data, custom);
		};

		/**
		 * 根据id删除电子防线
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.deleteDefenceLineByID = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Delete_Defence_Line_By_ID, data, custom);
		};

		/**
		 * 判断电子防线的名字是否重名
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.checkDefenceLineName = function(data, custom) {
			return ajaxModel.postDataByAjaxObj(_ACTIONS_URL.Check_Defence_Line_Name, data, custom);
		};

		/**
		 * 保存并创建电子防线
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.saveDefenceLine = function(data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Save_Defence_Line, data, custom);
		};

		return scope;

	}({}));
});