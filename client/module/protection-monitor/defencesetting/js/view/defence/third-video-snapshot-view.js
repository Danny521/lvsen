/*global SHOW_PLAYING_VIDEO_STREAM:true, SCREEN_SHOT_AND_SHOW_LINES:true*/
/**
 * Created by Zhangyu on 2014/12/10.
 * 布防规则设置，视频截图相关展现
 */
define([
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	"/module/protection-monitor/defencesetting/js/global-var.js",
	"jquery",
	"pubsub"
], function(DefenceTools, globalVar, jQuery, PubSub) {

	var ScreenSnapShotView = (function(scope, $) {

		//截图逻辑相关控制器
		scope.controller = null;

		/**
		 * 事件绑定
		 */
		scope.bindEvents = function () {
			//视频右上角的图标事件（暂停截图&实时流切换）
			$("#defenceWindow").find(".alarm-events-content-video .content-top-video-tool .intercept").off("click").on("click", function () {
				//触发进行视频截图
				scope.controller.dealScreenShotEvent(this);
			});
		};

		/**
		 * 触发截图，显示已有框线规则
		 */
		scope.screenShotAndShowLines = function (msg, data) {
			//判断是否已经有画布，没有则提示用户先暂停（抓图）
			if (jQuery("#TempSnapPicture").length === 0) {
				//直接抓图
				scope.controller.dealScreenShotEvent($("#defenceWindow").find(".alarm-events-content-video .content-top-video-tool .intercept")[0], data.callback);
			} else {
				data.callback && data.callback();
			}
		};

		/**
		 * 播放实时流，后退、保存、删除、和“播放”时使用（切换页面时）
		 */
		scope.showPlayingStream = function () {
			if ($("#TempSnapPicture").length !== 0) {

				$("#defenceWindow").find(".alarm-events-content-video .content-top-video-tool .intercept").removeClass("icon_play").attr("title", "暂停");
				//显示实时流&删除图像
				$("#TempSnapPicture, #TempSnapCover").remove();
				document.getElementById("UIOCXDEFEND").style.width = "100%";
				document.getElementById("UIOCXDEFEND").style.height = "100%";
				document.getElementById("UIOCXDEFEND").style.marginLeft = "";
			}
		};

		return scope;

	}(ScreenSnapShotView || {}, jQuery));

	/**
	 * 视频截图相关展现逻辑
	 */
	var View = function () {
		//订阅事件-播放实时流
		PubSub.unsubscribe(self.SHOW_PLAYING_VIDEO_STREAMToken);
		self.SHOW_PLAYING_VIDEO_STREAMToken = PubSub.subscribe(SHOW_PLAYING_VIDEO_STREAM, ScreenSnapShotView.showPlayingStream);
		//订阅事件-截图并显示框线规则
		PubSub.unsubscribe(self.SCREEN_SHOT_AND_SHOW_LINESToken);
		self.SCREEN_SHOT_AND_SHOW_LINESToken = PubSub.subscribe(SCREEN_SHOT_AND_SHOW_LINES, ScreenSnapShotView.screenShotAndShowLines);
	};

	View.prototype = {
		/**
		 * 初始化函数
		 */
		init: function (controller) {
			//初始化控制器
			ScreenSnapShotView.controller = controller;
			//事件绑定
			ScreenSnapShotView.bindEvents();
		},
		//播放摄像机实时流
		showPlayingStream: ScreenSnapShotView.showPlayingStream,
		/**
		 * 视频截图后，显示截图到视频上
		 * @param imgInfo - 截图数据的信息
		 * @param obj - 播放/暂停dom对象
		 * @param fn - 回调函数，图片加载完成后，执行画布初始化
		 */
		showSnapShot: function (imgInfo, obj, fn) {

			//如果视频上显示规则一打开，则隐藏
			var $defenceWindow = jQuery("#defenceWindow"), seeObj = $defenceWindow.find(".alarm-events-content-video .content-top-video-tool .see");
			if (seeObj.hasClass("icon_eye_active")) {
				globalVar.defence.videoPlayer.releaseAllImage(0);
				seeObj.removeClass("icon_eye_active").attr("title", "查看规则");
			}
			//改变按钮样式
			jQuery(obj).addClass("icon_play").attr("title", "播放");
			//摄像机抓图并生成图像&渲染图像
			var imgObj = imgInfo.imgObj, divObj = jQuery("<div>"), containerObj = $defenceWindow.find(".alarm-events-content-video .content-down-video"), ocxObj = document.getElementById("UIOCXDEFEND");
			//配置div遮罩层
			divObj.addClass("video-screen-shot").attr({
				"id": "TempSnapCover",
				"draggable": false
			});
			containerObj.append(imgObj).append(divObj);
			//禁用截图的鼠标拖动功能
			var $snapCover = jQuery("#TempSnapCover");
			$snapCover[0].onselectstart = function () { return false; };
			$snapCover[0].ondragstart = function () { return false; };
			$snapCover.attr("unselectable", "on");
			//影藏实时流并显示图像
			jQuery("#TempSnapPicture").attr({
				"height": containerObj.height(),
				"position": "absolute"
			}).on("load", function () {
				document.getElementById("UIOCXDEFEND").style.width = "1px";
				document.getElementById("UIOCXDEFEND").style.height = "1px";
				document.getElementById("UIOCXDEFEND").style.marginLeft = "-5px";
				containerObj.css({"background":"#000"});
				jQuery(this).attr({
					"width": imgObj[0].clientWidth*(containerObj.height()/imgObj[0].clientHeight)>=containerObj.width()?containerObj.width():imgObj[0].clientWidth*(containerObj.height()/imgObj[0].clientHeight)
				}).css({
					"margin-left":(containerObj.width()-imgObj[0].clientWidth)/2,
					"margin-top":(containerObj.height()-imgObj[0].clientHeight)/2
				});

				$snapCover.css({
					"width": imgObj[0].clientWidth*(containerObj.height()/imgObj[0].clientHeight)>=containerObj.width()?containerObj.width():imgObj[0].clientWidth*(containerObj.height()/imgObj[0].clientHeight),
					"height":containerObj.height(),
					"margin-left":(containerObj.width()-imgObj[0].clientWidth)/2,
					"margin-top":(containerObj.height()-imgObj[0].clientHeight)/2
				});

				fn && fn();
			});
			
		}
	};

	return new View();
});
