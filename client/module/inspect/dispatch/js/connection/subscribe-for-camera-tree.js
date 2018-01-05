/**
 * Created by Zhangyu on 2015/4/30.
 */
define([
	"js/npmap-new/map-variable",
	"js/npmap-new/map-common",
	"js/npmap-new/map-permission",
	"js/npmap-new/map-const",
	"js/npmap-new/map-common-overlayer-ctrl",
	"/module/inspect/monitor/js/tree-subscribe.js",
	'js/sidebar/map-video-play-bar',
	"pubsub",
	"jquery"
], function(Variable, MapCommon, pvamapPermission, Constant, MapOverLayerCtrl, treeCtrl,MapVideoPlay, Pubsub, jQuery) {

	return (function (scope, $) {
		/*资源树双击叶子节点按钮*/
		Pubsub.subscribe("Tree-dblclick-leaf", function (message, data) {
			//地图上的定位播放
			scope.playVideoOnMap($(data.elm).closest("li").data(), data);
		});
		/*资源树单击叶子节点按钮*/
		Pubsub.subscribe("Tree-click-leaf", function (message, data) {

			var curData = $(data.elm).closest("li").data();
			//清空左侧树上的勾选标记
			$(".node.selected").each(function () {
				if ($(this).data("id") !== curData.id) {
					$(this).removeClass("selected");
				}
			});
			//地图上显示摄像机位置
			scope.showLocationOnMap(curData);
		});
		/*资源树点击“实时预览”按钮*/
		Pubsub.subscribe("Tree-click-play", function (message, data) {
			scope.playVideoOnMap($(data.elm).closest("li").data(), data);
		});
		/*资源树点击“布防设置”按钮*/
		Pubsub.subscribe("Tree-click-defend", function(message, data) {
			_curTreeCtrl.defend(data.elm);
		});
		/*资源树点击“添加到我的分组”按钮*/
		Pubsub.subscribe("Tree-click-appendToGroup", function(message, data) {
			var node = $(data.elm).closest(".node");
			var cameraId = node.data("id");
			var parent = $(data.elm);
			node.siblings().removeClass("opened");
			_curTreeCtrl.appendToGroup(cameraId, parent);
		});
		/*资源树点击“发送到电视墙”按钮*/
		Pubsub.subscribe("Tree-click-tvwall", function(message, data) {
			_curTreeCtrl.appendTvwall(data.elm);
		});
		/**
		 * 扩展屏关闭时，清除左侧树勾选标记
		 */
		Pubsub.subscribe("clearAllMark", function() {
			//扩展屏关闭，全部清除
			for (var i = 0; i < _cameraIdsOnScreen.length; i++) {
				jQuery(".node.selected[data-id='" + _cameraIdsOnScreen[i] + "']").removeClass("selected");
			}
		});
		/**
		 * 扩展屏播放时，对于覆盖播放的摄像机，发送回传事件，清除左侧树标记
		 */
		BroadCast.on("clearSelectMark", function(data) {
			//扩展屏上单个视频关闭
			if (data.cId) {
				jQuery(".node.selected[data-id='" + data.cId + "']").removeClass("selected");
			}
		});
		/**
		 * 扩展屏播放时，记录在扩展屏上的摄像机id数组，以备扩展屏关闭时，清除左侧树勾选标记
		 */
		BroadCast.on("saveCameraidsOnSreen", function(arr) {
			_cameraIdsOnScreen = arr;
		});


		var //左侧树的控制器
			_curTreeCtrl = window.treeCtrl = new treeCtrl(null),
			//存储扩展屏上播放的摄像机id串
			_cameraIdsOnScreen = [],
			/**
			 * 包装信息
			 * @param data - 待包装的数据
			 * @private
			 */
			_extendData = function(data){
				data.subType = "resource";
				data.type = "tempmarker";
			};
			/**
			 * 双击左侧树播放视频
			 * @param data - 地图定位播放的数据
			 * @param domData - 节点dom数据
			 */
			scope.playVideoOnMap = function (data, domData) {
				//选中当前节点
				domData && $(domData.elm).closest("li").addClass("selected");
				//包装信息
				_extendData(data);
				if(data.installaddress){
					data.installAddress = data.installaddress;
				}
				//验证坐标是否存在
				var longitude = data.longitude, latitude = data.latitude;
				if (longitude && latitude) {
					//检查坐标合法性
					if (!mapConfig.checkPosIsCorrect(longitude, latitude)) {
						return;
					}
					//在缩放之前关闭窗口,以解决ocx地图信息窗播放在缩放后关闭造成ocx画面残留的问题，add by zhangyu, 2014-10-31
					if (typeof(window.infowindow) === "object") {
						window.infowindow.closeInfoWindow("", "on-open");
					}
					//定义中心点
					var pt = new NPMapLib.Geometry.Point(longitude, latitude);
					//点击左侧摄像机资源时，缩放地图层级并居中该点
					MapCommon.centerAndZoomOnShowInfowin(pt);
					//清除图层环境
					MapOverLayerCtrl.showAndHideOverLayers("on-click-left-resource-item");
					//显示资源定位图层
					if (!window.map.getLayerByName("camera-resource-layer").getVisible()) {
						Variable.layers.resourceShowLayer.removeAllOverlays();
						Variable.layers.resourceShowLayer.show();
						data.markerType = "map-marker";
					} else {
						Variable.layers.resourceShowLayer.hide();
						data.markerType = "resource-marker";
					}
					//显示图标
					var marker = new NPMapLib.Symbols.Marker(pt);
					marker.setIcon(Constant.symbol.markerSymbol());
					marker.setData(data);
					Variable.layers.resourceShowLayer.addOverlay(marker);
					//清除掉之前地图上定位播放摄像机的勾选标记
					if(Variable.currentCameraData) {
						$(".node.selected[data-id='" + Variable.currentCameraData.id + "']").removeClass("selected");
					}
					//将该标注作为当前活动摄像机
					Variable.currentCameraData = data;
					//判断是否有视频指挥模块的实时视频的权限，如果有则进入，没有就提示。  by zhangyu 2015.02.11
					if (!pvamapPermission.checkRealStreamPlay("map-camera-click-on-cache")) {
						return;
					}
					//播放视频
					MapCommon.showCameraInfoAndPlay(marker);
				} else {
					//提示无点位信息
					//notify.warn("该摄像机暂无点位信息。");
					//判断是否有视频指挥模块的实时视频的权限，如果有则进入，没有就提示。  by zhangyu 2015.02.11
					if (!pvamapPermission.checkRealStreamPlay("map-camera-click-on-cache")) {
						return;
					}
					//清除掉之前地图上定位播放摄像机的勾选标记
					if(Variable.currentCameraData) {
						$(".node.selected[data-id='" + Variable.currentCameraData.id + "']").removeClass("selected");
					}
					Variable.currentCameraData = data;
					MapCommon.showSingleCameraInfoAndPlay();
					logDict.insertMedialog("m1", "查看：" + data.name + "->摄像机实时视频", "f2", "o4", data.name);
					return;
					//获取摄像机信息
					var cameraData = data;
					//格式化信息
					var playData = {
						'layout': 4,
						'cameras': [{
							hdChannel: cameraData.hdchannel || cameraData.hd_channel,
							sdChannel: cameraData.sdchannel || cameraData.sd_channel,
							cId: cameraData.id,
							cName: cameraData.name,
							cType: cameraData.cameratype || cameraData.camera_type,
							cCode: cameraData.cameracode || cameraData.cameraCode,
							cStatus: cameraData.cstatus || cameraData.camera_status //摄像机在线离线状态 0-有 1-全部通道不可用
						}]
					};
					var screenNum = window.JudgeExpand();
					if (screenNum === 1 || window.isPointPlay) { //单屏
						var player;
						if (jQuery("#map-video-play-bar").length === 0) {
							player = MapVideoPlay.init("noPoint");
						}
						//如果从地图信息窗上发送到扩展屏后，此处this.player仍未注册，此时jQuery("#map-video-play-bar").length判断为false，后续报错
						if(!player) {
							player = Variable.mapVideoBarPlayer;
						}
						Variable.mapVideoBarPlayer = player;
						var index = player.getFreeIndex();
						//如果有覆盖掉视频，则清除之前视频对应的左侧树标记
						if(player.cameraData[index] !== -1) {
							console.log("player.cameraData[index]:",player.cameraData[index]);
							$(".node.selected[data-id='" + player.cameraData[index].cId + "']").removeClass("selected");
						}
						console.log("控制画面比例",window.ocxDefaultRatio);
						player.playerObj.SetRatio(2,-1);
						//弹出地图播放栏并播放
						if (jQuery(".bar-control").hasClass("down")) {
							//弹起
							jQuery(".bar-control div.video-play-column-bt").trigger("click");
							//播放
							player.playSH(playData.cameras[0], index);
						} else {
							//播放
							player.playSH(playData.cameras[0], index);
						}
						MapVideoPlay.writeTitle({
							'index': index,
							'title': playData.cameras[0].cName
						});

					} else { //多屏
						window.noPointPlay(BroadCast, playData);
					}
					logDict.insertMedialog("m1", "查看：" + data.name + "->摄像机实时视频", "f2", "o4", data.name);
				}
			};
		/**
		 * 单机左侧树在地图上显示摄像机位置
		 * @param data - 地图定位播放的数据
		 */
		scope.showLocationOnMap = function(data) {
			//包装信息
			_extendData(data);
			//验证坐标是否存在
			var longitude = data.longitude,
				latitude = data.latitude;
			if (longitude && latitude) {
				//检查坐标合法性
				if (!mapConfig.checkPosIsCorrect(longitude, latitude)) {
					return;
				}
				//在缩放之前关闭窗口,以解决ocx地图信息窗播放在缩放后关闭造成ocx画面残留的问题，add by zhangyu, 2014-10-31
				if (typeof(window.infowindow) === "object") {
					window.infowindow.closeInfoWindow("", "on-open");
				}
				//定义中心点
				var pt = new NPMapLib.Geometry.Point(longitude, latitude);
				//点击左侧摄像机资源时，缩放地图层级并居中该点
				MapCommon.centerAndZoomOnShowInfowin(pt);
				//刷新图标
				//_refreshMarker(data);
			} else {
				notify.warn("该摄像机没有坐标信息！");
			}
		};

		return scope;

	}({}, jQuery));
});