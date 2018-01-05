define([
	"js/npmap-new/map-variable",
	"js/npmap-new/map-const",
	"js/npmap-new/map-init",
	"js/npmap-new/map-common",
	"js/npmap-new/map-permission",
	"js/npmap-new/map-common-overlayer-ctrl",
	"pubsub",
	"/module/common/js/player2.js",
	"handlebars"
], function(Variable, Constant, PVAMap, Common, pvamapPermission, MapOverLayerCtrl, pubsub) {

		var FullView = function() {
			this.bindEvents();
			// by songxj
			this.currentVideoModel = 1;// 右边视频播放的模式 1:中心点模式 2：顺序播放
			this.saveCenterModelCenterCameraObj; // 存储中心模式下的中心点处的摄像机对象 目的是给“停止播放”使用
			this.cameraPositionParamsObj = { // 摄像机方位参数对象
				"left-up": [0, 292.5, 337.5, 60], // 四个参数分别为：position, startAngle, endAngle, pointNum
				"up": [1, -22.5, 22.5, 30],
				"right-up": [2, 22.5, 67.5, 60],
				"left": [3, 247.5, 292.5, 60],
				"center": 4,
				"right": [5, 67.5, 112.5, 60],
				"left-down":[6,  202.5, 247.5, 60],
				"down": [7, 157.5, 202.5, 60],
				"right-down": [8, 112.5, 157.5, 60]
			};
			this.cameraIdMarkerMappingObj = {};// 存储摄像机id和地图marker的关系对象
			this.positionNameArray = ["西北", "正北", "东北", "正西", " ", "正东", "西南", "正南", "东南"];// 方位名称数组
			this.initFlag = true; // 初始化标记（目的：让ocx事件执行一次，即解绑ocx事件）
		};

		FullView.prototype = {
			/**
			 * 初始化全景地图
			 * @author Li Dan
			 * @date   2014-12-17
			 * @return {[type]}   [description]
			 */
			initFullviewMap: function() {
				if (!Variable.fullviewMap) {
					var config = {
						//地图容器，初始化地图时必须填写
						mapContainer: document.getElementById("streetMapId"),
						//底图种类, 默认为基本地图和卫星地图两种；目前仅视频指挥是两种，其他模块均为1种
						baseMapNum: 1
					};
					//将返回值付给全局变量
					var mapObject = PVAMap.initMap(config);
					//赋值给全景地图对象
					Variable.fullviewMap = mapObject.map;
				}
			},
			/**
			 * 相应左侧的“全景跟踪”按钮事件
			 */
			dealOnFullView: function(){
				var self = this;
				//判断是否有视频指挥模块的实时视频的权限，如果有则进入，没有就提示。  by zhangyu 2015.02.11
				if(!pvamapPermission.checkRealStreamPlay("open-full-view")) {
					return;
				}
				//图层切换(进入全景时隐藏非摄像机资源)
				MapOverLayerCtrl.showAndHideOverLayers("on-in-or-out-fullview", true);
				//拥有功能权限，则进入全景模式
				self.openFullview();
				//初始化全景地图
				self.initFullviewMap();
			},
			/**
			 * 绑定事件
			 * @author Li Dan
			 * @date   2014-12-17
			 * @return {[type]}   [description]
			 */
			bindEvents: function() {
				var self = this;
				//关闭全景地图
				jQuery(document).on("click", "#closeStreetmapBtn", function(e) {
					jQuery("#mapId").removeClass("infinity");
					jQuery("#streetMap").addClass("infinity");
					//显示页面拖拽按钮
					jQuery("#sideResize").show();
					//地图重置位置
					Variable.map.updateSize();
					//收起摄相机列表
					jQuery("#street-map-camera-list .title").find(".camera-list-contract-btn").click();
					//关闭播放的视频
					if (Variable.videoPlayerFullview) {
						self.pausePlayAllPositionCameras(true);
						//Variable.videoPlayerFullview.stop(false, 0);
					}
					//归位左侧区域调整拖拽按钮的位置
					jQuery("#sideResize").css({
						left: 280 + "px"
					});
					//图层切换(退出全景时显示进入时显示的非摄像机资源)
					MapOverLayerCtrl.showAndHideOverLayers("on-in-or-out-fullview", false);
					//清除地图上的小红点
					Variable.resourceLayers.cluster.addClusterPoints(e);
				});
			},
			/**
			 * [calculateCameraTreeHeight 计算摄像机树的高度]
			 * @author songxj
			 */
			calculateCameraTreeHeight: function() {
				//设置全景摄像机列表高度
				var height = jQuery(window).height() - 100 - 222 + 86;
				jQuery(".street-map-camera-list").height(height);
				jQuery("#streetMapCameraUl").height(height - 37);
			},
			/**
			 * [bindWindowResize 当窗口大小发生改变的事件]
			 * @author songxj
			 */
			bindWindowResizeEvent: function() { // songxuejie
				var self = this;
				jQuery(window).bind("resize", function() {
					// 计算摄像机树的高度
					self.calculateCameraTreeHeight()
				});
			},
			/**
			 * 打开全景功能
			 */
			openFullview: function() {
				Variable.isFullview = true;
				var StreetMapImg = jQuery("#mapId .map-fullview-img");
				//为了解决鼠标移动过快，图片跟随跟不上的问题，在图片上也绑定鼠标移动事件，by zhangyu on 2015/6/25
				jQuery("#mapId > div.olMapViewport, #mapId .map-fullview-img").off("mousemove").on("mousemove", function(evt) {
					var position = Common.getTooltipPosition(evt);
					StreetMapImg.css({
						left: (position.left - 15) + "px",
						top: (position.top - 55 +86) + "px"
					}).show();
				});
				//隐藏拖拽框
				jQuery("#sideResize").hide();
				//设置全景摄像机列表高度
				this.calculateCameraTreeHeight();
				this.bindWindowResizeEvent();
				//激活鼠标文字跟踪
				Variable.map.activateMouseContext("点击摄像机进入全景模式，右键退出。");
			},
			/**
			 * 全景显示实时视频
			 * @author Li Dan
			 * @date   2014-12-17
			 * @return {[type]}   [description]
			 */
			showFullview: function() {
				var self = this;
				//判断资源权限 by zhangyu on 2015/2/11
				if(!pvamapPermission.checkCameraPermissionById(Variable.currentCameraData.id, "play-real-video-on-full-view")) {
					return;
				}
				//如果进入时左侧的宽度大于280最小宽度，则宽度归位，add by zhangyu, 2014-11-15
				if (jQuery("#sidebar").width() > 280) {
					jQuery("#sidebar").width(280);
					jQuery("#major").css({
						left: 280 + "px"
					});
				}
				//取消提示语
				Variable.map.deactivateMouseContext();
				Variable.isFullview = false;
				//关闭视频窗口
				window.infowindow.closeInfoWindow();
				//摄像机列表置空
				jQuery(".street-map-camera-list ul.list").empty().html('<li class="grey-text">暂无摄像机<li>');
				jQuery("#streetMapCameraUl .scrollbar").addClass("disable");
				//解绑全景
				this.unbindStartFullviewEvent();
				//设置全景小地图中心点和图层级别
				var data = Variable.currentCameraData;
				var center = new NPMapLib.Geometry.Point(data.longitude, data.latitude);
				Variable.fullviewMap.centerAndZoom(center, mapConfig.fullviewZoom);

				//切换模式到全景小地图
				jQuery("#mapId").addClass("infinity");
				jQuery("#streetMap").removeClass("infinity");
				//调整地图的大小
				Variable.fullviewMap.updateSize();
				//播放视频
				//停止上一个视频
				if (!Variable.videoPlayerFullview) {
					//播放视频
					window.player = Variable.videoPlayerFullview = new VideoPlayer({
						layout: 1,
						uiocx: 'UIOCXSTREETMAP'
					});
					Variable.videoPlayerFullview.setLayout(9);
					document.getElementById("UIOCXSTREETMAP").RefreshForGis(100);
				}

				// 设为中心画面 by songxj
				self.setCenterEvent(data, 4);
				// 给视频添加controlbar by songxj
 				ControlBar.bindEvents(Variable.videoPlayerFullview);
 				// 设置为中心画面的按钮事件 by songxj
 				self.bindSetCenterClickEvent();

 				if (self.initFlag) {
 					// 设置为中心画面的视频拖拽事件 by songxj
 					self.bindSetCenterDragEvent();
 					// 视频双击注册事件 by songxj
 					self.bindDblclickEvent();
 					self.initFlag = false;
 				}

 				Variable.videoPlayerFullview.ptzRedArrow(0);
				//日志加载
				logDict.insertLog('m1', 'f1', 'o4', 'b4', data.name + '摄像机',data.name);
			},
			/**
			 * [setMarkersPointByCenterModel 中心点模式(即点击中心画面)下在小地图上撒点]
			 * @author songxj
			 * @param {[type]}   center[中心点]
			 */
			setMarkersPointByCenterModel: function(center) {
				var self = this;
				var centerPoint, pointIcon;
				//居中地图
				Variable.fullviewMap.setCenter(center);
				//清除地图覆盖物
				Variable.fullviewMap.clearOverlays();
				//清空cameraIdMarkerMappingObj的值
				self.cameraIdMarkerMappingObj = {};
				//撒中心点
				centerPoint = new NPMapLib.Symbols.Marker(center);
				centerPoint.setIcon(Constant.fullviewOpera.centerPoint());
				Variable.fullviewMap.addOverlay(centerPoint);
				//遍历左侧树，取各个方向下的所有摄像机（第一台摄像机高亮显示，其他的用正常点显示）
				jQuery(".cameraList li.tree").each(function() {//遍历各个方向
					var liLeafs = jQuery(this).find("ul.camera-list li.leaf");
					var cameraData, point, marker;
					if (liLeafs.length > 0) {
						liLeafs.each(function(index) {//遍历每个方向下的摄像机
							cameraData = liLeafs.eq(index).data();
							if (index === 0) {//取第一台摄像机，在地图上进行高亮撒点
								pointIcon = "hightLight";
							} else { //取其他摄像机，在地图上撒普通点
								pointIcon = "normal";
							}
							self.toggleHighLightNormalIcon(pointIcon, cameraData);
						});
					}
				});
			},
			/**
			 * 顺序播放时在小地图上撒点
			 * @author songxj
			 */
			setMarkersPointByTurn: function() {
				var self = this;
				var pointIcon, cameraData;
				// 清除地图覆盖物
				Variable.fullviewMap.clearOverlays();
				// 清空cameraIdMarkerMappingObj的值
				self.cameraIdMarkerMappingObj = {};
				// 遍历左侧树，取各个方向下的所有摄像机（第一台摄像机高亮显示，其他的用正常点显示）
				jQuery(".cameraList li.tree").each(function() {//遍历各个方向
					if (jQuery(this).find(".play").hasClass("active")) {//当前正在顺序播放的某个方位下的摄像机，撒高亮点
						pointIcon = "hightLight";
					} else {//撒普通点
						pointIcon = "normal";
					}
					// 撒点
					var liLeafs = jQuery(this).find("ul.camera-list li.leaf");
					liLeafs.each(function() {//遍历每个方向下的摄像机
						cameraData = jQuery(this).data();
						self.toggleHighLightNormalIcon(pointIcon, cameraData);
					});

				});
			},
			/**
			 * 点击单个摄像机时在小地图上撒点
			 * @author songxj
			 * @param {[type]}  positionIndex[当前摄像机即将播放的位置]
			 * @param {[type]}  currentCamera[当前播放的摄像机]
			 */
			setMarkersPointByPlaySingleCamera: function(positionIndex, currentCamera) {// 先删除之前方位的那个点，然后再添加那个点
				var self = this;
				var frontCamera;
				// 获取此方位之前的摄像机，将此点由高亮变为普通点(先删除高亮，再添加普通);将当前摄像机的点由普通点变为高亮(先删除普通，再添加高亮)
				frontCamera = player.cameraData[positionIndex];
				if (frontCamera["cId"] === currentCamera["id"]) {//点击的是当前正在播放的，点不变化
					return;
				}
				// 重置正在播放的视频为普通状态
				self.toggleHighLightNormalIcon("normal", frontCamera);
				// 高亮准备播放的视频
				self.toggleHighLightNormalIcon("hightLight", currentCamera);
			},
			/**
			 * 切换地图上的高亮、普通图标
			 * @author songxj
			 * @param  {[type]}  icon[普通点、高亮点的标识]
			 * @param  {[type]}  cameraData[摄像机数据]
			 */
			toggleHighLightNormalIcon: function(icon, cameraData) {
				var markerObj = this.cameraIdMarkerMappingObj,
					cameraId = cameraData.id || cameraData.cId;

				if (cameraId === undefined) {
					return;
				}
				cameraId = cameraId.toString();
				var	pointIcon = icon === "normal" ? Constant.fullviewOpera.normalPoint() : Constant.fullviewOpera.highLightPoint(),
					point = new NPMapLib.Geometry.Point(cameraData.longitude, cameraData.latitude),
					marker = markerObj[cameraId] ? markerObj[cameraId] : new NPMapLib.Symbols.Marker(point);

				//删除marker
				Variable.fullviewMap.removeOverlay(marker);
				// 设置图标
				marker.setIcon(pointIcon);
				// 重新添加marker
				Variable.fullviewMap.addOverlay(marker);

				markerObj[cameraId] = marker;
			},
			/**
			 * 设置为中心画面的拖动事件
			 * @author songxj
			 */
			bindSetCenterDragEvent: function() {
				var self = this;
				Variable.videoPlayerFullview.enableExchangeWindow(false);
				Variable.videoPlayerFullview.on("switchBefore", function(srcIndex, desIndex) {
					if (self.currentVideoModel ===1 && desIndex === 4) {//拖动到中心点
						//获取当前窗口摄像机的数据
						var currentCamera = player.cameraData[srcIndex];
						//设为中心画面
						self.setCenterEvent(currentCamera, srcIndex);
					}
				});
			},
			/**
			 * 视频双击事件（controlbar中的全屏title class切换）
			 * @author songxj
			 */
			bindDblclickEvent: function() { // 视频双击事件注册
				Variable.videoPlayerFullview.on("dblclick", function(index, xPoint, yPoint) {
					var fullScreenIcon = jQuery("#upBlockContent .fullscreen-icon");
					fullScreenIcon.toggleClass("fullViewActive");
					var title = fullScreenIcon.hasClass("fullViewActive") ? '退出全屏' : '全屏';
					fullScreenIcon.attr("title", title);
				});
			},
			/**
			 * 设置为中心画面的图标点击事件
			 * @author songxj
			 */
			bindSetCenterClickEvent: function() {
				var self = this;
				jQuery(document).off("click", "#upBlockContent .center-icon").on("click", "#upBlockContent .center-icon", function() {
					//获取当前窗口摄像机的数据
					var currentWinIndex = player.curChannel;
					//全屏时设置为中心画面的处理
					var fullScreenIcon = jQuery(this).siblings(".fullscreen-icon");
					if (fullScreenIcon.hasClass('fullViewActive')) { // 当前是全屏模式，则先退回到非全屏
						// 先退回到非全屏
						fullScreenIcon.removeClass("fullViewActive").attr('title', "全屏");
						Variable.videoPlayerFullview.setWindowRestore(currentWinIndex);
						// 将全屏窗口index置为-1（获取空闲屏使用）
						Variable.videoPlayerFullview.curMaxWinChannel = -1;
					}

					var currentCamera = player.cameraData[currentWinIndex];
					//设为中心画面
					self.setCenterEvent(currentCamera, currentWinIndex);
				});
			},
			/**
			 * 设置为中心画面
			 * @author songxj
			 * @param {[type]}	currentCamera[当前摄像机]
			 * @param {[type]}	currentWinIndex[当前窗口index]
			 * @param {[type]}	isBackLastCenterModelPlayPic[是否回退到上一次的中心模式播放画面（方位停止按钮）]
			 */
			setCenterEvent: function(currentCamera, currentWinIndex, isBackLastCenterModelPlayPic) {
				var self = this;
				// 设置当前模式为:中心点模式
				self.currentVideoModel = 1;
				// 将方位的停止按钮改为播放(因为当进入中心模式，停止按钮回到上一次的中心模式不再需要)
				jQuery(".positionLine .stop").addClass("play").removeClass("stop");
				// 让各个方位下摄像机播放按钮显示
				self.setSingleCameraPlayBtIsShow();

				// 获取当前摄像机参数
				var longitude = currentCamera.longitude;
				var latitude = currentCamera.latitude;
				var center = new NPMapLib.Geometry.Point(longitude, latitude);
				var centerPoint = new NPMapLib.Symbols.Marker(center);

				// 存储中心点对象
				self.saveCenterModelCenterCameraObj = currentCamera;

				//1.收起当前树
				jQuery(".cameraPositionTree li.tree").removeClass("active").find("ul.camera-list").hide();

				//2.更新左侧树
				self.getAllPositionCameras(centerPoint, center, function() {
					//设置播放按钮是否显示（若方位下有摄像机，则显示；若没有则不显示）
					self.initCamerasPlayIsShow();

					//在地图上撒点
					self.setMarkersPointByCenterModel(center);
					if (currentWinIndex === 4) {//在地图上点击某个摄像机进来和方位停止按钮使用
						if (typeof currentCamera.cId !== "undefined") { // 方位停止按钮回退到除了点击地图上的摄像机第一次进来的中心点
							// 更改播放过的视频参数
							currentCamera.id = currentCamera.cId;
							currentCamera.name = currentCamera.cName;
							currentCamera.cameratype = currentCamera.cType;
							currentCamera.status = currentCamera.cStatus;
						} else { // 在地图上点击某个摄像机进来 和 方位停止按钮回退到地图上点击摄像机第一次进来的中心点
							// 接口返回参数和当前不匹配
							currentCamera.hdChannel = currentCamera.hd_channel;
							currentCamera.sdChannel = currentCamera.sd_channel;
							currentCamera.status = currentCamera.camera_status;
							currentCamera.cameratype = currentCamera.camera_type;
							currentCamera.position = 4;
						}
						/*if (currentCamera.camera_status === 1) {//离线状态，

						}*/
						//播放当前摄像机
						self.playCamera(currentCamera);
					} else {
						//移动当前摄像机
						var tempCurPosition = parseInt(currentWinIndex);
						var replaceWinOption =  {"to": 4, "from": tempCurPosition};
						replaceWinOption = JSON.stringify(replaceWinOption);
						Variable.videoPlayerFullview.replaceWindow(replaceWinOption);
						//改变OCX缓存的当前摄像机
						var srcData = currentCamera;
						srcData.position = 4;
						if (srcData.cName) {
							srcData.cName = self.getCameraPositionName(srcData.cName, 4);
						}
						player.cameraData[4] = srcData;
					}

					//先清除掉各个方位的摄像机
					self.pausePlayAllPositionCameras();
					//播放其他方位的摄像机
					self.playAllPostionCameras();
					//添加左侧摄像机树的click事件
					self.bindLeftCameraClickEvent(center, centerPoint);
				});
			},
			/**
			 * 获取摄像机的名称
			 * @author songxj
			 * @param  {[type]}	positionName[方位名称]
			 * @param  {[type]}	desIndex[摄像机移动的目标窗口index]
			 * @return {[type]} 		[方位+摄像机名称]
			 */
			getCameraPositionName: function(positionName, desIndex) {
				var self = this;
				var name = "";
				var array = self.positionNameArray;
				var frontTwo = positionName.substring(0, 2);//取方位的前两个字符
				var flag = false;
				if (desIndex === 4) {//将视频放到中心点
					if (array.indexOf(frontTwo) === -1) {//顺序播放的视频放到中心点（顺序播放时视频name中没有方位）
						return positionName;
					}
					return positionName.substring(3, positionName.length - 1);
				}
				for (var i = 0, arrayLength = array.length; i < arrayLength; i++) {
					if (array[i] === frontTwo) { //原来的视频在周围8个方位
						flag = true;
						return array[desIndex] + positionName.substring(2);
					}
				}
				if (!flag) {//原来的视频在在中心点
					return array[desIndex] + "（" +positionName + "）";
				}
			},
			/**
			 * 绑定左侧摄像机资源树的click事件
			 * @author songxj
			 * @param  {[type]}	center[中心点point]
			 * @param  {[type]}	centerPoint[中心点marker]
			 */
			bindLeftCameraClickEvent: function(center, centerPoint) {
				var self = this;
				jQuery(".cameraPositionTree")
				.off("click", "i.fold").on("click", "i.fold", function() {// 加号、减号图标事件
					var current = jQuery(this).closest("li");
					if (current.attr("class").indexOf("active") === -1) {// 下拉，加载子元素
						// 将其他相邻分支隐藏
						current.siblings("li.tree").removeClass("active").find("ul.camera-list").hide();
						current.toggleClass("active").find("ul.camera-list").show();
					} else {// 收起
						current.toggleClass("active").find("ul.camera-list").hide();
					}
				})
				.off("click", "li.tree .positionLine .play").on("click", "li.tree .positionLine .play", function() {//点击各个方位的播放
					// 当前视频模式：顺序播放
					self.currentVideoModel = 2;
					//让各个方位下摄像机播放按钮隐藏(因为当播放某个方位的摄像机时，不能再点击方位下的某个摄像机)
					self.setSingleCameraPlayBtIsShow();

					// 添加active目的是撒点用
					jQuery(this).addClass("active").closest("li.tree").siblings("li.tree").find(".play").removeClass("active");
					// 展开当前树
					var currentTree = jQuery(this).closest("li");
					currentTree.siblings("li.tree").removeClass("active").find("ul.camera-list").hide();
					currentTree.toggleClass("active").find("ul.camera-list").show();

					// 获取此方位下的所有摄像机,并且在右侧依次播放
					var cameraList = jQuery(this).closest("li.tree").find("ul.camera-list");
					self.playCameraListByTurn(cameraList);
					// 撒点 注意：此处要将正在播的方位下的摄像机全部撒为高亮，其他方位下的摄像机为普通
					self.setMarkersPointByTurn();
					//将当前的播放按钮变为停止按钮，其他方位的按钮变为播放
					jQuery(this).addClass("stop").removeClass("play").closest("li.tree").siblings("li.tree").find(".stop").addClass("play").removeClass("stop");
				})
				.off("click", "li.tree .positionLine .stop").on("click", "li.tree .positionLine .stop", function() { // 某个方位的停止
					// 回到上一次中心点最近的8个方向的播放画面
					var cameraData = self.saveCenterModelCenterCameraObj;
					self.setCenterEvent(cameraData, 4, true);
					//将当前的停止按钮变为播放按钮
					jQuery(this).addClass("play").removeClass("stop");
				})
				.off("mouseover", "li.tree .positionLine").on("mouseover", "li.tree .positionLine", function() { // 鼠标移上方位的事件
					// 此方位下的所有摄像机在地图上高亮
					var leafs = jQuery(this).closest("li.tree").find("ul.camera-list li.leaf");
					if (leafs.length > 0) {
						leafs.each(function() {
							var data = jQuery(this).data();
							self.toggleHighLightNormalIcon("hightLight", data);
						});
					}
				})
				.off("mouseout", "li.tree .positionLine").on("mouseout", "li.tree .positionLine", function() { // 鼠标移出方位的事件
					// 此方位下的所有摄像机在地图上还原为上一次的状态（如果摄像机正在播放，则还原为高亮；否则还原为正常）
					var playingCameraDatas = Variable.videoPlayerFullview.cameraData;
					var playingCameraIds = playingCameraDatas.map(function(item) {
						if (item === -1) {
							return -1;
						}
						return item.cId;
					})
					var leafs = jQuery(this).closest("li.tree").find("ul.camera-list li.leaf");
					if (leafs.length > 0) {
						leafs.each(function() {
							var data = jQuery(this).data();
							var cameraId = data.id;
							if (playingCameraIds.indexOf(cameraId) > -1) { // 此摄像机正在播放列表中
								self.toggleHighLightNormalIcon("hightLight", data);
							} else {
								self.toggleHighLightNormalIcon("normal", data);
							}
						});
					}
				})
				.off("click", "li.leaf .play").on("click", "li.leaf .play", function() {// 点击方位下单个摄像机的事件
					self.initPlaySingleCameraEvent(jQuery(this));
				})
				.off("mouseover", "li.leaf").on("mouseover", "li.leaf", function() {// 鼠标移上单个摄像机的事件
					// 将此摄像机设置为高亮
					var data = jQuery(this).data();
					self.toggleHighLightNormalIcon("hightLight", data);
				})
				.off("mouseout", "li.leaf").on("mouseout", "li.leaf", function() {// 鼠标移出单个摄像机的事件
					// 将此摄像机在地图上还原为上一次的状态（如果摄像机正在播放，则还原为高亮；否则还原为正常）
					var playingCameraDatas = Variable.videoPlayerFullview.cameraData;
					var playingCameraIds = playingCameraDatas.map(function(item) {
						if (item === -1) {
							return -1;
						}
						return item.cId;
					})
					var data = jQuery(this).data();
					var cameraId = data.id;
					if (playingCameraIds.indexOf(cameraId) > -1) { // 此摄像机正在播放列表中
						self.toggleHighLightNormalIcon("hightLight", data);
					} else {
						self.toggleHighLightNormalIcon("normal", data);
					}
				})
			},
			/**
			 * 设置单个摄像机播放按钮的显示隐藏
			 * @author songxj
			 */
			setSingleCameraPlayBtIsShow: function() {
				var self = this;
				if (self.currentVideoModel === 1) { // 中心点模式下显示
					jQuery("li.leaf").removeClass("stop").removeClass("disabled").addClass("enabled");
				} else { // 方位顺序播放时隐藏
					jQuery("li.leaf").removeClass("enabled").addClass("disabled");
				}
			},
			/**
			 * 初始化播放单个摄像机事件
			 * @author songxj
			 * @param  {[type]}	me[摄像机名称]
			 */
			initPlaySingleCameraEvent: function(me) {
				var self = this;
				//准备撒点和播放摄像机的参数
				var currentLeaf = me.closest("li.leaf");
				var data = currentLeaf.data();
				var currentCamera = Object.create(data);
				var currentTree = me.closest("li.tree");
				var positionName = currentTree.data("position");
				var positionIndex = self.cameraPositionParamsObj[positionName][0];
				currentCamera.position = positionIndex;
				//修改摄像机title(由方位+name构成)
				var positionName = currentTree.find(".position-name").text();
				currentCamera.name = positionName+"（"+currentCamera.name+"）";
				currentCamera.hdChannel = currentCamera.hdchannel;
				currentCamera.sdChannel = currentCamera.sdchannel;
				//1.撒点 注意：此处必须先撒点再播放 因为此处的撒点事删除之前的点（靠当前正在播放的摄像机中获取），再添加当前的点
				self.setMarkersPointByPlaySingleCamera(positionIndex, currentCamera);
				//2.播放当前摄像机 在右侧对应位置显示
				self.playCamera(currentCamera);
			},
			/**
			 * 初始化各个方位的摄像机的播放图标是否显示
			 * @author songxj
			 * @return {[type]}
			 */
			initCamerasPlayIsShow: function() {
				jQuery(".cameraList li.tree").each(function() {
					var liLeafs = jQuery(this).find("ul.camera-list li.leaf");
					if (liLeafs.length > 0) {
						jQuery(this).find(".positionLine").removeClass("disabled").addClass("enabled");
					} else {
						jQuery(this).find(".positionLine").removeClass("enabled").addClass("disabled");
					}
				});
			},
			/**
			 * 播放摄像机
			 * @author songxj
			 * @param  {[type]}	data[摄像机数据]
			 */
			playCamera: function(data) {
				var viewPlayObj = {
					'hdChannel': data.hdChannel, //高清通道
					'sdChannel': data.sdChannel, //标清通道
					'cId': data.id,
					'cName': data.name,
					'cType': data.cameratype,
					'cStatus': data.status, //摄像机在线离线状态
					'latitude': data.latitude,
					'longitude': data.longitude
				};
				if (typeof data.position !== "undefined") {
					viewPlayObj.position = data.position;
				}
				Variable.videoPlayerFullview.setFreePath(viewPlayObj);
			},
			/**
			 * 终止播放视频时的手动聚焦
			 * @author songxj
			 */
			breakManualFocusChannel: function() {
				Variable.videoPlayerFullview.manualFocusChannel = -1;
			},
			/**
			 * [pausePlayAllPositionCameras 停止播放8个方位的摄像机]
			 * @author songxj
			 * @param  {Boolean} isCloseCenter [是否停止中心点的视频]
			 */
			pausePlayAllPositionCameras: function(isCloseCenter) {
				for (var i = 0; i < 9; i++) {
					if (!isCloseCenter) {
						if (i === 4) {
							continue;
						}
					}

					(function(index) {
						Variable.videoPlayerFullview.setStyle(0, index);
						Variable.videoPlayerFullview.stopStream(index);
						Variable.videoPlayerFullview.cameraData[index] = -1;
					})(i);
				}
			},
			/**
			 * 停止播放指定方位的摄像机
			 * @author songxj
			 * @param  {[type]}	position[摄像机播放的方位]
			 */
			pausePlayPCameraByPosition: function(position) {
				Variable.videoPlayerFullview.setStyle(0, position);
				Variable.videoPlayerFullview.stopStream(position);
				Variable.videoPlayerFullview.cameraData[position] = -1;
			},
			/**
			 * 播放8个方位的摄像机（中心模式）
			 * @author songxj
			 */
			playAllPostionCameras: function() {
				var self = this, delayTimeSpan = 100;
				//从左侧树中获取8个方位的第一台摄像机
				jQuery(".cameraList>li.tree ul.camera-list").each(function(index, item) {
					var currentTree = jQuery(this).closest("li.tree");
					var position = currentTree.data("position");
					var positionIndex = self.cameraPositionParamsObj[position][0];
					var data = jQuery(this).find("li.leaf:first").data();
					if (data) {
						var positionName = currentTree.find(".position-name").text();
						/*setTimeout(function(){
							self.playCamera(cameraData);
						}, delayTimeSpan * index);*/
						self.organizeCameraParamsAndPlay(data, positionName, positionIndex);
					}
				});
			},
			/**
			 * 依次播放当前列表下的摄像机（非中心模式）
			 * @author songxj
			 * @param  {[type]}	cameraList[摄像机树列表]
			 */
			playCameraListByTurn: function(cameraList) {
				var self = this;
				//停止中心点的摄像机
				self.pausePlayPCameraByPosition(4);
				//停止播放所有方位的摄像机
				self.pausePlayAllPositionCameras();
				//中断播放时的手动聚焦
				self.breakManualFocusChannel();
				//按照顺序播放时禁止视频拖动
				Variable.videoPlayerFullview.enableExchangeWindow(false);
				//播放所有摄像机 此时的摄像机名称中没有方位
				var currentTree = cameraList.closest("li.tree");
				var position = currentTree.data("position");
				cameraList.find("li.leaf").each(function() {
					var data = jQuery(this).data();
					if (data) {
						self.organizeCameraParamsAndPlay(data);
					}
				});
			},
			/**
			 * 组织摄像机参数并播放
			 * @author songxj
			 * @param  {[type]}	data[摄像机数据]
			 * @param  {[type]}	positionName[方位名称]
			 * @param  {[type]}	positionIndex[方位index]
			 */
			organizeCameraParamsAndPlay: function(data, positionName, positionIndex) {
				var self = this;
				var cameraData = Object.create(data);
				if (typeof positionIndex !== "undefined") {
					cameraData.position = positionIndex;
				}
				if (typeof positionName !== "undefined") {
					cameraData.name = positionName+"（"+cameraData.name+"）";
				}
				cameraData.hdChannel = cameraData.hdchannel;
				cameraData.sdChannel = cameraData.sdchannel;
				self.playCamera(cameraData);
			},
			/**
			 * 查询8个方位的摄像机
			 * @author songxj
			 * @param  {[type]} centerPoint[中心点marker]
			 * @param  {[type]} center[中心点point]
			 * @param  {Function} callback[回调函数]
			 */
			getAllPositionCameras: function(centerPoint, center, callback) {
				var self = this;
				var lon = centerPoint._position.lon;
				var lat = centerPoint._position.lat;
				var positionObj = self.cameraPositionParamsObj;
				var upParam, points;
				var ajaxDataArr = [];
				for (var key in positionObj) {
					if (key === "center") {
						continue;
					}

					if (positionObj.hasOwnProperty(key)) {
						upParam = positionObj[key];
						points = Common.getPoints([lon, lat], 0.01, upParam[1], upParam[2], upParam[3]);
						ajaxDataArr.push({
							geometry: Common.convertArrayToGeoJson(points, "Polygon"),
							centerPoint: center,
							position: upParam[0],
							key: key
						})
					}
				}

				pubsub.publish("getPositionCameras", {
					ajaxDataArr: ajaxDataArr,
					callback: callback
				});
			},
			setPosOnFullViewMap: function(center) {
				//清除地图覆盖物
				if (Variable.fullMark) {
					Variable.fullviewMap.removeOverlay(Variable.fullMark);
				}
				//根据当前的点击对象配置信息
				Variable.fullMark = new NPMapLib.Symbols.Marker(center);
				Variable.fullMark.setIcon(Constant.symbol.markerViweSymbol());
				Variable.fullviewMap.addOverlay(Variable.fullMark);
				Variable.fullviewMap.setCenter(center);
			},
			//获取范围内的摄像机
			getSectorCamera: function(points, center, position, key) {//position:视频播放的窗口位置,key:为cameraPositionParamsObj对象的key，即树的class
				var centerPoint = center;
				//坐标转换
				points = Common.convertArrayToGeoJson(points, "Polygon");
				//发布请求 获取区域范围内的摄像机
				pubsub.publish("getSectorCameras", {
					geometry: points,
					centerPoint: centerPoint,
					position: position,
					key: key
				});
			},
			/**
			 * 设置区域范围内的摄像机
			 * @author Li Dan
			 * @date   2014-12-17
			 */
			setSectorCameras: function(res, centerPoint, position, key) {
				var self = this;
				if (res.data.cameras.length > 0) {
					for (var i = 0; i < res.data.cameras.length; i++) {
						var point = new NPMapLib.Geometry.Point(res.data.cameras[i].longitude, res.data.cameras[i].latitude);
						var meter = Math.round(Variable.map.getDistance(centerPoint, point));
						res.data.cameras[i].meter = meter;
					}
				  //排序
	                res.data.cameras.sort(function(a,b){
	                    return a.meter-b.meter;
	                });
				}
				//jQuery(".street-map-camera-list").show();
				//jQuery(this.currentClickLeftTreeLi).find("ul.camera-list").show();
				var cameras = Variable.template({
					fullviewCameras: res.data
				})
				jQuery(".cameraPositionTree li.tree." + key).find("ul.camera-list").empty().html(cameras);
				if (res.data.cameras.length === 0) {}

				//显示摄像机列表
				if (!jQuery(".camera-list-contract-btn").hasClass("down")) {
					jQuery(".camera-list-contract-btn").trigger("click");
				}
			},
			/**
			 * [calculateOnlineCamerasCount 计算摄像机的在线数量]
			 * @author songxj
			 * @param  {[type]} cameras [某个方位下的摄像机]
			 * @return {[type]}         [摄像机的数量]
			 */
			calculateOnlineCamerasCount: function(cameras) {
				var count = 0;
				for (var i = 0; i < cameras.length; i++) {
					if (cameras[i].camera_status === 0) { // 摄像机在线
						count++;
					}
				}
				return count;
			},
			/**
			 * [camerasCountStatistic 方位摄像机数量统计]
			 * @author songxj
			 * @param  {[type]} cameras  [单个方位的摄像机]
			 * @param  {[type]} position [在右侧播放的屏幕序号]
			 */
			camerasCountStatistic: function(cameras, position) {
				var self = this,
					onlineCount,
					totalCount;
				if (cameras) {
					var positionName = self.positionNameArray[position]
					var treeElems = jQuery("ul.cameraList>li.tree");
					var currentPositionElem;
					treeElems.each(function() {
						if (positionName === jQuery(this).find(".position-name").text()) {
							currentPositionElem = jQuery(this);
							return false;
						}
					});

					if (cameras.length === 0) {
						onlineCount = 0;
						totalCount = 0;
					} else {
						totalCount = cameras.length;
						onlineCount = self.calculateOnlineCamerasCount(cameras);
					}
					currentPositionElem.find(".online-count").text(onlineCount);
					currentPositionElem.find(".total-count").text(totalCount);
				}

			},
			/**
			 * 加载tree的8个方位摄像机的DOM
			 * @author songxj
			 * @param {[type]}	resultArr[返回结果]
			 * @param {[type]}	paramsArr[参数]
			 * @param {Function}	callback[回调函数]
			 */
			setPositionCameras: function(resultArr, paramsArr, callback) {
				var self = this,
					res,
					key,
					centerPoint,
					position,
					cameras = [];
				for (var j = 0; j < resultArr.length; j++) {
					res = resultArr[j];
					key = paramsArr[j].key;
					centerPoint = paramsArr[j].centerPoint;
					position = paramsArr[j].position;
					cameras = res.data ? (res.data.cameras || []) : [];
					if (cameras.length > 0) {
						for (var i = 0; i < cameras.length; i++) {
							var item = cameras[i];
							var point = new NPMapLib.Geometry.Point(item.longitude, item.latitude);
							var meter = Math.round(Variable.map.getDistance(centerPoint, point));
							cameras[i].meter = meter;

						}
					  	//排序
	                  	cameras.sort(function(a,b){
	                    	return a.meter-b.meter;
	                 	});
	                  	//取前9条摄像机数据
	                	cameras = cameras.slice(0, 9);
					}
					// 统计摄像机的数量
	                self.camerasCountStatistic(cameras, position);
					//jQuery(".street-map-camera-list").show();
					//jQuery(this.currentClickLeftTreeLi).find("ul.camera-list").show();
					var camerasHtml = Variable.template({
						fullviewCameras: {cameras: cameras}
					})
					jQuery(".cameraPositionTree li.tree." + key).find("ul.camera-list").empty().html(camerasHtml);
					if (cameras.length === 0) {
					}
				}
				callback && callback();
			},
			//解除全景前置事件：包括悬浮事件、点击事件
			unbindStartFullviewEvent: function(config) {
				jQuery("#mapId > div.olMapViewport").off("mousemove");

				jQuery("#mapId .map-fullview-img").hide();
				Variable.isFullview = false;
			},
			//设置全景时ocx的高宽度
			setFullviewOCX: function() {
				if (jQuery("#streetMap").is(":visible")) {
					var width = jQuery("#streetMap .map-fullview").width(),
						height = jQuery("#streetMap .map-fullview").height();
					jQuery("#UIOCXSTREETMAP").width(width).height(height);
				}
			}
		};

		return new FullView();
	});
