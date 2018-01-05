/**
 * Created by Zhangyu on 2014/12/15.
 * 报警管理中地图上显示滚动报警的相关逻辑
 */
define([
	'js/global-varibale',
	'jquery'
], function(_g, jQuery) {

	var scrollData = function(){};

	scrollData.prototype = {

		init: function(){
			var self = this;
			//事件绑定
			self.bindEvents();
		},
		/**
		 * 地图初始化后加载默认的按钮事件
		 */
		bindEvents: function () {
			var self = this;
			//滚动报警信息的鼠标事件-移入停止
			jQuery(document).on("mouseover", ".alarm-scroll-info .scroll-data", function () {
				//关闭滚动定时器
				self.clearScrollTimer(false);
			});
			//滚动报警信息的鼠标事件-移出开启
			jQuery(document).on("mouseout", ".alarm-scroll-info .scroll-data", function () {
				//开启滚动定时器
				self.startScrollTimer();
			});
			//滚动报警信息的鼠标事件-点击
			jQuery(document).on("click", ".alarm-scroll-info a", function () {
				var id = jQuery(this).attr("data-id");
				var anchor = jQuery(".content-alarms-list li.alarm-info-content[data-id=" + id + "]");
				anchor.addClass("alarm-info-active");
				anchor.trigger("click");
			});
			//窗口大小改变时，同时改变报警滚动的相关信息
			jQuery(window).resize(function () {
				if (jQuery(".alarm-scroll-info").is(":visible")) {
					self.scrollInfoInit();
				}
			});
		},
		/**
		 * 触发滚动
		 */
		triggerScroll: function (cache) {
			var self = this;
			//在左侧报警列表中查找要进行联动显示的报警信息
			var scrollAlarms = cache;
			if (!scrollAlarms || scrollAlarms.length === 0) {
				//如果联动报警的记录为零，则不再显示滚动信息
				//定时处理-如果已经存在定时器，则先删除
				if (_g.scrollInfo.timerObj) {
					clearInterval(_g.scrollInfo.timerObj);
				}
				jQuery(".alarm-scroll-info").hide();
				return;
			}
			//渲染报警信息到滚动显示的容器中
			jQuery(".scroll-data").html(_g.compiler({
				scrolldata: true,
				data: scrollAlarms
			}));
			jQuery(".alarm-scroll-info").show();
			//初始化滚动对象
			self.scrollInfoInit();
			//初始化内容的位置（向右将数据层移出）
			if (_g.scrollInfo.isFirstCall) {
				_g.scrollInfo.data.offset({ left: _g.scrollInfo.curOffsetLeft });
			}
			//定时处理-如果已经存在定时器，则先删除
			if (_g.scrollInfo.timerObj) {
				clearInterval(_g.scrollInfo.timerObj);
			}
			_g.scrollInfo.timerObj = setInterval(function () {
				self.scrollAlarmInfo();
				//显示，以避免出现闪屏
				if (!_g.scrollInfo.data.is(":visible")) {
					_g.scrollInfo.data.show();
				}
			}, _g.scrollInfo.timeSpan);
		},
		/**
		 * 初始化或者重新初始化滚动对象，以应对窗口变化
		 */
		scrollInfoInit: function () {

			_g.scrollInfo.container = jQuery(".alarm-scroll-info");
			_g.scrollInfo.data = jQuery(".scroll-data");
			_g.scrollInfo.dataW = _g.scrollInfo.data.width();
			_g.scrollInfo.containerW = _g.scrollInfo.container.width();
			_g.scrollInfo.containerLeft = _g.scrollInfo.container.offset().left;
			_g.scrollInfo.defaultOffsetLeft = _g.scrollInfo.containerW + _g.scrollInfo.containerLeft;
			if (_g.scrollInfo.isFirstCall) {
				_g.scrollInfo.isFirstCall = false;
				_g.scrollInfo.curOffsetLeft = _g.scrollInfo.defaultOffsetLeft;
			}
		},
		/**
		 * 布控信息的滚动显示函数
		 * @param me 传递的当前类对象
		 */
		scrollAlarmInfo: function () {
			//滚动处理
			if ((_g.scrollInfo.curOffsetLeft - _g.scrollInfo.containerLeft) < 0 && (_g.scrollInfo.dataW + _g.scrollInfo.curOffsetLeft - _g.scrollInfo.containerLeft) <= 0) {
				//如果数据层整体移出父容器，则回归默认位置，重头再来
				_g.scrollInfo.data.offset({ left: _g.scrollInfo.defaultOffsetLeft });
				_g.scrollInfo.curOffsetLeft = _g.scrollInfo.defaultOffsetLeft;
			} else {
				//重新计算数据层向左移动的绝对位置
				_g.scrollInfo.curOffsetLeft = _g.scrollInfo.curOffsetLeft - _g.scrollInfo.dis;
				_g.scrollInfo.data.offset({ left: (_g.scrollInfo.curOffsetLeft) });
			}
		},
		/**
		 * 开启滚动定时器
		 */
		startScrollTimer: function(){
			var self = this;
			_g.scrollInfo.timerObj = setInterval(function () {
				self.scrollAlarmInfo();
			}, _g.scrollInfo.timeSpan);
		},
		/**
		 * 关闭滚动定时器
		 * @param tag - 标记是否清除滚动区域，true为清除，false为保留
		 */
		clearScrollTimer: function(tag) {
			if (_g.scrollInfo.timerObj) {
				if(tag) {
					jQuery(".alarm-scroll-info").hide();
				}
				clearInterval(_g.scrollInfo.timerObj);
			}
		}
	};

	return new scrollData();
});
