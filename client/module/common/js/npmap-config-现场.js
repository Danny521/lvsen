/**

* 实战2.0地图配置文件

**/

mapConfig = {

	//接入服务

	serviceType: "mapworld",//接入服务类型 arcgis/pgis/mapworld/googlemap

	//基础图层

	baselayer: "/arcgisservice/arcgis/rest/services/shanghaiBaseMap512/MapServer",

	/*baselayer: "http://tile1.tianditu.com/DataServer",*/

	/*baselayer: "http://192.168.61.29:1081/MAP00001/",*/

	//卫星图层

	sattilatelayer: "/arcgisservice/arcgis/rest/services/shanghaiBaseMap512/MapServer",

	//是否调试

	isDebug: false,

	//几何服务地址

	geometryServiceUrl: "/geoserver/wps",

	//指挥调度地图左上角的区域位置名称

	regionName: "沧州献县",
	//地图移动点位数据的刷新配置[gps\350M]
	pointRefresherConfig: {
		//配置是否需要动态刷新
		enable: true,
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

		//聚合图层时，达到此图层级别聚合点全部展开

		maxZoom: 16,

		//（暂不设置,clusterClickModel为slice时有效）点击聚合点时，地图缩放到指定层级，如果不设置，则点击聚合点位，点位会一级级撒点显示

		selectZoom: 16,

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

		useMapServer: true,

		//全局搜索，点击右上角浮动层中结果列表的某一行时，地图放大的级别

		clickSingleSearchItemZoom: 16

	},

	// 系统配置-地图配置-地图标注(显示标注点 自动放大到相应图层)

	settings: {

		// 地图标注默认放大级别(value需要根据实际情况配置)

		markZoom: 16

	},

	maxZoom: 16,

	//全景小地图默认打开图层

	fullviewZoom: 16,

	//双击摄像机定位地图级别

	dbclcikCameraMapZoom: 16,

	//视野范围内搜索(视野范围内搜索时缩放到此层上进行搜索，以防数据过多时影响性能)

	viewSearchZoom: 16,

	//聚合颜色 提供两种颜色"red"、"blue"（目前废弃）

	clusterColor: "red",

	//框选限制（框选时如果视野范围内的资源大于这个值，则提示用户放大地图层级进行框选/圈选）

	selectLimitNum: 1000,

	//arcigs 地图范围和级别范围设置

	mapZoomAndExtentOpts: {

		minZoom: 0, //地图允许展示的最小级别

		maxZoom: 10, //地图允许展示的最大级别

		restrictedExtent: [120.21702921092, 29.485713008051, 123.02395562752, 32.292639424656]

	},

	//arcgis 地图图层配置

	layerOpts: {

		isBaseLayer: true,

		resolutions: [

			0.0018274260524776553, 0.0009137130262388277, 0.0004568565131194138, 0.0002284282565597069, 0.00011421412827985346, 0.00005710706413992673, 0.000028553532069963364, 0.000014276766034981682, 0.000007138383017490841, 0.0000035691915087454205, 0.0000017845957543727103

		],

		tilePixels: 512,

		origin: [-400, 400],

		fullExtent: [120.47858455842022, 30.630244114771266, 122.48782879957419, 31.91994939377127],

		projection: 'EPSG:4326',

		//centerPoint: [112.53929,37.84696],

		zoomOffset: 0 //偏移量，控制从第几级开始显示地图

	},

	//pgis 地图范围和级别范围设置

	pgisMapOpts: {

		minZoom: 11,//最小图层级别

		maxZoom: 19,//最大图层级别

		maxResolution: 2,//最大分辨率,

		projection: "EPSG:3785",//投影方式

		originCenter: [111.677695, 40.836575],//中心点

		resolution: 0.0009765625,//初始分辨率

		fullExtent: [110.65879, 38.82641, 112.6966, 40.84674],

		maxExtent: [110.65879, 38.82641, 112.6966, 40.84674]

	},

	//pgis 地图图层配置

	pgisLayerOpts: {

		type: "png",//图片格式

		maxZoomLevel: 19,//最大图层级别

		resolutions: [2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625, 0.0078125, 0.00390625, 0.001953125, 0.0009765625, 0.00048828125, 0.000244140625, 0.0001220703125, 0.00006103515625, 0.000030517578125, 0.0000152587890625, 0.00000762939453125, 0.000003814697265625, 0.0000019073486328125, 9.5367431640625e-7, 4.76837158203125e-7],

		maxResolution: 2,

		units: "Lat-66",//单位

		tileOrigin: [0, 0]//切片起始点

	},

	//天地图 地图范围配置

	mapworldMapOpts: {

		minZoom: 11,

		maxZoom: 18

	},

	//天地图 地图图层配置

	mapworldLayerOpts: [

		{

			mapType: 'EMap',

			centerPoint: [116.12477704285,38.178675601319],

			// fullExtent: [120.47858455842022, 30.630244114771266, 122.48782879957419, 31.91994939377127],

			topLevel: 0,

			bottomLevel: 18,

			isBaseLayer: true,

			mirrorUrls: ["/map/vec_c/"],

			zoomOffset: 0,

			isLocalMap:true

		},

		{

			mapType: 'ESatellite',

			centerPoint: [116.12477704285,38.178675601319],

			//  fullExtent: [120.47858455842022, 30.630244114771266, 122.48782879957419, 31.91994939377127],

			topLevel: 0,

			bottomLevel: 18,

			isBaseLayer: false,

			mirrorUrls: ["/map/cva_c/"],

			zoomOffset: 0,

			isLocalMap:true

		}

	],

	//谷歌地图 范围配置

	googleMapOpts: {

		minZoom: 10,

		maxZoom: 18,

		restrictedExtent: [13423402.728774, 3562204.3833067, 13657893.035257, 3796407.4379399],

		projection: "EPSG:900913",

		displayProjection: "EPSG:4326"

	},

	//谷歌地图 地图图层配置

	googlemapLayerOpts: {

		type: 'png',

		centerPoint: [13535918.034395, 3673726.0075593],

		fullExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],

		minLevel: 0,

		maxLevel: 1,

		zoomOffset: 10,

		zoomLevelSequence: 2

	},

	//初始化地图

	initMap: function (mapContainer, flag) {

		var map = null;

		if (this.serviceType === "arcgis") {

			//创建地图对象

			map = new NPMapLib.Map(mapContainer, this.mapZoomAndExtentOpts);

		} else if (this.serviceType === "pgis") {

			//创建地图对象

			map = new NPMapLib.Map(mapContainer, this.pgisMapOpts);

		} else if (this.serviceType === "mapworld") {

			//创建地图对象

			map = new NPMapLib.Map(mapContainer, this.mapworldMapOpts);

		} else {

			map = new NPMapLib.Map(mapContainer, this.googleMapOpts);

		}

		//考虑到布防布控、视频指挥、运维、系统配置均使用到了地图，原来的判断已经不能满足，故在初始化地图时对外暴露地图对象，以便在拖动slidebar时统一控制，鼠标跟随文字可以自适应，by zhangyu on 2015/4/1

		return flag ? window.map = map : map;

	},

	//初始化图层

	initLayer: function (layerurl, layername) {

		var layer = [];

		if (this.serviceType === "arcgis") {

			//创建图层

			layer = [new NPMapLib.Layers.ArcgisTileLayer(layerurl, layername, this.layerOpts)];

		} else if (this.serviceType === "pgis") {

			//创建图层

			layer = [new NPMapLib.Layers.EzMapTileLayer(layerurl, layername, this.pgisLayerOpts)];

		} else if (this.serviceType === "mapworld") {

			//创建图层

			var layer1 = new NPMapLib.Layers.TDMapLayer(layerurl, layername, this.mapworldLayerOpts[0]);

			var layer2 = new NPMapLib.Layers.TDMapLayer(layerurl, layername, this.mapworldLayerOpts[1]);

			layer = [layer1, layer2];

		} else {

			layer = [new NPMapLib.Layers.GoogleOffLineLayer(layerurl, layername, this.googlemapLayerOpts)];

		}

		return layer;

	},

	/**

	 * 获取地图搜索服务的类型，供全局搜索调用，可扩展,add by zhangyu,2014-10-29

	 */

	getServerType: function () {

		var me = this;

		if (me.globalSearchConfig.searchServiceType === "arcgis") {

			return NPMapLib.MAPTYPE_ARCGISTILE;

		} else if (me.globalSearchConfig.searchServiceType === "geoserver") {

			return NPMapLib.MAPTYPE_GEOSERVER;

		}

	},

	/**

	 * * 根据地图类型，筛选当前坐标是否合法

	 * @param lon - 经度

	 * @param lat - 纬度

	 * @returns {boolean} - 返回是否合法

	 */

	checkPosIsCorrect: function (lon, lat) {

		var x = parseFloat(lon), y = parseFloat(lat);

		//获取地图投影方式

		var mapProject = window.map.getProjection();

		//判断地图投影方式

		if (mapProject === "EPSG:4326") {

			//经纬度坐标(合法性判断)

			if (x > 180 || x < -180 || y > 90 || y < -90) {

				notify.warn("坐标信息不合法！");

				return false;

			}

		} else if (mapProject === "EPSG:900913") {

			//平面坐标(合法性判断)

			if ((x > -180 && x < -90) || (y > -180 && y < -90)) {

				notify.warn("坐标信息不合法！");

				return false;

			}

		} else {

			//投影方式未知

			return true;

		}

		//地图坐标范围

		var mapLegalExtent = [];

		//合法性通过，获取当前地图坐标范围

		if (this.serviceType === "arcgis") {

			//arcgis地图

			mapLegalExtent = this.mapZoomAndExtentOpts.restrictedExtent || this.layerOpts.fullExtent;

		} else if (this.serviceType === "pgis") {

			//pgis地图

			mapLegalExtent = this.pgisMapOpts.restrictedExtent || this.pgisMapOpts.fullExtent || this.pgisMapOpts.maxExtent;

		} else if (this.serviceType === "mapworld") {

			//天地图

			mapLegalExtent = this.mapworldLayerOpts[0].restrictedExtent || this.mapworldLayerOpts[0].fullExtent;

		} else {

			//谷歌地图

			mapLegalExtent = this.googleMapOpts.restrictedExtent || this.googlemapLayerOpts.fullExtent;

		}

		//地图坐标范围判断

		if (!mapLegalExtent || mapLegalExtent.length === 0 || mapLegalExtent.length !== 4) {

			return true;

		} else {

			//判断坐标区间

			if (x >= mapLegalExtent[0] && x <= mapLegalExtent[2] && y >= mapLegalExtent[1] && y <= mapLegalExtent[3]) {

				return true;

			} else {

				notify.warn("坐标信息超出了地图当前的坐标范围！");

				return false;

			}

		}

	}

};