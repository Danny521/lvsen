/**
* 实战2.0地图配置文件
**/
define(['jquery'], function(jQuery) {
	var mapConfigResult = null;
	jQuery.ajax({
		url: "/component/base/mapConfig.json",
		cache: false,
		type: 'GET',
		async: false,
		success: function (res) {
			if (res.length !== 0) {
				mapConfigResult = res;
				if (typeof res === 'string') {
					mapConfigResult = JSON.parse(res);
				}
			} else {
				notify.warn('请求地图配置JOSN出错！');
			}
		},
		error: function () {
			notify.warn('网络异常');
		}
	});
	var mapConfig = window.mapConfig = {
		//接入服务
		serviceType: "arcgis",//接入服务类型 arcgis/pgis/mapworld/googlemap
		//baseLayer
		baseLayer: [],
		//卫星图层
		satelliteLayer: [],
		//是否调试
		isDebug: false,
		//几何服务地址
		geometryServiceUrl: "/npgisdataservice/gis/buffer",
		//指挥调度地图左上角的区域位置名称
		regionName: "淮安市",
		//路径分析查询服务
		routeAnalysisService: "/npgisdataservice/gis/na",
		//地名地址匹配服务
		nameAddressMatchService: "/npgisdataservice/query",
		//地图移动点位数据的刷新配置[gps\350M]
		pointRefresherConfig: {
			//配置是否需要动态刷新
			enable: false,
			//资源点位的刷新定时器对象
			refreshTimer: null,
			//刷新点位的限制
			refreshLimitNum: 200,
			//业务点位的刷新定时器对象
			busnessRefreshTimer: null,
			//定时器时间间隔
			refreshTimeSpan: 1000
		},
		//地图聚合点的配置
		clusterMarkerConfig: {
			enable: true,
			//聚合点点击展开模式 默认 'zoom' 地图zoom 增加一级，其他为撒点
			clusterClickModel: "zoom",
			//聚合图层时，达到此图层级别聚合点全部展开（一般取值为当前地图类型的最小zoom和最大zoom之间）
			maxZoom: 16,
			//（暂不设置,clusterClickModel为slice时有效）点击聚合点时，地图缩放到指定层级，如果不设置，则点击聚合点位，点位会一级级撒点显示
			selectZoom: 1,
			//聚合点的距离（像素）
			distance: 80,
			//聚合点位的加载方式(true为异步加载，false为非异步)，数据量比较多的时候建议用false
			isAsynchronous: {camera: false, bayonet: true, lightbar: true, gps: true}
		},
		//全局搜索的配置
		globalSearchConfig: {
			//查询服务地址
			searchServiceUrl: "/arcgisservice/arcgis/rest/services/shanghaiBaseMapRoad512/MapServer///find?",
			//查询服务的类型,"arcgis"、"geoserver"
			searchServiceType: "arcgis",
			//兴趣点服务搜索图层区间
			voiLayerSection: [256],
			//路网服务搜索图层区间
			routeLayerSection: [1, 2, 3, 4, 5, 6],
			//地图兴趣的搜索是否采用服务的方式
			useMapServer: true
		},
		// 系统配置-地图配置-地图标注(显示标注点 自动放大到相应图层)
		settings: {
			// 地图标注默认放大级别(value需要根据实际情况配置)
			markZoom: 4
		},
		//全景小地图默认打开图层
		fullviewZoom: 6,
		/**
		 * 1、双击左侧摄像机定位地图级别
		 * 2、播放左侧摄像机定位地图播放的级别
		 * 3、左侧非摄像机资源结果项点击后，地图联动显示的缩放级别
		 * 4、地图上资源点位，点击后联动显示信息窗时的地图缩放级别
		 */
		clcikResMapZoom: 16,
		//视野范围内搜索(视野范围内搜索时缩放到此层上进行搜索，以防数据过多时影响性能)
		viewSearchZoom: 2,
		//圈圈内搜索时，地图缩放的图层界别
		circleSearchZoom: 6,
		//框选限制（框选时如果视野范围内的资源大于这个值，则提示用户放大地图层级进行框选/圈选）
		selectLimitNum: 1000,
		//警卫路线播放速度,1秒100米
		guardRouteSpeed: 100
	};
	//初始化地图
	mapConfig.initMap = function (mapContainer, flag) {
		var map = new NPMapLib.Map(mapContainer, mapConfigResult.mapOpts);
		//地图加载完成后，初始化地图业务图层切换的初始值
		mapConfig.initMapZoom(map);
		//添加基础图层
		mapConfig.baseLayer = mapConfig.addLayerToMap(map, mapConfigResult.vectorLayer);
		//添加卫星图层
		mapConfig.satelliteLayer =  mapConfig.addLayerToMap(map, mapConfigResult.sattilateLayer);
		//添加卫星图层
		var satelliteLayer = []
		//考虑到布防布控、视频指挥、运维、系统配置均使用到了地图，原来的判断已经不能满足，故在初始化地图时对外暴露地图对象，以便在拖动slidebar时统一控制，鼠标跟随文字可以自适应，by zhangyu on 2015/4/1
		return flag ? window.map = map : map;
	};
	//添加地图图层map:地图对象 layer:图层
	mapConfig.addLayerToMap = function(map, layer){
		var baseLayer = [];
		if(layer && layer.length>0){
			//添加基础图层
			var vectorLayerItem, baseLayerItem, layerType;
			for (var i = 0, len = layer.length; i < len; i++) {
				vectorLayerItem = layer[i];
				layerType = vectorLayerItem.layerType.split('.');
				baseLayerItem = new NPMapLib.Layers[layerType[layerType.length - 1]](vectorLayerItem.layerOpt.url, vectorLayerItem.layerName, vectorLayerItem.layerOpt);
				baseLayer.push(baseLayerItem);
			}
			map.addLayers(baseLayer);
		}
		return baseLayer;
	},
	/**
	 * 获取地图搜索服务的类型，供全局搜索调用，可扩展,add by zhangyu,2014-10-29
	 */
	mapConfig.getServerType = function () {
		if (mapConfig.globalSearchConfig.searchServiceType === "arcgis") {
			return NPMapLib.MAPTYPE_ARCGISTILE;
		} else if (mapConfig.globalSearchConfig.searchServiceType === "geoserver") {
			return NPMapLib.MAPTYPE_GEOSERVER;
		}
	};
	/**
	 * 根据地图类型，筛选当前坐标是否合法
	 * add by zhangyu on 2015/6/4
	 * @param lon - 经度
	 * @param lat - 纬度
	 * @returns {boolean} - 返回是否合法
	 */
	mapConfig.checkPosIsCorrect = function (lon, lat) {
		var x = parseFloat(lon), y = parseFloat(lat);
		//获取地图投影方式
		var mapProject = window.map.getProjection();
		//判断地图投影方式
		// if (mapProject === "EPSG:4326") {
		// 	//经纬度坐标(合法性判断)
			if (x > 180 || x < -180 || y > 90 || y < -90) {
				notify.warn("坐标信息不合法！");
				return false;
			}
		// } else if (mapProject === "EPSG:900913") {
		// 	//平面坐标(合法性判断)
		// 	if ((x > -180 && x < -90) || (y > -180 && y < -90)) {
		// 		notify.warn("坐标信息不合法！");
		// 		return false;
		// 	}
		// }

		//合法性通过，获取当前地图坐标范围
		var mapLegalExtent = mapConfigResult.mapOpts.restrictedExtent;
		//地图坐标范围判断
		if (!mapLegalExtent || mapLegalExtent.length === 0 || mapLegalExtent.length !== 4) {
			return true;
		} else {
			var maxExtent = NPMapLib.T.getExtent(window.map,new NPMapLib.Geometry.Extent(mapLegalExtent[0],mapLegalExtent[1],mapLegalExtent[2],mapLegalExtent[3]));
			//判断坐标区间
			if (x >= maxExtent.left && x <= maxExtent.right && y >= maxExtent.bottom && y <= maxExtent.top) {
				return true;
			} else {
				notify.warn("坐标信息超出了地图当前的坐标范围！");
				return false;
			}
		}
	}
	/**
	 * 根据地图对象，设置配置中的zoom信息（预初始化）
	 * 以解决部署安装过程中应地图层级变换造成的使用问题。
	 * add by zhangyu on 2015/6/4
	 * @param map - 地图对象
	 */
	mapConfig.initMapZoom = function (map) {
		//获取地图图层级别
		var maxZoom = map.getMaxZoom(),
			minZoom = map.getMinZoom(),
			levelCount = maxZoom - ((minZoom === 0) ? minZoom : minZoom - 1),
			maxSuggestLevel = (levelCount > 5) ? maxZoom - 3 : (levelCount > 3) ? maxZoom - 2 : (levelCount > 2) ? maxZoom - 1 : maxZoom,
			minSuggestLevel = (levelCount > 5) ? minZoom + 2 : (levelCount > 3) ? minZoom + 1 : minZoom;

		//初始化业务缩放层级
		if (!(mapConfig.clcikResMapZoom <= maxZoom && mapConfig.clcikResMapZoom >= minZoom)) {
			//资源定位的地图层级
			mapConfig.clcikResMapZoom = maxSuggestLevel;
		}
		if (!(mapConfig.fullviewZoom <= maxZoom && mapConfig.fullviewZoom >= minZoom)) {
			//全景小地图的地图层级
			mapConfig.fullviewZoom = maxSuggestLevel;
		}
		if (!(mapConfig.viewSearchZoom <= maxZoom && mapConfig.viewSearchZoom >= minZoom)) {
			//视野范围内搜索时地图层级
			mapConfig.viewSearchZoom = minSuggestLevel;
		}
		if (!(mapConfig.circleSearchZoom <= maxZoom && mapConfig.circleSearchZoom >= minZoom)) {
			//附近搜索时地图层级
			mapConfig.circleSearchZoom = maxSuggestLevel;
		}
		if (!(mapConfig.settings.markZoom <= maxZoom && mapConfig.settings.markZoom >= minZoom)) {
			//系统配置点位标记图层级别
			mapConfig.settings.markZoom = maxSuggestLevel;
		}
		if (!(mapConfig.clusterMarkerConfig.maxZoom <= maxZoom && mapConfig.clusterMarkerConfig.maxZoom >= minZoom)) {
			//聚合点位完全散开的图层级别
			mapConfig.clusterMarkerConfig.maxZoom = maxSuggestLevel;
		}
		if (!(mapConfig.clusterMarkerConfig.selectZoom <= maxZoom && mapConfig.clusterMarkerConfig.selectZoom >= minZoom)) {
			//聚合点位点击时三开的图层级别
			mapConfig.clusterMarkerConfig.selectZoom = maxSuggestLevel;
		}
	};
});
