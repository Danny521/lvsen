/**
 * Created by Zhangyu on 2014/12/16.
 * 报警管理地图相关主控逻辑的数据接口
 */
define(['ajaxModel'], function(ajaxModel) {

	var model = function () {
		var self = this;
		//设置请求url的集合
		self.ACTIONS_URL = self.setActionUrl();
	};

	model.prototype = {

		//标记是否使用模拟数据
		isUseMock: false,

		//设置请求的根路径
		serviceHost: "/service/",

		//设置请求上下文
		serviceContext: "",

		//设置请求的url集合
		ACTIONS_URL: {},

		//设置请求的url集合
		setActionUrl: function () {
			var self = this;
			return {
				//地图上点击报警点位信息，读取并显示该摄像机的报警信息
				Get_Alarm_Info_By_CameraId: (self.isUseMock ? "../newStructAlarmmgr/inc/get_alarm_info_by_cameraid.json" : self.serviceHost + self.serviceContext + "events/cameras"),
				//左侧报警列表的点击事件/报警处理时，需要根据报警id获取该报警的详细信息
				Get_Alarm_Info_By_Id: (self.isUseMock ? "../inc/get_alarm_info_by_id.json" : self.serviceHost + self.serviceContext + "events"),
				//报警处理（布防），点击有效时候的请求
				Deal_Alarm_By_AlarmId: (self.isUseDummy ? "../inc/get_rule_list_by_alarm.json" : self.serviceHost + /*self.serviceContext +*/ "events/defence"),
				//布控人员判定提交
				Post_select_person: self.serviceHost + "events/ctrl",
				//获取摄像机
				By_type_get_camera:self.serviceHost + "map_new/map_all_camera",

				Access_Channels:self.serviceHost +"video_access_copy/accessChannels",
				//获取布防布控摄像机资源
				GET_SOURCECAMERA_INFO:"/service/defence/get_all_camera_has_task"
			};
		},
		/**
		 * 获取地图上布防布控的所有摄像机
		 *
		 **/
		GetSourcecameraList:function(data){
			return ajaxModel.getData(this.ACTIONS_URL.GET_SOURCECAMERA_INFO+"?types="+data.types,data,{});
		},
		/**
		 * 地图上点击报警点位信息，读取并显示该摄像机的报警信息
		 * @param data - 参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		GetAlarmInfoByCameraId: function (data) {
			return ajaxModel.getData(this.ACTIONS_URL.Get_Alarm_Info_By_CameraId+"/"+data.id,data,{});
		},

		/**
		 * 左侧报警列表的点击事件/报警处理时，需要根据报警id获取该报警的详细信息
		 * @param data - 参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		GetAlarmInfoById: function (data) {
			return ajaxModel.getData(this.ACTIONS_URL.Get_Alarm_Info_By_Id + "/" + data.id, data, {});
		},

		/**
		 * [DealAlarmByAlarmId 报警处理（布防），点击有效时候的请求]
		 * @author Wang Xiaojun
		 * @date   2014-12-17
		 * @param  {[type]}   data [参数信息]
		 */
		
		DealAlarmByAlarmId: function(data) {
			return ajaxModel.postData(this.ACTIONS_URL.Deal_Alarm_By_AlarmId + "/" + data.id, data,{});
		},

		/**
		 * [PostSelectPerson 提交候选人的判定]
		 * @author Wang Xiaojun
		 * @date   2014-12-18
		 * @param  {[type]}   data []
		 */
		
		PostSelectPerson:function(data){
				return ajaxModel.postData(this.ACTIONS_URL.Post_select_person + "/" + data.id, data,{});
		},

		
		/**
		 * [getCameraByType 根据摄像机的类型获取不同的摄像机]
		 * @author Wang Xiaojun
		 * @date   2014-12-18
		 * @param  {[type]}   data [参数信息]
		 */
		
		getCameraByType:function(data){
			return ajaxModel.getData(this.ACTIONS_URL.By_type_get_camera, data, {});
		},



		accessChannels:function(data){
			return ajaxModel.getData(this.ACTIONS_URL.Access_Channels, data, {});
		}
	};

	return new model();
});
