define([
	// 布防任务设置地图model层
	"/module/protection-monitor/defencesetting/js/model/map-model.js",
	// 布防任务设置公共函数
	"/module/protection-monitor/defencesetting/js/common-fun.js",
	'/module/inspect/dispatch/js/npmap-new/map-const.js',
	"npmapConfig",
	'/module/common/js/player2.js',
	"OpenLayers"
], function(mapModel, CommonFun, MapConst) {
	var mapController = {
		//参数
		options: {
			//地图容器
			mapContainer: null,
			//地图对象
			map: null,
			//基础图层
			baseLayer: null,
			//卫星图层
			satelliteLayer: null,
			//测量工具
			measuretool: null,
			//鹰眼控件
			overviewctrl: null,
			//导航控件
			Navictrl: null,
			//版本控件
			versionCtrl: null,
			//比例尺控件
			scaleCtrl: null,
			//窗口
			infowindow: null,
			//是否全屏
			isFullscreen: false
		},
		//图层
		layers: {
			//地图上播放视频的图层
			cameraVideoLayer: null
		},
		//当前活动的点位信息
		currentCameraMarker: null,
		//标记当前信息窗的样式是否是点位点击模式，此时需要左右切换按钮
		curInfoWinIsMap: true,
		//播放器对象
		videoPlayerSigle: null,
		//资源图层
		resourceLayers: {
			clusterResource: null,
			clusterResourceNum: 0
		},
		//是否已加载摄像机资源
		isLoadedCameras: false,
		//鼠标悬浮到聚合图层上的摄像机时，打开摄像机视频的延时定时器
		playVideoDelayTimer: null,
		//视频延时加载的时间间隔
		delayTimerTimeSpan: 850,
		//当前鼠标移动过程中已经在播放的摄像机位置，为了避免重复加载
		curPlayingVideoInfo: {
			x: 0,
			y: 0
		},
		//当前活动摄像机数据
		currentCameraData: null,
		//图标
		symbols: {
			//标注
			markerSymbol: function () {
				return new NPMapLib.Symbols.Icon("/module/protection-monitor/alarmmgr/images/map-marker-pointer.png", new NPMapLib.Geometry.Size(13, 21));
			}
		},
		initBaseMap: function() {
			var layer = null,
				self = this,
				options = self.options,
				layers = [];

			// 地图容器赋值
			self.options.mapContainer = document.getElementById("defence-setting-mapId");
			//初始化地图
			options.map = mapConfig.initMap(options.mapContainer);
			// if (mapConfig.baselayer) {
			// 	layer = mapConfig.initLayer(mapConfig.baselayer, "baselayer");
			// 	layers.push(layer[0]);
			// 	if (layer.length === 2) {
			// 		layers.push(layer[1]);
			// 	}
			// }

			// if (mapConfig.satelliteLayer) {
			// 	layer = mapConfig.initLayer(mapConfig.satelliteLayer, "satelliteLayer");
			// 	layers.push(layer[0]);
			// 	if (layer.length === 2) {
			// 		layers.push(layer[1]);
			// 	}
			// }
			// //加载基础图层
			// options.map.addLayers(layers);
			//鹰眼
			options.overviewctrl = new NPMapLib.Controls.OverviewControl();
			options.map.addControl(options.overviewctrl);
			options.overviewctrl.changeView(false);
			//导航
			options.Navictrl = new NPMapLib.Controls.NavigationControl({navigationType:'netposa'});
			options.map.addControl(options.Navictrl);
			//比例尺
			options.scaleCtrl = new NPMapLib.Controls.ScaleControl();
			options.map.addControl(options.scaleCtrl);
			//绘制工具初始化
			options.drawtool = new NPMapLib.Tools.DrawingTool(options.map.id);
			//测量工具
			options.measuretool = new NPMapLib.Tools.MeasureTool(options.map.id, {
				lengthUnit: NPMapLib.MAP_UNITS_METERS, //长度单位
				areaUnit: NPMapLib.MAP_UNITS_SQUARE_KILOMETERS,	//面积单位
				mode: NPMapLib.MEASURE_MODE_DISTANCE //测量模式
			});
			options.measuretool.startUp();
			//添加鼠标缩放时的动画,四个角
			var zoomAnimation = new NPMapLib.Controls.zoomAnimationControl();
			options.map.addControl(zoomAnimation);
			//鼠标样式
			options.map.addHandStyle();
			//地图拖拽
			options.map.addEventListener(NPMapLib.MAP_EVENT_DRAGGING, function (e) {
				if (options.infowindow) {
					if (self.videoPlayerSigle) {
						self.videoPlayerSigle.refreshWindow(0);
					}
				}
			});
			//地图拖拽开始
			options.map.addEventListener(NPMapLib.MAP_EVENT_DRAG_START, function (e) {
				if (options.infowindow) {
					if (self.videoPlayerSigle) {
						options.infowindow.hide();
					}
				}
			});
			//地图拖拽结束
			options.map.addEventListener(NPMapLib.MAP_EVENT_DRAG_END, function (e) {
				if (options.infowindow) {
					if (self.videoPlayerSigle) {
						options.infowindow.show();
						self.videoPlayerSigle.refreshWindow(0);
					}
				}
			});
			//地图缩放结束
			options.map.addEventListener(NPMapLib.MAP_EVENT_ZOOM_END, function (e) {
				if (options.infowindow) {
					if (self.videoPlayerSigle) {
						self.videoPlayerSigle.refreshWindow(0);
					}
				}
			});

			//视频播放图层
			self.layers.cameraVideoLayer = new NPMapLib.Layers.OverlayLayer("camera-video-layer");
			options.map.addLayer(self.layers.cameraVideoLayer);
		},
		/**
		 * 获取摄像机信息
		 **/
		loadResourceCameras: function () {
			var self = this;
			var images = [MapConst.mapIcon.camera.cluster["1"].img, MapConst.mapIcon.camera.cluster["2"].img, MapConst.mapIcon.camera.cluster["3"].img, MapConst.mapIcon.camera.cluster["4"].img];
			for (var m = 0, n = images.length; m < n; m++) {
				new Image().src = images[m];
			}
			//获取室内摄像机
			mapModel.getCameraByType({ type: 1 }).then(function(res){
				if (res.code === 200) {
					self.clusterResource("Indoor", res.data.cameras);
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取室内摄像机异常！");
				}
			});
		
			//获取制高点摄像机
			mapModel.getCameraByType({ type: 2 }).then(function(res){
				if (res.code === 200) {
					self.clusterResource("HiShpomt", res.data.cameras);
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取室内摄像机异常！");
				}
			});
	
			//获取高架摄像机
			mapModel.getCameraByType({ type: 3 }).then(function(res){
				if (res.code === 200) {
					self.clusterResource("Elevated", res.data.cameras);
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取室内摄像机异常！");
				}
			});
	
			//获取水面摄像机
			mapModel.getCameraByType({ type: 4 }).then(function(res){
				if (res.code === 200) {
					self.clusterResource("Water", res.data.cameras);
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取室内摄像机异常！");
				}
			});
			//获取路面摄像机
			mapModel.getCameraByType({ type: 5 }).then(function(res){
				if (res.code === 200) {
					self.clusterResource("Ground", res.data.cameras);
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取室内摄像机异常！");
				}
			});
		},
		/**
		 * 聚合图层上的摄像机权限判断
		 * 同步左侧资源树与地图上摄像机的权限图标样式，add by zhangyu on 2015/2/2
		 * @param cameraScore - 摄像机的权限分值
		 * @returns {boolean} - 是否拥有该摄像机的权限
		 */
		getCameraPermission: function(cameraScore) {
			//获取当前用户的权限分值
			var userScore = parseInt(jQuery("#userEntry").data("score"), 10);
			//返回当前用户是否对该摄像机拥有权限
			return (userScore >= cameraScore);
		},
		/**
		 * 聚合资源
		 * @type: 摄像机类型
		 * @datas: 摄像机列表数据
		 **/
		clusterResource: function (type, datas) {
			if (!datas) {
				return;
			}
			var self = this;
			var points = [];
			var opts = {
				markType: type
			};
			for (var i = 0, j = datas.length; i < j; i++) {
				var data = jQuery.extend({}, datas[i], {
					lon: datas[i].longitude,
					lat: datas[i].latitude
				});
				var p = new NPMapLib.Symbols.ClusterMarker(data, opts);
				points.push(p);
			}
			var opt = {
				getUrl: function (count, camera) {
					if (count > 1 && count < 100) {
						return MapConst.mapIcon.camera.cluster["1"].img;
					} else if (count > 99 && count < 1000) {
						return MapConst.mapIcon.camera.cluster["2"].img;
					} else if (count > 999 && count < 10000) {
						return MapConst.mapIcon.camera.cluster["3"].img;
					} else if (count > 9999 && count < 100000) {
						return MapConst.mapIcon.camera.cluster["4"].img;
					} else {
						if (camera) {
							var type = camera.getData().cameraType, isonline = camera.getData().isOnline, hdsdType = camera.getData().hdsdType, score = camera.getData().score;
							if (type) {
								if (hdsdType === 1) {
									if (isonline === null || isonline === 1) {
										return (self.getCameraPermission(score)) ? MapConst.mapIcon.camera.res["1110"] : MapConst.mapIcon.camera.res["11"];
									}
									if (isonline === 0) {
										return (self.getCameraPermission(score)) ? MapConst.mapIcon.camera.res["1010"] : MapConst.mapIcon.camera.res["10"];
									}
								} else {
									if (isonline === null || isonline === 1) {
										return (self.getCameraPermission(score)) ? MapConst.mapIcon.camera.res["1100"] : MapConst.mapIcon.camera.res["11"];
									}
									if (isonline === 0) {
										return (self.getCameraPermission(score)) ? MapConst.mapIcon.camera.res["1000"] : MapConst.mapIcon.camera.res["10"];
									}
								}
							} else {
								if (hdsdType === 1) {
									if (isonline === null || isonline === 1) {
										return (self.getCameraPermission(score)) ? MapConst.mapIcon.camera.res["0110"] : MapConst.mapIcon.camera.res["01"];
									}
									if (isonline === 0) {
										return (self.getCameraPermission(score)) ? MapConst.mapIcon.camera.res["0010"] : MapConst.mapIcon.camera.res["00"];
									}
								} else {
									if (isonline === null || isonline === 1) {
										return (self.getCameraPermission(score)) ? MapConst.mapIcon.camera.res["0100"] : MapConst.mapIcon.camera.res["01"];
									}
									if (isonline === 0) {
										return (self.getCameraPermission(score)) ? MapConst.mapIcon.camera.res["0000"] : MapConst.mapIcon.camera.res["00"];
									}
								}
							}
						} else {
							return MapConst.mapIcon.camera.res["0000"];
						}
					}
				},
				//-npgis V1.0.0.7 设置聚合图标大小-add by zhangyu,2014-10-23
				getImageSize: function (count, camera) {
					if (count > 1 && count < 100) {
						return MapConst.mapIcon.camera.cluster["1"].size;
					} else if (count > 99 && count < 1000) {
						return MapConst.mapIcon.camera.cluster["2"].size;
					} else if (count > 999 && count < 10000) {
						return MapConst.mapIcon.camera.cluster["3"].size;
					} else if (count > 9999 && count < 100000) {
						return MapConst.mapIcon.camera.cluster["4"].size;
					} else {
						return MapConst.mapIcon.camera.res["smallSize"];
					}
				},
				clusterClickModel: mapConfig.clusterMarkerConfig.clusterClickModel,
				maxZoom: mapConfig.clusterMarkerConfig.maxZoom,
				distance: mapConfig.clusterMarkerConfig.distance,
				fontColor: MapConst.mapIcon.camera.cluster["fontColor"],
				labelYOffset: (/msie/.test(navigator.userAgent.toLowerCase())) ? MapConst.mapIcon.camera.cluster["labelYOffsetIE"] : MapConst.mapIcon.camera.cluster["labelYOffset"],
				click: function (e) {},
				mouseover: function (e, isCluster) {
					if (e.getData().longitude !== parseFloat(self.curPlayingVideoInfo.x) || e.getData().latitude !== parseFloat(self.curPlayingVideoInfo.y)) {
						if (self.playVideoDelayTimer) {
							clearTimeout(self.playVideoDelayTimer);
						}
						self.playVideoDelayTimer = setTimeout(function () {
							//当前活动标注赋值
							self.currentCameraData = e.location;
							var id = self.currentCameraData.id,
								// 这里调用view模块的showMapCameraInfo方法，因为产生了循环依赖，故此处手动引入view模块
								view = require('/module/protection-monitor/defencesetting/js/view/defence/first-pva-map-view.js');
							//如果已经获取到数据
							if (self.currentCameraData.isLoadedData) {
								//显示摄像机
								view.showMapCameraInfo(id);
							} else {
								mapModel.accessChannels({id:id}).then(function(res){
									if (res.code === 200) {
										self.currentCameraData = jQuery.extend({}, res.data.cameraInfo, e.getData());
										self.currentCameraData = jQuery.extend({}, self.currentCameraData, {
											isLoadedData: true
										});
										e.location = self.currentCameraData;
										//显示摄像机
										view.showMapCameraInfo(id);
									} else if (res.code === 500) {
										notify.error(res.data.message);
									} else {
										notify.error("获取数据异常！");
									}
								});
							}
						}, self.delayTimerTimeSpan);
					}

					//有摄像机权限才进行切换
					if (!self.getCameraPermission(e.getData().score)) {
						return;
					}

					if (!isCluster) {
						//变换图片
						var type = e.getData().cameraType, isonline = e.getData().isOnline, hdsdType = e.getData().hdsdType;
						if (type) {
							if (isonline === 0) {
								if (hdsdType) imgURL = MapConst.mapIcon.camera.res["1011"]; else imgURL = MapConst.mapIcon.camera.res["1001"];
							}
							if (isonline === 1 || isonline === null) {
								if (hdsdType) imgURL = MapConst.mapIcon.camera.res["1111"]; else imgURL = MapConst.mapIcon.camera.res["1101"];
							}
						} else {
							if (isonline === 0) {
								if (hdsdType) imgURL = MapConst.mapIcon.camera.res["0011"]; else imgURL = MapConst.mapIcon.camera.res["0001"];
							}
							if (isonline === 1 || isonline === null) {
								if (hdsdType) imgURL = MapConst.mapIcon.camera.res["0111"]; else imgURL = MapConst.mapIcon.camera.res["0101"];
							}
						}
						var style = {
							fontSize: MapConst.mapIcon.camera.cluster["fontSize"],
							externalGraphic: imgURL,
							graphicWidth: MapConst.mapIcon.camera.res["bigSize"].width,
							graphicHeight: MapConst.mapIcon.camera.res["bigSize"].height
						}
						e.changeStyle(style, true);
					}
				},
				mouseout: function (e, isCluster) {
					if (self.playVideoDelayTimer) {
						clearTimeout(self.playVideoDelayTimer);
					}

					//有摄像机权限才进行切换
					if (!self.getCameraPermission(e.getData().score)) {
						return;
					}
					
					if (!isCluster) {
						//变换图片
						var type = e.getData().cameraType, isonline = e.getData().isOnline, hdsdType = e.getData().hdsdType;
						if (type) {
							if (isonline === 0) {
								if (hdsdType) imgURL = MapConst.mapIcon.camera.res["1010"]; else imgURL = MapConst.mapIcon.camera.res["1000"];
							}
							if (isonline === 1 || isonline === null) {
								if (hdsdType) imgURL = MapConst.mapIcon.camera.res["1110"]; else imgURL = MapConst.mapIcon.camera.res["1100"];
							}
						} else {
							if (isonline === 0) {
								if (hdsdType) imgURL = MapConst.mapIcon.camera.res["0010"]; else imgURL = MapConst.mapIcon.camera.res["0000"];
							}
							if (isonline === 1 || isonline === null) {
								if (hdsdType) imgURL = MapConst.mapIcon.camera.res["0110"]; else imgURL = MapConst.mapIcon.camera.res["0100"];
							}
						}
						var style = {
							fontSize: MapConst.mapIcon.camera.cluster["fontSize"],
							externalGraphic: imgURL,
							graphicWidth: MapConst.mapIcon.camera.res["smallSize"].width,
							graphicHeight: MapConst.mapIcon.camera.res["smallSize"].height
						}
						e.changeStyle(style, true);
					}
				},
				isAsynchronous: mapConfig.clusterMarkerConfig.isAsynchronous["camera"]
			};
			if (!self.resourceLayers.clusterResource) {
				self.resourceLayers.clusterResource = {};
			}
			if (!self.resourceLayers.clusterResourceNum) {
				self.resourceLayers.clusterResourceNum = 1;
			}
			self.resourceLayers.clusterResourceNum += 1;
			self.resourceLayers.clusterResource[type] = points;
			if (self.resourceLayers.clusterResourceNum == 6) {
				self.isLoadedCameras = true;
				var allList = [];
				for (var k in self.resourceLayers.clusterResource) {
					for (var i = 0; i < self.resourceLayers.clusterResource[k].length; i++) {
						allList.push(self.resourceLayers.clusterResource[k][i]);
					}
				}
				self.resourceLayers.cluster = new NPMapLib.Layers.OverlayLayer('cluster', true, opt);
				self.options.map.addLayer(self.resourceLayers.cluster);
				var clusterPoints = new NPMapLib.Symbols.ClusterPoints(allList);
				self.resourceLayers.cluster.addOverlay(clusterPoints);
				allList = null;
				points = null;
				self.resourceLayers.clusterResource["Indoor"] = null;
				self.resourceLayers.clusterResource["HiShpomt"] = null;
				self.resourceLayers.clusterResource["Elevated"] = null;
				self.resourceLayers.clusterResource["Water"] = null;
				self.resourceLayers.clusterResource["Ground"] = null;
			}
		},
		formatCameraData: function(camera) {
			if (!camera) {
				return false;
			}

			var keyMap = {
				"sd_channel"    : "sdchannel",
				"hd_channel"    : "hdchannel",
				"camera_type"   : "cameratype",
				"camera_status" : "status",
				"cameraCode"    : "cameracode"
			};

			for (var key in keyMap) {
				if (keyMap.hasOwnProperty(key)) {
					camera[key] = camera[key] ? camera[key] : camera[keyMap[key]];
				}
			}

			return camera;
		},
		setParamsBeforePlay: function(camearaData) {
			var 
				self = this,
				// 检测要不要缩放地图，以使播放效果达到最佳。如果点击的是左侧摄像机树，则可能会执行缩放
				pt = new NPMapLib.Geometry.Point(camearaData.lon, camearaData.lat),
				zoom = mapConfig.clcikResMapZoom ? mapConfig.clcikResMapZoom : 0;
				currZoom = self.options.map.getZoom();

			//设置图层级别和中心点
			if (currZoom > zoom) {
				self.options.map.setCenter(pt);
			} else {
				self.options.map.centerAndZoom(pt, zoom);
			}

			//清空之前的覆盖物
			self.layers.cameraVideoLayer.removeAllOverlays();
			//显示图标
			var marker = new NPMapLib.Symbols.Marker(pt);
			//marker.setIcon(self.symbols.markerSymbol());
			marker.setData(camearaData);
			self.layers.cameraVideoLayer.addOverlay(marker);
			//存储当前的活跃点位信息
			self.currentCameraMarker = marker;
		},
		/**
		 * 获取摄像机类型和状态
		 * @param camera - 摄像机数据
		 * @returns {string} - 获取的信息
		 */
		getCameraTypeAndStatus: function (camera) {
			var status = 1, type = camera.cameraType ? camera.cameraType : camera.camera_type, isonline = false, hd = camera.hd_channel ? camera.hd_channel : camera.hdchannel, sd = camera.sd_channel ? camera.sd_channel : camera.sdchannel;
			hd.each(function (item, index) {
				if (item.channel_status === 0) {
					status = 0;
					isonline = true;
				}
			});
			if (!isonline) {
				sd.each(function (item, index) {
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
		},
		/**
		 * [playVideo 地图上播放视频的方法]
		 * @param  {[type]} camera [摄像机数据]
		 * @return {[type]}        [description]
		 */
		playVideo: function(camera) {
			var self = this;
			//如果没有播放对象，则初始化
			if (!self.videoPlayerSigle) {
				//播放视频
				self.videoPlayerSigle = new VideoPlayer({
					layout: 1,
					uiocx: 'UIOCXMAP'
				});
				document.getElementById('UIOCXMAP').RefreshForGis(100);
			}
			setTimeout(function () {
				// 播放视频
				self.videoPlayerSigle.setFreePath({
					'hdChannel': Array.clone(camera.hd_channel), //高清通道
					'sdChannel': Array.clone(camera.sd_channel), //标清通道
					'cId': camera.id,
					'cName': camera.name,
					'cType': camera.camera_type,
					'cStatus': camera.camera_status //摄像机在线离线状态
				});
				if (self.getCameraTypeAndStatus(camera) === "ballonline") {
					self.videoPlayerSigle.switchPTZ(true, 0);
				}
				//添加日志
				CommonFun.insertLog("real-video", {
					name: camera.name
				});
			}, 1000);
		},
		/**
		 * 释放播放器资源
		 */
		clearVideoPlayer: function() {
			if (this.videoPlayerSigle) {
				this.videoPlayerSigle.stop(false, 0);
				this.videoPlayerSigle = null;
			}
		}
	};

	return mapController;
});