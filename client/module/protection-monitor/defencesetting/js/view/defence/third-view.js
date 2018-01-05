define([
	// 布防任务control层
	"/module/protection-monitor/defencesetting/js/controller/defence/third-controller.js",
	// 布防任务model层
	"/module/protection-monitor/defencesetting/js/model/defence-model.js",
	// 全局变量
	'/module/protection-monitor/defencesetting/js/global-var.js',
	// 布防设置工具类函数
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	// 布防规则设置时间模板的逻辑控制器
	"/module/protection-monitor/defencesetting/js/controller/defence/third-time-template-controller.js",
	// 布防规则设置，人脸布控相关逻辑控制器
	"/module/protection-monitor/defencesetting/js/controller/defence/third-protect-controller.js",
	//加载联动
	'/module/protection-monitor/defencesetting/js/view/defence/third-linkage-view.js',
	"pubsub",
	"jquery-ui"
], function(thirdControl, model, globalVar, DefenceTools, TimeTemplate, protectController,linkageView, PubSub) {
	return {
		//模板渲染对象
		template: null,
		curCameraRate: {
			width: 352,
			height: 288
		},
		options: {
			//当前多边形业务类型
			currentPolyType: '',
			//当前矩形对象数组
			currentRectObjs: [],
			//视频初始化宽高
			initPlayerSize: {
				width: 863,
				height: 497
			},
			//当前视频宽高
			currentPlayerSize: {
				width: 0,
				height: 0
			},
			//自适应窗口大小后视频宽高
			PlayerSizeAfterWindowResize: {
				width: 0,
				height: 0
			},
			//视频原始信息宽高
			originalPlayerSize: {},
			procPolyShow: false,
			shieldPolyShow: false,
			curTasid: null,
			currData: {},
		},
		timeoutSpan: 5,
		//各算法对应的画图 规则工具
		ruleGraphicTool: {
			/*拌线检测、人流统计*/
			"categoryOne": {
				"line": true,
				"mutiLine": true,
				"rect": false,
				"ploy": false,
				"remove": true,
				"removeAll": true
			},
			/*区域入侵、徘徊检测、非法停车、物品丢失、物品遗留、人群聚集*/
			"categoryTwo": /*徘徊检测*/ {
				"line": false,
				"mutiLine": false,
				"rect": true,
				"ploy": true,
				"remove": true,
				"removeAll": true
			},
			/*车流统计*/
			"carStream": {
				"line": false,
				"mutiLine": false,
				"rect": false,
				"ploy": true,
				"remove": true,
				"removeAll": true
			},
			/*烟火检测*/
			"fireworksCheck": {
				"line": false,
				"mutiLine": false,
				"rect": true,
				"ploy": false,
				"remove": true,
				"removeAll": true
			},
			/*影藏工具*/
			"hideCategory": {
				"line": false,
				"mutiLine": false,
				"rect": false,
				"ploy": false,
				"remove": false,
				"removeAll": false
			},
			/*实施结构化*/
			"structInfo": {
				"line": false,
				"mutiLine": false,
				"rect": false,
				"ploy": false,
				"remove": true,
				"removeAll": false
			},
		},
		init: function() {
			var self = this;
			// 初始化页面
			self.initPage();
		},
		initPage: function() {
			var self = this;
			//标记当前的操作位置
			globalVar.defence.curOperationPos = 1;
			//初始化规则联动
			linkageView.init();
			if (self.template) {
				return startInitPage();
			}

			// 加载第三步，设置参数 页面模板
			self.loadTemplate("defence-third-step-template", function(err, temp) {
				if (err) {
					return notify.error(err);
				}

				startInitPage();
			});

			function startInitPage() {
				// 显示第三步参数详情区域，并改变标题
				jQuery("#defence-second-step").removeClass("setting-content-hide")
					.find(".alarmRuleDetailPanel").show().end()
					.find(".step-left-title").text("请设置参数：").end()
					.siblings(".defence-setting-content").addClass("setting-content-hide");
				// 高亮步骤2
				self.highLightStep("third");
				// 显示底部上一步下一步完成按钮
				self.showBottomBtn();
				// 初始化左侧参数列表
				self.initRuleParams();
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
		 * [highLightStep 高亮顶部选择算法]
		 * @param  {[type]} num [description]
		 * @return {[type]}     [description]
		 */
		highLightStep: function(num) {
			var steps = ["first", "second", "third"],
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
				.find("#RuleDetailSave").show().end()
				.find(".pre").show();

			var $pre = jQuery("#defence-setting-footer").find(".pre");
			if (globalVar.defence.editEvtype) {
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
					jQuery("#defence-second-step").find(".alarmRuleDetailPanel").hide().empty();
					// 第二步选择算法 view 模块，这里产生了循环依赖，故：
					var secondView = require("/module/protection-monitor/defencesetting/js/view/defence/second-view.js");
					secondView.init();
					//删除布防联动规则缓存
					linkageView.clearCache();
				})
				// 保存的实现，见 third-tasksave-view.js 故这里不做事件绑定
		},
		/**
		 * [initRuleParams 初始化左侧参数列表]
		 * @return {[type]}            [description]
		 */
		initRuleParams: function() {
			var self = this,
			    max = 5,//滑块最大值
				min = 1,//最小值
				step = 1,//滑动间隔
				value = 3;//滑块默认值
			thirdControl.getRuleParams(function(err, data, areaListController) {
				if (err) {
					return notify.error(err);
				}

				jQuery.extend(self.curCameraRate, DefenceTools.getCameraRate());
				//渲染模板
				jQuery("#defence-second-step").find(".alarmRuleDetailPanel").html(self.template(data)).show();
				//更新权限[完善布防布控权限设置，bug【40590】add by zhangyu 2016.04.01]
				window.permission.reShow();
				//修改布防参数名称
				var $alarmTime = jQuery("#manyData .event-alarm-time");
				if (data.eventType === "256") { //非法停车
					$alarmTime.find("em").html("停车时间(分):");
					$alarmTime.find("img").attr("src","/module/protection-monitor/defencesetting/images/slider.png");
					max = 60;
					min = 6;
					step = 6;
					if (data.wDuration) {
						value = data.wDuration;
					} else {
						value = 30;
					}
				} else if (data.eventType === "32") { //徘徊检测
					if (data.wDuration) {
						value = data.wDuration;
					}
					$alarmTime.find("em").html("徘徊时间(秒):");
					$alarmTime.find("img").attr("src","/module/protection-monitor/defencesetting/images/defaultSlider.png");
				} else if (data.eventType === "128") { //物品丢失
					if (data.wDuration) {
						value = data.wDuration;
					}
					$alarmTime.find("em").html("丢失时间(秒):");
					$alarmTime.find("img").attr("src","/module/protection-monitor/defencesetting/images/defaultSlider.png");
				} else if (data.eventType === "64") { //物品遗留
					if (data.wDuration) {
						value = data.wDuration;
					}
					$alarmTime.find("em").html("遗留时间(秒):");
					$alarmTime.find("img").attr("src","/module/protection-monitor/defencesetting/images/defaultSlider.png");
				} else if(data.eventType === "2048"){
					max = 1;
					min = 0.1;
					step = 0.1;
					if (data.fDensity) {
						value = data.fDensity;
					} else {
						value = 0.5;
					}
					jQuery("#manyData .people-density").find("div").removeClass("speedSlider").addClass("speedSlider1");
					jQuery("#manyData .people-density").find("img").removeClass("ruler").addClass("ruler1");
				}
				
				//告警时间控制条的初始化
				jQuery('#manyData .event-alarm-time .speedSlider, #manyData .people-density .speedSlider1').slider({
					range: 'min',
					step: step,
					max: max,
					min: min,
					value: value
				});
				//实时化结构需要时再去加载时间插件，不然会冲突
				jQuery(document).on('focus', '.inputs-time', function() {
					jQuery(this).datetimepicker({
						showSecond: true,
						minDate: new Date(),
						dateFormat: 'yy-mm-dd',
						timeFormat: 'HH:mm:ss',
						timeText: '',
						hourText: '时',
						minuteText: '分',
						secondText: '秒',
						showAnim: '',

					});
					jQuery(".ui-datepicker").addClass("strutsPosRenew");
					jQuery("#RuleDetailSave").removeClass('disabled');
				});
				//循环监听当前摄像机是否开流成功，如果是则重新复制最大、最小设置，否则继续监听到15s
				if (globalVar.defence.asignTimer) {
					window.clearInterval(globalVar.defence.asignTimer);
				}

				var videoAttr = globalVar.defence.videoPlayer.playerObj.GetVideoAttribute(0);
				if (videoAttr === "ERROR") {
					globalVar.defence.asignTimer = window.setInterval(function() {
						self.listenerTimer();
					}, 3500);
				}

				//如果是默认进入，则隐藏删除按钮
				if (!data.taskTime) {
					jQuery("#RuleDetailDel").addClass("hidden");
				} else {
					jQuery("#RuleDetailDel").removeClass("hidden");
				}
				// permission.reShow();//权限控制的相关操作

				// //权限的内容控制，只有一个存在就需要控制显示的内容。当设置布防规则权限不存在和编辑布防规则也不存在，联动规则存在。则需要改变tab内容的显隐状态。  by wangxiaojun 2015.01.16
				// if(permission.klass["set-defence-task"] !== "set-defence-task" && permission.klass["edit-defence-task"] !== "edit-defence-task" && permission.klass["set-ganged-rule"] === "set-ganged-rule"){
				// 	jQuery(".rules .other-data").hide();
				// 	jQuery(".rules .other-ganged").show();
				// }
				// 初始化时间模板
				//加载时间模板
				if (data.hasOwnProperty("taskTime")) {
					globalVar.defence.ruleInfo.timeTemplateObj = new TimeTemplate(data.taskTime);
				}

				//绑定事件
				self.bindDetailEvents();
				//初始化其他模块的事件绑定
				thirdControl.init();
				//根据每个算法事件的不同，设置框线按钮状态
				self.showVideoTool(parseInt(globalVar.defence.ruleInfo.options.curRuleId));
				//如果当前算法任务已经设置过，则加载curAreaList,以备框线重现
				if (parseInt(globalVar.defence.ruleInfo.options.curTaskId) !== 0) {
					//触发显示已有的框线列表
					areaListController.showExistAreas(data);
					if (parseInt(globalVar.defence.ruleInfo.options.curRuleId) === 268435456 && data.region) { //如果为已存在算法，渲染算法页面
						delete self.DrawEditorInited;
						self.renderData(data);
						jQuery("#smartMarkDel").removeClass("hidden");
					}
				}
			});
		},
		//循环监听当前摄像机是否开流成功，如果是则重新复制最大、最小设置，否则继续监听到15s
		listenerTimer: function() {
			var self = this;
			self.timeoutSpan += 5;
			if (!DefenceTools.checkedPlayer(1)) {
				if (self.timeoutSpan == 15) {
					window.clearInterval(globalVar.defence.asignTimer);
				}

				return;
			} else {
				//重新赋值最大最小物体
				var curCameraRate = DefenceTools.getCameraRate(),
					minWDom = jQuery(".rules .event-rect-filter input[name='minW']"),
					minHDom = jQuery(".rules .event-rect-filter input[name='minH']"),
					minRate = jQuery(".rules .event-rect-filter").children('span:first').attr("data-rate"),
					maxWDom = jQuery(".rules .event-rect-filter input[name='maxW']"),
					maxHDom = jQuery(".rules .event-rect-filter input[name='maxH']"),
					maxRate = jQuery(".rules .event-rect-filter").children('span:last').attr("data-rate");
				minWDom.val((parseFloat(minRate.split(",")[2]) !== 0) ? (minRate.split(",")[2] * curCameraRate.width).toFixed(1) : "宽");
				minHDom.val((parseFloat(minRate.split(",")[3]) !== 0) ? (minRate.split(",")[3] * curCameraRate.height).toFixed(1) : "高");
				maxWDom.val((parseFloat(maxRate.split(",")[2]) !== 0) ? (maxRate.split(",")[2] * curCameraRate.width).toFixed(1) : "宽");
				maxHDom.val((parseFloat(maxRate.split(",")[3]) !== 0) ? (maxRate.split(",")[3] * curCameraRate.height).toFixed(1) : "高");
			}
		},
		/**
		 * [renderData 实时标注从新渲染页面]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		renderData: function(data) {
			var self = this;
			var newData = data.region;
			var isFace = newData.face ? true : false,
				ishuman = newData.human ? true : false,
				isVehicle = newData.vehicle ? true : false,
				startTime = data.startTime,
				endTime = data.endTime ? data.endTime : "",
				isRoi = newData.roi ? true : false;
			if (startTime) {
				$("#smartMarkform .dataPicker .begin-time").val(startTime);
			}

			$("#smartMarkform  .dataPicker .end-time").val(endTime);
			if (isFace) {

				$("#type-mark-move").trigger("click");
				$('.type-params-item [name="move-height"]').spinner("value", newData.face.minFace);
				if (newData.face.skipFrames && newData.face.skipFrames === 1) {
					$('.type-params-item [name="move-height"]').closest('li.type-params').find(".delicacyLevel>span:eq(1)").click();
				} else if (newData.face.skipFrames === 2) {
					$('.type-params-item [name="move-height"]').closest('li.type-params').find(".delicacyLevel>span:eq(0)").click();
				} else {
					$('.type-params-item [name="move-height"]').closest('li.type-params').find(".delicacyLevel>span:eq(2)").click();
				}

			}
			if (ishuman) {
				$("#type-mark-face").trigger("click");
				$('.type-params-item [name="face-minFace"]').spinner("value", parseInt(newData.human.minHeight * 2));
				if (newData.human.skipFrames && newData.human.skipFrames === 1) {
					$('.type-params-item [name="face-minFace"]').closest('li.type-params').find(".delicacyLevel>span:eq(1)").click();
				} else if (newData.human.skipFrames === 2) {
					$('.type-params-item [name="face-minFace"]').closest('li.type-params').find(".delicacyLevel>span:eq(0)").click();
				} else {
					$('.type-params-item [name="face-minFace"]').closest('li.type-params').find(".delicacyLevel>span:eq(2)").click();
				}

			}

			if (isVehicle) {
				$("#type-mark-car").trigger("click");
				$('.type-params-item select[name="car-defaultProvince"]').find("option[value='" + newData.vehicle.province + "']").attr("selected", true).siblings().removeAttr("selected");
				if (newData.vehicle.skipFrames && newData.vehicle.integrationFrameRate && newData.vehicle.skipFrames === 1 && newData.vehicle.integrationFrameRate === 1) {
					$('.type-params-item select[name="car-defaultProvince"]').closest('li.type-params').find(".delicacyLevel>span:eq(2)").click();
				} else if (newData.vehicle.skipFrames === 1 && newData.vehicle.integrationFrameRate === 2) {
					$('.type-params-item select[name="car-defaultProvince"]').closest('li.type-params').find(".delicacyLevel>span:eq(0)").click();
				} else if (newData.vehicle.skipFrames === 0 && newData.vehicle.integrationFrameRate === 1) {
					$('.type-params-item select[name="car-defaultProvince"]').closest('li.type-params').find(".delicacyLevel>span:eq(2)").click();
				}
			}
			if (isRoi) {

				if (DefenceTools.checkedPlayer(1)) {
					self.renderLine(newData); //如果摄像头处于完成加载直接渲染
				} else { //保存当前数据
					self.options.currData = newData;
				}
			}

		},
		//重新绘制线框
		renderLine: function(newData) {
			var self = this;
			if (newData.roi.procRgn && !newData.roi.shieldRgn) {
				$("#type-region-proc").removeAttr("disabled").removeClass('disabled');
				$('#showDraws').show().removeClass("hidden");
				self._drawPrcoPoly(newData.roi.procRgn);

			} else if (!newData.roi.procRgn && newData.roi.shieldRgn) {
				$("#type-region-shield").removeAttr("disabled").removeClass('disabled');
				if (newData.roi.shieldRgn.length >= 5) {
					$("#type-region-shield").prop("disabled", true).addClass('disabled');
				}
				$('#showDraws').show().removeClass("hidden");
				self._drawShiledPoly(newData.roi.shieldRgn);
			} else if (newData.roi.procRgn && newData.roi.shieldRgn) {
				$('#showDraws').show().removeClass("hidden");
				$("#type-region-proc").removeAttr("disabled").removeClass('disabled');
				if (newData.roi.shieldRgn.length >= 5) {
					$("#type-region-shield").prop("disabled", true).addClass('disabled');
				} else {
					$("#type-region-shield").removeAttr("disabled").removeClass('disabled');
				}
				self._drawPrcoPoly(newData.roi.procRgn,function(){
					self._drawShiledPoly(newData.roi.shieldRgn);
				});
				

			}

		},
		//处理区域绘制
		_drawPrcoPoly: function(data,callback) {
			var self = this;
			globalVar.defence.ruleInfo.procPolyData[0] = data;
			PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
				callback: function() {
					DrawEditor.strokecolor = '#44A0FF';
					var newProcRgnPoints = [];
					_.map(data.ploygon, function(item, index) { //重新封装后台数据，转换为图形数组对象
						var itemFormat = DefenceTools.ruleLineOpera.coordinateSwitchForSmartDeal([item.x, item.y], DefenceTools.getDrawRate(), DefenceTools.getCameraRate());
						newProcRgnPoints.push([
							itemFormat.x, itemFormat.y
						]);
					})
					data.ploygon = newProcRgnPoints;
					DrawEditor.add_poly({
						points: data.ploygon,
						text: '',
						domid: data.domid
					});
					callback && callback();
				}
					
			});
			self.options.procPolyShow = true;


		},
		//屏蔽区域绘制
		_drawShiledPoly: function(data) {
			var self = this;
			globalVar.defence.ruleInfo.shieldPolyData = data;
			PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
				callback: function() {
					var newShieldPoints = [];
					DrawEditor.strokecolor = '#E24332';
					_.map(globalVar.defence.ruleInfo.shieldPolyData, function(item) {
						newShieldPoints = [];
						_.map(item.ploygon, function(item) {
							var itemFormat = DefenceTools.ruleLineOpera.coordinateSwitchForSmartDeal([item.x, item.y], DefenceTools.getDrawRate(), DefenceTools.getCameraRate());
							newShieldPoints.push([itemFormat.x, itemFormat.y]);
						})
						item.ploygon = newShieldPoints;
						DrawEditor.add_poly({
							points: item.ploygon,
							text: '',
							domid: item.domid
						});

					})
				}

			});
			self.options.shieldPolyShow = true;
		},
		/**
		 * 规则参数页面的事件绑定
		 */
		bindDetailEvents: function() {
			var self = this;
			//tab的切换（联动规则&参数设置）
			jQuery(".alarm-events-rule-detail .rules_title a").off("click").on("click", function() {
				jQuery(".alarm-events-rule-detail .rules_title a").removeClass("current");
				jQuery(this).addClass("current");
				if (jQuery(this).attr("data-type") === "data") {
					jQuery(".other-ganged").addClass("hidden_normal");
					jQuery(".other-data").removeClass("hidden_normal");

				} else if (jQuery(this).attr("data-type") === "ganged") {
					jQuery(".other-ganged").removeClass("hidden_normal");
					jQuery(".other-data").addClass("hidden_normal");
				}
			});
			//规则设置页面的后退按钮绑定事件
			// jQuery("#returnBackToRuleList").off("click").on("click", function (event, param) {
			// 	var $defenceWindow = jQuery("#defenceWindow");
			// 	//做兼容，ocx的层级太高会把弹窗挡住，所以在弹窗出现的时候影藏ocx. by wangxiaojun 2015-01-04
			// 	document.getElementById("UIOCXDEFEND").style.marginLeft="-9999px";
			// 	// 
			// 	// jQuery(".content-down-video").css("margin-left","9999px");
			// 	// document.getElementById("UIOCXDEFEND").ShowOrHideOCX(false);
			// 	setTimeout(function(){
			// 	if(param && (param === "del-task" || param === "save-task")) {
			// 		//刷新页面
			// 		self.refreshOnReturnBack($defenceWindow);
			// 	} else {
			// 		//提示是否返回
			// 		new ConfirmDialog({
			// 			title: "返回",
			// 			confirmText: "确定",
			// 			message: "确定要放弃编辑布防任务吗？",
			// 			callback: function () {
			// 				//刷新页面
			// 				self.refreshOnReturnBack($defenceWindow);
			// 			},
			// 			//做兼容，ocx的层级太高会把弹窗挡住，先影藏ocx,在弹窗关闭的时候显示ocx. by wangxiaojun 2015-01-04
			// 			prehide: function () {
			// 				document.getElementById("UIOCXDEFEND").style.marginLeft = "";
			// 				// jQuery(".content-down-video").css("margin-left","");
			// 				// document.getElementById("UIOCXDEFEND").ShowOrHideOCX(true);
			// 			}
			// 		});
			// 	}
			// 	},100);

			// });
			//等级列表中，点击框区域也可触发下拉事件(也包括箭头事件)
			jQuery(".event-alarm-level .level_container, .event-alarm-level .level_container .arrow-down").on("click", function(event) {
				jQuery(".event-alarm-level .level_container").focus();
				if (jQuery(this).find(".level-list").css("display") === "none" || jQuery(this).siblings(".level-list").css("display") === "none") {
					//如果没有显示则显示
					self.showAlarmLevelList(jQuery(this).hasClass("arrow-down") ? this : jQuery(this).find(".arrow-down"));
					//隐藏区域列表
					jQuery(".area-list").hide();
				} else {
					if (jQuery(this).siblings(".level-list").length > 0) {
						jQuery(this).siblings(".level-list").hide();
					} else {
						jQuery(this).find(".level-list").hide();
					}
				}
				event.stopPropagation();
			});
			//鼠标移入下拉列表框时，高亮标记
			jQuery(".area_container, .level_container").hover(function() {
				jQuery(this).find(".arrow-down").addClass("high-light-down");
			}, function() {
				jQuery(this).find(".arrow-down").removeClass("high-light-down");
			});
			//人脸检测、车辆识别算法的布防布控tab切换事件
			jQuery("#manyData").find(".rule-title-tab").off("click").on("click", function() {
				jQuery(this).next().show().siblings("ul").hide();
				//如果是布控，则需要读取数据并渲染
				if (jQuery(this).hasClass("protect") && globalVar.defence.ruleInfo.isDefenceFlag) {
					jQuery(this).find("i").addClass("icon_downarrow").end().siblings(".defence").find("i").removeClass("icon_downarrow");
					//设置操作按钮不可用
					jQuery(".alarm-event-rule-button .cover").removeClass("hidden");
					//改变tab样式
					jQuery("#manyData.contain-protect").find(".rule-title-tab.protect").addClass("active");
					//触发进入布控模式
					self.tabChange(false);
				}
				if (jQuery(this).hasClass("defence") && !globalVar.defence.ruleInfo.isDefenceFlag) {
					jQuery(this).find("i").addClass("icon_downarrow").end().siblings(".protect").find("i").removeClass("icon_downarrow");
					//设置操作按钮可用
					jQuery(".alarm-event-rule-button .cover").addClass("hidden");
					//改变tab样式
					jQuery("#manyData.contain-protect").find(".rule-title-tab.protect").removeClass("active");
					//触发进入布防模式
					self.tabChange(true);
				}
				//如果处于截图状态，则触发播放实时流
				PubSub.publish(SHOW_PLAYING_VIDEO_STREAM, {});
			});
			//禁用参数输入框的回车事件
			jQuery(".alarmRuleDetailPanel input[type='text']").off("keydown").on("keydown", function(event) {
				if (event.keyCode === 13) {
					//禁用回车
					event.stopPropagation();
					event.preventDefault();
					return false;
				}
			});
			//最大最小过滤的checkbox点击事件
			jQuery(".event-rect-filter input[type='checkbox']").off("click").on("click", function() {
				if (jQuery(this).attr("name") === "EnableMinRectFilter") {
					if (jQuery(this).prop("checked")) {
						//关闭遮罩层
						jQuery(this).closest("span").find(".filter_min_layout").addClass("hidden");
					} else {
						jQuery(this).closest("span").find(".filter_min_layout").removeClass("hidden");
					}
				} else {
					if (jQuery(this).prop("checked")) {
						jQuery(this).closest("span").find(".filter_max_layout").addClass("hidden");
					} else {
						jQuery(this).closest("span").find(".filter_max_layout").removeClass("hidden");
					}
				}
			});
			// 点击灵敏度
			jQuery(".alarm-sensitivity .bar").off("click").on("click", function() {
				jQuery(this).addClass("active").siblings().removeClass("active");;
			});
			/**
			 * [description]实时标注事件
			 * @date  {[2015-06-25]}
			 * @author {[leon.z]} 
			 */
			//处理区域绘制
			var drawPrcoPoly = function() {
					DrawEditor.strokecolor = '#44A0FF';
					DrawEditor.add_poly({
						points: globalVar.defence.ruleInfo.procPolyData[0].ploygon,
						text: '',
						domid: globalVar.defence.ruleInfo.procPolyData[0].domid
					});
				}
				//屏蔽区域绘制
			var drawShiledPoly = function() {
				DrawEditor.strokecolor = '#E24332';
				_.map(globalVar.defence.ruleInfo.shieldPolyData, function(item) {
					DrawEditor.add_poly({
						points: item.ploygon,
						text: '',
						domid: item.domid
					});
				})
			}

			//改变区域查看按钮状态
			var changeEyeIcon = function($dom) {
				if ($dom.hasClass('icon_eyes-open')) {
					$dom.removeClass('icon_eyes-open').addClass('icon_eyes-close');
				} else {
					$dom.removeClass('icon_eyes-close').addClass('icon_eyes-open');
				}
			};
			//控制处理区域的图形显隐的点击事件
			$('#showDraws').on('click', function() {
				if (globalVar.defence.ruleInfo.procPolyData.length === 0 && globalVar.defence.ruleInfo.shieldPolyData.length === 0) {
					notify.warn('当前没有处理区域数据，请添加!');
				} else {
					changeEyeIcon($('#showDraws'));
					if (self.options.procPolyShow || self.options.shieldPolyShow) {
						DrawEditor.clearPaper();
						self.showAreaSelect();
						if (self.options.procPolyShow) {
							self.options.procPolyShow = false;
						}
						if (self.options.shieldPolyShow) {
							self.options.shieldPolyShow = false;
						}
					} else {
						if (globalVar.defence.ruleInfo.procPolyData.length !== 0) {
							drawPrcoPoly();
							self.options.procPolyShow = true;
						}
						if (globalVar.defence.ruleInfo.shieldPolyData.length !== 0) {
							drawShiledPoly();
							self.options.shieldPolyShow = true;
						}

					}

				}
			});
			/** 人脸初始化 */
			var faceInit = function() {
				self.clearPolyStatus();
				disabledVideoRight_Face();
				disabledVideoRight_size();
				if ($("#type-mark-move").prop('checked')) {
					$(".type-params-item .move-height-spinner").spinner({
						disabled: false
					});
					var val = $('.type-params-item .move-height-spinner').spinner("value"),
						text = '人脸尺寸';

					self.options.currentRectObjs = [];
					self.options.currentRectObjs.push({
						$dom: $('.type-params-item .move-height-spinner'),
						text: text
					});
					DrawEditor.clearPaper();
					PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
						callback: function() {
							self.initRect(val, text); /**初始化划线**/
						}
					});

				} else {
					$(".type-params-item .move-height-spinner").spinner({
						disabled: true
					});
					DrawEditor.clearPaper();
					if (self.options.currentRectObjs.length !== 0 && self.options.currentRectObjs[0].text === '参考人脸') {
						self.options.currentRectObjs = [];
					}

				}
			};
			/** 人员初始化 */
			var humanInit = function() {
				self.clearPolyStatus();
				disabledVideoRight_target();
				disabledVideoRight_size();
				if ($("#type-mark-face").prop('checked')) {
					$('.type-params-item [name="face-minFace"]').spinner({
						disabled: false
					});
					var val = $('.type-params-item [name="face-minFace"]').spinner("value"),
						text = '人体尺寸';
					DrawEditor.clearPaper();
					self.options.currentRectObjs = [];
					self.options.currentRectObjs.push({
						$dom: $('.type-params-item [name="face-minFace"]'),
						text: text
					});
					PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
						callback: function() {
							self.initRect(val, text); /**初始化划线**/
						}
					});
				} else {
					$('.type-params-item [name="face-minFace"]').spinner({
						disabled: true
					});
					DrawEditor.clearPaper();
					if (self.options.currentRectObjs.length !== 0 && self.options.currentRectObjs[0].text !== '人员尺寸') {
						self.options.currentRectObjs = [];
						DrawEditor.clearPaper();
					}

				}

			};
			/**车辆初始化 */
			var carInit = function() {
				self.clearPolyStatus();
				disabledVideoRight_Face();
				disabledVideoRight_target();
				if ($("#type-mark-car").prop('checked')) {
					$('.type-params-item [name="car-defaultProvince"]').removeAttr('disabled');
				} else {
					$('.type-params-item [name="car-defaultProvince"]').attr('disabled', "disabled");
				}

			};
			$("#type-mark-move").off("click").on("click", function() {
				var node = $(this).parent("li.type").next("li.type-params")
				if (node.is(":visible")) {
					faceInit();
				}

			});
			$("#type-mark-face").off("click").on("click", function() {
				var node = $(this).parent("li.type").next("li.type-params")
				if (node.is(":visible")) {
					humanInit();
				}

			})
			$("#type-mark-car").off("click").on("click", function() {
					var node = $(this).parent("li.type").next("li.type-params")
					if (node.is(":visible")) {
						carInit();
					}

				})
				// 高级设置点击
			$("#smartMarkform li.type .videdoRight_advancedSet").off("click").on("click", function(event) {
				event.preventDefault();
				event.stopImmediatePropagation();

				$(this).find("i").toggleClass("active");


				var tp = $(this).parent("li.type").next("li.type-params");
				var ListName = $(this).attr("data-type");

				if (tp.is(":visible")) {
					tp.hide();
					DrawEditor.clearPaper();
				} else {
					$("#smartMarkform li.type-params").hide();
					tp.show();
					switch (ListName) {
						case "move":
							faceInit();
							break;
						case "face":
							humanInit();
							break;
						case "car":
							carInit();
							break;
					}
				}
			});

			// 点击区域选择按钮
			$("#type-region-proc").on("click", function(e) {
				e.preventDefault();
				globalVar.defence.ruleInfo.procPolyData = [];
				PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
					callback: function() {
						DrawEditor.strokecolor = '#44A0FF';
						DrawEditor.fontcolor = '#44A0FF';
						self.options.currentPolyType = 'proc';
						DrawEditor.clearPaper();
						self.showPoly('proc');
					}
				})
			});
			$("#type-region-shield").on("click", function(e) {
				e.preventDefault();
				PubSub.publishSync(SCREEN_SHOT_AND_SHOW_LINES, {
					callback: function() {
						DrawEditor.strokecolor = '#E24332';
						DrawEditor.fontcolor = '#E24332';
						self.options.currentPolyType = 'shield';
						DrawEditor.clearPaper();
						self.showPoly('shield');
					}
				})

			});
			$(".showDraw").find("i.icon_alert").on("mouseover mouseout", function(e) {
				if (e.type === "mouseover") {
					$(this).addClass("active").parent().find(".helperdiv").show();
					$(this).parent().find(".arrow").show();
				} else if (e.type === "mouseout") {
					$(this).removeClass("active").parent().find(".helperdiv").hide();
					$(this).parent().find(".arrow").hide();
				}
			});

			//灰化智能标注人脸参数编辑框
			var disabledVideoRight_target = function() {
					$('.type-params-item .spanner[name="move-height"]').spinner({
						disabled: true
					});
				}
				//灰化智能标注人员参数编辑框
			var disabledVideoRight_Face = function() {
					$('.type-params-item .spanner[name="face-minFace"]').spinner({
						disabled: true
					});
				}
				//灰化智能标注车辆参数编辑框
			var disabledVideoRight_size = function() {
					$('.type-params-item .spanner[name="car-minPlate"]').spinner({
						disabled: true
					});
					$('.type-params-item .spanner[name="car-maxPlate"]').spinner({
						disabled: true
					});
					$('.type-params-item .spanner[name="car-defaultProvince"]').attr('disabled', 'disabled');
				}
				//智能标注-灵敏度
			$('.type-params .delicacyLevel').find("span").off("click").on('click', function() {
				disabledVideoRight_Face();
				disabledVideoRight_size();
				$(this).addClass("active").siblings().removeClass('active');
				$(this).attr("data-delicacyLevel", "true").siblings().removeAttr("data-delicacyLevel");

			});
			//默认初始化页面数据
			(function() {
				var ocx = $(".content-down-video #UIOCXDEFEND"),
					ocxPaper = $("#TempSnapCover"),
					defaultRate, maxDefaultRate,
					dateFormt = "";
				defaultRate = Math.floor((ocx.height() || ocxPaper.height()) * 0.1);
				maxDefaultRate = Math.floor((ocx.height() || ocxPaper.height())/2);
				globalVar.defence.ruleInfo.faceProtectInfo.maxSize = maxDefaultRate;
				globalVar.defence.ruleInfo.faceProtectInfo.minSize = 40;
				globalVar.defence.ruleInfo.humInfo.maxSize = maxDefaultRate;
				globalVar.defence.ruleInfo.humInfo.minSize = 50;
				$(".type-params-item .move-height-spinner").val(defaultRate).spinner({
					min: 40,
					max: maxDefaultRate,
					disabled: true,
				}).parents(".type-params-item").find(".resetReminder").html("[40~" + maxDefaultRate + "] 像素");

				$(".type-params-item .face-spinner").val(defaultRate).spinner({
					min: 50,
					max: maxDefaultRate,
					disabled: true,
				}).parents(".type-params-item").find(".resetReminder").html("[50~" + maxDefaultRate + "] 像素");
				dateFormt = Toolkit.getCurDateTime()
				$(".dataPicker .begin-time").val(dateFormt);

			})();

			//删除实时标注任务
			$("#smartMarkDel").off("click").on("click", function() {
				self.delCameraRuleDetail();
			});

			// 点击报警级别
			jQuery(".event-alarm-level .bar").off("click").on("click", function() {
				jQuery(this).addClass("active").siblings().removeClass("active");;
			});
		},
		//去除智能标注区域状态
		clearPolyStatus: function() {
			var self = this;
			self.options.procPolyShow = false;
			self.options.shieldPolyShow = false;
		},
		//判断当前对象数组中对象是否含有text这个key 并返回这个对象在数组中的位置
		include: function(arr, text) {
			var Index = _.indexOf(arr, _.find(arr, function(item) {
				return item.text === text;
			}))
			return {
				index: Index,
				hasText: Index !== -1
			}
		},
		//重绘矩形数据
		reDrawRect: function(options) {
			DrawEditor.strokecolor = 'red';
			this.showRect(options)
		},
		//初始化矩形
		initRect: function(val, text) {
			var self = this;
			var rectData = self.include(self.options.currentRectObjs, text);
			var _initW = 100,
				_initH = 100;
			DrawEditor.strokecolor = '#FF6600';
			DrawEditor.fontcolor = '#FF6600';
			if (self.options.currentRectObjs[rectData.index].size === undefined) {

				_initW = $("#TempSnapCover").width() / 2;
				_initH = $("#TempSnapCover").height() / 2;
				self.showRect({
					elem: rectData.$dom,
					width: val,
					height: val,
					x: _initW,
					y: _initH,
					text: text
				});

				self.options.currentRectObjs[rectData.index].size = {
					width: val,
					height: val,
					x: _initW,
					y: _initH
				}
			} else {
				self.showRect({
					elem: rectData.$dom,
					width: val,
					height: val,
					x: self.options.currentRectObjs[rectData.index].size.x,
					y: self.options.currentRectObjs[rectData.index].size.y,
					text: text
				});
			}
		},
		//显示矩形
		showRect: function(options) {
			var self = this;
			this.showAreaSelect();
			DrawEditor.clearPaper();
			DrawEditor.add_rect({
				x: options.x || 100,
				y: options.y || 100,
				width: options.width,
				height: options.height,
				text: options.text || ""
			});
			DrawEditor.spinnerElem = options.elem;
		},
		//显示图形区域
		showPoly: function(options) {
			var self = this;
			if (self.options.currentRectObjs.length !== 0) {
				self.options.currentRectObjs = [];
				DrawEditor.clearPaper();
			}
			DrawEditor.spinnerElem = null;
			self.showAreaSelect();
			DrawEditor.setPenType('poly');
			DrawEditor.showhelp('poly');
		},
		// 显示多边形域层
		getNodeHasDomId: function(arr, id) {
			var Index = _.indexOf(arr, _.find(arr, function(item) {
				return item.domid === id;
			}))

			return {
				index: Index,
				isHas: Index !== -1
			}
		},
		polyObj: {
			'proc': function(obj, self) {
				globalVar.defence.ruleInfo.procPolyData.push({
					domid: obj.domid,
					ploygon: obj.points
				});
				self.options.procPolyShow = true;
				$("#type-region-proc").addClass("disabled").prop("disabled", true);
				$('.showDraw .icon_eyes-open').show().removeClass('hidden');
			},
			'shield': function(obj, self) {
				globalVar.defence.ruleInfo.shieldPolyData.push({
					domid: obj.domid,
					ploygon: obj.points
				})
				self.options.shieldPolyShow = true;
				if (globalVar.defence.ruleInfo.shieldPolyData.length >= 5) {
					$('#type-region-shield').addClass("disabled").prop("disabled", true);
				} else if (globalVar.defence.ruleInfo.shieldPolyData.length === 1) {
					$('.showDraw .icon_eyes-open').show().removeClass('hidden');
				}
			}
		},
		//对区域多边形只有一个左边变化时标记
		hasOnlyOnePointChange: function(newPoints, oldPoints) {
			var flag = 0;
			_.map(newPoints, function(item, index) {
				if (item[0] !== oldPoints[index][0] || item[1] !== oldPoints[index][1]) {
					flag++;
				}
			})
			return (flag === 1);
		},
		//判断当前点是否越过画布
		pointOutPaper: function(points, oldPoints) {
			var self = this;
			if (!self.hasOnlyOnePointChange(points, oldPoints)) {
				return false;
			}
			for (var i = 0; i < points.length; i++) {
				if (points[i][0] <= 0 || points[i][1] <= 0 || points[i][0] >= self.options.currentPlayerSize.width || points[i][1] >= self.options.currentPlayerSize.height) {
					return true;
				}
			}
			return false;
		},
		showAreaSelect: function() {
			var self = this,
				ocxPaper = $("#TempSnapCover");
			//视频暂停下
			if (ocxPaper.is(":visible")) {
				var ocx = $(".content-down-video #UIOCXDEFEND");

				this.options.currentPlayerSize.width = ocx.width() || ocxPaper.width();
				this.options.currentPlayerSize.height = ocx.height();
				if (!self.DrawEditorInited) {
					DrawEditor.init("TempSnapCover", ocxPaper.width(), ocxPaper.height());
					var ocx = $(".content-down-video #UIOCXDEFEND");
					self.options.currentPlayerSize.width = ocx.width() || ocxPaper.width();
					self.options.currentPlayerSize.height = ocx.height();
					DrawEditor.strokewidth = 5;
					DrawEditor.fontsize = 14;
					DrawEditor.onchange = function(obj) {
						if (obj.type === 'rect') {
							var rectData = self.include(self.options.currentRectObjs, obj.text);
							self.options.currentRectObjs[rectData.index].size = obj.box;
							$(self.options.currentRectObjs[rectData.index].$dom).spinner("value", obj.box.height);
						}

						if (obj.type === 'polyline') {
							var procData = self.getNodeHasDomId(globalVar.defence.ruleInfo.procPolyData, obj.domid);
							var shieldData = self.getNodeHasDomId(globalVar.defence.ruleInfo.shieldPolyData, obj.domid);
							if (procData.isHas === true) {
								if (self.pointOutPaper(obj.points, globalVar.defence.ruleInfo.procPolyData[procData.index].ploygon)) {
									DrawEditor.deletedom(obj.domid);
									DrawEditor.strokecolor = '#44A0FF';
									DrawEditor.add_poly({
										points: globalVar.defence.ruleInfo.procPolyData[procData.index].ploygon,
										text: '',
										domid: obj.domid
									})
									return;
								}
								globalVar.defence.ruleInfo.procPolyData[procData.index].ploygon = obj.points;
							} else if (shieldData.isHas === true) {
								if (self.pointOutPaper(obj.points, globalVar.defence.ruleInfo.shieldPolyData[shieldData.index].ploygon)) {
									DrawEditor.deletedom(obj.domid);
									DrawEditor.strokecolor = '#E24332';
									DrawEditor.add_poly({
										points: globalVar.defence.ruleInfo.shieldPolyData[shieldData.index].ploygon,
										text: '',
										domid: obj.domid
									})
									return;
								}
								globalVar.defence.ruleInfo.shieldPolyData[shieldData.index].ploygon = obj.points;
							} else {
								self.polyObj[self.options.currentPolyType](obj, self)
							}
						}
					}
					self.DrawEditorInited = true;
				}
			}
		},
		/**
		 * [delCameraRuleDetail 删除实时标注任务]
		 * @return {[type]} [description]
		 */
		delCameraRuleDetail: function() {
			var self = this;
			model.delCameraRuleDetail({
				taskId: globalVar.defence.ruleInfo.options.curTaskId,
				_method: "delete"
			}).then(function(res) {
				if (res.code === 200) {
					var $defenceWindow = jQuery("#defenceWindow");
					notify.success("布防任务删除成功！");
					//触发显示实时流&删除图像
					PubSub.publish(SHOW_PLAYING_VIDEO_STREAM, {});
					//触发禁用绘图工具
					PubSub.publish("hideVideoTool", {});
					//标记当前的操作位置
					_g.curOperationPos = 0;
					//更新算法列表
					self.refreshOnReturnBack($defenceWindow);
					jQuery(".rules_set span[data-id='" + globalVar.defence.ruleInfo.options.curRuleId + "']").attr("data-taskid", res.data.taskId);
					jQuery(".rules_set span[data-id='" + globalVar.defence.ruleInfo.options.curRuleId + "']").find("a").removeClass("color-blue").addClass("color-gray");
					jQuery(".rules_set span[data-id='" + globalVar.defence.ruleInfo.options.curRuleId + "']").removeClass("active");
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("布防任务删除异常。");
				}
			}, function() {
				notify.error("布防任务删除异常,请查看网络！");
			});
		},
		/**
		 * 进入算法规则参数页面，根据算法规则显示相应的工具
		 * @param ruleid - 布防算法id，根据不同的算法显示相应的视频操作工具
		 */
		showVideoTool: function(ruleid) {
			var self = this,
				toolList = null;
			switch (ruleid) {
				case 4096:
					/*人流统计*/
				case 2:
					/*拌线检测*/
				case 262144:
					/*出门检测*/
					toolList = self.ruleGraphicTool.categoryOne;
					break;
				case 4:
					/*区域入侵*/
				case 256:
					/*非法停车*/
				case 32:
					/*徘徊检测*/
				case 128:
					/*物品遗留*/
				case 64:
					/*物品丢失*/
				case 2048:
					/*人群聚集*/
				case 65536:
					/*离岗检测*/
				case 1048576:
					/*打架检测*/
				case 4194304:
					/*拥堵检测*/
				case 8388608:
					/*可疑尾随*/
				case 1024:
					/*奔跑检测*/
					toolList = self.ruleGraphicTool.categoryTwo;
					break;
				case 131072: //车流统计
					toolList = self.ruleGraphicTool.carStream;
					break;
				case 16777216:
					/*烟火检测*/
				case 8192:
					/*车牌识别*/
				case 524288:
					/*人脸检测*/
					toolList = self.ruleGraphicTool.fireworksCheck;
					break;
				case 268435456:
					/**实时标注**/
					toolList = self.ruleGraphicTool.structInfo;
					jQuery(".icon_eye").hide();
					break;
				default:
					toolList = self.ruleGraphicTool.hideCategory;
					break;
			}
			//给工具按钮添加样式
			var tempObj = null;
			for (var graphic in toolList) {
				if (toolList.hasOwnProperty(graphic)) {
					switch (graphic) {
						case "line": //直线
							tempObj = jQuery(".content-top-video-tool .video-operation-tool a[class*='icon_line']");
							if (toolList.line) {
								tempObj.removeClass("icon_line_gray").addClass("icon_line");
							} else {
								tempObj.removeClass("icon_line").addClass("icon_line_gray");
								tempObj.off("click");
							}
							break;
						case "mutiLine": //双线
							tempObj = jQuery(".content-top-video-tool .video-operation-tool a[class*='icon_dbline']");
							if (toolList.mutiLine) {
								tempObj.removeClass("icon_dbline_gray").addClass("icon_dbline");
							} else {
								tempObj.removeClass("icon_dbline").addClass("icon_dbline_gray");
								tempObj.off("click");
							}
							break;
						case "rect": //矩形
							tempObj = jQuery(".content-top-video-tool .video-operation-tool a[class*='icon_rec']");
							if (toolList.rect) {
								tempObj.removeClass("icon_rec_gray").addClass("icon_rec");
							} else {
								tempObj.removeClass("icon_rec").addClass("icon_rec_gray");
								tempObj.off("click");
							}
							break;
						case "ploy": //多边形
							tempObj = jQuery(".content-top-video-tool .video-operation-tool a[class*='icon_pol']");
							if (toolList.ploy) {
								tempObj.removeClass("icon_pol_gray").addClass("icon_pol");
							} else {
								tempObj.removeClass("icon_pol").addClass("icon_pol_gray");
								tempObj.off("click");
							}
							break;
						case "remove": //擦除部分
							tempObj = jQuery(".content-top-video-tool .video-operation-tool a[class*='icon_remove']");
							if (toolList.remove) {
								tempObj.removeClass("icon_remove_gray").addClass("icon_remove");
							} else {
								tempObj.removeClass("icon_remove").addClass("icon_remove_gray");
								tempObj.off("click");
							}
							break;
						case "removeAll": //全部擦除
							tempObj = jQuery(".content-top-video-tool .video-operation-tool a[class*='icon_removeall']");
							if (toolList.removeAll) {
								tempObj.removeClass("icon_removeall_gray").addClass("icon_removeall");
							} else {
								tempObj.removeClass("icon_removeall").addClass("icon_removeall_gray");
								tempObj.off("click");
							}
							break;
					}
				}
			}
			//显示暂停相关按钮
			jQuery(".content-top-video-tool .video-operation-tool .icon_pause").css("display", "block");
		},
		/**
		 * [showRuleListOnVideo 在视频上显示规则列表]
		 * @param  {[type]} node [description]
		 * @return {[type]}      [description]
		 */
		showRuleListOnVideo: function(node) {
			var self = this;
			secondControl.getHistoryRuleList(function(err, data) {
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
				var divPosition = jQuery(node).position(),
					divHeight = $ruleList.height(),
					divRight = jQuery(".alarm-events-content-video").width() - divPosition.left - jQuery(node).width() + "px";
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
				$ruleList.find("li").each(function() {
					//给每一个列表项绑定点击事件
					jQuery(this).on("click", function() {
						var PointsInfo = jQuery(this).attr("data-points"),
							selectedRule = parseInt(jQuery(this).attr("event-type"));
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
				$ruleList.hover(function() {
					globalVar.defence.isMouseOverPubDiv = true;
				}, function() {
					globalVar.defence.isMouseOverPubDiv = false;
				});
			});
		},
		/**
		 * 布防/布控tab切换事件
		 * @param isCurDefence - 标记当前进入的是否是布防模式
		 */
		tabChange: function(isCurDefence) {
			var self = this;

			if (isCurDefence) {
				//标记进入布防状态
				globalVar.defence.ruleInfo.isDefenceFlag = true;
				//显示按钮样式
				self.showVideoTool(parseInt(globalVar.defence.ruleInfo.options.curRuleId));
				//重新绑定事件
				self.bindDetailEvents();
				//重新初始化事件绑定
				thirdControl.init();
			} else {
				//标记进入布控状态
				globalVar.defence.ruleInfo.isDefenceFlag = false;
				//读取当前摄像机参与的布控任务列表
				protectController.getCurCameraProtectLists();
				//清除按钮样式
				self.showVideoTool(-1);
			}
		}
	}
});