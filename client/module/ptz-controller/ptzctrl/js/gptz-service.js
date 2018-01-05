/**
 * ptz.js of 3 part
 * @return {[type]} [description]
 */
define(function()
{
		var gPTZService = window.gPTZService = (function() 
		{
			var ACTIONS_URL = {
				SET_DIRECTION:        "/service/ptz/set_dir",
				SET_DIRECTION_DIRECT: "/service/ptz/set_dir_direct",
				ADD_PRESET:           "/service/ptz/create_preset",
				DELETE_PRESET:        "/service/ptz/remove_preset",
				GET_PRESETS:          "/service/ptz/get_presets",
				GET_ORDERED_PRESETS:  "/service/ptz/sort_presets",
				MODIFY_PRESET:        "/service/ptz/update_preset",
				APPLY_PRESET:         "/service/ptz/call_preset",
				GET_CRUISE:           "/service/ptz/get_cruise",
				ADD_CRUISE:           "/service/ptz/save_cruise",
				LOCK:                 "/service/ptz/lock",
				CHECK_LOCK:           "/service/ptz/ptz_status",
				CHECK_MONOPOLY:       "/service/ptz/ptz_monopoly_status",
				MONOPOLY:             "/service/ptz/ptz_monopoly"
		    };

			var callService = function(url, requestType, data, success, error) {
				//console.log("Before Sending ptzService request, actionURL is:" + url + ", data=" + JSON.stringify(data));
				var ajax= jQuery.ajax({
					url: url,
					type: requestType,
					data: data,
					success: success,
					error: error,
					dataType: "json",
					cache: false
				});
				return ajax;
			};

			var callGetService = function(url, data, success, error) {
				return callService(url, "get", data, success, error);
			};

			var callPostService = function(url, data, success, error) {
				return callService(url, "post", data, success, error);
			};

			var exportClass={
				setDirection: function(data, success, error) {
					/*data = {
					"cameraId": 37,
					"cameraNo": "av/VS800编码器_183/1",
					"cmd": 0, //[0,19]
					"speed": "8" //[1,15]
					}*/
					return callPostService(ACTIONS_URL.SET_DIRECTION, data, success, error);
				},

				setDirection_Direct: function(data, success, error) {
					/*data = {
					"cameraId": 37,
					"cameraNo": "av/VS800编码器_183/1",
					"cmd": 0, //[0,19]
					"speed": "8" //[1,15]
					}*/
					return callPostService(ACTIONS_URL.SET_DIRECTION_DIRECT, data, success, error);
				},

				addPreset: function(data, success, error) {
					/*data = {
					"cameraId": 37,
					"cameraNo": "av/VS800编码器_183/1",
					"name": "brantTest",
					"sortNo": 11,
					"stopTime": 10 // 这个参数目前没啥意思，默认传10
					}*/
					return callPostService(ACTIONS_URL.ADD_PRESET, data, success, error);
				},

				deletePreset: function(data, success, error) {
					/*data = {
					"presetId": 492
					}*/
					return callPostService(ACTIONS_URL.DELETE_PRESET, data, success, error);
				},

				getPresets: function(data, success, error) {
					/*data = {
					"cameraId": 37
					}*/
					return callGetService(ACTIONS_URL.GET_PRESETS, data, success, error);
				},

				getOrderedPresets: function(data, success, error) {
					/*
					获取升序排列的预置位
					data = {
						cameraId": 37,
						"type": 0
					}*/

					/*
					获取降序排列的预置位
					data = {
						cameraId": 37,
						"type": 1
					}*/
					return callGetService(ACTIONS_URL.GET_ORDERED_PRESETS, data, success, error);
				},

				modifyPreset: function(data, success, error) {
					/*data = {
					"presetId": 472,
					"presetName": "testPresetName"
					}*/
					return callPostService(ACTIONS_URL.MODIFY_PRESET, data, success, error);
				},

				applyPreset: function(data, success, error) {
					/*data = {
					"cameraId": 37,
					"cameraNo": "av/VS800编码器_183/1",
					"presetId": 481
					}*/
					return callPostService(ACTIONS_URL.APPLY_PRESET, data, success, error);
				},

				getCruise: function(data, success, error) {
					/*
					获取自动巡航
					data = {
						cameraId": 37,
						"type": 0
					}*/

					/*
					获取时间段巡航
					data = {
						cameraId": 37,
						"type": 1
					}*/
					return callGetService(ACTIONS_URL.GET_CRUISE, data, success, error);
				},

				addCruise: function(data, success, error) {
					/*
					自动巡航数据格式
					data = {
					"cameraId": 37,
					"type": 0,
					"cruise": '{"startTime":1389715500000,"endTime":1389801300000,"preset":[{"id":826,"sortNo":1,"presetId":"443","presetName":"x","internalTime":"3"},{"id":827,"sortNo":2,"presetId":"472","presetName":"a","internalTime":"3"},{"id":828,"sortNo":3,"presetId":"443","presetName":"x","internalTime":"5"}],"presetId":"489"}'
					}*/

					/*
					时间段巡航数据格式
					data = {
					"cameraId": 37,
					"type": 1,
					"cruise": '{"preset":[{"id":783,"sortNo":1,"presetId":"472","presetName":"a","startTime":1389765600000,"endTime":1389765900000},{"id":784,"sortNo":2,"presetId":"481","presetName":"yy","startTime":1389766500000,"endTime":1389766800000},{"id":785,"sortNo":3,"presetId":"489","presetName":"ffff","startTime":1389766800000,"endTime":1389767100000}],"presetId":"481"}'
					}*/
					return callPostService(ACTIONS_URL.ADD_CRUISE, data, success, error);
				},

				lock: function(data, success, error) {
					/*
					锁定监视器1000秒
					data = {
					"cameraId": 37,
					"cameraNo": "av/VS800编码器_183/1",
					"lockTime": 1000
					}*/

					/*
					解锁摄像机
					data = {
					"cameraId": 37,
					"cameraNo": "av/VS800编码器_183/1",
					"lockTime": 0
					}*/
					return callPostService(ACTIONS_URL.LOCK, data, success, error);
				},

				checkLock: function(data, success, error) {
					/*data = {
					"cameraId": 37,
					"cameraNo": "av/VS800编码器_183/1"
					}*/
					return callGetService(ACTIONS_URL.CHECK_LOCK, data, success, error);
				},
				monopoly: function(data, success ,error){
					return callPostService(ACTIONS_URL.MONOPOLY, data, success, error);
				},

				checkMonopoly: function(data, success ,error){
					return callGetService(ACTIONS_URL.CHECK_MONOPOLY, data, success, error);
				}
			};

		return exportClass;
	})();
	return gPTZService;
});