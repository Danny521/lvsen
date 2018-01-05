/**
 * 历史报警模块
 * @author chengyao
 * @date   2014-12-08
 */
define([
	'../alarmanalysis-global-var',
	'../model/alarmanalysis-model',
	'../view/history-alarm-view',
	'pubsub',
	'new-player',
	'base.self',
	'thickbox'
], function(globalVar, ajaxService, historyView, PubSub) {
	var HistoryAlarm = new Class({
		Implements: [Events, Options],
		player: null, //播放器
		options: {
			template: null,
			itemsPerPage: 10,
			setPagination: jQuery.noop
		},
		initialize: function(options) {
			var self = this;
			this.setOptions(options);
			//初始化模板
			historyView.initTemp();
			//订阅事件
			PubSub.subscribe("getHistoryDate", function(message, data){self.getHistoryDate(message, data);});
			PubSub.subscribe("getDetails", function(message, data){self.getDetails(message, data);});
			PubSub.subscribe("playCameraHistory", function(message, data){self.playCameraHistory(message, data);});
			PubSub.subscribe("hideVideoFrame", function(){self.hideVideoFrame();});
		},
		/**
		 * 点击列表栏可以展开查看单个报警详情
		 */
		getDetails: function(msg, data) {
			var tbody = data.tbody,
				data = data.data;
			var self = this,
				id = data.id;
			ajaxService.ajaxEvent.getSingleAlarm(data, null, function(res) { //success
				if (res.code === 200) {
					//判断报警类型（不同报警类型加载的模板不一样）
					if (data.eventtype === 134217728) { //人员布控（人脸比对）
						tbody.find(".table_lists_details").html(self.options.template({
							alarmDetails: res.data.event
						}));
						window.thickbox();
						historyView.bindPersonEvents();
						tbody.find(".icon_look_details .imgList .imgWraper:first-child img").click();
					} else if (data.eventtype === 33554432) { //手动报警的渲染  By wangxiaojun 2014-10-30
						tbody.find(".table_lists_details").html(self.options.template({
							handAlarmDetails: res.data.event
						}));
						globalVar.histNewimplent(res.data.event);
						//window.thickbox();
					} else { //其他布防类型
						tbody.find(".table_lists_details").html(self.options.template({
							otherAlarmDetails: res.data.event
						}));
						globalVar.histNewimplent(res.data.event);
						//window.thickbox();
					}
				} else if (res.code === 500) {
					notify.warn(res.data.message);
				} else {
					notify.error("获取报警详情异常！")
				}
			}, function() { //error
				notify.error("取报警详情失败，请查看网络状况！");
			});
		},
		//历史调阅事件
		playCameraHistory: function(msg, data) {
			var self = this;
			//根据id读取摄像机信息
			var cameraData = {
				cameraid: data.cameraId,
				alarmid: data.id,
				playtype: "历史调阅",
				name: data.name,
				cameracode: data.code,
				time: data.time
			};
			//加载播放层
			jQuery(".video-play-frame").html(self.options.template({
				data: cameraData,
				videoplay: true
			}));

			
			//显示视频播放层
			self.showVideoFrame(cameraData);
		},
		//显示视频播放层
		showVideoFrame: function(dataEx) {
			var self = this;
			//先隐藏
			jQuery(".video-play-frame").hide();
			//显示视频播放层
			jQuery(".video-play-frame").css({
				left: jQuery("#major").offset().left,
				top: jQuery("#major").offset().top,
				width: jQuery("#major").width() + "px",
				height: jQuery("#major").height() + "px"
			}).show();
			if (window.checkPlayer && window.checkPlayer()) {
				return;
			}
			//释放播放器
			self.clearVideoInfo();
			//初始化播放器
			if (!self.videoPlayerSigle) {
				self.videoPlayerSigle = new VideoPlayer({
					layout: 1,
					uiocx: 'UIOCX_HIS'
				});
			}
			//获取录像信息
			ajaxService.ajaxEvent.getCameraInf(dataEx, null, function(res) { //success
				if (res.code === 200) {
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
					self.getDepthAndPlay(params, begintime, endtime, data);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("获取摄像机通道信息失败！错误码：" + res.code);
				}
			}, function() { //error
				notify.error("获取摄像机通道信息失败，服务器或网络异常！");
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
			var param = {
				channel_id: params.cameraChannelId,
				begin_time: begintime,
				end_time: endtime
			}
			ajaxService.ajaxEvent.getHisDepth(param, null, function(res) { //success
				if (res.code === 200 && res.data.videos) {
					if (res.data.videos.length === 0) {
						notify.info("此摄像机没有这个时间段的录像！");
						return false;
					}
					var vodType = parseInt(res.data.videos[0][2]);
					self.videoPlayerSigle.playHis(0, begintime, endtime, vodType, data, function () {});
					//兼容浏览器的回调，关闭播放窗口 by wangxiaojun 2014-12-31
					try {
						if (self.videoPlayerSigle.removeEventListener) {
							self.videoPlayerSigle.removeEventListener("PlayBackStartOrEnd", self.playHisCallBack, true);
						} else {
							//ie
							self.videoPlayerSigle.detachEvent("OnPlayBackStartOrEnd", self.playHisCallBack);
						}
					} catch (e) {
					}
					//绑定
					self.videoPlayerSigle.addEvent("playendback", self.playHisCallBack);
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
			}, function() { //error
				notify.error("获取录像深度失败，服务器或网络异常！");
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
				jQuery(".video-play-frame .video-win-close").trigger("click");
				//录像播放完毕的提示
				notify.info("录像播放完毕！");
			}
		},
		//隐藏视频播放层
		hideVideoFrame: function() {
			var self = this;
			//关闭视频流
			self.clearVideoInfo();
			//隐藏视频播放层
			jQuery(".video-play-frame").hide();
		},
		/**
		 * 清除播放器相关
		 */
		clearVideoInfo: function() {
			var me = this;
			if (me.videoPlayerSigle) {
				//me.videoPlayerSigle.stop(false, 0);
			 	me.videoPlayerSigle.playerObj.Stop(false, 0);
				me.videoPlayerSigle = null;
			}
		},
		/**
		 * lw
		 * 填充历史报警模板
		 */
		//获取历史报警填充模板(major部分所有内容)
		getHistoryDate: function(msg, data) {
			/*type, id, recursion, startTime, endTime, alarmType, dealStatus, isSearch*/
			var self = this;
			var formR = data.isRight;
			if (!data.isSearch) {
				//渲染条件选择栏
				var html = self.options.template({
					"historyList": true
				});
				jQuery("#historySearch").html(html);
				
				var startTime = Toolkit.getCurDate()+" 00:00:00",
					endTime  = Toolkit.getCurDateTime();
				jQuery("#historySearch .begin-time.input-time").val(startTime);
				jQuery("#historySearch .end-time.input-time").val(endTime);
				data.startTime = startTime;
				data.endTime = endTime;
			}
			//渲染面包屑
			var html = self.options.template({
				"historyBread" : globalVar.treeSteps
			});
			jQuery("#historySearch .breadcrumb").html(html);
			
			permission.reShow();
			var param = {
				resourceType: (data.type === "true") ? 2 : 1,
				id: data.id,
				recursion: data.recursion,
				startTime: data.startTime,
				endTime: data.endTime,
				eventType: data.alarmType,
				dealStatus: data.dealStatus,
				currentPage: 1,
				pageSize: self.options.itemsPerPage
			};
			ajaxService.ajaxEvent.getHisList(param, function() { //beforeSend
				jQuery("#historyTable").html("<div class='loading'></div>");
				jQuery("#historySearch .pagepart").hide();
				if(!data.isSearch){
					jQuery("#countDetial .countList").html("<div class='loading'></div>");
				}
			}, function(tem) { //success
				if (tem.code === 200) {
					globalVar.hisCount = tem.data.count;
					if(!data.isSearch){
						ajaxService.ajaxEvent.getHisStat(param, function(countRes) {
							if (countRes.code === 200) {
								countRes.data.countByEventType = countRes.data.countByEventType || [];
								return self.getCountListDetial(countRes.data, param);
							}

							notify.error("获取历史报警总数失败！");
						}, function() {
							notify.error("获取历史报警总数失败！");
						});
						
					}
					//eventType与eventTypeName转化
					if (tem.data.events.length) {
						for (var i = 0; i < tem.data.events.length; i++) {
							tem.data.events[i].eventTypeName = globalVar.getEventTypeName(tem.data.events[i].eventType);
						}
					}
					//渲染内容
					if (tem.data.count === 0) {
						jQuery("#historySearch .pagepart").hide();
						jQuery("#historySearch .table_lists_wrap #historyTable").html('<span class="none">此机构下没有相关历史报警信息</span>');
					} else if (tem.data.count > 0 && tem.data.total === 1) {
						jQuery("#historySearch .pagepart").hide();
						jQuery("#historySearch .table_lists_wrap #historyTable").html(self.options.template({
							"historySearchItems": {
								historySearch: tem.data.events
							}
						}));
					} else {
						jQuery("#historySearch .pagepart").show();
						html = self.options.template({
							"pagebar": true
						});
						jQuery("#historySearch .pagepart").html(html);
						//eventType与eventTypeName转化
						if (tem.data.events.length) {
							for (var i = 0; i < tem.data.events.length; i++) {
								tem.data.events[i].eventTypeName = globalVar.getEventTypeName(tem.data.events[i].eventType);
							}
						}
						jQuery("#historySearch .table_lists_wrap #historyTable").html(self.options.template({
							historySearchItems: {
								historySearch: tem.data.events
							}
						}));
						//渲染分页
						globalVar.setPagination(tem.data.count, "#historySearch .pagination", self.options.itemsPerPage, function(nextPage) {
							// TODO  分页回调函数
							param.currentPage = nextPage;
							ajaxService.ajaxEvent.getHisList(param, null, function(res) {
								if (res.code === 200 && res.data.events) {
									//eventType与eventTypeName转化
									if (res.data.events.length) {
										for (var i = 0; i < res.data.events.length; i++) {
											res.data.events[i].eventTypeName = globalVar.getEventTypeName(res.data.events[i].eventType);
										}
									}
									jQuery("#historySearch .table_lists_wrap #historyTable").html(self.options.template({
										historySearchItems: {
											historySearch: res.data.events
										}
									}));
								} else {
									notify.warn("服务器或网络异常！");
								}
							});
						});
					}
					//绑定事件
					historyView.bindHistory();
				} else if (tem.code === 500) {
					notify.warn(tem.data.message);
				} else {
					notify.error("获取历史报警数据失败！");
				}
				if (data.isSearch) {
					logDict.insertMedialog("m9", "查询历史报警信息", "f11", "o17"); //加日志
				};
			}, function() { //error
				notify.error("获取历史报警数据失败，请检查网络！");
			});
		},
		getCountListDetial:function(data,param){
			var self = this,html ="",lastColorIndex="",cloneArray=[];
			var color =[{
				barColor:"#87CEEE",
				ProColor:"#4169E1"
			},{
				barColor:"#bdfc99",
				ProColor:"#308014"
			},{
				barColor:"#dda0dd",
				ProColor:"#9933fa"
			},{
				barColor:"#ffc0cb",
				ProColor:"#ff00ff"
			},{
				barColor:"#c0c0c0",
				ProColor:"#808a87"
			},{
				barColor:"#ffe384",
				ProColor:"#ffd700"
			},{
				barColor:"#7fffd4",
				ProColor:"#40e0d0"
			}];
			if(data){
				cloneArray =Array.clone(color);
				$.each(data.countByEventType,function(index,item){
					var currIndex=Math.floor(Math.random()*cloneArray.length);
					var colors = cloneArray[currIndex];
					cloneArray.splice(currIndex,1);
					if(cloneArray.length<=0){
						cloneArray = Array.clone(color);
					}
					$.extend(true,item,{color:colors,id:param.id,type:param.resourceType});
				});
				html = self.options.template({
					alarmCountList: true,
					alarmListDetail: data.countByEventType
				});
				jQuery("#countDetial .countList").html(html)
				if(data.countByEventType.length===0){
					jQuery("#countDetial .countList ").find("li:first-child").after("<p class='style-text-info txtCenter'>暂无报警任务统计数据！</p>")
				}
				
			}
		},
		bindHistory: function() {
			historyView.bindHistory();
		}
	});
	return {
		HistoryAlarm: HistoryAlarm
	}
});