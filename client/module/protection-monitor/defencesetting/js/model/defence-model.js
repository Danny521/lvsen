/*
	布防任务设置 model层
 */
define(['ajaxModel'], function(ajaxModel) {
	var urlMap = {
		// 页面主体框架模板
		"defence-main-template": "/module/protection-monitor/defencesetting/inc/defence/main.html",
		"defence-first-step-template": "/module/protection-monitor/defencesetting/inc/defence/first-step.html",
		"defence-second-step-template": "/module/protection-monitor/defencesetting/inc/defence/second-step.html",
		"defence-third-step-template": "/module/protection-monitor/defencesetting/inc/defence/third-step.html",
		"pvaMapTemplate": "/module/protection-monitor/defencesetting/inc/pva-map.html",
		// 布防规则设置-算法列表接口
		"defenceRuleList": "/service/defence/get_defence_algorithm_list",
		// 获取某摄像机下设置过的算法事件列表
		"getDefenceInfoByCameraId": "/service/defence/get_defence_status_by_camera",
		"getAlarmTypeList": "/service/defence/events/algorithms/",
		"GetCarOrPeopleNum": "/service/defence/events/countType/",
		//根据规则id获取对应的规则细节
		"getAlarmRuleDetial": "/service/defence/get_defence_Info",
		//根据base64图像的二进制数据格式化图像
		"formateImgData": "/service/pvd/upload/base64",
		//根据摄像机id获取该摄像机参与过的布控任务
		"getCurCameraProtectLists": "/service/deploycontrol/camera/tasks",
		//读取数据并渲染当前摄像机为参与的布控任务列表
		"getNoSelectProtectByCameraId": "/service/deploycontrol/camera/tasks",
		// 根据任务id删除当前摄像机的布控任务
		"deleteCameraByTaskId": "/service/deploycontrol/task",
		// 获取摄像机某个布控任务的详情
		"getProtectTaskDetails": "/service/deploycontrol/task",
		// 获取摄像机的channel信息
		"getOnlineChannel": "/service/defence/getChannelInfos",
		// 将摄像机添加到已选的布控任务中
		"insertCameraToProtectTask": "/service/deploycontrol/camera/totask",
		// 人脸检测算法，人脸布控任务保存
		"saveTaskDetailByTaskId": "/service/deploycontrol/task",
		// 布防任务保存数据接口
		"saveCameraRuleDetail": "/service/defence/add_or_update_defence",
		//删除布防规则用
		"delCameraRuleDetail": "/service/defence/task",
		// 根据cameraid获取组织id
		"getOrgidByCameraid": "/service/resource/get_orgId",
		//根据组织id获取对应的布防信息
		"checkCameraLimitAllow": "/service/defence/defenceNumber/info",
		//根据摄像机id获取摄像机详细信息
		"getCameraInfoById": "/service/defence/getChannelInfos",
		//根据摄像机id获取该摄像机的所在组织列表
		"cameraOrgs": "/service/defence/get_orgs_by_cameraId"
	};

	return {
		getTml: function(name, data, custom) {
			return ajaxModel.getTml(urlMap[name]);
		},
		getData: function(name, data, custom, moreUrl) {
			moreUrl = moreUrl === undefined ? "" : moreUrl;
			return ajaxModel.getData(urlMap[name] + moreUrl, data, custom);
		},
		postData: function(name, data, custom, moreUrl) {
			moreUrl = moreUrl === undefined ? "" : moreUrl;
			return ajaxModel.postData(urlMap[name] + moreUrl, data, custom)
		},
		when: function(ajaxList) {
			return jQuery.when.apply(null, ajaxList);
		}
	}
})