/**
 * 地图切换
 * @author Li Dan
 * @date   2014-12-16
 */
define(['js/npmap-new/map-variable', 'jquery'], function(Variable){

	var SwitchMap = function() {};

	SwitchMap.prototype = {
		/**
		 * 绑定事件
		 * @author Li Dan
		 * @date   2014-12-16
		 * @return {[type]}   [description]
		 */
		bindEvents: function(){
			var self = this;
			//切换图层
			jQuery(document).on("click", ".opera-container a.map-layer-normal,.opera-container a.map-layer-satellite", function() {
				self.switchMapLayer(this);
			});
		},
		/**
		 * 切换图层
		 * @author Li Dan
		 * @date   2014-12-16
		 * @param  {[type]}   obj [description]
		 * @return {[type]}       [description]
		 */
		switchMapLayer: function(obj) {
			var This = jQuery(obj);
			if (This.attr("layer") === "normal") {
				if(mapConfig.satelliteLayer.length>0){
					This.removeClass("map-layer-satellite").addClass("map-layer-normal");
					This.attr("layer", "sattilate");
					This.attr("title", "显示普通地图");
					This.find(".map-layer-text").text("地图");
					// 图层切换到卫星地图
					Variable.map.setBaseLayer(mapConfig.satelliteLayer[0]);
				}else{
					notify.warn("暂无卫星图层");
					return;
				}
			} else {
				This.removeClass("map-layer-normal").addClass("map-layer-satellite");
				This.attr("layer", "normal");
				This.attr("title", "显示卫星地图");
				This.find(".map-layer-text").text("卫星");
				// 图层切换到普通地图
				Variable.map.setBaseLayer(mapConfig.baseLayer[0]);
			}
		}
	};

	return new SwitchMap();
});