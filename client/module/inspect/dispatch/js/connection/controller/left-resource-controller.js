/**
 * Created by Zhangyu on 2015/4/21.
 */
define([
	"js/connection/view/left-resource-view",
	"js/connection/model/left-resource-model",
	"js/npmap-new/controller/mapsearch-common-fun",
	"js/npmap-new/controller/mapsearch-maproute-controller",
	"jquery",
	"js/connection/left-register-helper"
], function(View, Model, SearchCommon, MapSearch, jQuery) {

	return (function(scope, $){
		//初始化模板
		View.init(scope);

		/**
		 * 搜索框搜索资源
		 * @param data - 搜索参数
		 * @param type - 搜索资源类型
		 */
		scope.searchResource = function(data, type) {
			if (type === "lightbar") {
				//搜索灯杆
				scope.loadLightbarList(data);
			} else if (type === "police") {
				//搜索警车
				scope.loadPoliceList(data);
			} else {
				//搜索警员
				scope.loadPolicemanList(data);
			}
		};
		/**
		 * 加载灯杆信息列表
		 * @param key - 搜索关键字
		 */
		scope.loadLightbarList = function(data) {
			//收集请求参数
			var params = $.extend({
				currentPage: 1,
				pageSize: 15,
				code: ""
			}, data);
			//请求后台读取数据
			Model.GetLightbarList(params, {}).then(function (res) {
				if (res.code === 200) {
					//查询成功
					var lightbarData = SearchCommon.formatResultData(res.data.lampposts || [], 1, "lightbar", "resource");
					//在左侧列表上显示
					View.showResource(lightbarData, res.data, "lightbar");
				} else {
					notify.error("灯杆数据查询失败！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("灯杆数据查询失败！网络或服务器异常！");
			});
		};
		/**
		 * 加载警车信息列表
		 * @param data - 搜索参数
		 */
		scope.loadPoliceList = function(data) {
			//收集请求参数
			var params = $.extend({
				currentPage: 1,
				pageSize: 15,
				code: ""
			}, data);
			//请求后台读取数据
			Model.GetPoliceList(params, {}).then(function (res) {
				if (res.code === 200) {
					//查询成功
					var policeData = SearchCommon.formatResultData(res.data.data.rows || [], 1, "gps", "resource");
					//在左侧列表上显示
					View.showResource(policeData, res.data.data, "police");
				} else {
					notify.error("警力数据查询失败！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("警力数据查询失败！网络或服务器异常！");
			});
		};
		/**
		 * 加载警员信息列表
		 * @param data - 搜索参数
		 */
		scope.loadPolicemanList = function(data) {
			//收集请求参数
			var params = $.extend({
				currentPage: 1,
				pageSize: 15,
				code: ""
			}, data);
			//请求后台读取数据
			Model.GetPolicemanList(params, {}).then(function (res) {
				if (res.code === 200) {
					//查询成功
					var policemanData = SearchCommon.formatResultData(res.data["350M"] || [], 1, "350M", "resource");
					//在左侧列表上显示
					View.showResource(policemanData, res.data, "policeman");
				} else {
					notify.error("警员数据查询失败！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("警员数据查询失败！网络或服务器异常！");
			});
		};
		/**
		 * 根据id获取gps详细信息
		 * @param data - gps初步信息
		 */
		scope.getGpsDetails = function(data) {

			//请求后台读取数据
			Model.getGpsDetails({
				code: data.key
			}, {}).then(function (res) {
				if (res.code === 200) {
					if(res.data.gps.length !== 0) {
						//组装数据
						data.key = res.data.gps[0].key;
						data.lon = res.data.gps[0].lon;
						data.lat = res.data.gps[0].lat;
						data.time = Toolkit.mills2datetime(res.data.gps[0].time);
						data.gpsName = res.data.gps[0].gpsName;
						data.contacts = res.data.gps[0].contacts;
						data.lprVale = res.data.gps[0].lprVale;
						//显示信息窗
						View.showGpsInfowindow(data);
					} else {
						notify.warn("查询不到该警力的即时信息，可能已下线！");
					}
				} else {
					notify.error("警力数据查询失败！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("警力数据查询失败！网络或服务器异常！");
			});
		};
		/**
		 * 加载道路信息列表
		 * @param key - 搜索关键字
		 */
		scope.loadRouteList =  function(key) {
			MapSearch.QueryMap(key, "route");
		};

		return scope;

	}({}, jQuery));

});