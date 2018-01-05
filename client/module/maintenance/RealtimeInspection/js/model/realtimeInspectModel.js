/**
 * 运维管理module模块
 */
define(['ajaxModel'],function(ajaxModel){
	var Model = {
		//路径名
		URLS: {
			GETREAL_INSPCT_TASKLIST:"/service/inspect/task/get_task_list",
			ADD_INSPECT_TASK:"/service/inspect/task/add_inspect_task",
			DELETE_INSPECT_TASK:"/service/inspect/task/delete_inspect_task",
			GET_TASKRUN_STATUS:"/service/inspect/task/task_process",
			GET_TASKRUN_INFO:"/service/inspect/real/getTaskInfoByTaskId",
			GET_TASKRUN_RECORD:"/service/inspect/real/get_record_list",
			RELOAD_TASKRUN_BY_TASKID:"/service/inspect/task/reload_task",
			EXPORT_TASK_EXCEL:"/service/inspect/real/export",
			IS_EXISTS_TASKNAME:"/service/inspect/task/is_exists_taskName",
			IS_EXISTS_PLANNAME:"/service/check/verify_taskplan_name", // 计划名称是否存在
			GET_PLAN_RECORD:"/service/inspect/real/plan_task_records", //查询配置巡检计划结果
			GET_PLAN_EXP:"/service/inspect/real/taskPlan/export" //导出巡检计划结果

		},
		ajaxEvents: function(){
			var self = this;
			return {
				/**
				 * 获取实时巡检任务列表数据
				 * @param data - 参数信息
				 * @returns {*} - ajax对象，deffered
				 */
				getRealInspectData: function (data,success,error) {
					ajaxModel.getData(self.URLS.GETREAL_INSPCT_TASKLIST,data).then(success,error);
				},
				/**
				 * 添加实时巡检任务
				 */
				addRealInspectTask: function (data,success,error) {
					ajaxModel.postData(self.URLS.ADD_INSPECT_TASK, data).then(success,error);
				},
				/**
				 * 删除实时巡检任务
				 */
				DeleteRealInspectTask: function (data,success,error) {
					ajaxModel.getData(self.URLS.DELETE_INSPECT_TASK+"?taskId="+data.taskid).then(success,error);
				},
				/**
				 * 获取实时巡检任务进度
				 */
				getRealInspectTaskPro: function (data,success,error) {
					ajaxModel.postData(self.URLS.GET_TASKRUN_STATUS+"?taskIds="+data.taskid).then(success,error);
				},
				/**
				 * 获取实时巡检任务概要信息
				 */
				getRealInspectTaskRecord: function (data,success,error) {
					ajaxModel.getData(self.URLS.GET_TASKRUN_RECORD, data).then(success,error);
				},
				/**
				 * 获取实时巡检计划概要信息
				 */
				getRealInspectPlanInfo: function (data,success,error) {
					//ajaxModel.getData(self.URLS.GET_PLAN_RECORD+"?planTaskId="+data.planTaskId+"&cameraName="+data.cameraName+"&status="+data.status+"&pageNo="+data.pageNo+"&pageSize="+data.pageSize+"&startTime="+data.startTime+"&endTime="+data.endTime).then(success,error);
					ajaxModel.getData(self.URLS.GET_PLAN_RECORD,data).then(success,error);
				},
				/**
				 * 巡检计划导出
				 */
				getRealInspectPlanExport: function (data,success,error) {
					//ajaxModel.getData(self.URLS.GET_PLAN_RECORD+"?planTaskId="+data.planTaskId+"&cameraName="+data.cameraName+"&status="+data.status+"&pageNo="+data.pageNo+"&pageSize="+data.pageSize+"&startTime="+data.startTime+"&endTime="+data.endTime).then(success,error);
					ajaxModel.getData(self.URLS.GET_PLAN_EXP,data).then(success,error);
				},
				/**
				 * 获取实时巡检任务概要信息
				 */
				getRealInspectTaskInfo: function (data,success,error) {
					ajaxModel.getData(self.URLS.GET_TASKRUN_INFO+"?taskId="+data.taskid).then(success,error);
				},
				/**
				 * 重启实时巡检任务
				 */
				reloadRealInspectTask: function (data,success,error) {
					ajaxModel.getData(self.URLS.RELOAD_TASKRUN_BY_TASKID+"?taskId="+data.taskid).then(success,error);
				},

				/**
				 * 任务名称校验
				 */
				checkName: function (data,success,error) {
					ajaxModel.getData(self.URLS.IS_EXISTS_TASKNAME,data).then(success,error);
				},
				/**
				 * 计划列表名称校验
				 */
				checkPlanName: function (data,success,error) {
					ajaxModel.postData(self.URLS.IS_EXISTS_PLANNAME,data).then(success,error);
				}
			};
		}
	};
	return {
		ajaxEvents: Model.ajaxEvents()
	}
});
