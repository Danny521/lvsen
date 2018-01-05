/*
	布控任务 联动选择 model层
 */
define(['ajaxModel'], function(ajaxModel) {
	var urlMap = {
		// 展示联动选择面板的模板
		"linkagePanelTemp": "/module/protection-monitor/defencesetting/inc/control/control-linkage.html",
		//展示布防联动规则
		"DefenceLinkagePanelTemp": "/module/protection-monitor/defencesetting/inc/defence/defence-linkage.html",
		// 添加联动规则 单个
		"addLinkage": "/service/alarm_notify/insert",
		// 添加联动规则 批次
		"addLinkageBatch": "/service/alarm_notify/batch_insert",
		// 获取联动规则
		"getLinkage": "/service/alarm_notify/get_list",
		// 删除联动规则
		"deleteLinkage": "/service/alarm_notify/delete",
		//查询预置位
		"getPtzPreset" :"/service/ptz/get_presets",
		//设置电视墙
		"setTvWall":"/service/config/tvwall/layouts"
	};

	return {
		getTml: function(name, data, custom) {
			return ajaxModel.getTml(urlMap[name]);
		},
		getData: function(name, data, custom) {
			return ajaxModel.getData(urlMap[name], data, custom);
		},
		postData: function(name, data, custom) {
			return ajaxModel.postData(urlMap[name], data, custom)
		},
		when: function(ajaxList) {
			return jQuery.when.apply(null, ajaxList);
		}
	}
})