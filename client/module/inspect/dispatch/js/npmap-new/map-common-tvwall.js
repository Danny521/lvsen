define([
	'js/npmap-new/map-variable',
	'js/npmap-new/map-permission',
	'/module/common/tvwall/js/controllers/tvwall-wheel.js',
	'pubsub',
	'/module/common/tvwall/js/models/tvwall-insert.js'
], function(Variable, pvamapPermission, mouseTip, PubSub, TVWallController){
	var TVWall = function(){};

	TVWall.prototype = {
		/**
		 * 发送到电视墙
		 * @type {[type]}
		 */
		sendToTvwall: function(data) {
			//参数 0：cameracode 1：id 2：name 3：hdchannel 4：sdchannel
			var camera = data || Variable.currentCameraData;
			//判断资源权限 by zhangyu on 2015/2/11
			if (!pvamapPermission.checkCameraPermissionById(camera.id, "send-to-tvwall")) {
				return;
			}
			//触发隐藏地图播放栏
			PubSub.publishSync("closeMapVideoBar");
			//初始化并显示电视墙
			TVWallController.initData();
			jQuery(".major-reset").css({
				'width': '100%',
				'right': 0
			});
			//获取摄像机参数
			window.gTvwallArrayGis = [];
			var cameracode = camera.cameraCode,
				id = camera.id,
				name = camera.name,
				hdchannel = camera.hd_channel ? camera.hd_channel : camera.hdchannel,
				sdchannel = camera.hd_channel ? camera.sd_channel : camera.sdchannel;
			//将数组转换成字符串
			if (typeof hdchannel === 'object') {
				hdchannel = hdchannel ? JSON.stringify(hdchannel) : '';
			}
			if (typeof sdchannel === 'object') {
				sdchannel = sdchannel ? JSON.stringify(sdchannel) : '';
			}
			window.gTvwallArrayGis = [cameracode, id, name, hdchannel, sdchannel];
			if (location.href.indexOf("dispatch") >= 0) {
				logDict.insertLog("m1", "f2", "o6", "b9", name + '摄像机', name);
			} else {
				logDict.insertLog("m1", "f1", "o6", "b9", name + '摄像机', name);
			}
			new mouseTip().bindEvents();
		},
		/**
		 * 拖动某摄像机到电视墙
		 * @author Li Dan
		 * @date   2014-12-15
		 * @param  {[type]}   item [description]
		 * @return {[type]}        [description]
		 */
		dragToTvwall: function(item,data){
			jQuery(item).draggable({
				helper: "clone",
				cursor: "pointer",
				zIndex: 1000,
				scope: 'tasks',
				appendTo: ".tvList",
				cursorAt: {
					"left": -10
				},
				start: function(event, ui) {
					if ($("#preview") && $("#preview").length !== 0) {
						$("#preview").remove();
					}
					window.gTvwallArrayGis = [];
					//参数 0：cameracode 1：id 2：name 3：hdchannel 4：sdchannel
					var cameracode = data.code,
						id = data.id,
						name = data.name,
						hdchannel = data.hdchannel,
						sdchannel = data.sdchannel;
					//将数组转换成字符串
					if(typeof hdchannel === 'object'){
						hdchannel = hdchannel ? JSON.stringify(hdchannel) : '';
					}
					if(typeof sdchannel === 'object'){
						sdchannel = sdchannel ? JSON.stringify(sdchannel) : '';
					}
					window.gTvwallArrayGis = [cameracode, id, name, hdchannel, sdchannel];
				}
			});
		}
		
	}

	return new TVWall();
});