/**
 * 巡航模块页面事件入口
 * @author:Leon.z
 * @date  :2016.2.1
 */
define([
	'pubsub',
	'js/globar-varibal.js',
	'/module/settings/inspectPlanSet/js/view/cameraTree-init.js',
	"/module/common/popLayer/js/popImg.js",
	'/module/settings/inspectPlanSet/js/model/inspectModel.js',
	'jquery-ui-timepicker-addon',
	'handlebars'
], function(PubSub, _g, cameraTree, POPIMG, inspectModel) {
	var inspectView = function() {
		this.inspectCtr = {};
	};
	inspectView.prototype = {
		commonObj: null,
		//下拉列表浮动层鼠标移入标记
		isMouseOverPubDiv: false,
		init: function(ctr) {
			var self = this;
			self.inspectCtr = ctr;
			self.bindDataPicker();
			self.registerHelper();
			
			self._bindEvents();

			// 加载摄像机列表
			cameraTree.init();
			self._bindPopEvents();
		},
		//添加全局的日期插件
		bindDataPicker: function() {
			jQuery(document).on('focus', '.input-time', function(e) {
				e.stopPropagation();e
				var self = this;
				jQuery(this).datetimepicker({
					showTimepicker: false,
					dateFormat: 'yy-mm-dd',
					timeText: '',
					hourText: '时',
					minuteText: '分',
					secondText: '秒',
					showAnim: '',
				});
			});
			jQuery(document).on('focus', '.input-times', function(e) {
				e.stopPropagation();
				var self = this;
				jQuery(this).datetimepicker({
					showSecond: true,
					timeOnly: true,
					timeFormat: 'HH:mm:ss',
					timeText: '',
					hourText: '时',
					minuteText: '分',
					secondText: '秒',
					showAnim: '',
					minDateTime:new Date()
				});
			});
		},
		//注册助手
		registerHelper: function() {
			Handlebars.registerHelper('statusCheck', function(frequency) {
				var str = "";
				switch (parseInt(frequency)) {
					case 1:
						str = "一天";
						break;
					case 2:
						str = "一周";
						break;
					case 3:
						str = "一月";
						break;
					default:
						str = "自定义"
						break;
				}
				return str;
			});
			Handlebars.registerHelper('isActiveSel', function(cid, id) {
				var str = ""
				_g.inspectPresetsCache.forEach(function(item) {
					if (parseInt(item.cameraId) === parseInt(cid) && parseInt(item.id) === parseInt(id)) {
						str = "active"
					}
				});
				return str;
			});
			Handlebars.registerHelper('isAct', function(valid) {
				if (valid === 0 || valid === "0") {
					return "startTask"
				}
				if (valid === 1 || valid === "1") {
					return "running active";
				}
				return "startTask";
			});
			Handlebars.registerHelper('isActName', function(valid) {
				if (valid === 0 || valid === "0") {
					return "开启任务"
				}
				if (valid === 1 || valid === "1") {
					return "停止任务";
				}
				return "开启任务";
			});
			Handlebars.registerHelper('isRun', function(valid) {
				if (valid === 0 || valid === "0") {
					return "hidden"
				}
				if (valid === 1 || valid === "1") {
					return "";
				}
				return "hidden";
			});
		},
		//重新渲染弹出窗口
		clearPopPanel: function() {
			var self = this;
			_g.selectedNums = 0;
			cameraTree.init();
			_g.inspectPresetsCache = [];
			jQuery("#popContainer .midCenter .inspectList").empty();
			jQuery("#popContainer .midRight .cameraList ul").empty();
			jQuery("#popContainer .pop_c_t").find(".text").text("一天");
			jQuery("#popContainer .midRight .header").find("em").text(0);
			jQuery("#popContainer").find("input[name='task_Name']").val("");
			jQuery("#popContainer").find("input[name='taskName']").val("");
			jQuery("#popContainer").find(".startTime").val("");
			jQuery("#popContainer").find(".endTime").val("");
			jQuery("#popContainer").find(".startDay").val("");
			jQuery("#popContainer").find(".endDay").val("");
			jQuery("#popContainer .popfootor").find(".userDefined").show();
			jQuery("#popContainer").show().attr("data-edit", "0").removeAttr("data-taskid");
			if (jQuery("#popContainer .pop_c_t").find(".icon_arrow").hasClass("active")) {
				jQuery("#popContainer .pop_c_t").find(".myset").trigger("click");
			}
		},
		cancleClear: function() {
			cameraTree.init();
			jQuery("#popContainer .midCenter .inspectList").empty();
			if (jQuery("#popContainer .pop_c_t").find(".icon_arrow").hasClass("active")) {
				jQuery("#popContainer .pop_c_t").find(".myset").trigger("click");
			}
			jQuery("#popContainer").find(".startDay").val("");
			jQuery("#popContainer").find(".endDay").val("");
		},
		/**
		 * 绑定事件
		 * @private
		 */
		_bindEvents: function() {
			var self = this;
			/**新建巡航任务**/
			jQuery("#sidebar").on("click", ".tsk-lst .newtask", function() {
				self.clearPopPanel();
				//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
				window.top.showHideNav("hide");
				jQuery("#popContainer .popfootor").find("input[name='defined'][type='checkbox']").prop("checked", true);
				jQuery("#popLayer").fadeIn(200, function() {

					jQuery("#popContainer").show();

				})
			});
			/**获取巡航任务任务信息**/
			jQuery(document).off("click", "#onlineBox .taskitem").on("click", "#onlineBox .taskitem", function(e) {
				e.stopPropagation();
				var taskId = jQuery(this).attr("data-taskid"),
					taskName = jQuery(this).find(".taskTitle").text(),
					taskTimePart = jQuery(this).find(".timePart").text(),
					params = {};
				jQuery(this).addClass("active").siblings().removeClass("active");
				params = {
					taskId: taskId,
					taskName: taskName,
					taskTimePart: taskTimePart
				};
				self.inspectCtr.getInspectTaskInfo(params);
			});
			/**开启任务**/
			jQuery(document).on("click", "#onlineBox .taskitem .startTask", function(e) {
				e.stopPropagation();
				var taskId = jQuery(this).closest('li').data("taskid"),
					node = jQuery(this);
				node.closest('li').find(".taskSatusHel ").removeClass('hidden');
				self.inspectCtr.startInspectTask(taskId, node);
			});
			/**停止任务**/
			jQuery(document).on("click", "#onlineBox .taskitem .running", function(e) {
				e.stopPropagation();
				var taskId = jQuery(this).closest('li').data("taskid"),
					node = jQuery(this);
					node.closest('li').find(".taskSatusHel ").addClass('hidden');
				self.inspectCtr.pauseInspectTask(taskId, node);
			});
			/**编辑任务**/
			jQuery(document).on("click", "#onlineBox .taskitem .editTask", function(e) {
				e.stopPropagation();
				var params = {
					taskName: jQuery(this).closest('li').find(".taskTitle").text(),
					frequencys: jQuery(this).closest('li').data("frequency"),
					startTime: jQuery(this).closest('li').data("startime"),
					endTime: jQuery(this).closest('li').data("endtime"),
					startDay: jQuery(this).closest('li').data("startday"),
					endDay: jQuery(this).closest('li').data("endday"),
					taskId: jQuery(this).closest('li').data("taskid")
				}
				jQuery("#popLayer").fadeIn(200, function() {
					//隐藏导航,bug[37719], add by zhangyu, 2015.10.25
					window.top.showHideNav("hide");
					jQuery("#popContainer .popfootor").find(".userDefined").hide();
					jQuery("#popContainer").show().attr("data-edit", "1").attr("data-taskid", params.taskId);
					jQuery("#popContainer").find(".saveForm").removeClass('disabled');
					jQuery("#popContainer .popfootor").find("input[name='defined'][type='checkbox']").prop("checked", false);
					self.editTaskSingle(params);
				});
			});
			/**删除巡检任务**/
			jQuery(document).on("click", "#onlineBox .taskitem .cls", function(e) {
				e.stopPropagation();
				var taskId = jQuery(this).closest('li').data("taskid"),
					taskName = jQuery(this).closest('li').find(".taskTitle").text();
				_g.confirmDialog("确定要删除该任务吗？", function() {
					self.inspectCtr.deleteTask(taskId, taskName);
				});

			});
			/**点击查看大图**/
			jQuery(document).on("click", "#major .mainPlanList .listPic", function(e) {
				e.stopPropagation();
				var dataSrc = jQuery(this).find("img").attr("src"),
					fileNames = jQuery(this).closest('li').data("cameraname");
				imgData = {
					showRightDetailInfo: false,
					baseInfo: {
						filePath: dataSrc, // 图片路径
						fileName: fileNames
					},
					operatorOptions: {
						toViewLibIcon: false,
						imgProcessIcon: false,
						oneToOneIcon: false
					}
				}
				POPIMG.initial(imgData);
			});
			/**巡航任务模糊搜索**/
			jQuery(document).on("keyup", "#taskSearchSimple", function(e) {
				var name = jQuery(this).val();
				self.inspectCtr.loadInspectData(name);
			});
		},
		/**
		 * [editTaskSingle 编辑巡航任务]
		 * @return {[type]} [description]
		 */
		editTaskSingle: function(parms) {
			if (parms) {
				var fre = parms.frequencys === 1 ? "一天" : parms.frequencys === 2 ? "一周" : parms.frequencys === 3 ? "一月" : "一天";
				jQuery("#popContainer").find("input[name='task_Name']").val(parms.taskName);
				jQuery("#popContainer").find(".text").text(fre);
				if (parms.frequencys === 4) {
					jQuery("#popContainer .pop_c_t").find(".myset").trigger("click");
					jQuery("#popContainer").find(".startDay").val(parms.startDay);
					jQuery("#popContainer").find(".endDay").val(parms.endDay);
				}
				jQuery("#popContainer").find(".startTime").val(parms.startTime);
				jQuery("#popContainer").find(".endTime").val(parms.endTime);
				_g.oldTaskName = parms.taskName;
				getSelectList(parms.taskId);

			}

			function getSelectList(taskid) {
				_g.inspectPresetsCache = [];
				inspectModel.ajaxEvents.getSingleDetail({
					task_id: taskid,
				}, {}, function(res) {
					if (res.code === 200 && res.data) {
						var nums = res.data.list.length,
							html = "";
						if (nums > 0) {
							for (var i = 0; i < nums; i++) {
								_g.inspectPresetsCache.push({
									cameraId: res.data.list[i].camera_id,
									id: res.data.list[i].preset_id,
									cameraName: res.data.list[i].camera_name,
									inspectPosName: res.data.list[i].preset_name
								});
								html += ['<li data-name="' + res.data.list[i].preset_name + '" data-cameraId="' + res.data.list[i].camera_id + '">',
									'<span title="'+res.data.list[i].camera_name + '-' + res.data.list[i].preset_name+'"><i class="camera-ball-online"></i>' + res.data.list[i].camera_name + '-' + res.data.list[i].preset_name + '</span>',
									'<span><i class="icon-close"></i></span>',
									'</li>'
								].join("");
							}
							jQuery("#popContainer .midRight .cameraList ul").html(html);
						}
						jQuery("#popContainer .midRight .header").find("em").text(nums);
					}
				})
			}
			//logDict.insertMedialog("m3", "“"+new Date()+"”“"+jQuery("#userEntry").data("truename")+"”编辑：“" + taskName + "”巡航任务”", "f13"); //添加日志
		},
		_bindPopEvents: function() {
			var self = this;
			/** [选择执行周期] */
			jQuery("#popContainer").on("click", ".popContent .pop_c_t .taskTimePanel", function() {
				var node = jQuery(this);
				if (!node.hasClass("active")) {
					jQuery("#slectDetail").show();
					node.parent(".part").find(".arrow-down").addClass('active');
					node.addClass("active");

				} else {
					jQuery("#slectDetail").hide();
					node.removeClass("active");
					node.parent(".part").find(".arrow-down").removeClass('active');
				}
				self.isMouseOverPubDiv = true;
			});
			jQuery(document).on("click", function(e) {
				if (!self.isMouseOverPubDiv) {
					jQuery("#popContainer").find(".arrow-down").removeClass('active');
					jQuery("#popContainer").find(".taskTimePanel").removeClass('active');
					jQuery("#slectDetail").hide();
				}
			});
			//下拉列表的鼠标移入移出事件
			jQuery("#slectDetail").hover(function() {
				self.isMouseOverPubDiv = true;
			}, function() {
				self.isMouseOverPubDiv = false;
			});
			/** [选择执行周期下拉列表] */
			jQuery("#slectDetail").on("click", "li", function() {
				var name = jQuery(this).text();
				jQuery("#popContainer .taskTimePanel").find(".text").text(name);
				jQuery("#popContainer").find(".taskTimePanel").click();
			});
			/** [自定义设置] */
			jQuery("#popContainer").on("click", ".popContent .pop_c_t .myset", function(e) {
				e.stopPropagation();
				var node = jQuery(this);
				if (!node.find(".icon_arrow").hasClass('active')) {
					jQuery("#popContainer .mineSetPanel").show();
					node.find(".icon_arrow").addClass('active');
					node.find("em").text("收  起");
				} else {
					jQuery("#popContainer .mineSetPanel").hide();
					node.find(".icon_arrow").removeClass('active');
					node.find("em").text("自定义");
				}
			});
			/** [取消] */
			jQuery("#popContainer").on("click", ".popHeader .icon_close,.popfootor .cancleForm", function() {
				jQuery("#popLayer").fadeOut(200, function() {
					jQuery("#popContainer").hide();
					window.top.showHideNav("show");
					self.cancleClear();
				});
			});
			/**预置位选择**/
			jQuery("#popContainer").on("click", ".popContent .middlePanel .inspectList li", function() {
				var node = jQuery(this).find(".radio"),
					cameraId = jQuery(this).data("cameraid"),
					id = jQuery(this).data("id"),
					params = {};
				params = {
					cameraId: cameraId,
					id: id,
					inspectPosName: jQuery(this).find(".inspectName").text(),
				}
				if (!node.hasClass('active')) {
					node.addClass('active').closest('li').siblings('li').find(".radio").removeClass("active");
					params.isAppend = true;
				} else {
					node.removeClass('active');
					params.isAppend = false;
				}
				self.inspectCtr.renderCameraList(params);
			});
			/**删除所有已选中列表**/
			jQuery("#popContainer").on("click", ".popContent .midRight .header .deleteAll", function(e) {
				e.stopPropagation();
				jQuery("#popContainer .midRight .cameraList ul").empty();
				jQuery("#popContainer .middlePanel .inspectList li").find(".radio").removeClass("active");
				_g.selectedNums = 0;
				_g.inspectPresetsCache = [];
				jQuery("#popContainer .midRight .header").find("em").text(0);
			});
			/**删除单个已选中摄像机**/
			jQuery("#popContainer").on("click", ".popContent .midRight .cameraList .icon-close", function(e) {
				e.stopPropagation();
				var cameraId = jQuery(this).closest('li').data("cameraid");
				jQuery(this).closest('li').remove();
				self.inspectCtr.deleteSingleCam(cameraId);

			});
			/**验证是否重名**/
			jQuery("#popContainer").on("change", "input[name='task_Name']", function(e) {
				e.stopPropagation();
				var name = jQuery(this).val();
				//self.inspectCtr.checkNameRecg(name)
			});
			/**提交任务**/
			jQuery("#popContainer").on("click", ".saveForm:not('.disabled')", function(e) {
				e.stopPropagation();
				var params = {},
					relation = [],
					taskName = jQuery("#popContainer").find("input[name='task_Name']").val(),
					frequencys = jQuery("#popContainer").find(".text").text(),
					startDay = jQuery("#popContainer").find(".startDay").val(),
					endDay = jQuery("#popContainer").find(".endDay").val(),
					startTime = jQuery("#popContainer").find(".startTime").val().trim(),
					endTime = jQuery("#popContainer").find(".endTime").val().trim(),
					isUserDefine = jQuery("#popContainer .popfootor").find("input[name='defined'][type='checkbox']").prop("checked"),
					isEditEvent = jQuery("#popContainer").attr("data-edit"),
					taskId = jQuery("#popContainer").attr("data-taskid"),
					date = new Date();
				if (startDay !== "" && endDay !== "") {
					frequencys = 4;
				} else {
					if (frequencys === "一天") {
						startDay = Toolkit.getCurDate();
						endDay = Toolkit.getCurDate();
						frequencys = 1;
					} else if (frequencys === "一周") {
						startDay = Toolkit.getCurDate();
						endDay = Toolkit.showSubTimeFromNowToSet(7);
						frequencys = 2;
					} else if (frequencys === "一月") {
						startDay = Toolkit.getCurDate();
						var ss = date.getMonth() + 2 > 12 ? 1 : date.getMonth() + 2;
						endDay = date.getFullYear() + '-' + Toolkit.formatLenth(ss) + '-' + Toolkit.formatLenth(date.getDate());
						frequencys = 3;
					}
				}
				params = {
					task_name: taskName,
					frequency: frequencys,
					start_day: startDay,
					end_day: endDay,
					start_hour: startTime,
					end_hour: endTime,
					relations: relation
				};
				if (isEditEvent === "1" || isEditEvent === 1) {
					params.task_id = taskId;
					_g.inspectPresetsCache.forEach(function(item) {
						relation.push({
							camera_id: item.cameraId,
							preset_id: item.id,
							task_id: params.task_id
						})
					});
				} else {
					_g.inspectPresetsCache.forEach(function(item) {
						relation.push({
							camera_id: item.cameraId,
							preset_id: item.id,
						})
					});
				}
				self.inspectCtr.sendCheckData(params, isUserDefine);
			});
		},

	}
	return new inspectView();
});