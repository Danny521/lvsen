/**
 * Created by Zhangyu on 2015/4/18.
 */
define([
	"js/npmap-new/map-variable",
	"js/npmap-new/map-common-overlayer-ctrl",
	"jquery"
], function(Variable, MapOverLayerCtrl, jQuery) {

	return (function (scope, $) {

		var //摄像机资源的类型
			_cameraType = ["Indoor", "HiShpomt", "Elevated", "Water", "Ground"],
			//控制器
			_controller = null,
			/**
			 * 根据类型显示或者隐藏摄像机资源
			 * @param type - 摄像机类型
			 * @param flag - true为显示，false为隐藏
			 * @private
			 */
			_showOrHideCameraByType = function(type, flag){
				Variable.resourceLayers.cluster.setMakrerTypeVisiable(type, flag);
				//显示摄像机聚合图层
				MapOverLayerCtrl.showAndHideOverLayers("click-on-show-hide-camera-resource", true);
			},
			/**
			 * 根据类型显示或者隐藏地图上的资源
			 * @param type - 摄像机类型
			 * @param $This - 当前事件对象
			 * @param flag - true为显示，false为隐藏
			 * @private
			 */
			_showOrHideResource = function (type, $This, flag) {
				if(flag){
					if(type === "camera") {
						//如果选中的是摄像机资源
						$This.find(".list-item-camera").children("i").addClass("checked");
						//显示所有摄像机资源
						for(var i = 0, len = _cameraType.length; i < len; i++) {
							Variable.resourceLayers.cluster.setMakrerTypeVisiable(_cameraType[i], true);
						}
						//显示摄像机聚合图层
						MapOverLayerCtrl.showAndHideOverLayers("click-on-show-hide-camera-resource", true);
					} else if(type === "bayonet"){
						//如果选中的是卡口资源
						if(window.gateController) {
							//显示卡口点位
							window.gateController.showBayonet();
						}
					} else if(type === "lightbar"){
						//如果选中的是灯杆资源
						_controller.getLightbarData();
					} else if(type === "policecar"){
						//如果选中的是警车资源
						_controller.getPoliceData();
					} else if(type === "policeman"){
						//如果选中的是警员资源
						_controller.getPolicemanData();
					}
				} else {
					if(type === "camera") {
						//如果取消的是摄像机资源
						$This.find(".list-item-camera").children("i.checkbox").removeClass("checked");
						//影藏所有摄像机资源
						for(var i = 0, len = _cameraType.length; i < len; i++) {
							Variable.resourceLayers.cluster.setMakrerTypeVisiable(_cameraType[i], false);
						}
						//取消显示摄像机聚合图层
						MapOverLayerCtrl.showAndHideOverLayers("click-on-show-hide-camera-resource", false);
					} else {
						//取消地图上的资源显示
						_hideResourceByType(type);
					}
				}
			},
			/**
			 * 根据类型取消地图上资源的显示
			 * @param type - 资源类型
			 * @private
			 */
			_hideResourceByType = function(type) {
				if(type === "bayonet") {
					//如果取消的是卡口资源
					window.gateController.hideLayer();
				} else {
					MapOverLayerCtrl.showAndHideOverLayers("click-on-map-res-hide", type);
				}
			},
			/**
			 * 用户勾选资源列表时检查并设置checkbox的状态
			 * @param context - 事件上下文
			 * @param type - 类型，0为资源，1为摄像机资源
			 * @private
			 */
			_refreshCheckboxStatus = function(context, type) {
				var $This = $(context), $Icon = $This.children("i.checkbox");

				//更新checkbox状态
				$Icon.toggleClass("checked");

				if($Icon.hasClass("checked")) {
					if(type === 1) {
						//判断是否全选
						if ($This.siblings().children("i:not([class*='checked'])").length === 0) {
							$This.parents("li").children("i").addClass("checked");
						}
						//加载相应的摄像机资源
						_showOrHideCameraByType($This.data("type"), true);
					} else {
						_showOrHideResource($This.data("type"), $This, true);
					}
				} else {
					if(type === 1) {
						$This.parents("li").children("i").removeClass("checked");
						//隐藏相应的摄像机资源
						_showOrHideCameraByType($This.data("type"), false);
					} else {
						_showOrHideResource($This.data("type"), $This, false);
					}
				}
			};
		/**
		 * 选择地图工具栏上资源选项的鼠标点击事件
		 * @param context - 事件上下文
		 */
		scope.dealResourceItem = function(context){
			//检查并设置checkbox的状态
			_refreshCheckboxStatus(context, 0);
		};
		/**
		 * 选择地图工具栏上资源选项的鼠标点击事件
		 * @param context - 事件上下文
		 */
		scope.dealCameraResourceType = function(context){
			//检查并设置checkbox的状态
			_refreshCheckboxStatus(context, 1);
		};
		/**
		 * 在地图上显示资源数据
		 * @param type - 资源类型
		 * @param data - 资源数据
		 */
		scope.showResourceOnMap = function(type, data) {

		};
		/**
		 * 初始化
		 * @param controller
		 */
		scope.init = function(controller) {
			_controller = controller;
		};

		return scope;

	}({}, jQuery));
});