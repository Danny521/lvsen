/**
 * 地图相关变量
 */
define([], function() {

	return {
		//地图对象
		map: null,
		//基础图层
		baseLayer: null,
		//卫星地图图层
		satelliteLayer: null,
		//绘制工具
		drawtool: null,
		//测量工具
		measuretool: null,
		//聚合图层
		resourceLayers: {
			clusterResource: {},
			clusterResourceNum: 0,
			cluster: null
		},
		//记录上次点击的点位坐标
		lastClickData: {
			longitude: 0,
			latitude: 0
		},
		//记录当前摄像机数据
		currentCameraData: null,
		//是否是全景
		isFullview: false,
		//模板
		template: null,
		//OCX DOM结构
		ocxDom: null,
		//OCX播放对象
		videoPlayerSigle: null,
		//当前摄像机标注
		currentCameraMarker: null,
		//要素图层
		layers: {
			//警卫路线全部图层
			guardRouteAllLayer: null,
			//道路搜索图层
			routeLayer: null,
			//警卫路线图层
			guardRouteLayer: null,
			//我的关注图层
			myAttentionLayer: null,
			//电子防线图层
			defenseLineLayer: null,
			//标注图层
			markerLayer: null,
			//搜索结果图层
			searchResultLayer: null,
			//左侧灯杆、gps、350M、道路、摄像机等资源的在地图上的定位图层
			resourceShowLayer: null,
			//GPS车队图层
			gpsCarLayer: null,
			//全局搜索结果图层
			SearchCenterLayer: null,
			//全局搜索周围资源搜索图层
			globalSearchRoundLayer: null,
			/*//灯杆资源图层
			lightbarResourceLayer: null,
			//警车资源图层
			policeResourceLayer: null,
			//警员资源图层
			policemanResourceLayer: null,*/
			//视野范围内搜索结果图层
			rangeSearchLayer: null,
			//路径分析图层
			routeAnalysisLayer: null,
			gpsControlLayer: null
		},
		//是否是全屏状态
		isFullscreenOnMapStyle: false,
		//全局搜索参数
		GlobalSearch: {
			searchCircle: null, //搜索圈
			searchTextBg: null, //搜索圈背景
			needClearSearchContext: false   //标记是否使用了全局搜索功能，且该功能涉及的图层上障碍物没有清除时
		},
		//当前视野范围内的搜索数据类型
		mapExtentDataType: "",
		//全景播放视频
		videoPlayerFullview: null,
		// 全景标注
		fullMark: null,
		//全景小地图上的定位对象（供多个摄像机共用）
		cameraGraphic: null,
		//是否正在绘制
		isDrawing: false,
		//当前警卫路线ID
		guardRouteCurrShowID: 0,
		//是否正在播放路线
		isUserDoPlayRoute: false,
		//当前警卫路线正在播放的摄像机
		currCameraOfGuardRoute: null,
		//警卫路线变量
		guardroute: {
			lastBuffer: null,
			lastPolyline: null
		},
		//是否在绘制警卫路线
		isDrawGraphicFlag: false,
		//是否在绘制防控圈
		isDrawCircleFlag: false,
		//是否在框选警卫路线摄像机
		isRectSelectRouteCameraFlag: false,
		//是否在框选防控圈摄像机
		isRectSelectCircleCameraFlag: false,
		//警卫路线起点和终点
		guardRoutePoints: {
			startGraphic: null,
			endGraphic: null
		},
		//保存地图下方播放栏播放器对象(地图发送到扩展屏，框选轮训时使用)
		mapVideoBarPlayer: null,
		//标记地图信息窗的hide是否是因为业务关闭，如果是，则地图拖拽完成后，也不再显示。默认为false
		isHideInfoWindowBybusiness: false
	};

});