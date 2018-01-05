/**
 * Created by Zhangyu on 2015/4/7.
 */
define([
	// "js/npmap-new/view/map-infowindow-view",
	// "js/npmap-new/model/map-infowindow-model",
	// "js/npmap-new/controller/map-infowindow-alarm-controller",
	"js/npmap-new/task/info-window",
	"js/npmap-new/map-variable",
	"pubsub",
	"jquery"
], function(view, mapVariable, PubSub, jQuery) {//view, model, MapAlarm

	return (function (scope, $) {

		//订阅事件-在地图上显示信息窗
		PubSub.subscribe("showInfoWindowOnMap1", function(msg, obj) {
			scope.showMapInfoWindow(obj.data, obj.sence, obj.fn);
		});
		/**
		 * 内蒙需求，根据gps的id获取gps详细信息
		 * @param gpsId - gps唯一标示
		 * @param gpsInfo - 当前gps数据信息
		 * @param fn - 回调函数
		 */
		var _getGpsDetail = function(gpsId, gpsInfo, fn) {

			/*model.getGpsDetail({
				id: gpsId
			}, {
				cache: false
			}).then(function (res) {
				if (res.code === 200) {
					if(res.data.gpsInfo) {
						gpsInfo = $.extend(gpsInfo, {
							orgname: res.data.gpsInfo.orgname,
							cartype: res.data.gpsInfo.cartype,
							carno: res.data.gpsInfo.carno,
							policeid: res.data.gpsInfo.policeid,
							policename: res.data.gpsInfo.policename,
							callno: res.data.gpsInfo.callno,
							needdetails: true
						});
						//gps数据信息窗
						view.showWindow(gpsInfo, "gps", fn);
					} else {
						//gps数据信息窗
						gpsInfo.height = 170;
						view.showWindow(gpsInfo, "gps", fn);
					}
				} else {
					//gps数据信息窗
					gpsInfo.height = 170;
					view.showWindow(gpsInfo, "gps", fn);
				}
			}, function () {*/
				//gps数据信息窗
				gpsInfo.height = 170;
				view.showGPSWindow(gpsInfo);
				//view.showWindow(gpsInfo, "gps", fn);
			/*});*/
		};
		/**
		 * 显示信息窗
		 * @param data - 待显示的数据信息
		 * @param sence - 信息窗的使用场景
		 * @param fn - 回调函数
		 */
		scope.showMapInfoWindow = function (data, sence, fn) {
			view.init(window.map);
			if(sence === "cameraInfo" || sence ==="singleCameraInfo" || sence === "PSAddMarker" || sence === "PSSaveTrueAttention" || sence === "PSSaveFalseAttention" || sence === "PSEditTrueAttention" || sence === "PSEditFalseAttention"){
				/**
				 * 对摄像机的安装类型进行格式化
				 * 1、左侧树点击
				 * 2、警卫路线添加/编辑时的摄像机列表
				 * 3、警卫路线分组中摄像机列表的点击事件
				 * 4、防控圈分组中摄像机列表的点击事件
				 */
				if(sence === "cameraInfo"||sence === "singleCameraInfo"){
					data.installType = data.installType ? data.installType : data.installtype;
				}
				//显示摄像机信息窗/警力调度信息窗
				//view.showWindow(data, sence, fn);
				if(sence ==="singleCameraInfo"){
					view.closeCameraWindow();
					view.showSingleCameraWindow(data);
				}else{
					view.showCameraWindow(data);
				}
			} else {
				var param = {
					longitude: data.lon || data.longitude || data.feature.geometry.x,
					latitude: data.lat || data.latitude || data.feature.geometry.y,
					lon: data.lon || data.longitude || data.feature.geometry.x,
					lat: data.lat || data.latitude || data.feature.geometry.y,
					type: data.type,
					markerType: data.markerType
				};
				//map、灯杆、gps、350M数据
				if (data.type === "map") {
					//地图兴趣点数据信息窗
					view.showWindow($.extend(param, {
						addr: data.feature.attributes.R_ADDR,
						name: data.value
					}), "map", fn);
				} else if (data.type === "lightbar") {
					//灯杆数据信息窗
					// view.showWindow($.extend(param, {
					// 	code: data.code,
					// 	addr: data.address || data.name
					// }), "lightbar", fn);
					view.showLightbarWindow(data);
				} else if (data.type === "gps") {
					//扩展gps信息字段
					var gpsInfo = $.extend(param, {
						key: data.key,
						time: data.time,
						gpsName: data.gpsName,
						contacts: data.contacts,
						lprVale: data.lprVale
					});
					//根据gpsid获取gps的详细信息
					_getGpsDetail(gpsInfo.key, gpsInfo, fn);
				} else if (data.type === "350M") {
					//350M数据信息窗
					// view.showWindow($.extend(param, {
					// 	key: data.key,
					// 	callno: "",
					// 	time: data.time
					// }), "350M", fn);
				} else if (data.type === "alarm") {
					//报警
					var cameraId = data.cameraId;
					view.showAlarmWindow({
						id:cameraId
					});
					//MapAlarm.getAlarmDetailInfo(new NPMapLib.Geometry.Point(param.longitude, param.latitude), cameraId);

				} else if(data.type === "bayonet"){
					//卡口
					//view.showWindow(data, "bayonet", fn);
					view.showBayonetWindow(data);
				}
			}
		};

		return scope;

	}({}, jQuery));
});