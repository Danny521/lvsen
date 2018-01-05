/**
 * Created by Zhangyu on 2015/4/8.
 */
define([
	"js/npmap-new/map-variable",
	"js/npmap-new/map-permission",
	"js/npmap-new/map-common-overlayer-ctrl",
	"pubsub",
	"js/npmap-new/map-dblclick-change",
	"/module/common/js/player2.js",
	"base.self"
], function(Variable, pvamapPermission, MapOverLayerCtrl, PubSub,dblclickChange) {

	return (function(scope, $, _g) {
		/**
		 * 选项卡插件
		 * @param control
		 * @returns {jQuery.fn}
		 */
		$.fn.tabControl = function (control) {
			var elt = $(this);

			control = $(control);
			//蚌埠、沧州项目不需要未实现的功能，故屏蔽掉,by zhangyu on 2015/6/23
			/*elt.find("li[data-tab!='near']").each(function() {
				$(this).html($("<i>").css({
					backgroundImage: "url()"
				}));
				if($(this).attr("data-tab") === "fromhere") {
					$(this).css("borderLeft", "none");
				}
			});*/
			//委托选项卡的点击事件/*[data-tab='near']*/
			elt.on("click", "li", function () {
				//遍历选项卡名称
				var tabName = $(this).attr("data-tab");
				//在点击选项卡时出发自定义事件
				elt.trigger("change.tabs", tabName);
			});

			//给选项卡绑定自定义事件
			elt.on("change.tabs", function (e, tabName) {
				//路网信息暂未完善，故先屏蔽掉。by zhangyu on 2015/5/9
				/*if(tabName === "endhere" || tabName === "fromhere") {
					notify.info("暂无可用的路网服务！");
					return;
				}*/
				elt.find("li").removeClass("active");
				elt.find(">[data-tab='" + tabName + "']").addClass("active");
			});

			elt.on("change.tabs", function (e, tabName) {
				//路网信息暂未完善，故先屏蔽掉。by zhangyu on 2015/5/9
				/*if(tabName === "endhere" || tabName === "fromhere") {
					return;
				}*/
				control.find(">[data-tab]").removeClass("active");
				control.find(">[data-tab='" + tabName + "']").addClass("active");
			});

			//激活第一个选项卡
			var firstName = elt.find("li:first").attr("data-tab");
			elt.trigger("change.tabs", firstName);

			return this;
		};


		/**
		 * 加载模板通用函数
		 * @param url - 模板地址url
		 * @param callbackSuccess - 模板加载成功后的执行函数
		 * @param callbackError - 模板加载失败后的执行函数
		 */
		scope.loadTemplate = function (url, callbackSuccess, callbackError) {
			var compiler = null;
			//加载模板
			$.when(Toolkit.loadTempl(url)).done(function (timeTemplate) {

				if (timeTemplate instanceof Array) {
					timeTemplate = timeTemplate[0];
				}
				//模板加载成功
				compiler = Handlebars.compile(timeTemplate);
				//成功的回调函数
				if (callbackSuccess && typeof callbackSuccess === "function") {
					callbackSuccess(compiler);
				}
			}).fail(function () {
				//错误的函数
				if (callbackError && typeof callbackError === "function") {
					callbackError();
				}
			});
		};
		/**
		 * 播放视频窗口
		 * @type {[type]}
		 */
		scope.showCameraInfoAndPlay = function(e) {
			//播放摄像机视频
			if (Variable.currentCameraData) {
				var camera = Variable.currentCameraData;
				camera.sd_channel = camera.sd_channel ? camera.sd_channel : camera.sdchannel;
				camera.hd_channel = camera.hd_channel ? camera.hd_channel : camera.hdchannel;
				/**
				 * 由于camera_type、camera_status两个属性的值都是0、1之类的数字，？表达是在值为0的时候也判断为false，最终的结果可能出现undefined，故调整了空值的判断，
				 * 由于js中的对象均是引用类型使用的，此处判断获取的值会影像到currentCameraData对象的相关属性，在扩展屏播放时会有问题。
				 * by zhangyu on 2015/1/31
				 */
				camera.camera_type = (camera.camera_type !== undefined) ? camera.camera_type : (camera.cameratype !== undefined) ? camera.cameratype : 0;
				camera.camera_status = (camera.camera_status !== undefined) ? camera.camera_status : (camera.status !== undefined) ? camera.status : 0;
				camera.cameraCode = camera.code ? camera.code : camera.cameraCode;
				//判断资源权限 by zhangyu on 2015/2/11
				// if (!pvamapPermission.checkCameraPermissionById(camera.id, "play-real-video-on-map")) {
				// 	return;
				// }
				//zhangyu-temp by zhangyu on 2015/4/7
				PubSub.publishSync("showInfoWindowOnMap1", {
					data: camera,
					sence: "cameraInfo",
					fn: function(){
						//存储当前摄像机的地图标示
						Variable.currentCameraMarker = e;
					}
				});
			}
		};
		scope.showSingleCameraInfoAndPlay = function(e){
			//播放摄像机视频
			if (Variable.currentCameraData) {
				var camera = Variable.currentCameraData;
				camera.sd_channel = camera.sd_channel ? camera.sd_channel : camera.sdchannel;
				camera.hd_channel = camera.hd_channel ? camera.hd_channel : camera.hdchannel;
				/**
				 * 由于camera_type、camera_status两个属性的值都是0、1之类的数字，？表达是在值为0的时候也判断为false，最终的结果可能出现undefined，故调整了空值的判断，
				 * 由于js中的对象均是引用类型使用的，此处判断获取的值会影像到currentCameraData对象的相关属性，在扩展屏播放时会有问题。
				 * by zhangyu on 2015/1/31
				 */
				camera.camera_type = (camera.camera_type !== undefined) ? camera.camera_type : (camera.cameratype !== undefined) ? camera.cameratype : 0;
				camera.camera_status = (camera.camera_status !== undefined) ? camera.camera_status : (camera.status !== undefined) ? camera.status : 0;
				camera.cameraCode = camera.code ? camera.code : camera.cameraCode;
				//判断资源权限 by zhangyu on 2015/2/11
				// if (!pvamapPermission.checkCameraPermissionById(camera.id, "play-real-video-on-map")) {
				// 	return;
				// }
				//zhangyu-temp by zhangyu on 2015/4/7
				PubSub.publishSync("showInfoWindowOnMap1", {
					data: camera,
					sence: "singleCameraInfo",
					fn: function(){
						//存储当前摄像机的地图标示
						Variable.currentCameraMarker = e;
					}
				});
			}
		};
		/**
		 * 在地图信息窗上播放摄像机视频
		 * @param camera - 待播放的摄像机数据
		 */
		scope.playVedioOnMapWin = function (camera) {
			//如果没有播放对象，则初始化
			if (!_g.videoPlayerSigle) {
				//播放视频
				_g.videoPlayerSigle = new VideoPlayer({
					layout: 1,
					uiocx: 'UIOCXMAP'
				});

				document.getElementById("UIOCXMAP").RefreshForGis(100);
				
				//绑定播放窗口的双击事件
				dblclickChange.dblSingleScreen(_g.videoPlayerSigle);
			}
			console.log("控制画面比例",window.ocxDefaultRatio);
			_g.videoPlayerSigle.playerObj.SetRatio(2,-1);
			// 播放视频
			_g.videoPlayerSigle.setFreePath({
				'hdChannel': camera.hd_channel, //高清通道
				'sdChannel': camera.sd_channel, //标清通道
				'cId': camera.id,
				'cName': camera.name,
				'cType': camera.camera_type,
				'cStatus': camera.camera_status //摄像机在线离线状态
			});
			_g.videoPlayerSigle.ptzRedArrow(0);
			if (scope.getCameraTypeAndStatus(camera) === "ballonline") {
				_g.videoPlayerSigle.switchPTZ(true, 0);
			}
			//日志加载
			//logDict.insertLog('m1', 'f1', 'o4', 'b4', camera.name + '摄像机');
			logDict.insertMedialog("m1", "查看" + camera.name+ "实时视频", "", "o4", camera.name);
		};
		/**
		 * 获取摄像机类型和状态
		 * @param camera - 摄像机数据
		 * @returns {string} - 返回摄像机类型
		 */
		scope.getCameraTypeAndStatus = function (camera) {
			var status = 1, type = camera.cameraType ? camera.cameraType : camera.camera_type, isonline = false, hd = camera.hd_channel ? camera.hd_channel : camera.hdchannel, sd = camera.sd_channel ? camera.sd_channel : camera.sdchannel;
			hd.each(function (item) {
				if (item.channel_status === 0) {
					status = 0;
					isonline = true;
				}
			});
			if (!isonline) {
				sd.each(function (item) {
					if (item.channel_status === 0) {
						status = 0;
					}
				});
			}
			if (type) {
				if (status === 0) {
					return "ballonline";
				}
				if (status === 1) {
					return "balloffline";
				}
			} else {
				if (status === 0) {
					return "gunonline";
				}
				if (status === 1) {
					return "gunoffline";
				}
			}
		};
		/**
		 * 将点位数组转换成geoJSON格式
		 * @param pointarr - 点位数组对象
		 * @param type - 数据类型
		 * @returns {*}
		 */
		scope.convertArrayToGeoJson = function (pointarr, type) {
			if (!pointarr || pointarr === null || pointarr === '' || pointarr === 'undefined') {
				return;
			}
			var resultarr = [];
			var arr = [];
			for (var i = 0, j = pointarr.length; i < j; i++) {
				var point = [];
				point.push(pointarr[i].lon ? pointarr[i].lon : pointarr[i][0]);
				point.push(pointarr[i].lat ? pointarr[i].lat : pointarr[i][1]);
				arr.push(point);
			}
			resultarr.push(arr);
			if (type === "LineString") {
				//对于非闭合类型来说，缓冲区坐标少包一层
				resultarr = resultarr[0];
			}
			var result = {
				"type": type,
				"coordinates": resultarr
			};
			return JSON.stringify(result);
		};

		/**
		 * 保留浮点数后n位
		 * @param val - 要转化的值
		 * @param n - 要保留的位数
		 * @returns {*} - 从接入那块取gps 小数后最多6位
		 */
		scope.parseFloat = function (val, n) {
			var value = "" + val;
			var pattern = /^[1-9](\d)*.(\d)*$/;
			if (pattern.test(value)) {
				if (value.indexOf(".") !== -1) {
					var point = value.indexOf(".");
					var tem = value.substring(point + 1);
					if (tem.length > n) {
						tem = tem.substr(0, n);
						return parseFloat(value.substring(0, point + 1) + tem);
					}
				} else {
					return parseInt(value);
				}
			}
			return val;
		};
		/**
		 * 添加自定义业务图层
		 **/
		scope.addBusiLayers = function() {
			//警卫路线全部图层
			Variable.layers.guardRouteAllLayer = new NPMapLib.Layers.OverlayLayer("guard-route-all");
			Variable.map.addLayer(Variable.layers.guardRouteAllLayer);
			//道路搜索图层
			Variable.layers.routeLayer = new NPMapLib.Layers.OverlayLayer("route-layer");
			Variable.map.addLayer(Variable.layers.routeLayer);
			//警卫路线图层
			Variable.layers.guardRouteLayer = new NPMapLib.Layers.OverlayLayer("guard-route-layer");
			Variable.map.addLayer(Variable.layers.guardRouteLayer);
			//防控圈图层
			Variable.layers.defenseCircle = new NPMapLib.Layers.OverlayLayer("defence-circle-layer");
			Variable.map.addLayer(Variable.layers.defenseCircle);
			//我的关注图层
			Variable.layers.myAttentionLayer = new NPMapLib.Layers.OverlayLayer("my-attention-layer");
			Variable.map.addLayer(Variable.layers.myAttentionLayer);
			//电子防线图层
			Variable.layers.defenseLineLayer = new NPMapLib.Layers.OverlayLayer("defenseline-layer");
			Variable.map.addLayer(Variable.layers.defenseLineLayer);
			Variable.layers.defenseLineLayer.setZIndex(200); //解决电子防线区域盖住资源图层的问题。by zhangyu on 2015/6/25
			//标注图层
			Variable.layers.markerLayer = new NPMapLib.Layers.OverlayLayer("marker-layer");
			Variable.map.addLayer(Variable.layers.markerLayer);
			//搜索结果图层
			Variable.layers.searchResultLayer = new NPMapLib.Layers.OverlayLayer("search-result-layer");
			Variable.map.addLayer(Variable.layers.searchResultLayer);
			//视频播放图层
			Variable.layers.resourceShowLayer = new NPMapLib.Layers.OverlayLayer("resource-show-layer");
			Variable.map.addLayer(Variable.layers.resourceShowLayer);
			//GPS车队图层
			Variable.layers.gpsCarLayer = new NPMapLib.Layers.OverlayLayer("gps-car");
			Variable.map.addLayer(Variable.layers.gpsCarLayer);
			// 报警信息显示图层
			Variable.layers.alarmInfo = new NPMapLib.Layers.OverlayLayer("alarm-info")
			Variable.map.addLayer(Variable.layers.alarmInfo);
			//附近搜索中间点图层
			Variable.layers.SearchCenterLayer = new NPMapLib.Layers.OverlayLayer("search-center-layer")
			Variable.map.addLayer(Variable.layers.SearchCenterLayer);
			//全局搜索结果周围资源搜索图层
			Variable.layers.globalSearchRoundLayer = new NPMapLib.Layers.OverlayLayer("global-search-around-layer")
			Variable.map.addLayer(Variable.layers.globalSearchRoundLayer);
			/*// 灯杆资源图层
			Variable.layers.lightbarResourceLayer = new NPMapLib.Layers.OverlayLayer("lightbar-resource-layer");
			Variable.map.addLayer(Variable.layers.lightbarResourceLayer);
			//警车资源图层
			Variable.layers.policeResourceLayer = new NPMapLib.Layers.OverlayLayer("police-resource-layer");
			Variable.map.addLayer(Variable.layers.policeResourceLayer);
			//警员资源图层
			Variable.layers.policemanResourceLayer = new NPMapLib.Layers.OverlayLayer("policeman-resource-layer");
			Variable.map.addLayer(Variable.layers.policemanResourceLayer);*/
			//视野范围内资源图层
			Variable.layers.rangeSearchLayer = new NPMapLib.Layers.OverlayLayer("range-search-layer");
			Variable.map.addLayer(Variable.layers.rangeSearchLayer);
			//道路分析图层
			Variable.layers.routeAnalysisLayer = new NPMapLib.Layers.OverlayLayer("route-analysis-layer");
			Variable.map.addLayer(Variable.layers.routeAnalysisLayer);
			//道路分析资源图层
			Variable.layers.resourceOnRouteLayer = new NPMapLib.Layers.OverlayLayer("resource-route-layer");
			Variable.map.addLayer(Variable.layers.resourceOnRouteLayer);
			//GPS监控图层
			Variable.layers.gpsControlLayer = new NPMapLib.Layers.OverlayLayer("gps-control-layer");
			Variable.map.addLayer(Variable.layers.gpsControlLayer);
			//GPS监控资源图层
			Variable.layers.resourceOnGpsLayer = new NPMapLib.Layers.OverlayLayer("resource-gps-control-layer");
			Variable.map.addLayer(Variable.layers.resourceOnGpsLayer);
			//隐藏业务图层 目的：NPGIS加载过多图层会造成页面比较卡的情况，隐藏图层可缓解这种现象
			scope.hideAllLayers();
		};
		/**
		 * 隐藏资源图层
		 * @author Li Dan
		 * @date   2014-12-15
		 * @return {[type]}   [description]
		 */
		scope.hideResourceLayers = function() {
			try {
				//室内
				Variable.resourceLayers.cluster.setMakrerTypeVisiable("Indoor", false);
				//制高点
				Variable.resourceLayers.cluster.setMakrerTypeVisiable("HiShpomt", false);
				//高架
				Variable.resourceLayers.cluster.setMakrerTypeVisiable("Elevated", false);
				//水面
				Variable.resourceLayers.cluster.setMakrerTypeVisiable("Water", false);
				//路面
				Variable.resourceLayers.cluster.setMakrerTypeVisiable("Ground", false);
			} catch (e) {};
		};
		/**
		 * 显示资源图层
		 * @author Li Dan
		 * @date   2014-12-15
		 * @return {[type]}   [description]
		 */
		scope.showResourceLayers = function() {
			// 显示其他图层
			Variable.resourceLayers.cluster.setMakrerTypeVisiable("Indoor", true);
			//制高点
			Variable.resourceLayers.cluster.setMakrerTypeVisiable("HiShpomt", true);
			//高架
			Variable.resourceLayers.cluster.setMakrerTypeVisiable("Elevated", true);
			//水面
			Variable.resourceLayers.cluster.setMakrerTypeVisiable("Water", true);
			//路面
			Variable.resourceLayers.cluster.setMakrerTypeVisiable("Ground", true);
		};
		/**
		 * 隐藏所有图层
		 * @author Li Dan
		 * @date   2014-12-12
		 * @return {[type]}   [description]
		 */
		scope.hideAllLayers = function() {
			//遍历业务图层并隐藏
			for(var layer in Variable.layers) {
				if(Variable.layers.hasOwnProperty(layer)) {
					Variable.layers[layer].hide();
				}
			}
		};
		/**
		 * 获取提示信息位置
		 **/
		scope.getTooltipPosition = function(evt) {
			var top, left;
			var ie = navigator.userAgent.indexOf("MSIE") > 0;
			/**
			 * 两种情况：
			 * 1、点击全屏时（通过dom元素判断）
			 * 2、地图定位播放时（window.isPointPlay）
			 * @type {boolean}
			 */
			var isFullscreen = (parseInt(jQuery("#major").css("left")) <= 0) ? true : false;
			if (ie) {
				if (isFullscreen) {
					left = parseInt(evt.clientX);
					top = parseInt(evt.clientY - 25);
				} else {
					left = parseInt(evt.clientX - jQuery("#sidebar").width());
					top = parseInt(evt.clientY - (window.isPointPlay ? 25 : 120));
				}
			} else {
				if (isFullscreen) {
					left = parseInt((evt.x ? evt.x : evt.pageX));
					top = parseInt((evt.y ? evt.y : evt.pageY) - 25);
				} else {
					left = parseInt((evt.x ? evt.x : evt.pageX) - jQuery("#sidebar").width());
					top = parseInt((evt.y ? evt.y : evt.pageY) - (window.isPointPlay ? 25 : 120));
				}
			}
			return {
				left: left,
				top: top
			};
		};
		/**
		 * 设置地图中心点
		 **/
		scope.setMapToPoint = function(point) {
			var extent = this.options.map.getExtent();
			if (point.lon > extent.sw.lon && point.lon < extent.ne.lon && point.lat > extent.sw.lat && point.lat < extent.ne.lat) {
				return;
			}
			this.options.map.setCenter(point);
		};
		/**
		 * 通用线样式
		 **/
		scope.polyline = function(points, color) {
			return new NPMapLib.Geometry.Polyline(points, {
				color: color ? color : "#3D71BB", //颜色
				weight: 5, //宽度，以像素为单位
				opacity: 1, //透明度，取值范围0 - 1
				lineStyle: NPMapLib.LINE_TYPE_SOLID //样式
			});
		};
		/**
		 * 将GeoJSON数据转换成NPMAP Point
		 **/
		scope.converGeoJSONToPoints = function(geoJson) {
			var points = [];
			if (geoJson.coordinates[0]) {
				for (var i = 0, j = geoJson.coordinates[0].length; i < j; i++) {
					var point = new NPMapLib.Geometry.Point(geoJson.coordinates[0][i][0], geoJson.coordinates[0][i][1]);
					points.push(point);
				}
			}
			return points;
		};
		/**
		 * 将NPMAP Point转换成GeoJSON数据格式
		 * @author Li Dan
		 * @date   2015-08-12
		 * @param  {[type]}   points [description]
		 * @return {[type]}          [description]
		 */
		scope.convertPointsToGeoJSON = function(points) {
			var data = {
				type: "polylines",
				coordinates: []
			}
			if(points && points.length>0){
				for(var i=0,j=points.length;i<j;i++){
					data.coordinates.push([points[i].lon, points[i].lat]);
				}
			}
			return data;
		};
		/**
		 * 将线段geoJson数据转换成NPMAP Point
		 * @author Li Dan
		 * @date   2015-08-06
		 * @param  {[type]}   geoJson [description]
		 * @return {[type]}           [description]
		 * {"type":"MultiLineString","coordinates":[[[121.47802864626438,31.21194567293662],[121.478085673,31.21183971000005]],[[121.478085673,31.21183971000005],[121.478446824,31.21126015800008]],[[121.478446824,31.21126015800008],[121.478842321,31.21072587600009]]]}
		 */
		scope.convertPolylineGeoJSONToPoints = function(geoJson) {
			var points = [];
			if (geoJson.coordinates) {
				for (var i = 0, j = geoJson.coordinates.length; i < j; i++) {
					for(var m = 0, n = geoJson.coordinates[i].length; m < n; m++) {
						var point = new NPMapLib.Geometry.Point(geoJson.coordinates[i][m][0], geoJson.coordinates[i][m][1]);
						points.push(point);
					}
				}
			}
			return points;
		}
		/**
		 * 根据半径、起始角度计算扇形缓冲区
		 **/
		scope.getPoints = function(center, radius, startAngle, endAngle, pointNum) {
			var sin;
			var cos;
			var x;
			var y;
			var angle;
			var points = new Array();
			points.push(center);
			for (var i = 1; i <= pointNum; i++) {
				angle = startAngle + 45 * i / pointNum;
				sin = Math.sin(angle * Math.PI / 180);
				cos = Math.cos(angle * Math.PI / 180);
				x = center[0] + radius * sin;
				y = center[1] + radius * cos;
				points[i] = [x, y];
			}
			var point = points;
			point.push(center);
			return point;
		};
		/**
		 * 用户点击了左侧资源时，右侧需要显示对应的信息窗，此时根据配置，缩放地图层级并居中点位
		 * @param pt - 待定位的中心点
		 * @param lon - pt为空时有效
		 * @param lat - pt为空时有效
		 */
		scope.centerAndZoomOnShowInfowin = function(pt, lon, lat) {
			//在缩放之前关闭窗口,以解决ocx地图信息窗播放在缩放后关闭造成ocx画面残留的问题，add by zhangyu, 2014-10-31
			window.infowindow && window.infowindow.closeInfoWindow("", "on-open");
			//如果没有点位对象，则根据经纬度生成点位
			if(!pt) {
				pt = new NPMapLib.Geometry.Point(lon, lat);
			}
			//获取地图层级
			var zoom = mapConfig.clcikResMapZoom ? mapConfig.clcikResMapZoom : 0;
			var currZoom = Variable.map.getZoom();
			//设置图层级别和中心点
			if (currZoom > zoom) {
				Variable.map.setCenter(pt);
			} else {
				Variable.map.centerAndZoom(pt, zoom);
			}
		};
		/**
		 * 判断是否在显示报警信息,如果有则隐藏
		 * @param tag - 标记是否要进行清除操作
		 * @constructor
		 */
		scope.IfClickAlarmInfo = function(tag) {
			if ($("#map-tool-right .map-showInfo").is(".show")) {
				//更新显示报警按钮样式
				$("#map-tool-right .map-showInfo").removeClass("active show");
				//图层切换
				tag ? MapOverLayerCtrl.showAndHideOverLayers("click-map-toor-bar-hide-alarm") : "";
			}
		};

		return scope;

	}({}, jQuery, Variable))
});