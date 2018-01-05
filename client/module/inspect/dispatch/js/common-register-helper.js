/**
 * Created by Zhangyu on 2015/4/17.
 */
define(["js/npmap-new/map-permission", "handlebars"], function(pvamapPermission) {
	var helper = {
		//公共助手
		common: function () {
			Handlebars.registerHelper("cameraStatusAndTypeByChannels", function (hd, sd, type, score) {
				var status = 1, isonline = false;
				hd.each(function (item) {
					if (item.channel_status === 0) {
						status = 0;
						isonline = true;
					}
				});
				if (!isonline) {
					sd.each(function (item) {
						if (item.channel_status === 0) {
							status = 0;
						}
					});
				}
				if (type) {
					if (status === 0) {
						return (pvamapPermission.checkCameraPermissionByScore(score)) ? "np-result-camera-icon np-camera-ball-online" : "camera-ball-online-forbid";
					}
					if (status === 1) {
						return (pvamapPermission.checkCameraPermissionByScore(score)) ? "np-result-camera-icon np-camera-ball-offline" : "camera-ball-offline-forbid";
					}
				} else {
					if (status === 0) {
						return (pvamapPermission.checkCameraPermissionByScore(score)) ? "np-result-camera-icon np-camera-gun-online" : "camera-gun-online-forbid";
					}
					if (status === 1) {
						return (pvamapPermission.checkCameraPermissionByScore(score)) ? "np-result-camera-icon np-camera-gun-offline" : "camera-gun-offline-forbid";
					}
				}
			});
			//摄像机编号
			Handlebars.registerHelper("cameraCodeShow", function (data) {
				var data = data + "";
				if (data === "null" || data === "" || data === null || data === 'undefined') {
					return "";
				} else if (data.indexOf("(") > -1) {
					return data;
				} else {
					return "(" + data + ")";
				}
			});
		}
	};

	//加载助手
	for (var fun in helper) {
		if (helper.hasOwnProperty(fun) && typeof helper[fun] === "function") {
			helper[fun]();
		}
	}
});