/*global NPMapLib:true*/
/**
 * Created by Zhangyu on 2015/4/10.
 */
define([
	"js/npmap-new/map-permission",
	"js/npmap-new/map-variable",
	"js/npmap-new/view/map-infowindow-handler",
	"js/npmap-new/controller/mapsearch-common-fun",
	"pubsub",
	"permission"
], function(pvamapPermission, Variable, Handler, SearchCommon, PubSub) {
	/**
	 * 信息窗基础逻辑
	 */
	return (function (scope, GlobalScope, $, _g) {
		//订阅卡口信息窗显示事件，完成事件绑定。
		PubSub.subscribe("bindInfoWindowEvents", function(msg, data) {
			//刷新卡口信息窗上的权限
			window.permission.reShow();
			//关闭pva信息窗
			scope.closeInfoWindow("", "on-bayonet-open");
			//搜索出的卡口点位在地图上点击时显示信息窗
			if(_infoWindowData.extern) {
				//执行回调
				if (_infoWindowData.extern) {
					//回调
					_infoWindowData.extern.fn && _infoWindowData.extern.fn();
				}
				//异步执行
				window.setTimeout(function () {
					//位置
					var position = new NPMapLib.Geometry.Point(_infoWindowData.data.lon, _infoWindowData.data.lat);
					//绑定事件
					Handler.bindEvents(position);
				}, 0);
			} else {
				if(data.marker) {
					//当前地图卡口资源点击时
					_g.currentCameraMarker = data.marker;
					_g.currentCameraData = data.marker.getData();
				} else {
					//当前卡口资源左侧树点击时（left-resource-view）
					PubSub.publishSync("triggerOnClickBayonetTree", $.extend(data.gateData, {
						type: "bayonet",
						subType: "resource"
					}));
				}
				//卡口资源点位在地图上点击时显示信息窗- 绑定事件
				window.setTimeout(function () {
					//位置
					var position = new NPMapLib.Geometry.Point(data.gateData.lon, data.gateData.lat);
					//绑定事件
					Handler.bindEvents(position);
				}, 0);
			}
		});

		var //地图信息窗口对象
			_infowindow = null,
			//保存当前信息窗数据信息
			_infoWindowData = {},

			_getWinOpts = function (w, h) {
				//窗口参数
				return {
					width: w, //信息窗宽度，单位像素
					height: h, //信息窗高度，单位像素
					offset: new NPMapLib.Geometry.Size(0, -23), //信息窗位置偏移值
					autoSize: false,
					isAnimationOpen: true, //信息窗打开时，地图是否平滑移动，默认不平滑移动。
					positionBlock: {
						offset: new NPMapLib.Geometry.Size(-(w / 2 - 8), 12),
						paddingY: 13, // 小箭头Y轴偏移量 一般为小箭头的高度
						imageSrc: '/module/common/images/map/arr.png', // 小箭头地址
						imageSize: { // 小箭头图片大小
							width: 16,
							height: 12
						}
					}
				};
			},
			/**
			 * 关闭信息窗
			 * @return {[type]} [description]
			 */
			_closeWindow = function() {
				if (_infowindow) {
					$(_infowindow.getBaseDiv()).html("");
					_infowindow.close();
					_infowindow = null;
				}
			};

		/**
		 * 加载信息窗口
		 * @param position - 当前点位位置数据
		 * @param title - 信息窗的标题，通常不用
		 * @param content - 信息窗的内容，依据具体的使用场景
		 * @param size - 信息窗的大小
		 * @param extern - 扩展信息
		 */
		scope.addInfoWindow = function (position, title, content, size, extern) {
			if (_infowindow) {
				//先关闭
				scope.closeInfoWindow("", "on-open");
			}
			var opts = _getWinOpts(size.w, size.h);
			//执行扩展
			if (extern) {
				extern.offsetW ? opts.offset = extern.offsetW : "";
				extern.offsetH ? opts.positionBlock.offset = extern.offsetH : "";
			}
			//新建窗口元素
			_infowindow = new NPMapLib.Symbols.InfoWindow(position, "", content, opts);
			//将窗口加入在地图
			GlobalScope.map.addOverlay(_infowindow);
			//显示信息窗口
			_infowindow.open(new NPMapLib.Geometry.Size(size.w, size.h));
			//记录当前鼠标点击并显示信息的点位坐标
			_g.lastClickData = {
				longitude: position.lon,
				latitude: position.lat
			};
			//执行扩展函数（可能是事件，需要在窗口初始化后调用）
			if (extern) {
				//回调
				extern.fn && extern.fn();
			}
			//异步执行
			window.setTimeout(function () {
				//绑定事件
				Handler.bindEvents(position);
			}, 0);
			//刷新权限 by zhangyu on 2015/2/12
			pvamapPermission.refreshPageByPermission("render-on-show-infowindow");
			//显示信息窗时，需要重置标记位
			_g.isHideInfoWindowBybusiness = false;
		};

		/**
		 * 关闭信息窗口
		 * @param closeFunc - 信息窗关闭时的回调函数
		 * @param sence - 信息窗关闭场景
		 */
		scope.closeInfoWindow = function (closeFunc, sence) {
			if(sence !== "on-bayonet-open") {
				//影藏vim的信息窗
				window.gateController.closePop();
				//清楚卡口信息窗数据
				_infoWindowData = {};
			}
			//执行关闭函数
			if (typeof(closeFunc) === 'function') {
				closeFunc();
			}
			//根据具体情况，刷新当前点位图标
			SearchCommon.clearActiveSymbol(_g.currentCameraMarker);
			//清空播放器
			if (_g.videoPlayerSigle) {
				_g.videoPlayerSigle.stop(false, 0);
				//不论关闭如否，都清除ocx对象，否则异步关闭会引出bug[39222]
				_g.videoPlayerSigle = null;
			}
			//关闭信息窗
			_closeWindow();
			//重置上次点击的摄像机坐标
			_g.lastClickData = {
				longitude: 0,
				latitude: 0
			};
			if (!_g.GlobalSearch.searchCircle) {
				//清空掉当前选择的地图点位
				_g.currentCameraMarker = null;
			}
			if (sence !== "on-open") {
				//检测左侧是否有搜索框选/全选列表，如果有，则取消选中样式
				$(".np-map-select-camera-list").find("li.np-map-select-camera-item").removeClass("selected active");
				//检测左侧是否有附近搜索/视野范围内搜索结果（警车、警员、报警、卡口、灯杆）列表，如果有，则取消选中样式
				$(".np-range-circle-search-list").find("li.np-range-circle-search-item").removeClass("selected active");
				//清空左侧树上的勾选标记
				$(".node.selected").removeClass("selected");
				//清除左侧警卫路线摄像机列表上的播放状态
				$(".np-group-camera-list .camera-item-button").find(".camera-stop").addClass("camera-play").removeClass("camera-stop").attr("title", "播放实时视频").closest(".np-group-route-camera-item").removeClass("active");
				//清除防控圈摄像机列表上的播放状态
				$(".defence-camera-list .camera-item-button").find(".camera-stop").addClass("camera-play").removeClass("camera-stop").attr("title", "播放实时视频").closest(".camera-item").removeClass("active");
			}
		};

		/**
		 * 显示卡口的信息窗
		 * @param data - 待显示的数据
		 * @param extern - 扩展
		 */
		scope.addBayonetInfoWindow = function(data, extern) {
			//信息窗参数
			var params = $.extend(data, {
				gateId: data.gateId || data.id,
				gateName: data.gateName || data.name,
				lon: data.x || data.lon,
				lat: data.y || data.lat,
				flag: true,
				markerType: data.subType
			});
			//保存信息
			_infoWindowData.data = data;
			_infoWindowData.extern = extern;
			//记录当前鼠标点击并显示信息的点位坐标
			_g.lastClickData = {
				longitude: data.x,
				latitude: data.y
			};
			//调用卡口的方法，显示弹出窗
			/*if(data.isRoad) {
				window.gateController.showDetail(params);
			} else {*/
			//地图上的点位永远是卡口层的（gate），而非route
			window.gateController.showGateDetail(params);
			//}
			//显示信息窗时，需要重置标记位
			_g.isHideInfoWindowBybusiness = false;
		};

		/**
		 * 设置信息窗的大小
		 * @param content
		 */
		scope.setContent = function (content) {
			_infowindow.setContent(content);
		};

		/**
		 * 设置信息窗的大小
		 * @param size
		 */
		scope.setSize = function (size) {
			if (size.width) {
				_infowindow.setWidth(size.width);
			}
			if (size.height) {
				_infowindow.setHeight(size.height);
			}
		};

		/**
		 * 判断地图信息窗对象是否存在
		 */
		scope.checkInfoWindowExists = function () {
			return _infowindow ? true : false;
		};

		/**
		 * 显示信息窗
		 * @param sence
		 */
		scope.show = function (sence) {
			//如果是地图拖拽结束时显示，则判断是否已经业务业务需要关闭了，如果是，则不进行显示
			if(sence && sence === "map-drag-end" && _g.isHideInfoWindowBybusiness) {
				return;
			}
			if (_infowindow) {
				_infowindow.show();
			}
			//显示信息窗时，需要重置标记位
			_g.isHideInfoWindowBybusiness = false;
		};

		/**
		 * 影藏信息窗
		 * @param flag - 业务关闭信息窗的标记，只有在业务需要关闭时有效
		 */
		scope.hide = function (flag) {
			//判断是否是因为业务需要关闭信息窗，如果是，则置标记位
			if(flag) {
				_g.isHideInfoWindowBybusiness = flag;
			}
			if (_infowindow) {
				_infowindow.hide();
			}
		};

		return GlobalScope.infowindow = scope;

	}({}, window, jQuery, Variable));
});