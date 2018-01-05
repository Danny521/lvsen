/**
 * [报警列表逻辑相关的数据接口]
 * @author Wang Xiaojun
 * @date   2014-12-17
 */
define(['ajaxModel'], function(ajaxModel) {

	var model = function() {
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
		serviceContext: "defence",

		//设置请求的url集合
		ACTIONS_URL: {},

		//设置请求的url集合
		setActionUrl: function() {
			var self = this;
			return {
				//报警管理页面左侧报警信息筛选，获取产生报警的规则列表
				Get_Rule_List_By_Alarm: (self.isUseMock ? "../inc/get_rule_list_by_alarm.json" : self.serviceHost + self.serviceContext + "/get_current_defence_algorithm_list"),

				//获取左侧信息列表
				Get_Alarm_List_By_Condition: (self.isUseMock ? "../inc/defence_events_list.json" : self.serviceHost + /*self.serviceContext + */ "events"),

				//获取左侧报警对应的右侧地图上的点位（即左侧报警对应的摄像机点位列表）
				Get_Alarm_Cameras_By_Condition: (self.isUseMock ? "../inc/alarm_points_info.json" : self.serviceHost + /*self.serviceContext + */ "events/gis/summary"),

				//快速处理报警信息
				Update_Alarm_Status_By_Fast_Deal: (self.isUseMock ? "../inc/get_rule_list_by_alarm.json" : self.serviceHost + /*self.serviceContext +*/ "events"),

				//左侧布控报警信息点击图片时，请求该报警的详细信息
				Get_Alarm_Details_By_Id: (self.isUseMock ? "../inc/get_rule_list_by_alarm.json" : self.serviceHost + /*self.serviceContext +*/ "events"),

				//点击历史调阅，根据报警id获取报警通道信息，为播放录像做准备
				Get_Alarm_Channel_By_AlarmId: (self.isUseMock ? "../inc/get_rule_list_by_alarm.json" : self.serviceHost + /*self.serviceContext +*/ "events/camera"),

				//点击历史调阅，获取录像深度
				Get_History_Video_Depth: (self.isUseMock ? "../inc/get_rule_list_by_alarm.json" : self.serviceHost + /*self.serviceContext +*/ "history/list_history_videos_other"),

				//报警处理（布防），点击有效时候的请求
				Deal_Alarm_By_AlarmId: (self.isUseMock ? "../inc/get_rule_list_by_alarm.json" : self.serviceHost + /*self.serviceContext +*/ "events/defence"),
				GET_PROTCET_IMG_BY_ALARMID:self.serviceHost+self.serviceContext+"/image?id="
			};
		},

		/**
		 * [GetRuleListByAlarm 报警管理页面左侧报警信息筛选，获取产生报警的规则列表]
		 * @author Wang Xiaojun
		 * @date   2014-12-17
		 * @param  {[type]}   data [参数信息]
		 */
		
		GetRuleListByAlarm: function(data) {
			return ajaxModel.getData(this.ACTIONS_URL.Get_Rule_List_By_Alarm, data, {});
		},

		/**获取布控的人脸框线图片**/
		GetProtetImg:function(data){
			return ajaxModel.getData(this.ACTIONS_URL.GET_PROTCET_IMG_BY_ALARMID+data.id , {});
		},
		/**
		 * [GetAlarmListByCondition 获取左侧报警信息列表]
		 * @author Wang Xiaojun
		 * @date   2014-12-17
		 * @param  {[type]}   data [参数信息]
		 */
		

		GetAlarmListByCondition: function(data,custom) {
			return ajaxModel.getData(this.ACTIONS_URL.Get_Alarm_List_By_Condition, data, custom);
		},


		/**
		 * [GetAlarmCamerasByCondition 获取左侧报警对应的右侧地图上的点位（即左侧报警对应的摄像机点位列表）]
		 * @author Wang Xiaojun
		 * @date   2014-12-17
		 * @param  {[type]}   data [参数信息]
		 */
		
		GetAlarmCamerasByCondition: function(data) {
			return ajaxModel.getData(this.ACTIONS_URL.Get_Alarm_Cameras_By_Condition, data,{});
		},


		/**
		 * [UpdateAlarmStatusByFastDeal 快速处理报警信息状态]
		 * @author Wang Xiaojun
		 * @date   2014-12-17
		 * @param  {[type]}   data       [参数信息]
		 */
		

		UpdateAlarmStatusByFastDeal: function(data) {
			return ajaxModel.postData(this.ACTIONS_URL.Update_Alarm_Status_By_Fast_Deal, data,{});
		},
	
		/**
		 * [GetAlarmDetailsById 左侧布控报警信息点击图片时，请求该报警的详细信息]
		 * @author Wang Xiaojun
		 * @date   2014-12-17
		 * @param  {[type]}   data       [参数信息]
		 */

		GetAlarmDetailsById: function(data) {
			return ajaxModel.getData(this.ACTIONS_URL.Get_Alarm_Details_By_Id + "/" + data.id, data, {});
		},


		/**
		 * [GetAlarmChannelByAlarmId 点击历史调阅，根据报警id获取报警通道信息，为播放录像做准备]
		 * @author Wang Xiaojun
		 * @date   2014-12-17
		 * @param  {[type]}   data [参数信息]
		 */
		

		GetAlarmChannelByAlarmId: function(data) {
			return ajaxModel.getData(this.ACTIONS_URL.Get_Alarm_Channel_By_AlarmId + "/" + data.id, data, {});
		},


		/**
		 * [GetHistoryVideoDepth 点击历史调阅，获取录像深度]
		 * @author Wang Xiaojun
		 * @date   2014-12-17
		 * @param  {[type]}   data [参数信息]
		 */
		

		GetHistoryVideoDepth: function(data) {
			return ajaxModel.getData(this.ACTIONS_URL.Get_History_Video_Depth, data,{});
		},



		/**
		 * [DealAlarmByAlarmId 报警处理（布防），点击有效时候的请求]
		 * @author Wang Xiaojun
		 * @date   2014-12-17
		 * @param  {[type]}   data [参数信息]
		 */
		
		DealAlarmByAlarmId: function(data) {
			return ajaxModel.getData(this.ACTIONS_URL.Deal_Alarm_By_AlarmId + "/" + data.id, data,{});
		}
	};

	return new model();
});