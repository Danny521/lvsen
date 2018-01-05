/**
 *
 * @authors yuqiu (you@example.org)
 * @date    2014-10-10 15:56:13
 * @version $Id$
 */

/**
 * [控制正个逻辑交互，包括拿取数据，处理数据，数据交互之类的。]
 * @param  {[type]} require [description]
 * @param  {[type]} exports [description]
 * @param  {[type]} module  [description]
 * @return {[type]}         [description]
 */
define([
    'js/model/model',
    'js/controller/translate-data',
    'jquery'
], function(model, translate) {
	var view = '',
		statisticData = '',
		Controller = {
			init: function(viewModule) {
				var self = this,
					$listType = $('#list-type'),
					$chartType = $('#chart-type');
				view = viewModule;
				//绑定自定义事件
				view.registEvent({
					getUsersOfOrg: function(data) {
						self.getUsersOfOrg(data.id, data.remote);
					}
				});
				model.getCurrentOrgInfo().then(function(org) {
					view.setCurrentOrg(org);
					self.getUsersOfOrg(org.id, 0, model.getCurrentUser().id);
				});

				view.addPortTool();
				
				$('#search-data').on('click', function(event) {
					event.preventDefault();
					var params = view.getParams();
					view.loading(true);
					model.getStatisticData(params).then(function(res) {
						if (res.code === 200 && res.data.list && res.data.list.length) {
							statisticData = res.data.list;
							$('.data-chart .text-notice p').remove();
							$('#chart-item').show();
							self.chooseRanderDataType($("#chart-type .active").data("type"));
						}
						/*else if(res.code !== 200) {
							view.loading(false);
							notify.error(res.message);
						}*/
						else {
							$('.data-list-body').html('<p style="text-align:center; margin:20px;">暂时没有数据！</p>');
							$('.data-chart .text-notice').html('<p style="text-align:center; margin:20px;">暂时没有数据！</p>');
							statisticData = null;
							$('#chart-item').hide();
							view.loading(false);
						}
					}); //   /service/pvd1/incident_structure/lists  ../statistic/js/data.json
				});
				$chartType.on('click', '.chart-data-type', function() {
					var dataType = $(this).attr('data-type');
					$(this).addClass('active').siblings('button').removeClass('active');
					self.chooseRanderDataType(dataType);
				});
				//根据产品要求初始化时显示筛选结果
				$('#search-data').trigger('click');
			},
			chooseRanderDataType: function(type) {
				var self = this;
				if(statisticData === null){
					$('.data-list-body').html('<p style="text-align:center; margin:20px;">暂时没有数据！</p>');
					$('.data-chart .text-notice').html('<p style="text-align:center; margin:20px;">暂时没有数据！</p>');
					return;
				}
				if (type === 'year') {
					view.randerListHtml(self.translateYearData(statisticData));
				} else {
					view.randerListHtml(self.translateMonthData(statisticData));
				}
			},
			translateMonthData: function(list) {
				var listDataArray = [],
					self = this;
				$.each(list, function(index, val) {
					listDataArray.push(translate.translateDataToList('incident', '案事件', val));
					listDataArray.push(translate.translateDataToList('structure', '疑情信息', val));
				});
				view.randerCharts(translate.translateDataToChart(list));

				return listDataArray;
			},
			translateYearData: function(list) {
				var listDataArray = [],
					self = this;
				list = translate.translateDataFromMonthToYear(list);
				$.each(list, function(index, val) {
					listDataArray.push(translate.translateDataToList('incident', '案事件', val));
					listDataArray.push(translate.translateDataToList('structure', '疑情信息', val));
				});
				view.randerCharts(translate.translateDataToChart(list));

				return listDataArray;
			},
			getUsersOfOrg: function(orgId, remote, selectedUserId) {
				model.getUsersOfOrg(orgId, remote).then(function(users) {
					view.loadUsersOfOrg(users, selectedUserId);
				});
			}
		};

	return Controller;
});