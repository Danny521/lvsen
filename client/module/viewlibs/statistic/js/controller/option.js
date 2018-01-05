/**
 *
 * @authors yuqiu (you@example.org)
 * @date    2014-10-13 10:43:25
 * @version $Id$
 */
/**
 * [把json数据转化成echart能用option]
 * @param  {[type]} require [description]
 * @param  {[type]} exports [description]
 * @param  {[type]} module  [description]
 * @return {[type]}         [description]
 */
define([
    'base.self'
], function() {
	var me = null;

	/**
	 * [replenishTimeArray ] 补全统计数据的时间轴
	 * @return {[type]} [description] 返回一个完整时间轴数组
	 */
	function replenishTimeArray(params) {
		var date = Toolkit.parseDate(params.endTime),
			i = 0,
			timeArray = [],
			type = $('#data-type-flow li.active').attr('data-time');
		switch (type) {
			case 'month':
				timeArray.push(date.format('yyyy-MM-dd'));
				for (i = 1; i < 30; i++) {
					date.setDate(date.getDate() - 1);
					timeArray.push(date.format('yyyy-MM-dd'));
				}
				break;
		}
		return timeArray.sort();
	}

	var OptionChart = function() {
		me = this;
	};
	/**
	 * 把数据源获取的数据转换成echart需要的数据格式
	 * @param  {[type]} data 数据源
	 * @return {[type]}      echart需要的数据格式
	 */
	OptionChart.prototype.transformChartsData = function(data, params) {
		var optionData = {
				legend: [],
				time: [],
				series: []
			},
			color = ['#696a68', '#86af71'],
			chartBaseData = {
				'案事件': [],
				'疑情信息': []
			};
		//optionData.time = replenishTimeArray(params);
		optionData.legend.push('案事件', '疑情信息');
		data && data.length && data.each(function(item, index) {
			//var yData = [];
			/*optionData.time.each(function(el, index) {
                yData.push(item.chartData[el] ? item.chartData[el] : 0);
            });*/
			optionData.time.push(item.time);
			chartBaseData['案事件'][item.time] = {
				rate: 1 - +item.incidentBackNumbers / (+item.incidentAuditNumbers),
				pass: +item.incidentAuditNumbers - +item.incidentBackNumbers,
				back: +item.incidentBackNumbers
			};
			chartBaseData['疑情信息'][item.time] = {
				rate: 1 - +item.structureBackNumbers / (+item.structureAuditNumbers),
				pass: +item.structureAuditNumbers -  +item.structureBackNumbers,
				back: +item.structureBackNumbers
			};
			/*item.chartData.each(function(chartItem, index){
                for (var key in chartItem){
                    optionData.time.push(key);
                    yData.push(chartItem[key]);
                }
            });*/
		});
		optionData.legend.each(function(legendElem, index) {
			var yData = [];
			optionData.time.each(function(el, index) {
				yData.push(chartBaseData[legendElem][el].rate.toFixed(2) * 100 || 0);
			});
			optionData.series.push({
				name: legendElem,
				type: 'bar',
				tooltip: {
					trigger: 'item'
				},
				// markPoint: {
				// 	data: [{
				// 		type: 'max',
				// 		name: '最大值'
				// 	}, {
				// 		type: 'min',
				// 		name: '最小值'
				// 	}]
				// },
				barGap: '5%',
				barCategoryGap: '60%',
				itemStyle: {
					normal: {
						color: color[index]
					}
				},
				data: yData
			});
		});


		return optionData;
	};

	/**
	 * 根据echart 数据源来修改整个option参数
	 * @param  {[type]} data 数据源
	 * @return {[type]}      返回option给echarts的对象使用
	 */
	OptionChart.prototype.chartOption = function(data, params) {
		var optionData = me.transformChartsData(data, params);
		var option = {
			tooltip: {
				trigger: 'axis'
			},
			legend: {
				data: optionData.legend
			},
			dataZoom: {
				show: !!(data && data.length > 15),
				realtime: true,
				start: 0,
				end: 100
			},
			calculable: true,
			xAxis: [{
				type: 'category',
				boundaryGap: true,
				data: optionData.time
			}],
			yAxis: [{
				type: 'value',
				name: '通过率 (%)',
				axisLabel: {
					formatter: '{value} '
				},
				splitArea: {
					show: true
				},
				max: 100,
				min: 0
			}],
			series: optionData.series
		};

		return option;
	};

	return new OptionChart();

});