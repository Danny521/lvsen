/*
 ** 重构布防布控 by Leon.z
 */
define([
	'../global-varibale',
	'pubsub',
	'../screen',
	'../controller/common-fun-deal'
], function(global, PubSub, screenView, commonDeal) {
	var commonView = function() {
		var self = this;
	};
	commonView.prototype = {
		//初始化
		init: function() {
			var self = this;
			self.bindEvent();
		},
		//添加助手
		registerHelper: function() {
			var self = this;
			//判断地点（手动报警需要）
			Handlebars.registerHelper("fliterPlace", function(type, options) {
				if (type === 33554432) {
					return options.fn(this);
				}
			});
			//过滤报警事件类型，用来区分是布防还是布控
			Handlebars.registerHelper("FilterAlarmType", function(type, dataType, options) {
				if (type === 134217728) {
					//布控
					return (dataType === "value") ? 2 : "布控级别";
				} else {
					//布防
					return (dataType === "value") ? 1 : "报警级别";
				}
			});
			//根据报警事件信息的不同字段进行逻辑适配
			Handlebars.registerHelper("FilterAlarmDetails", function(value, param, type, options) {
				if (param === "level") {
					//报警等级
					if (type === "class") {
						return (value === 1) ? "level-one" : (value === 2) ? "level-two" : "level-thr";
					} else {
						return (value === 1) ? "一般" : (value === 2) ? "重要" : "严重";
					}
				} else if (param === "status") {
					//报警处理状态
					if (type === "class") {
						return (value === 0) ? "status-undone" : "status-done";
					} else {
						return (value === 1) ? "有效" : (value === 2) ? "无效" : (value === 3) ? "未知" : "未处理";
					}
				} else if (param === "address") {
					//报警地点
					if (value === 33554432) {
						return options.fn(this);
					}
				} else if (param === "absTime") {
					//报警时间
					return Toolkit.mills2datetime(value);

				} else if (param === "eventType") {
					//报警时间
					return global.getRuleName(value);
				}
			});
			//返回图片列表的第一张图
			Handlebars.registerHelper("list1", function(arr) {
				if (arr === null || arr[0] === "" || arr.length === 0) {
					return "/module/common/images/nopic.jpg";
				} else {
					return arr[0];
				}
			});
			//根据算法事件是否开启显示图标样式
			Handlebars.registerHelper("FilterRuleListCheck", function(selectInfo, curType) {
				if (jQuery.trim(selectInfo) !== "") {
					var selectArr = selectInfo.substring(0, selectInfo.length - 1).split(",");
					for (var i = 0; i < selectArr.length; i++) {
						if (parseInt(selectArr[i]) === curType) {
							return "checkbox_ctrl_active";
						}
					}
				}
				return "";
			});
			//过滤时间
			Handlebars.registerHelper("TimeFilter", function(value) {
				return Toolkit.mills2datetime(value);
			});
			//判断是否人数统计、车流统计，叠加当前计数
			Handlebars.registerHelper("CheckCalculateNum", function(num, options) {
				if (num >= 0) {
					return options.fn(this);
				}
			});

			//过滤布控报警处理图片的处理状态
			Handlebars.registerHelper("rightORwrong", function(num) {
				if (num === 0) {
					return "";
				} else if (num === 1) {
					return "right";
				} else if (num === 2) {
					return "wrong";
				} else if (num === 3) {
					return "unknow";
				}
			});
			//过滤布控报警候选人列表中分值的颜色
			Handlebars.registerHelper("ScoreColor", function(index) {
				if (index === 0) {
					return "first";
				} else if (index === 1) {
					return "second";
				} else {
					return "";
				}
			});
			// 显示摄像机的播放状态
			Handlebars.registerHelper("changeCameraIcon", function(id, type) {
				var curScreenObj = {};
				global.curScreenCameraIds.forEach(function(item) {
					item && (curScreenObj[item.type + item.cId] = true);
				});

				if (curScreenObj[type + id]) {
					return "active";
				}

				return "";
			});
			//布防任务列表的颜色
			Handlebars.registerHelper("isgrey", function(status) {
				if (status === "0" || status === 0) {
					return "grey";
				} else if (status === "1" || status === 1) {
					return "";
				}
			});
			//布防任务列表的开器状态
			Handlebars.registerHelper("isRun", function(enable) {
				if (enable === "0" || enable === 0) {
					return new Handlebars.SafeString('<i class="icon-run" title="开启任务" data-type="run"></i>');
				} else if (enable === "1" || enable === 1) {
					return new Handlebars.SafeString('<i class="icon-pause" title="暂停任务" data-type="pause"></i>');
				}
			});

		},

		activePanel: function(obj) {
			obj.addClass('active').siblings().removeClass("active");
			obj.attr("data-focus", true).siblings().removeAttr("data-focus");
		},
		bindEvent: function() {
			var self = this;
			jQuery(document).on("click", '#defenceTaskList .defenceTool i', function(e) {
				var types = jQuery(this).attr("data-type"),
					node = jQuery(this),
					opt = {
						cameraId: jQuery(this).closest("li").attr("data-cameraId"),
						taskName: jQuery(this).closest("li").attr("data-taskName"),
						params: jQuery(this).closest("li").attr("data-param"),
						taskId: jQuery(this).closest("li").attr("data-taskid"),
					};
				switch (types) {
					case "playThis":
						self.playCurrentVideo(opt, 'defenceTask', node);
						break;
					case "edit":
						commonDeal.defenceTaskEdit(opt);
						break;
					case "delete":
						commonDeal.defenceTaskRemove(opt.cameraId, node);
						break;
					case "set":
						commonDeal.setTaskStatus(opt, node);
						break;
				}

			});
			jQuery(document).off("dblclick", "#defenceTaskList .defence-list-item").on("dblclick", '#defenceTaskList .defence-list-item', function(e) {
				jQuery(this).find(".icon-playThis").trigger("click");
				return false;
			});
			jQuery(document).on("click", '#controlTaskList .ctrTool i', function(e) {
				e.stopPropagation();
				var types = jQuery(this).attr("data-type");
				var id = jQuery(this).closest('li').attr("data-taskid");
				switch (types) {
					case "edit":
						commonDeal.controlTaskEdit(id);
						break;
					case "delete":
						commonDeal.controlTaskRemove(id, jQuery(this).closest('li'));
						break;
					case "restore":
						commonDeal.controlTaskRestoreCancle(jQuery(this).closest('li'));
						break;
					case "cancle":
						commonDeal.controlTaskRestoreCancle(jQuery(this).closest('li'));
						break;
				}

			});
			jQuery(document).on("click", '#aside .defence-add-panel .addTask', function(e) {
				e.preventDefault();
				commonDeal.denfenceTaskBuld();

			});
			jQuery(document).on("click", '#aside .control-add-panel .addTask', function(e) {
				e.preventDefault();
				commonDeal.ctrTaskBuld();
			});
			//点击布控摄像机列表
			jQuery(document).on("click", '#controlTaskList .control-list-item ul.cameraList li .icon-playThis', function(e) {
				jQuery(this).closest("li").trigger('dblclick');
				return false;
			});
			jQuery(document).on("click", '#controlTaskList .control-list-item ul.cameraList li', function(e) {
				return false;
			});
			jQuery(document).on("dblclick", '#controlTaskList .control-list-item ul.cameraList li', function(e) {
				e.stopPropagation();
				e.preventDefault();
				var cameId = jQuery(this).attr("data-cameraId");
				var data = {
					cameraId: cameId,
					top: jQuery(this).attr("data-top"),
					left: jQuery(this).attr("data-left"),
					right: jQuery(this).attr("data-right"),
					bottom: jQuery(this).attr("data-bottom")
				}
				global.contrlTask = data;
				self.playCurrentVideo(data, 'contrlTask', jQuery(this).find("i.icon-playThis"));
			});
			jQuery(document).on("click", '#taskSelect', function(e) {
				e.stopPropagation();
				var CMID = jQuery(this).attr("data-cameraid");
				var cindex = jQuery(this).attr("data-cindex");
				if (global.curScreenCameraIds[cindex] && global.curScreenCameraIds[cindex].type === "defenceTask") {
					PubSub.publish("toDealTaskPartOther", {
						cameraId: CMID
					});
				} else if (global.curScreenCameraIds[cindex] && global.curScreenCameraIds[cindex].type === "contrlTask") {
					notify.warn("此摄像机只有一个布控任务");
					return;
					//PubSub.publish("toDealCtrTaskPart",global.contrlTask);
				}
			});
			//单个布防任务列表除法算法框线
			jQuery(document).on("click", '#taskContent li', function(e) {
				e.stopPropagation();
				var CMID = jQuery(this).attr("data-cameraid");
				var name = jQuery(this).text();
				var taskdata = jQuery(this).attr("data-taskdata");
				var index = jQuery("#taskSelect").attr("data-cindex");
				//将当前的布控任务名扩充进去
				if (global.curScreenCameraIds[index].selcetMode) {
					global.curScreenCameraIds[index].selcetMode = null;
				}
				$.extend(global.curScreenCameraIds[index], {
					selcetMode: name
				});

				jQuery("#taskSelect").text(name);
				jQuery("#taskPart").hide(200);
				jQuery("#taskContent").hide(200);
				PubSub.publish("toDealDefenceTask", {
					cameraId: CMID,
					taskData: taskdata
				});

			});
			//点击批量时，出现批量选项
			jQuery(document).on("click", "#aside .defence-add-panel .controllAllTask", function(e) {
				if (jQuery("#setPanel").is(":visible")) {
					jQuery("#setPanel").hide();
				}
				e.stopPropagation();
				jQuery(this).toggleClass("active").find('.ctrStyle').slideToggle(100);

			});
			//点击批量暂停
			jQuery(document).on("click", "#aside .defence-add-panel .ctrStyle i", function(e) {
				e.stopPropagation();
				if (jQuery("#setPanel").is(":visible")) {
					jQuery("#setPanel").hide();
				}
				var type = jQuery(this).attr("data-type"),
					currNode = jQuery(this),
					params;
				params = {
					"type": type,
					"currNode": currNode,
				};
				commonDeal.toggleAllTaskStatus(params, function() {
					jQuery('.ctrStyle').slideToggle(100);
					jQuery("#aside .defence-add-panel .controllAllTask").toggleClass("active");
				});
			});
			//点击单个任务事件
			jQuery(document).on("click", "#setPanel .TasklistPanel li i", function(e) {
				e.stopPropagation();
				var eveType = jQuery(this).attr("data-type"),
					opts = {
						taskId: jQuery(this).closest('li').attr("data-taskid"),
						cameraId: jQuery(this).closest('li').attr("data-cameraid"),
						taskName: jQuery(this).closest('li').find(".paneltitle ").text(),
						enableTask: parseInt(jQuery(this).closest('li').attr("data-enable")) === 1 ? 0 : 1
					};
				switch (eveType) {
					case "run":
						commonDeal.changeTaskByCid(opts, jQuery(this));
						break;
					case "pause":
						commonDeal.changeTaskByCid(opts, jQuery(this));
						break;
					case "remove":
						commonDeal.innerTaskremoveByCid(opts, jQuery(this));
						break;

				}
			});
			jQuery(document).on("click", function(e) {
				if (jQuery("#setPanel").is(":visible")) {
					jQuery("#setPanel").hide();
					jQuery("#defenceTaskList li.defence-list-item").find(".defenceTool").removeClass("active");
				}
			});

			jQuery(document).on("mouseenter mouseleave","#defenceTaskList li",function(e){
				var isActive = jQuery(this).hasClass("active"),istoolLive = jQuery("#setPanel").is(":visible");
				if(e.type==="mouseenter"){
					jQuery("#defenceTaskList li.defence-list-item").find(".defenceTool").removeClass("active");
					jQuery("#setPanel").hide();
				}
			});
			jQuery(document).on("mouseleave","#setPanel",function(e){
					jQuery("#defenceTaskList li.defence-list-item").find(".defenceTool").removeClass("active");
					jQuery("#setPanel").hide();
			});
		},
		playCurrentVideo: function(opt, type, node) {
			screenView.relaodVedio();
			//如果双击列表判断是否有查看实时视频权限，没有的话return
			if(node.hasClass('permissionHidden')){
				return;
			}
			var self = this;
			var comrightCtr= require('./js/controller/common-alarmRight-controller');
			comrightCtr.hideVideoFrame(1);
			if (type === "defenceTask") {
				screenView.sendPlayData(opt.cameraId, type,function(){
					self.changeCameraIcon("defence");
				},function() {
					PubSub.publish("toDealTaskPart", opt); //触发布防后续操作
					
				});
			}
			if (type === "contrlTask") {
				screenView.sendPlayData(opt.cameraId, type,function(){
					self.changeCameraIcon("contrl");
				},function() {
					PubSub.publish("toDealCtrTaskPart", opt); //触发布控后续操作
					
				});
			}
		},
		//重新适应布防任务弹出层高度
		resizeTaskP: function() {
			var currH = jQuery("#taskContent").height() - 0;
			jQuery("#taskPart").height(currH - 5);

			jQuery("#taskPart").slideToggle(200);
			jQuery("#taskContent").slideToggle(200);


		},
		changeWrapper: function(callback) {
			jQuery('#major').attr("data-currPart", "map");
			jQuery("#mapId").css({
				"z-index": 0,
				display: "block"
			});
			jQuery("#ocxPanel").addClass('indetify');
			if (typeof callback === "function") {
				callback && callback();
			}
		},
		showChangeLayout: function(callback) {
			screenView.relaodVedio();
			PubSub.publish("closeInfoWindow", {});
			jQuery('#major').attr("data-currPart", "ocx");
			jQuery("#mapId").css({
				"z-index": -100,
				display: "none"
			});
			jQuery("#ocxPanel").removeClass('indetify');
			// console.log(screenView.screenPlayer.cameraData[0])
			// // if(screenView.screenPlayer.cameraData[0]===-1){
			// // 	notify.warn("摄像机正在初始化，请稍后再试...");
			// // 	return;
			// // }
			if (typeof callback === "function") {
				setTimeout(function(){
					callback && callback();
				},200);
			}
		},
		/**
		 * [showOcxIfirme  显示视频播放层]
		 * @author Leon.z
		 * @date   2015-9-17
		 */
		showOcxIfirme: function() {
			var self = this;
			jQuery(".video-play-frame-new").css({
				left: jQuery("#major").offset().left,
				top: jQuery("#major").offset().top,
				width: jQuery("#major").width() + "px",
				height: jQuery("#major").height() + "px"
			}).show();
			var currH = jQuery("#major").height()-40;
			jQuery(".video-down").css("height",currH+"px");
			jQuery(".video-down #UIOCX_HIS").css("height",currH+"px");
		    if(jQuery('#major').attr("data-currPart")==="ocx"){
			 	jQuery("#UIOCX").css({
			 		"position":"absolute",
			 		"left":"-99999999px"
			 	});
		    }
		},
		/**
		 * [checkImg 查看大图]
		 * @author Wang Xiaojun
		 * @date   2014-12-17
		 */
		checkImg: function(cadidataInf, data, index) {
			//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
			window.top.showHideNav("hide");
			jQuery(".alarm-list-dialog.show_event_pic").html(global.compiler({
				checkAimPerson: true,
				data: data
			}));
			// 这里隐藏是防止resizeImg之后图片闪动，resize之后再显示出来
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
			};
			//弹出遮罩层
			jQuery(".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog").removeClass("hidden");
			//初始化弹出框的位置
			jQuery(".alarm-list-dialog").css({
				left: ($(window).width() - 825) / 2,
				top: ($(window).height() - 580) / 2,
				width: 825,
				height: 580
			});
			jQuery(".icon_close").fadeIn();
			$('.pop_pic').find('img').load(function() {
				resizeImg($('.pop_pic'));
			});
			//工具条的选择状态初始化(有效1，无效2，未知3)
			var status = parseInt(cadidataInf[index].handlestatus === "" ? 0 : cadidataInf[index].handlestatus);
			if (status !== 0) {
				jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
				jQuery(".alarm-list-dialog .pop_bottom .toolsBar i:nth-of-type(" + status + ")").addClass("active");
			} else if (status === 0) {
				jQuery(".alarm-list-dialog .pop_bottom .toolsBar i").removeClass("active");
			}


		},
		/**
		 * 点放大查看图片（在地图上查看布防时和点击左侧图片时用）暂时已经废弃
		 */
		checkBiggerPic: function(This, carPeopleNum) {
			//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
			window.top.showHideNav("hide");
			//加载弹出层
			jQuery(".alarm-list-dialog.show_event_pic").html(global.compiler({
				checkAlarmImage: true,
				carPeopleNum: carPeopleNum
			}));
			jQuery(".icon_close").fadeIn();
			var imgObj = This.clone();
			//显示图片
			jQuery(".show_event_pic .pic_content").empty().append(imgObj);
			//弹出遮罩层
			jQuery(".checkAlarm_layout, .checkAlarm_layout_ifr, .alarm-list-dialog").removeClass("hidden");
			//设置遮罩层的位置
			var imgholder = jQuery(".show_event_pic img");
			var toolbar = jQuery(".toolbar");
			var imgs = new Image();
			imgs.onload = function(e) {
				var iw = e.target.width;
				var ih = e.target.height;
				if (ih >= $(window).height() - 100 || iw > $(window).width() - 100) {

					var limitInfo = global.maxImgLimit(imgholder, 0.6, 0.7);
					jQuery(".alarm-list-dialog").css({
						width: limitInfo.width + "px",
						height: limitInfo.height + "px"
					});
					imgholder.attr({
						width: limitInfo.width,
						height: limitInfo.height
					});
				} else {
					imgholder.attr({
						width: iw,
						height: ih
					});

				}
				//初始化弹出框的位置

				var orLeft = ($(window).width() / 2) - (imgholder.width() + 8) / 2,
					orTop = ($(window).height() / 2) - (imgholder.height() + 8) / 2;
				jQuery(".alarm-list-dialog").css({
					width: imgholder.width(),
					height: imgholder.height(),
					left: orLeft + "px",
					top: orTop + "px"
				}).attr({
					"data-left": orLeft,
					"data-top": orTop,
					"data-width": imgholder.width(),
					"data-height": imgholder.height()
				});
				jQuery(".toolbar").css({
					left: ($(window).width() / 2) - (toolbar.width()) / 2,
					bottom: 0

				}).show();

			};
			imgs.src = imgholder.attr("src");
			//对图片放大进行限制
		},
		changeCameraIcon: function(taskType) {
			if (!taskType) {
				return jQuery("span.camera-img").removeClass("active");
			}

			var $list = taskType === "defence" ? jQuery("#defenceTaskList") : jQuery("#controlTaskList"),
				$camreas = $list.find(taskType === "defence" ? ".defence-list-item" : ".camerList-item"),
				curScreenObj = {};

			global.curScreenCameraIds.forEach(function(item, index) {
				item && (curScreenObj[item.type + item.cId] = true);
			});

			$camreas.each(function() {
				var id = jQuery(this).attr("data-cameraid"),
					type = jQuery(this).attr("data-task-type");

				if (curScreenObj[type + id]) {
					jQuery(this).find("span.camera-img").addClass("active");
				} else {
					jQuery(this).find("span.camera-img").removeClass("active");
				}
			});
		}
	};
	return new commonView();
});