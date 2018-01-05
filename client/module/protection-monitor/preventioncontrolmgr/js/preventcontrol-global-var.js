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
		taskSetOptions:{
			maxSetNum:0
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
		//任务树组织树
		taskOrgTree:null,
		//保存面包屑
		steps: [],
		//模板
		templateUrl: "/module/protection-monitor/preventioncontrolmgr/inc/prevention-control-mgr-template.html",
		//调用模板方法
		template : null,
		//布控管理地图对象
		map : null,
		//摄像机图层
		cameraLayer: null,
		//视频播放对象
		videoPlayerSigle : null,
		//信息窗
		infowindow : null,
		//摄像机图标标示
		cameraSymbol: {
			cameraGunOnline: function() {
				var icon = new NPMapLib.Symbols.Icon("/module/common/images/map/camera-gun-online.png", new NPMapLib.Geometry.Size(20, 20));	 			
				icon.setAnchor(new NPMapLib.Geometry.Size(-10,-10));
				return  icon;
			},
			cameraGunOffline: function() {
				var icon = new NPMapLib.Symbols.Icon("/module/common/images/map/camera-gun-offline.png", new NPMapLib.Geometry.Size(20, 20));
				icon.setAnchor(new NPMapLib.Geometry.Size(-10,-10));
				return  icon;
			},
			cameraBallOnline: function() {
				var icon = new NPMapLib.Symbols.Icon("/module/common/images/map/camera-ball-online.png", new NPMapLib.Geometry.Size(20, 20));
				icon.setAnchor(new NPMapLib.Geometry.Size(-10,-10));
				return  icon;
			},
			cameraBallOffline: function() {
				var icon = new NPMapLib.Symbols.Icon("/module/common/images/map/camera-ball-offline.png", new NPMapLib.Geometry.Size(20, 20));
				icon.setAnchor(new NPMapLib.Geometry.Size(-10,-10));
				return  icon;
			},
			cameraGunHdOnline: function() {
				var icon = new NPMapLib.Symbols.Icon("/module/common/images/map/camera-gun-HD-online.png", new NPMapLib.Geometry.Size(20, 20));	 			
				icon.setAnchor(new NPMapLib.Geometry.Size(-10,-10));
				return  icon;
			},
			cameraGunHdOffline: function() {
				var icon = new NPMapLib.Symbols.Icon("/module/common/images/map/camera-gun-HD-offline.png", new NPMapLib.Geometry.Size(20, 20));
				icon.setAnchor(new NPMapLib.Geometry.Size(-10,-10));
				return  icon;
			},
			cameraBallHdOnline: function() {
				var icon = new NPMapLib.Symbols.Icon("/module/common/images/map/camera-ball-HD-online.png", new NPMapLib.Geometry.Size(20, 20));
				icon.setAnchor(new NPMapLib.Geometry.Size(-10,-10));
				return  icon;
			},
			cameraBallHdOffline: function() {
				var icon = new NPMapLib.Symbols.Icon("/module/common/images/map/camera-ball-HD-offline.png", new NPMapLib.Geometry.Size(20, 20));
				icon.setAnchor(new NPMapLib.Geometry.Size(-10,-10));
				return  icon;
			}
		},
		//分页方法
		setPagination: function(total, selector, itemsPerPage, callback) {
			jQuery(selector).pagination(total, {
				items_per_page: itemsPerPage,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
				}
			});
		}
	};
});