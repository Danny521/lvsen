/**
 * 计划巡航module模块
 * @author：Leon.z
 * @date： 2016.1.29
 */
define(['ajaxModel'],function(ajaxModel){
	var Model = {
		//路径名
		URLS: {
			//获取巡航任务列表
			GET_INSPECT_TASKLIST: "/service/ptz_plan/getTaskList",
			//根据任务id获取详情
			GET_TASK_DETAIL:"/service/ptz_plan/getPresetByTaskId",
			//开启任务
			START_TASK_BY_TASKID:"/service/ptz_plan/start_task",
			//停止任务
			PAUSE_TASK_BY_TASKID:"/service/ptz_plan/stop_task",
			//删除任务
			DELETE_TASK_BY_TASKID:"/service/ptz_plan/delete_task",
			//获取摄像机预置位信息
			GET_PRESETS_BY_CAMERAID:"/service/ptz/get_presets",
			//添加巡航任务
			ADD_TASK:"/service/ptz_plan/add_task",
			//编辑巡航任务
			EDIT_TASK:"/service/ptz_plan/edit_task",
			//获取图片base路径
			GET_BASE64_URL:"/service/storage/createBase64",
			//根据摄像机id获取该摄像机的所在组织列表
			CAMERA_ORGS: "/service/defence/get_orgs_by_cameraId",
			//重名验证
			VALID_NAME:"/service/ptz_plan/task_name_valid",
			//新建分组
			NEWCREATE_GROUP:"/service/video_access_copy/create_group_with_group"

		},
		ajaxEvents: function(){
			var self = this;
			return {
				/**
				 * 获取左侧任务列表
				 * @param data - 参数信息
				 * @returns {*} - ajax对象，deffered
				 */
				getInspectTaskList: function (data,success,error) {
					ajaxModel.getData(self.URLS.GET_INSPECT_TASKLIST, data).then(success,error);
				},
				//获取单个任务详细信息
				getSingleDetail: function(data,custom,success,error) {
					ajaxModel.getData(self.URLS.GET_TASK_DETAIL,data,custom).then(success,error);
				},
				//启动任务
				startTaskByTaskid: function (data,success,error) {
					ajaxModel.getData(self.URLS.START_TASK_BY_TASKID, data).then(success,error);
				},
				//停止任务
				pauseTaskByTaskid: function (data,success,error) {
					ajaxModel.getData(self.URLS.PAUSE_TASK_BY_TASKID, data).then(success,error);
				},
				//删除任务
				deleteTaskByTaskid: function (data,success,error) {
					ajaxModel.getData(self.URLS.DELETE_TASK_BY_TASKID, data).then(success,error);
				},
				//添加巡航任务
				addInspectTask:function(data,success,error){
					ajaxModel.postData(self.URLS.ADD_TASK, data).then(success,error);
				},
				//编辑巡航任务
				editInspectTask:function(data,success,error){
					ajaxModel.postData(self.URLS.EDIT_TASK, data).then(success,error);
				},
				//获取预置位信息
				getPresetsByCameraId: function (data,success,error) {
					ajaxModel.getData(self.URLS.GET_PRESETS_BY_CAMERAID, data).then(success,error);
				},
				//获取base64地址
				getBase64Url:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_BASE64_URL, data).then(success,error);
				},
				//获取组织
				getCameraOrgs:function(data,success,error){
					ajaxModel.getData(self.URLS.CAMERA_ORGS, data).then(success,error);
				},
				//重名验证
				validName:function(data,success,error){
					ajaxModel.getData(self.URLS.VALID_NAME, data).then(success,error);
				},
				//新建分组
				createNewGroup:function(data,success,error){
					ajaxModel.postData(self.URLS.NEWCREATE_GROUP, data).then(success,error);
				}
			};
		}
	};
	return {
		ajaxEvents: Model.ajaxEvents()
	}
});