define(['pubsub', 'js/npmap-new/view/map-infowindow-alarm-view', 'js/npmap-new/model/map-infowindow-alarm-model'],

	function(pubsub, AlarmView, Model) {

		var AlarmController = function() {
			var self = this;
			//订阅事件 获取报警详细信息
			pubsub.subscribe("getAlarmDetailInfo", function(msg, obj) {
				self.getAlarmDetailInfo(obj.point, obj.id);
			});
			//订阅事件 获取视野范围内报警信息
			pubsub.subscribe("getAlarmInfoInScreen1", function(msg, obj) {
				self.getAlarmInfoInScreen(obj);
			});
			//订阅事件 获取上一个或者下一个报警详细信息
			pubsub.subscribe("getPreOrNextAlarmDetailInfo1", function(msg, obj) {
				self.getPreOrNextAlarmDetail(obj);
			});
			//订阅事件 手动报警处理事件
			pubsub.subscribe("dealAlarmEvent1", function(msg, obj) {
				obj.dealStatus=obj.value;
				self.dealAlarmEvent(obj);
			});
		};

		AlarmController.prototype = {
			/**
			 * 获取报警详情信息
			 * @param Point - 当前点位数据
			 * @param id - 摄像机id
			 */
			getAlarmDetailInfo: function(Point, id) {
				var data = {
						id: id,
						currentPage: 1,
						point: Point
					};

				Model.GetAlarmDetail(data, {}).then(function(result) {
					AlarmView.setAlarmDetailInfo(result, data.point)
				});
			},
			/**
			 * 获取视野范围内的报警信息
			 * @author Li Dan
			 * @date   2014-12-15
			 * @param  {[type]}   obj [description]
			 * @return {[type]}       [description]
			 */
			getAlarmInfoInScreen: function(obj) {
				Model.GetAlarminfoInScreen(obj, {}).then(function(result) {
					AlarmView.setAlarmInfoToMap(result);
				});
			},
			/**
			 * 获取上一个或者下一个报警详细信息
			 * @author Li Dan
			 * @date   2014-12-16
			 * @param  {[type]}   obj [description]
			 * @return {[type]}       [description]
			 */
			getPreOrNextAlarmDetail: function(obj) {
				Model.GetAlarmDetail(obj, {}).then(function(result) {
					AlarmView.setPreOrNextAlarmDetail(result, obj.type, obj.alarmId);
				});
			},
			/**
			 * 手动报警处理事件
			 * @param data 详细参数如下
			 * id - 报警id
			 * comment - 报警处理备注信息
			 * level - 报警处理等级
			 * value - 报警处理等级标示
			 * obj - 触发事件的dom元素
			 * by zhangyu on 2015/1/6
			 */
			dealAlarmEvent: function(data) {
				Model.DealAlarmEvent({
					comment: data.comment,
					level: data.level,
					value: data.dealStatus,
					id: data.id
				}, {}).then(function (result) {
					AlarmView.refreshOnDealAlarm(result, data.name,data.obj, data.value, data.levelText, data.statusText);
				});
			}
		};

		return new AlarmController();
	});