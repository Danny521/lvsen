/**
 * Created by Zhangyu on 2015/4/23.
 */
define([
	"js/connection/view/left-defence-line-view",
	"js/connection/model/left-defence-line-model",
	"js/npmap-new/view/task-defenceline-view"
], function(View, Model, DefenceLineView) {

	return (function (scope) {

		//初始化页面
		View.init(scope, DefenceLineView);

		var //单页条数
			_itemsPerPage = 100,
			//保存时名字验证的单例模式
			_request = null;
		/**
		 * 保存电子防线
		 * @param data - 电子防线数据
		 * @private
		 */
		var _saveDefenseLine = function(data) {
			Model.saveDefenceLine(data, {}).then(function (res) {
				if (res.code === 200) {
					notify.success("电子防线创建成功！");
					//写日志
					logDict.insertLog('m3', 'f9', 'o1', '', "创建名称为 " + data.name + " 的电子防线");
					//刷新页面
					View.refreshOnSave();
				} else {
					notify.error("电子防线创建失败！");//错误码：" + res.code);
				}
			});
		};
		/**
		 * 读取电子防线列表并显示
		 */
		scope.dealOnDefenceLine = function() {
			//获取电子防线列表
			Model.getDefenceLineList({
				current_page: 1,
				page_size: _itemsPerPage
			}).then(function (res) {
				if (res.code === 200) {
					View.showDefenceLineList(res.data.eledefenseline);
				} else {
					notify.error("获取电子防线列表失败！");//错误码：" + res.code);
				}
			});
		};
		/**
		 * 删除电子防线
		 * @param id - 电子防线的id
		 * @param name - 电子防线的名称
		 */
		scope.deleteDefenceLine = function(id, name) {

			Model.deleteDefenceLineByID({
				"id": id
			}).then(function (res) {
				if (res.code === 200) {
					//提示
					notify.success("电子防线删除成功！");
					//写日志
					logDict.insertLog('m3', 'f9', 'o3', '', "删除名称为 " + name + " 的电子防线");
					//更新页面
					View.refreshOnDelete(id);
				} else {
					notify.error("电子防线删除失败！");//错误码：" + res.code);
				}
			});
		};
		/**
		 * 在地图上显示电子防线
		 * @param pointinfo - 点位信息
		 * @param color - 颜色
		 * @param zoom - 缩放比例
		 * @param title - 电子防线的名字
		 */
		scope.showDefenceLineOnMap = function(pointinfo, color, zoom, title) {
			//写日志
			logDict.insertLog('m3', 'f9', 'o4', '', title + " 电子防线");
			//显示
			DefenceLineView.showDefenceLine(pointinfo, color, zoom);
		};
		/**
		 * 触发绘制电子防线到地图上
		 * @param color - 颜色
		 */
		scope.drawDefenceLineOnMap = function(color) {
			//显示
			DefenceLineView.drawDefenceLine(color);
		};
		/**
		 * 重名验证
		 * @param name - 当前待保存的电子防线名字
		 * @param data - 当前待保存的电子防线数据信息
		 * @param tag - 0：保存时验证，1：纯验证
		 */
		scope.checkName = function(name, data, tag) {
			//请求的单例模式
			if (_request) {
				_request.abort();
			}
			_request = Model.checkDefenceLineName({
				"name": name
			});
			//验证重名
			_request.then(function (res) {
				if (res.code === 200) {
					if (res.data.message) {
						if(tag === 0) {
							//保存电子防线
							_saveDefenseLine(data);
						}
					} else {
						notify.warn("该名称已存在。");
					}
				} else {
					notify.error("网络或服务器异常！");//错误码：" + res.code);
				}
			});
		};

		return scope;

	}({}));
});