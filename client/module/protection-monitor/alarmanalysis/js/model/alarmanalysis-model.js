/**
 * ajax请求模块(Model)
 * @author chengyao
 * @date   2014-12-08
 */
define([
	'ajaxModel'
	],function(ajaxModel){
	var Model = {
		URLS : {
			//获取历史报警列表
			GET_HIS_LIST : "/service/defence/three/history/",
			//获取历史报警总数
			GET_HIS_STAT : "/service/defence/three/history/count/",
			//获取单个报警信息
			GET_SINGLE_ALARM : "/service/events/",
			//人脸布控报警信息单独处理
			DEAL_PEOPLE_CTRL : "/service/events/ctrl/",
			//布防报警信息单独处理
			DEAL_DEFENCE : "/service/events/defence/",
			//获取录像信息
			GET_CAMERA_INF : "/service/events/camera/",
			//获取历史录像的深度
			GET_HIS_DEPTH : "/service/history/list_history_videos_other",
			//获取统计分析列表
			GET_STAT_LIST : "/service/events/history/summary/",
			//获取图片base路径
			GET_BASE64_URL:"/service/storage/createBase64"
		},
		ajaxEvent: function() {
			var self = this;
			return {
				//获取历史报警列表
				getHisList:function(data,beforeSend,success,error){
					ajaxModel.getData(self.URLS.GET_HIS_LIST + data.id,data, {beforeSend:beforeSend}).then(success,error);
				},
				//获取历史报警总数
				getHisStat:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_HIS_STAT + data.id,data).then(success,error);
				},
				//获取单个报警信息
				getSingleAlarm: function(data, beforeSend,success,error) {
					ajaxModel.getData(self.URLS.GET_SINGLE_ALARM + data.id, data, {beforeSend:beforeSend}).then(success,error);
				},
				//人脸布控报警信息单独处理
				dealPeopleCtrl:function(data, beforeSend,success,error){
					ajaxModel.postData(self.URLS.DEAL_PEOPLE_CTRL + data.id, data, {beforeSend:beforeSend}).then(success,error);
				},
				//布防报警信息单独处理
				dealDefence:function(data, beforeSend,success,error){
					ajaxModel.postData(self.URLS.DEAL_DEFENCE + data.id, data, {beforeSend:beforeSend}).then(success,error);
				},
				//获取录像信息
				getCameraInf:function(dataEx,beforeSend,success,error){
					ajaxModel.getData(self.URLS.GET_CAMERA_INF + dataEx.alarmid).then(success,error);
				},
				//获取历史录像的深度
				getHisDepth:function(data,beforeSend,success,error){
					ajaxModel.getData(self.URLS.GET_HIS_DEPTH, data).then(success,error);
				},
				//获取统计分析列表
				getStatList:function(data,beforeSend,success,error){
					ajaxModel.getData(self.URLS.GET_STAT_LIST + data.id, data, {beforeSend:beforeSend}).then(success,error);
				},
				//获取base64地址
				getBase64Url:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_BASE64_URL, data).then(success,error);
				}
			};
		}
		
	};
	return {
		ajaxEvent : Model.ajaxEvent()
	}
});