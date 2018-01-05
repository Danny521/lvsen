/**
 * Created by Zhangxinyu on 2016/3/31.
 * description 联动规则主控制器
 */
define([
	"../view/main-view.js",
	"../cache.js"
], function(View, Cache) {

	'use strict';

	var tvWallCache = {};

	/**
	 * 获取当前摄像机待播放channelId，目前是取任意一个
	 */
	function getCameraPlayChannel(data) {
		//获取待播放的通道id
		var camchannelid = null,
			cameraData = data;
		if (cameraData.hdchannel.length > 0) {
			camchannelid = cameraData.hdchannel[0].id; //目前只有1个
		} else if (cameraData.sdchannel.length > 0) {
			for (var i = 0; i < cameraData.sdchannel.length; i++) {
				if (cameraData.sdchannel[i].pvg_group_id === 2 || cameraData.sdchannel[i].pvg_group_id === 3) { //1表示编码器，没有录像；2表示DVR
					camchannelid = cameraData.sdchannel[i].id;
					break;
				}
			}
		}
		cameraData.curChannelId = camchannelid;
	}
	/**
	 * [getPlayCameraOptions 获取播放实时流视频的参数]
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */
	function getPlayCameraOptions(data) {
		var playCamera = [];

		if (data.hdchannel.length > 0) {
			playCamera.push({
				ip: data.hdchannel[0].ip,
				port: data.hdchannel[0].port,
				user: data.hdchannel[0].username,
				passwd: data.hdchannel[0].password,
				path: data.hdchannel[0].av_obj,
				// id: data.id,
				type: 1 //实时视频1，历史录像2
			});
		}
		if (data.sdchannel.length > 0) {
			playCamera.push({
				ip: data.sdchannel[0].ip,
				port: data.sdchannel[0].port,
				user: data.sdchannel[0].username,
				passwd: data.sdchannel[0].password,
				path: data.sdchannel[0].av_obj,
				// id: data.id,
				type: 1 //实时视频1，历史录像2
			});
		}

		return playCamera;
	}
    /**
     * [checkRepeat 已选列表去重]
     * @param  {[type]} cameraId [摄像机id]
     * @return {[type]}          [description]
     */
	function checkRepeat(type, cameraId){
        if(type === "monitor"){
			Cache.cloneData.monitorCameraList = Cache.cloneData.monitorCameraList.filter(function(item) {
				return parseInt(item.camera_id) !== parseInt(cameraId);
			});
        }
        if(type === "ptz"){
			Cache.cloneData.PTZCameraList = Cache.cloneData.PTZCameraList.filter(function(item) {
				return parseInt(item.camera_id) !== parseInt(cameraId);
			});
        }
        if(type === "tvwall"){
			Cache.cloneData.tvwallList = Cache.cloneData.tvwallList.filter(function(item) {
				return parseInt(item.camera_id) !== parseInt(cameraId);
			});
        }
	}

	return (function(scope) {
		/**
		 * [init 初始化联动规则弹窗]
		 * @param  {[type]} type   [布防or布控]
		 * @param  {[type]} taskId [任务id]
		 * @return {[type]}        [description]
		 */
		scope.init = function(type, taskId) {
			View.init(taskId, scope, type);
		};
		/**
		 * [renderRightList 选中摄像机节点，加载右侧联动规则列表]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		scope.renderRightList = function(data, $node) {
			var self = this,
				type = jQuery("#popContainer .popLeft .active").data("tab");
			Cache.cameraData = data;
			getCameraPlayChannel(data);
			switch (type) {
				case 'monitor':
					scope.renderCameraList(type, data, $node);
					break;
				case 'ptz':
					View.renderPreTemp(data.id, $node);
					break;
				case 'tvwall':
					scope.renderCameraList(type, data, $node);
					break;
			}
		};
		/**
		 * [renderCameraList 渲染选中联动摄像机列表]
		 * @param  {[type]} type   [联动类型]
		 * @param  {[type]} params [请求参数]
		 * @return {[type]}        [description]
		 */
		scope.renderCameraList = function(type, params, $node) {
			var self = this;
			if (params.preset_name) {
				checkRepeat(type, params.camera_id);
				if (params.isAppend) {
					Cache.cloneData.PTZCameraList.push({
						camera_id: params.camera_id,
						channel_id: Cache.cameraData.curChannelId,
						preset_id: params.preset_id,
						cameraName: Cache.cameraData.name,
						preset_name: params.preset_name,
						type: 4
					});
				} else{
					Cache.cloneData.PTZCameraList = Cache.cloneData.PTZCameraList.filter(function(item) {
						return parseInt(item.camera_id) !== parseInt(params.camera_id);
					});
				}
				View.renderTemp(type, Cache.cloneData.PTZCameraList);
			}
			if (type === "monitor") {
				if ($node.hasClass("active")) {
					var playOptions = getPlayCameraOptions(params);
                    checkRepeat(type, params.id);
					Cache.cloneData.monitorCameraList.push({
						camera_id: params.id,
						cameraName: params.name,
						cameraType: params.cameratype,
						channel_id: params.curChannelId,
						cameraData: playOptions,
						type: 8
					});
				} else {
					Cache.cloneData.monitorCameraList = Cache.cloneData.monitorCameraList.filter(function(item) {
						return parseInt(item.camera_id) !== parseInt(params.id);
					});
				}
				View.renderTemp(type, Cache.cloneData.monitorCameraList);
			}
			if (type === "tvwall") {
				if ($node.hasClass("active")) {
					checkRepeat(type, params.id);
					Cache.cloneData.tvwallList.push({
						camera_id: params.id,
						cameraName: params.name,
						channel_id: params.curChannelId,
						tvwallLayout_id: "", //布局id
						tvwallLayout_name: "", //布局名称
						mdTvwallLayout_id: "", //通道id
						mdTvwallLayout_sceen: "", //通道名称
						cameraType: params.cameratype,//相机类型枪击or球机
						type: 5
					});
				} else {
					Cache.cloneData.tvwallList = Cache.cloneData.tvwallList.filter(function(item) {
						return parseInt(item.camera_id) !== parseInt(params.id);
					});
				}
				View.renderTemp(type, Cache.cloneData.tvwallList, "create");
			}

		};
		/**
		 * [renderCacheData 加载缓存的联动数据]
		 * @param  {[type]} type [description]
		 * @return {[type]}      [description]
		 */
		scope.renderCacheData = function(type) {
			
			jQuery("." + type).removeClass("disnone").siblings().addClass("disnone");

		};
		return scope;
	}({}));
});