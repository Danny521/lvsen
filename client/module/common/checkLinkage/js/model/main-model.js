/**
 * Created by Zhangxinyu on 2016/3/31.
 * description 联动规则模型
 */
define(['ajaxModel'], function(ajaxModel) {
	var Model = {
		//路径名
		URLS: {
			//获取摄像机预置位信息
			GET_PRESETS_BY_CAMERAID: "/service/ptz/get_presets",
			//根据摄像机id获取该摄像机的所在组织列表
			CAMERA_ORGS: "/service/defence/get_orgs_by_cameraId",
			//获取电视墙布局信息
			GET_LAYOUT_TVWALL: "/service/config/tvwall/getAllLayouts",
			//获取电视墙布局通道信息
			GET_CHANNEL: "/service/config/tvwall/getItem",
			//获取联动规则
			GET_LINKAGE: "/service/alarm_notify/get_list"
		},
		ajaxEvents: function() {
			var self = this;
			return {
				//获取预置位信息
				getPresetsByCameraId: function(data, success, error) {
					ajaxModel.getData(self.URLS.GET_PRESETS_BY_CAMERAID, data).then(success, error);
				},
				//获取组织
				getCameraOrgs: function(data, success, error) {
					ajaxModel.getData(self.URLS.CAMERA_ORGS, data).then(success, error);
				},
				//获取电视墙布局信息
				getLayoutTvwall: function(data, success, error) {
					ajaxModel.getData(self.URLS.GET_LAYOUT_TVWALL, data).then(success, error);
				},
				//获取电视墙布局通道信息
				getLayoutChannel: function(data, success, error) {
					ajaxModel.getData(self.URLS.GET_CHANNEL, data).then(success, error);
				},
				//获取联动规则信息
				getLinkage: function(data, success, error) {
					ajaxModel.getData(self.URLS.GET_LINKAGE, data).then(success, error);
				}
			};
		}
	};
	return {
		ajaxEvents: Model.ajaxEvents()
	}
});