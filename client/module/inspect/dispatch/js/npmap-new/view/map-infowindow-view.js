/**
 * Created by Zhangyu on 2015/4/3.
 */
define(["js/npmap-new/map-infowindow", "js/npmap-new/map-common", "jquery", "OpenLayers"], function(InfoWindow, Common, jQuery) {
	/**
	 * 三种图标，地图信息窗显示的位置
	 * 1、大头钉图标：map-marker
	 * 2、搜索的小水滴：search-marker
	 * 3、资源图标：resource-marker
	 * @type {{map-marker: NPMapLib.Geometry.Size, search-marker: NPMapLib.Geometry.Size, resource-marker: NPMapLib.Geometry.Size}}
	 */
	var _infowindowPos = {
		"map-marker": new NPMapLib.Geometry.Size(-7, -42),
		"search-marker": new NPMapLib.Geometry.Size(-1, -34),
		"resource-marker": new NPMapLib.Geometry.Size(-1, -22)
	};

	/**
	 * 摄像机信息窗相关逻辑
	 */
	var CameraInfoWin = (function (scope) {

		var	//模板的地址
			_templateUrl = "inc/map/camera_info_window.html";

		scope.showWindow = function (data, fn) {
			var //位置
				position = new NPMapLib.Geometry.Point(data.longitude, data.latitude),
				//标题
				title = "",
				//内容
				content = "",
				//窗口大小
				size =  {
					w: 420, //信息窗宽度，单位像素
					h: 400 //信息窗高度，单位像素
				};
			//初始化信息窗模板
			Common.loadTemplate(_templateUrl, function(compiler){
				//保存模板对象
				content = compiler({
					cameraInfo: data
				});
				//加载信息窗口
				InfoWindow.addInfoWindow(position, title, content, size, {
					offsetW: _infowindowPos[data.markerType || "resource-marker"],
					fn: fn
				});
				//异步执行
				window.setTimeout(function() {
					//加载摄像机视频
					Common.playVedioOnMapWin(data);
				}, 1000);
			}, function() {
				notify("信息窗数据模板初始化失败！");
			});
		};

		return scope;

	}(CameraInfoWin || {}));

	/**
	 * 单独摄像机信息窗相关逻辑
	 */
	var SingleCameraInfoWin = (function (scope) {

		var	//模板的地址
			_templateUrl = "inc/map/single_camera_info_window.html";

		scope.showWindow = function (data, fn) {
			var //位置
				position = new NPMapLib.Geometry.Point(data.longitude, data.latitude),
				//标题
				title = "",
				//内容
				content = "",
				//窗口大小
				size =  {
					w: 420, //信息窗宽度，单位像素
					h: 325 //信息窗高度，单位像素
				};
			//初始化信息窗模板
			Common.loadTemplate(_templateUrl, function(compiler){
				//保存模板对象
				content = compiler({
					cameraInfo: data
				});
				//加载信息窗口
				InfoWindow.addInfoWindow(position, title, content, size, {
					offsetW: _infowindowPos[data.markerType || "resource-marker"],
					fn: fn
				});
				//异步执行
				window.setTimeout(function() {
					//加载摄像机视频
					Common.playVedioOnMapWin(data);
				}, 1000);
			}, function() {
				notify("信息窗数据模板初始化失败！");
			});
		};

		return scope;

	}(SingleCameraInfoWin || {}));

	/**
	 * 灯杆信息窗相关逻辑
	 */
	var LightbarInfoWin = (function(scope) {

		var	//模板的地址
			_templateUrl = "inc/map/lightbar_info_window.html";

		scope.showWindow = function (data, fn) {
			var //位置
				position = new NPMapLib.Geometry.Point(data.longitude, data.latitude),
				//标题
				title = "",
				//内容
				content = "",
				//窗口大小
				size =  {
					w: 420, //信息窗宽度，单位像素
					h: 175 //信息窗高度，单位像素
				};
			//初始化信息窗模板
			Common.loadTemplate(_templateUrl, function(compiler){
				//保存模板对象
				content = compiler({
					dataInfo: data
				});
				//加载信息窗口
				InfoWindow.addInfoWindow(position, title, content, size, {
					offsetW: _infowindowPos[data.markerType || "resource-marker"],
					fn: fn
				});
			}, function() {
				notify("信息窗数据模板初始化失败！");
			});
		};

		return scope;

	}(LightbarInfoWin || {}));

	/**
	 * gps信息窗相关逻辑
	 */
	var GpsInfoWin = (function(scope) {

		var	//模板的地址
			_templateUrl = "inc/map/gps_info_window.html";

		scope.showWindow = function (data, fn) {
			var //位置
				position = new NPMapLib.Geometry.Point(data.longitude, data.latitude),
				//标题
				title = "",
				//内容
				content = "",
				//窗口大小
				size =  {
					w: 420, //信息窗宽度，单位像素
					h: 175 //信息窗高度，单位像素
				};
			//初始化信息窗模板
			Common.loadTemplate(_templateUrl, function(compiler){
				//保存模板对象
				content = compiler({
					dataInfo: data
				});
				//加载信息窗口
				InfoWindow.addInfoWindow(position, title, content, size, {
					offsetW: _infowindowPos[data.markerType || "resource-marker"],
					fn: fn
				});
			}, function() {
				notify("信息窗数据模板初始化失败！");
			});
		};

		return scope;

	}(GpsInfoWin || {}));

	/**
	 * 警力信息窗相关逻辑
	 */
	var PoliceInfoWin = (function(scope) {

		var	//模板的地址
			_templateUrl = "inc/map/police_info_window.html";

		scope.showWindow = function (data, fn) {
			var //位置
				position = new NPMapLib.Geometry.Point(data.longitude, data.latitude),
				//标题
				title = "",
				//内容
				content = "",
				//窗口大小
				size =  {
					w: 420, //信息窗宽度，单位像素
					h: 195 //信息窗高度，单位像素
				};
			//初始化信息窗模板
			Common.loadTemplate(_templateUrl, function(compiler){
				//保存模板对象
				content = compiler({
					dataInfo: data
				});
				//加载信息窗口
				InfoWindow.addInfoWindow(position, title, content, size, {
					offsetW: _infowindowPos[data.markerType || "resource-marker"],
					fn: fn
				});
			}, function() {
				notify("信息窗数据模板初始化失败！");
			});
		};

		return scope;

	}(PoliceInfoWin || {}));

	/**
	 * 报警信息窗相关逻辑
	 */
	var AlarmInfoWin = (function(scope) {

		var	//模板的地址
			_templateUrl = "inc/map/alarm_info_window.html";

		scope.showWindow = function (data, fn) {
			var //位置
				position = data.position,
				//标题
				title = "",
				//内容
				content = "",
				//窗口大小
				size =  {
					w: 300, //信息窗宽度，单位像素
					h: 330 //信息窗高度，单位像素
				};
			//初始化信息窗模板
			Common.loadTemplate(_templateUrl, function(compiler){
				//保存模板对象
				content = compiler({
					alarmInfo: {
						"info": data
					}
				});
				//加载信息窗口
				InfoWindow.addInfoWindow(position, title, content, size, {
					fn: fn
				});
			}, function() {
				notify("信息窗数据模板初始化失败！");
			});
		};

		return scope;

	}(AlarmInfoWin || {}));


	/**
	 * 警力调度信息窗相关逻辑
	 */
	var PoliceScheduleInfoWindow = (function(scope, $) {

		var	//模板的地址
			_templateUrl = "inc/map/police_schedule_info_window.html",
			//根据类型获取信息窗大小，flag[0:添加调度，1:保存关注，2：保存非关注，3：编辑关注，4：编辑非关注]
			_getSize = function(flag) {
				if(flag == 0 || flag == 3 || flag == 4) {
					return {
						w: 420,
						h: 210
					}
				} else {
					return {
						w: 420,
						h: 150
					}
				}
			},
			//获取信息窗内容，flag[0:添加调度，1:保存关注，2：保存非关注，3：编辑关注，4：编辑非关注]
			_getContent = function(compiler, data, flag) {
				if (flag === 0) {
					return compiler({
						addMark: true,
						showFooter: false
					});
				} else if (flag === 1) {
					return compiler($.extend({
						showFooter: true
					}, data));
				} else if (flag === 2) {
					return compiler($.extend({
						showFooter: true
					}, data));
				} else if (flag === 3) {
					return compiler($.extend({
						showFooter: false
					}, data));
				} else {
					return compiler($.extend({
						showFooter: false
					}, data));
				}
			},
			/**
			 * 根据情况获取信息窗的水平位移
			 * @param flag - 情况表示
			 * @private
			 */
			_getOffsetW = function(flag) {
				if(flag === 1 || flag === 3) {
					return new NPMapLib.Geometry.Size(-1, 0);
				} else {
					return new NPMapLib.Geometry.Size(-7, -23);
				}
			},
			/**
			 * 根据情况获取信息窗的垂直位移
			 * @param flag - 情况表示
			 * @param size - 信息窗大小
			 * @private
			 */
			_getOffsetH = function(flag, size) {
				if(flag === 1 || flag === 3) {
					return new NPMapLib.Geometry.Size(-(size.w / 2 - 8), -12);
				} else {
					return new NPMapLib.Geometry.Size(-(size.w / 2 - 8), -6);
				}
			};
		/**
		 * 显示信息窗
		 * @param data - 信息窗显示数据
		 * @param fn - 回调函数
		 * @param flag - 标记位 flag[0:添加调度，1:保存关注，2：保存非关注，3：编辑关注，4：编辑非关注]
		 */
		scope.showWindow = function (data, fn, flag) {
			var //位置
				position = data.position,
				//标题
				title = "",
				//内容
				content = "",
				//窗口大小
				size =  _getSize(flag);
			//初始化信息窗模板
			Common.loadTemplate(_templateUrl, function(compiler){
				//保存模板对象
				content = _getContent(compiler, data, flag);
				//加载信息窗口
				InfoWindow.addInfoWindow(position, title, content, size, {
					offsetW: _getOffsetW(flag),
					offsetH: _getOffsetH(flag, size)
				});
				//异步加载
				window.setTimeout(function() {
					fn && fn();
				}, 0);
			}, function() {
				notify("信息窗数据模板初始化失败！");
			});
		};

		return scope;

	}(PoliceScheduleInfoWindow || {}, jQuery));

	/**
	 * 报警信息窗相关逻辑
	 */
	var BayonetInfoWin = (function(scope) {

		scope.showWindow = function (data, fn) {
			//显示信息窗
			InfoWindow.addBayonetInfoWindow(data, {
				fn: fn
			});
		};

		return scope;

	}(BayonetInfoWin || {}));

	/**
	 * 对外暴露接口
	 */
	return {
		showWindow: function (data, sence, fn) {
			if (sence === "cameraInfo") {
				CameraInfoWin.showWindow(data, fn);
			} else if(sence === "lightbar") {
				LightbarInfoWin.showWindow(data, fn);
			} else if(sence === "gps") {
				GpsInfoWin.showWindow(data, fn);
			} else if(sence === "350M") {
				PoliceInfoWin.showWindow(data, fn);
			} else if(sence === "alarm") {
				AlarmInfoWin.showWindow(data, fn);
			} else if(sence === "bayonet") {
				BayonetInfoWin.showWindow(data, fn);
			} else if(sence === "PSAddMarker") {
				PoliceScheduleInfoWindow.showWindow(data, fn, 0);
			} else if(sence === "PSSaveTrueAttention") {
				PoliceScheduleInfoWindow.showWindow(data, fn, 1);
			} else if(sence === "PSSaveFalseAttention") {
				PoliceScheduleInfoWindow.showWindow(data, fn, 2);
			} else if(sence === "PSEditTrueAttention") {
				PoliceScheduleInfoWindow.showWindow(data, fn, 3);
			} else if(sence === "PSEditFalseAttention") {
				PoliceScheduleInfoWindow.showWindow(data, fn, 4);
			} else if(sence === "singleCameraInfo") {
				SingleCameraInfoWin.showWindow(data, fn, 4);
			}
		}
	};
});