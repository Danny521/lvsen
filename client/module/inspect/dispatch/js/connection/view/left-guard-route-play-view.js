/**
 * Created by Zhangyu on 2015/5/7.
 */
define([
	"js/npmap-new/view/task-guard-route-play-view",
	"js/npmap-new/view/task-guard-route-timer-view",
	"js/connection/view/left-guard-route-deal-play",
	"js/npmap-new/map-permission",
	"js/npmap-new/map-variable",
	"jquery",
	"pubsub"
], function (MapRoutePlayView, GuardRoutePlayTimer, DealRoutePlay, pvamapPermission, Variable, jQuery, PubSub) {

	return (function (scope, $) {
		//初始化地图相关
		MapRoutePlayView.init(scope);
		//初始化播放处理过程
		DealRoutePlay.init(scope, MapRoutePlayView);

		var //保存左侧分组页面控制对象
			_leftGroupPanel = null;


		var /**
			 * 播放警卫路线前的准备工作
			 * @param cameras - 待播放的摄像机列表
			 * @returns {boolean} - 是否可以继续播放
			 * @private
			 */
			_beforPlayRoute = function (cameras) {
				if (cameras.length > 0) {
					//清楚掉之前的逻辑(如果有在地图上播放相关的逻辑)
					if(window.infowindow.checkInfoWindowExists()){
						window.infowindow.closeInfoWindow()
					}
					//禁用其他业务功能，如右侧地图工具栏、左侧上部的功能导航
					$("#map-tool-right").hide();
					$("#sidebar").find(".np-sidebar-header").append("<li class='play-route-tips np-play-route-tips'><i class='running'></i>警卫路线播放中...</li>");
				} else {
					notify.warn("该路线没有摄像机！");
					return false;
				}
				return true;
			},
			/**
			 * 在地图上播放警卫路线摄像机的上一个或者下一个
			 * @param $btnDom - 当前上一个下一个按钮文档元素
		     * @param type - prev or next
			 * @private
			 */
			_playPrevOrNextCameraOnMap = function($btnDom, type) {
				var $stopBtn = $btnDom.closest(".np-group-camera-content").find(".np-group-camera-list .camera-item-button .camera-stop"),
					$curCameraItem = $stopBtn.closest("li.np-group-route-camera-item");
				if ($stopBtn[0]) {
					var $prevOrNextCamera = (type === "prev") ? $curCameraItem.prev() : $curCameraItem.next();
					//如果上一个、下一个dom存在
					if ($prevOrNextCamera[0]) {
						var cameraData = $prevOrNextCamera.data();
						//判断摄像机坐标
						if (cameraData.longitude && cameraData.latitude) {
							//更新播放样式
							$stopBtn.removeClass("camera-stop").addClass("camera-play").attr("title", "播放实时视频");
							//播放摄像机视频
							$prevOrNextCamera.find(".camera-item-button .camera-play").trigger("click");
						} else {
							notify.warn("该摄像机没有坐标信息！");
						}
					} else {
						notify.warn("当前播放视频已是" + ((type === "prev") ? "第一个" : "最后一个") + "视频！");
					}
				} else {
					notify.warn("当前路线的摄像机列表中没有正在播放的视频，</br>暂无" + ((type === "prev") ? "上一个" : "下一个") + "视频！");
				}
			},
			/**
			 * 在扩展屏上播放警卫路线摄像机的上一个或者下一个
			 * @param $btnDom - 当前上一个下一个按钮文档元素
			 * @param type - prev or next
			 * @private
			 */
			_playPrevOrNextCameraOnExtendScreen = function($btnDom, type) {
				var $guardRoute = $btnDom.closest("li.np-route-item");
				var routeId = $guardRoute.data("id");
				if (routeId) {
					var screenIndex = GuardRoutePlayTimer.getExtendScreenByRouteId(routeId);
					if (screenIndex) {
						var cameraId = GuardRoutePlayTimer.activeCameraIds[screenIndex];
						//判断资源权限 by zhangyu on 2015/2/12
						if(!pvamapPermission.checkCameraPermissionById(cameraId, "play-pre-video-byscreen-on-gaurdroute")) {
							return;
						}
						var $camera = $guardRoute.find(".np-group-camera-content .np-group-camera-list li.np-group-route-camera-item[data-id='" + cameraId + "']");
						if ($camera[0]) {
							var currentCamera = (type === "prev") ? $camera.prev() : $camera.next();
							if (currentCamera[0]) {
								//设置左边列表元素活动
								currentCamera.addClass("active").siblings().removeClass("active");
								//高亮设置当前活动摄像机
								if (Variable.guardRouteCurrShowID === routeId) {
									MapRoutePlayView.setActiveCameraOnMap(currentCamera.data());
								}
								//获取正在播放的警卫路线数
								var playingNum = scope.getPlayingGuardrouteNum();
								//手动播放警卫路线
								DealRoutePlay.playSingleRouteByHand(screenIndex, playingNum, currentCamera.data(), $guardRoute, routeId);
							} else {
								notify.warn("当前播放视频已是" + ((type === "prev") ? "第一个" : "最后一个") + "视频！");
							}
						}
					}
				}
			},
			/**
			 * 关闭扩展屏或者地图播放栏时，停止播放警卫路线
			 * @private
			 */
			_stopAllPlayingRoute = function() {
				var timerList = GuardRoutePlayTimer.getTimers(), isRoutePlaying;
				for (var item in timerList) {
					_stopSingleGuardRoute(item);
					isRoutePlaying = true;
				}
				isRoutePlaying && notify.warn("警卫路线播放结束");
			},
			/**
			 * 根据警卫路线id停止警卫路线播放
			 * @param routeId - 警卫路线id
			 * @private
			 */
			_stopSingleGuardRoute = function(routeId) {
				var $RouteLI = $("li.np-route-item[data-id='" + routeId + "']");
				//如果当前还有其他警卫路线在播放，则不清除公共部分
				if(scope.getPlayingGuardrouteNum() === 1) {
					//标记用户已停止播放警卫路线(释放功能)
					Variable.isUserDoPlayRoute = false;
					//清除图层上的覆盖物
					MapRoutePlayView.clearCameraOfGuardRoute();
					//显示播放时禁用的功能（地图工具栏）和左上角头
					$("#map-tool-right").show();
					$("#sidebar").find(".np-sidebar-header").children(".np-play-route-tips").remove();
				}
				//显示上一个下一个按钮，(事件绑定在地图上播放)
				$RouteLI.find(".np-play-opera").removeClass("play-on-extendscreen").addClass("play-camera-list").show();
				//取消定时器
				GuardRoutePlayTimer.clearTimer(routeId);
				//取消左边列表高亮行
				$RouteLI.find(".np-group-camera-list li").removeClass("active");
				//更新按钮样式
				$RouteLI.find(".np-route-item-opera button").eq(0).removeClass("restore-play camera-pause").attr("title", "播放").addClass("camera-play");
				//获取当前屏幕
				var screenIndex = GuardRoutePlayTimer.getExtendScreenByRouteId(routeId);
				//关闭警卫路线
				DealRoutePlay.stopVideoOnExtentScreen(routeId);
				//设置摄像机索引为-1
				GuardRoutePlayTimer.activeCameras[screenIndex] = -1;
				//清除当前GPS信息
				GuardRoutePlayTimer.currGpsInfo[screenIndex] = null;
				//设置当前摄像机ID为-1
				GuardRoutePlayTimer.currCameraId[screenIndex] = -1;
				//设置GPS模式为TRUE
				GuardRoutePlayTimer.gpsPlayMode[screenIndex] = true;
				//将该屏置为未用
				GuardRoutePlayTimer.setExtendScreenToUnused(routeId);
				//提示
				notify.warn("警卫路线播放结束");
			};
		/**
		 * 触发按钮事件，开始播放警卫路线
		 */
		scope.tiggerPlayGuardRoute = function () {
			var $this = $(this);
			//如果此时有地图播放栏逻辑，则先关闭之
			jQuery('.np-map-play-bar-close').trigger('click');
			//标记用户已经在播放警卫路线(禁用功能)
			Variable.isUserDoPlayRoute = true;
			//收集信息
			var $RouteLI = $this.closest("li.np-route-item"), routeId = $RouteLI.data("id"), screenId;
			//判断暂停还是播放
			if ($this.hasClass("camera-play")) {
				//判断是否是恢复播放
				if ($this.hasClass("restore-play")) {
					//恢复播放
					if ($RouteLI) {
						//显示上一个下一个按钮，(事件绑定在地图上播放)
						$RouteLI.find(".np-play-opera").removeClass("play-on-extendscreen").addClass("play-camera-list");
						screenId = GuardRoutePlayTimer.getExtendScreenByRouteId(routeId);
						//切换成GPS模式
						if (screenId) {
							GuardRoutePlayTimer.gpsPlayMode[screenId] = true;
						}
					}
					//更改按钮样式
					$this.addClass("camera-pause").attr("title", "暂停").removeClass("restore-play camera-play");
				} else {
					//移除正在播放的摄像机
					MapRoutePlayView.clearCameraOfGuardRoute();
					//播放警卫路线
					_leftGroupPanel.showGuardRoute($this.closest(".np-route-item")[0], "playclick");
				}
			} else {
				//暂停警卫路线
				if ($RouteLI) {
					//显示上一个下一个按钮，(事件绑定在扩展屏上播放)
					$RouteLI.find(".np-play-opera").removeClass("play-camera-list").addClass("play-on-extendscreen").show();
					screenId = GuardRoutePlayTimer.getExtendScreenByRouteId(routeId);
					//切换成手动模式
					if (screenId) {
						GuardRoutePlayTimer.gpsPlayMode[screenId] = false;
					}
				}
				//更改按钮样式
				$this.removeClass("camera-pause").attr("title", "恢复播放").addClass("camera-play restore-play");
			}
		};
		/**
		 * 触发按钮事件，结束播放警卫路线
		 */
		scope.tiggerStopPlayGuardRoute = function () {
			//收集信息
			var routeId = $(this).closest("li.np-route-item").data("id");
			//关闭警卫路线
			_stopSingleGuardRoute(routeId);
		};
		/**
		 * 播放上一个摄像机
		 */
		scope.tiggerPreRouteCamera = function() {
			var $this = $(this);
			if ($this.parent().hasClass("play-camera-list")) {
				_playPrevOrNextCameraOnMap($this, "prev");
			} else {
				_playPrevOrNextCameraOnExtendScreen($this, "prev");
			}
		};
		/**
		 * 播放下一个摄像机
		 */
		scope.tiggerNextRouteCamera = function() {
			var $this = $(this);
			if ($this.parent().hasClass("play-camera-list")) {
				_playPrevOrNextCameraOnMap($this, "next");
			} else {
				_playPrevOrNextCameraOnExtendScreen($this, "next");
			}
		};
		/**
		 * 播放警卫路线
		 * @param $RouteLI - 待播放的警卫路线列表Dom元素
		 */
		scope.playGuardRoute = function ($RouteLI) {
			//获取路线信息
			var routeId = $RouteLI.data("id"), name = $RouteLI.data("name"), time = $.trim($RouteLI.find(".np-route-config input.np-config-time").val());
			//判断时间
			if (time && time !== "") {
				time = parseInt(time) * 1000;
			} else {
				notify.warn("请先输入播放间隔时间！");
				//显示警卫路线配置
				$RouteLI.find(".np-route-config").slideDown(200);
				return;
			}
			//计算当时正在播放的警卫路线数
			if (scope.getPlayingGuardrouteNum() > 2) {
				notify.warn("最多同时播放3条路线！");
				return;
			}
			//更新播放按钮样式
			$RouteLI.find(".np-route-item-opera .camera-play").attr("title", "暂停").removeClass("camera-play").addClass("camera-pause");
			//获取摄像机列表
			_leftGroupPanel.getRouteCameras($RouteLI, routeId, time);
			//添加播放警卫路线的日志--开启XX警卫路线，add by zhangyu,2014-11-19
			logDict.insertLog("m1", "f2", "o12", "b13", name);
		};

		/**
		 * 开始播放警卫路线
		 * @param $RouteLI - 待播放警卫路线li文档对象
		 * @param time - 时间间隔
		 * @param routeId - 警卫路线id
		 * @param cameras - 警卫路线摄像机列表
		 */
		scope.startPlayGuardRoute = function ($RouteLI, time, routeId, cameras) {
			//第一步：准备
			if (!_beforPlayRoute($RouteLI, cameras, routeId, time)) {
				return;
			}
			//第二步：播放
			Variable.guardRouteCurrShowID = routeId;
			DealRoutePlay.dealPlayGpsGuardRoute($RouteLI, cameras, time, routeId);
		};

		/**
		 * 获取Gps的位置(动态刷新)
		 * @param gpsId - gpsid
		 * @param routename - 警卫路线名字
		 * @param routeId - 警卫路线Id
		 * @returns {*} - 即时的gps位置信息
		 */
		scope.getGpsPosition = function (gpsId, routename, routeId) {
			var data = _leftGroupPanel.getGpsPositionById(gpsId);
			//如果坐标为空，则返回null
			if (!data.longitude || !data.latitude) {
				notify.warn("警卫路线“" + routename + "”的GPS信号丢失！");
				return null;
			}
			//返回当前gps点位信息
			return {
				id: data.gpsid,
				routeId: routeId,
				name: routename,
				x: data.longitude,
				y: data.latitude
			}
		};

		/**
		 * 获取当前正在播放的警卫路线条数
		 * @returns {number} - 返回条数
		 * @private
		 */
		scope.getPlayingGuardrouteNum = function () {
			var timers = GuardRoutePlayTimer.timers;
			var num = 0;
			for (var key in timers) {
				if (timers.hasOwnProperty(key)) num++;
			}
			return num;
		};

		//初始化页面
		scope.init = function (leftPanel) {
			//保存左侧分组页面控制对象，用来回调
			_leftGroupPanel = leftPanel;
		};

		//订阅事件,响应警卫路线全部关闭事件
		PubSub.subscribe("stopAllPlayingRoute", _stopAllPlayingRoute);

		return scope;

	}({}, jQuery));

});