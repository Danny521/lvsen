/*global jQuery:true, logDict:true, typeOf:true, permission:true, window:true*/
/**
 * Created by Mayue on 2014/12/9.
 */
define([
	"js/pubsub",
	"js/videowatch-view",
	"js/videowatch-module",
	"pubsub",
	"/module/inspect/monitor/js/inspect.js",
	"underscore",
	"jquery",
	"mootools"
],function(Pb, VideowatchView, Module, Pubsub, Inspect, _){

	"use strict";

	var sPubSub;
	var View;
	var inspect;
	var watchidGlob;
	var timegroupidGlob;
	var gName;	
	var VideoWatch = function(ocx, tree){
		var self = this;
		//初始化
		self.init(ocx, tree);
		//注册消息订阅
		sPubSub.regist({
			//初始化渲染监巡分组列表
			"initGroupsView": self.getAllGroupDate,
			//编辑/添加监巡分组后的列表刷新
			"initGroupsNew": self.getAlLDate,
			//删除监巡分组
			"deleteGroup": self.deleteGroup,
			//添加监巡分组【左侧面板】
			"NewAddInspect": self.addNewInspectNew,
			//添加监巡分组【视频画面工具栏中快捷添加】
			"addInspect": self.addNewInspect,
			//监巡分组输入框失去焦点后，检测分组是否重名
			"verifyGroupName": self.verifyGroupName,
			//启动或者暂停监巡分组
			"startOrPauseInspect": self.startOrPauseInspect,
			//停止监巡事件
			"stopInspect": self.stopInspect,
			//订阅创建时间段
			"createGroup": self.createGroup,
			//编辑监巡分组时触发播放布局及播放
			"editorInspect": self.editorInspect,
			//监巡分组树选择摄像机结束后触发播放
			"playCamerasAll": self.playCamerasAll
		});
		// 判断摄像机类型、和是否可用
		Handlebars.registerHelper("isBall", function (val) {
			return val === 0 ? "shoot" : "ball";
		});
	};
	VideoWatch.prototype = {
		player: null,
		illegalCharacter: /([?"*'\/\\<>:|？“”‘’^&~]|(?!\s)'\s+|\s+'(?!\s))/ig,
		curIdlePositions: [],	//当前监巡分组空闲通道
		curCamerasId: [],		//当前监巡分组的cameraid
		idlePositionsCounts: 0,	//当前监巡分组空闲的通道个数
		videoWatchList: [],		//该数据在启动监巡时使用，这样保证启动监巡的数据和当前看到的DOM是一致的。否则，如果在启动监巡时重新获取监巡分组，那时的数据很可能和当前的DOM不一致
		init: function(ocx,tree){
			var self = this;
			this.player = ocx;
			this.tree = tree;
			sPubSub = new Pb(this);
			View = new VideowatchView(sPubSub, ocx, self);
		},
		/**
		 * 初始化渲染监巡分组列表
		 */
		getAllGroupDate: function() {
			var self = this;
			jQuery(".ui.atached.menu").css("display", "block");
			//读取数据和模板
			jQuery.when(Module.getAllGroup()).done(function (res) {
				if (res.code === 200) {
					for (var i = 0, len = res.data.watchs.length; i < len; i++) {
						View.sortPosition(res.data.watchs[i].cameras);
						res.data.watchs[i].cameras.sort(function (e, f) {
							return e.position - f.position;
						});
					}
					res.data.watchs = res.data.watchs.reverse();
					self.videoWatchList = res.data.watchs;
					View.renderAllGroup(self.formatGroupTime(res.data));
					var num = res.data.watchs.length;
					//初始化分组数目，和休闲模式的显示和隐藏 add by wujingwen 2015.09.18
					if (res.data.watchs.length) {
						jQuery(".no-data").html("共<em class='monitor-group-count'>" + num + "</em>个分组");
						jQuery(".grade").show();
					}
					else {
						jQuery(".no-data").html("暂无监巡分组");
						jQuery(".grade").hide();
					}
				} else {
					notify.warn(res.message);
				}
			});
		},
		/**
		 * 左侧面板添加完监巡分组后刷新分组处理程序
		 */
		getAlLDate: function(){
			var self = this;
			jQuery.when(Module.getAllGroup()).done(function(res) {
				if (res.code === 200) {
					var watchArray = res.data.watchs;
					var watchIndex;
					for (var i = 0; i < watchArray.length; i++) {
						if (watchArray[i].groupName === gName) {
							watchIndex = i;
							gName = null;
							break;
						}
					}
					if (watchIndex === undefined) {
						return;
					}
					watchidGlob = watchArray[watchIndex].id;
					if (watchArray[watchIndex].times.length !== 0) {
						timegroupidGlob = watchArray[watchIndex].times[0].id;
						if (watchidGlob) {
							self.checkTimeDepthNew();
						}
					}
				} else {
					notify.warn(res.message);
				}
			});
		},
		/**
		 * 删除一个监巡组
		 * @param node - 响应删除事件的dom对象
		 */
		deleteGroup:function(node) {
			var watchId = node.data("id"),
				name = node.siblings(".name").text();
			//触发监巡分组的删除请求
			jQuery.when(Module.deleteGroup(watchId)).done(function (res) {
				if (res && res.code === 200) {
					//提示成功
					notify.success("删除监巡分组成功！");
					//回调更新页面渲染
					View.deleteGroupCallBack(node);
					//写入日志
					logDict.insertLog("m1", "f1", "o3", "b2", name);
				} else {
					notify.info("删除失败，请重试！");
				}
			});
		},
		/**
		 * 增加时间段 模版加载add by wujingewn on 2015.10.12
		 * @param data - 当前添加的事件片段
		 */
		createGroup: function(data) {
			View.renderCreatGroup({
				times: [
					{
						startTime: data.startTime,
						endTime: data.endTime,
						level: jQuery(".addlevel").val()
					}
				]
			});
		},
		/**
		 * 处理监巡分组中的时间参数，根据毫秒时间，返回标准时间
		 * @param obj
		 * @returns {*}
		 */
		formatGroupTime: function(obj) {
			var watchs = obj.watchs,
				watchsLen = watchs.length,
				times, timesLen, timesJ, startTime, endTime, startTimeISO, endTimeISO;

			for (var i = 0; i < watchsLen; i++) {
				times = watchs[i].times;
				timesLen = times.length;

				for (var j = 0; j < timesLen; j++) {
					timesJ = times[j];
					startTimeISO = new Date(timesJ.startTime);
					endTimeISO = new Date(timesJ.endTime);

					startTime = (startTimeISO.getHours() < 10 ?
						"0" + startTimeISO.getHours() : startTimeISO.getHours()) + ":" + (startTimeISO.getMinutes() < 10 ?
						"0" + startTimeISO.getMinutes() : startTimeISO.getMinutes()) ;
					endTime = (endTimeISO.getHours() < 10 ?
						"0" + endTimeISO.getHours() : endTimeISO.getHours()) + ":" + (endTimeISO.getMinutes() < 10 ?
						"0" + endTimeISO.getMinutes() : endTimeISO.getMinutes());

					timesJ.startTime = startTime;
					timesJ.endTime = endTime;
				}
			}
			return obj;
		},
		/**
		 * 编辑监巡分组，播放已有的摄像机
		 * @param data - 分组监巡分组数据信息
		 */
		editorInspect: function(data) {
			var self = this;
			//清空self.curCamerasId
			self.curCamerasId = [];
			//设置播放器布局
			self.player.setLayout(parseInt(data.layout));
			//播放摄像机
			self.playLayout(data.cameras);
		},
		/**
		 * 树选结束后播放摄像机列表
		 */
		playCamerasAll:function(){
			var self = this,
				layout = self.player.getLayout();
			//用监巡组的布局打开播放器(待定)
			self.player.setLayout(parseInt(layout));
			self.playLayout(View.cameraList);					
		},
		/**
		 * 播放监巡分组下的摄像机
		 * @param cameras - 待播放的摄像机数据
		 */
		playLayout: function(cameras) {
			var self = this;
			if (cameras.length) {
				var cData = self.formatLayoutDate(cameras);
				for (var i = 0; i < cData.length; i++) {
					var p = cData[i].position;
					if (p !== -1) {
						self.player.setFocusWindow(p);
						self.player.playSH(cData[i],p);
					}
				}
			}
		},
		/**
		 * 格式化数据，使其符合setFreePath(parm)的参数格式  返回结果是一个数组[parm1,parm2,parm3]
		 * @param cameras - 待播放的摄像机数据
		 * @returns {Array}
		 */
		formatLayoutDate: function(cameras) {
			var result = [], tem = {}, i = cameras.length;
			while (i--) {
				tem = {
					"hdChannel": cameras[i].hd_channel || cameras[i].hdchannel,
					"sdChannel": cameras[i].sd_channel || cameras[i].sdchannel,
					"cId": cameras[i].cameraId, //这个参数  主要是为了兼容之前的方式  因为很多地方都是调用这个参数
					"cName": cameras[i].cameraName || cameras[i].name,
					"cType": cameras[i].cameraType || cameras[i].cameratype,
					"cCode": cameras[i].cameraCode ? cameras[i].cameraCode : "",
					"cStatus": cameras[i].cameraStatus - 0 || cameras[i].cstatus - 0,
					"watchId": cameras[i].watchId,
					"position": cameras[i].position
				};
				result.push(Object.clone(tem));
			}
			return result;
		},
		/**
		 * 根据position对cameras排序
		 * @param arr - 待排序的数据
		 * @returns {*|Array.<T>}
		 */
		sortByPosition: function(arr) {
			var cameras = Array.clone(arr);
			return cameras.sort(function(a, b) {
				return a.position - b.position;
			});
		},
		/**
		 * 新建时间验证保存【左侧添加监巡分组】
		 * @returns {boolean}
		 */
		checkTimeDepthNew: function() {
			var watchid = watchidGlob,
				intervalTime = jQuery('.initcreate input[name="stopTime"]').val(),
				liNode = jQuery(".group .itemwrapper li"),
				liLen = liNode.length,
				times = [],
				self = this,
				intervalFlag = true,
				today = (new Date()).getFullYear() + "/" + (((new Date()).getMonth() - 0) + 1) + "/" + (new Date()).getDate() + " ";

			for (var i = 0; i < liLen; i++) {
				var dataWapp = {},
					timegroupid = timegroupidGlob;

				dataWapp.startTime = new Date(today + liNode.eq(i).find(".star").text()).getTime();
				dataWapp.endTime = new Date(today + liNode.eq(i).find(".end").text()).getTime();
				dataWapp.level = liNode.eq(i).find(".levele").text();
				dataWapp.id = timegroupid;
				if (timegroupid.length > 0) {
					dataWapp.id = i++;
				}
				times.push(dataWapp);
				if (parseInt(intervalTime, 10) * 1000 > (dataWapp.endTime - dataWapp.startTime)) {
					intervalFlag = false;
				}
			}
			if (!intervalFlag) {
				notify.error("停留时间不能大于起止时间间隔！");
				return;
			}

			jQuery.when(Module.addGroupTime(watchid, intervalTime, times)).done(function (res) {
				if (res && res.code === 200) {
					notify.success("添加成功！");
					//关闭所有视频并设置默认屏幕为4
					self.player.stopAll();
					var layout = self.player.getLayout();
					while (layout--) {
						self.player.refreshWindow(layout);
					}
					self.player.setLayout(4);
					jQuery(".patrol .search-use-for-bind-event span").trigger("click");
				} else {
					notify.info("操作失败，请重试！");
				}
			});
		},
		/**
		 * 监巡分组输入框失去焦点后，验证是否重名
		 * @param node - 输入框dom对象
		 */
		verifyGroupName: function(node) {
			var groupName = node.val().trim();
			jQuery.when(Module.verifyGroupName(groupName)).done(function (res) {
				if (res && res.code === 200) {
					if (res.data.groupKey === 1) {
						notify.error("已经存在相同监巡名称，请修改后重试！");
					}
				}
			});
		},
		/**
		 * 添加监巡分组，【视频上方的快捷方式】
		 */
		addNewInspect: function(){
			if (this.verifyParaAddInspect()) {
				this.addInspect();
			}
		},
		/**
		 * 编辑/添加监巡分组，【左侧面板】
		 */
		addNewInspectNew: function() {
			var self = this;
			if (self.verifyParaAddInspect()) {
				if (View.globId) {
					// 如果来自编辑 则要先删除该组
					var watchId = View.globId;
					if (watchId) {
						jQuery.when(Module.deleteGroup(watchId)).done(function (res) {
							if (res && res.code === 200) {
								self.addInspectNew(View.globId);
							}
						});
					}
				} else {
					self.addInspectNew(View.globId);
				}
			}
		},
		/**
		 * 添加新的新的监巡分组时校验参数信息是否有效
		 * @returns {boolean}
		 */
		verifyParaAddInspect: function() {
			var self = this,
				//待检测的信息
				validateData = {};
			//根据情况获取
			if(jQuery(".function-container").is(":visible")){
				//视频上方添加监巡分组
				validateData = {
					groupName: jQuery("#addgroupName").val().trim(),
					stopTime: jQuery("#addstopTime").val().trim()
				};
			} else {
				//左侧面板添加监巡分组
				validateData = {
					groupName: jQuery(".addgroupName").val().trim(),
					stopTime: jQuery(".addstopTime").val().trim()
				};
			}
			//检查每一项是否符合要求
			for (var key in validateData) {
				if (!validateData.hasOwnProperty(key)) {
					notify.error("请正确填写表单！");
					return false;
				}
				if (key === "groupName") {
					if (validateData[key].length > 30) {
						notify.error("监巡分组名称长度不能超过30个字符！");
						jQuery("#add" + key).focus();
						return false;
					}
					if (self.illegalCharacter.test(validateData[key])) {
						notify.error("监巡分组名称不能包含特殊字符！");
						return false;
					}
				}
				if (key === "stopTime") {
					if (!(/^[1-9]{1}\d*[s秒]?$/.test(validateData[key]))) {
						notify.error("停留时间格式不正确！");
						return false;
					}

					if (parseInt(validateData[key], 10) < 10) {
						notify.error("监巡分组停留时间必须在10秒以上！");
						jQuery("#add" + key).focus();
						return false;
					}
				}
			}
			return true;
		},
		/**
		 * 添加新的监巡组ajax,【视频窗口上方的快捷方式】
		 * @returns {boolean}
		 */
		addInspect: function() {
			var layout = this.player.getLayout(),
				cameraId = [],
				self = this,
				hasVideo = false,
				today = new Date(),
				groupName = jQuery("#addgroupName").val(),
				startTime = new Date(today.getFullYear() + "/" + ((today.getMonth() - 0) + 1) + "/" + today.getDate() + " " + jQuery("#addstartTime").val()).getTime(),
				endTime = new Date(today.getFullYear() + "/" + ((today.getMonth() - 0) + 1) + "/" + today.getDate() + " " + jQuery("#addendTime").val()).getTime(),
				level = jQuery("#addlevel").val(),
				stopTime = jQuery("#addstopTime").val(),
				cameras = {
					"cameras": []
				};
			// 获取正在播放的摄像头 ID
			for (var i = 0; i < layout; i++) {
				if (self.player.cameraData[i] !== -1) {
					cameraId.push(self.player.cameraData[i].cId);
					hasVideo = true;
				} else {
					cameraId.push(-1);
				}
			}
			// 构造后端需要的数据格式
			if (hasVideo) {
				for (var j = 0; j < cameraId.length; j++) {
					if (cameraId[j] !== -1) {
						cameras.cameras.push({
							"cameraId": cameraId[j],
							"position": j
						});
					}
				}
			} else {
				notify.warn("请选择摄像头后再添加监巡分组！");
				return;
			}
			// 是否有重复摄像头
			if (self.isRepeat(cameraId)) {
				notify.info("摄像头有重复，请修正后再添加！");
				return;
			}
			//触发添加监巡分组请求
			jQuery.when(Module.addNewGroup({
				"layout": layout,
				"cameras": JSON.stringify(cameras),
				"groupName": groupName,
				"startTime": startTime,
				"endTime": endTime,
				"level": level,
				"stopTime": parseInt(stopTime, 10)
			})).done(function (data) {
				if (data && data.code === 200) {
					notify.success("添加成功！");
					//录入日志
					logDict.insertLog("m1", "f1", "o1", "b2", groupName);
					//隐藏ocx遮挡的iframe  by wangxiaojun 2015.01.22
					jQuery("#layout").hide();
					View.addNewGroupCallBack();
				} else if (data.code === 501) {
					notify.error("已经存在相同监巡名称，请修改后重试！");
				} else {
					notify.error("添加失败，请重试！");
				}
			});
		},
		/**
		 * 监巡分组新面板添加方法 add by wu jingwen
		 * @param watchId - 当前的分组id，编辑时有效
		 * @returns {boolean}
		 */
		addInspectNew: function(watchId) {
			var layout,
				today = new Date(),
				groupName = jQuery(".addgroupName").val().trim(),
				$timeSlots = jQuery(".group .itemwrapper li"),
				startTime = new Date(today.getFullYear() + "/" + ((today.getMonth() - 0) + 1) + "/" + today.getDate() + " " + $timeSlots.eq(0).find(".star").text()).getTime(),
				endTime = new Date(today.getFullYear() + "/" + ((today.getMonth() - 0) + 1) + "/" + today.getDate() + " " + $timeSlots.eq(0).find(".end").text()).getTime(),
				level = $timeSlots.eq(0).find(".levele").text(),
				stopTime = jQuery(".addstopTime").val();
			//记录当前监巡分组的名字
			gName = groupName;
			//获取当前监巡分组的布局
			var $layoutItem = jQuery(".layoutNum i");
			if ($layoutItem.hasClass("layoutFlags")) {
				layout = $layoutItem.filter(".layoutFlags").attr("data-layout");
			} else {
				//如果没有选分屏，默认是目前的。
				layout = this.player.getLayout();
			}
			//触发添加监巡分组请求
			jQuery.when(Module.addNewGroup({
				"layout": layout,
				"cameras": JSON.stringify(View.cameras),
				"groupName": groupName,
				"startTime": startTime,
				"endTime": endTime,
				"level": level,
				"stopTime": parseInt(stopTime, 10)
			})).done(function (data) {
				if (data && data.code === 200) {
					//根据不同的情况区别日志录入
					if (watchId) {
						logDict.insertLog("m1", "f1", "o2", "b2", groupName); //编辑
					} else {
						logDict.insertLog("m1", "f1", "o1", "b2", groupName); //新建
					}
					//隐藏ocx遮挡的iframe
					jQuery("#layout").hide();
					View.addGroupCallBack();
				} else if (data.code === 501) {
					if (View.cameraList) {
						return;
					}
					notify.error("已经存在相同监巡分组名称，请修改后重试！");
				} else {
					notify.error("添加失败，请重试！");
				}
			});
		},
		/**
		 * 判断一个数组中是否存在相同的元素（如果存在相同的返回true,否则返回false）
		 * 【视频窗口上方添加监巡分组时】
		 * @param array - 摄像机数组
		 * @returns {boolean}
		 */
		isRepeat: function(array) {
			if (Object.prototype.toString.call(array) !== "[object Array]") {
				notify.warn("此函数参数只接受数组！");
				return false;
			}
			var isRepeatFlag = false;
			array.sort(function(a, b) {
				if (a === b && a !== -1) {
					isRepeatFlag = true;
				}
				return a - b;
			});
			return isRepeatFlag;
		},
		/**
		 * 启动/暂停监巡分组
		 * @param node - 启动/暂停按钮dom对象
		 */
		startOrPauseInspect: function(node) {
			var self = this,
				rule = jQuery('[data-tabor="monitor-inspect"] .grade input:checked').val() - 0,
			    //监巡组
				loopData = self.getLoopData(rule);
			//根据规则进行排序【分组】
			if (rule === 3) {
				loopData = loopData.sort(function (a, b) {
					return b.id - a.id;
				});
			}
			//无监巡分组
			if (loopData.length === 0 || loopData === 0) {
				notify.warn("暂无监巡组，请先添加监巡组！");
				return;
			}
			//如果监巡分组下无摄像头
			if (loopData === 1) {
				notify.warn("监巡组都不存在摄像头，请先添加摄像头！");
				return;
			}
			if (rule) {
				//启动
				if (node.hasClass("start")) {
					var $monitorInspect = jQuery("[data-tabor='monitor-inspect']");
					$monitorInspect.find(".init-create input.creater").hide();
					// 首次启动
					if (!jQuery(".loop-header").is(":visible")) {
						//记录日志
						logDict.insertMedialog("m1", "启动监巡", "f1");
						//更新播放按钮到暂停状态
						node.removeClass("start").addClass("pause").attr("title", "暂停");
						//显示停止按钮
						$monitorInspect.find(".grade .operation .stop").show();
						//更新title,显示当前正在监巡状态
						jQuery("#sidebar-head >.menus").hide();
						jQuery("#sidebar-head >.loop-header").show();
						//配置监巡
						inspect = new Inspect({
							"player": self.player,
							"events": {
								//第一次启动时，已经在监巡组的最后时间之后
								"after": function () {
									var node = jQuery("[data-tabor='monitor-inspect'] .grade .operation .stop");
									View.stopInspectUI(node);
									notify.warn("当前时间不存在符合条件的监巡分组");
									jQuery('[data-tabor="monitor-inspect"] .group-content').removeClass("run-inspect");
								},
								//到时间后，自动退出时
								"autoExit": function () {
									var node = jQuery("[data-tabor='monitor-inspect'] .grade .operation .stop");
									View.stopInspectUI(node);
									View.showRightUpBtn();
									notify.info("轮巡结束");
									jQuery('[data-tabor="monitor-inspect"] .group-content').removeClass("run-inspect");
								},
								"inspecting": function () {
									jQuery(".body").find("#layout").hide();
								}
							}
						});
						window.ControlBar.updataInspect(inspect);
						$monitorInspect.find(".group-content").addClass("run-inspect");
						//格式化数据并启动监巡
						var tem = self.formatInspectData(loopData);
						inspect.start(tem);
						//隐藏视频播放器上方的功能按钮
						View.hideRightUpBtn();
						//显示监巡title
						jQuery("#sidebar-head >.loop-header > .loop-title").html("正在监巡中...");
					} else {
						//如有暂停,取消暂停
						View.switchInspect(true);
						self.stopAllZoom(); //如果有放大的窗口，关闭所有放大效果
						inspect.cancelPause();
					}
				} else {
					//暂停
					inspect.pause();
					View.switchInspect(false);
				}
			} else {
				notify.info("请选择监巡模式！");
			}
		},
		/**
		 * 启动轮巡主函数，获取监巡分组顺序
		 * @param rule - 规则，按分组\等级
		 * @returns {*}
		 */
		getLoopData: function(rule) {
			var cameras = this.processData();
			var result;
			if (typeOf(cameras) === "array") {
				if (rule === 1) {//等级
					var arr = Array.sort(cameras, function (a, b) {
						return b.id - a.id;
					});
					result = Array.sort(arr, function (a, b) {
						return a.level - b.level;
					});
				}
				if (rule === 2) {
					cameras.sort(this.sortBy("startTime", this.sortBy("level", this.sortBy("watchId"))));
				}
				if (rule === 3) {//分组
					result = _.sortBy(cameras, "watchId");
				}
			}
			return result;
		},
		/**
		 * 处理监巡数据 如果返回0代表监巡分组为空;
		 * 如果返回数组代表监巡分组的所有数据;
		 * @returns {number}
		 */
		processData: function() {
			var len = this.videoWatchList.length,
				times,
				timesLen,
				cameraList,
				videoWatchListItem,
				cameras = [],
				isAllEmpty = false;
			//监巡分组为空
			if (len === 0) {
				return 0;
			}
			for (var i = 0; i < len; i++) {
				videoWatchListItem = this.videoWatchList[i];
				times = videoWatchListItem.times;
				timesLen = times.length;
				cameraList = this.addIdlePosition(videoWatchListItem.cameras, videoWatchListItem.layout).slice(0);
				if (videoWatchListItem.cameras.length === 0) {
					isAllEmpty = isAllEmpty || false;
				} else {
					isAllEmpty = true;
					for (var j = 0; j < timesLen; j++) {
						var timeItem = {
							"groupName": videoWatchListItem.groupName,
							"groupNo": videoWatchListItem.groupNo,
							"watchId": videoWatchListItem.id,
							"layout": videoWatchListItem.layout,
							"interval": videoWatchListItem.stopTime,
							"cameras": cameraList
						};
						timeItem.endTime = times[j].endTime;
						timeItem.startTime = times[j].startTime;
						timeItem.level = times[j].level;
						timeItem.id = times[j].id;
						cameras.push(timeItem);
					}
				}
			}
			//监巡组存在，但是所有监巡组中都为空
			if (!isAllEmpty) {
				return 1;
			} else {
				return Array.clone(cameras);
			}
		},
		/**
		 * [addIdlePosition 向数字中添加空闲通道位置]
		 * @author Mayue
		 * @date   2015-04-23
		 * @param  {[type]}   arr    [包含position属性的对象数组]
		 * @param  {[type]}   layout [当前的播放布局]
		 */
		addIdlePosition: function(arr, layout) {
			if (typeOf(arr) !== "array") {
				return [];
			}
			var cameras = Array.clone(arr);
			var camerasPosition = this.sortByPosition(cameras);
			if (camerasPosition.length === layout) {
				return cameras;
			}
			var result = new Array(layout).repeat(-1);
			for (var k = 0; k < layout; k++) {
				for (var j = 0; j < camerasPosition.length; j++) {
					if (k === camerasPosition[j].position) {
						result[k] = camerasPosition[j];
						break;
					}
				}
			}
			cameras = result;
			return cameras;
		},
		/**
		 * 对象数组排序函数  根据type进行排序
		 * @param type - 排序类型
		 * @param fn - 回调
		 * @returns {Function}
		 */
		sortBy: function(type, fn) {
			return function(itemA, itemB) {
				var a, b;
				if (itemA && itemB && typeof itemA === "object" && typeof itemB === "object") {
					a = itemA[type];
					b = itemB[type];
					if (typeof a === typeof b) {
						if (a === b) {
							return typeof fn === "function" ? fn(itemA, itemB) : 0;
						}
						if (type === "level") {
							return b - a; //从大到小
						} else {
							return a - b; //从小到大
						}
					}
				} else {
					throw ("error");
				}
			};
		},
		/**
		 * 关闭所有放大窗口
		 */
		stopAllZoom: function() {
			var self = this;
			var i = self.player.cameraData.length;
			while (i--) {
				if (self.player.cameraData[i] !== -1) {
					self.player.stopZoom(i);
					self.player.cameraData[i].zoomType = null;
				}
			}
		},
		/**
		 * 格式监巡数据
		 * @param groups - 带格式化的监巡分组数据
		 * @returns {*}
		 */
		formatInspectData: function(groups) {
			for (var i = 0; i < groups.length; i++) {
				var group = groups[i];//每个监巡组
				var cameras = group.cameras;//这组监巡组对应的所有摄像机

				for (var j = 0; j < cameras.length; j++) {
					var camera = cameras[j];//其中一个具体的摄像机
					if (camera === -1) {
						continue;
					}
					camera.cName = camera.cameraName;
					camera.cId = camera.cameraId;
					camera.cType = camera.cameraType;
					camera.cCode = camera.cameraCode;
					camera.cStatus = camera.cameraStatus - 0;
					camera.sdChannel = camera.sd_channel;
					camera.hdChannel = camera.hd_channel;
					delete camera.cameraName;
					delete camera.id;
					delete camera.cameraType;
					delete camera.cameraCode;
					delete camera.cameraStatus;
					delete camera.sd_channel;
					delete camera.hd_channel;
					delete camera.cameraNo;
				}
			}
			return groups;
		},
		/**
		 * [stopInspect 停止轮巡]
		 * @author Mayue
		 * @date   2015-04-27
		 * @return {[type]}   [description]
		 */
		stopInspect: function() {
			//停止监巡
			inspect.stop();
			//显示按钮
			View.showRightUpBtn();
		}
	};
	return VideoWatch;
});