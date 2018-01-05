/**
 * Created by Mayue on 2014/12/9.
 */
define(['ajaxModel'], function(ajaxModel) {

	var Module = function(pb, options, callback) {
		var self = this;
	};

	Module.prototype = {
		URLS: {
			GET_ALL_WATCH: "/service/watch/get_watch_groups",
			GET_WATCH_CAMERAS: '/service/watch/get_watch_cameras',
			DELETE_WATCH_GROUP: '/service/watch/delete_watch_group',
			GET_WATCH_TIME: '/service/watch/get_watch_time',
			MODIFY_WATCH_CAMERA: '/service/watch/modify_watch_camera',
			ADD_WATCH_TIME: '/service/watch/add_watch_time',
			VERIFY_WATCH_GROUP: '/service/watch/verify_watch_group',
			ADD_WATCH_GROUP: '/service/watch/add_watch_group',
			GET_CAMERAS_ID: '/service/video_access_copy/recursion_list_camera_id',
			GET_CAMERAS: 'service/video_access_copy/recursion_list_camera',
			ADD_WATCH_CAMERA: '/service/watch/add_watch_camera',
			ADD_CAMERA_WATCH:'/service/watch/add_camera_watch'
		},

		/**
		 * 获取所有监巡分组信息
		 * @author Mayue
		 * @date   2014-12-17
		 * @return {[type]}   [description]
		 */
		getAllGroup: function() {
			return ajaxModel.getData(this.URLS.GET_ALL_WATCH);
		},
		/**
		 * 取消“获取所有监巡分组信息”  方便为了保持单例
		 * @author Mayue
		 * @date   2014-12-17
		 * @return {[type]}   [description]
		 */
		cancelGetAllGroup: function() {
			return ajaxModel.abortAjax(this.URLS.GET_ALL_WATCH);
		},
		/**
		 * 根据id获取指定监巡分组信息
		 * @author Mayue
		 * @date   2014-12-17
		 * @param  {[type]}   watchId 监巡分组ID
		 * @return {[type]}   [description]
		 */
		getGroup: function(watchId) {
			return ajaxModel.getData(this.URLS.GET_WATCH_CAMERAS, {
				watchId: watchId
			});
		},
		/**
		 * 删除某一个监巡分组(watchId)
		 * @author Mayue
		 * @date   2014-12-17
		 * @param  {[type]}   watchId [监巡分组ID]
		 * @return {[type]}           [description]
		 */
		deleteGroup: function(watchId) {
			return ajaxModel.postData(this.URLS.DELETE_WATCH_GROUP, {
				watchId: watchId
			});
		},

		/**
		 * 获取某一个监巡分组的时间信息
		 * @author Mayue
		 * @date   2014-12-17
		 * @param  {[type]}   watchId [监巡分组ID]
		 * @return {[type]}           [description]
		 */
		getGroupTime: function(watchId) {
			return ajaxModel.getData(this.URLS.GET_WATCH_TIME, {
				watchId: watchId
			});
		},

		/**
		 * [保存修改后的布局]
		 * @author Mayue
		 * @date   2014-12-17
		 * @param  {[type]}   watchId [监巡分组id]
		 * @param  {[type]}   cameras [修改后的摄像机信息]
		 * @return {[type]}           [description]
		 */
		saveGroupLayout: function(watchId, cameras) {
			return ajaxModel.postData(this.URLS.MODIFY_WATCH_CAMERA, {
				"watchId": watchId,
				"cameras": JSON.stringify({
					"cameras": cameras
				})
			});
		},
		/**
		 * 给某一监巡分组添加一组时间，同时可以修改间隔时长
		 * @author Mayue
		 * @date   2014-12-17
		 * @param  {[type]}   watchId      [监巡分组ID]
		 * @param  {[type]}   intervalTime [间隔时长]
		 * @param  {[type]}   times        [当前的所有时间组信息]
		 */
		addGroupTime: function(watchId, intervalTime, times) {
			return ajaxModel.postData(this.URLS.ADD_WATCH_TIME, {
				watchId: watchId,
				times: JSON.stringify({
					stopTime: parseInt(intervalTime, 10),
					"times": times
				})
			});
		},		
		/**
		 * 验证监巡分组名称是否重名
		 * @author Mayue
		 * @date   2014-12-17
		 * @param  {[type]}   groupsName [要验证的监巡分组名称]
		 * @return {[type]}              [description]
		 */
		verifyGroupName: function(groupsName) {
			return ajaxModel.postData(this.URLS.VERIFY_WATCH_GROUP, {
				"watchGroupName": groupsName
			});
		},
		/**
		 * [addNewGroup description]
		 * @author Mayue
		 * @date   2014-12-17
		 * @param  {[type]}   obj [如下]
		 * {
				"layout": 4,
				"cameras": JSON.stringify({[{'cameraId':2,'position':2},{'cameraId':2,'position':2}]}),
				"groupName": 'XX',
				"startTime": 1418808640000,
				"endTime": 1418808650000,
				"level": 2,
				"stopTime": 12
			}
		 */
		addNewGroup: function(obj) {
			return ajaxModel.postData(this.URLS.ADD_WATCH_GROUP, obj);
		},
		/**
		 * 获取一个父节点下的所有子节点的id
		 * @author Mayue
		 * @date   2014-12-17
		 * @param  {[type]}   groupId [父节点id]
		 * @param  {[type]}   type    [组织树类型]
		 * @return {[type]}           [description]
		 */
		getCamerasId: function(groupId, type) {
			return ajaxModel.getData(this.URLS.GET_CAMERAS_ID, {
				group: groupId,
				type: type
			});
		},
		/**
		 * 获取资源树
		 * @author Mayue
		 * @date   2014-12-17
		 * @param  {[type]}   groups  "vorg_1"
		 * @param  {[type]}   type   "vorg_1"
		 * @return {[type]}          [description]
		 */
		getCameras: function(groups, type) {
			return ajaxModel.getData(this.URLS.GET_CAMERAS, {
				groups: groups,
				type: type
			});
		},
		/**
		 * 将多个摄像头添加到一个具体的监巡分组中
		 * @author Mayue
		 * @date   2014-12-17
		 * @param  {[type]}   watchId      [description]
		 * @param  {[type]}   camerasArray [description]
		 */
		addCamerasToWatch: function(watchId, camerasArray) {
			return ajaxModel.postData(this.URLS.ADD_WATCH_CAMERA, {
				"watchId": watchId,
				"cameras": JSON.stringify({
					"cameras": camerasArray
				})
			});
		},
		/**
		 * 添加一个具体摄像头到多个监巡分组
		 * @author Mayue
		 * @date   2014-12-17
		 * @param  {[type]}   cameraId [description]
		 * @param  {[type]}   watchIds [description]
		 */
		addCameraToWatchs: function(cameraId, watchIds) {
			// debugger
			return ajaxModel.postData(this.URLS.ADD_CAMERA_WATCH, {
				"cameraId": cameraId,
				"watchIds": JSON.stringify({
					"watchIds": watchIds
				})
			});
		}
	}

	return new Module();
});