/**
 * 地图工具类
 * @author Li Dan
 * @date   2014-12-17
 */
define([
	"js/npmap-new/map-variable",
	"js/npmap-new/map-common",
	"js/npmap-new/map-common-overlayer-ctrl",
	"js/sidebar/sidebar"
], function(Variable, commonFun, MapOverLayerCtrl, SideBar) {

		var // 地图放大
			_mapMax =  function() {
				Variable.map.zoomIn();
				//激活鼠标文字跟踪
				Variable.map.activateMouseContext("框选放大地图,右键取消。");
				// 绑定右键取消点击事件
				Variable.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
				Variable.map.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK, function (point) {
					// 取消文本提示
					Variable.map.deactivateMouseContext();
					// 取消左键点击事件
					Variable.map.zoomInOutStop();
				});
			},
			// 地图缩小
			_mapMin = function() {
				Variable.map.zoomOut();
				Variable.map.activateMouseContext("框选缩小地图,右键取消。");
				// 绑定右键取消点击事件
				Variable.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
				Variable.map.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK, function (point) {
					// 取消文本提示
					Variable.map.deactivateMouseContext();
					// 取消左键点击事件
					Variable.map.zoomInOutStop();
				});
			},
			//测距
			_mapMeasure = function() {
				Variable.measuretool.setMode(NPMapLib.MEASURE_MODE_DISTANCE);
			},
			//清除
			_mapClear = function() {
				//图层切换
				MapOverLayerCtrl.showAndHideOverLayers("map-business-clear");
				//清除LBS接入的业务图层 临时
				var lbslayer = map.getLayerByName("pva-graphics");
				if(lbslayer){
					lbslayer.removeAllGroups();
				}
				//初始化左侧页面(根据当前活跃的tab)
				SideBar.push({
					name: "#sidebar-body",
					markName: jQuery(".np-sidebar-header").find("li.active").data("mark")
				});
				//更新报警信息按钮样式
				commonFun.IfClickAlarmInfo(false);
				//清除当前摄像机信息的存储
				mapVariable.currentCameraData = null;
				//如果含有途经点窗口，则移除
				if(jQuery(".intermediate-stop")[0]){
					jQuery(".intermediate-stop").remove();
				}
			};

		var ToolsView = function() {};

		ToolsView.prototype = {
			dealOnClickMapTools: function(context) {
				if(jQuery(context).children("a").hasClass("map-max")) {
					_mapMax();
				} else if(jQuery(context).children("a").hasClass("map-min")) {
					_mapMin();
				} else if(jQuery(context).children("a").hasClass("map-measure")) {
					_mapMeasure();
				} else if(jQuery(context).children("a").hasClass("map-clear")) {
					_mapClear();
				}
			}
		};

		return new ToolsView();
	});