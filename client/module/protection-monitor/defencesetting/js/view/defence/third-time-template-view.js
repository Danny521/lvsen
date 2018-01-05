/**
 * Created by Zhangyu on 2014/12/12.
 * 布防规则设置，时间模板逻辑展现
 */
define([
	// 布防设置工具类函数
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	"jquery",
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-time-ctrl.js"
], function(DefenceTools, jQuery) {

	var TimePlateView = (function(scope, $) {

		var //时间段输入控件对象；
			_timeSlotCtrlObj = null,
			//模板渲染对象
			_compiler = null,
			//模板的地址
			_templateUrl = "/module/protection-monitor/defencesetting/inc/defence/defence-time-template.html",
			//逻辑控制器对象
			_controller = null;
		/**
		 * 注册模板事件
		 * @private
		 */
		var _registerHelper = function () {

			//用于时间模板显示日期名字
			Handlebars.registerHelper("GetWeekDayName", function (weekday) {
				switch (weekday) {
					case 1:
						return "一";
					case 2:
						return "二";
					case 3:
						return "三";
					case 4:
						return "四";
					case 5:
						return "五";
					case 6:
						return "六";
					case 0:
						return "日";
					default:
						return "error";
				}
			});
			//根据后台回传的参数（0~6）获取对应的英文名称
			Handlebars.registerHelper("FormateWeekday", _formateWeekday);
			//展现时间模板时，显示时间片段
			Handlebars.registerHelper("GetTimeSlotPosition", function (begintime, endtime) {
				//计算当前时间碎片的位置
				var slotInfo = scope.getTimeMinutes({
					startTime: begintime,
					endTime: endtime
				}), rate = 170 / (24 * 60), leftPos = slotInfo.startTime * rate, rightPos = 170 - slotInfo.endTime * rate;
				//展现滑块
				return "left:" + leftPos + "px; right:" + rightPos + "px";
			});
			//当前规则是否使用了全部日期，如果是，则勾中全选
			Handlebars.registerHelper("CheckAllWeekDay", function (slotList, options) {
				var useAllDay = true;
				for (var i = 0; i < slotList.length; i++) {
					if (!slotList[i].timeList || slotList[i].timeList.length === 0) {
						useAllDay = false;
					}
				}
				if (useAllDay) {
					return options.fn(this);
				}
			});
		};
		/**
		 * 鼠标点击星期中某天后的时间设置按钮后触发
		 * @private
		 */
		var _eventHandlerOnClickTimeItems = function () {
			if ($(this).hasClass("active")) {
				//做兼容，ocx的层级太高会把弹窗挡住，所以在弹窗出现的时候影藏ocx. by wangxiaojun 2015-01-04
				// document.getElementById("UIOCXDEFEND").style.marginLeft = "-9999px";
				document.getElementById("UIOCXDEFEND").style.visibility = "hidden";
				// document.getElementById("UIOCXDEFEND").RefreshVideoWindow(0);
				// jQuery(".content-down-video").css("margin-left","9999px");
				// document.getElementById("UIOCXDEFEND").ShowOrHideOCX(false);
				//触发事件，初始化并弹出时间段设置对话框
				var curWeekDay = $(this).closest(".time_info").attr("data-weekday");
				
				setTimeout(function(){_controller.showTimeDialog(curWeekDay);},200);


			}
		};
		/**
		 * 鼠标点击星期中某天前的勾选框（包括全选）后触发
		 * @private
		 */
		var _eventHandlerOnClickCheckBox = function () {
			var curWeekDay;

			if ($(this).hasClass("check-all")) {
				//全选按钮
				if ($(this).prop("checked")) {
					$(".rule-time-template .time_info input[class!='check-all']").prop("checked", true);
					//时间设置可用
					$(".rule-time-template .time_info i").addClass("active");
					//触发设置时间段的可用性
					_controller.setTimeSlotStatus(true, "all", "");
					//刷新页面
					$(".rule-time-template .time_info span").each(function () {
						//触发将24小时添加到该日期时间段
						curWeekDay = $(this).closest(".time_info").attr("data-weekday");
						_controller.addTimeSlotOnChecked(curWeekDay, $(this));
					});
				} else {
					$(".rule-time-template .time_info input[class!='check-all']").prop("checked", false);
					//时间设置不可用
					$(".rule-time-template .time_info i").removeClass("active");
					//触发设置时间段的可用性
					_controller.setTimeSlotStatus(false, "all", "");
					//刷新页面
				}
			} else {
				curWeekDay = $(this).closest(".time_info").attr("data-weekday");
				//指定按钮
				if ($(this).prop("checked")) {
					//如果已经全部选择，则勾选全选框
					if (_allChecked()) {
						$(".rule-time-template .time_info input[class='check-all']").prop("checked", true);
					}
					//时间设置可用
					$(this).parent().siblings("i").addClass("active");
					//触发将24小时添加到该日期时间段
					var curDomObj = $(this).closest(".time_info").find("span");
					_controller.addTimeSlotOnChecked(curWeekDay, curDomObj);
					//触发设置时间段的可用性
					_controller.setTimeSlotStatus(true, "single", curWeekDay);
				} else {
					//一旦取消选中，则取消选中全选按钮
					$(".rule-time-template .time_info input[class='check-all']").prop("checked", false);
					$(this).parent().siblings("i").removeClass("active");
					//触发设置时间段的可用性
					_controller.setTimeSlotStatus(false, "single", curWeekDay);
				}
			}
		};
		/**
		 * 时间设置对话框的关闭及取消事件的处理程序
		 * @private
		 */
		var _eventHandlerOnDialogClose = function () {
			//做兼容，ocx的层级太高会把弹窗挡住，先影藏ocx,在弹窗关闭的时候显示ocx. by wangxiaojun 2015-01-04
			// document.getElementById("UIOCXDEFEND").style.marginLeft = "";
			document.getElementById("UIOCXDEFEND").style.visibility = "visible";
				// jQuery(".content-down-video").css("margin-left","");
			// 
			// document.getElementById("UIOCXDEFEND").ShowOrHideOCX(true);

			//关闭对话框及遮罩层
			$(".rule-time-template .time_layout, .rule-time-template .time_layout_ifr, .rule-time-template .dialog").addClass("hidden");
		};
		/**
		 * 时间对话框中添加时间片段
		 * @private
		 */
		var _eventHandlerOnDialogAddTimeSlot = function () {
			//触发添加一个时间片段
			var begintime = _timeSlotCtrlObj.getTime("begintime"), endtime = _timeSlotCtrlObj.getTime("endtime");
			_controller.addTimeSlotEvent(begintime, endtime);
		};
		/**
		 * 时间对话框中删除时间片段
		 * @private
		 */
		var _eventHandlerOnDialogDelTimeSlot = function () {
			var $This = $(this);
			$This.closest("p").slideUp("fast", function () {

				$(this).remove();
				//判断是否全部删除
				var slotList = $(".rule-time-template .time-dialog .dialog_body .time_list dd");
				if (slotList.find("p").length === 0) {
					//显示默认值
					slotList.html("<p><span class='style-text-info'>当前还没有添加任何报警时间段。</span></p>");
				}
				//同步更新到时间参数对象中
				var slotArr = $This.prev().html().split("-");
				_controller.delTimeSlotEvent(slotArr);
			});
		};
		/**
		 * 时间对话框中保存/确定时间片段
		 * @private
		 */
		var _eventHandlerOnDialogSaveTimeSlot = function () {
			//做兼容，ocx的层级太高会把弹窗挡住，先影藏ocx,在弹窗关闭的时候显示ocx. by wangxiaojun 2015-01-04
			// document.getElementById("UIOCXDEFEND").style.marginLeft = "";
			document.getElementById("UIOCXDEFEND").style.visibility = "visible";
			// jQuery(".content-down-video").css("margin-left","");
			// 
			// document.getElementById("UIOCXDEFEND").ShowOrHideOCX(true);
			//同步更新到时间参数对象中
			_controller.saveTimeSlotEvent();
		};
		/**
		 * 绑定星期中日期的时间列表事件
		 * @private
		 */
		var _bindEvents = function () {

			var $timeInfo = $(".rule-time-template .time_info");
			//设置时间列表点击事件
			$timeInfo.find("i").on("click", _eventHandlerOnClickTimeItems);
			//时间模板前的checkbox点击事件
			$timeInfo.find("input[type='checkbox']").on("click", _eventHandlerOnClickCheckBox);

			// 时间段，鼠标悬浮，显示具体的时间数字
			jQuery(".rule-time-template em").hover(function(event) {
				var left = event.pageX - 100,
					top = event.pageY - 124,
					timeArea = jQuery(this).attr("data-startTime") + "-" + jQuery(this).attr("data-endTime");

				jQuery("#time-tips").text(timeArea).css({
					left: left,
					top: top
				}).show();
			}, function() {
				jQuery("#time-tips").hide();
			});
		};
		/**
		 * 时间设置弹出层上的事件绑定
		 * @private
		 */
		var _bindDialogEvents = function () {
			//弹出层的关闭事件&取消事件
			$(".rule-time-template .dialog .dialog_title .close, .rule-time-template .dialog .dialog_foot .cancel").off("click").on("click", _eventHandlerOnDialogClose);
			//添加时间段事件
			$(".rule-time-template .time-dialog .dialog_body .select_time a").off("click").on("click", _eventHandlerOnDialogAddTimeSlot);
			//删除时间段事件
			$(".rule-time-template .time-dialog .dialog_body .time_list .icon_delete").off("click").on("click", _eventHandlerOnDialogDelTimeSlot);
			//时间段编辑确认按钮点击事件
			$(".rule-time-template .dialog .dialog_foot .save").off("click").on("click", _eventHandlerOnDialogSaveTimeSlot);
		};
		/**
		 * 判断时间模块，各工作日列表项是否全部勾选
		 * @returns {boolean} - 返回全部勾选如否
		 * @private
		 */
		var _allChecked = function() {

			var allCheckFlag = true;

			//判断是否已经全部选择
			$(".rule-time-template .time_info input[class!='check-all']").each(function () {
				if (!$(this).prop("checked")) {
					allCheckFlag = false;
					//退出循环
					return false;
				}
			});

			return allCheckFlag;
		};
		/**
		 * 根据后台传递的json对象解析日期
		 * @param weekday - 待转化的星期标示
		 * @returns {string} - 返回转化后的星期标示
		 * @private
		 */
		var _formateWeekday = function (weekday) {
			switch (weekday) {
				case 1:
					return "monday";
				case 2:
					return "tuesday";
				case 3:
					return "wednesday";
				case 4:
					return "thursday";
				case 5:
					return "friday";
				case 6:
					return "saturday";
				case 0:
					return "sunday";
				default:
					return "error";
			}
		};
		/**
		 * 显示时间模板
		 * @param timeParam - 待显示的时间模板数据
		 * @private
		 */
		var _showTimeTemplate = function (timeParam) {

			//渲染模板，动态添加
			DefenceTools.loadTemplate(_templateUrl, function (compiler) {
				//加载成功
				_compiler = compiler;
				//渲染模板
				var templateData = $.extend({}, timeParam, { timeplate: true });
				$(".alarm-events-rule-detail ul li .rule-time-template").html(_compiler(templateData));
				//绑定事件
				_bindEvents();

			}, function () {//模板加载失败
				notify.error("加载时间模板失败！");
			});
		};
		/**
		 * 初始化函数
		 * @param timeParam - 时间模板的日期数据
		 * @param controller - 时间模板逻辑控制器
		 */
		scope.init = function (timeParam, controller) {

			_controller = controller;
			//显示时间模板
			_showTimeTemplate(timeParam);
			//注册模板事件
			_registerHelper();
		};
		/**
		 * 获取时间的秒数，方便进行重叠比较
		 * @param timeInfo - 带转换时间段
		 * @returns {{startTime: number, endTime: number}} - 转换后的时间段
		 */
		scope.getTimeMinutes = function (timeInfo) {
			//根据：对时间信息进行拆分，然后获取秒数
			var infoBeginArr = timeInfo.startTime.split(":"), infoEndArr = timeInfo.endTime.split(":"), beginMinutes = 0, endMinutes = 0;
			if (infoBeginArr.length === 2) {
				beginMinutes = parseInt(infoBeginArr[0]) * 60 + parseInt(infoBeginArr[1]);
			}
			if (infoEndArr.length === 2) {
				endMinutes = parseInt(infoEndArr[0]) * 60 + parseInt(infoEndArr[1]);
			}
			return {
				startTime: beginMinutes,
				endTime: endMinutes
			};
		};
		/**
		 * 显示某工作日时间段设置对话框
		 * @param curDayTimeList - 当前工作日的时间列表
		 */
		scope.showTimeSettingDlg = function (curDayTimeList) {
			//渲染模板
			$.extend(curDayTimeList, { dialog: true });
			$(".time-dialog").html(_compiler(curDayTimeList));
			//弹出遮罩层
			$(".rule-time-template .time_layout, .rule-time-template .time_layout_ifr, .rule-time-template .dialog").removeClass("hidden");
			//初始化时间段控件对象
			_timeSlotCtrlObj = $(".time-input-ctrl").TimeSelect({
				parentBorder: {
					"borderColor": "#afbfd0"
				},
				controlsBorder: {
					"borderColor": "#c7ccd1"
				}
			});
			//绑定事件
			_bindDialogEvents();
		};
		/**
		 * 添加时间片段后刷新时间段列表
		 * @param slotData - 新添加的事件段数据
		 */
		scope.renderAfterAddSlot = function (slotData) {
			var $timeSlot = $(".rule-time-template .time-dialog .dialog_body .time_list dd");

			//如果当前列表有默认信息，则删除
			$timeSlot.find(".style-text-info").parent().remove();
			//加载成功
			$.extend(slotData, { addtimeslot: true });
			$(_compiler(slotData)).appendTo($timeSlot).slideDown("fast");
			//对添加的时间段元素绑定事件
			_bindDialogEvents();
		};
		/**
		 * 显示当前时间段
		 * @param curDayTimeList - 当前日期下的时间段列表
		 * @param curWeekDay - 当前日期标示
		 */
		scope.showTimeSlotSegment = function (curDayTimeList, curWeekDay) {

			//获取要渲染的时间条对象
			var renderObj = $(".rule-time-template .time_info span." + _formateWeekday(parseInt(curWeekDay))), //获取总宽度和24小时的比值，方便后面进行计算(以分钟为单位px)
				rate = renderObj.width() / (24 * 60);
			//清空掉之前的内容
			renderObj.empty();
			//遍历当前日期的时间段列表
			for (var i = 0, length = curDayTimeList.timeList.length; i < length; i++) {
				//获取时间段的分钟单位对象
				var tempSlot = scope.getTimeMinutes(curDayTimeList.timeList[i]), //计算当前时间段的left\rigth（绝对）
					leftPos = tempSlot.startTime * rate, 
					rightPos = renderObj.width() - tempSlot.endTime * rate,
					startTimeStr = scope.formatData(tempSlot.startTime),
					endTimeStr = scope.formatData(tempSlot.endTime);
				//展现滑块
				var tempSlotObj = $("<em>").css({
					left: leftPos + "px",
					right: rightPos + "px"
				}).attr("data-startTime", startTimeStr.hour + ":" + startTimeStr.minute).attr("data-endTime", endTimeStr.hour + ":" + endTimeStr.minute);
				renderObj.append(tempSlotObj);
				tempSlotObj.hover(function(event) {
					var left = event.pageX - 100,
						top = event.pageY - 124,
						timeArea = jQuery(this).attr("data-startTime") + "-" + jQuery(this).attr("data-endTime");

					jQuery("#time-tips").text(timeArea).css({
						left: left,
						top: top
					}).show();
				}, function() {
					jQuery("#time-tips").hide();
				});
			}
			//获取全选checkbox对象
			var $checkAllObj = $(".rule-time-template .time_info input[class='check-all']");
			//根据时间片段来更新时间模板状态
			if (curDayTimeList.timeList.length === 0) {
				//该日期下的时间段均被删除完，则取消其前面的勾选
				renderObj.prev().find("input[type='checkbox']").prop("checked", false);
				//禁用该日期的时间设置按钮
				renderObj.next().removeClass("active");
				//如果全选勾选了，则取消
				if($checkAllObj.prop("checked")) {
					$checkAllObj.prop("checked", false);
				}
			} else {
				//判断全选是否需要勾选
				if(_allChecked()) {
					$checkAllObj.prop("checked", true);
				}
			}
			//退出时间模板的编辑模式
			$(".rule-time-template .dialog .dialog_title .close").trigger("click");
		};
		/**
		 * [formatData 将分钟转化成小时 + 分钟 的字符串格式]
		 * @param  {[type]} minutes [description]
		 * @return {[type]}         [description]
		 */
		scope.formatData = function(minutes) {
			if (!Number(minutes)) {
				return {
					hour: "00",
					minute: "00"
				};
			}

			return {
				hour: minutes/60 > 9 ? minutes/60 : "0" + minutes/60,
				minute: minutes%60 > 9 ? minutes%60 : "0" + minutes%60
			};
		};

		return scope;

	}(TimePlateView || {}, jQuery));

	var View = function () {};

	View.prototype = {
		//初始化函数
		init: TimePlateView.init,

		//显示某工作日时间段设置对话框
		showTimeSettingDlg: TimePlateView.showTimeSettingDlg,

		//添加时间片段后刷新时间段列表
		renderAfterAddSlot: TimePlateView.renderAfterAddSlot,

		//在时间条上显示当前日期对应的时间段
		showTimeSlotSegment: TimePlateView.showTimeSlotSegment,

		//获取时间的秒数，方便进行重叠比较
		getTimeMinutes: TimePlateView.getTimeMinutes,

		/**
		 * 在某星期标示下添加全（24h）时间段时刷新时间条
		 * @param obj - 对应日期时间条dom对象
		 */
		renderAllTime: function (obj) {
			obj.html("<em style='left:0;right:0;'></em>");
		}
	};

	return new View();
});