/*
 ** 报警处理 by Leon.z 新布防布控页面主业务代码
 */
define([
	'../model/alarm-model',
	'../model/preventcontrol-model',
	'../view/common-task-view',
	'pubsub',
	'../global-varibale',
	'./common-alarm-lineTools',
	'Message',
	'./common-map-scroll',
	'domReady'
], function(alarmModel, ajaxCtrModel, alarmDealView, PubSub, global, lineTools, messageInfo,mapScroll,ready) {
	window.curr = 0;
	var Commonctr = function() {
		var self = this;
		PubSub.subscribe("toDealTaskPart", function(msg, data) {
			self.initTaskTemp(data)
		});
		PubSub.subscribe("toDealTaskPartOther", function(msg, data) {
			self.relaodTmp(data)
		});
		//PubSub.subscribe("toDealCtrTaskPart",function(msg,data){self.dealCtrTask(data)});
		PubSub.subscribe("toDealDefenceTask", function(msg, data) {
			self.dealDefenceTask(data)
		});
		PubSub.subscribe("toDealDefaultCurrData", function(msg, data) {
			self.firstShowCurrData(data)
		});
		this.message = window.message || {};
		global.messageCache = this.message;

		this.message.notifyFuncList = [];
		this.message.notifyFuncList.push(this.bickerLine, this.receiveAlarm.bind(this));
		jQuery("#taskContent").hide(0);
		jQuery("#taskPart").hide(0);
		self.flag = false;
	};
	Commonctr.prototype = {
		isPushed: false,
		//标记用户是否将鼠标移入下拉浮动层中
		isMouseOverPubDiv: false,
		//记录上一次勾选的值（左侧报警类型列表）
		preSelectRuleList: "",
		//历史调阅播放器
		videoPlayerSigle: null,
		//报警列表默认读取条数
		defaultAlarmListSize: 50,
		flag: false,
		oneSecondPushNum:0,
		oldNum:0,
		//初始化
		init: function(opt) {
			var self = this;
			self.compiler = opt ? opt.compiler : global.compiler
			//view层初始化
			alarmDealView.init();
			self.defenceTsakSet();
			// 初始化时，先获取10条报警信息
			self.getTenAlarm();
			//初始化地图报警信息滚动
			mapScroll.init();
		},
		getTenAlarm: function() {
			jQuery.ajax({
				type: "get",
				url: "/service/events",
				data: {
					eventCount: 10
				}
			}).then(function(res) {
				if (res.code === 200 && res.data.events) {
					var $alarmRigthContent = jQuery("#rightAlarmList");
					$alarmRigthContent.find("p.style-text-info").hide()
					res.data.events.forEach(function(item) {
						var html = global.compiler({
							alarmevent: true,
							alarms: item
						});
						$alarmRigthContent.append(html);
						global.currentAlarmListCache.push({
							content: item
						});
						//添加权限设置
						permission.reShow();
					});
				} else {
					notify.error("获取报警信息失败");
				}
			}, function() {
				//后端这个接口没有报错，但页面时不时会报这个错误，多发生于页面跳转时，跳进或跳出布防布控
				//先注释掉
				//notify.error("获取报警信息失败");
			});
		},
		bindRightEvents: function() {
			var self = this;
			//报警列表的全选点击事件
			jQuery(document).on("click", ".operator-panel .icons-select-all", function(event) {
				//取消冒泡
				event.stopPropagation();
				//切换自身的勾选状态
				jQuery(this).toggleClass("checkbox_ctrl_active");

				if (jQuery(this).hasClass("checkbox_ctrl_active")) {
					//勾选全部报警信息
					jQuery(".alarm-info-content .alarm-top-area .icons-select-alarm").removeClass("checkbox_ctrl_active").addClass("checkbox_ctrl_active");
				} else {
					//不勾选任何报警信息
					jQuery(".alarm-info-content .alarm-top-area .icons-select-alarm").removeClass("checkbox_ctrl_active");
				}
			});

			//事件列表触发点失去焦点时隐藏（如果是报警规则列表，则需要触发报警查询）
			jQuery(document).on("click", function() {
				if (!self.isMouseOverPubDiv) {
					var curSelectInfo = jQuery(".select_container[data-type='rule-list']").attr("data-value");
					if (jQuery(".alarmmgr.pubdiv").attr("data-type") === "rule-list" && curSelectInfo !== self.preSelectRuleList) {
						//触发查询
						if (jQuery("#rightside .header li[data-focus='true']").attr('data-handler') == "alarmInfoALL") {
							self.alarmInfoShowALL();
						} else {
							self.alarmInfoCurrShow();
						}
					}
					//隐藏
					jQuery(".alarmmgr.pubdiv").hide();
					jQuery(".alarmmgr.pubdiv").attr("data-type", "");
				}
			});
			//点击布控任务展开摄像机列表
			jQuery(document).on("click", '#controlTaskList .control-list-item', function(e) {
				e.stopPropagation();
				var node = jQuery(this),
					taskId = jQuery(this).attr("data-taskId");
				if (node.hasClass("active")) {
					node.removeClass("active");
					node.find(".cameraList").slideUp(200);
				} else {
					node.addClass("active");
					node.find(".cameraList").slideDown(200);
					if (node.find(".cameraList").find("li").length == 0) {
						ajaxCtrModel.ajaxEvents.checkSingleTask({
							id: taskId
						}, function(res) {
							if (res.code === 200) {
								var res = {
									alarmCtrInerList: res.data.cameras
								}
								var htmls = self.compiler(res);
								node.find(".cameraList").empty().append(htmls);
								//添加权限设置
								permission.reShow();
							}
						}, function() {
							notify.error('获取当前任务下的摄像机列表失败!')
						})
					}

				}

			});
		},
		/**
		 * [firstShowCurrData 第一次进入时如果为我的关注，默认加载一次数据]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		firstShowCurrData:function(data){
			var self = this;
			if(global.curAlarmMode==="alarm-all-mode"){
				return;
			}
			self.alarmInfoCurrShow();
		},
		//获取当前摄像机布防的任务列表
		initTaskTemp: function(data) {
			var self = this;
			self.flag = false;
			ajaxCtrModel.ajaxEvents.getTaskListByCamera({
				cameraId: data.cameraId
			}, function(res) {
				if (res.code === 200 && Object.prototype.toString.call(res.data) === "[object Array]") {
					var res = {
						isTaskList: true,
						taskList: res.data,
					}
					var html = self.compiler(res);

					if (res.taskList.length < 2) { //如果当前只有一个布防任务，走单个画框
						self.dealDefenceSingleTask(res.taskList);
					} else {
						jQuery("#taskSelect").show(0);
					}
					jQuery("#taskContent").empty().append(html);
					//添加权限设置
					permission.reShow();
				}
			}, function() {
				notify.error('获取当前摄像机下的布防任务列表失败!')
			});
		},
		relaodTmp: function(data) {
			var self = this;
			ajaxCtrModel.ajaxEvents.getTaskListByCamera({
				cameraId: data.cameraId
			}, function(res) {
				if (Object.prototype.toString.call(res.data) !== "[object Array]") {
					return false;
				}
				
				if (res.data.length < 2) { //如果当前只有一个布防任务，走单个画框
					notify.warn("此摄像机只有一个布防任务")
					return;
				} else {
					res.data.forEach(function(item, index) { //add by leon.z 实时标注区别其他算法，无框线显示，过滤掉
						if (item.ev_type === "268435456") {
							res.data.splice(index, 1);
						}
					});
					var res = {
						isTaskList: true,
						taskList: res.data,
					}
					var html = self.compiler(res);
					jQuery("#taskContent").empty().append(html);
					//添加权限设置
					permission.reShow();
					alarmDealView.resizeTaskP(); //自适应当前列表高度
				}
			}, function() {
				notify.error('获取当前摄像机下的布防任务列表失败!')
			})

		},
		//触发布控框线函数
		dealCtrTask: function(data) {
			var self = this,
			currIndex = global.currIndex,
			cameraCurrRate = lineTools.getDisplayRate(),
				cameraRate = lineTools.getCameraRate(currIndex),
				ruleInfo = self.getFaceRuleDetails(data);
			lineTools.redraw(ruleInfo, "12124160", cameraCurrRate, currIndex);
			$.extend(global.curScreenCameraIds[currIndex], {
				lineInfo: ruleInfo
			});

			

		},
		//触发布防单个框线函数
		dealDefenceSingleTask: function(data) {
			var self = this,
			currIndex = global.currIndex;
			jQuery("#taskContent").hide(0);
			if (data) {
				var lineInfo,
					cameraCurrRate = lineTools.getDisplayRate(),
					cameraRate = lineTools.getCameraRate(currIndex);
				lineInfo = data[0].front_param ? JSON.parse(data[0].front_param) : [],
					// lineTools.ruleLineOpera.dealGraphicOnVideo(lineInfo,"12124160", cameraCurrRate ,currIndex);
				lineTools.redraw(lineInfo, "12124160", cameraCurrRate, currIndex);
				lineTools.redrawTriggerClick(lineInfo, "12124160", currIndex);
				$.extend(global.curScreenCameraIds[currIndex], {
					lineInfo: Object.create(lineInfo),
					selcetMode: data[0].rule_name
				});
			}

		},
		//触发布防框线函数
		dealDefenceTask: function(data) {
			var self = this,
			currIndex = jQuery("#taskSelect").attr("data-cindex");
			jQuery("#taskContent").hide(0);
			if (data) {
				var lineInfo,
					cameraCurrRate = lineTools.getDisplayRate(),
					cameraRate = lineTools.getCameraRate(currIndex);
				lineInfo = data.taskData === "" ? [] : JSON.parse(data.taskData),
					lineTools.clearAllImage(currIndex);
				lineTools.redrawTriggerClick(Object.create(lineInfo), "12124160", currIndex);
				// lineTools.ruleLineOpera.dealGraphicOnVideo(lineInfo,"12124160", cameraCurrRate ,currIndex);
				lineTools.redraw(lineInfo, "12124160", cameraCurrRate, currIndex);
				$.extend(global.curScreenCameraIds[currIndex], {
					lineInfo: Object.create(lineInfo)
				});
			}
		},
		bickerLine: function(data) {
			var lineInfos = [];
			// 如果当前摄像机执行了画线，并且处于休息中，则返回。3秒后醒来
			if (window["cameraSleepRightDom_s"]) {
				self.oldNum++;
				if (self.oldNum >= 2) {
					self.oldNum = 0;
					return false
				}
			}
			var b = function(currIndex, cameraCurrRate, oldId) {
					var dataOrg = global.curScreenCameraIds[currIndex];
					var datas = dataOrg.lineInfo;
					if (datas) {
						for (var j = 0, les = datas.length; j < les; j++) {
							if (datas[j].domid === data.content.domid /**|| datas[j].text==="人脸检测区域"**/ ) {
								if (data.content.eventType === 8192 && dataOrg.selcetMode === "车牌识别") { //车牌识别显示车牌
									datas[j].text = data.content.lprValue;
								}
								if (data.content.eventType === 131072 && dataOrg.selcetMode === "车流统计") { //车流统计闪动显示车流数
									datas[j].text = data.content.areaName;
								}
								if (data.content.eventType === 4096 && dataOrg.selcetMode === "人数统计") {
									datas[j].text = data.content.areaName;
								}
								var index = 0;;
								(function(lineInfo) {
									if (lineInfo) {
										lineInfos.push(lineInfo);
										if (timer) {
											clearInterval(timer);
										}
										var timer = setInterval(function() {
											index++;
											if (index >= 2) {
												clearInterval(timer);
												index = 0;
											}
											if (global.curScreenCameraIds[currIndex] && parseInt(global.curScreenCameraIds[currIndex].cId) !== oldId) {
												lineTools.redraw(global.curScreenCameraIds[currIndex].lineInfos, "12124160", cameraCurrRate, currIndex);
												return;
											}
											// lineTools.ruleLineOpera.dealGraphicOnVideo(lineInfos, "255", cameraCurrRate, currIndex);
											lineTools.redraw(lineInfos, "255", cameraCurrRate, currIndex);
											setTimeout(function() {
												// lineTools.clearAllImage(currIndex);
												if (global.curScreenCameraIds[currIndex] && parseInt(global.curScreenCameraIds[currIndex].cId) !== oldId) {
													lineTools.redraw(global.curScreenCameraIds[currIndex].lineInfos, "12124160", cameraCurrRate, currIndex);
													return;
												}
												// lineTools.ruleLineOpera.dealGraphicOnVideo(datas, "12124160", cameraCurrRate, currIndex)
												lineTools.redraw(datas, "12124160", cameraCurrRate, currIndex);
											}, 500)
										}, 800);
										
									}

								})(datas[j]);
							}

						}

					}
				},
				cameraIdsList = global.curScreenCameraIds,
				currIndex, cameraCurrRate = lineTools.getDisplayRate(),
				index = 0;
			if (cameraIdsList.length > 0) {
				lineInfos = [];
				for (var i = 0, le = cameraIdsList.length; i < le; i++) {

					if (cameraIdsList[i] === null) {
						continue;
					}
					if (parseInt(cameraIdsList[i].cId) === parseInt(data.content.cameraId)) {
						currIndex = i;

						if (jQuery("#major").attr("data-currpart") !== "ocx") {
							return;
						}
						window["cameraSleepRightDom_s"] = setTimeout(function() {
							clearTimeout(window["cameraSleepRightDom_s"]);
							self.oldNum = 0
						}, 500);
						b(currIndex, cameraCurrRate, parseInt(data.content.cameraId));
					}
				}
			}
		},
		// //判断当前视频是否加载完
		// isPlayLoad: function(indexs, callback) {
		// 	var self = this,
		// 		timer, index;
		// 	index = indexs ? indexs : global.currIndex;
		// 	self.flag = lineTools.checkedPlayer(1, index);
		// 	console.log(self.flag)
		// 	if (!self.flag) {
		// 		timer = setInterval(function() {
		// 			self.flag = lineTools.checkedPlayer(1, index);
		// 			if (self.flag) {
		// 				clearInterval(timer);
		// 				self.flag = true;
		// 				if (typeof callback === "function") {
		// 					callback();
		// 				}
		// 			} else if (!self.flag && global.videoPlayer.cameraData[index].cplayStatus === 1 || global.videoPlayer.cameraData[index].cplayStatus === 2) {
		// 				clearInterval(timer);
		// 				return false;
		// 			}
		// 		}, 1000)
		// 	} else {
		// 		if (typeof callback === "function") {
		// 			callback();
		// 		}
		// 	}
		// },
		//布防任务摄像机列表
		defenceTsakSet: function() {
			var self = this;
			var params = {
				orgId: 1,
				cameraName: "",
				evType: "",
				pageNo: 1,
				pageSize: 10
			}
			ajaxCtrModel.ajaxEvents.getCameraList(params, function(res) {
				if (res.code === 200) {
					var opts = {
						alarmDefenceframe: true,
						alarmDefenceList: res.data
					}

					var html = self.compiler(opts);
					jQuery("#aside").empty().append(html);
					//添加权限设置
					permission.reShow();
				}

			}, function(error) {
				notify.error('获取布防任务列表失败!')
				var opts = {
					alarmDefenceframe: true
				}
				var html = self.compiler(opts);
				jQuery("#aside").empty().append(html)
			})

		},
		//布控任务列表
		controlTsakSet: function() {
			var self = this;
			var params = {
				pageNum: 1,
				pageSize: 50,
				name: ""
			}
			ajaxCtrModel.ajaxEvents.searchControlTask(params, function(res) {
				if (res.code === 200) {
					var opts = {
						alarmControlframe: true,
						alarmControlList: res.data.tasks
					}
					var html = self.compiler(opts);
					jQuery("#aside").empty().append(html);
					//添加权限设置
					permission.reShow();
				}
			}, function(res) {
				notify.error('获取布控任务列表失败!')
			})
		},
		//获取所以报警信息列表
		alarmInfoShowALL: function() {
			var self = this,
				cameraIds;
			global.curAlarmMode = "alarm-all-mode";
			ready(function () {
				self.filterAlarmData();
				//如果全选勾选则取消全选
				if (jQuery(".operator-panel .icons-select-all").hasClass("checkbox_ctrl_active")) {
					jQuery(".operator-panel .icons-select-all").toggleClass("checkbox_ctrl_active");
				}
				self.mapScrolliImplements(false);//触发滚动
			});
			
		},
		receiveAlarm: function(data) {
			var self = this;
			if (global.isPauseTaskPush) {
				return;
			}

			if (!data) {
				return false;
			}

			var 
				self = this,
				cameraIds = self.ArrayUnique(global.curScreenCameraIds),
				params = self.formatData();

			if (!params) {
				return false;
			}
			if(window["cameraSleepRightDom_"]){
				self.oneSecondPushNum++;
				if(self.oneSecondPushNum>=2){
					return false
				}
			}
		
			window["cameraSleepRightDom_"] = setTimeout(function() {
				clearTimeout(window["cameraSleepRightDom_"]);
				self.oneSecondPushNum = 0
			},500);
			var alarmList = (params.eventType === "" ? null : params.eventType.split(","));
			if (global.curAlarmMode === "alarm-now-mode") {
				if (cameraIds.length === 0) {
					return false;
				}
			
				for (var i = 0, le = cameraIds.length; i < le; i++) {
					if (parseInt(cameraIds[i]) === parseInt(data.content.cameraId)) {
						global.currNowAlarmList.push(data);
						self.mapScrolliImplements(false);//触发滚动
						self.filterIner(params, data, alarmList);
					}
				}
			} else {
				self.filterIner(params, data, alarmList);
			}

			global.AlarmMgrOptions.curAlarmDataList.alarms = data.content;
			if (global.currentAlarmListCache.length > 19) {
				global.currentAlarmListCache = global.currentAlarmListCache.slice(-19);
				jQuery("#rightAlarmList").find("li:gt(19)").remove();
			}
			global.currentAlarmListCache.push(data);
			self.mapScrolliImplements(false);//触发滚动
		},
		ArrayUnique: function(objArray) {
			var re = [];
			for (var i in objArray) {

				if (objArray.hasOwnProperty(i)) {
					if (!objArray[i]) {
						continue;
					}
					if (re.indexOf(objArray[i].cId) == -1) {
						re.push(objArray[i].cId);
					}
				}

			}
			return re;
		},
		formatData: function() {
			//收集筛选条件
			var param = {};
			//收集报警规则类型,如果是第一次弹出下拉列表，则需要加载所有类型
			param.eventType = "";
			if (jQuery(".select_container[data-type='rule-list']").attr("data-init") !== "true") {
				var selectRuleList = jQuery(".select_container[data-type='rule-list']").attr("data-value");
				if (jQuery.trim(selectRuleList) === "") {
					notify.warn("请选择要进行筛选的报警类型！");
					return;
				} else {
					param.eventType = selectRuleList.substring(0, selectRuleList.length - 1);
				}
			}
			
			//收集处理状态
			param.status = jQuery(".select_container[data-type='status-list']").children(".text").attr("data-value") ? parseInt(jQuery(".select_container[data-type='status-list']").children(".text").attr("data-value")) : "";
			return param;

		},
		filterIner: function(params, data, alarmList) {
			var cameraId = data.content && data.content.cameraId;
			if (params.status === "" && alarmList === null) {
				if (jQuery("#rightAlarmList").find("li").length === 0) {

					jQuery("#rightAlarmList").find("p.style-text-info").hide().before(global.compiler({
						alarmevent: true,
						alarms: data.content
					}));
				} else {

					var html = global.compiler({
						alarmevent: true,
						alarms: data.content
					})
					jQuery("#rightAlarmList").find("li:first").before(html);
				}

			}
			if (params.status !== "" && alarmList === null && parseInt(data.content.dealStatus) === parseInt(params.status)) {
				if (jQuery("#rightAlarmList").find("li").length === 0) {

					jQuery("#rightAlarmList").find("p.style-text-info").hide().before(global.compiler({
						alarmevent: true,
						alarms: data.content
					}));
				} else {

					var html = global.compiler({
						alarmevent: true,
						alarms: data.content
					})
					jQuery("#rightAlarmList").find("li:first").before(html);

				}
			}
			if (params.status === "" && alarmList !== null) {
				for (var i = 0, le = alarmList.length; i < le; i++) {
					if (parseInt(alarmList[i]) === parseInt(data.content.eventType)) {

						if (jQuery("#rightAlarmList").find("li").length === 0) {

							jQuery("#rightAlarmList").find("p.style-text-info").hide().before(global.compiler({
								alarmevent: true,
								alarms: data.content
							}));
						} else {

							var html = global.compiler({
								alarmevent: true,
								alarms: data.content
							})
							jQuery("#rightAlarmList").find("li:first").before(html);

						}
					}


				}
			}
			if (params.status !== "" && alarmList !== null) {
				for (var i = 0, le = alarmList.length; i < le; i++) {
					if (parseInt(alarmList[i]) === parseInt(data.content.eventType) && parseInt(data.content.dealStatus) === parseInt(params.status)) {

						if (jQuery("#rightAlarmList").find("li").length === 0) {

							jQuery("#rightAlarmList").find("p.style-text-info").hide().before(global.compiler({
								alarmevent: true,
								alarms: data.content
							}));
						} else {

							var html = global.compiler({
								alarmevent: true,
								alarms: data.content
							})
							jQuery("#rightAlarmList").find("li:first").before(html);

						}
					}


				}
			}
		},
		filterAlarmData: function(cache) {

			var self = this,
				params, alarmList;
			params = self.formatData();
			alarmList = (params.eventType === "" ? null : params.eventType.split(","));
			cache = cache ? cache : global.currentAlarmListCache;
			if (cache.length > 0) {
				jQuery("#rightAlarmList").find("p.style-text-info").siblings().remove();
				for (var i = 0, len = cache.length; i < len; i++) {

					if (alarmList === null && params.status === "") {
						jQuery("#rightAlarmList").find("p.style-text-info").hide().before(global.compiler({
							alarmevent: true,
							alarms: cache[i].content
						}));
						jQuery(".scrollbar-panel").removeClass("loading");

					}
					if (alarmList === null && params.status !== "") {
						if (parseInt(cache[i].content.dealStatus) === parseInt(params.status)) {
							jQuery("#rightAlarmList").find("p.style-text-info").hide().before(global.compiler({
								alarmevent: true,
								alarms: cache[i].content
							}));
							jQuery(".scrollbar-panel").removeClass("loading");
						}
					}
					if (alarmList !== null && params.status === "") {
						jQuery("#rightAlarmList").find("p.style-text-info").hide();
						for (var j = 0, lens = alarmList.length; j < lens; j++) {
							if (parseInt(cache[i].content.eventType) === parseInt(alarmList[j])) {
								jQuery("#rightAlarmList").find("p.style-text-info").hide().before(global.compiler({
									alarmevent: true,
									alarms: cache[i].content
								}));
								jQuery(".scrollbar-panel").removeClass("loading");
							}

						}
					}
					if (alarmList !== null && params.status !== "") {
						for (var j = 0, lens = alarmList.length; j < lens; j++) {
							if (parseInt(cache[i].content.eventType) === parseInt(alarmList[j]) && parseInt(cache[i].content.dealStatus) === parseInt(params.status)) {
								jQuery("#rightAlarmList").find("p.style-text-info").hide().before(global.compiler({
									alarmevent: true,
									alarms: cache[i].content
								}));
								jQuery(".scrollbar-panel").removeClass("loading");
							}
						}
					}

				}
			}


		},
		//获取视频报警信息列表
		alarmInfoCurrShow: function() {
			var self = this,
				cameraIds = self.ArrayUnique(global.curScreenCameraIds),
				params = self.formatData();
			global.curAlarmMode = "alarm-now-mode";
			$.extend(true, params, {
				cameraIds: cameraIds
			});
			jQuery(".scrollbar-panel").addClass("loading");
			jQuery("#rightAlarmList").find("p.style-text-info").siblings().remove();
			global.currNowAlarmList = [];
			if (global.currentAlarmListCache.length > 0) {
				if (params.cameraIds.length > 0) {
					for (var j = 0, len = params.cameraIds.length; j < len; j++) {
						for (var i = 0, le = global.currentAlarmListCache.length; i < le; i++) {
							if (parseInt(params.cameraIds[j]) === parseInt(global.currentAlarmListCache[i].content.cameraId)) {
								global.currNowAlarmList.push(global.currentAlarmListCache[i]);
							}
						}
					}
					self.filterAlarmData(global.currNowAlarmList);
					self.mapScrolliImplements(false);//触发滚动
				} else {
					jQuery("#rightAlarmList").find("p.style-text-info").show();
					mapScroll.clearScrollTimer(true);
				}
				//关闭进度层
				jQuery(".scrollbar-panel").removeClass("loading");

			} else {
				//关闭进度层
				jQuery(".scrollbar-panel").removeClass("loading");
			}

		},
		/**
		 * 获取当前布控任务的人脸检测区域信息,眼睛查看的时候调用
		 */
		getFaceRuleDetails: function(data) {

			var self = this;
			var ruleInfo = [{
				text: "人脸检测区域",
				type: "rect",
				points: [4],
				drawRate: lineTools.getDisplayRate()
			}];
			//获取当前的坐标区域
			var x = 50,
				y = 50,
				width = lineTools.getDisplayRate().width - 100,
				height = lineTools.getDisplayRate().height - 100;


			x = (parseFloat(data.left) === 0) ? x : parseFloat(data.left);
			y = (parseFloat(data.top) === 0) ? y : parseFloat(data.top);
			width = ((parseFloat(data.right) - parseFloat(data.left)) > 0) ? (parseFloat(data.right) - parseFloat(data.left)) : width;
			height = ((parseFloat(data.bottom) - parseFloat(data.top)) > 0) ? (parseFloat(data.bottom) - parseFloat(data.top)) : height;

			//装载坐标信息
			ruleInfo[0].points[0] = [];
			ruleInfo[0].points[0][0] = parseFloat(x);
			ruleInfo[0].points[0][1] = parseFloat(y);

			ruleInfo[0].points[1] = [];
			ruleInfo[0].points[1][0] = parseFloat(x) + parseFloat(width);
			ruleInfo[0].points[1][1] = parseFloat(y);

			ruleInfo[0].points[2] = [];
			ruleInfo[0].points[2][0] = parseFloat(x) + parseFloat(width);
			ruleInfo[0].points[2][1] = parseFloat(y) + parseFloat(height);

			ruleInfo[0].points[3] = [];
			ruleInfo[0].points[3][0] = parseFloat(x);
			ruleInfo[0].points[3][1] = parseFloat(y) + parseFloat(height);
			//返回布控任务的规则区域
			return ruleInfo;
		},
		/**
		 * 实现滚动数据封装
		 */
		 mapScrolliImplements:function(flag){
		 	var self = this,data=[];
		 	global.scrollInfo.scrollList = [];
		 	var getScrollData = function(Arr){
		 		global.scrollInfo.scrollList = [];
		 		for(var i=0,le =Arr.length;i<le;i++){
		 			if(parseInt(Arr[i].content.linkedType)===6){
		 				global.scrollInfo.scrollList.push(Arr[i].content);
		 			}
		 		}
		 		return global.scrollInfo.scrollList
		 	};
		 	if(global.curAlarmMode==="alarm-all-mode"){
		 		mapScroll.triggerScroll(getScrollData(global.currentAlarmListCache));
		 	}else{
		 		mapScroll.triggerScroll(getScrollData(global.currNowAlarmList));
		 	}
		 	
		 }



	};
	return new Commonctr();
});