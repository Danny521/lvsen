/**
 * 防控管理全局变量
 * @author chengyao
 * @date   2014-12-08
 */
define(['jquery.pagination'],function(){
	return {
		//布防管理保存当前组织信息
		curDepartment: {
			id: "",
			name: "",
			parentId: "",
			department_id: "",
			department_level: "",
			description: "",
			expire: "",
			max_cameras: 0,
			max_tasks: 0,
			cur_cameras: 0,
			cur_tasks: 0
		},
		//防控管理的配置信息
		configInfo:{
			//布防任务列表分页大小
			defencePageSize: 10,
			//布控任务列表分页大小
			controlTaskPageSize: 5,
			//人员库人员分页大小
			peopleListPageSize:10,
			//人员库分页大小
			peopleLibPageSize: 5
		},
		//布防管理组织树
		orgTree: null,
		//保存面包屑
		steps: [],
		//模板
		templateUrl: "/module/protection-monitor/defencesetting/inc/control/prevention-control-mgr-template.html",
		//调用模板方法
		template : null,
		//布控管理地图对象
		map : null,
		//摄像机图层
		cameraLayer: null,
		//视频播放对象
		videoPlayerSigle : null,
		//信息窗
		infowindow : null
	};
});