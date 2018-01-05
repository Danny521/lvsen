/*
	布控任务设置 model层
 */
define(['ajaxModel'], function(ajaxModel) {
	var urlMap = {
		"orgFilter": "/module/common/org-filter/inc/filter-org-panel.html"
	};

	return {
		getTml: function (name, data, custom) {
			return ajaxModel.getTml(urlMap[name]);
		},
		getData: function (name, data, custom, moreUrl) {
			moreUrl = moreUrl === undefined ? "" : moreUrl;
			return ajaxModel.getData(urlMap[name] + moreUrl, data, custom);
		},
		postData: function (name, data, custom, moreUrl) {
			moreUrl = moreUrl === undefined ? "" : moreUrl;
			return ajaxModel.postData(urlMap[name] + moreUrl, data, custom)
		},
		when: function (ajaxList) {
			return jQuery.when.apply(null, ajaxList);
		}
	}
});