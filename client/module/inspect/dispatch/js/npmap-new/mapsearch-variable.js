/*global mapConfig:true*/
/**
 * Created by Zhangyu on 2014/12/18.
 * 全局搜索的公共变量
 */
define([
	"OpenLayers",
	"npmapConfig"
], function(){
	return {
		//搜索信息配置
		searchInfoConfig: {
			map: {
				//开关，标记是否使用地图服务来读取兴趣点
				useMapServer: mapConfig.globalSearchConfig.useMapServer,
				//地图数据从服务中读取配置信息
				mapServer: mapConfig.globalSearchConfig.searchServiceUrl, //mapConfig.voiLayer + "/",//
				layerIds: mapConfig.globalSearchConfig.voiLayerSection, //[0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],//
				searchFields: ["DWMC", "NAME"],
				searchText: "",
				returnGeometry: true,
				contains: true,
				//地图兴趣点数据从数据库中读取配置信息
				data: {
					value: "",
					pageSize: 100
				}
			},
			route: { //路网数据配置信息
				mapServer: mapConfig.globalSearchConfig.searchServiceUrl, //mapConfig.routeLayer + "/",//
				layerIds: mapConfig.globalSearchConfig.routeLayerSection, //[0, 1, 2, 4, 5, 6, 7, 8, 9],//
				searchFields: ["NAME"],
				searchText: "",
				returnGeometry: true,
				contains: true
			},
			config: { //全局搜索配置
				CategoryPageSize: 10, //搜索结果浮动层中每个分类配置显示的条数，如果是后台读取，也可以是分页的单页条数
				curDataType: mapConfig.globalSearchConfig.globalDefaultSearchType, //进行全局搜索的默认搜索类型，即默认进入的搜索类型
				showTabs: mapConfig.globalSearchConfig.globalSearchTab, //配置当前应用到的tab(配置在npmap-config里面)
				searchServerType: mapConfig.getServerType() //获取查询服务的类型
			}
		},
		//列表展现时单页的item数量
		pageSize: 15,
		//标记当前界面上展现的数据类型
		curDataType: "",
		//搜索结果的items列表保存对象
		resultData: null,
		//当前的数据来源（global为全局搜索，range为视野范围内，"alarm、gps、350"为周围[around]搜索, "area"为各行政区的gps信号搜索）
		curDataFromTag: "",
		//输入搜索标记为，用来判断是否是输入搜索
		isInputSearch: false
	};
});
