/*global SHOW_PLAYING_VIDEO_STREAM:true, SCREEN_SHOT_AND_SHOW_LINES:true, DrawEditor:true*/
/**
 * Created by Zhangyu on 2014/12/10.
 * 布防规则设置，划线相关逻辑展现
 */
define([
	"/module/protection-monitor/defencesetting/js/global-var.js",
	"jquery",
	"pubsub",
	"DrawEditor"
], function(globalVar, jQuery, PubSub) {
	var View = function () {};

	View.prototype = {
		//框线规则区域列表控制器
		areaListController: null,
		//当前逻辑控制器
		controller: null,
		/**
		 * 初始化页面
		 */
		init: function (areaListController, controller) {
			var self = this;
			//初始化变量
			self.areaListController = areaListController;
			self.controller = controller;
			//绑定事件
			self.bindEvents();
		},
		/**
		 * 事件绑定
		 */
		bindEvents: function () {

			var self = this, $defenceWindow = jQuery("#defenceWindow");

			//视频右上角的图标事件（绘制矩形&多边形）
			$defenceWindow.find(".alarm-events-content-video .content-top-video-tool .rectangle").off("click").on("click", function () {
				var $node = jQuery(this);
				//触发截图并根据情况显示已有的框线规则
				PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
					callback: function() {
						//设置画笔
						if ($node.hasClass("icon_rec")) {
							//矩形
							DrawEditor.setPenType("rect");
							DrawEditor.showhelp("rect");
						} else if ($node.hasClass("icon_pol")) {
							//多边形
							DrawEditor.setPenType("poly");
							DrawEditor.showhelp("poly");
						}
					}
				});
			});
			//视频右上角的图标事件（绘制直线:单线、双线）
			$defenceWindow.find(".alarm-events-content-video .content-top-video-tool .line").off("click").on("click", function () {
				var $node = jQuery(this);
				//触发截图并根据情况显示已有的框线规则
				PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
					callback: function() {
						//设置画笔
						if ($node.hasClass("icon_line")) {
							//单线
							DrawEditor.setPenType("Arrowline");
						} else if ($node.hasClass("icon_dbline")) {
							//双线
							DrawEditor.setPenType("Twoline");
						}
						DrawEditor.showhelp("line");
					}
				});
			});
			//视频右上角的图标事件（清除图形事件）
			$defenceWindow.find(".alarm-events-content-video .content-top-video-tool .remove").off("click").on("click", function () {
				PubSub.publish("removeLines", {
					obj: this
				});
			});
			//最小物体标定按钮的点击事件
			jQuery("#RuleMinFilterModify").off("click").on("click", function () {
				var $node = jQuery(this);
				if ($node.attr("title") === "标定") {
					//触发截图并根据情况显示已有的框线规则
					PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
						callback: function() {
							PubSub.publish("showFilterRect", {
								type: "rect_min",
								width: parseFloat($node.parent().find("input[name='minW']").val()),
								height: parseFloat($node.parent().find("input[name='minH']").val())
							});
						}
					});
					
					//更新页面按钮信息
					$node.attr("title", "确定").addClass('active');
				} else {
					DrawEditor.deletedom("rect_min");
					if (jQuery("#RuleMaxFilterModify").attr("title") === "标定") {
						//显示实时流&删除图像
						PubSub.publish(SHOW_PLAYING_VIDEO_STREAM, {});
					}
					$node.attr("title", "标定").removeClass('active');
				}
			});
			//最大物体标定按钮的点击事件
			jQuery("#RuleMaxFilterModify").off("click").on("click", function () {
				var $node = jQuery(this);
				if ($node.attr("title") === "标定") {
					//触发截图并根据情况显示已有的框线规则
					PubSub.publish(SCREEN_SHOT_AND_SHOW_LINES, {
						callback: function() {
							PubSub.publish("showFilterRect", {
								type: "rect_max",
								width: parseFloat($node.parent().find("input[name='maxW']").val()),
								height: parseFloat($node.parent().find("input[name='maxH']").val())
							});
						}
					});
					
					//更新页面按钮信息
					$node.attr("title", "确定").addClass('active');
				} else {
					DrawEditor.deletedom("rect_max");
					if (jQuery("#RuleMinFilterModify").attr("title") === "标定") {
						//显示实时流&删除图像
						PubSub.publish(SHOW_PLAYING_VIDEO_STREAM, {});
					}
					$node.attr("title", "标定").removeClass('active');
				}
			});
			//车辆特征识别的标定按钮的点击事件
			jQuery("#CarFlagModify").off("click").on("click", function () {
				var $node = jQuery(this);
				if ($node.attr("title") === "标定") {
					//触发截图并根据情况显示已有的框线规则
					PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
						callback: function() {
							PubSub.publish("showFilterRect", {
								type: "rect_car",
								width: parseFloat($node.parent().find("input[name='carFlagW']").val()),
								height: parseFloat($node.parent().find("input[name='carFlagH']").val())
							});
						}
					});
					
					//更新页面按钮信息
					$node.attr("title", "确定").addClass('active');
				} else {
					DrawEditor.deletedom("rect_car");
					//显示实时流&删除图像
					PubSub.publish(SHOW_PLAYING_VIDEO_STREAM, {});
					$node.attr("title", "标定").removeClass('active');
				}
			});

			/****框线设置监听事件****/
			DrawEditor.onmouseup = function (a, b, c) {};

			DrawEditor.onchange = function (data) {
				if (data.domid === "rect_min" || data.domid === "rect_max" || data.domid === "rect_car" || data.domid === "rect_max_face" || data.domid === "rect_min_face" || data.domid === "rect_face_rule") {
					//触发函数，填充过滤器的最大&最小区域
					self.controller.fillRectFilter(data);
				} else {
					//触发函数，将框线区域添加到当前规则的区域列表中
					self.areaListController.addAreaToList(data);
				}
			};

			DrawEditor.onselect = function (id, text) {};
		},
		/**
		 * 标定后调整区域，填充页面dom元素
		 * @param width - 新的宽度
		 * @param height - 新的高度
		 * @param type - 当前需要更新的类型（最大物体、最小物体、车牌大小、最大人脸、最小人脸）
		 */
		fillRectFilter: function (width, height, type) {
			var ruleInfo = globalVar.defence.ruleInfo;
			var $maxStaff = jQuery(".event-rect-filter"),
				$carFlag = jQuery(".car-flag-set");
			if (type === "rect_min") {
				//最小物体
				$maxStaff.find(".filter-info[name='minW']").val(width);
				$maxStaff.find(".filter-info[name='minH']").val(height);
			} else if (type === "rect_max") {
				//最大物体
				$maxStaff.find(".filter-info[name='maxW']").val(width);
				$maxStaff.find(".filter-info[name='maxH']").val(height);
			} else if (type === "rect_car") {
				//车牌大小
				$carFlag.find(".car-flag-info[name='carFlagW']").val(width);
				$carFlag.find(".car-flag-info[name='carFlagH']").val(height);
			} else if (type === "rect_min_face") {
				//最小人脸
				ruleInfo.faceProtectInfo.containerObj.find(".min-face .face-protect-info[name='faceFlagW']").val(width);
				ruleInfo.faceProtectInfo.containerObj.find(".min-face .face-protect-info[name='faceFlagH']").val(height);
			} else if (type === "rect_max_face") {
				//最大人脸
				ruleInfo.faceProtectInfo.containerObj.find(".max-face .face-protect-info[name='faceFlagW']").val(width);
				ruleInfo.faceProtectInfo.containerObj.find(".max-face .face-protect-info[name='faceFlagH']").val(height);
			}
		}
	};

	return new View();
});