/**
 * 防控管理module模块
 */
define(['ajaxModel'],function(ajaxModel){
	var Model = {

		//标记是否使用模拟数据
		isUseMock: false,

		//设置请求的根路径
		serviceHost: "/service/",

		//设置请求上下文
		serviceContext: "regist",
		//路径名
		//设置请求的url集合
		setActionUrl: function () {
			var self = this;
			return {
				//新建摄像机
				SAVE_CAMERADATA: (self.isUseMock ? "/module/maintenance/registrationManage/inc/saveCamera.json" : self.serviceHost + self.serviceContext + "/cameraDevice/add"),
				//编辑摄像机
				UPDATE_CAMERADATA: (self.isUseMock ? "/module/maintenance/registrationManage/inc/saveCamera.json" : self.serviceHost + self.serviceContext + "/cameraDevice/update"),
				//注销摄像机
				CANCEL_CAMERADATA: (self.isUseMock ? "/module/maintenance/registrationManage/inc/saveCamera.json" : self.serviceHost + self.serviceContext + "/cameraDevice/cancel"),
				//查询数据
				GET_SEARCH_CAMERADATA: (self.isUseMock ? "/module/maintenance/registrationManage/inc/cameraData.json" : self.serviceHost + self.serviceContext + "/cameraDevice/get_camera_list"),
				//批量进入平台
				BATCHENTER_PLATFORM:(self.isUseMock ? "/module/maintenance/registrationManage/inc/saveCamera.json" : self.serviceHost + self.serviceContext + "/cameraDevice/batchEnterPlatform"),
				//批量导入
				BATCH_IMPORT_PLATFORM:(self.isUseMock ? "/module/maintenance/registrationManage/inc/saveCamera.json" : self.serviceHost + self.serviceContext + "/cameraDevice/import"),
				//根据id查询摄像机信息
				GET_CAMERADATA_BY_ID:(self.isUseMock ? "/module/maintenance/registrationManage/inc/saveCamera.json" : self.serviceHost + self.serviceContext + "/cameraDevice/get_camera_Info")
			};
		},
		ajaxEvents: function(){
			var self = this;
			self.URLS = self.setActionUrl();
			return {
				saveCameraData:function(data,success,error){
					ajaxModel.postData(self.URLS.SAVE_CAMERADATA,data).then(success,error);
				},
				updateCmeraData:function(data,success,error){
					ajaxModel.postData(self.URLS.UPDATE_CAMERADATA,data).then(success,error);
				},
				cancelCmeraData:function(data,success,error){
					ajaxModel.getData(self.URLS.CANCEL_CAMERADATA,data).then(success,error);
				},
				getSearchPlatformList:function(data,custom,success,error){
					ajaxModel.getData(self.URLS.GET_SEARCH_CAMERADATA,data,custom).then(success,error);
				},
				batchEnterPlatform:function(data,success,error){
					ajaxModel.getData(self.URLS.BATCHENTER_PLATFORM,data).then(success,error);
				},
				batchImport:function(data,success,error){
					ajaxModel.getData(self.URLS.BATCH_IMPORT_PLATFORM,data).then(success,error);
				},
				getCameraByID:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_CAMERADATA_BY_ID,data).then(success,error);
				}
			};
		}
	};
	return {
		ajaxEvents: Model.ajaxEvents()
	};
});