/**
 * 摄像机规则设置(布控管理模块)
 * @author wangxiaojun
 * @date   2014-12-19
 * @return {[type]}   [description]
 */

define([
	'/module/protection-monitor/defencesetting/js/controller/control/camera-rule-frame-controller.js',
	'/module/protection-monitor/defencesetting/js/controller/control/camera-rule-video-controller.js',
	'DrawEditor',
	'base.self'
	], function(frame,videoContrl) {
	/**
	 * 规则设置
	 **/
	var CameraRuleSetting = new new Class({
		Implements: [Events, Options],

		options: {},

		initialize: function(options) {
			var self = this;
			//框线规则部分的事件绑定
			self.bindEvents();
		},

		/**
		 * 事件监听
		 */
		
		bindEvents: function() {
			var self = this;
			//视频右上角的图标事件（暂停截图&实时流切换）
			jQuery(document).off("click", ".control-video .alarm-events-content-video .content-top-video-tool .intercept").on("click", ".control-video .alarm-events-content-video .content-top-video-tool .intercept", function(e) {
				e.stopPropagation();
				if (!videoContrl.checkedPlayer(0)) {
					return false;
				}

				self.dealScreenShotEvent(this);
			});
			//布控任务设置框线规则时，播放窗口右上角眼睛的点击事件
			jQuery(document).off("click", ".control-video .alarm-events-content-video .content-top-video-tool .see").on("click", ".control-video .alarm-events-content-video .content-top-video-tool .see", function(e) {
				e.stopPropagation();
				self.showRuleListOnVideo(this);
			});
			/****框线设置监听事件****/
			DrawEditor.onmouseup = function(a, b, c) {};

			DrawEditor.onchange = function(data) {
				if (data.domid === "rect_max_face" || data.domid === "rect_min_face" || data.domid === "rect_face_rule") {
					//填充过滤器的最大&最小区域
					self.fillRectFilter(data);
				}
			};

			DrawEditor.onselect = function(id, text) {};
		},

		/**
		 * 显示当前摄像机的布控区域
		 * @param obj-调整按钮对象
		 */
		
		showCameraRule: function(obj) {
			var self = this;
			if (!videoContrl.checkedPlayer(1)) {
				return;
			}

			if (jQuery(obj).val() === "设置") {
				//更新页面按钮信息
				jQuery(obj).val("确定");
				//截图并根据情况显示已有的框线规则
				self.screenShotAndShowLines(function() {
					//显示当前摄像机对应的框线规则
					self.showProtectRuleOnDraw();
				});
			} else {
				DrawEditor.deletedom("rect_face_rule");
				var containerObj = jQuery(obj).closest(".control-camera-config");
				if (containerObj.find(".max-face .ui.button").val() === "标定" && containerObj.find(".min-face .ui.button").val() === "标定") {
					//显示实时流&删除图像
					videoContrl.showPlayingStream();
				}
				jQuery(obj).val("设置");
			}
		},

		/**
		 * 显示当前摄像机的最小人脸
		 * @param obj-最小人脸标定按钮对象
		 */
		
		showCameraMinSize: function(obj) {
			var self = this;
			if (!videoContrl.checkedPlayer(0)) {
				return;
			}
			if (jQuery(obj).val() === "标定") {
				//更新页面按钮信息
				jQuery(obj).val("确定");
				//截图并根据情况显示已有的框线规则
				self.screenShotAndShowLines(function() {
					//获取参数信息
					var minWidth = parseFloat(jQuery(obj).parent().find("input[name='minW']").val()),
						minHeight = parseFloat(jQuery(obj).parent().find("input[name='minH']").val());
					//转化成相对于当前显示分辨率下的宽度和高度
					var rectInfo = frame.formateDisplayRataRect({
						width: minWidth,
						height: minHeight
					}, videoContrl.getDisplayRate(), videoContrl.getCameraRate());
					minWidth = rectInfo.width;
					minHeight = rectInfo.height;
					//绘图
					var drawInfo = self.formateDisplayDataOnDraw({
						width: minWidth,
						height: minHeight,
						text: "最小人脸尺寸",
						domid: "rect_min_face"
					}, "rect_min_face");
					DrawEditor.add_rect(drawInfo);
				});
			} else {
				DrawEditor.deletedom("rect_min_face");
				var containerObj = jQuery(obj).closest(".control-camera-config");
				if (containerObj.find(".max-face .ui.button").val() === "标定" && containerObj.find(".rule-modify .ui.button").val() === "设置") {
					//显示实时流&删除图像
					videoContrl.showPlayingStream();
				}
				jQuery(obj).val("标定");
			}
		},

		/**
		 * 显示当前摄像机的最大人脸
		 * @param obj-最大人脸标定按钮对象
		 */
		
		showCameraMaxSize: function(obj) {
			var self = this;
			if (!videoContrl.checkedPlayer(0)) {
				return;
			}

			if (jQuery(obj).val() === "标定") {
				//更新页面按钮信息
				jQuery(obj).val("确定");
				//截图并根据情况显示已有的框线规则
				self.screenShotAndShowLines(function() {
					//获取参数信息
					var maxWidth = parseFloat(jQuery(obj).parent().find("input[name='maxW']").val()),
						maxHeight = parseFloat(jQuery(obj).parent().find("input[name='maxH']").val());
					//转化成相对于当前显示分辨率下的宽度和高度
					var rectInfo = frame.formateDisplayRataRect({
						width: maxWidth,
						height: maxHeight
					}, videoContrl.getDisplayRate(), videoContrl.getCameraRate());
					maxWidth = rectInfo.width;
					maxHeight = rectInfo.height;
					//绘图
					var drawInfo = self.formateDisplayDataOnDraw({
						width: maxWidth,
						height: maxHeight,
						text: "最大人脸尺寸",
						domid: "rect_max_face"
					}, "rect_max_face");
					DrawEditor.add_rect(drawInfo);
				});
			} else {
				DrawEditor.deletedom("rect_max_face");
				var containerObj = jQuery(obj).closest(".control-camera-config");
				if (containerObj.find(".min-face .ui.button").val() === "标定" && containerObj.find(".rule-modify .ui.button").val() === "设置") {
					//显示实时流&删除图像
					videoContrl.showPlayingStream();
				}
				jQuery(obj).val("标定");
			}
		},

		/**
		 * 触发截图，显示已有框线规则
		 */
		
		screenShotAndShowLines: function(callback) {
			var self = this;
			//判断是否已经有画布，没有则提示用户先暂停（抓图）
			if (jQuery("#TempSnapPicture").length === 0) {
				//直接抓图
				self.dealScreenShotEvent($("#control-main-content").find(".alarm-events-content-video .content-top-video-tool .intercept")[0], callback);
			} else {
				callback && callback();
			}
		},

		/**
		 * 视频截图相关逻辑
		 * @param obj
		 */
		
		dealScreenShotEvent: function(obj, callback) {

			var self = this;

			if (jQuery(obj).hasClass("icon_play")) {
				//显示实时流&删除图像
				videoContrl.showPlayingStream();
				//恢复页面dom对象状态
				jQuery(".control-camera-config.active .rule-modify input[type='button']").val("设置");
				jQuery(".control-camera-config.active .min-face input[type='button']").val("标定");
				jQuery(".control-camera-config.active .max-face input[type='button']").val("标定");
			} else {
				//如果视频上显示规则一打开，则隐藏
				var seeObj = jQuery(".control-video .alarm-events-content-video .content-top-video-tool .see");
				if (seeObj.hasClass("icon_eye_active")) {
					videoContrl.videoPlayer.releaseAllImage(0);
					seeObj.removeClass("icon_eye_active").attr("title", "查看人脸布控区域");
				}
				//改变按钮样式
				jQuery(obj).addClass("icon_play").attr("title", "播放");
				//摄像机抓图并生成图像&渲染图像
				var imgObj = videoContrl.videoScreenShot().imgObj,
					divObj = jQuery("<div>"),
					containerObj = jQuery(".control-video .alarm-events-content-video .content-down-video"),
					ocxObj = jQuery(".content-down-video .uiocx-control");
				//配置div遮罩层
				divObj.addClass("video-screen-shot").attr({
					"id": "TempSnapCover",
					"draggable": false
				});
				containerObj.append(imgObj).append(divObj);

				var $snapCover = jQuery("#TempSnapCover");
				$snapCover[0].onselectstart = function () { return false; };
				$snapCover[0].ondragstart = function () { return false; };
				$snapCover.attr("unselectable", "on");
				//初始化画布
				self.initDrawRect();
				//只要当前任务下侧设置、标定按钮均处于初始化状态时显示框线规则
				var ruleSet = jQuery(".control-camera-config.active .rule-modify input[type='button']").val(),
					minFace = jQuery(".control-camera-config.active .min-face input[type='button']").val(),
					maxFace = jQuery(".control-camera-config.active .max-face input[type='button']").val();
				if (ruleSet === "设置" && minFace === "标定" && maxFace === "标定") {
					//显示当前任务对应的框线规则
					self.showProtectRuleOnDraw();
					//设置当前任务详情面板的dom状态
					jQuery(".control-camera-config.active .rule-modify input[type='button']").val("确定");
				}
				//影藏实时流并显示图像
				
				jQuery("#TempSnapPicture").attr({
					"height": containerObj.height(),
					"position": "absolute"
				}).on("load", function () {
					containerObj.css({"background":"#000"});
					document.getElementById("UIOCXCONTROL").style.width = "1px";
					document.getElementById("UIOCXCONTROL").style.height = "1px";
					document.getElementById("UIOCXCONTROL").RefreshVideoWindow(0);
					
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

					callback && callback();
				});
			}
		},

		/**
		 * 初始化画布，当已经存在区域时，需要将区域填充到画布上
		 */
		
		initDrawRect: function() {
			var self = this,
				drawInfo = {};
			//初始化画图区域
			DrawEditor.init("TempSnapCover",videoContrl.getCameraRate().width*(videoContrl.getDisplayRate().height/videoContrl.getCameraRate().height), videoContrl.getDisplayRate().height);
			DrawEditor.strokewidth = 5;
			DrawEditor.fontsize = 14;
		},


		/**
		 * 格式化画布回显时的格式,将之前绘制的框线规则回显到画布上
		 * @param data-框线规则的坐标数据信息
		 * @param type-当前规则的类型
		 * @param displayRate-当前ocx显示的宽高，即显示分辨率
		 * @returns {{}}-返回DrawEditor能够识别的线条格式
		 */
		
		formateDisplayDataOnDraw: function(data, type, displayRate) {
			var self = this,
				resultData = {};
			if (type === "line") {
				resultData.type = self.getDirection(data.points);
				resultData.points = self.coordinateSwitchEx(data.points, data.drawRate, displayRate);
			} else if (type === "dline") {
				resultData = {
					line0: {
						points: []
					},
					line1: {
						points: []
					}
				};
				//赋值
				resultData.line0.type = self.getDirection(data.points.line0);
				resultData.line1.type = self.getDirection(data.points.line1);
				resultData.line0.points = self.coordinateSwitchEx(data.points.line0, data.drawRate, displayRate);
				resultData.line1.points = self.coordinateSwitchEx(data.points.line1, data.drawRate, displayRate);
			} else if (type === "rect") {
				var tempPoints = self.coordinateSwitchEx(data.points, data.drawRate, displayRate);
				resultData.x = tempPoints[0][0];
				resultData.y = tempPoints[0][1];
				resultData.width = Math.abs(tempPoints[2][0] - tempPoints[0][0]);
				resultData.height = Math.abs(tempPoints[2][1] - tempPoints[0][1]);
			} else if (type === "poly") {
				resultData.points = self.coordinateSwitchEx(data.points, data.drawRate, displayRate);
			} else if (type === "rect_min" || type === "rect_max" || type === "rect_car" || type === "rect_min_face" || type === "rect_max_face") {
				//最大、最小过滤时
				resultData.width = data.width;
				resultData.height = data.height;
			} else if (type === "rect_face_rule") {
				//人脸检测区域
				resultData.x = data.x;
				resultData.y = data.y;
				resultData.width = data.width;
				resultData.height = data.height;
			}
			resultData.domid = data.domid;
			resultData.text = data.text;

			return resultData;
		},



		/**
		 * 绘图画布使用，回显之前绘制过的线条
		 * @param points-线条中点的坐标信息
		 * @param drawRate-绘图时的分辨率
		 * @param DisplayRate-要显示的分辨率
		 * @returns {Array}-转化为要显示分辨率下的坐标信息
		 */
		
		coordinateSwitchEx: function(points, drawRate, DisplayRate) {
			var resultData = [],
				tempData = [],
				i = 0;
			//遍历坐标
			for (i = 0; i < points.length; i++) {
				//清空数组
				tempData.length = 0;
				//转化x坐标
				tempData.push(points[i][0] * (parseFloat(DisplayRate.width / drawRate.width)));
				//转化y坐标
				tempData.push(points[i][1] * (parseFloat(DisplayRate.height / drawRate.height)));
				//加载转化后的结果
				resultData.push(Object.clone(tempData));
			}
			return resultData;
		},


		/**
		 * 获取直线的方向用于重绘,根据方向的左手定则，以画线的起止点作为绘制方向，在线绘制方向的左手边，方向为left，右手边方向为right,双向为leftright
		 * @param points-线条的坐标信息（包括方向）
		 * @returns {string}-线条的方向
		 */
		
		getDirection: function(points) {

			if (points.length === 6) {
				//双向，直接返回
				return "leftright";
			}
			//获取划线的两个点坐标及斜率
			var x1 = points[0][0],
				y1 = points[0][1],
				x2 = points[1][0],
				y2 = points[1][1],
				lineSlope = parseFloat(parseFloat(y2 - y1) / parseFloat(x2 - x1)),
				dir_x = points[3][0],
				dir_y = points[3][1],
				dir_tag = -1,
				y = -1;
			//根据不同的情况计算方向
			if (y1 === y2) {
				//横向
				dir_tag = ((x2 - x1) > 0) ? 1 : 0; //从左到右为1，右到左为0
				if (dir_y < y1) {
					//如果方位点在当前线的上面
					return (dir_tag === 1) ? "left" : "right";
				} else {
					//如果方位点在当前线的下面
					return (dir_tag === 1) ? "right" : "left";
				}
			} else if (x1 === x2) {
				//竖向
				dir_tag = ((y2 - y1) > 0) ? 1 : 0; //从上到下为1，下到上为0
				if (dir_x < x1) {
					//如果方位点在当前线的左边
					return (dir_tag === 1) ? "right" : "left";
				} else {
					//如果方位点在当前线的右边
					return (dir_tag === 1) ? "left" : "right";
				}
			} else {
				//西北--东南向 和 东北--西南向
				dir_tag = ((x2 - x1) > 0) ? 1 : 0; //从左到右为1，右到左为0
				//求得直线方程上dir_x点的纵坐标值
				y = lineSlope * dir_x - lineSlope * x1 + y1;
				//比较 y值和dir_y的大小
				if (y < dir_y) {
					//方位点在直线下面
					return (dir_tag === 1) ? "right" : "left";
				} else {
					//方位点在直线上面
					return (dir_tag === 1) ? "left" : "right";
				}
			}
		},

		/**
		 * 标定后的最大、最小区域、车牌大小、人脸布控区域、人脸尺寸的填充
		 * @param data-待显示的坐标信息
		 */
		
		fillRectFilter: function(data) {
			var self = this;
			if (!data.points || !(data.points instanceof Array) || data.points.length !== 4) {
				notify.error("标定区域参数有误！");
				return;
			}
			var drawRate = videoContrl.getDisplayRate(),
				cameraRate = videoContrl.getCameraRate();
			data.points = self.coordinateSwitchEx(data.points, drawRate, cameraRate);
			var width = parseFloat(Math.abs(data.points[0][0] - data.points[1][0])).toFixed(1),
				height = parseFloat(Math.abs(data.points[0][1] - data.points[2][1])).toFixed(1);
			//赋值给最大最小区域
			if (data.domid === "rect_min_face") {
				//最小人脸尺寸
				jQuery(".camera-list .active.control-camera-config").find(".min-face input[name='minW']").val(width);
				jQuery(".camera-list .active.control-camera-config").find(".min-face input[name='minH']").val(height);
				//取最小边作为最小人脸尺寸，后续会调整为正方形
				videoContrl.faceProtectInfo.minSize = (width > height) ? parseInt(height) : parseInt(width);
			} else if (data.domid === "rect_max_face") {
				//最大人脸尺寸
				jQuery(".camera-list .active.control-camera-config").find(".max-face input[name='maxW']").val(width);
				jQuery(".camera-list .active.control-camera-config").find(".max-face input[name='maxH']").val(height);
				//取最大边作为最大人脸尺寸，后续会调整为正方形
				videoContrl.faceProtectInfo.maxSize = (width > height) ? parseInt(width) : parseInt(height);
			} else if (data.domid === "rect_face_rule") {
				//将坐标转化为cameraRate并存储
				videoContrl.faceProtectInfo.pointsInfo.left = data.points[0][0];
				videoContrl.faceProtectInfo.pointsInfo.top = data.points[0][1];
				videoContrl.faceProtectInfo.pointsInfo.right = data.points[2][0];
				videoContrl.faceProtectInfo.pointsInfo.bottom = data.points[2][1];
				jQuery(".camera-list .active.control-camera-config").find(".save-protect input[name='left']").val(data.points[0][0]);
				jQuery(".camera-list .active.control-camera-config").find(".save-protect input[name='top']").val(data.points[0][1]);
				jQuery(".camera-list .active.control-camera-config").find(".save-protect input[name='right']").val(data.points[2][0]);
				jQuery(".camera-list .active.control-camera-config").find(".save-protect input[name='bottom']").val(data.points[2][1]);
			}
		},

		/**
		 * 点击右上角那个眼睛的点击事件
		 * @param obj 右上角眼睛的dom对象
		 */
		
		showRuleListOnVideo: function(obj) {
			var self = this;
			//规则的详细设置页面-直接显示，不在读取数据库
			if (jQuery(obj).hasClass("icon_eye_active")) {
				jQuery(obj).removeClass("icon_eye_active").attr("title", "查看人脸布控区域");
				//清除绘图
				videoContrl.videoPlayer.releaseAllImage(0);
			} else {
				if (!videoContrl.checkedPlayer(3)) {
					notify.warn("正在加载摄像机视频，请稍后...");
					return;
				}
				if (jQuery("#TempSnapCover").length !== 0) {
					notify.warn("请先播放摄像机再进行操作！");
					return;
				}
				jQuery(obj).addClass("icon_eye_active").attr("title", "隐藏人脸布控区域");
				//显示当前规则对应的框线规则
				videoContrl.dealGraphicOnVideo(self.getFaceRuleDetails(), videoContrl.getDisplayRate());
			}
		},


		/**
		 * 获取当前布控任务的人脸检测区域信息,眼睛查看的时候调用
		 */
		getFaceRuleDetails: function() {
			var self = this;
			var ruleInfo = [{
				text: "人脸检测区域",
				type: "rect",
				points: [4],
				drawRate: videoContrl.getDisplayRate()
			}];
			//获取当前的坐标区域
			var x = 50,
				y = 50,
				width = videoContrl.getDisplayRate().width - 100,
				height = videoContrl.getDisplayRate().height - 100;
			x = (videoContrl.faceProtectInfo.pointsInfo.left === 0) ? x : videoContrl.faceProtectInfo.pointsInfo.left;
			y = (videoContrl.faceProtectInfo.pointsInfo.left === 0) ? y : videoContrl.faceProtectInfo.pointsInfo.top;
			width = ((videoContrl.faceProtectInfo.pointsInfo.right - videoContrl.faceProtectInfo.pointsInfo.left) > 0) ? (videoContrl.faceProtectInfo.pointsInfo.right - videoContrl.faceProtectInfo.pointsInfo.left) : width;
			height = ((videoContrl.faceProtectInfo.pointsInfo.bottom - videoContrl.faceProtectInfo.pointsInfo.top) > 0) ? (videoContrl.faceProtectInfo.pointsInfo.bottom - videoContrl.faceProtectInfo.pointsInfo.top) : height;
			//装载坐标信息
			ruleInfo[0].points[0] = [];
			ruleInfo[0].points[0][0] = x;
			ruleInfo[0].points[0][1] = y;

			ruleInfo[0].points[1] = [];
			ruleInfo[0].points[1][0] = parseFloat(x) + parseFloat(width);
			ruleInfo[0].points[1][1] = y;

			ruleInfo[0].points[2] = [];
			ruleInfo[0].points[2][0] = parseFloat(x) + parseFloat(width);
			ruleInfo[0].points[2][1] = parseFloat(y) + parseFloat(height);

			ruleInfo[0].points[3] = [];
			ruleInfo[0].points[3][0] = x;
			ruleInfo[0].points[3][1] = parseFloat(y) + parseFloat(height);
			//返回布控任务的规则区域
			return ruleInfo;
		},
		/**
		 * 布控任务当前摄像机规则在画布上显示
		 */
		showProtectRuleOnDraw: function() {
			
			var self = this;
			//获取人脸检测区域的坐标信息
			var displayRate = videoContrl.getDisplayRate();
			var cameraRate = videoContrl.getCameraRate();
			var x = 0,
				y = 0,
				width = displayRate.width - 100,
				height = displayRate.height - 100;
			x = (videoContrl.faceProtectInfo.pointsInfo.left === 0) ? x : videoContrl.faceProtectInfo.pointsInfo.left;
			y = (videoContrl.faceProtectInfo.pointsInfo.top === 0) ? y : videoContrl.faceProtectInfo.pointsInfo.top;
			width = ((videoContrl.faceProtectInfo.pointsInfo.right - videoContrl.faceProtectInfo.pointsInfo.left) > 0) ? (videoContrl.faceProtectInfo.pointsInfo.right - videoContrl.faceProtectInfo.pointsInfo.left) : width;
			height = ((videoContrl.faceProtectInfo.pointsInfo.bottom - videoContrl.faceProtectInfo.pointsInfo.top) > 0) ? (videoContrl.faceProtectInfo.pointsInfo.bottom - videoContrl.faceProtectInfo.pointsInfo.top) : height;
			//如果是默认值，则不需要转换
			if ((videoContrl.faceProtectInfo.pointsInfo.right - videoContrl.faceProtectInfo.pointsInfo.left) == 0) {
				//转化成相对于当前显示分辨率下的宽度和高度
				width = cameraRate.width * (displayRate.height / cameraRate.height)-120;
				height = height;
				x = x * displayRate.width / cameraRate.width;
				y = y * displayRate.height / cameraRate.height;
			}
			//绘图
			var drawInfo = self.formateDisplayDataOnDraw({
				x: x,
				y: y,
				width: width,
				height: height,
				text: "人脸检测区域",
				domid: "rect_face_rule"
			}, "rect_face_rule");
			DrawEditor.add_rect(drawInfo);
		}
	});

	return {
		CameraRuleSetting: CameraRuleSetting,
		frame:frame,
		videoContrl:videoContrl
	}

});