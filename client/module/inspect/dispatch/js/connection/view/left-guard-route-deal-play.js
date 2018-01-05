/**
 * Created by Zhangyu on 2015/5/8.
 */
define([
	"js/npmap-new/view/task-guard-route-timer-view",
	"js/npmap-new/map-common-guardroute-play",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-common",
	"jquery"
], function (GuardRoutePlayTimer, ScreenRoutePlay, Variable, MapCommon, jQuery) {

	return (function (scope, $) {

		var //保存左侧播放控制逻辑，用于回调
			_leftPlayCtrl = null,
			//保存地图上播放的逻辑
			_mapRoutePlayView = null;

		var /**
			 * 处理单条警卫路线播放时，在视频播放栏上的控制
			 * @param currentCamera - 当前播放摄像机数据
			 * @param $RouteLI - 当前播放的警卫路线li文档对象
			 * @param routeId - 当前播放的警卫路线id
			 * @param tag - 标记是手动播放（1）、自动播放（2）、停止播放（3）
			 * @param preindex - 前一个摄像机播放窗位索引
			 * @param curindex - 当前摄像机播放窗位索引
			 * @param nextindex - 下一个摄像机播放窗位索引
			 */
			_dealPlaySingleRouteOnPreNext = function(currentCamera, $RouteLI, routeId, tag, preindex, curindex, nextindex) {

				var tempCamera = currentCamera, preCIndex = 0, curCIndex = 1, nextCIndex = 2;
				if (tag === 2) {
					//无gps时的自动播放
					preCIndex = preindex;
					curCIndex = curindex;
					nextCIndex = nextindex;
				}
				//上一个下一个摄像机
				var prevAndNextCamera = _getPreAndNextCamera($RouteLI, tempCamera);
				//设置扩展屏播放数据
				var playData = {
					routeId: $RouteLI.data("id"),
					routeName: $RouteLI.data("name"),
					routeNum: 1,
					data: [
						_setCameraOnExtendScreen(prevAndNextCamera.prev, preCIndex),
						_setCameraOnExtendScreen(tempCamera, curCIndex),
						_setCameraOnExtendScreen(prevAndNextCamera.next, nextCIndex)
					]
				};
				//记录当前屏播放的摄像机ID
				GuardRoutePlayTimer.activeCameraIds[curCIndex] = tempCamera.id;
				//设置通道已被占用(就一条警卫路线时，1号屏记录播放的警卫路线id)
				GuardRoutePlayTimer.extendScreen[1] = routeId;
				//播放
				_playVideoOnExtendSreen(playData, routeId);
			},
			/**
			 * 获取上一个下一个摄像机
		     * @param $RouteLI - 当前待播放警卫路线li文档对象
			 * @param currentCamera - 当前播放摄像机数据
			 * @returns {*} - 上一个、下一个播放的摄像机数据
			 * @private
			 */
			_getPreAndNextCamera = function($RouteLI, currentCamera) {

				var currentCameraId = currentCamera.id;
				//获取上一个下一个dom节点
				var currCameraLi = $RouteLI.find(".np-group-camera-list li[data-id='" + currentCameraId + "']"),
					prevCameraLi = currCameraLi.prev(),
					nextCameraLi = currCameraLi.next();
				//收集信息
				var prevCamera, nextCamera;
				//拿到上一个摄像机对象
				if (prevCameraLi && prevCameraLi.hasClass("np-group-route-camera-item")) {
					prevCamera = prevCameraLi.data();
				}
				//拿到下一个摄像机对象
				if (nextCameraLi) {
					nextCamera = nextCameraLi.data();
				}
				//组装对象并返回
				return {
					prev: prevCamera,
					next: nextCamera
				};
			},
			/**
			 * 封装扩展屏播放视频参数
			 * @param camera - 该播放窗位上的摄像机数据
			 * @returns {*} - 播放栏上待播放的摄像机通道数据
			 * @private
			 */
			_setCameraOnExtendScreen = function(camera) {
				//获取可播放的通道
				var playChannel = null;
				if (camera) {
					//格式化数据
					playChannel = {
						hdChannel: camera.hd_channel ? camera.hd_channel : camera.hdchannel,
						sdChannel: camera.sd_channel ? camera.sd_channel : camera.sdchannel,
						cId: camera.id,
						cName: camera.name,
						cType: camera.camera_type ? camera.camera_type : camera.cameratype,
						cCode: camera.cameraCode ? camera.cameraCode : camera.cameracode,
						cStatus: camera.camera_status ? camera.camera_status : camera.camerastatus //摄像机在线离线状态 0-有 1-全部通道不可用
					}
				}
				return playChannel;
			},
			/**
			 * 根据gps信号的即时位置获取最近的摄像机
			 * @param position - gps位置信息
			 * @param cameras - 当前警卫路线的摄像机列表
			 * @returns {*} - 获取当前gps点位附近的上一个和下一个摄像机集合
			 * @private
			 */
			_getNearestCamera = function(position, cameras) {
				var minDistance = -1, nearestCamera;
				for (var i = 0, j = cameras.length; i < j; i++) {
					if (cameras[i].longitude && cameras[i].latitude) {
						var distance = Math.sqrt((cameras[i].longitude - position.x) * (cameras[i].longitude - position.x) + (cameras[i].latitude - position.y) * (cameras[i].latitude - position.y));
						if (minDistance === -1) {
							minDistance = distance;
							nearestCamera = cameras[i];
						}
						if (distance < minDistance) {
							minDistance = distance;
							nearestCamera = cameras[i];
						}
					}
				}
				return nearestCamera;
			},
			/**
			 * 播放多条警卫路线逻辑
			 * @param currScreenIndex - 当前在播放的警卫路线所在的分屏索引
			 * @param playingNum - 当前在播放的警卫路线数
			 * @param camera - 当前待摄像机数据信息（前一个或者后一个）
			 * @param $RouteLI - 当前警卫路线li文档对象
			 * @param routeId - 警卫路线id
			 * @private
			 */
			_playDultiRoutes = function(currScreenIndex, playingNum, camera, $RouteLI, routeId) {
				//多条警卫路线同时播放，每个屏播放一条路线(顺序播放/离Gps信号最近的摄像机)
				window.setTimeout(function () {
					//上一个下一个摄像机
					var prevAndNextCamera = _getPreAndNextCamera($RouteLI, camera);
					//设置扩展屏播放数据
					var playData = {
						routeId: $RouteLI.data("id"),
						routeName: $RouteLI.data("name"),
						routeNum: playingNum,
						data: [
							_setCameraOnExtendScreen(prevAndNextCamera.prev, 0),
							_setCameraOnExtendScreen(camera, currScreenIndex),
							_setCameraOnExtendScreen(prevAndNextCamera.next, 2)
						]
					};
					//记录当前屏播放的摄像机ID
					GuardRoutePlayTimer.activeCameraIds[currScreenIndex] = camera.id;
					//设置通道已被占用
					GuardRoutePlayTimer.extendScreen[currScreenIndex] = routeId;
					//播放
					_playVideoOnExtendSreen(playData, routeId);
				}, 100);
			},
			/**
			 * 在扩展屏上或者播放栏上播放视频
			 * @param playData - 待播放的数据
			 * @private
			 */
			_playVideoOnExtendSreen = function(playData) {
				ScreenRoutePlay.send(playData);
			};

		/**
		 * 启动播放警卫路线
		 * @param $RouteLI - 待播放警卫路线li文档对象
		 * @param cameras - 待播放摄像机列表
		 * @param time - 播放时间间隔
		 * @param routeId - 警卫路线id
		 * @private
		 */
		scope.dealPlayGpsGuardRoute = function($RouteLI, cameras, time, routeId) {
			//启动播放警卫路线
			window.setTimeout(function () {
				GuardRoutePlayTimer.startTimer(routeId, {
					func: function () {
						var camera = null;
						var currScreenIndex = -1, prevScrrenIndex = -1, nextScreenIndex = -1;
						var playingNum = _leftPlayCtrl.getPlayingGuardrouteNum();
						//多条警卫路线同时播放
						if (playingNum > 1) {
							//获取该路线所在的屏幕
							currScreenIndex = GuardRoutePlayTimer.getExtendScreenByRouteId(routeId);
							//如果没有，则寻找未被占用的屏幕
							if (currScreenIndex === -1) {
								currScreenIndex = GuardRoutePlayTimer.getUnusedScreen();
							}
						} else {
							//单条警卫路线在播放
							prevScrrenIndex = 0;
							currScreenIndex = 1;
							nextScreenIndex = 2;
						}
						//如果当前正在播放
						if (GuardRoutePlayTimer.gpsPlayMode[currScreenIndex]) {
							//如果使用GPS
							var gpsId = $.trim($RouteLI.find(".np-route-config .np-config-gpsid").val());
							if (gpsId && gpsId !== "") {
								var routename = $RouteLI.find(".np-route-name").attr("title");
								var position = _leftPlayCtrl.getGpsPosition(gpsId, routename, routeId);
								var currGpsInfo = GuardRoutePlayTimer.currGpsInfo[currScreenIndex];
								//如果之前有GPS信息
								if (currGpsInfo) {
									//如果此次获取到了位置信息
									if (position) {
										if ((currGpsInfo.x === position.x) && (currGpsInfo.y === position.y)) {
											notify.warn("监测到警卫路线“" + routename + "”的GPS信号没有更新位置，您可以手动调整播放！");
											position = null;
										}
									} else { //未获取到
										position = null;
									}
								}
								if (position) {
									//隐藏上一个下一个按钮，(事件绑定在地图上播放)
									$RouteLI.find(".np-play-opera").removeClass("play-on-extendscreen").addClass("play-camera-list").hide();
									//更新警卫路线小车的位置
									_mapRoutePlayView.refreshGpsCarPos(position);
									//记录当前GPS信息
									GuardRoutePlayTimer.currGpsInfo[currScreenIndex] = position;
									camera = _getNearestCamera(position, cameras);
								} else {
									//显示上一个下一个按钮，(事件绑定在扩展屏上播放)
									$RouteLI.find(".np-play-opera").removeClass("play-camera-list").addClass("play-on-extendscreen").show();
								}
							} else { //不使用GPS，摄像机自动播放
								var cameraIndex = GuardRoutePlayTimer.activeCameras[currScreenIndex];
								//播放下一个摄像机
								cameraIndex++;
								//如果下一个摄像机不存在，则播放第一个摄像机
								if (cameraIndex > cameras.length - 1) {
									cameraIndex = 0;
								}
								//即将播放的摄像机
								camera = cameras[cameraIndex];
								//设置活动摄像机索引
								GuardRoutePlayTimer.activeCameras[currScreenIndex] = cameraIndex;
							}
						}
						if (camera) {
							var currCameraId = GuardRoutePlayTimer.currCameraId[currScreenIndex];
							var flag = false;
							if (camera.id !== currCameraId) {
								flag = true;
							}
							if (flag) {
								//记录当前摄像机ID
								GuardRoutePlayTimer.currCameraId[currScreenIndex] = camera.id;
								//设置左边列表元素活动
								$RouteLI.find(".np-group-camera-list li[data-id='" + camera.id + "']").addClass("active").siblings().removeClass("active");
								//高亮并定位正在播放的摄像机
								if (Variable.guardRouteCurrShowID === routeId) {
									_mapRoutePlayView.setActiveCameraOnMap(camera);
								}
								//当前只播放一条警卫路线
								if (playingNum < 2) {
									_dealPlaySingleRouteOnPreNext(camera, $RouteLI, routeId, 2, prevScrrenIndex, currScreenIndex, nextScreenIndex);
								} else {
									//多条警卫路线同时播放，每个屏播放一条路线(顺序播放/离Gps信号最近的摄像机)
									_playDultiRoutes(currScreenIndex, playingNum, camera, $RouteLI, routeId);
								}
							}
						}
					},
					time: time
				});
			}, 100);
		};

		/**
		 * 警卫路线播放暂停时，手动播放警卫路线
		 * @param currScreenIndex - 当前在播放的警卫路线所在的分屏索引
		 * @param playingNum - 当前在播放的警卫路线数
		 * @param camera - 当前待摄像机数据信息（前一个或者后一个）
		 * @param $RouteLI - 当前警卫路线li文档对象
		 * @param routeId - 警卫路线id
		 */
		scope.playSingleRouteByHand = function(currScreenIndex, playingNum, camera, $RouteLI, routeId) {
			//多条警卫路线同时播放，每个屏播放一条路线
			if (playingNum > 1) {
				_playDultiRoutes(currScreenIndex, playingNum, camera, $RouteLI, routeId);
			} else {
				//当前只播放一条警卫路线
				_dealPlaySingleRouteOnPreNext(camera, $RouteLI, routeId, 1);
			}
		};

		/**
		 * 在播放栏或者扩展屏上关闭视频播放
		 * @param routeId - 待停止的警卫路线id
		 */
		scope.stopVideoOnExtentScreen = function(routeId) {
			ScreenRoutePlay.stop(routeId);
			//清除该路线在地图上的覆盖物
			_mapRoutePlayView.stopGuardRouteById(routeId);
		};

		//初始化
		scope.init = function(LeftPlayCtrl, MapRoutePlayView) {
			//保存左侧播放控制逻辑，用于回调
			_leftPlayCtrl = LeftPlayCtrl;
			//保存地图上播放的逻辑
			_mapRoutePlayView = MapRoutePlayView;
		};

		return scope;

	}({}, jQuery));

});