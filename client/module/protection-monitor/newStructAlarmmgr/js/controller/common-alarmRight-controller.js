define([
	'js/global-varibale',
	'js/model/alarm-model',
	'js/view/common-task-view',
	'jquery',
	'js/controller/common-task-controller',
	'js/controller/common-map-controller',
	'pubsub',
	'js/controller/common-map-deal'
], function(_g, model, view, jQuery, commonctr, commonMapCtr, PubSub, cmapDeal) {
	var Alarmlist = function() {
		var self = this;
		PubSub.subscribe("showPubListInfo", function(msg, data) {
			self.showPubListInfo(data.obj, "level-list", {
				"levellist": true
			});
		});
		PubSub.subscribe("playCameraHistory", function(msg, data) {
			self.playCameraHistory(data.info);
		});
	}
	Alarmlist.prototype = {
		/**
		 * 初始化报警内容
		 */
		init: function() {
			var self = this;
			//初始化事件
			self.bindEvents();
			//加载助手
			view.registerHelper();
			//加载右侧布局
			self.initPageFrame();
		},
		/**
		 * 左侧列表初始化后的事件绑定
		 */
		bindEvents: function() {
			var self = this;
			/**
			 * 右侧报警列表的绑定事件
			 */
			commonctr.bindRightEvents();
			//快速刷新点击事件
			jQuery(document).on("click", "#rightMainSide .refresh-operator", function(event) {

				//取消冒泡
				event.stopPropagation();
				//刷新报警信息列表
				if (jQuery("#rightside .header li[data-focus='true']").attr('data-handler') == "alarmInfoALL") {
					//请求刷新
					commonctr.alarmInfoShowALL();
				} else {
					commonctr.alarmInfoCurrShow();
				}
				self.hideVideoFrame(0);
			});
			//规则事件过滤的点击事件
			jQuery(document).on("click", ".condition-panel .select_container[data-type='rule-list']", function(event) {
				//取消冒泡
				event.stopPropagation();
				if (jQuery(".pubdiv[data-type='rule-list']").is(":visible")) {
					//收起下拉列表，并搜索
					var curSelectInfo = jQuery(".select_container[data-type='rule-list']").attr("data-value");
					if (jQuery(".alarmmgr.pubdiv").attr("data-type") === "rule-list" && curSelectInfo !== commonctr.preSelectRuleList) {
						//触发查询
						var selectAlarmType = jQuery("#rightside .header li[data-focus='true']").attr("data-handler");
						if (selectAlarmType === "alarmInfoALL") {
							//触发筛选事件
							commonctr.alarmInfoShowALL();
						} else {
							commonctr.alarmInfoCurrShow();
						}

					}
					//隐藏
					jQuery(".alarmmgr.pubdiv").hide();
					jQuery(".alarmmgr.pubdiv").attr("data-type", "");
				} else {
					//显示下拉列表
					self.showPubListInfo(this, "rule-list", {
						"rulelist": true
					});
				}
			});
			//时间过滤的点击事件
			jQuery(document).on("click", ".condition-panel .select_container[data-type='time-list']", function(event) {
				//取消冒泡
				event.stopPropagation();
				if (jQuery(".pubdiv[data-type='time-list']").is(":visible")) {
					jQuery(".alarmmgr.pubdiv").hide(); //隐藏下拉列表
				} else {
					//显示下拉列表
					self.showPubListInfo(this, "time-list", {
						"timelist": true
					});
				}
			});
			//状态过滤的点击事件
			jQuery(document).on("click", ".condition-panel .select_container[data-type='status-list']", function(event) {
				//取消冒泡
				event.stopPropagation();
				if (jQuery(".pubdiv[data-type='status-list']").is(":visible")) {
					jQuery(".alarmmgr.pubdiv").hide(); //隐藏下拉列表
				} else {
					//显示下拉列表
					self.showPubListInfo(this, "status-list", {
						"statuslist": true
					});
				}
			});
			//快速处理的点击事件
			jQuery(document).on("click", ".operator-panel .select_container[data-type='fast-deal-list']", function(event) {
				//取消冒泡
				event.stopPropagation();
				//判断是否勾选了报警信息
				if (jQuery(".alarm-info-content .alarm-top-area .checkbox_ctrl_active").length > 0) {
					if (jQuery(".pubdiv[data-type='fast-deal-list']").is(":visible")) {
						jQuery(".alarmmgr.pubdiv").hide(); //隐藏下拉列表
					} else {
						var param = {
							"fastdeallist": true
						};
						//判断有没有除人员布控以外的东西，如果有，则不显示“未知”项
						if (jQuery(".alarm-info-content[data-alarmtype='1'] .alarm-top-area .checkbox_ctrl_active").length === 0) {
							param.showUnknow = true;
						}
						//显示下拉列表
						self.showPubListInfo(this, "fast-deal-list", param);
					}
				} else {
					notify.warn("请先选择要快速处理的报警信息！");
					jQuery(".alarmmgr.pubdiv").hide();
				}
			});

			//报警列表的点击事件
			jQuery(document).on("click", ".scrollbar-panel .content-alarms-list .alarm-info-content", function(event) {
				//用来选中
				jQuery(this).addClass("li-active").siblings().removeClass("li-active alarm-info-active");
				//关闭历史调阅层
				self.hideVideoFrame(1);
				//联动地图
				var params;
				params = {
					cameraId: jQuery(this).attr("data-cameraid"),
					alarmId: jQuery(this).closest("li").attr("data-id"),
					latitude: jQuery(this).closest("li").attr("data-lat"),
					longitude: jQuery(this).closest("li").attr("data-lon")
				};
				commonMapCtr.setCamerasPosition(params);
				commonMapCtr.linkToAlarmListEvent(params.cameraId, "click", params.alarmId);
			});
			//左侧报警列表的鼠标移入事件
			jQuery(document).on("mouseover", ".scrollbar-panel .content-alarms-list .alarm-info-content", function(event) {
				//取消冒泡
				event.stopPropagation();
				if (!jQuery(this).hasClass("li-active")) {
					jQuery(this).toggleClass("alarm-info-active");
				}
				var cameraId = jQuery(this).attr("data-cameraid");
				commonMapCtr.linkToAlarmListEvent(cameraId, "over");
			});
			//左侧报警列表的鼠标移出事件
			jQuery(document).on("mouseout", ".scrollbar-panel .content-alarms-list .alarm-info-content", function(event) {
				//取消冒泡
				event.stopPropagation();

				if (!jQuery(this).hasClass("li-active")) {
					jQuery(this).toggleClass("alarm-info-active");
				}
				var cameraId = jQuery(this).attr("data-cameraid");
				commonMapCtr.linkToAlarmListEvent(cameraId, "out");
			});
			//报警列表中复选框的点击事件
			jQuery(document).on("click", ".alarm-info-content .alarm-top-area .icons-select-alarm", function(event) {
				//取消冒泡
				event.stopPropagation();
				//勾选下拉列表
				jQuery(this).toggleClass("checkbox_ctrl_active");

				if (!jQuery(this).hasClass("checkbox_ctrl_active")) {
					//取消全选
					jQuery(".operator-panel .icons-select-all").removeClass("checkbox_ctrl_active");
				} else {
					//判断是否全部勾选
					var alarmListLength = jQuery(".alarm-info-content").length,
						activeCount = 0;
					jQuery(".alarm-info-content .alarm-top-area .icons-select-alarm").each(function() {
						if (jQuery(this).hasClass("checkbox_ctrl_active")) {
							activeCount++;
						}
					});
					if (activeCount === alarmListLength) {
						//勾中全选
						jQuery(".operator-panel .icons-select-all").addClass("checkbox_ctrl_active");
					}
				}
			});
			//报警处理按钮的点击事件
			jQuery(document).on("click", ".alarm-info-content .alarm-top-area .alarm-mark-deal", function(event) {
				//取消冒泡
				event.stopPropagation();

				//关闭历史调阅
				self.hideVideoFrame(1);
				//选中
				jQuery(this).closest(".alarm-info-content").addClass("li-active").siblings().removeClass("li-active alarm-info-active");
				//定位地图上进行报警处理
				var params;
				params = {
					cameraId: jQuery(this).closest("li").attr("data-cameraid"),
					alarmId: jQuery(this).closest("li").attr("data-id"),
					latitude: jQuery(this).closest("li").attr("data-lat"),
					longitude: jQuery(this).closest("li").attr("data-lon")
				};
				commonMapCtr.setCamerasPosition(params);
				_g.isPauseTaskPush = true; //暂时暂停右侧报警推送
				commonMapCtr.linkToAlarmListEvent(params.cameraId, "click-deal", params.alarmId);
			});
			//历史调阅按钮的点击事件
			jQuery(document).on("click", ".alarm-info-content .alarm-top-area .alarm-video-play", function(event) {
				// 取消冒泡
				event.stopPropagation();
				//选中
				jQuery(this).closest(".alarm-info-content").addClass("li-active").siblings().removeClass("li-active alarm-info-active");
				//调用历史调阅
				var alarmInfo = {
					cameraId: jQuery(this).closest("li").attr("data-cameraid"),
					name: jQuery(this).closest("li").attr("data-name"),
					id: jQuery(this).closest("li").attr("data-id"),
					time: jQuery(this).closest("li").attr("data-time"),
					code: jQuery(this).closest("li").attr("data-cameracode"),
					rulename: jQuery(this).closest("li").attr("data-rulename"),
					taskname: jQuery(this).closest("li").attr("data-taskname"),
					alarmtype: jQuery(this).closest("li").attr("data-alarmtype")
				};
				self.playCameraHistory(alarmInfo);
			});
			//历史调阅视频窗口的关闭事件
			jQuery(document).on("click", ".video-play-frame-new .video-win-close", function() {
				//清除左侧列表的状态
				self.hideVideoFrame(0);
				if(jQuery('#major').attr("data-currPart")==="ocx"){
				 	jQuery("#UIOCX").css({
				 		"position":"absolute",
				 		"left":"0"
				 	})
		    	}
			});
			//左侧列表报警图片的点击事件
			jQuery(document).on("click", ".scrollbar-panel .content-alarms-list .alarm-info-content img", function(event) {
				//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
				window.top.showHideNav("hide");
				//取消冒泡
				event.stopPropagation();
				var This = jQuery(this);
				//显示预览对比的大图
				if (This.closest(".alarm-info-content").attr("data-alarmtype") === "2") { //1是布防2是布控
					var id = This.closest(".alarm-info-content").attr("data-id");
					//左侧布控报警信息点击图片时，请求该报警的详细信息
					model.GetAlarmDetailsById( //参数
						{
							id: id
						}).then(function(res) {
						if (res.code === 200 && res.data.event) {
							var targetPersons = res.data.event.targetPersons;
							var candidate = []; //用来存储候选人信息，以便在弹出层下方显示
							if (targetPersons) {
								for (var i = 0; i < targetPersons.length; i++) {
									candidate[i] = {
										"src": targetPersons[i].featureImagePath[0] ? targetPersons[i].featureImagePath[0] : "/module/common/images/nopic.jpg",
										"libname": targetPersons[i].libName,
										"comparescore": targetPersons[i].score,
										"handlestatus": targetPersons[i].handleStatus ? targetPersons[i].handleStatus : 0
									};
								}
							}
							var data = jQuery.extend({
								"targetSrc": "/service/defence/image?id=" + res.data.event.deployEvent.id || This.attr("src")
							}, candidate[0]);
							jQuery(".alarm-list-dialog.show_event_pic").html(_g.compiler({
								checkAimPerson: true,
								data: data
							}));
							// 这里隐藏是防止resizeImg之后图片闪动，resize之后再显示出来
							$('.pop_pic').find('img').hide();
							//初始化人员布控图片使其自适应
							var resizeImg = function(node) {
								var imgArray = $(node).find('img'),
									$img = '',
									img = {
										width: 0,
										height: 0,
										ratio: 1
									},
									imgParent = {
										width: 0,
										height: 0,
										ratio: 1
									};
								$.each(imgArray, function(index, val) {
									$img = $(val);
									img.width = $img.width();
									img.height = $img.height();
									img.ratio = img.width / img.height;
									imgParent.width = $img.parent().width() - 10;
									imgParent.height = $img.parent().height() - 10;
									imgParent.ratio = imgParent.width / imgParent.height;
									if (img.height > imgParent.height || img.width > imgParent.width) {
										img.ratio >= imgParent.ratio ? $img.width(imgParent.width) : $img.height(imgParent.height);
									}
									$img.css('margin-top', $img.height() / 2 - $img.height());
								});
								setTimeout(function() {
									imgArray.fadeIn(200);
								}, 100);
							};
							//弹出遮罩层
							jQuery(".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog").removeClass("hidden");
							jQuery(".icon_close").fadeIn();
							//初始化弹出框的位置
							$('.pop_pic').find('img').load(function() {
								resizeImg($('.pop_pic'));
							});
							jQuery(".alarm-list-dialog").css({
								left: ($(window).width() - 825) / 2,
								top: ($(window).height() - 580) / 2,
								width: 825,
								height: 580
							});
							/**
							//弹出遮罩层
							jQuery(".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog").removeClass("hidden");
							//初始化弹出框的位置
							jQuery(".alarm-list-dialog").css({
								left: $(window).width() * (1 - _g.protectImgPreviewRate.widthRate) / 2,
								top: $(window).height() * (1 - _g.protectImgPreviewRate.heightRate) / 2,
								width: $(window).width() * _g.protectImgPreviewRate.widthRate,
								height: $(window).height() * _g.protectImgPreviewRate.heightRate
							});
**/
							//工具条的选择状态也随之切换(有效1，无效2，未知3)
							var status = parseInt(candidate[0].handlestatus === "" ? 0 : candidate[0].handlestatus);
							if (status !== 0) {
								jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
								jQuery(".alarm-list-dialog .pop_bottom .toolsBar i:nth-of-type(" + status + ")").addClass("active");
							} else if (status === 0) {
								jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
							}
							//绑定翻页查看图片事件
							cmapDeal.bindTurnPage(candidate, 0);
						} else if (res.code === 500) {
							notify.error(res.data.message + "！错误码：" + res.code);
						} else {
							notify.error("获取报警详细信息失败！");
						}
					});
				} else {
					var param = {
						imgTime: jQuery(this).closest('li').attr("data-time"),
						faceImg: jQuery(this).attr("src"),
						index: 0,
						imgName: jQuery(this).closest('li').attr("data-name")
					};
					if (jQuery("#major").attr("data-currpart") === "ocx") {
						jQuery("#ocxPanel").addClass('indetify');
					}
					//对接统一的查看图片插件
					_g.histNewimplent(param, function() {
						if (jQuery("#major").attr("data-currpart") === "ocx") {
							jQuery("#ocxPanel").removeClass('indetify');
						}
					})
				}
			});
			//关闭查看大图
			jQuery(document).on("click", ".checkAlarm_layout, .checkAlarm_layout_ifr,.icon_close", function() {
				//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
				window.top.showHideNav("show");
				//关闭预览弹出层
				jQuery(".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog").addClass("hidden");
				// 关闭关闭按钮
				jQuery(this).fadeOut();
			});
			//查看图片弹出层的点击事件（关闭）
			jQuery(document).on("click", ".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog .pic_tool a", function() {
				jQuery(".checkAlarm_layout, .checkAlarm_layout_ifr,.alarm-list-dialog").addClass("hidden");
			});

		},
		/**
		 * 页面进来之后，根据模式加载报报警布局
		 */
		initPageFrame: function() {
			var self = this;
			if (_g.AlarmMgrOptions.curPageMode === "alarm-list-mode") {
				//清除地图上的覆盖物
				self.clearMapOnChange();
				//加载报警列表布局
				self.initAlarmFrame();
				//默认加载报警列表（并开启定时器）- 加载第一次
				commonctr.alarmInfoShowALL();
			} else {
				//清除地图上的覆盖物
				self.clearMapOnChange();
			}
		},
		/**
		 * 加载报警列表模式的左侧布局
		 */

		initAlarmFrame: function() {
			var self = this;
			//报警布局
			jQuery("#rightMainSide").html(_g.compiler({
				alarmframe: true
			}));
			//加载筛选栏
			jQuery("#rightMainSide .condition-panel").append(_g.compiler({
				selectctrl: true,
				type: "rule-list",
				value: "报警类型",
				defaultValue: ""
			})).append(_g.compiler({
				selectctrl: false,
				type: "time-list",
				value: "10分钟内",
				defaultValue: 10
			})).append(_g.compiler({
				selectctrl: true,
				type: "status-list",
				value: "全部状态",
				defaultValue: ""
			}));
			//加载操作栏
			jQuery("#rightMainSide .operator-panel .right-operator").append(_g.compiler({
				selectctrl: true,
				type: "fast-deal-list",
				value: "快速处理为",
				defaultValue: 0
			}));
		},
		/**
		 * 显示下拉列表
		 */
		showPubListInfo: function(obj, dataType, compilerParam) {
			//获取当前模拟选择控件的位置
			var self = this,
				positionInfo = {
					left: jQuery(obj).offset().left,
					top: jQuery(obj).offset().top,
					width: jQuery(obj).width(),
					height: jQuery(obj).height()
				};
			//报警管理页面左侧报警信息筛选，获取产生报警的规则列表
			if (dataType === "rule-list") {
				model.GetRuleListByAlarm({}).then(function(res) { //success
					if (res.code === 200 && res.data.defences) {
						compilerParam.data = res.data.defences;
						compilerParam.selectInfo = jQuery(".select_container[data-type='" + dataType + "']").attr("data-value");
						//添加全选
						compilerParam.data.unshift({
							"name": "全选",
							"evType": -1,
							"detail": null,
							"category": -1
						});
						compilerParam.data.forEach(function(item, index) {
								if (parseInt(item.evType) === 268435456) {
									compilerParam.data.splice(index, 1);
								}
							})
							//如果是第一次弹出下拉列表，则需要加载所有类型
						if (jQuery(".select_container[data-type='" + dataType + "']").attr("data-init") === "true") {
							var ruleIdArr = [];
							for (var i = 0; i < res.data.defences.length; i++) {
								ruleIdArr.push(res.data.defences[i].evType);
							}
							compilerParam.selectInfo = ruleIdArr.join(",") + ",";
							//默认进去时是所有的
							jQuery(".select_container[data-type='" + dataType + "']").attr("data-value", compilerParam.selectInfo);
							//下次进入则需要根据选择过的规则进行填充
							jQuery(".select_container[data-type='" + dataType + "']").attr("data-init", "false");
						}
						//显示下拉列表
						commonctr.preSelectRuleList = compilerParam.selectInfo;
						self.dealAfterShowPubDiv(compilerParam, positionInfo, dataType);
					} else if (res.code === 500) {
						notify.error("获取报警事件下拉列表失败!");
					} else {
						notify.error("获取报警事件下拉列表失败！");
					}
				});
			} else {
				//非算法列表时直接渲染模板
				self.dealAfterShowPubDiv(compilerParam, positionInfo, dataType);
			}
		},
		/**
		 * 下拉列表浮动层显示后
		 */
		dealAfterShowPubDiv: function(compilerParam, positionInfo, dataType) {
			var self = this;

			//加载浮动层
			jQuery(".alarmmgr.pubdiv ul").html(_g.compiler(compilerParam));
			//显示浮动层
			jQuery(".alarmmgr.pubdiv").css({
				"left": positionInfo.left + "px",
				"top": positionInfo.top + positionInfo.height + 2 + "px",
				"width": positionInfo.width
			}).attr("data-type", dataType).show();
			//下拉列表项的点击事件
			jQuery(".alarmmgr.pubdiv ul").find("li").each(function() {
				//给每一个列表项绑定点击事件
				jQuery(this).off("click").on("click", function(event) {
					var selectValue = jQuery(this).attr("data-value"),
						selectText = jQuery(this).html(),
						selectAlarmType = jQuery("#rightside .header li[data-focus='true']").attr("data-handler");

					//根据类型进行不同的操作
					if (dataType !== "rule-list") {

						//隐藏下拉列表
						jQuery(".alarmmgr.pubdiv").hide();
						//设置选中值
						jQuery(".select_container[data-type='" + dataType + "']").find(".text").attr("data-value", selectValue);
						if (dataType !== "fast-deal-list") {
							jQuery(".select_container[data-type='" + dataType + "']").find(".text").html(selectText);
						}
						if (dataType === "fast-deal-list") {
							//更新报警状态
							self.updateAlarmsStatus();
						} else if (dataType !== "level-list") {
							if (selectAlarmType === "alarmInfoALL") {
								//触发筛选事件
								commonctr.alarmInfoShowALL();
							} else {
								commonctr.alarmInfoCurrShow();
							}

						}
					} else {
						//切换选中报警类型的状态
						jQuery(this).children("i").toggleClass("checkbox_ctrl_active");
						//获取原有的结果
						var preValue = jQuery(".select_container[data-type='" + dataType + "']").attr("data-value");
						//根据类型实现选择过程
						if (selectValue !== "-1") {
							if (jQuery(this).children("i").hasClass("checkbox_ctrl_active")) {
								//如果全部选中，则勾选全选
								if (jQuery(this).siblings("[data-value!='-1']").find(".checkbox_ctrl_active").length === jQuery(this).siblings("[data-value!='-1']").length) {
									jQuery(this).siblings("[data-value='-1']").children("i").addClass("checkbox_ctrl_active");
									jQuery(".select_container[data-type='" + dataType + "']").attr("data-value", preValue + selectValue + ",-1,");
								} else {
									//选中
									jQuery(".select_container[data-type='" + dataType + "']").attr("data-value", preValue + selectValue + ",");
								}
							} else {
								//考虑到有些布防算法规则的数值比较小，存在子集的情况，故下午替换用前后两个“，”隔开
								var tempValue = "";
								if (preValue.indexOf(selectValue) !== 0) {
									tempValue = preValue.replace("," + selectValue + ",", ",");
								} else {
									tempValue = preValue.replace(selectValue + ",", "");
								}
								if (jQuery(this).siblings("[data-value='-1']").children("i").hasClass("checkbox_ctrl_active")) {
									//取消全选
									jQuery(this).siblings("[data-value='-1']").children("i").removeClass("checkbox_ctrl_active");
									//取消
									jQuery(".select_container[data-type='" + dataType + "']").attr("data-value", tempValue.replace("-1,", ""));
								} else {
									//取消
									jQuery(".select_container[data-type='" + dataType + "']").attr("data-value", tempValue);
								}
							}
						} else {
							//全选的情况下
							if (jQuery(this).children("i").hasClass("checkbox_ctrl_active")) {
								//选中全选-更新各列表的勾选状态
								jQuery(this).siblings().children("i").not(".checkbox_ctrl_active").toggleClass("checkbox_ctrl_active");
								//遍历所有选择节点并添加对应的规则项
								var newRuleIds = [];
								jQuery(this).siblings().each(function() {
									newRuleIds.push(jQuery(this).attr("data-value"));
								});
								//填充选择的值
								jQuery(".select_container[data-type='" + dataType + "']").attr("data-value", newRuleIds.join(",") + ",-1" + ",");
							} else {
								//取消全选-更新各列表的勾选状态
								jQuery(this).siblings().children("i.checkbox_ctrl_active").toggleClass("checkbox_ctrl_active");
								//清空选择的规则列表
								jQuery(".select_container[data-type='" + dataType + "']").attr("data-value", "");
							}
						}
					}
					event.stopPropagation();
				});
			});
			//下拉列表的鼠标移入移出事件
			jQuery(".alarmmgr.pubdiv").hover(function() {
				commonctr.isMouseOverPubDiv = true;
			}, function() {
				commonctr.isMouseOverPubDiv = false;
			});
		},
		updateAlarmsStatus: function() {
			var self = this,
				alarmsIdList = [];
			//收集要处理的报警信息id
			jQuery(".alarm-info-content .alarm-top-area .checkbox_ctrl_active").each(function() {
				alarmsIdList.push(jQuery(this).closest("li").attr("data-id"));
			});
			//获取待处理的状态
			var status = parseInt(jQuery(".select_container[data-type='fast-deal-list']").children(".text").attr("data-value"));
			//根据接口更新数据
			model.UpdateAlarmStatusByFastDeal( //参数
				{
					ids: alarmsIdList.join(","),
					value: status,
					_method: "put"
				}).then(
				function(res) { //success
					if (res.code === 200) {
						notify.success("处理成功！");
						//如果全选勾选则取消全选
						if (jQuery(".operator-panel .icons-select-all").hasClass("checkbox_ctrl_active")) {
							jQuery(".operator-panel .icons-select-all").toggleClass("checkbox_ctrl_active");
						}
						//更新处理后的结果到左侧列表中
						jQuery.each(alarmsIdList, function(index, item) {
							jQuery(".alarm-info-content[data-id='" + item + "']").find(".status").text((status === 1) ? "有效" : (status === 2) ? "无效" : "未知").addClass("status-done");
							cmapDeal.changeCacheStatus({
								id: item
							}, false, status);
						});

					} else if (res.code === 500) {
						notify.error(res.data.message + "！错误码：" + res.code);
					} else {
						notify.error("快速处理报警失败！错误码：" + res.code);
					}
				});
		},
		/**
		 * 在切换模式时清空地图环境
		 */
		clearMapOnChange: function() {

			var self = this;

			if (_g.AlarmMgrOptions.curPageMode === "alarm-list-mode") {
				//清空绘图环境
				_g.AlarmMgrOptions.layers.alarmCameraLayer.hide();
				_g.AlarmMgrOptions.layers.alarmCameraLayer.removeAllOverlays();
				_g.AlarmMgrOptions.layers.alarmCameraLayer.show();
			} else {
				//切换到规则设置模式时，需求清除地图上的报警点位等信息
				_g.AlarmMgrOptions.layers.alarmCameraLayer.hide();
				_g.AlarmMgrOptions.layers.alarmCameraLayer.removeAllOverlays();
				//显示播放视频图层
				_g.AlarmMgrOptions.layers.cameraVideoLayer.show();
				//关闭历史调阅层
				self.hideVideoFrame(0);
			}
			//关闭信息窗
			if (_g.AlarmMgrOptions.infowindow) {
				_g.AlarmMgrOptions.infowindow.close();
			}
			//地图中心点还原
			_g.AlarmMgrOptions.PVAMap.reset();
		},
		/**
		 * 历史调阅
		 */
		playCameraHistory: function(data) {

			var self = this;
			//判断当前是否已经打开了视频播放页面
			if (jQuery(".video-play-frame-new").is(":visible")) {
				var alarmId = jQuery(".video-play-frame-new .video-top").attr("data-alarmid");
				//如果当前正在播放，则放弃
				if (data.id === alarmId) {
					return;
				}
			}
			//根据id读取摄像机信息
			var cameraData = {
				cameraid: data.cameraId,
				alarmid: data.id,
				playtype: "历史调阅",
				name: data.name,
				cameracode: data.code,
				time: data.time
			};
			self.clearVideoInfo();
			//加载播放层
			jQuery(".video-play-frame-new").html(_g.compiler({
				videoplay: true,
				data: cameraData
			}));
			//显示视频播放层
			self.showVideoFrame(cameraData);
		},
		showVideoFrame: function(dataEx) {
			var self = this;
			//先隐藏
			jQuery(".video-play-frame-new").hide();
			//显示视频播放层
			view.showOcxIfirme();
			//释放播放器
			self.clearVideoInfo();
			//初始化播放器
			document.getElementById("UIOCX_HIS").SetLayout(1);
			if (!_g.videoPlayerSigle) {

				_g.videoPlayerSigle = new VideoPlayer({
					layout: 1,
					uiocx: 'UIOCX_HIS'
				});
				document.getElementById("UIOCX_HIS").EnableDES(true);//通知ocx是否解析加密数据

			}
			//点击历史调阅，根据报警id获取报警通道信息，为播放录像做准备
			model.GetAlarmChannelByAlarmId( //参数
				{
					id: parseInt(dataEx.alarmid)
				}).then(function(res) { //success
				if (res.code === 200 && res.data.cameraInfo) {
					var params = res.data.cameraInfo;
					var data = {
						username: params.user,
						password: params.pass,
						ip: params.ip,
						port: params.port,
						path: params.name, //params.path,
						name: params.name
					};
					var begintime = parseInt(dataEx.time) - 30000,
						endtime = parseInt(dataEx.time) + 30000;
					//获取录像深度
					self.getDepthAndPlay(params, begintime, endtime, data);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("获取报警通道信息失败！错误码：" + res.code);
				}
			});
		},
		/**
		 * [getDepthAndPlay 获取历史录像的深度，在历史录像播放的时候需 要一个
		 * 必须的参数就是录像深度并且播放录像]
		 * @author Wang Xiaojun
		 * @date   2014-10-30
		 * @param     params    [包含摄像机通道id的对象]
		 * @param     begintime [录像开始时间]
		 * @param     endtime   [录像结束时间]
		 * @param     data      [摄像机的一系列参数，user,passwd,ip,port,path]
		 * 这个播放参数要用到深度，取深度的时候是调用的历史录像查询的接口，从中间
		 * 获取深度，但是这个过程中可能会查到没有录像，或者报pvg的一系列错误，其中
		 * 确认过的"pvg异常(-17:输出参数缓冲区太小)"其实是没有录像。
		 */
		getDepthAndPlay: function(params, begintime, endtime, data) {
			var self = this;
			//点击历史调阅，根据报警id获取报警通道信息，为播放录像做准备
			model.GetHistoryVideoDepth( //参数
				{
					channel_id: params.cameraChannelId,
					begin_time: begintime,
					end_time: endtime
				}).then(function(res) { //success
				if (res.code === 200 && res.data.videos) {
					if (res.data.videos.length === 0) {
						notify.info("此摄像机没有这个时间段的录像！");
						return false;
					}
					var vodType = parseInt(res.data.videos[0][2]);
					_g.videoPlayerSigle.playHis(0, begintime, endtime, vodType, data, function(n) {});
					logDict.insertMedialog("m9", "查看：" + camera.name + "->摄像机历史视频", "f10", "o4", camera.name); 	
					//兼容浏览器的回调，关闭播放窗口 by wangxiaojun 2014-12-31
					try {
						if (_g.videoPlayerSigle.removeEventListener) {
							_g.videoPlayerSigle.removeEventListener("PlayBackStartOrEnd", self.playHisCallBack, true);
						} else {
							//ie
							_g.videoPlayerSigle.detachEvent("OnPlayBackStartOrEnd", self.playHisCallBack);
						}
					} catch (e) {}
					_g.videoPlayerSigle.on("PlayBackStartOrEnd", self.playHisCallBack);
				} else if (res.code === 500) {
					if (res.data == "pvg异常(-17:输出参数缓冲区太小)" || res.data == "未知异常异常:RMIP_ERR_OUT_BUF_TOO_SMALL 值:-17") {
						notify.warn("该摄像机没有这个时间段的录像或查询录像异常！错误码：-17");
					} else if (res.data == "未知异常异常:RMIP_ERR_NO_POSA_INTERFACE 值:-11") {
						notify.warn("该摄像机没有查询到录像！错误码：-11");
					} else {
						// notify.warn(res.data + "! 错误码: " + res.code);
						notify.warn(res.data || "pvg异常,录像暂时无法播放！");
					}
				} else {
					notify.error("获取录像深度失败！错误码：" + res.code);
				}
			});
		},
		/**
		 * 历史录像播放的回调函数
		 * @param index-当前播放录像窗口的索引
		 * @param flag-当前回调标示，1为录像播放开始，0为播放结束
		 */
		playHisCallBack: function(index, flag) {
			if (flag === 0) {
				//录像播放结束，经产品确认，关闭播放窗口
				jQuery(".video-play-frame-new .video-win-close").trigger("click");
				//录像播放完毕的提示
				notify.info("录像播放完毕！");
			}
		},
		/**
		 * 隐藏视频播放层
		 */
		hideVideoFrame: function(tag) {
			var self = this;
			//如果历史调阅层打开，则进行下面处理
			if (jQuery(".video-play-frame-new").is(":visible")) {
				if(jQuery('#major').attr("data-currPart")==="ocx"){
			 		jQuery("#UIOCX").css({
			 			"position":"absolute",
			 			"left":"0"
			 		})
		    	}
				//关闭视频流
				self.clearVideoInfo();
				//隐藏视频播放层
				jQuery(".video-play-frame-new").hide();
				//如果不是点击列表或者列表上的处理按钮,则清除列表选中状态
				if (tag !== 1) {
					if (!_g.AlarmMgrOptions.infowindow) {
						jQuery(".alarm-info-active").toggleClass("alarm-info-active").removeClass("li-active");
					}
				}
			}
		},
		/**
		 * 清除播放器相关
		 */
		clearVideoInfo: function() {
			var self = this;
			if (_g.videoPlayerSigle) {
				_g.videoPlayerSigle.playerObj.Stop(false, 0);
				_g.videoPlayerSigle = null;
			}
		},

	}
	return new Alarmlist();
});