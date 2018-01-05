/**
 * 布控任务管理地图交互部分controller
 */
define([
	'../model/alarm-mapModel.js',
	'js/global-varibale',
	'pubsub',
	'../view/common-task-view',
	'./common-map-deal',
	'./common-mapVideo-play',
	'npmapConfig',
	'OpenLayers',
	'permission'
], function(ajaxService, globalVar, PubSub, commonView,comDeal,videoPlay) {
	var mapCtr = function() {
		var self = this;
		//订阅事件-绑定布防处理弹出信息窗上的关闭事件
		PubSub.subscribe("closeInfoWindow", function() {
			self.closeInfoWindow();
		});
		//订阅事件-绑定布防处理弹出信息窗上的事件
		PubSub.subscribe("resizeInfoWindowOnDeal", function() {
			self.resizeInfoWindowOnDeal();
		});
		//订阅事件-弹出报警信息窗（报警处理完成后）
		PubSub.subscribe("showInfoWinOnMap", function(msg, data){
			self.showInfoWinOnMap(data.index, data.eventType, data.alarmId);
		});
		//显示信息窗
		PubSub.subscribe("addInfoWindow", function(msg, data){
			self.addInfoWindow(data.position, data.title, data.content,data.opts);
		});
	}
	mapCtr.prototype = {
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
			cameraLayer: null,
			
		},
		curPlayingVideoInfo: {
			x: 0,
			y: 0
		},
		//资源图层
		resourceLayers: {
			clusterResource: null,
			clusterResourceNum: 0
		},

		//是否已加载摄像机资源
		isLoadedCameras: false,
		init:function(){
			var self = this;
			//初始化地图基础图层
			self.initMap();
			//加载图层
			self.addBusiLayers();
			//加载图层
			self.bindEvents();
			//加载地图上布防布控摄像机资源
			self.getSourceCamera("deploy,deployctl,both");

		},
		initMap: function() {
			var self = this;
			//初始化地图
			self.options.map = globalVar.AlarmMgrOptions.PVAMap = mapConfig.initMap(document.getElementById("mapId"),true);
			jQuery("#mapId").find("h3.title").text(mapConfig.regionName || "");
			//加图层
			var layers = [];
			if (mapConfig.baselayer) {
				var layer = mapConfig.initLayer(mapConfig.baselayer, "baselayer");
				layers.push(layer[0]);
				if (layer.length === 2) {
					layers.push(layer[1]);
				}
			}
			//
			//加载基础图层
			self.options.map.addLayers(layers);
			//鹰眼
			self.options.overviewctrl = new NPMapLib.Controls.OverviewControl();
			self.options.map.addControl(self.options.overviewctrl);
			//导航
			self.options.Navictrl = new NPMapLib.Controls.NavigationControl({navigationType:'netposa'});
			self.options.map.addControl(self.options.Navictrl);
			//测量工具
			self.options.measuretool = globalVar.measuretool = new NPMapLib.Tools.MeasureTool(self.options.map.id, {
				lengthUnit: NPMapLib.MAP_UNITSglobalVarETERS, //长度单位
				areaUnit: NPMapLib.MAP_UNITS_SQUARE_KILOMETERS, //面积单位
				mode: NPMapLib.MEASUREglobalVarODE_DISTANCE //测量模式
			});
			self.options.measuretool.startUp();
			//绘制工具初始化
			self.options.drawtool = new NPMapLib.Tools.DrawingTool(self.options.map.id);
			//添加鼠标缩放时的动画,四个角
			var zoomAnimation = new NPMapLib.Controls.zoomAnimationControl();
			self.options.map.addControl(zoomAnimation);
			//鼠标样式
			self.options.map.addHandStyle();
			//地图拖拽
			self.options.map.addEventListener(NPMapLib.MAP_EVENT_DRAGGING, function(e) {
				if (globalVar.AlarmMgrOptions.infowindow) {
					if (globalVar.videoPlayerSigle) {
						// globalVar.videoPlayerSigle.refreshWindow(0);
					}
				}
			});
			//地图拖拽开始
			self.options.map.addEventListener(NPMapLib.MAP_EVENT_DRAG_START, function(e) {
				if (globalVar.AlarmMgrOptions.infowindow) {
					if (globalVar.videoPlayerSigle) {
						globalVar.AlarmMgrOptions.infowindow.hide();
					}
				}
			});
			//地图拖拽结束
			self.options.map.addEventListener(NPMapLib.MAP_EVENT_DRAG_END, function(e) {
				if (globalVar.AlarmMgrOptions.infowindow) {
					if (globalVar.videoPlayerSigle) {
						globalVar.AlarmMgrOptions.infowindow.show();
						// globalVar.videoPlayerSigle.refreshWindow(0);
					}
				}
			});
			//地图缩放结束
			self.options.map.addEventListener(NPMapLib.MAP_EVENT_ZOOM_END, function(e) {
				if (globalVar.AlarmMgrOptions.infowindow) {
					if (globalVar.videoPlayerSigle) {
						// globalVar.videoPlayerSigle.refreshWindow(0);
					}
				}
			});
		},
		getListMode:function(){
			var selectMode =[],selctlist="";
			jQuery(".cameraSelect ul li i.checkbox_ctrl_active").each(function(){
				selctlist = jQuery(this).parent().attr("data-mode");
				selectMode.push(selctlist)
			});
			return selectMode.join(",");
		},
		bindEvents:function(){
			var self = this,modes;
			jQuery(".cameraSelect ul li").on("click",function(){
				
				jQuery(this).find("i.icons-select-all").toggleClass("checkbox_ctrl_active");
				modes = self.getListMode();
				self.getSourceCamera(modes);
			})
		},
		/**
		 * 添加图层
		 */
		addBusiLayers: function () {
			var self = this;
			//报警显示图层
			globalVar.AlarmMgrOptions.layers.alarmCameraLayer = new NPMapLib.Layers.OverlayLayer("alarm-camera-point");
			globalVar.AlarmMgrOptions.PVAMap.addLayer(globalVar.AlarmMgrOptions.layers.alarmCameraLayer);
			//视频播放图层
			globalVar.AlarmMgrOptions.layers.cameraVideoLayer = new NPMapLib.Layers.OverlayLayer("camera-video-layer");
			globalVar.AlarmMgrOptions.PVAMap.addLayer(globalVar.AlarmMgrOptions.layers.alarmCameraLayer);
		},
		getSourceCamera:function(mode){
			var self = this;
			self.clearMap();
			if(globalVar.AlarmMgrOptions.PVAMap){

				ajaxService.GetSourcecameraList({types:mode}).then(function(data){
					if(data.code===200){
						for(var i=0,le = data.data.length;i<le;i++){
							var cameraData = data.data[i],cameraId,
							mapX =cameraData.longitude,
							mapY = cameraData.latitude;
							cameraData.cameraId = cameraData.id
							if(mapX && mapY){
								var points = new NPMapLib.Geometry.Point(mapX,mapY);
								var marker = new NPMapLib.Symbols.Marker(points);
								//根据摄像机类型区别图片
								if(cameraData.type==="deploy"){
									marker.setIcon(globalVar.vedioSymbols.alarmMarkerDefence());
								}else if(cameraData.type==="deployctl"){
									marker.setIcon(globalVar.vedioSymbols.alarmMarkerCtr());
								}else{
									marker.setIcon(globalVar.vedioSymbols.alarmMarkerAll());
								}

								//设置数据
								marker.setData(cameraData);
								//显示在图层上
								globalVar.AlarmMgrOptions.layers.alarmCameraLayer.addOverlay(marker);
								//覆盖物的图层事件
								marker.addEventListener('click', function(mark) {
									//如果悬浮摄像机是当前已选中摄像机，则不改变当前点位状态
									if (globalVar.currentCameraMarker && globalVar.currentCameraMarker.getData().cameraId === mark.getData().cameraId) {
										//显示信息窗
										videoPlay.playMapCameraVideo(mark.getData());
										return;
									}
									globalVar.AlarmMgrOptions.PVAMap.centerAndZoom(points,12);
									/**根据摄像机类型区别图片**/
									if(mark.getData().type==="deploy"){
										marker.setIcon(globalVar.vedioSymbols.alarmMarkerDefence());
									}else if(mark.getData().type==="deployctl"){
										marker.setIcon(globalVar.vedioSymbols.alarmMarkerCtr());
									}else{
										marker.setIcon(globalVar.vedioSymbols.alarmMarkerAll());
									}
									mark.refresh();
									//将上次选中的报警图标还原
									if (globalVar.currentCameraMarker) {
										var currentMarker = globalVar.currentCameraMarker;
										/**根据摄像机类型区别图片**/
										if(mark.getData().type==="deploy"){
											marker.setIcon(globalVar.vedioSymbols.alarmMarkerDefence());
										}else if(mark.getData().type==="deployctl"){
											marker.setIcon(globalVar.vedioSymbols.alarmMarkerCtr());
										}else{
											marker.setIcon(globalVar.vedioSymbols.alarmMarkerAll());
										}
										mark.refresh();
									}
									//设置当前活动摄像机标注(设置为活动点位)
									globalVar.currentCameraMarker = mark;
									//显示视频播放窗
									videoPlay.playMapCameraVideo(mark.getData());

								});
								marker.addEventListener('mouseover', function(mark) {
									//如果悬浮摄像机是当前已选中摄像机，撤销悬浮效果
									if (globalVar.currentCameraMarker && globalVar.currentCameraMarker.getData().cameraId === mark.getData().cameraId) {
										return;
									}
									/**根据摄像机类型区别图片**/
									if(mark.getData().type==="deploy"){
										marker.setIcon(globalVar.vedioSymbols.alarmMarkerDefence());
									}else if(mark.getData().type==="deployctl"){
										marker.setIcon(globalVar.vedioSymbols.alarmMarkerCtr());
									}else{
										marker.setIcon(globalVar.vedioSymbols.alarmMarkerAll());
									}
									globalVar.currentCameraData = mark.getData();
									mark.refresh();
									
								});
								marker.addEventListener('mouseout', function(mark) {
									//如果悬浮摄像机是当前已选中摄像机，撤销悬浮效果
									if (globalVar.currentCameraMarker && globalVar.currentCameraMarker.getData().cameraId === mark.getData().cameraId) {
										return;
									}
									/**根据摄像机类型区别图片**/
									if(mark.getData().type==="deploy"){
										marker.setIcon(globalVar.vedioSymbols.alarmMarkerDefence());
									}else if(mark.getData().type==="deployctl"){
										marker.setIcon(globalVar.vedioSymbols.alarmMarkerCtr());
									}else{
										marker.setIcon(globalVar.vedioSymbols.alarmMarkerAll());
									}
									globalVar.currentCameraData = mark.getData();
									mark.refresh();
									
								});
							}
							
						}
					}

				})
			}

		},
		/**
		 * 清空地图绘制环境
		 */
		clearMap: function () {
			var self = this;
			//清空绘图环境
			globalVar.AlarmMgrOptions.layers.alarmCameraLayer.hide();
			globalVar.AlarmMgrOptions.layers.alarmCameraLayer.removeAllOverlays();
			globalVar.AlarmMgrOptions.layers.alarmCameraLayer.show();
			//清除信息窗
			if (globalVar.AlarmMgrOptions.infowindow) {
				globalVar.AlarmMgrOptions.infowindow.close();
				globalVar.currentCameraMarker = null;
				globalVar.AlarmMgrOptions.infowindow = null;
			}
		},
		/**
		 * 设置地图中心点
		 **/
		setMapToPoint: function (point) {
			var extent = globalVar.AlarmMgrOptions.PVAMap.getExtent();
			if (point.lon > extent.sw.lon && point.lon < extent.ne.lon && point.lat > extent.sw.lat && point.lat < extent.ne.lat) {
				return;
			}
			globalVar.AlarmMgrOptions.PVAMap.setCenter(point);
		},
		/**
		 * 左侧树的鼠标事件
		 * @param cameraId-当前报警对应的摄像机的id
		 * @param eventType-当前的鼠标事件，over是鼠标移入，out是鼠标移出，click是鼠标点击，click-deal是鼠标点击报警处理
		 * @param alarmId-当前报警的id，点击和处理时有效
		 */
		linkToAlarmListEvent: function (cameraId, eventType, alarmId) {
			var self = this, markers = globalVar.AlarmMgrOptions.layers.alarmCameraLayer._overlays;
			//遍历所有的marker
			for (var key in markers) {
				if (markers[key].getData()) {
					//响应地图中该点
					
					if (parseInt(markers[key].getData().cameraId) === parseInt(cameraId)) {
						if (eventType === "click" || eventType === "click-deal") {
							if (!globalVar.currentCameraMarker || globalVar.currentCameraMarker.getData().cameraId !== parseInt(cameraId)) {
								//左侧列表的点击事件
								markers[key].setIcon(globalVar.symbols.alarmMarkerActive());
								markers[key].refresh();
								//清除之前选中的点位图标
								if (globalVar.currentCameraMarker) {
									var currentMarker = globalVar.currentCameraMarker;
									currentMarker.setIcon(globalVar.symbols.alarmMarkerNormal());
									currentMarker.refresh();
								}
								//记录当前活动的摄像机标注
								globalVar.currentCameraMarker = markers[key];
								//在地图上居中该点

								var point = new NPMapLib.Geometry.Point(markers[key].getData().longitude, markers[key].getData().latitude);
								//self.setMapToPoint(point);
								globalVar.AlarmMgrOptions.PVAMap.centerAndZoom(point,12);
								//显示信息窗
							
								self.showInfoWinOnMap(-1, eventType, alarmId);
								//隐藏处理图标
								jQuery(".infowindow-alarm-mgr .infowindow-top .alarm-mark-deal").hide();
							} else {
								//当前已经选中了该节点
								if (eventType === "click-deal" && alarmId === self.curSelectAlarmId) {
									self.resizeInfoWindowOnDeal();
									//人员布控报警处理事件绑定
									pubsub.publish("toDealPersonEvents",{});
									jQuery(".infowindow-alarm-mgr").find(".person-images .image-detail:first-child img").click();
								} else {
									//显示信息窗
									self.showInfoWinOnMap(-1, eventType, alarmId);
								}
							}
						} else if (eventType === "over") {
							//左侧列表的移入事件
							if(markers[key].getData().type){
								return ;
							}
							if (!globalVar.currentCameraMarker || globalVar.currentCameraMarker.getData().cameraId !== parseInt(cameraId)) {
								markers[key].setIcon(globalVar.symbols.alarmMarkerActive());
								markers[key].refresh();
							}
						} else {
							if(markers[key].getData().type){
								return ;
							}
							//左侧列表的移出事件
							if (!globalVar.currentCameraMarker || globalVar.currentCameraMarker.getData().cameraId !== parseInt(cameraId)) {
								markers[key].setIcon(globalVar.symbols.alarmMarkerNormal());
								markers[key].refresh();
							}
						}
					}
				}
			}
		},
		/**
		 * 将报警中的摄像机点位显示在地图上
		*/
		setCamerasPosition: function (datas) {
			var self = this;
			//清空绘图环境
			self.clearMap();
			if(jQuery("#major").attr("data-currpart")==="ocx"){
				commonView.changeWrapper()
			}
			jQuery(".cameraSelect ul li").find("i").removeClass("checkbox_ctrl_active");
			var tempData = datas;
			if(tempData.latitude==="" && tempData.longitude===""){
				notify.warn("暂无点位信息！");
				return false;
			}
			//监控点标注
			var mapX = tempData.longitude,
				mapY = tempData.latitude;
			if (mapX && mapY) {
				var markerPos = new NPMapLib.Geometry.Point(mapX, mapY);
				var marker = new NPMapLib.Symbols.Marker(markerPos);
				//图片
				marker.setIcon(globalVar.symbols.alarmMarkerNormal());
				//设置数据
				marker.setData(tempData);
				//显示在图层上
				globalVar.AlarmMgrOptions.layers.alarmCameraLayer.addOverlay(marker);

				//覆盖物的图层事件
				marker.addEventListener('click', function(mark) {
					//如果悬浮摄像机是当前已选中摄像机，则不改变当前点位状态
					if (globalVar.currentCameraMarker && globalVar.currentCameraMarker.getData().cameraId === mark.getData().cameraId) {
						//显示信息窗
						self.showInfoWinOnMap(1);
						return;
					}
					//修改图标样式
					mark.setIcon(globalVar.symbols.alarmMarkerActive());
					mark.refresh();
					globalVar.AlarmMgrOptions.PVAMap.centerAndZoom(markerPos,12);
					//将上次选中的报警图标还原
					if (globalVar.currentCameraMarker) {
						var currentMarker = globalVar.currentCameraMarker;
						currentMarker.setIcon(globalVar.symbols.alarmMarkerNormal());
						currentMarker.refresh();
					}
					//设置当前活动摄像机标注(设置为活动点位)
					globalVar.currentCameraMarker = mark;
					//显示信息窗
					self.showInfoWinOnMap(1);
					//清除列表的选中状态
					jQuery(".alarm-info-active").toggleClass("alarm-info-active").removeClass("li-active");

				});
				marker.addEventListener('mouseover', function(mark) {
					//如果悬浮摄像机是当前已选中摄像机，撤销悬浮效果
					if (globalVar.currentCameraMarker && globalVar.currentCameraMarker.getData().cameraId === mark.getData().cameraId) {
						return;
					}
					//修改图标样式
					mark.setIcon(globalVar.symbols.alarmMarkerActive());
					mark.refresh();
				});
				marker.addEventListener('mouseout', function(mark) {
					//如果悬浮摄像机是当前已选中摄像机，撤销悬浮效果
					if (globalVar.currentCameraMarker && globalVar.currentCameraMarker.getData().cameraId === mark.getData().cameraId) {
						return;
					}
					//修改图标样式
					mark.setIcon(globalVar.symbols.alarmMarkerNormal());
					mark.refresh();
				});
			}

		},
		
		/**
		 * 地图上报警点位点击后，弹出报警信息窗
		 * @param index 当前报警所在页的索引，如果是地图上点位点击，index为1，左侧树点击，index为-1
		 * @param eventType 事件类型（点击/处理），左侧列表上的鼠标事件时有效
		 * @param alarmId 当前报警的id，左侧列表上的鼠标事件时有效
		 */
		showInfoWinOnMap: function (index, eventType, alarmId) {
			var self = this;
			//如果当前活跃点位存在（用来信息窗的定位）
			if (globalVar.currentCameraMarker) {
				//如果是地图上点位点击
				if (index !== -1) {
					var cameraId = globalVar.currentCameraMarker.getData().cameraId;

					//根据当前的摄像机id，发送请求获取该摄像机的报警信息
					ajaxService.GetAlarmInfoByCameraId({
						id: cameraId,
						currentPage: index
					}).then(function(res){
						if (res.code === 200 && res.data.event) {
							jQuery.extend(res.data.event.deployEvent, globalVar.currentCameraMarker.getData());
							//显示信息窗
							self.showInfoWindow(res.data.event, true,false);
							self.highLightListItem(res.data.event.deployEvent.id);
							
						} else if (res.code === 500) {
							notify.error(res.data.message + "！错误码：" + res.code);
						} else {
							notify.error("获取当前点位最新的报警信息失败！错误码：" + res.code);
						}
					}, function(){
						notify.error("获取当前点位最新的报警信息失败，服务器或网络异常！");
					});
				} else {
					//左侧树的点击/处理,根据当前报警的id，发送请求获取该报警的信息
					ajaxService.GetAlarmInfoById({
						id: alarmId
					}).then(function(res){
						if (res.code === 200 && res.data.event) {
							jQuery.extend(res.data.event.deployEvent, globalVar.currentCameraMarker.getData());
							//显示信息窗
							self.showInfoWindow(res.data.event, false, (eventType === "click-deal") ? true : false);
						} else if (res.code === 500) {
							notify.error(res.data.message + "！ 错误码：" + res.code);
						} else {
							notify.error("报警详细信息获取失败！错误码：" + res.code);
						}
					}, function(){
						notify.error("报警详细信息获取失败，网络或服务器异常！");
					});
				}
			}
		},
		/**
		 * 根据报警类型显示地图上的报警信息窗
		 */
		resizeInfoWindow: function (curWinType, isDeal) {
			var oWidth = 0, oHeight = 190;
			//根据报警类型调整信息窗的大小
			if (curWinType === "defence") {
				//布防报警下
				if (globalVar.curInfoWinIsMap) {//地图点位点击时
					oWidth = 345;
					if (isDeal) {//左侧报警信息点击“处理”
						oWidth = 501;//542;
					} else {//左侧报警信息点击
						oWidth = 300;//345;
					}
				} else {
					if (isDeal) {//左侧报警信息点击“处理”
						oWidth = 501;
					} else {//左侧报警信息点击
						oWidth = 300;
					}
				}
			} else {
				oHeight = 310;
				//布控报警下-人员布控
				if (globalVar.curInfoWinIsMap) {//地图点位点击时
					oWidth = 365;
					if (isDeal) {//左侧报警信息点击“处理”
						oWidth = 505;//544;
					} else {//左侧报警信息点击
						oWidth = 365;
					}
				} else {
					if (isDeal) {//左侧报警信息点击“处理”
						oWidth = 505;
					} else {//左侧报警信息点击
						oWidth = 365;
					}
				}
			}
			//返回重塑的宽和高
			return {
				width: oWidth,
				height: oHeight
			}
		},

		/**
		 * 报警处理时，根据报警类型伸展地图上的信息窗
		 */
		resizeInfoWindowOnDeal: function () {
			var self = this,
			offleft = jQuery(".infowindow-alarm-mgr").offset().left-0-280,//窗口距离左边距离
			middleW =  jQuery("#mapId").width()-0;//中间宽度

			//根据当前的报警处理类型，来伸展信息窗
			if (jQuery(".infowindow-down").hasClass("protect")) {
				//布控处理时伸展信息窗
				globalVar.AlarmMgrOptions.infowindow.setWidth(globalVar.curInfoWinIsMap ? 505/*544*/ : 505);
				//隐藏信息区域
				jQuery(".infowindow-down .alarm-details").addClass("alarm-hidden");
				//伸展时未能自动适应右侧
				if(middleW-offleft<=500 && middleW>510){
					jQuery("#npgis_contentDiv").css("left",-(510-(middleW-offleft))+"px");
				}
			} else {
				//布防处理时伸展信息窗
				globalVar.AlarmMgrOptions.infowindow.setWidth(globalVar.curInfoWinIsMap ? 501/*542*/ : 501);
				//伸展时未能自动适应右侧
				if(middleW-offleft<=500 && middleW>510){
					jQuery("#npgis_contentDiv").css("left",-(510-(middleW-offleft))+"px");
				}
			}
			//显示设置区域
			jQuery(".infowindow-down .alarm-deal").removeClass("alarm-hidden");
		},

		/**
		 * 地图上显示信息窗
		 * @param param 当前报警的相关信息
		 * @param isMap 标记是否是从地图上点击显示(同步显示左右切换按钮)
		 * @param isDeal 标记是否是报警处理流程
		 */
		showInfoWindow: function (param, isMap, isDeal) {
			var self = this, sizeInfo = null, curWinType = "defence";
			//标记当前是否是从地图上点击显示，如果是则需要显示左右切换按钮，处理时会根据此值对信息窗进行大小控制
			globalVar.curInfoWinIsMap = isMap;
			//判断当前报警类型
			curWinType = (param.deployEvent.eventType === 134217728) ? "protect" : "defence";
			//根据调用方式不同，设置不同的信息窗大小
			sizeInfo = self.resizeInfoWindow(curWinType, isDeal);
			//位置
			var position = new NPMapLib.Geometry.Point(param.deployEvent.longitude, param.deployEvent.latitude);

			//标题
			var title = "", //内容
				content = globalVar.compiler({
					infowindow: param,
					isMap: isMap,
					isDeal: isDeal,
					isDefence: (param.deployEvent.eventType !== 134217728)
				}),

			//窗口参数
				opts = {
					width: sizeInfo.width, //信息窗宽度，单位像素
					height: sizeInfo.height, //信息窗高度，单位像素
					offset: new NPMapLib.Geometry.Size(0, -22),	 //信息窗位置偏移值
					arrow: true,
					autoSize: false
				};
			//加载信息窗口
			self.addInfoWindow(position, title, content, opts);
		},

		/**
		 * 加载信息窗口
		 **/
		addInfoWindow: function (position, title, content, opts) {
			var self = this;
			//先关闭
			self.closeInfoWindow();

			//新建窗口元素
			globalVar.AlarmMgrOptions.infowindow = new NPMapLib.Symbols.InfoWindow(position, "", content, opts);
			//将窗口加入在地图
			globalVar.AlarmMgrOptions.PVAMap.addOverlay(globalVar.AlarmMgrOptions.infowindow);
			//显示信息窗口
			globalVar.AlarmMgrOptions.infowindow.open(new NPMapLib.Geometry.Size(opts.width, opts.height));
			//绑定地图事件
			comDeal.mapInfowinEvents();

		},

		/**
		 * 关闭信息窗口
		 **/
		closeInfoWindow: function () {
			var self = this;
			//触发视频资源的释放
			videoPlay.clearVideoPlayer();

			//关闭信息窗
			if (globalVar.AlarmMgrOptions.infowindow) {
				var BaseDiv = jQuery(globalVar.AlarmMgrOptions.infowindow.getBaseDiv());
				BaseDiv.html("");
				globalVar.AlarmMgrOptions.infowindow.close();
				//globalVar.AlarmMgrOptions.PVAMap.setZoom(10);
				globalVar.AlarmMgrOptions.infowindow = null;
			}
		},
		/**
		 * 地图上点击点位时，高亮左侧树列表
		 * @param id-报警id
		 */
		highLightListItem: function(id) {
			var listItem = jQuery(".scrollbar-panel .content-alarms-list .alarm-info-content[data-id='" + id + "']");
			listItem.addClass("li-active alarm-info-active");
		},


	}
	return new mapCtr();

});