/*
** 报警处理 by chengyao
 */
define([
	'../model/alarmanalysis-model',
	'../view/alarm-deal-view',
	'pubsub'
	],function(alarmModel,alarmDealView,PubSub){
	var controller = function(){
		var self = this;
		//view层初始化
		alarmDealView.init();
		//订阅事件
		PubSub.subscribe("toDealControl",function(msg,data){self.toDealControl(data)});
		PubSub.subscribe("toDealDefence",function(msg,data){
			self.toDealDefence(data)});
	};
	controller.prototype = {
		//初始化
		init:function(data){
			var self = this;
			//触发报警处理
			this.toAlarmDeal(data);
		},
		//报警处理
		toAlarmDeal:function(data){
			//如果当前处于查看状态，则关闭查看面板
			var tbody = data.tbody,
				self = this;
			if (!tbody.hasClass("up")) {
				tbody.find(".table_lists_cont").click();
			}
			delete data.tbody;
			alarmModel.ajaxEvent.getSingleAlarm(data, null, function(res) { //success
				if (res.code === 200) {
					jQuery.extend(res.data,{tbody:tbody});
					alarmDealView.applyAlarmDealTemp(res.data);
				} else if (res.code === 500) {
					notify.warn(res.data.message);
				} else {
					notify.error("获取报警详情异常！");
				}
			}, function() { //error
				notify.error("获取报警详情失败，请查看网络状况！");
			});
		},
		//布防处理数据提交
		toDealDefence:function(param){
			var tbody = param.This.closest("tbody"),
				This = param.This;
				delete param.This;
			alarmModel.ajaxEvent.dealDefence(param, null, function(res) { //success
				if (res.code === 200) {
					//列表栏中改变报警级别和处理状态的显示
					tbody.find(".table_lists_cont .level").html(This.closest("li.infor").find(".select_container .text").text()).removeClass().addClass("level level" + param.level + "");
					tbody.find(".table_lists_cont .status").html(This.html()).removeClass().addClass("status status" + param.value + "");
					tbody.find("td[class='name']").html(jQuery("#userEntry")[0].innerText); //修改列表中的处理人
					notify.success("报警处理成功！");
					var typeName = tbody.find(".alarm-type").html(); //获取报警类型
					if (This.hasClass("deal")) {
						logDict.insertMedialog("m9", "处理：“" + typeName + "”历史报警信息为“有效”", "f11"); //添加日志
					} else {
						logDict.insertMedialog("m9", "处理：“" + typeName + "”历史报警信息为“无效”", "f11"); //添加日志
					}
				} else if (res.code === 500) {
					notify.warn(res.data.message);
				} else {
					notify.error("报警处理异常！");
				}
			}, function() { //error
				notify.error("报警处理失败，请查看网络状况！");
			});
		},
		//布控处理数据提交
		toDealControl:function(data){
			var activePeole = data.activePeole;
			alarmModel.ajaxEvent.dealPeopleCtrl(data.param, null, function(res) { //success
				if (res.code === 200) {
					//改变图片下角图标
					activePeole.siblings("i").removeClass().addClass(data.iconStatus);
					//改变左侧列表上的状态
					var dealStatus = "";
					switch (res.data.dealStatus) {
						case 0:
							dealStatus = "未处理";
							break;
						case 1:
							dealStatus = "有效";
							break;
						case 2:
							dealStatus = "无效";
							break;
						case 3:
							dealStatus = "未知";
							break;
					}
					//保存成功之后修改当前选中的候选人的data-handlestatus，以便在切换候选人时工具条切换使用
					if (data.statusDom.hasClass("right")) {
						activePeole.attr({
							"data-handlestatus": "1",
							"data-description": data.param.comment
						});
					} else if (data.statusDom.hasClass("wrong")) {
						activePeole.attr({
							"data-handlestatus": "2",
							"data-description": data.param.comment
						});
					} else if (data.statusDom.hasClass("unknow")) {
						activePeole.attr({
							"data-handlestatus": "3",
							"data-description": data.param.comment
						});
					}
					data.This.closest("tbody").find("td[class='name']").html(jQuery("#userEntry")[0].innerText);
					data.This.closest("tbody").find(".table_lists_cont .status").html(dealStatus).removeClass().addClass("status status" + res.data.dealStatus + "");
					notify.success("报警处理成功！");
					//begin 加日志
					var taskName = data.This.closest(".infowindow-down").attr("data-taskname");
					if (res.data.dealStatus === 1) {
						logDict.insertMedialog("m9", "处理：“" + taskName + "”布控任务历史报警信息为“有效”", "f11");
					} else if (res.data.dealStatus === 2) {
						logDict.insertMedialog("m9", "处理：“" + taskName + "”布控任务历史报警信息为“无效”", "f11");
					} else if (res.data.dealStatus === 3) {
						logDict.insertMedialog("m9", "处理：“" + taskName + "”布控任务历史报警信息为“未知”", "f11");
					}
					//end 加日志
				} else if (res.code === 500) {
					notify.warn(res.data.message);
				} else {
					notify.error("报警处理异常！");
				}
			}, function() { //error
				notify.error("报警处理失败，请查看网络状况！");
			});
		}
	};
	return new controller();
});