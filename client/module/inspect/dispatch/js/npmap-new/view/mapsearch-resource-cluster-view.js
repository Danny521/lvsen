/**
 * Created by Zhangyu on 2015/5/12.
 */
define([
	"js/npmap-new/controller/mapsearch-common-fun",
	"js/npmap-new/map-common",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-const",
	"jquery",
	"pubsub",
	"npmapConfig"
], function (SearchCommon, MapCommon, Variable, MapConst, jQuery, PubSub) {

	return (function (scope, $) {

		var /**
			 * 获取聚合图片
			 * @param count - 当前数据量，依据数据量显示聚合图片
			 * @param data - 资源点位数据
			 * @param type - 资源点位数据类型
			 * @returns {string} - 图标
			 * @private
			 */
			_getImages = function(count, data, type) {
				if (count > 1 && count < 100) {
					return MapConst.mapIcon[type].cluster["1"].img;
				} else if (count > 99 && count < 1000) {
					return MapConst.mapIcon[type].cluster["2"].img;
				} else if (count > 999 && count < 10000) {
					return MapConst.mapIcon[type].cluster["3"].img;
				} else if (count > 9999 && count < 100000) {
					return MapConst.mapIcon[type].cluster["4"].img;
				} else {
					if (data) {
						//根据资源类型获取资源在地图上显示的图片
						return MapConst.mapIcon[type].res["small"].img;
					}
				}
			},
			/**
			 * 获取图片大小
		     * @param count - 当前数据量，依据数据量显示聚合图片
			 * @param data - 资源点位数据，暂预留
			 * @param type - 资源点位数据类型
			 * @returns {{width: number, height: number}} - 图片大小
			 * @private
			 */
			_getImageSize = function(count, data, type) {
				if (count > 1 && count < 100) {
					return MapConst.mapIcon[type].cluster["1"].size;
				} else if (count > 99 && count < 1000) {
					return MapConst.mapIcon[type].cluster["2"].size;
				} else if (count > 999 && count < 10000) {
					return MapConst.mapIcon[type].cluster["3"].size;
				} else if (count > 9999 && count < 100000) {
					return MapConst.mapIcon[type].cluster["4"].size;
				} else {
					return MapConst.mapIcon[type].res["small"].size;
				}
			},
			/**
			 * 资源点位的点击事件
			 * @param mark - 当前点位对象
			 * @private
			 */
			_clickResMarker = function(mark) {
				//如果当前摄像机点位已经被选中，则不再进行图标刷新
				if (mark.getData().feature.geometry.x === Variable.lastClickData.longitude && mark.getData().feature.geometry.y === Variable.lastClickData.latitude) {
					return;
				}
				//记录当前点击数据
				Variable.currentCameraData = mark.getData();
				//触发释放警力调度/全景上下文(left-right-handler.js)
				PubSub.publish("releaseFullviewSchedule");
				//点击地图上的摄像机资源时，缩放地图层级并居中该点
				MapCommon.centerAndZoomOnShowInfowin(null, Variable.currentCameraData.longitude || Variable.currentCameraData.lon, Variable.currentCameraData.latitude || Variable.currentCameraData.lat);
				//显示信息窗口
				PubSub.publishSync("showInfoWindowOnMap1", {
					data: mark.getData(),
					sence: "",
					fn: function(){
						//设置当前活动摄像机标注
						Variable.currentCameraMarker = mark;
					}
				});
			},
			/**
			 * 鼠标移入地图资源点位事件
			 * @param mark - 地图点位对象
			 * @param isCluster - 是否是聚合点
			 * @private
			 */
			_mouseOverResMarker = function(mark, isCluster) {
				//如果是聚合点，则不需要刷新图标
				if (isCluster) {
					return;
				}
				//如果当前摄像机点位已经被选中，则不再进行图标刷新
				if (mark.getData().feature.geometry.x === Variable.lastClickData.longitude && mark.getData().feature.geometry.y === Variable.lastClickData.latitude) {
					return;
				}
				//刷新图标
				var style = {
					fontSize: MapConst.mapIcon[mark.getData().type].cluster["fontSize"],
					externalGraphic: MapConst.mapIcon[mark.getData().type].res["big"].img,
					graphicWidth: MapConst.mapIcon[mark.getData().type].res["big"].size.width,
					graphicHeight: MapConst.mapIcon[mark.getData().type].res["big"].size.height
				};
				mark.changeStyle(style, true);
			},
			/**
			 * 鼠标移出地图资源点位事件
			 * @param mark - 地图点位对象
			 * @param isCluster - 是否是聚合点
			 * @private
			 */
			_mouseOutResMarker = function(mark, isCluster) {
				//如果是聚合点，则不需要刷新图标
				if (isCluster) {
					return;
				}
				//如果当前摄像机点位已经被选中，则不再进行图标刷新
				if (mark.getData().feature.geometry.x === Variable.lastClickData.longitude && mark.getData().feature.geometry.y === Variable.lastClickData.latitude) {
					return;
				}
				//刷新图标
				var style = {
					fontSize: MapConst.mapIcon[mark.getData().type].cluster["fontSize"],
					externalGraphic: MapConst.mapIcon[mark.getData().type].res["small"].img,
					graphicWidth: MapConst.mapIcon[mark.getData().type].res["small"].size.width,
					graphicHeight: MapConst.mapIcon[mark.getData().type].res["small"].size.height
				};
				mark.changeStyle(style, true);
			},
			/**
			 * 创建资源点位的聚合图层
			 * @param clusterPoints - 聚合图层点位数据
			 * @param type - 类型
			 * @private
			 */
			_showResourceMarkerOnMapLayer = function(clusterPoints, type) {
				var layerName = "";
				if (type === "lightbar") {
					layerName = "lightbar-resource-layer";
				} else if (type === "gps") {
					layerName = "police-resource-layer";
				} else if (type === "350M") {
					layerName = "policeman-resource-layer";
				}
				//清除已有的数据
				var preLayer = window.map.getLayerByName(layerName);
				if (preLayer) {
					preLayer.removeAllOverlays();
				} else {
					//聚合图层点位配置信息
					var opt = {
						getUrl: function(count, data) {
							return _getImages(count, data, type);
						},
						getImageSize: function(count, data) {
							return _getImageSize(count, data, type);
						},
						clusterClickModel: mapConfig.clusterMarkerConfig.clusterClickModel,
						maxZoom: mapConfig.clusterMarkerConfig.maxZoom,
						distance: mapConfig.clusterMarkerConfig.distance,
						fontColor: MapConst.mapIcon[type].cluster["fontColor"],
						fontSize: MapConst.mapIcon[type].cluster["fontSize"],
						labelYOffset: (/msie/.test(navigator.userAgent.toLowerCase())) ? MapConst.mapIcon[type].cluster["labelYOffsetIE"] : MapConst.mapIcon[type].cluster["labelYOffset"],
						mouseover: _mouseOverResMarker,
						click: _clickResMarker,
						mouseout: _mouseOutResMarker,
						isAsynchronous: mapConfig.clusterMarkerConfig.isAsynchronous[type]
					};
					//如果是警力聚合图层，则需要特殊处理，沧州、蚌埠项目有效
					if(type === "gps") {
						$.extend(opt, {
							getContent: function (f) {
								if (type === "gps") {
									return (!f.data.location.lprVale || f.data.location.lprVale === "") ? "暂无车牌" : f.data.location.lprVale;
								} else {
									return "";
								}
							},
							customLabelFontColor: "#000",
							customFontSize: 14,
							customLabelOffset: ((/msie/.test(navigator.userAgent.toLowerCase())) ? MapConst.mapIcon[type].res.cusLabelYOffsetIE : MapConst.mapIcon[type].res.cusLabelYOffset)
						});
					}
					//添加聚合图层
					preLayer = new NPMapLib.Layers.OverlayLayer(layerName, true, opt);
					Variable.map.addLayer(preLayer);
					//改变资源图层层级
					preLayer.setZIndex((type === "lightbar") ? 310 : (type === "gps") ? 360 : 410);
				}
				//添加聚合点位
				preLayer.addOverlay(clusterPoints);
			};

		/**
		 * 以聚合的方式显示灯杆、警车、警员资源
		 * @param datas - 待展现的资源数据
		 * @param type - 待展现的资源数据的类型
		 */
		scope.loadResourceCluster = function(datas, type) {
			if (!datas) {
				return;
			}
			//遍历数据，收集聚合点位
			var points = [];
			for (var i = 0, j = datas.length; i < j; i++) {
				points.push(new NPMapLib.Symbols.ClusterMarker($.extend(datas[i],{
					lon: datas[i].longitude,
					lat: datas[i].latitude,
					markerType: "resource-marker"
				})));
			}
			//添加聚合点位
			var clusterPoints = new NPMapLib.Symbols.ClusterPoints(points);
			//创建聚合图层
			_showResourceMarkerOnMapLayer(clusterPoints, type);
		};

		return scope;

	}({}, jQuery));

});