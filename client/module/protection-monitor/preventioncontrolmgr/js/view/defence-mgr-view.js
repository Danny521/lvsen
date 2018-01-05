/**
 * 布防任务管理view模块
 */
define([
	'/module/common/defencesetting/js/main.js',
	'js/preventcontrol-global-var',
	'js/protectcontrol-common-fun',
	'pubsub',
	'base.self',
	'permission'
], function(DefenceLogical, globalVar, ProtectCommonFun, PubSub) {
	var view = function() {};
	view.prototype = {
		//存储当前是否处于删除状态
		isShowDelTaskDialog: false,
		init: function() {
			var self = this;
			self.registerHelper();
			self.bindEvents();
		},
		//注册助手
		registerHelper: function() {

			Handlebars.registerHelper("cameraPermisson", function() {
				var edit = permission.klass["edit-defence-task"];
				if (edit) {
					return 'permission-defense-real-time-view permission-edit-defence-task';
				}
			});
			// 奇偶行
			Handlebars.registerHelper("even", function(value) {
				if (value % 2 === 0) {
					return "even";
				} else {
					return "odd";
				}
			});

			// 序号递增
			Handlebars.registerHelper("list", function(value) {
				return value + 1;
			});

			//是否布防
			Handlebars.registerHelper("isProtect", function(flag, f2) {
				if (!f2) {
					if (flag === 0 || flag === "0") {
						return "protected";
					}
					if (flag === 1 || flag === "1") {
						return "unprotected";
					}

				} else {
					if (f2 === 0 || f2 === "0") {
						return "protected";
					}
					if (f2 === 1 || f2 === "1") {
						return "unprotected";
					}
					if (f2 === -1 || f2 === "-1") {

						return "disabled"
					}
					if (f2 === -2 || f2 === "-2") {
						return "disabled"
					}
				}
			});
			//是否文字描述
			Handlebars.registerHelper("isProtectDes", function(flag, f2) {
				if (!f2) {
					if (flag === 0 || flag === "0") {
						return "已暂停";
					}
					if (flag === 1 || flag === "1") {
						return "已开启";
					}
				} else {
					if (f2 === 0 || f2 === "0") {
						return "已暂停";
					}
					if (f2 === 1 || f2 === "1") {
						return "已开始";
					}
					if (f2 === -1 || f2 === "-1") {

						return "未开始"
					}
					if (f2 === -2 || f2 === "-2") {
						return "已过期"
					}

				}
			});
			//是否布防
			Handlebars.registerHelper("NoticeInfo", function(maxCameras, maxTasks) {
				if (maxCameras !== -1 && maxTasks !== -1) {
					return "注：当前组织机构下可以设置的最大布防摄像机数不能超过" + maxCameras + "，最大布防任务数不能超过" + maxTasks + "。";
				}
				if (maxCameras === -1 && maxTasks === -1) {
					return "注：当前组织机构的设置结果将影响其下组织机构的使用，请合理分配资源。";
				}
				if (maxCameras === -1 && maxTasks !== -1) {
					return "注：当前组织机构下还未设置过最大布防摄像机数，可设置的最大布防任务数不能超过" + maxTasks + "。";
				}
				if (maxCameras !== -1 && maxTasks === -1) {
					return "注：当前组织机构下还未设置过最大布防任务数，可设置的最大布防摄像机数不能超过" + maxCameras + "，";
				}
			});
			//布防状态
			Handlebars.registerHelper("statusInfo", function(flag, f2) {
				if (!f2) {
					if (flag === 0 || flag === "0") {
						return "已暂停";
					}
					if (flag === 1 || flag === "1") {
						return "进行中";
					}
				} else {
					if (f2 === 0 || f2 === "0") {
						return "已暂停";
					}
					if (f2 === 1 || f2 === "1") {
						return "进行中";
					}
					if (f2 === -1 || f2 === "-1") {

						return "未开始"
					}
					if (f2 === -2 || f2 === "-2") {
						return "已过期"
					}

				}

			});
			Handlebars.registerHelper("actives", function(flag, f2) {
				if (!f2) {
					if (flag === 0 || flag === "0") {
						return "";
					}
					if (flag === 1 || flag === "1") {
						return "active";
					}
				} else {
					if (f2 === 0 || f2 === "0") {
						return "";
					}
					if (f2 === 1 || f2 === "1") {
						return "active";
					}
					if (f2 === -1 || f2 === "-1") {

						return ""
					}
					if (f2 === -2 || f2 === "-2") {
						return ""
					}

				}

			});
			//布防是否显示去视图库按钮
			Handlebars.registerHelper("isFaceShow", function(flag, rulename) {
				if (rulename === "实时标注") {
					if (flag === 0 || flag === "0") {
						return "";
					}
					if (flag === 1 || flag === "1") {
						return "";
					}
					if (flag === -1 || flag === "-1") {
						return "hidden"
					}
					if (flag === -2 || flag === "-2") {
						return ""
					}

				}
				return "hidden"
			});
			//布防是否显示去视图库按钮
			Handlebars.registerHelper("isUsed", function(flag, rulename) {
				if (rulename === "实时标注") {
					if (flag === 0 || flag === "0") { //暂停
						return "";
					}
					if (flag === 1 || flag === "1") { //进行中
						return "";
					}
					if (flag === -1 || flag === "-1") { //未开始
						return "disabled"
					}
					if (flag === -2 || flag === "-2") { //已过期
						return "disabled"
					}


				}
				return ""
			});
			//时间转换
			Handlebars.registerHelper("DefenceTimeFilter", function(time) {
				return Toolkit.mills2datetime(time);
			});
			//查看布控任务时，过滤任务等级
			Handlebars.registerHelper("LevelFilter", function(level) {
				return (level === 1) ? "一般" : (level === 2) ? "重要" : "严重";
			});
			//布防路数限制，对最大、最小设置的限制
			Handlebars.registerHelper("DefaultLimits", function(value, minvalue, type) {
				if (value !== 0) {
					//设置的值
					return value;
				} else {
					if (minvalue !== 0) {
						//当前设置的总数
						return minvalue;
					} else {
						return 10; //默认值
					}
				}
			});
			//一键关闭或者开始
			Handlebars.registerHelper("closeOpenAllTasksText", function(isBlue) {
				return isBlue === "blue" ? "一键开启任务" : "一键关闭任务";
			});
		},
		//事件绑定
		bindEvents: function() {
			var self = this;
			//查看所有布防摄像机任务
			jQuery(document).on("click", ".defence-task #showHideAllDetail:not(.disabled)", function() {
				//获取列表中的布防摄像机id
				var TRs = jQuery("#content_list").find("tr.camera_list"),
					This = jQuery(this).addClass("disabled");
				//如果已经展开则收起
				if (!This.hasClass("blue")) {
					//收起
					jQuery("#content_list").find("tr.alarming_list").hide();
					This.addClass("blue").removeClass("disabled").text("展开全部");
					return;
				}
				var l = TRs.length;
				if (l > 0) {
					var ids = jQuery(TRs[0]).data("id");
					if (l > 1) {
						for (var h = 1, l = TRs.length; h < l; h++) {
							ids += "," + jQuery(TRs[h]).data("id");
						}
					}
				}
				//判断是否为空
				if (!ids || jQuery.trim(ids) === "") {
					return;
				}
				//获取所有布防摄像机下的布防任务
				PubSub.publish("getAllCameraTasks", {
					ids: ids,
					This: This
				});
			});
			//一键开启和关闭所有任务
			jQuery(document).on("click", ".defence-task #closeOpenAllTasks", function() {
				var status = jQuery(this).hasClass("blue") ? 1 : 0;
				//获取所有布防摄像机下的布防任务
				PubSub.publish("toggleAllTaskStatus", {
					status: status,
					node: this
				});
			});
			//查看布防摄像机布防任务列表
			jQuery(document).on("click", "#protectMgr .table_lists_wrap .camera_list", function() {
				//当前对象和当前对象所在的TR对象
				var This = jQuery(this),
					TR = This.closest("tr");
				var cameraId = This.data('id');
				if (TR.next().hasClass("alarming_list")) {

					if (TR.next().is(":visible")) {
						TR.nextUntil(".camera_list").hide();
						TR.find("td").css("border-bottom", "1px solid #f0f2f5")
					} else {
						TR.nextUntil(".camera_list").show();
						TR.find("td").css("border", 0)
					}
				} else {
					PubSub.publish("getDefenseTasksByCameraid", {
						cameraId: cameraId,
						TR: TR
					});
					//self.getDefenseTasksByCameraid(cameraId, TR);
				}
			});
			//开启/停止布防
			jQuery(document).on("click", "#protectMgr .table_lists_wrap .switch", function() {
				var This = jQuery(this),
					taskId = This.data('id'),
					name = This.closest("tbody").find(".even camera_list .cameraname").html(),
					cameraId = This.attr("data-cameraid"),
					list = [];
				list.push(cameraId);
				//根据摄像机id判断该用户是否拥有播放权限。 by wangxiaojun 2015.01.20
				permission.stopFaultRightById(list, true, function(rights) {
					if (rights[0] === true) {
						if (This.hasClass("protected")) {
							//开启，判断当前是否满足布防路数限制相关
							//self.checkLimitAllow(taskId, This, name, function(taskId, obj, name){
							//开启，判断当前是否满足布防路数限制相关
							PubSub.publish("switchCameraProtectStatus", {
								type: 1,
								taskId: taskId,
								This: This,
								name: name
							});
							This.closest('li').find(".taskStatus>em").html("进行中");
							This.closest('li').find(".codTit>em").addClass("active");
							//});
							return;
						}
						if (This.hasClass("unprotected")) {
							//暂停
							PubSub.publish("switchCameraProtectStatus", {
								type: 0,
								taskId: taskId,
								This: This,
								name: name
							});
							This.closest('li').find(".taskStatus>em").html("暂停");
							This.closest('li').find(".codTit>em").removeClass("active");
							return;
						}
					} else {
						if (This.hasClass("unprotected")) {
							notify.info("暂无权限访问该摄像机不能进行暂停任务操作！");
						} else {
							notify.info("暂无权限访问该摄像机不能进行开启任务操作！");
						}
					}
				});
			});
			//搜索摄像机
			jQuery(document).on("click", "#protectMgr .conditions .conditions_btn", function() {
				var condition = {
					orgId: globalVar.curDepartment.id.substring(4),
					cameraName: jQuery("#protectMgr .conditions input[name='name']").val(),
					evType: jQuery("#protectMgr .conditions .select_container .text").attr("data-value"),
					pageNo: 1,
					pageSize: globalVar.configInfo.defencePageSize
				};
				PubSub.publish("getCameraList", {
					condition: condition,
					isSearch: true
				});
			});
			//编辑布防摄像机
			jQuery(document).on("click", "#protectMgr .table_lists .camera_list .tools .icon_edit", function(e) {
				e.stopPropagation();
				var cameraId = jQuery(this).data("id"),
					list = [];
				list.push(cameraId);
				//点击的时候判断该摄像机是否有播放权限，如果有播放权限再根据摄像机id判断该用户是否拥有播放权限。 by wangxiaojun 2015.01.20
				if (permission.klass["defense-real-time-view"] === "defense-real-time-view") {
					permission.stopFaultRightById(list, true, function(rights) {
						if (rights[0] === true) {
							DefenceLogical.DefenceInitial({
								requireType: "0",
								id: cameraId
							}, "defenceMgr");
						} else {
							notify.info("暂无权限编辑该布防摄像机！");
						}
					});
				} else {
					notify.info("暂无权限编辑该布防摄像机！");
				}
			});
			//编辑布防任务
			jQuery(document).on("click", "#protectMgr .alarming_list .task-tools .icon_edit", function() {
				var This = jQuery(this);
				var cameraId = This.closest("tr").prevAll("tr.camera_list").eq(0).data("id"),
					taskId = This.data("id"),
					evType = This.data("evtype");
				var taskName = jQuery(this).closest(".alarming_list").find(".task em").html();
				var camerasName = jQuery(this).closest("tbody").find(".camera_list .cameraname").html();
				var list = [];
				list.push(cameraId);
				//点击的时候判断该摄像机是否有播放权限，如果有播放权限再根据摄像机id判断该用户是否拥有播放权限。 by wangxiaojun 2015.01.20
				if (permission.klass["defense-real-time-view"] === "defense-real-time-view") {
					permission.stopFaultRightById(list, true, function(rights) {
						if (rights[0] === true) {
							DefenceLogical.DefenceInitial({
								requireType: "1",
								evType: evType,
								taskId: taskId,
								id: cameraId
							}, "defenceMgr");
							// 添加日志 by wangxiaojun
							logDict.insertMedialog("m9", "编辑" + camerasName + "摄像机的" + taskName + "布防任务", "f12", "o2");
						} else {
							notify.info("暂无权限编辑该摄像机的布防任务！");
						}
					});
				} else {
					notify.info("暂无权限编辑该摄像机的布防任务！");
				}
			});
			//删除布防摄像机
			jQuery(document).on("click", "#protectMgr .table_lists .tools .icon_delete", function(e) {
				e.stopPropagation();
				var This = jQuery(this),
					cameraId = This.data("id"),
					name = This.closest(".camera_list").find("td.cameraname").html(),
					list = [];
				list.push(cameraId);
				if (cameraId) {
					//判断权限by zhangyu on 2015/3/31
					if (permission.klass["defense-real-time-view"] === "defense-real-time-view") {
						permission.stopFaultRightById(list, true, function(rights) {
							if (rights[0] === true) {
								ProtectCommonFun.confirmDialog("删除摄像机后将会删除该摄像机的布防任务，</br>确定要删除吗？", function() {
									PubSub.publish("delProtectCamera", {
										cameraId: cameraId,
										TR: This.closest("tr"),
										name: name
									});
									//self.delProtectCamera(cameraId, This.closest("tr"), name);
								});
							} else {
								notify.info("暂无权限删除该布防摄像机！");
							}
						});
					} else {
						notify.info("暂无权限删除该布防摄像机！");
					}
				}
			});
			//删除摄像机布防任务
			jQuery(document).on("click", ".alarming_list .task-tools .icon_delete", function() {
				var This = jQuery(this),
					taskId = This.data("id"),
					name = This.closest("tr").prevAll("tr.camera_list").eq(0).find(".cameraname").html();
				var taskName = jQuery(this).closest(".alarming_list").find(".task em").html();
				self.isShowDelTaskDialog = true;
				if (taskId) {
					//判断权限by zhangyu on 2015/3/31
					var list = [];
					list.push(This.closest("tr").prevAll("tr.camera_list").eq(0).data("id"));
					if (permission.klass["defense-real-time-view"] === "defense-real-time-view") {
						permission.stopFaultRightById(list, true, function(rights) {
							if (rights[0] === true) {
								ProtectCommonFun.confirmDialog("确定要删除该任务吗？", function() {
									PubSub.publish("delTaskById", {
										taskId: taskId,
										TR: This.closest("tr"),
										name: name,
										taskName: taskName,
										node: This
									});
									//self.delTaskById(taskId, This.closest("tr"), name, taskName);
									self.isShowDelTaskDialog = false;
								}, function() {
									self.isShowDelTaskDialog = false;
									jQuery(".alarming_list .control .tools").hide();
								});
							} else {
								notify.info("暂无权限删除该摄像机的布防任务！");
							}
						});
					} else {
						notify.info("暂无权限删除该摄像机的布防任务！");
					}
				}
			});
			jQuery(document).on("click", ".alarming_list .task-tools .icon_show", function() {
				var cameraChannelId = $(this).attr("data-cameraChannelId"),
					currentPage = 1,
					pageSize = 12;
					//前往视图库接口数据
					
					PubSub.publish("moveIntoView", {
						cameraChannelId: cameraChannelId,
						currentPage: currentPage,
						pageSize: pageSize
					});

			});
			//布防任务列表的鼠标移入移出事件
			jQuery(document).on("mouseover mouseout", ".alarming_list", function(e) {
				if (e.type === "mouseover") {
					jQuery(this).find(".task-tools").show();
				} else {

					if (!self.isShowDelTaskDialog) {
						jQuery(this).find(".task-tools").hide();
					}
				}
			});
			//设置布防路数等信息(显示弹出框)
			jQuery(document).on("click", ".set_btn", function() {
				//根据当前的组织id，获取当前组织下的布防限制信息
				self.getDefenceLimitInfo(this);
				//notify.info("未完善！");
			});
			//关闭弹出框
			jQuery(document).on("click", ".defence-mgr-pub-dialog .cancel, .defence-mgr-pub-dialog .close", function() {
				jQuery(".defence-mgr-pub-dialog").hide();
			});
			//路数设置确定按钮
			jQuery(document).on("click", ".defence-mgr-pub-dialog .save", function() {
				self.saveLimitInfo();
			});
			jQuery(window).on("resize", function() {
				if (jQuery(".defence-mgr-pub-dialog").css("display") !== "none") {
					self.refreshSettingDialog(jQuery(".set_btn"));
				}
			});
		},
		//刷新设置框
		refreshSettingDialog: function(obj) {
			var top = jQuery(obj).position().top + 30,
				left = jQuery(obj).position().left - jQuery(".defence-mgr-pub-dialog").width() + jQuery(obj).width() + jQuery("#content_list").scrollLeft() + 20;
			jQuery(".defence-mgr-pub-dialog").css({
				top: top + "px",
				left: left + "px"
			});
			jQuery(".defence-mgr-pub-dialog").show();
		},
		// 绑定面包屑事件
		bindBreadEvent: function() {
			jQuery("#protectMgr .breadcrumb a.section").unbind("click");
			jQuery("#protectMgr .breadcrumb a.section").bind("click", function() {

				var id = jQuery(this).attr("data-id");
				for (var i = 0; i < globalVar.steps.length; i++) {
					if (globalVar.steps[i].id === id) {
						globalVar.steps = globalVar.steps.slice(0, i + 1);
					}
				}
				globalVar.curDepartment.id = id;
				PubSub.publish("getCamerasByOrgId", globalVar.curDepartment.id.substring(4));
			});
		
		}
	};
	return new view();
});