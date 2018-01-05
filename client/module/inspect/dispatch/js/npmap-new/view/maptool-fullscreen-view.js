/**
 * 全屏：提供打开全屏和退出全屏方法
 * @author Li Dan
 * @date   2014-12-15
 */
define(['broadcast', 'js/npmap-new/map-variable', 'base.self'], function(broadcast, Variable) {
	var FullScreen = function() {
		var self = this;
		//ESC键退出全屏
		document.onkeydown = function() {
			if (window.event.keyCode == 27) {
				if(jQuery(".map-exitfullscreen")[0]){
					self.exit(jQuery(".map-exitfullscreen")[0]);
				}
			}
		};
	};
	FullScreen.prototype = {

		/**
		 * 地图工具栏全屏、还原事件处理程序
		 * @author Li Dan
		 * @date   2014-12-15
		 * @return {[type]}   [description]
		 */
		setFullScreenOrNot: function(context) {
			var self = this;
			if(jQuery(context).hasClass("map-fullscreen")){
				self.open(context);
			} else {
				self.exit(context);
			}
		},
		/**
		 * 打开全屏
		 * @author Li Dan
		 * @date   2014-12-15
		 * @param  {[type]}   obj [description]
		 * @return {[type]}       [description]
		 */
		open: function(obj) {
			var This = jQuery(obj);
			//隐藏地图外的其他内容 songxj update
			broadcast.emit("dealFullScreen", {"fullscreenFlag": true});
			//jQuery("#navigator,#header").hide();

			jQuery("#sidebar").hide();
			jQuery("#content .wrapper").css("top", "0px");
			jQuery("#major").css({
				top: "0px",
				left: "0px"
			});
			//加载全屏模式下的工具条
			This.removeClass("map-fullscreen").addClass("map-exitfullscreen").find("a").text("退出全屏").attr("title", "退出全屏");
			//重新设置地图大小
			Variable.map.updateSize();
			//设置全屏参数
			Variable.isFullscreenOnMapStyle = true;
		},
		/**
		 * 退出全屏
		 * @author Li Dan
		 * @date   2014-12-15
		 * @param  {[type]}   obj [description]
		 * @return {[type]}       [description]
		 */
		exit: function(obj) {
			var This = jQuery(obj);
			/**
			 * 显示地图外的其他元素
			 * 1、地图定位播放时。
			 * 2、其他正常操作
			 */
			if(!window.isPointPlay) {
				// songxj update
				broadcast.emit("dealFullScreen", {"fullscreenFlag": false});
				//jQuery("#navigator,#header,#sidebar").show();
				jQuery("#sidebar").show();
				//jQuery("#content .wrapper").css("top", "86px");

				jQuery("#major").css({
					top: "10px",
					left: jQuery("#sidebar").width()
				});
			} else {
				jQuery("#sidebar").show();
				jQuery("#major").css({
					left: jQuery("#sidebar").width()
				});
			}
			//加载非全屏状态下的工具条
			This.removeClass("map-exitfullscreen").addClass("map-fullscreen").find("a").text("全屏").attr("title", "全屏");
			//重新设置地图大小
			Variable.map.updateSize();
			//设置全屏参数
			Variable.isFullscreenOnMapStyle = false;
		},
		/**
		 * 确定是否退出全屏
		 * @author Li Dan
		 * @date   2014-12-15
		 * @return {[type]}   [description]
		 */
		confirmExit: function() {
			var self = this;
			new ConfirmDialog({
				title: '退出全屏',
				confirmText: '确定',
				message: "当前处于全屏效果，若要查看结果，需要先退出全屏；</br>退出全屏？",
				callback: function() {
					self.exitFullscreen(".map-tool-item .map-exitfullscreen");
				}
			});
		}
	};

	return new FullScreen();
});
