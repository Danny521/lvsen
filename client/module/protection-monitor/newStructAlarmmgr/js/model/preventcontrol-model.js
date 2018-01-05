/**
 * 防控管理module模块
 */
define(['ajaxModel'],function(ajaxModel){
	var Model = {
		//路径名
		URLS: {
		//根据摄像机id获取摄像机详细信息
		Get_Camera_Info_By_cameraId: "/service/defence/getChannelInfos",

		Get_CTRTASK_Info_By_cameraId:"/service/defence/get_deployctl_point?camera_id=",
		/**
		 * 布防任务管理
		 */
		//获取所有布防摄像机下的布防任务
		GET_ALL_CAMERA_ALL_TASK:'/service/defence/tasks/cameras/',
		//根据摄像机获取布防任务列表
		GET_ALL_TASK_BYCAMERA:'/service/defence/get_task_by_camera',
		//调用获取摄像机列表接口
		GET_CAMERA_LIST: '/service/defence/get_all_defence_task/',
		//获取布防摄像机布防任务列表
		GET_TASK_BY_CAMERA: '/service/defence/tasks',
		//与布防摄像机有关的接口（1、开启/停止布防某摄像机 2、删除布防摄像机任务）
		CAMERA_WITH_TASK:'/service/defence/task/',
		//删除布防摄像机
		DELETE_PROTECT_CAMERA:'/service/defence/camera/',
		//根据当前的组织id，获取当前组织下的布防限制信息
		GET_DEFENCE_LIMIT_INFO:'/service/defence/defenceNumber/info',
		//保存布防路数
		SAVE_LIMIT_INFO:'/service/defence/defenceNumber/addOrUpdate',
		/**
		 * 布控任务管理
		 */

		//搜索布控任务
		SEARCH_CONTROL_TASK:'/service/deploycontrol/tasks',
		//布控任务重名验证
		CONTROL_TASK_CHECK:'/service/deploycontrol/task/exists',
		//获取资源摄像机
		GET_RESOURCE_CAMERA:'/service/map_new/map_all_camera',
		//根据ID获取摄像机信息
		GET_CAMERA_INFO_BY_ID:'/service/video_access_copy/accessChannels',
		//与单个布控任务相关的公用接口
		SINGLE_CONTROL_TASK:'/service/deploycontrol/task',
		//获取所有布控库
		GET_ALL_PERSONLIB:'/service/deploycontrol/personLibs?pageNum=&pageSize=',
		//获取框选范围内的摄像机
		GET_SELECTED_CAMERA:'/service/map_new/get_geometry_camera',
		//获取被勾选组织下所有的摄像机信息列表
		GET_SELECT_CAMERA_INFO:'/service/video_access_copy/recursion_list_camera?&r=' + Math.random(),
		//根据组织ID获取组织下所有摄像机id列表
		GET_CAMERA_ID_BY_ORG:'/service/video_access_copy/recursion_list_camera_id',
		/**
		 * 人员布控
		 */
		//获取布控库列表
		GET_LIB_LIST:'/service/deploycontrol/personLibs',
		//布控库重名检验
		PEOPLE_LIB_CHECK:'/service/deploycontrol/personLib/exists',
		//布控库编辑保存(删除)
		PEOPLE_LIB_SAVE:'/service/deploycontrol/personLib',
		//获取某人员分库信息
		GET_SINGLE_LIB_INFO:'/service/deploycontrol/personLib/personnels',
		//对某布控库的中的人员操作(删除,转移,新增,查看)
		DEAL_SINGLE_PEOPLE:'/service/deploycontrol/personnel',
		//批量删除人员信息
		BATCH_REMOVE_PERSON:'/service/deploycontrol/personnels',
		//清除已选图片
		REMOVE_SELECT_PIC:'/service/deploycontrol/personnel/uploadImg',
		// 一键开启或者关闭所有任务
		TOGGLE_ALL_TASK_STATUS: "/service/defence/task",
		//获取图片base路径
		GET_BASE64_URL:"/service/storage/createBase64",
		//判断设置任务数是否上限
		GET_TASK_NUMLIMIT:"/service/defence/limit"
		},

		ajaxEvents: function(){
			var self = this;
			return {
				/**
				 * 根据摄像机id获取摄像机详细信息
				 * @param data - 参数信息
				 * @returns {*} - ajax对象，deffered
				 */
				getCameraInfoByCameraId: function (data,success,error) {
					ajaxModel.getData(self.URLS.Get_Camera_Info_By_cameraId, data).then(success,error);
				},
				getCtrTaskInfoByCameraId: function (data,success,error) {
					ajaxModel.getData(self.URLS.Get_CTRTASK_Info_By_cameraId + data.camera_id, data).then(success,error);
				},
				/**
				 * 布防任务管理
				 */
				//获取所有布防摄像机下的布防任务
				getAllCameraAllTask:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_ALL_CAMERA_ALL_TASK + data.ids,data).then(success,error);
				},
				//调用获取摄像机列表接口
				getCameraList:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_CAMERA_LIST,data).then(success,error);
				},
				//根据获取布防任务列表接口
				getTaskListByCamera:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_ALL_TASK_BYCAMERA,data).then(success,error);
				},
				
				//获取布防摄像机布防任务列表
				getTaskByCamera:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_TASK_BY_CAMERA,data).then(success,error);
				},
				//开启/停止布防某摄像机
				switchCameraProtectStatus:function(data,success,error){
					ajaxModel.postData(self.URLS.CAMERA_WITH_TASK + data.taskId,data).then(success,error);
				},
				//删除布防摄像机
				delProtectCamera:function(data,success,error){
					ajaxModel.postData(self.URLS.DELETE_PROTECT_CAMERA + data.cameraId, data).then(success,error);
				},
				//删除布防摄像机任务
				delTaskById:function(data,success,error){
					ajaxModel.postData(self.URLS.CAMERA_WITH_TASK + data.taskId,data).then(success,error);
				},
				//根据当前的组织id，获取当前组织下的布防限制信息
				getDefenceLimitInfo: function(data,success,error){
					ajaxModel.getData(self.URLS.GET_DEFENCE_LIMIT_INFO,data).then(success,error);
				},
				//保存布防路数
				saveLimitInfo:function(data,success,error){
					ajaxModel.postData(self.URLS.SAVE_LIMIT_INFO,data).then(success,error);
				},
				/**
				 * 布控任务管理
				 */
				//搜索布控任务
				searchControlTask:function(data,success,error){
					ajaxModel.getData(self.URLS.SEARCH_CONTROL_TASK,data).then(success,error);
				},
				//布控任务重名校验
				controlTaskCheck:function(data,success,error){
					ajaxModel.getData(self.URLS.CONTROL_TASK_CHECK,data).then(success,error);
				},
				//获取资源摄像机
				getResourceCamera:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_RESOURCE_CAMERA,data).then(success,error);
				},
				//根据ID获取摄像机信息
				getCameraInfoById:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_CAMERA_INFO_BY_ID,data).then(success,error);
				},
				//根据id获取布控任务详情(编辑任务时用)
				getControlTaskInfo:function(data,success,error){
					ajaxModel.getData(self.URLS.SINGLE_CONTROL_TASK+'/' + data.id,data).then(success,error);
				},
				//获取所有布控库
				getAllPersonLib:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_ALL_PERSONLIB,data).then(success,error);
				},
				//查看任务
				checkSingleTask:function(data,success,error){
					ajaxModel.getData(self.URLS.SINGLE_CONTROL_TASK+'/view/'+data.id).then(success,error);
				},
				//保存布控任务
				saveControlTask:function(data,success,error){
					if (data.id && data.id !== "") {
						ajaxModel.postData(self.URLS.SINGLE_CONTROL_TASK+'/'+data.id,data).then(success,error);
					}else{
						ajaxModel.postData(self.URLS.SINGLE_CONTROL_TASK,data).then(success,error);
					}
				},
				//撤销任务
				cancelControlTask:function(data,success,error){
					ajaxModel.getData(self.URLS.SINGLE_CONTROL_TASK +'/'+ data.id + "/status/" + data.status,data).then(success,error);
				},
				//删除任务
				removeTask:function(data,success,error){
					ajaxModel.postData(self.URLS.SINGLE_CONTROL_TASK+'/' + data.id + '?_method=delete',data).then(success,error);
				},
				//获取框选范围内的摄像机
				getSelectedCamera:function(data,success,error){
					ajaxModel.postData(self.URLS.GET_SELECTED_CAMERA,data).then(success,error);
				},
				//获取被勾选组织下所有的摄像机信息列表
				getSelectCamerInfo:function(data,custom,success,error){
					ajaxModel.getData(self.URLS.GET_SELECT_CAMERA_INFO,data,custom).then(success,error);
				},
				//根据组织ID获取组织下所有摄像机id列表
				getCmeraIdByOrg:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_CAMERA_ID_BY_ORG,data).then(success,error);
				},
				/**
				 * 人员布控
				 */
				//获取布控库列表
				getLibList:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_LIB_LIST,data).then(success,error);
				},
				//布控库重名检验
				checkPeopleLib:function(data,success,error){
					ajaxModel.getData(self.URLS.PEOPLE_LIB_CHECK,data).then(success,error);
				},
				//布控库编辑保存
				savePeopleLib:function(data,success,error){
					ajaxModel.postData(self.URLS.PEOPLE_LIB_SAVE,data).then(success,error);
				},
				//获取某人员分库信息
				getSingleLibInfo:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_SINGLE_LIB_INFO,data).then(success,error);
				},
				//删除某人员布控库
				deletePersonLib:function(data,success,error){
					ajaxModel.postData(self.URLS.PEOPLE_LIB_SAVE +'/'+ data.id,data).then(success,error);	
				},
				//删除某布控库的中的人员
				deletePeople:function(data,success,error){
					ajaxModel.postData(self.URLS.DEAL_SINGLE_PEOPLE+'/'+ data.id,data).then(success,error);					
				},
				//获取待转移人员库
				getPersonMoveLib:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_LIB_LIST +'/'+ data.libId,data).then(success,error);	
				},
				//保存人员转移
				savePersonMove:function(data,success,error){
					ajaxModel.postData(self.URLS.DEAL_SINGLE_PEOPLE+'/'+ data.personId + "/move",data).then(success,error);
				},
				//新增&编辑人员保存
				savePerson:function(data,success,error){
					if (data.id && data.id !=="") {
						ajaxModel.postData(self.URLS.DEAL_SINGLE_PEOPLE+'/'+ data.id,data).then(success,error);
					}else{
						ajaxModel.postData(self.URLS.DEAL_SINGLE_PEOPLE,data).then(success,error);
					}
				},
				//根据人员id获取人员的详细信息
				getPersonInfo:function(data,success,error){
					ajaxModel.getData(self.URLS.DEAL_SINGLE_PEOPLE+'/'+ data.id,data).then(success,error);
				},
				//批量删除人员信息
				batchRemovePerson:function(data,custom,success,error){
					ajaxModel.postData(self.URLS.BATCH_REMOVE_PERSON,data,custom).then(success,error);
				},
				//清除已选图片
				removeSelectPic:function(data,success,error){
					ajaxModel.postData(self.URLS.REMOVE_SELECT_PIC,data).then(success,error);
				},
				// 一键开启或者关闭全部任务
				toggleAllTaskStatus: function(data,custom,success,error) {
					ajaxModel.postData(self.URLS.TOGGLE_ALL_TASK_STATUS,data,custom).then(success,error);
				},
				//获取base64地址
				getBase64Url:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_BASE64_URL, data).then(success,error);
				},
				//判断任务设置是否上限
				getMaxLimit:function(data,success,error){
					ajaxModel.getData(self.URLS.GET_TASK_NUMLIMIT, data).then(success,error);
				}
			};
		}
	};
	return {
		ajaxEvents: Model.ajaxEvents()
	}
});