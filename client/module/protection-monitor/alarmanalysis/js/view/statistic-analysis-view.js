/**
 * 统计分析view
 */
define([
	'../tab-panel',
	'../alarmanalysis-global-var',
	'../alarmanalysis-common-fun',
	'pubsub'],function(Panel,globalVar,commonFun,PubSub){
	var View = function(){};
	View.prototype = {
		// 统计分析开始时间
		bTime: jQuery("#statisticAnalysis input.begin-time").val(),
		// 统计分析结束时间
		eTime: jQuery("#statisticAnalysis input.end-time").val(),
		//统计分析资源类型
		type: jQuery("#statisticAnalysis .conditions .select_container[data-type='event-type'] .text").attr("data-value"),
		init :function(){
			this.bindStatisticAnalysis();
		},
		//绑定事件
		bindStatisticAnalysis: function() {
			var self = this;
			//绑定面包屑事件
			self.bindBreadEvent();
			//窗口大小改变，表格重新定位
			jQuery(window).resize(function() {
				if (jQuery("#countAnalysisTable").is(":visible")) {
					jQuery("#countAnalysisTable .scroll").css({
						"height": jQuery("#statisticAnalysis .content").height() - 400
					});
				};
			});
			//页面中间的条形图切换按钮
			jQuery(document).off("click", ".count_chat .tabWaper i.chat_tab");
			jQuery(document).on("click", ".count_chat .tabWaper i.chat_tab", function() {
				var This = jQuery(this);
				This.addClass("active").siblings().removeClass("active");
				var charData = globalVar.curDepartment.charData;
				if (This.attr("data-tab") === "alarmLevel") {
					var legend = ["一般", "重要", "严重"];
					var param = {
						time:charData.time,
						one:charData.normal,
						two:charData.importance,
						three:charData.serious,
						legend:legend
					};
					PubSub.publish("getBarChart",param);
				} else {
					var legend = ["人员布控", "车辆布控", "事件布防"];
					var param = {
						time:charData.time,
						one:charData.people,
						two:charData.car,
						three:charData.eventCount,
						legend:legend
					};
					PubSub.publish("getBarChart",param);
				}
			});
			//搜索事件
			jQuery(document).off("click", "#statisticAnalysis .conditions a.countSearch");
			jQuery(document).on("click", "#statisticAnalysis .conditions a.countSearch", function() {
				var orgid = globalVar.curDepartment.id;
				var startTime = jQuery("#statisticAnalysis input.begin-time").val(),
					endTime = jQuery("#statisticAnalysis input.end-time").val(),
					eventType = jQuery("#statisticAnalysis .conditions .select_container[data-type='event-type'] .text").attr("data-value");
				//判断起始时间
				if (startTime && startTime > Toolkit.formatDate(new Date())) {
					notify.error("开始时间不能晚于当前时间!");
					return false;
				}
				if (startTime && endTime && startTime > endTime) {
					notify.error("结束时间不能早于开始时间！");
					return false;
				}
				//存储搜索搜索条件,供导出用
				self.bTime = startTime;
				self.eTime = endTime;
				self.type = eventType;
				var param = {
					orgid:orgid, 
					eventType:eventType, 
					startTime:startTime, 
					endTime:endTime,
					isSearch:true
				};
				PubSub.publish("getCountDate",param);
			});


			//点击全选/取消全选
			jQuery(document).on("click", "#countAnalysisTable th.check input", function(event) {
			   if (jQuery(this).prop("checked") === true) {
					jQuery("#countAnalysisTable td input.checkinfo").prop("checked", true).closest(".table_lists_cont").addClass("selected");
				} else {
				   jQuery("#countAnalysisTable td input.checkinfo").prop("checked", false).closest(".table_lists_cont").removeClass("selected");
			   }
				event.stopPropagation();    //  阻止事件冒泡

			});
			//点击单个勾选框时判断是否为全选状态
			jQuery(document).on("click", "#countAnalysisTable td input.checkinfo", function(event) {
				var listDom = jQuery(this).closest(".table_lists_cont");
				if (listDom.hasClass("selected")) {
					listDom.removeClass("selected");
				} else {
					listDom.addClass("selected");
				}

				if (jQuery("#countAnalysisTable td input.checkinfo").length === jQuery("#countAnalysisTable td input.checkinfo:checked").length) {
					jQuery("#countAnalysisTable th.check input").prop("checked", true);
				} else {
					jQuery("#countAnalysisTable th.check input").prop("checked", false);
				}
				event.stopPropagation();    //  阻止事件冒泡
			});
			//点击导出
			jQuery(document).off("click", "#statisticAnalysis .content .dataExport");
			jQuery(document).on("click", "#statisticAnalysis .content .dataExport", function() {
				var timeList = [];
				var length = jQuery("#countAnalysisTable td input.checkinfo:checked").length;
				if (length === 0) {
					notify.warn("请至少选择一个导出的统计分析信息！");
					return false;
				} else {
					for (var i = 0; i < length; i++) {
						timeList.push(jQuery("#countAnalysisTable td input.checkinfo:checked").eq(i).attr("data-time"));
					}
				}
				//显示窗口
				jQuery(".checkAlarm_layout_ifr").removeClass('hidden');
				jQuery(".export-loading").removeClass('hidden');
				jQuery(".layout").removeClass('hidden');
				var	id = globalVar.curDepartment.id;
				var ifr = document.getElementById ("exportRecords");
				ifr.src = "/service/events/history/summary/export/" + id + "?" + encodeURI("id=" + id + "&fileName=统计分析表&timeList=" + timeList + "&startTime=" + self.bTime + "&endTime=" + self.eTime + "&eventType=" + self.type);
				// commonFun.getIframeLoadState("exportRecords");
				//解决在谷歌和火狐下没办法取到状态值从而无法关闭窗口，所以正对谷歌火狐做了一个延时的处理到一定时间关闭窗口。这个会有不妥之处，窗口有时关闭早，有时关闭晚，所以取了一个折中的时间。 by wangxiaojun 2015.01.19
				if (navigator.userAgent.toLowerCase().search(/(msie\s|trident.*rv:)([\w.]+)/) !== -1) {
					commonFun.getIframeLoadState("exportRecords");
				} else {
					var i = 3;
					var a = setInterval(function(){
						jQuery(".export-loading").html("窗口"+i+"秒后自动关闭...");
						i = i-1;
					},1000);
					setTimeout(function() {
						jQuery(".checkAlarm_layout_ifr").addClass('hidden');
						jQuery(".export-loading").addClass('hidden');
						jQuery(".export-loading").html("正在下载,请稍后...");
						clearTimeout(a);
						//将src置空
						// ifr.src = "about:blank";
					}, 4000);
				}
				logDict.insertMedialog("m9","导出报警信息统计列表","f11");	//加日志
			});
		},
		// 绑定组织树对应的面包屑事件
		bindBreadEvent: function() {
			jQuery("#statisticAnalysis .breadcrumb a.section").unbind("click");
			jQuery("#statisticAnalysis .breadcrumb a.section").bind("click", function() {
				var id = jQuery(this).attr("data-id");
				var temSteps = globalVar.steps;
				var temCurDepartment = globalVar.curDepartment;
				for (var i = 0; i < globalVar.steps.length; i++) {
					if (globalVar.steps[i].id === id) {
						globalVar.steps = globalVar.steps.slice(0, i + 1);
					}
				}
				globalVar.curDepartment.id = id;
				if (Panel.hasPermission(globalVar.curDepartment.id)) {
					//模拟点击搜索事件
					jQuery("#statisticAnalysis .conditions a.countSearch").click();
				} else {
					globalVar.steps = temSteps;
					globalVar.curDepartment = temCurDepartment;
					notify.info("权限不足");
				}
			});
		}
	}
	return new View();
})