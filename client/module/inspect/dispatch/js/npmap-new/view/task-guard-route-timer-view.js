/**
 * 警卫路线定时器管理器
 * @author Li Dan
 * @date   2014-12-24
 */
define([''], function(){

	var TimerManager = function(){
		this.init();
	};

	TimerManager.prototype = {
		//定时器
		timers: {},

		//扩展屏
		extendScreen: {},

		//正在活动的摄像机索引（用于自动播放摄像机）
		activeCameras: {},

		//当前的GPS数据
		currGpsInfo: {},

		//当前的摄像机ID
		currCameraId: {},

		//保存当前是否使用GPS
		gpsPlayMode: {},

		//正在播放的摄像机ID（用于GPS消失时手动控制）
		activeCameraIds: {},

		init: function(){
			//初始化扩展屏，均未被占用，value值为警卫路线的ID
			this.extendScreen = {
				0: -1,
				1: -1,
				2: -1,
				3: -1
			};
			//活动摄像机，默认均未活动，value值为摄像机的索引
			this.activeCameras = {
				0: -1,
				1: -1,
				2: -1,
				3: -1
			};
			//当前接收到的GPS信息， 默认为null，value值是GPS信息
			this.currGpsInfo = {
				0: null,
				1: null,
				2: null,
				3: null
			};
			//活动摄像机的ID，默认为-1，value值是摄像机ID
			this.activeCameraIds = {
				0: -1,
				1: -1,
				2: -1,
				3: -1
			};
			//警卫路线上播放的摄像机，默认为-1，播放后记录摄像机ID
			this.currCameraId = {
				0: -1,
				1: -1,
				2: -1,
				3: -1
			};
			//警卫路线对应扩展屏是否正在使用GPS，默认为正在使用，点击暂停按钮后，设置为false;点击播放后，设置为true
			this.gpsPlayMode = {
				0: true,
				1: true,
				2: true,
				3: true
			};
		},
		/**开启定时器
		 * index 唯一序列
		 * config:{func:function(){},time:2000} 定时器方法和时间配置
		 **/
		startTimer: function(index, config) {
			//添加到定时器
			this.timers[index] = window.setInterval(config.func, config.time);
			//立即执行第一次
			config.func();
		},

		//获取某个定时器
		getTimer: function(index) {
			return this.timers[index];
		},

		//清除某个定时器`
		clearTimer: function(index) {
			var self = this;
			clearTimeout(self.getTimer(index));
			//删除这个timer
			delete this.timers[index];
		},

		//获取当前未被占用的扩展屏
		getUnusedScreen: function() {
			var screenIndex = -1; //表示没有空闲屏
			for (var key in this.extendScreen) {
				if (this.extendScreen[key] === -1) {
					screenIndex = key;
					break;
				}
			}
			return screenIndex;
		},
		//根据警卫路线ID获取该警卫路线所在的屏幕索引
		getExtendScreenByRouteId: function(value) {
			var screenIndex = -1;
			for (var key in this.extendScreen) {
				if (this.extendScreen[key] === value) {
					screenIndex = key;
					break;
				}
			}
			return screenIndex;
		},
		//将某个扩展平置为未被占用
		setExtendScreenToUnused: function(value) {
			var screenIndex = this.getExtendScreenByRouteId(value);
			if (screenIndex !== -1) {
				this.extendScreen[screenIndex] = -1;
			}
		},
		/**
		 * 获取全部正在播放的定制器对象，遍历用来全部关闭
		 * add by zhangyu, 2015.09.14
		 */
		getTimers: function() {
			return this.timers;
		}
	};

	return new TimerManager();
});