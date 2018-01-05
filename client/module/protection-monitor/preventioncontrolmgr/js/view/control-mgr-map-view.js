/**
 * 布控任务管理地图相关的view
 */
define(['js/preventcontrol-global-var','pubsub'],function(globalVar,PubSub){
	var View = function(){};
	View.prototype = {
		init:function(){
			this.bindEvents();
		},
		//绑定地图工具事件
		bindEvents:function(){
			var self = this;
			//工具
			jQuery(".map-tools-list li a").click(function() {
				var This = jQuery(this);
				//框选放大
				if (This.data("type") === "max") {
					//框选放大操作
					globalVar.map.zoomIn();
					//激活鼠标文字跟踪
					globalVar.map.activateMouseContext("框选放大地图,右键取消。");

					// 绑定右键取消点击事件
					globalVar.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
					globalVar.map.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK, function (point) {
						// 取消文本提示
						globalVar.map.deactivateMouseContext();
						// 取消左键点击事件
						globalVar.map.zoomInOutStop();
					});
				} else if (This.data("type") === "min") { //框选缩小
					//框选放大操作
					globalVar.map.zoomOut();
					//激活鼠标文字跟踪
					globalVar.map.activateMouseContext("框选缩小地图,右键取消。");

					// 绑定右键取消点击事件
					globalVar.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
					globalVar.map.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK, function (point) {
						// 取消文本提示
						globalVar.map.deactivateMouseContext();
						// 取消左键点击事件
						globalVar.map.zoomInOutStop();
					});
				} else if (This.data("type") === "measure") { //测距
					globalVar.measuretool.setMode(NPMapLib.MEASURE_MODE_DISTANCE);
				} else if (This.data("type") === "clear") { //清除

				}
			});
			//全屏
			jQuery(".map-toolbar .fullscreen").click(function() {
				var This = jQuery(this);
				//退出全屏
				if (This.hasClass("exit")) {
					//显示地图外的其他元素
					jQuery("#navigator,#header,#sidebar").show();
					jQuery("#content .wrapper").css("top", "0");
					jQuery("#major").css({
						top: "10px",
						left: jQuery("#sidebar").width()
					});
					This.attr("title","全屏");
					//重置地图大小
					globalVar.map.updateSize();
					//去掉退出全屏样式
					This.removeClass("exit");
				} else { //全屏
					//隐藏地图外的其他内容
					jQuery("#navigator,#header").hide();
					jQuery("#sidebar").hide();
					jQuery("#content .wrapper").css("top", "0px");
					jQuery("#major").css({
						top: "0px",
						left: "0px"
					});
					This.attr("title","退出全屏");
					//重置地图大小
					globalVar.map.updateSize();
					//添加退出全屏按钮样式
					This.addClass("exit");
				}
			});
			//资源图层切换事件绑定
			jQuery(".map-resource-layers").hover(function() {
				var This = jQuery(this);
				This.find("h2 span.contract-btn").addClass("down");
				This.stop();
				This.animate({
					width: "90px",
					height: "160px"
				}, 300, function() {
					This.find(".resource-layers").show();
				});
			}, function() {
				var This = jQuery(this);
				This.find("h2 span.contract-btn").removeClass("down");
				This.stop();
				This.animate({
					width: "55px",
					height: "26px"
				}, 1000, function() {
					This.find(".resource-layers").hide();
				});
			});
			//资源图层控制
			jQuery(document).on("click", ".map-resource-layers ul li", function() {
				var This = jQuery(this);
				This.toggleClass("active");
				PubSub.publish("controlSourceLayer",This);
			});
		}
	};
	return new View();
});