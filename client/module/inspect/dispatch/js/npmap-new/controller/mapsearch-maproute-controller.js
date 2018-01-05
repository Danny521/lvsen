/**
 * Created by Zhangyu on 2015/4/19.
 */
define([
	"js/npmap-new/mapsearch-variable",
	"js/npmap-new/view/mapsearch-maproute-view",
	"js/npmap-new/model/mapsearch-model",
	"js/npmap-new/controller/mapsearch-common-fun",
	"jquery"
], function(_g, View, Model, SearchCommon, jQuery) {

	return (function (scope, $) {
		//初始化模板
		View.init(scope);
		/**
		 * 地图兴趣点数据搜索（从服务中获取）
		 * @param inputValue - 待搜索的关键字
		 */
		var _searchMap = function (inputValue) {
				//初始化查询信息
				var searchItem = "map", service = new NPMapLib.Services.QueryService(_g.searchInfoConfig.config.searchServerType), url = _g.searchInfoConfig[searchItem].mapServer, params = new NPMapLib.Services.queryParams();
				//初始化参数
				params.searchText = inputValue;
				params.layers = _g.searchInfoConfig[searchItem].layerIds;
				params.searchFields = _g.searchInfoConfig[searchItem].searchFields;
				//委托deffered
				var result = Model.getDataByService(service, url, params).deffered.then(function (result) {
					//查询成功
					var mapData = SearchCommon.formatResultData(result, 1, searchItem, "global");
				}, function () {
					notify.error("门牌数据查询失败！请检查搜索服务是否配置正确！");
				});

				return result.deffered;
			},

			/**
			 * 地图兴趣点数据搜索（从数据库中获取）
			 * @param inputValue - 待搜索的关键字
			 */
			_searchMapByDB = function (inputValue) {
				var searchItem = "map";
				var param = $.extend(_g.searchInfoConfig[searchItem].data, {
					value: inputValue
				});
				//请求后台读取数据
				Model.getMapDataByDB(param, {
					cache: false
				}).then(function (res) {
					if (res.code === 200) {
						//查询成功
						var mapData = SearchCommon.formatResultData(res.data.interestings, 1, searchItem, "global");
					} else {
						notify.error("门牌数据查询失败！");
					}
				}, function () {
					notify.error("门牌数据查询失败！网络或服务器异常！");
				});
			},

			/**
			 * 对路网数据进行搜索（从服务中获取）
			 * @param inputValue - 待搜索的关键字
			 */
			_searchRoute = function (inputValue) {
				var searchItem = "route", service = new NPMapLib.Services.QueryService(_g.searchInfoConfig.config.searchServerType), url = _g.searchInfoConfig[searchItem].mapServer, params = new NPMapLib.Services.queryParams();
				//初始化参数
				params.searchText = inputValue;
				params.layers = _g.searchInfoConfig[searchItem].layerIds;
				params.searchFields = _g.searchInfoConfig[searchItem].searchFields;

				//委托deffered
				var result = Model.getDataByService(service, url, params).deffered.then(function (result) {
					//查询成功
					var mapRoute = SearchCommon.formatResultData(result, 1, searchItem, "resource");
					//组装结果信息并展现
					View.showRouteList(mapRoute);

				}, function () {
					notify.error("路网数据查询失败！请检查搜索服务是否配置正确！");
				});
			};
		/**
		 * 根据用户在搜索框中输入的值，通过地图API查询结果并返回绑定
		 * @param inputValue - 待查询的值
		 * @param type - 查询结果的类型
		 */
		scope.QueryMap = function (inputValue, type) {

			switch (type) {
				case "map":
					//地图数据搜索
					if (_g.searchInfoConfig.map.useMapServer) {
						//地图服务搜索
						_searchMap(inputValue);
					} else {
						//数据库接口搜索
						_searchMapByDB(inputValue);
					}
					break;
				case "route":
					//路网数据搜索
					return _searchRoute(inputValue);
					break;
			}
		};

		return scope;

	}({}, jQuery));
});