/*
	布控任务设置 model层
 */
define(['ajaxModel'], function(ajaxModel) {
	var urlMap = {
		"chooseCamerasPanel": "/module/inspect/monitor/inc/choose-camera-panel.html",
		"addOrEditMyGroupPanel": "/module/inspect/monitor/inc/add-and-edit-my-group.html",
		"addOrEditgroupOcx":"/module/inspect/monitor/inc/mygroup-ocxPlay.html",
		// 根据组织id获取组织下的所有摄像机
		"getCamerasByOrgId": "/service/video_access_copy/recursion_list_camera"
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