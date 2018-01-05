/**
 * 布控任务管理地图交互部分controller
 */
define([
	'js/view/control-mgr-view',
	'js/view/control-mgr-map-view',
	'/module/inspect/dispatch/js/npmap-new/map-const.js',
	'js/model/preventcontrol-model',
	'js/preventcontrol-global-var',
	'pubsub',
	'permission'
	],function(controlMgrView,mapView,MapConst,ajaxService,globalVar,PubSub){
	var Controller = function(){};
	Controller.prototype = {
		options: {
			//地图对象
			map: null,
			//鹰眼对象
			overviewctrl: null,
			//导航控件
			Navictrl: null,
			//测距工具
			measuretool: null,
			//摄像机图层
			cameraLayer: null
		},
		//资源图层
		resourceLayers: {
			clusterResource: null,
			clusterResourceNum: 0
		},
		//是否已加载摄像机资源
		isLoadedCameras: false,
		//视频延时加载的时间间隔
		delayTimerTimeSpan: 850,
		//鼠标悬浮到聚合图层上的摄像机时，打开摄像机视频的延时定时器
		playVideoDelayTimer: null,
		//当前鼠标移动过程中已经在播放的摄像机位置，为了避免重复加载
		curPlayingVideoInfo: {
			x: 0,
			y: 0
		},
		//当前活动摄像机数据
		currentCameraData: null,
		//OCX DOM元素
		ocxDom: null,
		//初始化
		init: function(){
			var self = this;
			//初始化mapView
			mapView.init();
			//订阅事件
			PubSub.subscribe("controlSourceLayer",function(msg,param){self.controlSourceLayer(msg,param)});
			PubSub.subscribe("rectSelectCameras",function(){self.rectSelectCameras()});
			PubSub.subscribe("hideResourceLayers",function(){self.hideResourceLayers()});
		},
		//地图初始化
		initMap: function() {
			var self = this;
			//初始化地图
			this.options.map = globalVar.map = mapConfig.initMap(document.getElementById("mapId"), "prevent-control");
			/*//加图层
			var layers = [];
			if (mapConfig.baselayer) {
				var layer = mapConfig.initLayer(mapConfig.baselayer, "baselayer");
				layers.push(layer[0]);
				if (layer.length === 2) {
					layers.push(layer[1]);
				}
			}
			//加载基础图层
			this.options.map.addLayers(layers);*/
			//鹰眼
			this.options.overviewctrl = new NPMapLib.Controls.OverviewControl();
			this.options.map.addControl(this.options.overviewctrl);
			//导航
			this.options.Navictrl = new NPMapLib.Controls.NavigationControl({navigationType:'netposa'});
			this.options.map.addControl(this.options.Navictrl);
			//测量工具
			this.options.measuretool = globalVar.measuretool =new NPMapLib.Tools.MeasureTool(this.options.map.id, {
				lengthUnit: NPMapLib.MAP_UNITS_METERS, //长度单位
				areaUnit: NPMapLib.MAP_UNITS_SQUARE_KILOMETERS, //面积单位
				mode: NPMapLib.MEASURE_MODE_DISTANCE //测量模式
			});
			this.options.measuretool.startUp();
			//绘制工具初始化
			this.options.drawtool = new NPMapLib.Tools.DrawingTool(this.options.map.id);
			//添加鼠标缩放时的动画,四个角
			var zoomAnimation = new NPMapLib.Controls.zoomAnimationControl();
			this.options.map.addControl(zoomAnimation);
			//鼠标样式
			this.options.map.addHandStyle();
			//地图拖拽
			this.options.map.addEventListener(NPMapLib.MAP_EVENT_DRAGGING, function(e) {
				if (globalVar.infowindow) {
					if (globalVar.videoPlayerSigle) {
						// globalVar.videoPlayerSigle.refreshWindow(0);
					}
				}
			});
			//地图拖拽开始
			this.options.map.addEventListener(NPMapLib.MAP_EVENT_DRAG_START, function(e) {
				if (globalVar.infowindow) {
					if (globalVar.videoPlayerSigle) {
						globalVar.infowindow.hide();
					}
				}
			});
			//地图拖拽结束
			this.options.map.addEventListener(NPMapLib.MAP_EVENT_DRAG_END, function(e) {
				if (globalVar.infowindow) {
					if (globalVar.videoPlayerSigle) {
						globalVar.infowindow.show();
						// globalVar.videoPlayerSigle.refreshWindow(0);
					}
				}
			});
			//地图缩放结束
			this.options.map.addEventListener(NPMapLib.MAP_EVENT_ZOOM_END, function(e) {
				if (globalVar.infowindow) {
					if (globalVar.videoPlayerSigle) {
						// globalVar.videoPlayerSigle.refreshWindow(0);
					}
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
		clusterResource: function(type, datas) {
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
				getUrl: function(count, camera) {
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
							var type = camera.getData().cameraType,
								isonline = camera.getData().isOnline,
								hdsdType = camera.getData().hdsdType,
								score = camera.getData().score;

							if (type) {
								//球机
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
								//枪击
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
				getImageSize: function(count, camera) {
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
				mouseover: function(e, isCluster) {
					if (e.getData().longitude !== parseFloat(self.curPlayingVideoInfo.x) || e.getData().latitude !== parseFloat(self.curPlayingVideoInfo.y)) {
						if (self.playVideoDelayTimer) {
							clearTimeout(self.playVideoDelayTimer);
						}
						self.playVideoDelayTimer = setTimeout(function() {
							//当前活动标注赋值
							self.currentCameraData = e.location;
							var id = self.currentCameraData.id;
							//如果已经获取到数据
							if (self.currentCameraData.isLoadedData) {
								//显示摄像机
								self.showMapCameraInfo();
							} else {
								var data = {id:id};
								ajaxService.ajaxEvents.getCameraInfoById(data, function(res) {
									if (res.code === 200) {
										self.currentCameraData = jQuery.extend({}, res.data.cameraInfo, e.getData());
										self.currentCameraData = jQuery.extend({}, self.currentCameraData, {
											isLoadedData: true
										});
										e.location = self.currentCameraData;
										//显示摄像机
										self.showMapCameraInfo();
									} else if (res.code === 500) {
										notify.error(res.data.message);
									} else {
										notify.error("获取数据异常！");
									}
								}, function() {
									notify.error("获取摄像机信息失败,请查看网络状况！");
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
						var type = e.getData().cameraType,
							isonline = e.getData().isOnline,
							hdsdType = e.getData().hdsdType;
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
							graphicWidth: MapConst.mapIcon.camera.res["bigSize"].width,
							graphicHeight: MapConst.mapIcon.camera.res["bigSize"].height
						}
						e.changeStyle(style, true);
					}
				},
				mouseout: function(e, isCluster) {
					if (self.playVideoDelayTimer) {
						clearTimeout(self.playVideoDelayTimer);
					}
					//有摄像机权限才进行切换
					if (!self.getCameraPermission(e.getData().score)) {
						return;
					}
					if (!isCluster) {
						//变换图片
						var type = e.getData().cameraType,
							isonline = e.getData().isOnline,
							hdsdType = e.getData().hdsdType;
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
							graphicWidth: MapConst.mapIcon.camera.res["smallSize"].width,
							graphicHeight: MapConst.mapIcon.camera.res["smallSize"].height
						}
						e.changeStyle(style, true);
					}
				},
				isAsynchronous: mapConfig.clusterMarkerConfig.isAsynchronous["camera"]
			};
			if (!this.resourceLayers.clusterResource) {
				this.resourceLayers.clusterResource = {};
			}
			if (!this.resourceLayers.clusterResourceNum) {
				this.resourceLayers.clusterResourceNum = 1;
			}
			this.resourceLayers.clusterResourceNum += 1;
			this.resourceLayers.clusterResource[type] = points;
			if (this.resourceLayers.clusterResourceNum == 6) {
				self.isLoadedCameras = true;
				var allList = [];
				for (var k in this.resourceLayers.clusterResource) {
					for (var i = 0; i < this.resourceLayers.clusterResource[k].length; i++) {
						allList.push(this.resourceLayers.clusterResource[k][i]);
					}
				}
				this.resourceLayers.cluster = new NPMapLib.Layers.OverlayLayer('cluster', true, opt);
				globalVar.map.addLayer(this.resourceLayers.cluster);
				var clusterPoints = new NPMapLib.Symbols.ClusterPoints(allList);
				this.resourceLayers.cluster.addOverlay(clusterPoints);
				allList = null;
				points = null;
				this.resourceLayers.clusterResource["Indoor"] = null;
				this.resourceLayers.clusterResource["HiShpomt"] = null;
				this.resourceLayers.clusterResource["Elevated"] = null;
				this.resourceLayers.clusterResource["Water"] = null;
				this.resourceLayers.clusterResource["Ground"] = null;
			}
		},
		//隐藏资源图层
		hideResourceLayers: function() {
			var self = this;
			try {
				//室内
				self.resourceLayers.cluster.setMakrerTypeVisiable("Indoor", false);
				//制高点
				self.resourceLayers.cluster.setMakrerTypeVisiable("HiShpomt", false);
				//高架
				self.resourceLayers.cluster.setMakrerTypeVisiable("Elevated", false);
				//水面
				self.resourceLayers.cluster.setMakrerTypeVisiable("Water", false);
				//路面
				self.resourceLayers.cluster.setMakrerTypeVisiable("Ground", false);

				jQuery(".resource-layers li").removeClass("active");
			} catch (e) {};
		},
		//资源图层控制
		controlSourceLayer:function(msg, This){
			var self = this;
			if (This.hasClass("active")) {
				//室内
				if (This[0].id === "ResourceIndoor") {
					self.resourceLayers.cluster.setMakrerTypeVisiable("Indoor", true);
				}
				//制高点
				if (This[0].id === "ResourceHiShpomt") {
					self.resourceLayers.cluster.setMakrerTypeVisiable("HiShpomt", true);
				}
				//高架
				if (This[0].id === "ResourceElevated") {
					self.resourceLayers.cluster.setMakrerTypeVisiable("Elevated", true);
				}
				//水面
				if (This[0].id === "ResourceWater") {
					self.resourceLayers.cluster.setMakrerTypeVisiable("Water", true);
				}
				//路面
				if (This[0].id === "ResourceGround") {
					self.resourceLayers.cluster.setMakrerTypeVisiable("Ground", true);
				}
			} else {
				if (This[0].id === "ResourceIndoor") {
					self.resourceLayers.cluster.setMakrerTypeVisiable("Indoor", false);
				}
				//制高点
				if (This[0].id === "ResourceHiShpomt") {
					self.resourceLayers.cluster.setMakrerTypeVisiable("HiShpomt", false);
				}
				//高架
				if (This[0].id === "ResourceElevated") {
					self.resourceLayers.cluster.setMakrerTypeVisiable("Elevated", false);
				}
				//水面
				if (This[0].id === "ResourceWater") {
					self.resourceLayers.cluster.setMakrerTypeVisiable("Water", false);
				}
				//路面
				if (This[0].id === "ResourceGround") {
					self.resourceLayers.cluster.setMakrerTypeVisiable("Ground", false);
				}
			}
		},
		/**
		 * 获取摄像机信息
		 **/
		loadResourceCameras: function() {
			var self = this;
			var images = [MapConst.mapIcon.camera.cluster["1"].img,
				MapConst.mapIcon.camera.cluster["2"].img,
				MapConst.mapIcon.camera.cluster["3"].img,
				MapConst.mapIcon.camera.cluster["4"].img
			]
			for (var m = 0, n = images.length; m < n; m++) {
				new Image().src = images[m];
			}
			//获取室内摄像机
			var data = {
				type: 1
			};
			ajaxService.ajaxEvents.getResourceCamera(data, function(res) {
				if (res.code === 200) {
					self.clusterResource("Indoor", res.data.cameras);
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.warn("获取室内摄像机异常！");
				}
			}, function() {
				notify.error("获取室内摄像机失败,请查看网络状况！");
			});
			//获取制高点摄像机
			var data = {
				type: 2
			};
			ajaxService.ajaxEvents.getResourceCamera(data, function(res) {
				if (res.code === 200) {
					self.clusterResource("HiShpomt", res.data.cameras);
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取制高点摄像机异常！");
				}
			}, function() {
				notify.error("获取制高点摄像机失败,请查看网络状况！");
			});
			//获取高架摄像机
			var data = {
				type: 3
			};
			ajaxService.ajaxEvents.getResourceCamera(data, function(res) {
				if (res.code === 200) {
					self.clusterResource("Elevated", res.data.cameras);
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取高架摄像机异常！");
				}
			}, function() {
				notify.error("获取高架摄像机失败,请查看网络状况！");
			});
			//获取水面摄像机
			var data = {
				type: 4
			};
			ajaxService.ajaxEvents.getResourceCamera(data, function(res) {
				if (res.code === 200) {
					self.clusterResource("Water", res.data.cameras);
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取水上摄像机异常！");
				}
			}, function() {
				notify.error("获取水上摄像机失败,请查看网络状况！");
			});
			//获取路面摄像机
			var data = {
				type: 5
			};
			ajaxService.ajaxEvents.getResourceCamera(data, function(res) {
				if (res.code === 200) {
					self.clusterResource("Ground", res.data.cameras);
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取路面摄像机异常！");
				}
			}, function() {
				notify.error("获取路面摄像机失败,请查看网络状况！");
			});
		},
		/**
		 * 在地图上显示摄像机信息
		 **/
		showMapCameraInfo: function() {
			var self = this;
			var camera = this.currentCameraData;
			//位置
			var position = new NPMapLib.Geometry.Point(camera.longitude, camera.latitude);
			//标题
			var title = "",
				//内容
				content = globalVar.template({
					cameraInfo: camera
				}),
				//窗口参数
				opts = {
					width: 260, //信息窗宽度，单位像素 
					height: 180, //信息窗高度，单位像素
					offset: new NPMapLib.Geometry.Size(0, -5), //信息窗位置偏移值
					arrow: true,
					autoSize: false
				};
			//加载信息窗口
			self.addInfoWindow(position, title, content, opts);
			permission.reShow();
			//关闭地图窗口
			jQuery(".infowindow-title span.btns i.closeBtn").unbind("click");
			jQuery(".infowindow-title span.btns i.closeBtn").click(function() {
				//关闭窗口
				self.closeInfoWindow();
				//将鼠标上次悬浮坐标置为0
				self.curPlayingVideoInfo.x = 0;
				self.curPlayingVideoInfo.y = 0;
			});
			//查看实时视频
			jQuery("#npgis .camera-status-online").unbind("click");
			jQuery("#npgis .camera-status-online").on("click", function() {
				//添加判断是否根据摄像机id有播放权限  by wangxiaojun 2014.12.30
				var list = [];
				var camId =jQuery(this).closest(".map-camera-info").attr("data-id");
				list.push(camId);
				permission.stopFaultRightById(list,true,function(rights){	
					if(rights[0] === true){
						self.playMapCameraVideo();
					} else {
						notify.info("暂无权限访问该摄像机！");
					}		
				});
			});
		},
		//在地图上显示摄像机
		showCamerasOnMap: function(cameras) {
			if (!globalVar.cameraLayer) {
				globalVar.cameraLayer = new NPMapLib.Layers.OverlayLayer("camera-layer");
				globalVar.map.addLayer(globalVar.cameraLayer);
			} else {
				globalVar.cameraLayer.removeAllOverlays();
			}
			if (!cameras) {
				return;
			}
			//显示摄像机
			for (var i = 0, j = cameras.length; i < j; i++) {
				var marker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(cameras[i].longitude, cameras[i].latitude));
				//获取摄像机状态与类型，以正确的显示摄像机图标
				var cameratype = this.getCameraTypeAndStatus(cameras[i]);
				if(cameras[i].hd_channel.length>0) {
					if (cameratype === "ballonline") {
						marker.setIcon(MapConst.guardRouteSymbol.cameraBallOnline());
					} else if (cameratype === "balloffline") {
						marker.setIcon(MapConst.guardRouteSymbol.cameraBallOffline());
					} else if (cameratype === "gunonline") {
						marker.setIcon(MapConst.guardRouteSymbol.cameraGunOnline());
					} else {
						marker.setIcon(MapConst.guardRouteSymbol.cameraGunOffline());
					}
				}else {
					if (cameratype === "ballonline") {
						marker.setIcon(MapConst.guardRouteSymbol.cameraBallOnline());
					} else if (cameratype === "balloffline") {
						marker.setIcon(MapConst.guardRouteSymbol.cameraBallOffline());
					} else if (cameratype === "gunonline") {
						marker.setIcon(MapConst.guardRouteSymbol.cameraGunOnline());
					} else {
						marker.setIcon(MapConst.guardRouteSymbol.cameraGunOffline());
					}
				}
				// if (cameratype === "ballonline") {
				// 	marker.setIcon(globalVar.cameraSymbol.cameraBallOnline());
				// } else if (cameratype === "balloffline") {
				// 	marker.setIcon(globalVar.cameraSymbol.cameraBallOffline());
				// } else if (cameratype === "gunonline") {
				// 	marker.setIcon(globalVar.cameraSymbol.cameraGunOnline());
				// } else {
				// 	marker.setIcon(globalVar.cameraSymbol.cameraGunOffline());
				// }
				marker.setData({
					id: cameras[i].id
				});
				globalVar.cameraLayer.addOverlay(marker);
			}
		},
		//显示资源图层
		showResourceLayers: function() {
			var self = this;
			try {
				// 显示其他图层
				self.resourceLayers.cluster.setMakrerTypeVisiable("Indoor", true);
				//制高点
				self.resourceLayers.cluster.setMakrerTypeVisiable("HiShpomt", true);
				//高架
				self.resourceLayers.cluster.setMakrerTypeVisiable("Elevated", true);
				//水面
				self.resourceLayers.cluster.setMakrerTypeVisiable("Water", true);
				//路面
				self.resourceLayers.cluster.setMakrerTypeVisiable("Ground", true);

				jQuery(".resource-layers li").addClass("active");
			} catch (e) {};
		},
		//坐标转换
		convertArrayToGeoJson: function(pointarr, type) {
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
		},
		//框选摄像机
		rectSelectCameras: function() {
			var self = this;
			//激活绘制工具
			self.options.drawtool.setMode(NPMapLib.DRAW_MODE_RECT, function(extent, geometry, rings){self.selectEnd(extent, geometry, rings)});
			//激活鼠标文字跟踪
			globalVar.map.activateMouseContext("拖动鼠标框选摄像机");
		},
		//框选结束
		selectEnd: function(extent, geometry, rings) {
			var self = this;
			//添加摄像机图层
			if (!globalVar.cameraLayer) {
				globalVar.cameraLayer = new NPMapLib.Layers.OverlayLayer("camera-layer");
				globalVar.map.addLayer(globalVar.cameraLayer);
			}
			//注销鼠标文字跟踪
			globalVar.map.deactivateMouseContext();
			//获取绘制坐标信息
			var points = self.convertArrayToGeoJson(geometry._points, "Polygon");
			//获取框选范围内的摄像机
			ajaxService.ajaxEvents.getSelectedCamera({geometry: points}, function(res) {
				if (res.code === 200) {
					var newCameras = res.data.cameras,
						oldCameras = [];
					//获取以前的摄像机
					var LIs = jQuery(".mid-bottom-panel .people-control-edit-form .camera-list li.camera-item");
					for (var i = 0, j = LIs.length; i < j; i++) {
						var camera = jQuery(LIs[i]).data();
						oldCameras.push(camera);
					}
					var resultCameras = [];
					//加载新增摄像机
					if (oldCameras.length > 0) {
						//过滤摄像机
						resultCameras = controlMgrView.filterCameras(newCameras, oldCameras);
					} else {
						resultCameras = res.data.cameras;
					}
					//获取模板
					var template = globalVar.template({
						DefenceAddCameras: {
							cameras: resultCameras
						}
					});
					var CameraContainer = jQuery("#PeopleTaskFrom .camera-list");
					//如果已经含有摄像机，则追加
					if (CameraContainer.find("li.camera-item").length > 0) {
						CameraContainer.append(template);
						permission.reShow();
					} else {
						//如果没有摄像机，则填充
						CameraContainer.html(template);
					}
					//在地图上显示新增的摄像机
					if (resultCameras) {
						self.markerList = [];
						for (var i = 0, j = resultCameras.length; i < j; i++) {
							var data = resultCameras[i];
							var marker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(data.longitude, data.latitude));
							self.markerList.push(marker);
							data.cameraType = data.camera_type;
							data.hdchannel = data.hd_channel;
							data.sdchannel = data.sd_channel;
							//获取摄像机状态与类型，以正确的显示摄像机图标
							var cameratype = self.getCameraTypeAndStatus(data);
							// if (cameratype === "ballonline") {
							// 	marker.setIcon(globalVar.cameraSymbol.cameraBallOnline());
							// } else if (cameratype === "balloffline") {
							// 	marker.setIcon(globalVar.cameraSymbol.cameraBallOffline());
							// } else if (cameratype === "gunonline") {
							// 	marker.setIcon(globalVar.cameraSymbol.cameraGunOnline());
							// } else {
							// 	marker.setIcon(globalVar.cameraSymbol.cameraGunOffline());
							// }

							if(data.hdchannel.length>0){
								if (cameratype === "ballonline") {
									marker.setIcon(MapConst.guardRouteSymbol.cameraBallOnline());
								} else if (cameratype === "balloffline") {
									marker.setIcon(MapConst.guardRouteSymbol.cameraBallOffline());
								} else if (cameratype === "gunonline") {
									marker.setIcon(MapConst.guardRouteSymbol.cameraGunOnline());
								} else {
									marker.setIcon(MapConst.guardRouteSymbol.cameraGunOffline());
								}
							}else{
								if (cameratype === "ballonline") {
									marker.setIcon(MapConst.guardRouteSymbol.cameraBallOnline());
								} else if (cameratype === "balloffline") {
									marker.setIcon(MapConst.guardRouteSymbol.cameraBallOffline());
								} else if (cameratype === "gunonline") {
									marker.setIcon(MapConst.guardRouteSymbol.cameraGunOnline());
								} else {
									marker.setIcon(MapConst.guardRouteSymbol.cameraGunOffline());
								}
							}
							marker.setData({
								id: data.id
							});
							globalVar.cameraLayer.addOverlay(marker);
						}
					}
					//悬浮事件绑定
					controlMgrView.hoverCameraList();
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("地图上框选摄像机失败！错误码：" + res.code);
				}
			}, function() {
				notify.error("地图上框选摄像机失败，服务器或网络异常！");
			});
		},
		/**
		 * 在地图上播放视频
		 **/
		playMapCameraVideo: function() {
			var self = this;
			if (this.currentCameraData) {
				//获取摄像机信息
				var camera = this.currentCameraData;
				camera.sd_channel = camera.sd_channel ? camera.sd_channel : camera.sdchannel;
				camera.hd_channel = camera.hd_channel ? camera.hd_channel : camera.hdchannel;
				camera.camera_type = camera.camera_type ? camera.camera_type : camera.cameratype;
				camera.camera_status = camera.camera_status ? camera.camera_status : camera.status;
				//位置
				var position = new NPMapLib.Geometry.Point(camera.longitude, camera.latitude);
				//内容
				var content = globalVar.template({
						ocx: camera
					}),
					//窗口参数
					opts = {
						width: 400, //信息窗宽度，单位像素 
						height: 330, //信息窗高度，单位像素
						offset: new NPMapLib.Geometry.Size(0, -5), //信息窗位置偏移值
						arrow: true,
						autoSize: false,
						isAnimationOpen: false
					};
				//加载信息窗口
				self.addInfoWindow(position, "", content, opts);
				permission.reShow();

				if (!self.ocxDom) {
					self.createOcxOnMap();
				}
				jQuery(".map-video-container").append(self.ocxDom);
				//如果没有播放对象，则初始化

				if (!globalVar.videoPlayerSigle) {
					//播放视频
					globalVar.videoPlayerSigle = new VideoPlayer({
						layout: 1,
						uiocx: 'UIOCXMAP'
					});
					// jQuery("#UIOCXMAP")[0].RefreshForGis(100);
					document.getElementById("UIOCXMAP").RefreshForGis(100);
				}

				setTimeout(function() {
					// 播放视频
					globalVar.videoPlayerSigle.setFreePath({
						'hdChannel': camera.hd_channel, //高清通道
						'sdChannel': camera.sd_channel, //标清通道
						'cId': camera.id,
						'cName': camera.name,
						'cType': camera.camera_type,
						'cStatus': camera.camera_status //摄像机在线离线状态
					});
					if (self.getCameraTypeAndStatus(camera) === "ballonline") {
						if(permission.klass["ptz-control"] !== "ptz-control"){
							globalVar.videoPlayerSigle.switchPTZ(false, 0);
						} else {
							globalVar.videoPlayerSigle.switchPTZ(true, 0);
						}
					}
					//日志加载
					//logDict.insertLog('m1','f1','o4','b4', camera.name+'摄像机');
				}, 1000);
				//关闭地图窗口
				jQuery(".infowindow-title span.btns i.closeBtn").unbind("click");
				jQuery(".infowindow-title span.btns i.closeBtn").click(function() {
					//关闭窗口
					self.closeInfoWindow();
					//将鼠标上次悬浮坐标置为0
					self.curPlayingVideoInfo.x = 0;
					self.curPlayingVideoInfo.y = 0;
				});
			}
		},
		/**
		 * 创建地图上的OCX
		 **/
		createOcxOnMap: function() {
			var self = this;
			if(!self.ocxDom) {
				self.ocxDom = '<object id="UIOCXMAP" type="applicatin/x-firebreath" width ="398" height ="297"><param name="onload" value="pluginLoaded"/></object>';
			}
		},
		/**
		 * 加载信息窗口
		 **/
		addInfoWindow: function(position, title, content, opts) {
			var self = this;
			if (globalVar.infowindow) {
				//先关闭
				self.closeInfoWindow();
			}
			//新建窗口元素
			globalVar.infowindow = new NPMapLib.Symbols.InfoWindow(position, "", content, opts);
			//将窗口加入在地图
			globalVar.map.addOverlay(globalVar.infowindow);
			//显示信息窗口
			globalVar.infowindow.open(new NPMapLib.Geometry.Size(opts.width, opts.height));
		},
		/**
		 * 关闭信息窗口
		 **/
		closeInfoWindow: function() {
			var self = this;
			//如果有视频播放，关闭视频
			if (globalVar.videoPlayerSigle) {
				globalVar.videoPlayerSigle.stop(false, 0);
				globalVar.videoPlayerSigle = null;
			}
			if (globalVar.infowindow) {
				var BaseDiv = jQuery(globalVar.infowindow.getBaseDiv());
				BaseDiv.html("");
				globalVar.infowindow.close();
				globalVar.infowindow = null;
			}
		},
		//获取摄像机类型和状态
		getCameraTypeAndStatus: function(camera) {
			var status = 1,
				type = (camera.cameratype != undefined) ? camera.cameratype : camera.camera_type,
				isonline = false,
				hd = (camera.hd_channel != undefined) ? camera.hd_channel : camera.hdchannel,
				sd = (camera.sd_channel != undefined) ? camera.sd_channel : camera.sdchannel;
			hd.each(function(item, index) {
				if (item.channel_status === 0) {
					status = 0;
					isonline = true;
				}
			});
			if (!isonline) {
				sd.each(function(item, index) {
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
		}
	};
	return new Controller();
});