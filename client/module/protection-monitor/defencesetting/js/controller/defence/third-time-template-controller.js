/**
 * Created by Zhangyu on 2014/12/12.
 * 布防规则设置时间模板的逻辑控制器
 */
define([
	"/module/protection-monitor/defencesetting/js/view/defence/third-time-template-view.js",
	"jquery",
	"mootools"
], function(view, jQuery) {

	var TimePlateController = (function(scope, $) {
		var //存储当前时间模板的参数
			_timeParamInfo = {},
			//存储当前正在编辑的时间列表,方便编辑后进行保存
			_curDayTimeList = null,
			//存储当前弹出层对应的日期
			_curWeekDay = "";
		/**
		 * 弹出框显示时，格式化当前日期的时间段格式000000---》00:00
		 * @param timeArr - 对时间片段对象进行包装，以备渲染模板
		 * @returns {*} - 返回包装后的时间片段对象
		 * @private
		 */
		var _formateTimeList = function (timeArr) {
			//遍历日期
			for (var i = 0, length = timeArr.length; i < length; i++) {
				if (!timeArr[i].timeList) {
					timeArr[i].timeList = [];
				}
				//遍历日期里的时间段
				for (var j = 0, len = timeArr[i].timeList.length; j < len; j++) {
					var tempStart = timeArr[i].timeList[j].startTime.substring(0, 4), tempEnd = timeArr[i].timeList[j].endTime.substring(0, 4);
					timeArr[i].timeList[j].startTime = tempStart.substring(0, 2) + ":" + tempStart.substring(2, 4);
					timeArr[i].timeList[j].endTime = tempEnd.substring(0, 2) + ":" + tempEnd.substring(2, 4);
				}
			}
			return timeArr;
		};

		/**
		 * 根据周几标示获取周几的时间段信息
		 * @param weekday - 带获取的星期标示
		 * @returns {*} - 返回该星期标示对应的时间段信息
		 */
		var _getWeekDayData = function (weekday) {

			//遍历时间参数，获取对应周几的时间列表
			for (var i = 0, length = _timeParamInfo.timeSlot.length; i < length; i++) {
				if (_timeParamInfo.timeSlot[i].dayOfWeek === parseInt(weekday)) {
					//进行深度拷贝
					return Object.clone(_timeParamInfo.timeSlot[i]);
				}
			}
			return {};
		};
		/**
		 * 用户添加时间段时，进行差错验证，并更新当前日期的时间段
		 * @param slotData
		 * @returns {boolean}
		 * @private
		 */
		var _validateAndUpdateSlot = function (slotData) {
			var curTimeInfo = view.getTimeMinutes(slotData), regex = /^([0-1]{1}[0-9]{1}:[0-5]{1}[0-9]{1})$|^(2[0-3]{1}:[0-5]{1}[0-9]{1})$/;
			//判断时间段的个数，不能超过四个（cms中限制）
			if(_curDayTimeList.timeList.length >= 4){
				notify.warn("单日布防时间片段不能超过4个，请调整！");
				return false;
			}
			//第一步：进行差错验证（合法检测）
			if (!regex.test(slotData.startTime) || !regex.test(slotData.endTime)) {
				notify.warn("输入的时间格式不正确！");
				return false;
			}
			if (curTimeInfo.startTime >= curTimeInfo.endTime) {
				notify.warn("开始时间不能大于或等于结束时间！");
				return false;
			}
			//比较有没有重叠的
			for (var i = 0, length = _curDayTimeList.timeList.length; i < length; i++) {
				var tempTimeinfo = view.getTimeMinutes(_curDayTimeList.timeList[i]);
				if (!(curTimeInfo.endTime <= tempTimeinfo.startTime || curTimeInfo.startTime >= tempTimeinfo.endTime)) {
					notify.warn("存在与当前重叠的时间段，请更正后再添加！");
					return false;
				}
			}
			//添加到临时存储变量中
			_curDayTimeList.timeList.push(slotData);
			return true;
		};
		/**
		 * 根据初始化时传递的值判断是否为空，如果为空，则需要补充填充24小时
		 * @param param - 初始时间片段参数
		 * @returns {*} - 返回包装后的时间段对象
		 */
		scope.initialData = function (param) {
			//格式化时间段
			if (!param) {
				var taskTime = { timeSlot: [] };
				for (var i = 1; i <= 7; i++) {
					var tempTimeInfo = {};
					if (i !== 7) {
						tempTimeInfo.dayOfWeek = i;
					} else {
						tempTimeInfo.dayOfWeek = 0;
					}
					tempTimeInfo.useflag = true;
					tempTimeInfo.timeList = [
						{
							startTime: "00:00",
							endTime: "23:59"
						}
					];
					taskTime.timeSlot.push(tempTimeInfo);
				}
				_timeParamInfo = taskTime;
			} else {
				//包装一层，以备模板渲染
				_timeParamInfo = { timeSlot: _formateTimeList(param) };
			}

			return _timeParamInfo;
		};
		/**
		 * 显示某日期时间段对话框时，初始化数据
		 * @param weekday - 当前选中的日期标示
		 * @returns {*} - 返回当前选中日期的时间段列表
		 */
		scope.setInfoOnShowDialog = function(weekday) {
			_curWeekDay = weekday;
			_curDayTimeList = _getWeekDayData(weekday);

			return _curDayTimeList;
		};
		/**
		 * 设置时间段的可用性
		 * @param status - 事件段的可用状态
		 * @param type - 设置类型，批量设置还是指定星期标示设置
		 * @param weekday - 指定的日期标示，指定日期标示设置时有效
		 */
		scope.setTimeSlotStatus = function (status, type, weekday) {
			var i = 0, length = 0;

			if (type === "all") {
				//设置所有
				for (i = 0, length = _timeParamInfo.timeSlot.length; i < length; i++) {
					_timeParamInfo.timeSlot[i].useflag = status;
				}
			} else {
				//设置部分
				for (i = 0, length = _timeParamInfo.timeSlot.length; i < length; i++) {
					if (_timeParamInfo.timeSlot[i].dayOfWeek === parseInt(weekday)) {
						_timeParamInfo.timeSlot[i].useflag = status;
						break;
					}
				}
			}
		};
		/**
		 * 当用户勾选时间条前的checkbox时，默认添加24h到该日期
		 * @param weekday - 待设置的星期标示
		 * @returns {boolean} - 返回是否需要渲染全部时间段
		 */
		scope.addTimeSlotOnChecked = function (weekday) {

			//遍历参数数据，添加24h到当前日期
			for (var i = 0, length = _timeParamInfo.timeSlot.length; i < length; i++) {
				if (_timeParamInfo.timeSlot[i].dayOfWeek === parseInt(weekday) && _timeParamInfo.timeSlot[i].timeList.length === 0) {
					//如果当前的时间段列表为空，则添加
					_timeParamInfo.timeSlot[i].timeList.push({
						startTime: "00:00",
						endTime: "23:59"
					});
					//当前时间段列表为空，需要添加全部时段
					return true;
				}
			}
			//不需要添加全部时段
			return false;
		};
		/**
		 * 添加时间段前，对时间段进行差错验证
		 * @param begintime - 开始时间
		 * @param endtime - 结束时间
		 * @returns {*} - 返回验证的事件片段
		 */
		scope.checkAddedTimeSlot = function (begintime, endtime) {
			//获取添加的时间段
			var slotData = {
				startTime: begintime,
				endTime: endtime
			};
			//差错验证&更新当前日期的时间段信息
			if (!_validateAndUpdateSlot(slotData)) {
				return null;
			}
			return slotData;
		};
		/**
		 * 删除时间段
		 * @param delSlotArr - 当前待删除的事件片段
		 */
		scope.delTimeSlotEvent = function (delSlotArr) {

			var tempSlot = null;
			if (delSlotArr.length !== 2) {
				return;
			}
			//遍历当前日期的时间段（删除当前待删除的时间段）
			for (var i = 0, length = _curDayTimeList.timeList.length; i < length; i++) {
				tempSlot = _curDayTimeList.timeList[i];
				if (tempSlot.startTime === $.trim(delSlotArr[0]) && tempSlot.endTime === $.trim(delSlotArr[1])) {
					_curDayTimeList.timeList.splice(i, 1);
				}
			}
		};
		/**
		 * 弹出层时间段确认按钮
		 */
		scope.saveTimeSlotEvent = function () {

			//从临时存储变量中获取时间段信息并填充回当前时间对象中
			for (var i = 0, length = _timeParamInfo.timeSlot.length; i < length; i++) {
				if (_timeParamInfo.timeSlot[i].dayOfWeek === parseInt(_curWeekDay)) {
					//回填到时间对象中。
					_timeParamInfo.timeSlot[i].timeList = _curDayTimeList.timeList;
					break;
				}
			}

			return {
				curDayTimeList: _curDayTimeList,
				curWeekDay: _curWeekDay
			};
		};
		/**
		 * 布防任务保存时，时间段回传给后台时，需要转换成一维数组（由于算法参数需要）
		 * @returns {Array} - 转换后的一维数组
		 */
		scope.formateTimeSlot = function () {
			var resultArr = [], data = _timeParamInfo.timeSlot;
			//差错处理
			if (!data) {
				return resultArr;
			}
			//遍历时间段
			for (var i = 0, length = data.length; i < length; i++) {
				if (data[i].useflag && data[i].timeList) {
					for (var h = 0; h < data[i].timeList.length; h++) {
						resultArr.push({
							dayOfWeek: data[i].dayOfWeek.toString(),
							startTime: data[i].timeList[h].startTime.replace(":", "") + "00",
							endTime: data[i].timeList[h].endTime.replace(":", "") + "59"
						});
					}
				}
			}
			return resultArr;
		};

		return scope;

	}(TimePlateController || {}, jQuery));

	var Controller = function (timeparam) {
		//初始化数据
		var timeParamInfo = TimePlateController.initialData(timeparam);
		//加载时间模板
		view.init(timeParamInfo, this);
	};

	Controller.prototype = {
		/**
		 * 显示时间段设置对话框
		 * @param weekday - 当前待设置时间段的weekday
		 */
		showTimeDialog: function (weekday) {
			//获取当前要设置的日期
			var curDayTimeList = TimePlateController.setInfoOnShowDialog(weekday);
			//渲染模板，动态添加
			view.showTimeSettingDlg(curDayTimeList);
		},

		/**
		 * 当用户勾选时间条前的checkbox时，默认添加24h到该日期
		 * @param weekday - 待设置的星期标示
		 * @param obj - 该星期标示的时间条dom容器对象
		 */
		addTimeSlotOnChecked: function(weekday, obj) {
			if(TimePlateController.addTimeSlotOnChecked(weekday)) {
				//渲染当前日期的全部时段
				view.renderAllTime(obj);
			}
		},
		/**
		 * 添加时间段
		 * @param begintime - 开始时间
		 * @param endtime - 结束时间
		 */
		addTimeSlotEvent: function (begintime, endtime) {
			//验证待添加的时间段
			var slotData = TimePlateController.checkAddedTimeSlot(begintime, endtime);
			//渲染模板，动态添加
			if(slotData) {
				view.renderAfterAddSlot(slotData);
			}
		},
		/**
		 * 弹出层时间段确认按钮
		 */
		saveTimeSlotEvent: function () {

			var curDayInfo = TimePlateController.saveTimeSlotEvent();
			//在时间模板上渲染设置的时间段
			view.showTimeSlotSegment(curDayInfo.curDayTimeList, curDayInfo.curWeekDay);
		},
		// 删除时间段
		delTimeSlotEvent: TimePlateController.delTimeSlotEvent,
		//设置时间段的可用性
		setTimeSlotStatus: TimePlateController.setTimeSlotStatus,
		//布防任务保存时，时间段回传给后台时，需要转换成一维数组（由于算法参数需要）
		formateTimeSlot: TimePlateController.formateTimeSlot
	};

	return Controller;
});