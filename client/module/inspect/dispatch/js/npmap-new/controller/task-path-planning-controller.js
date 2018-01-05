/**
 * [路径规划控制器]
 * @author Li Dan
 * @date   2015-07-27
 * @param  {[type]}   ){} [路径规划视图、路径规划数据模型]
 * @return {[type]}         [description]
 */
define([
	'js/npmap-new/view/task-path-planning-view',
	'js/npmap-new/model/task-path-planning-model'
], function(View, Model) {

	return (function(scope) {

		//初始化页面
		View.init(scope);

		scope.init = function(){
			View.init(scope);
		},

		/**
		 * 通过名称获取地址
		 * @author Li Dan
		 * @date   2015-08-07
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.getAddressByName = function(data) {
			Model.GetAddressByName({
				keyWord: data.keyWord,
				maxResult: data.maxResult?data.maxResult:10
			}, {}).then(function(res) {
				if (res) {
					View.showAddressList(res, data);
				} else {
					notify.error("获取地址失败！");
				}
			});
		};
		/**
		 * 通过坐标获取地址名称
		 * @author Li Dan
		 * @date   2015-08-11
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.getNameByCoor = function(data) {
			Model.GetNameByCoor({
				lon: data.lon,
				lat: data.lat
			}, {}).then(function(res) {
				if (res) {
					View.setAddressInput(res, data);
				} else {
					notify.error("获取地址失败！");
				}
			});
		};
		/**
		 * 保存收藏的路径
		 * @author Li Dan
		 * @date   2015-08-11
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.saveMyFavoriteRoute = function(data) {
			Model.SaveFavoriteRoutes(data, {}).then(function(res) {
				if (res.code === 200) {
					//提示
					notify.success("收藏成功！");
					//日志

				} else if (res.code == 500) {
					notify.error(res.data.message + "！"); //错误码：" + res.code;
				} else {
					notify.error("收藏失败，网络或服务器异常！");
				}
			});
		};
		/**
		 * 保存搜索过的地址
		 * @author Li Dan
		 * @date   2015-08-11
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.saveSearchedAddress = function(data) {
			Model.SaveSearchedAddress(data, {}).then(function(res) {
				if (res.code === 200) {
					//日志

				} else if (res.code == 500) {
					notify.error(res.data.message + "！"); //错误码：" + res.code;
				} else {
					notify.error("保存搜索记录失败，网络或服务器异常！");
				}
			});
		};
		/**
		 * 获取搜索过的地址
		 * @author Li Dan
		 * @date   2015-08-11
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.getHistoryAddress = function(data) {
			Model.SearchHistoryAddress({
				currentPage: data.currentPage,
				pageSize: data.pageSize,
				key: data.key
			}, {}).then(function(res) {
				if (res.code === 200) {
					//日志
					View.setHistoryAddress(res, data);
				} else if (res.code == 500) {
					notify.error(res.data.message + "！"); //错误码：" + res.code;
				} else {
					notify.error("获取搜索记录失败，网络或服务器异常！");
				}
			});
		};
		/**
		 * 清除历史搜索地址
		 * @author Li Dan
		 * @date   2015-08-12
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.clearHistoryAddress = function(data) {
			Model.ClearHistoryAddress(data, {}).then(function(res) {
				if (res.code === 200) {
					notify.success("清空历史成功!");
					//日志
					View.closeAddressWin();
				} else if (res.code == 500) {
					notify.error(res.data.message + "！"); //错误码：" + res.code;
				} else {
					notify.error("清除搜索记录失败，网络或服务器异常！");
				}
			});
		};
		/**
		 * 缓冲区搜索摄像机
		 * @author Li Dan
		 * @date   2015-08-13
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.searchCameraByGeometry = function(data) {
			Model.searchCameraByGeometry(data, {}).then(function(res) {
				if (res.code === 200) {
					//日志

					View.setCameraResourcesOnMap(res);
				} else if (res.code == 500) {
					notify.error(res.data.message + "！"); //错误码：" + res.code;
				} else {
					notify.error("搜索资源失败，网络或服务器异常！");
				}
			});
		};
		/**
		 * 缓冲区搜索摄像机个数
		 * @author Li Dan
		 * @date   2015-08-13
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.searchCameraNumByGeometry = function(data) {
			Model.searchCameraByGeometry(data, {}).then(function(res) {
				if (res.code === 200) {
					//日志
					View.showIntermediateStopNum(res.data.cameras.length);
					
				} else if (res.code == 500) {
					notify.error(res.data.message + "！"); //错误码：" + res.code;
				} else {
					notify.error("搜索资源失败，网络或服务器异常！");
				}
			});
		};
		return scope;
	}({}));
});