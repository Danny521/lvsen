define([
	'../view/statistic-analysis-view',
	'../alarmanalysis-global-var',
	'../model/alarmanalysis-model',
	'pubsub',
	'echarts-plain-original',
	'base.self'
	],function(statisticAnalysisView,globalVar,ajaxService,PubSub){
/**
 * 统计分析【业务逻辑】
 */
var StatisticAnalysis = new Class({
	Implements: [Events, Options],
	options: {
		template: null
	},
	initialize: function(options) {
		var self = this;
		this.setOptions(options);
		statisticAnalysisView.init();
		//订阅事件
		PubSub.subscribe("getCountDate",function(msg,param){self.getCountDate(msg,param)});
		PubSub.subscribe("getBarChart",function(msg,param){self.getBarChart(msg,param)});
	},

	//获取统计数据填充模板
	getCountDate: function(msg,param) {
		//orgid, eventType, startTime, endTime,isSearch
		var self = this;	
		if (!param.isSearch) {	//如果不是搜索事件,则搜索条件全部清空
			statisticAnalysisView.bTime = null;
			statisticAnalysisView.eTime = null;
			statisticAnalysisView.type = "";
			//渲染搜索栏
			var html = self.options.template({
				"countAnalysisList": true
			});
			jQuery("#statisticAnalysis").html(html);

			var startTime = Toolkit.getCurDate() + " 00:00:00",
				endTime = Toolkit.getCurDateTime();
			jQuery("#statisticAnalysis .begin-time.input-time").val(startTime);
			jQuery("#statisticAnalysis .end-time.input-time").val(endTime);
		}
		//渲染面包屑
		var html = self.options.template({
				"countAnalysisBread":globalVar.steps
		});
		jQuery("#statisticAnalysis .breadcrumb").html(html);
		
		permission.reShow();
		var data = {
			id : param.orgid,
			eventType: param.eventType,
			startTime: param.startTime,
			endTime: param.endTime
		};
		if(!data.id){
			return ;
		}
		ajaxService.ajaxEvent.getStatList(data, function() { //beforeSend
			jQuery("#countAnalysisTable").html("<div class='loading'></div>");
		}, function(tem) {	//success
			if (tem.code === 200 && tem.data.list) {
				//柱状图相关参数
				var time = [],
					normal = [],
					importance = [],
					serious = [],
					people = [],
					car = [],
					eventCount = [],
					len = tem.data.list.length;
				//渲染具体内容
				if (len > 0) {
					jQuery(".content .count_chat").show();
					jQuery("#countAnalysisTable").html(self.options.template({
						"countAnalysisItems": {
							countAnalysis: tem.data.list
						}
					}));
					//柱状图
					for (var i = 0; i < len; i++) {
						time.push(tem.data.list[i].time);
						normal.push(tem.data.list[i].levels[0]);
						importance.push(tem.data.list[i].levels[1]);
						serious.push(tem.data.list[i].levels[2]);
						people.push(tem.data.list[i].types[0]);
						car.push(tem.data.list[i].types[1]);
						eventCount.push(tem.data.list[i].types[2]);
					}
					//增加curDepartment中的参数
					globalVar.curDepartment.charData = {
						"time": time,
						"normal": normal,
						"importance": importance,
						"serious": serious,
						"people": people,
						"car": car,
						"eventCount": eventCount
					};
					var legend = ["人员布控", "车辆布控", "事件布防"];
					var params = {
						time:time,
						one:people,
						two:car,
						three:eventCount,
						legend:legend
					};
					self.getBarChart('',params);
				} else {
					jQuery("#countAnalysisTable").html("<span class='none'>此机构下没有统计信息</span>");
					jQuery(".content .count_chat").hide();
				}
				statisticAnalysisView.bindStatisticAnalysis(); //绑定页面事件
			} else if (tem.code === 500) {
				notify.error(tem.data.message);
			} else {
				notify.warn("获取统计分析数据异常！");
			}
			if (param.isSearch) {
				logDict.insertMedialog("m9", "查询报警信息统计列表", "f11", "o17"); //加日志
			}
		}, function() {	//error

			notify.error("获取统计分析数据失败，请检查网络！");
		});
	},
	//渲染柱状图
	getBarChart: function(msg,param) {
		//time, one, two, three, legend
		var myChart = echarts.init(document.getElementById('bar'));
		var option = {
			// 柱形图颜色的设置
			color: ['#e88d56', '#e7556a', '#9e2536'],
			title: {
				text: '报警统计分析',
				x: 25,
				y: 25,
				textStyle: {
					fontSize: 13,
					fontWeight: 300,
					fontFamily: "Microsoft Yahei"
				}
			},
			tooltip: {
				axisPointer: { // 坐标轴指示器，坐标轴触发有效
					type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
				},
				show: true
			},
			// 下面的滚动条
			dataZoom: {
				show: true,
				realtime: true,
				height: 20,
				start: 30,
				end: 100,
				zoomLock: true,
				dataBackgroundColor: '#ddd'
			},
			legend: {
				orient: 'category',
				x: "right",
				y: 20,
				textStyle: {
					fontSize: 12,
					fontWeight: 300,
					fontFamily: "Microsoft Yahei"
				},
				data: param.legend
			},
			grid: {
				borderWidth: 0,
				borderColor: '#ccc'
			},
			xAxis: [{
				type: 'category',
				splitLine: {
					show: false
				},
				data: param.time
			}],
			yAxis: [{
				type: 'value',
				splitLine: {
					show: false
				}
			}],
			series: [{
				name: (param.legend)[0],
				type: 'bar',
				stack: '分析',
				barWidth: 15,
				data: param.one
			}, {
				name: (param.legend)[1],
				type: 'bar',
				stack: '分析',
				barWidth: 15,
				data: param.two
			}, {
				name: (param.legend)[2],
				type: 'bar',
				stack: '分析',
				barWidth: 15,
				data: param.three
			}]
		};
		myChart.setOption(option);
	}
});
return {
	StatisticAnalysis : StatisticAnalysis
}
});