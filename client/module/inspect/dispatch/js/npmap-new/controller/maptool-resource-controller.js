/**
 * Created by Zhangyu on 2015/4/18.
 */
define(["js/npmap-new/view/maptool-resource-view", "js/npmap-new/model/maptool-resource-model", "js/npmap-new/controller/mapsearch-common-fun", "js/npmap-new/controller/mapsearch-result-controller", "js/npmap-new/controller/map-gps-refresh-controller"], function(View, Model, commonFuns, SearchResult, PointRefresh) {

	var Controller = (function(scope) {
		/**
		 * 灯杆数据搜索（从数据库中获取）
		 * @param inputValue - 待搜索的关键字
		 */
		scope.getLightbarData = function (inputValue) {
			var param = {
				currentPage: 1,
				pageSize: 1000000,
				code: inputValue
			};
			//请求后台读取数据
			Model.getLamppostData(param, {}).then(function (res) {
				if (res.code === 200) {
					var result = res.data.lampposts|| [];
					if(result.length !== 0) {
						//查询成功
						var lightbarData = commonFuns.formatResultData(result, 1, "lightbar", "resource");
						//在地图上显示灯杆数据
						SearchResult.showSearchResult(lightbarData, "lightbar", "resource");
					} else {
						notify.info("暂无灯杆数据！");
					}
				} else {
					notify.error("灯杆数据查询失败！");
				}
			}, function () {
				notify.error("灯杆数据查询失败！网络或服务器异常！");
			});
		};

		/**
		 * GPS数据搜索（从时序服务器中获取）
		 * @param inputValue - 待搜索的关键字
		 */
		scope.getPoliceData = function (inputValue) {
			var param = {
				code: inputValue
			};
			//请求后台读取数据
			Model.getGpsData(param, {
				cache: false
			}).then(function (res) {
				if (res.code === 200) {
					var result = res.data.gps|| [];
					if(result.length !== 0) {
						//查询成功
						var gpsData = commonFuns.formatResultData(result, 1, "gps", "resource");
						//在地图上显示警车数据
						SearchResult.showSearchResult(gpsData, "gps", "resource");
						//如果操作的是地图工具栏警力钱的复选框，则需要触发判断是否需要刷新资源点位,添加警力移动点位的刷新逻辑，by zhangyu on 2015/6/24
						PointRefresh.triggerResRefresh();
					} else {
						notify.info("暂无警力数据！");
					}
				} else {
					notify.error("警力数据查询失败！");
				}
			}, function () {
				notify.error("警力数据查询失败！网络或服务器异常！");
			});
		};

		/**
		 * 350M数据搜索（从时序服务器中获取）
		 * @param inputValue - 待搜索的关键字
		 */
		scope.getPolicemanData = function (inputValue) {
			var param = {
				text: inputValue
			};
			//请求后台读取数据
			Model.get350MData(param, {
				cache: false
			}).then(function (res) {
				if (res.code === 200) {
					var result = res.data["350M"] || [];
					if(result.length !== 0) {
						//查询成功
						var m350Data = commonFuns.formatResultData(res.data["350M"] || [], 1, "350M", "resource");
						//在地图上显示警员数据
						SearchResult.showSearchResult(m350Data, "350M", "resource");
					} else {
						notify.info("暂无警员数据！");
					}
				} else {
					notify.error("350M数据查询失败！");
				}
			}, function () {
				notify.error("350M数据查询失败！网络或服务器异常！");
			});
		};

		return scope;

	}({}));

	//初始化view
	View.init(Controller);
});