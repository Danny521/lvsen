/**
 *
 * @authors 于秋 (you@example.org)
 * @date    2014-10-13 14:39:26
 * @version $Id$
 */
/**
 * [把后端传回来的json数据转成列表能用的格式]
 * @param  {[type]} require [description]
 * @param  {[type]} exports [description]
 * @param  {[type]} module  [description]
 * @return {[type]}         [description]
 */
define([
    'js/controller/option',
    'jquery',
    'echarts-plain'
], function(option) {
	var Translate = {
			/**
			 * [translateDataToList 数据转成列表能用的格式]
			 * @param  {[type]} type     [数据中要用字段名字]
			 * @param  {[type]} tyepName [案事件 和 疑情信息 ]
			 * @param  {[type]} val      [传入的数据]
			 * @return {[type]}          [返回一个对象，包含列表要用到的东西]
			 */
			translateDataToList: function(type, tyepName, val) {
				var listDataObject = {};
				if ($("#statisticType").val() == "1" && $("#userSelector").find("option:selected").val()) {
					listDataObject.name = $("#userSelector").find("option:selected").text();
				} else {
					listDataObject.name = $('#orgSelectTrigger').val();
				}
				listDataObject.time = val.time;
				listDataObject.type = tyepName;
				listDataObject.total = +val[type + 'AuditNumbers'];
				listDataObject.back = +val[type + 'BackNumbers'];
				listDataObject.pass = listDataObject.total - listDataObject.back;
				listDataObject.rate = (listDataObject.pass / listDataObject.total).toFixed(2) * 100 || 0;
				return listDataObject;
			},
			/**
			 * [translateDataToChart 转化echart的option]
			 * @param  {[type]} listData [原始后端的数据]
			 * @return {[type]}          [echart能使用的option]
			 */
			translateDataToChart: function(listData) {
				var chartOption = option.chartOption(listData);
				return chartOption;
			},
			/**
			 * [translateDataFromMonthToYear 把已存在的月单位数据转成年单位数据]
			 * @param  {[type]} listData [原始后端的数据]
			 * @return {[type]}          [年为单位的数据]
			 */
			translateDataFromMonthToYear: function(listData) {
				var timeKey = [],
					object = {},
					dataJson = [];
				$.each(listData, function(index, el) {
					var year = el.time.split('-')[0];
					if (!timeKey.contains(year)) {
						timeKey.push(year);
					}
					object[year] = object[year] || {
						incidentAuditNumbers: 0,
						incidentBackNumbers: 0,
						structureAuditNumbers: 0,
						structureBackNumbers: 0
					};
					object[year].time = year;
					object[year].incidentAuditNumbers += +el.incidentAuditNumbers;
					object[year].incidentBackNumbers += +el.incidentBackNumbers;
					object[year].structureAuditNumbers += +el.structureAuditNumbers;
					object[year].structureBackNumbers += +el.structureBackNumbers;
				});
				$.each(object, function(index, val) {
					dataJson.push(val);
				});

				return dataJson;
			}
		};

	return Translate;
});