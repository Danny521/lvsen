define([
	// 布防任务control层
	"/module/protection-monitor/defencesetting/js/controller/defence/second-controller.js",
	// 布防任务model层
	"/module/protection-monitor/defencesetting/js/model/defence-model.js",
	// 全局变量
	'/module/protection-monitor/defencesetting/js/global-var.js',
	// 布防设置工具类函数
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js"
], function(secondControl, model, globalVar, DefenceTools) {
	return {
		template: null,
		init: function(isRefresh, evtype) {
			var self = this;
			self.evtype = evtype;
			// 初始化页面
			self.initPage(isRefresh, evtype);
		},
		initPage: function(isRefresh, evtype) {
			var self = this;
			//标记当前的操作位置
 			globalVar.defence.curOperationPos = 0;
 			if (jQuery("#defence-second-step").length) {
 				return startInitPage(isRefresh);
 			}

			// 加载第二步，选择算法 页面模板
			self.loadTemplate("defence-second-step-template", function(err, temp) {
				if (err) {
					return notify.error(err);
				}

				jQuery("#defence-main-content").append(temp({ mainFrame: true })).removeClass("setting-content-hide");
				startInitPage(true);
			});

			function startInitPage(isRefresh) {
 				// 显示第二步content区域
				jQuery("#defence-second-step").removeClass("setting-content-hide")
				.find(".alarm-events-rule-list").show().end()
				.find(".step-left-title").text("请选择算法：")
				.siblings(".defence-setting-content").addClass("setting-content-hide");
				// 高亮步骤2
				self.highLightStep("second");
				// 显示底部上一步下一步完成按钮
				self.showBottomBtn();
				// 播放右侧OCX视频
				self.initOCX();
				// 如果需要刷新算法列表
				if (isRefresh) {
					// 显示布防算法列表
					self.initRuleList();
				}
			}
		},
		/**
		 * [loadTemplate 加载模板]
		 * @param  {[type]}   tempName [模板内容]
		 * @param  {Function} callback [加载完成后的回调函数]
		 * @return {[type]}            [description]
		 */
		loadTemplate: function(tempName, callback) {
			var self = this;

			if (self.template) {
				return callback(null, self.template);
			}

			model.getTml(tempName)
			.then(function(temp) {
				self.template = Handlebars.compile(temp);
				callback(null, self.template);
			}, function() {
				callback("加载模板失败");
			});
		},
		/**
		 * [initRuleList 初始化算法列表]
		 * @return {[type]} [description]
		 */
		initRuleList: function() {
			var self = this;
			// 加载算法列表dom框架
			jQuery("#defence-second-step").find(".rule-set").html(self.template({ rulelist: true }));
			// 获取算法列表
			secondControl.getRuleList(function(err, data) {
				if (err) {
					return notify.error(err);
				}
				// 根据获取到的规则列表结果，渲染页面
				self.showRuleList(data);
			})
		},
		/**
		 * [showRuleList 显示算法列表]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		showRuleList: function(data) {
			var self = this;
			//扩展数据并渲染模板
			// try {
			// 	data.categories[3].subrules.splice(1, 1);
			// 	data.categories[3].subrulescount = 2;
			// } catch(e) {

			// }
 			
			jQuery.extend(data, { defaultRuleList: true });
			
			jQuery(".default-rule-list").html(self.template(data));
			jQuery(".default-rule-list dl dt").find("i").each(function(){
				if(jQuery(this).hasClass('icon_downarrow')){
					jQuery(this).closest('dt').addClass("blue-color");
				}

			})
			//绑定算法列表事件
			self.bindRuleListEvents();
			//触发指定算法事件的点击事件(布防管理流程下使用)
			if (self.evtype !== undefined) {
				jQuery(".alarm-events-rule-list .rules_set dd span[data-id='" + self.evtype + "']").trigger("click");
				jQuery("#defence-setting-footer").find(".next").trigger("click");
			}
		},
		/**
		 * [bindRuleListEvents 绑定选择算法事件]
		 * @return {[type]} [description]
		 */
		bindRuleListEvents: function() {
			var $ruleSet = jQuery(".alarm-events-rule-list .rules_set dd span");
			//各算法事件的点击事件
			$ruleSet.on("click", function () {
				jQuery(".rules_set").find("dd").find("span").removeClass("checked").find("i").removeClass("checked");
				jQuery(this).addClass("checked").find("i").addClass("checked");

				// if(_g.fromModule !== "defenceMgr"){
				// 	if(!DefenceTools.checkedPlayer(1)) {
				// 		return;
				// 	}
				// }
			});
			//算法列表和文字描述整体联动
			$ruleSet.hover(function () {
				if (jQuery(this).attr("data-taskid") === "0") {
					jQuery(this).find("a").addClass("color-blue");
					jQuery(this).find("i").addClass(DefenceTools.getRuleIconById(parseInt(jQuery(this).attr("data-id")), -1, -1));
				}
			}, function () {
				if (jQuery(this).attr("data-taskid") === "0") {
					jQuery(this).find("a").removeClass("color-blue");
					jQuery(this).find("i").removeClass(DefenceTools.getRuleIconById(parseInt(jQuery(this).attr("data-id")), -1, -1));
				}
			});
			//算法列表上的折叠&展开事件
			jQuery(".alarm-events-rule-list .rules_set dt").on("click", function () {
				jQuery(this).closest(".rules_set").find("dd").slideToggle();
				var flag = jQuery(this).find("i").hasClass('icon_downarrow');
				
				if(flag){
					jQuery(this).removeClass("blue-color")	
				}else{
					jQuery(this).addClass("blue-color")
				
				}
				
				jQuery(this).find("i").toggleClass("icon_downarrow");
			});
			//默认算法和其他算法之间的切换
			jQuery(".rule_list_title a").on("click", function () {
				var changeTrigger = false;
				//判断当前的选中状态
				if (!jQuery(this).hasClass("current")) {
					jQuery(this).addClass("current").siblings().removeClass("current");
					//需要切换
					changeTrigger = true;
				}
				//判断选中类型
				if (changeTrigger) {
					if (jQuery(this).attr("data-type") === "default") {
						//切换到默认算法列表
						jQuery(".others-rule-list").addClass("hidden_normal");
						jQuery(".default-rule-list").removeClass("hidden_normal");
					} else {
						//切换到其他算法列表
						jQuery(".others-rule-list").removeClass("hidden_normal");
						jQuery(".default-rule-list").addClass("hidden_normal");
					}
				}
			});
			//点击关闭按钮关闭所播的视频内容释放资源，撤销遮罩层，隐藏弹出框
			jQuery("#closeDefenceWindow").on("click", function() {
				//开启保存进度
				PubSub.publish("dealOnDefenceWinClose", {});
			});

			//列表触发点失去焦点时隐藏
			jQuery(document).on("click", function () {
				if (!globalVar.defence.isMouseOverPubDiv) {
					jQuery(".pubdiv").hide();
					jQuery(".content-rule-list, .content-rule-list-ifr").hide();
				}
			});
		},
		/**
		 * [highLightStep 高亮顶部选择算法]
		 * @param  {[type]} num [description]
		 * @return {[type]}     [description]
		 */
		highLightStep: function(num) {
			var steps = [ "first", "second", "third" ],
				index = steps.indexOf(num) + 1;
				
			// num前边的都高亮
			for (var i = 0; i < index; i++) {
				jQuery("#defence-setting-nav").find("li." + steps[i] + "-step").addClass("active").find("i.bar").addClass('active');
			}

			// num后边的都还原
			for (; index < steps.length; index++) {
				jQuery("#defence-setting-nav").find("li." + steps[index] + "-step").removeClass("active").find("i.bar").removeClass('active');
			}
		},
		/**
		 * [showBottomBtn 显示底部上一步下一步按钮]
		 * @return {[type]} [description]
		 */
		showBottomBtn: function() {
			jQuery("#defence-setting-footer")
				.find("button").hide().end()
				.find(".next").show().end()
				.find(".pre").show();

			var $pre = jQuery("#defence-setting-footer").find(".pre");
			if (globalVar.defence.editCamera) {
				$pre.addClass('disabled');
			} else {
				$pre.removeClass('disabled');
			}
			
			// 绑定上一步 下一步 事件
			this.bindStepEvent();
		},
		/**
		 * [bindStepEvent 绑定上一步下一步按钮事件]
		 * @return {[type]} [description]
		 */
		bindStepEvent: function() {
			var self = this;
			jQuery("#defence-setting-footer").off("click")
			.on("click", ".pre:not(.disabled)", function() {
				//清空ocx上的叠加物
				DefenceTools.clearSelectedRuleInfo();
				//清空播放器对象信息
				DefenceTools.clearVideoInfo();
				// 第一步选择摄像机 view 模块，这里产生了循环依赖，故：
				var firstView = require("/module/protection-monitor/defencesetting/js/view/defence/first-view.js");
				firstView.init(globalVar.defence.cameraData);
				//清空联动窗体
				jQuery("#popLayer").remove();
				jQuery("#popContainer").remove();
			})
			.on("click", ".next", function() {
				var $span = jQuery(".rules_set").find("dd").find("span.checked");
				if ($span.length !== 1) {
					notify.warn("请选择算法");
					return false;
				}
				
				if(!DefenceTools.checkedPlayer(1)) {
					return;
				}
                //切换布防算法
				if ($span.data("taskid") === 0) {
					globalVar.defence.cameraData.taskId = "";
				}

				jQuery("#defence-second-step").find(".alarm-events-rule-list").hide();
				
				/*var currIsNewTask = jQuery(".rules_set").find("dd").find("span.checked:not(.active)").length;
				if(currIsNewTask){
					$.ajax({
						url: "/service/defence/limit",
						type: "get",
						datatype: "json",
						data: {},
						success: function (res) {
							if (res.code === 200 && !res.data){
								notify.error('您所在的组织创建的布防任务数已经达到该组织最大限额，不能再设置布防任务！');
								jQuery("#defence-setting-close").trigger("click");
								return false;
							}
						},
						error: function () {
							notify.error('服务异常，新建失败！');
							jQuery("#defence-setting-close").trigger("clcik");
						}
					});
				}*/
				// 收集算法类型参数
				secondControl.collectRuleInfo($span);
			})
		},
		/**
		 * [initOCX 初始化OCX，播放右侧视频]
		 * @return {[type]} [description]
		 */
		initOCX: function() {
			var self = this;
			secondControl.getCameraPlayChannel();
			//加载成功
			jQuery("#defence-second-step").find(".right").html(self.template({
				cameraname: globalVar.defence.cameraData.name,
				cameracode: globalVar.defence.cameraData.code,
				alarmEventsContent: true
			}));
			
			secondControl.playCurCameraVideo(globalVar.defence.cameraData);
			// 绑定OCX播放器按钮事件
			self.bindOCXEvent();
		},
		/**
		 * [bindOCXEvent 绑定ocx的事件，右上角眼睛事件]
		 * @return {[type]} [description]
		 */
		bindOCXEvent: function() {
			var self = this;
			//右侧眼睛的点击事件
			jQuery(document)
			.off("click", "#defence-second-step .alarm-events-content-video .content-top-video-tool .see")
			.on("click", "#defence-second-step .alarm-events-content-video .content-top-video-tool .see", function () {
				self.showRuleListOnVideo(this);
			});
		},
		/**
		 * [showRuleListOnVideo 右上角眼睛事件 ]
		 * 该事件分为两种情况：1.在选择算法页面 
		 * @param  {[type]} node [description]
		 * @return {[type]}      [description]
		 */
		showRuleListOnVideo: function(node) {
			var self = this;
			secondControl.getHistoryRuleList({
				obj: node
			}, function(err, data) {
				if (err) {
					return notify.error(err);
				}

				var $ruleList = jQuery(".content-rule-list");
				//渲染页面
				jQuery(".alarm-events-content-video .content-rule-list").empty().html(self.template(jQuery.extend(data, {
					contentRuleTypeList: true
				})));
				jQuery(".content-rule-list, .content-rule-list-ifr").css({
					height: "auto"
				});
				//移动下拉列表到div下方
				var divPosition = jQuery(node).position(), divHeight = $ruleList.height(), divRight = jQuery(".alarm-events-content-video").width() - divPosition.left - jQuery(node).width() + "px";
				//定位下拉列表并显示
				$ruleList.css({
					right: divRight,
					top: divPosition.top + 28 + "px",
					width: "85px",
					height: divHeight + "px"
				}).slideDown("fast");
				jQuery(".content-rule-list-ifr").css({
					right: divRight,
					top: divPosition.top + 28 + "px",
					width: "86px",
					height: divHeight + 2 + "px"
				}).slideDown("fast");

				//下拉列表项的点击事件
				$ruleList.find("li").each(function () {
					//给每一个列表项绑定点击事件
					jQuery(this).on("click", function () {
						var PointsInfo = jQuery(this).attr("data-points"), selectedRule = parseInt(jQuery(this).attr("event-type"));
						//隐藏下拉列表
						jQuery(".content-rule-list, .content-rule-list-ifr").hide();
						//在视频上叠加框线
						secondControl.showRuleOnVideo({
							PointsInfo: PointsInfo,
							selectedRule: selectedRule,
							obj: this
						});
					});
				});
				//下拉列表的鼠标移入移出事件
				$ruleList.hover(function () {
					globalVar.defence.isMouseOverPubDiv = true;
				}, function () {
					globalVar.defence.isMouseOverPubDiv = false;
				});
			});
		}
	}
});