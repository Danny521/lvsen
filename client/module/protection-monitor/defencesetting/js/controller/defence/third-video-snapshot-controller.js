/**
 * Created by Zhangyu on 2014/12/9.
 * 布防规则设置-算法详细规则设置-视频截图相关控制器
 */
define([
	// 布防任务model层
	"/module/protection-monitor/defencesetting/js/model/defence-model.js",
	"/module/protection-monitor/defencesetting/js/view/defence/third-video-snapshot-view.js",
	"/module/protection-monitor/defencesetting/js/view/defence/third-protect-view.js",
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	"/module/protection-monitor/defencesetting/js/global-var.js",
	"/module/protection-monitor/defencesetting/js/controller/defence/third-drawlines-controller.js",
	"jquery"
], function(model, view, protectView, DefenceTools, globalVar, linesController, jQuery) {
	var ScreenSnapShot = (function (scope, $) {
		/**
		 * 摄像机截图
		 * @returns {{imgObj: *}} - 返回生成的图片对象
		 * @private
		 */
		var _videoScreenShot = function () {
			var imgData = globalVar.defence.videoPlayer.catchOriginal(0), imgPath = "data:image/jpg;base64," + imgData;//IE8+
			//考虑到以后高清高速摄像机的图片会非常大，故只在ie8的情况下进行上传处理
			//if (DefenceTools.checkWebBrowser("MSIE 8.0")) {
				/**
				 * 下面这条实现ocx截图后的格式封装，在再ie9及以上版本均可以，ie8对大于32kb的图像数据不兼容；
				 * 故此处更改为后台进行图片包装，然后用地址显示
				 */
				model.postData("formateImgData", {
					picture: encodeURI(imgData.replace(/[\n\r]/ig, ""))
				}, {
					async: false
				}).then(function (res) {
					if (res.code === 200) {
						imgPath = res.data.path;
					} else if (res.code === 500) {
						notify.error(res.data.message);
					} else {
						notify.error("画布初始化异常！");
					}
				}, function () {
					notify.error("画布初始化异常！");
				});
			//}
			//初始化图像对象
			var imgObj = $("<img>").attr({
				"src": imgPath,
				"id": "TempSnapPicture",
				"draggable": false
			}).css({
				left: -1000 + "px"
			});

			return { imgObj: imgObj };
		};
		/**
		 * 视频截图相关逻辑
		 * @param obj - 视频截图、播放dom对象
		 */
		scope.dealScreenShotEvent = function (obj, callback) {
			var ruleInfo = globalVar.defence.ruleInfo;
			if ($(obj).hasClass("icon_play")) {
				//显示实时流&删除图像
				view.showPlayingStream();
				//如果当前处于布控模式，则清除掉布控模块中的dom状态
				if (!ruleInfo.isDefenceFlag) {
					protectView.recoverProtectDomStatus();
				}
			} else {
				//触发截图并返回
				var imgInfo = _videoScreenShot();
				//显示截图信息
				view.showSnapShot(imgInfo, obj, function() {
					//加载框线
					if(jQuery("#DrawEditor_ShowHelp").length){
						jQuery("#DrawEditor_ShowHelp").remove();
					}
					linesController.initDraw();
					// 执行回调
					callback && callback();
				});
			}
		};

		return scope;

	}(ScreenSnapShot || {}, jQuery));

	var Controller = function () { };

	Controller.prototype = {
		/**
		 * 初始化函数
		 */
		init: function () {
			//初始化截图相关
			view.init(this);
		},
		//视频截图相关逻辑
		dealScreenShotEvent: ScreenSnapShot.dealScreenShotEvent
	};

	return new Controller();
});