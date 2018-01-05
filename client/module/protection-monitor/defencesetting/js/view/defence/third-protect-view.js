/*global SHOW_PLAYING_VIDEO_STREAM:true, SCREEN_SHOT_AND_SHOW_LINES:true, DrawEditor:true*/
/**
 * Created by Zhangyu on 2014/12/10.
 * 布防规则设置，人脸布控相关界面显示
 */
define([
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	"/module/protection-monitor/defencesetting/js/global-var.js",
	"/module/protection-monitor/defencesetting/js/view/defence/third-video-snapshot-view.js",
	"jquery",
	"pubsub",
	"DrawEditor"
], function(DefenceTools, globalVar, view, jQuery, PubSub) {
	var View = function () {
		var self = this;
		//注册模板
		self.registerHelper();
	};

	View.prototype = {
		//模板渲染对象
		compiler: null,
		//模板的地址
		templateUrl: "/module/common/defencesetting/inc/defence-template.html",
		/**
		 * 初始化页面
		 * @param data - 待渲染的数据
		 */
		initPage: function (data) {
			var self = this, $taskList = jQuery("ul.protect .protect-task-list ul");
			//先加载框架
			DefenceTools.loadTemplate(self.templateUrl, function (compiler) {

				self.compiler = compiler;
				//读取数据并渲染
				$taskList.find(".defence-loading").slideUp(10);
				//success-渲染当前摄像机已经加入的布控任务列表
				$taskList.html(compiler({
					alreadyProtectList: true,
					data: data
				}));
				//列表项的点击事件，删除或者显示详细信息
				self.bindEventsOnProtectList();
			}, function () {
				//模板加载失败
				notify.error("读取布控信息模板失败！");
			});
		},
		/**
		 * 读取并渲染完某摄像机已参加的布控任务列表后的事件绑定
		 */
		bindEventsOnProtectList: function () {

			//鼠标移入弹出层后
			jQuery(".pub-select-libs.pubdiv").hover(function () {
				globalVar.defence.isMouseOverPubDiv = true;
			}, function () {
				globalVar.defence.isMouseOverPubDiv = false;
			});
			//人脸检测、车辆识别算法,将当前摄像机添加到已有的布控任务中的选择事件，弹出该摄像机未参加的布控任务列表层
			jQuery("ul.protect .add-protect a").off("click").on("click", function (event) {
				event.stopPropagation();
				//展现弹出层框架
				jQuery(".pub-select-libs").show();
				//读取数据并渲染当前摄像机为参与的布控任务列表
				PubSub.publish("getNotInTasks", {});
			});
			//已参加的布控任务列表的删除事件
			jQuery(".protect-task-list .protect-task-item .item-title .icon_delete").off("click").on("click", function (event) {
				event.stopPropagation();
				document.getElementById("UIOCXDEFEND").style.marginLeft="-9999px";
				var This = jQuery(this);
				new ConfirmDialog({
					title: "删除当前摄像机的布控任务",
					confirmText: "确定",
					message: "确定要把当前摄像机从该布控任务中删除吗？",
					callback: function () {
						//调用数据库接口，删除该摄像机在该任务中的存在
						var taskId = This.parent().attr("data-id");
						document.getElementById("UIOCXDEFEND").style.marginLeft="";
						//读取数据并渲染当前摄像机为参与的布控任务列表
						PubSub.publish("delProtectTask", {
							taskId: taskId,
							obj: This
						});
					},
					closure:function(){
						document.getElementById("UIOCXDEFEND").style.marginLeft="";
					}
				});
			});
			//已参加的布控任务列表的点击事件-获取详细信息
			jQuery(document).off("click",".protect-task-list .protect-task-item .item-title").on("click",".protect-task-list .protect-task-item .item-title" ,function () {
				if (!jQuery(this).next().hasClass("active")) {
					//调用数据库接口，获取该任务的详细信息
					var taskId = jQuery(this).attr("data-id"), container = jQuery(this).next();
					PubSub.publish("getProtectTaskDetail", {
						taskId: taskId,
						container: container
					});
				} else {
					//已经打开，则直接关闭即可
					jQuery(this).next().slideUp().removeClass("active");
					view.showPlayingStream();  //修改点击收起tab的时候恢复播放状态 by wangxiaojun 2015.03.05
				}
			});
		},
		/**
		 * 渲染当前摄像机为参与的布控任务
		 * @param data - 待渲染的数据
		 */
		showNotInTasks: function (data) {
			var self = this;

			jQuery(".pub-select-libs ul .defence-loading").hide();
			//加载并渲染模板
			jQuery(".pub-select-libs ul").html(self.compiler({
				noSelectProtectList: true,
				data: data
			}));
			//列表渲染完成后，绑定事件
			self.bindEventsOnPubProtectList();
			// 这里是判断点击添加人脸布控任务时，若不
			// 存在布控任务时，弹出如下下拉菜单，此时只存在取消按钮。 下面的的确定按钮影藏，只显示取消按钮
			if (data.length === 0) {
				jQuery("#selectProtectSave").hide();
			} else {
				jQuery("#selectProtectSave").show();
			}
		},
		/**
		 * 添加摄像机到已存在的布控任务时，浮动层弹出并渲染后的事件绑定
		 */
		bindEventsOnPubProtectList: function () {

			//选择已有布控任务列表浮动层上，取消事件
			jQuery("#selectProtectCancel").off("click").on("click", function (event) {
				event.stopPropagation();
				jQuery(".pub-select-libs.pubdiv").hide();
			});
			//选择已有布控任务列表浮动层上，确定事件
			jQuery("#selectProtectSave").off("click").on("click", function (event) {
				event.stopPropagation();
				var protectIds = [], selectData = [];
				//查找并收集选中的布控任务并保存
				jQuery(".pub-select-libs li").each(function () {
					if (jQuery(this).find("input[type='checkbox']").prop("checked")) {
						var tempData = {};
						//存储选择的布控任务信息，以备渲染。
						tempData.id = jQuery(this).attr("data-id");
						tempData.name = jQuery(this).find("em").text();
						selectData.push(tempData);
						//存储选择的布控任务id
						protectIds.push(jQuery(this).attr("data-id"));
					}
				});
				//读取数据库接口，将新添加的布控任务写入数据库
				if (protectIds.length !== 0) {
					//触发事件，将新添加的布控任务写入数据库
					PubSub.publish("insertCameraToProtectTasks", {
						selectIds: protectIds,
						selectData: selectData
					});
				} else {
					//关闭浮动层
					jQuery(".pub-select-libs.pubdiv").hide();
				}
			});
		},
		/**
		 * 渲染布控任务的详细信息
		 * @param data - 待渲染的信息
		 * @param container - dom容器
		 */
		showTaskDetails: function (data, container) {
			var self = this;
			container.find(".defence-loading").slideUp(10);
			//加载并渲染模板
			container.html(self.compiler({
				protectDetails: true,
				data: data
			}));
			//显示详情
			container.slideToggle().addClass("active").closest("li").siblings().find(".item-content").slideUp().removeClass("active");
			//渲染完成后，绑定事件
			self.bindEventsOnProtectDetails();
			//触发事件，保存当前布控规则信息
			PubSub.publish("recordFaceRuleInfo", {
				data: data,
				obj: container
			});
		},
		//布控任务详情渲染完成后绑定事件
		bindEventsOnProtectDetails: function () {
			var self = this;
			//输入框onfocus时，显示保存按钮
			jQuery(".item-details input[type='text']").off("focus").on("focus", function () {
				self.showSaveBtn();
			});
			//最大人脸、最小人脸的check事件
			jQuery(".protect-task-item .item-content input[type='checkbox']").off("click").on("click", function () {

				var layoutObj = jQuery(this).closest(".item-details").find(".cover_layout");
				//判断checkbox的选中状态
				if (jQuery(this).prop("checked")) {
					//如果是选中状态，则隐藏遮罩
					layoutObj.hide();
				} else {
					layoutObj.show();
				}
			});
			//最小标定的点击事件
			jQuery(".item-details.min-face input[type='button']").off("click").on("click", function () {
				var $node = jQuery(this);
				if ($node.val() === "标定") {
					//更新页面按钮信息
					$node.val("确定");
					//触发截图并根据情况显示已有的框线规则
					PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
						callback: function() {
							PubSub.publish("showFilterRect", {
								type: "rect_min_face",
								width: parseFloat($node.parent().find("input[name='faceFlagW']").val()),
								height: parseFloat($node.parent().find("input[name='faceFlagH']").val())
							});
						}
					});
				} else {
					DrawEditor.deletedom("rect_min_face");
					var parentObj = $node.parent();
					if (parentObj.siblings(".modify-rect").find(".ui.button").val() === "设置" && parentObj.siblings(".max-face").find(".ui.button").val() === "标定") {
						//显示实时流&删除图像
						PubSub.publish(SHOW_PLAYING_VIDEO_STREAM, {});
					}
					$node.val("标定");
				}
			});
			//最大标定的点击事件
			jQuery(".item-details.max-face input[type='button']").off("click").on("click", function () {
				var $node = jQuery(this);
				if ($node.val() === "标定") {
					//更新页面按钮信息
					$node.val("确定");
					//触发截图并根据情况显示已有的框线规则
					PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
						callback: function() {
							//显示最大人脸尺寸区域
							PubSub.publish("showFilterRect", {
								type: "rect_max_face",
								width: parseFloat($node.parent().find("input[name='faceFlagW']").val()),
								height: parseFloat($node.parent().find("input[name='faceFlagH']").val())
							});
						}
					});
				} else {
					DrawEditor.deletedom("rect_max_face");
					var parentObj = $node.parent();
					if (parentObj.siblings(".modify-rect").find(".ui.button").val() === "设置" && parentObj.siblings(".min-face").find(".ui.button").val() === "标定") {
						//显示实时流&删除图像
						PubSub.publish(SHOW_PLAYING_VIDEO_STREAM, {});
					}
					$node.val("标定");
				}
			});
			//布控规则区域调整点击事件
			jQuery(".item-details.modify-rect input[type='button']").off("click").on("click", function () {
				var $node = jQuery(this);
				if ($node.val() === "设置") {
					//更新页面按钮信息
					$node.val("确定");
					//触发截图并根据情况显示已有的框线规则
					PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
						callback: function() {
							//布控任务规则在画布上显示
							PubSub.publish("showProtectRuleOnDraw", {});
						}
					});
				} else {
					DrawEditor.deletedom("rect_face_rule");
					var parentObj = $node.parent();
					if (parentObj.siblings(".min-face").find(".ui.button").val() === "标定" && parentObj.siblings(".max-face").find(".ui.button").val() === "标定") {
						//显示实时流&删除图像
						PubSub.publish(SHOW_PLAYING_VIDEO_STREAM, {});
					}
					$node.val("设置");
				}
			});
			//布控的保存按钮点击事件
			jQuery(".item-details.save-protect input[type='button']").off("click").on("click", function () {
				//保存人脸布控区域信息
				PubSub.publish("saveTaskDetailByTaskId", {});
			});
		},
		/**
		 * beforesend中显示等待层
		 */
		showLoading: function (tag, container) {
			if (tag === "areadyin") {
				jQuery("ul.protect .protect-task-list ul .defence-loading").show();
			} else if (tag === "notin") {
				jQuery(".pub-select-libs ul .defence-loading").show();
			} else if (tag === "detail") {
				container.find(".defence-loading").show();
			}
		},
		/**
		 * 添加新布控任务成功后刷新页面
		 * @param selectData - 当前所选的新添加的布控任务数据
		 */
		refreshPageAfterInsert: function (selectData) {
			var self = this, $tipsObj = jQuery("ul.protect .protect-task-list ul .style-text-info");
			//关闭浮动层
			jQuery(".pub-select-libs.pubdiv").hide();
			//判断提示层是否存在，存在则删除
			if ($tipsObj.length > 0) {
				$tipsObj.remove();
			}
			//加载并渲染模板
			jQuery("ul.protect .protect-task-list ul").append(self.compiler({
				alreadyProtectList: true,
				data: selectData
			}));
			//绑定事件
			self.bindEventsOnProtectList();
		},
		/**
		 * 布控任务删除成功过后刷新页面
		 * @param obj - 当前删除的dom元素
		 * @param taskId - 当前删除的布控任务id
		 */
		refreshPageAfterDel: function (obj, taskId) {
			jQuery(".protect-task-item .item-title[data-id='" + taskId + "']").closest("li").slideUp(function () {
				obj.remove();
			});
		},
		/**
		 * 布控任务保存成功后刷新页面
		 */
		refreshPageAfterSave: function () {
			var self = this;
			//恢复状态
			self.recoverProtectDomStatus();
			//显示实时流&删除图像
			PubSub.publish(SHOW_PLAYING_VIDEO_STREAM, {});
			//收起当前任务详情
			jQuery(".protect-task-list .protect-task-item .item-content.active").slideUp().removeClass("active");
		},
		/**
		 * 显示布控下面保存按钮
		 */
		showSaveBtn: function () {
			globalVar.defence.ruleInfo.faceProtectInfo.containerObj.find(".save-protect .cover_layout").hide();
		},
		/**
		 * 在布控任务规则设置保存、布防布控tab切换、布控任务详情切换时，需要回复布控规则区域的状态
		 */
		recoverProtectDomStatus: function () {
			jQuery(".item-details.modify-rect input[type='button']").val("设置");
			jQuery(".item-details.min-face input[type='button']").val("标定");
			jQuery(".item-details.max-face input[type='button']").val("标定");
			jQuery(".item-details input[type='checkbox']").prop("checked", false);
			jQuery(".item-details .cover_layout").show();
		},
		/**
		 * 注册模板事件
		 */
		registerHelper: function () {
			//人脸布控任务详情的过滤助手
			Handlebars.registerHelper("FilterControlDetail", function (value, dataType, options) {
				 if (dataType === "select") {
					if (value === "true") {
						return options.fn(this);
					}
				}
			});
			Handlebars.registerHelper("timeChange", function (value,options) {
					return Toolkit.mills2str(value);
			});
			Handlebars.registerHelper("levelChange", function (value,options) {
					return (value === 1) ? "一般" : (value === 2) ? "重要" : "严重";
			});
			Handlebars.registerHelper("statusChange", function (value,options) {
					return (value === -1) ? "未开始" : (value === 0) ? "布控中" : (value === 1) ? "已过期" : "已撤销";
			});
		}
	};

	return new View();
});