/**
 * Created by Zhangyu on 2015/4/17.
 */
define([
	"js/npmap-new/map-common"
], function(Common) {

	return (function (scope, $) {

		var	//鼠标移入工具栏项
			_mouseoverMaptoolItem = function() {
				var This = $(this);
				//资源
				if (This.children("iframe.map-resource-list")[0]) {
					This.children('.map-resource-list').fadeIn(200);
				}
				//框选圈选
				if (This.children("iframe.map-select-list")[0]) {
					This.children('.map-select-list').fadeIn(200);
				}
				//视野范围内搜索
				if (This.children("iframe.map-searcharound-content")[0]) {
					require(["js/npmap-new/view/maptool-searchInscope-view", "js/npmap-new/controller/maptool-searchInscope-controller"], function(SearchInscopeView){
						//获取分组
						SearchInscopeView.getGroups();
					});
					This.children(".map-searcharound-content").fadeIn(200);
				}
				//摄像机资源
				if (This.children("iframe.camera-type-list")[0]) {
					This.children('.camera-type-list').fadeIn(200);
				}
			},
			//鼠标移出工具栏项
			_mouseoutMaptoolItem = function() {
				var This = $(this);
				//资源
				if (This.children("iframe.map-resource-list")[0]) {
					This.children('.map-resource-list').fadeOut(200);
				}
				//框选圈选
				if (This.children("iframe.map-select-list")[0]) {
					This.children('.map-select-list').fadeOut(200);
				}
				//视野范围内搜索
				if (This.children("iframe.map-searcharound-content")[0]) {
					This.children(".map-searcharound-content").fadeOut(200);
				}
				//摄像机资源
				if (This.children("iframe.camera-type-list")[0]) {
					This.children('.camera-type-list').fadeOut(200);
				}
			},
			//工具栏的鼠标hover事件
			_hoverMaptoolItem = function(e){
				if (e.type === "mouseenter") {
					_mouseoverMaptoolItem.call(this, arguments);
				} else {
					_mouseoutMaptoolItem.call(this, arguments);
				}
			},
			//摄像机类型列表移出事件
			_cameraTypeListLeave = function() {

				if($(".map-resource-list").is(":visible")) {
					$(".map-resource-list").fadeOut(200);
				}
				$(".camera-type-list").fadeOut(200);
			};

		//事件处理程序
		var _eventHandler = {
			//地图工具栏配置项的鼠标hover事件
			MaptoolItemHover: function (e) {
				_hoverMaptoolItem.call(this, e);
				e.stopPropagation();
			},
			//报警信息鼠标事件
			MaptoolItemAlarm: function (e) {
				var self = this;
				if (e.type === "click") {
					require(["js/npmap-new/view/map-infowindow-alarm-view"], function (AlarmView) {
						AlarmView.showOrHideAlarmInfos.call(AlarmView, self);
					});
				} else {
					_hoverMaptoolItem.call(self, e);
				}
				//去掉冒泡，用来捕获左侧全景和警力调度的功能释放问题，by zhangyu on 2015/5/21
				//e.stopPropagation();
			},
			//地图选择事件处理程序
			MapSelectItem: function (e) {
				var self = this;
				if (e.type === "click") {
					//如果是下面冒泡上来的，则过滤，否则会触发两次
					if($(e.target).closest(".map-select-list").length === 0) {
						require(["js/npmap-new/view/maptool-select-view"], function (MapSelectView) {
							MapSelectView.dealOnClickSelectItem.call(MapSelectView, self);
						});
					}
				} else {
					_hoverMaptoolItem.call(self, e);
				}
				//去掉冒泡，用来捕获左侧全景和警力调度的功能释放问题，by zhangyu on 2015/5/21
				//e.stopPropagation();
			},
			//全屏鼠标事件
			MaptoolItemFullscreen: function (e) {
				var self = this;
				if (e.type === "click") {
					require(["js/npmap-new/view/maptool-fullscreen-view"], function (FullscreenView) {
						FullscreenView.setFullScreenOrNot.call(FullscreenView, self);
					});
				} else {
					_hoverMaptoolItem.call(self, e);
				}
			},
			//摄像机资源的鼠标事件
			CameraResourceItemHover: function (e, data) {
				var self = this;
				if (e.type === "click") {
					//如果是从下面冒泡中来的则放过,否则要触发隐藏和显示
					if($(e.target).closest(".camera-type-list").length === 0) {
						//触发摄像机资源的显示和隐藏
						require(["js/npmap-new/view/maptool-resource-view"], function (ResourceView) {
							ResourceView.dealResourceItem.call(ResourceView, self);
						});
					}
					//判断是否是全景进入时隐藏资源触发的事件，如果是，则阻止冒泡，以避免影响全景上下文
					if(data) {
						e.stopPropagation();
					} else {
						//去掉冒泡，用来捕获左侧全景和警力调度的功能释放问题，by zhangyu on 2015/5/21
						//e.stopPropagation();
					}
				} else {
					_hoverMaptoolItem.call(self, e);
					e.stopPropagation();
				}
			},
			//摄像机类型列表移出事件
			CameraTypeListLeave: function (e) {
				_cameraTypeListLeave.call(this);
				e.stopPropagation();
			},
			//圈选\框选事件处理程序
			MapSelect: function (e) {
				var self = this;
				require(["js/npmap-new/view/maptool-select-view", "js/npmap-new/controller/maptool-select-controller"], function (MapSelectView) {
					MapSelectView.dealOnMapSelect.call(MapSelectView, self);
				});
				//去掉冒泡，用来捕获左侧全景和警力调度的功能释放问题，by zhangyu on 2015/5/21
				//e.stopPropagation();
			},
			//地图上的工具按钮（放大、缩小等）
			MapToolsDeal: function (e) {
				var self = this;
				require(["js/npmap-new/view/maptool-tools-view"], function (MapToolsView) {
					MapToolsView.dealOnClickMapTools.call(MapToolsView, self);
				});
				//去掉冒泡，用来捕获左侧全景和警力调度的功能释放问题，by zhangyu on 2015/5/21
				//e.stopPropagation();
			},
			//平面地图和卫星地图切换
			MapSwitch: function (e) {
				var self = this;
				require(["js/npmap-new/view/maptool-right-panel-view"], function (RightPanelView) {
					RightPanelView.switchMapLayer.call(RightPanelView, self);
				});
				//去掉冒泡，用来捕获左侧全景和警力调度的功能释放问题，by zhangyu on 2015/5/21
				//e.stopPropagation();
			},
			PlatMap: function (e) {
				var self = this;
				$(this).toggleClass("active");
				require(["js/npmap-new/task/flat-map-display"], function (PlatMapView) {
					PlatMapView.showHidePlatMap();
				});
			},
			//地图工具栏资源选项的点击事件
			ResourceItemClick: function (e, data) {
				var self = this;
				require(["js/npmap-new/view/maptool-resource-view", "js/npmap-new/controller/maptool-resource-controller"], function (ResourceView) {
					ResourceView.dealResourceItem.call(ResourceView, self);
				});
				//判断是否是全景进入时隐藏资源触发的事件，如果是，则阻止冒泡，以避免影响全景上下文
				if(data) {
					e.stopPropagation();
				} else {
					//去掉冒泡，用来捕获左侧全景和警力调度的功能释放问题，by zhangyu on 2015/5/21
					//e.stopPropagation();
				}
			},
			//地图工具栏摄像机资源选项的点击事件
			CameraResourceTypeClick: function (e, data) {
				var self = this;
				require(["js/npmap-new/view/maptool-resource-view", "js/npmap-new/controller/maptool-resource-controller"], function (ResourceView) {
					ResourceView.dealCameraResourceType.call(ResourceView, self);
				});
				//判断是否是全景进入时隐藏资源触发的事件，如果是，则阻止冒泡，以避免影响全景上下文
				if(data) {
					e.stopPropagation();
				} else {
					//去掉冒泡，用来捕获左侧全景和警力调度的功能释放问题，by zhangyu on 2015/5/21
					//e.stopPropagation();
				}
			}
		};

		/**
		 * 事件绑定
		 */
		scope.bindEvents = function () {
			//地图工具栏项的鼠标事件
			$("#map-tool-right").find("[data-handler]").map(function (e) {
				$(this).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
			});
			//地图右侧面板中的事件绑定
			$("#mapId").find(".opera-container").find("[data-handler]").map(function () {
				$(this).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
			});
		};

		return scope;

	}({}, jQuery))
});