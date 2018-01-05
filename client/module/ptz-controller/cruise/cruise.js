/**
 * @return {[type]} [球机巡航模块]
 */
define(['/module/ptz-controller/js/control-controller.js'],function() {
	var Cruise = new Class({

		Implements: [Events, Options],

		timer: null, //用于巡航的计时器

		curIndex: 0, //当前调用的预置位下标

		isPausing: false, //是否是暂停状态

		presets: [], //存放所有符合调节的预置位

		cruiseTimer: null, //用于暂停巡航用到的计时器

		options: {
			button: '',
			camera: '',
			index: 0,
			rounds: 0,
			remainTime: 0,
			pass: 0
		},

		initialize: function(options) {
			this.setOptions(options);

			if (this.options.camera.cruisetype === 0) {
				this.autoDataFormat();
			} else {
				this.timeDataFormat();
			}

			if (!this.inRangeTime()) {
				return;
			}

			this.start(this.presets[0], 0);
		},

		start: function(preset, delay) {
			this.callPreset({
				cameraId: this.options.camera.cameraId,
				cameraNo: this.options.camera.cameraNo,
				preset: preset,
				interval: delay
			});
		},

		callPreset: function(params) {
			var self = this;
			this.timer = setTimeout(function() {
				jQuery.ajax({
					url: '/service/ptz/call_preset',
					dataType: 'json',
					type: 'post',
					data: {
						cameraId: self.options.camera.cameraId,
						cameraNo: self.options.camera.cameraNo,
						presetId: params.preset.presetId
					},
					success: function() {
						++self.options.index;
						++self.options.pass;

						self.turn(params.preset.internalTime);
					}
				});
			}, params.interval * 1000);
		},

		turn: function(delay) {
			var self = this;

			//自动巡航  巡航到最后一个预置位,重头开始
			if (this.options.index >= this.presets.length && this.options.camera.cruisetype === 0) {
				this.options.index = 0;
			}

			if (!this.interrupt(delay)) { //判断时间是否已到
				return;
			}

			if (this.isPausing) { //如果是暂停状态,该功能暂时未启用
				this.isPausing = false;
				this.options.index = this.curIndex;

				if (!this.inRangeTime()) {
					self.stop();
					return;
				}

				if (self.options.camera.cruisetype === 1) { //时间段巡航重新取有效预置位,当前index=0
					self.timeDataFormat();
					self.curIndex = 0;
					self.options.index = 0;
				}
			} else {
				this.curIndex = this.options.index;
			}

			var preset = this.presets[this.curIndex];
			this.start(preset, delay);
		},

		stop: function() {
			HeartBeat.stop();
			clearTimeout(this.timer);
			this.timer = null;
			this.options.button.addClass('start blue').removeClass('stop red').html('启动');

			if (this.cruiseTimer) {
				clearTimeout(this.cruiseTimer);
				this.cruiseTimer = null;
			}
		},

		interrupt: function(delay) {
			var self = this;
			//自动巡航停止
			var time = new Date().toTimeString();
			if (time >= this.endTime && this.options.camera.cruisetype === 0) {
				this.stop();
				cameraCache.get(self.options.camera.cameraId).status = 0;
				delete cruiseCache[self.options.camera.cameraId];
				self.presets = null;

				var deferred = gPtz.callPreset({
					cameraId: self.options.camera.cameraId,
					cameraNo: self.options.camera.cameraNo,
					presetId: self.backTo.presetId
				});
				deferred.done(function(data) {
					if (!(data && data.code === 200)) {
						notify.warn('回位点调用失败！');
					}
				});
				return false;
			}

			//时间段巡航停止
			if (self.options.index >= self.presets.length && self.options.camera.cruisetype === 1) {
				self.start(self.presets[self.presets.length - 1], delay);
				self.stop();
				cameraCache.get(self.options.camera.cameraId).status = 0;
				self.options.button.removeClass('wait');
				delete cruiseCache[self.options.camera.cameraId];
				self.presets = null;
				return false;
			}

			return true;
		},

		//巡航开启时,是否在有效时间范围之内
		inRangeTime: function() {
			var self = this;
			var time = new Date().toTimeString();
			if (time >= this.endTime) { //过了结束时间
				notify.warn('当前时间不在巡航时间内，请重设时间！');
				delete cruiseCache[this.options.camera.cameraId];
				return false;
			} else if (time < this.startTime) { //在时间范围
				self.options.button.addClass('stop red wait').removeClass('start blue').html('停止');
				cameraCache.get(self.options.camera.cameraId).status = 2;
				HeartBeat.start();
				PTZController.wait = setTimeout(function() {
					HeartBeat.stop();
					self.options.button.addClass('start');
					self.options.button.trigger('click');
				}, PTZController.formatDate(this.startTime) - PTZController.formatDate(time));

				delete cruiseCache[this.options.camera.cameraId];
				notify.warn('巡航时间未到，请稍后！');
				return false;
			} else if (time >= this.startTime && time < this.endTime) { //未到时间
				HeartBeat.start();
				self.options.button.addClass('stop red').removeClass('start blue').html('停止');
				cameraCache.get(self.options.camera.cameraId).status = 1;
				return true;
			}
		},

		autoDataFormat: function() {
			var self = this;
			var data = self.options.camera;
			var cruiseObj = data.autoCruise;

			self.startTime = PTZController.parseDate(cruiseObj.startTime);
			self.endTime = PTZController.parseDate(cruiseObj.endTime);
			self.presets = cruiseObj.presets;

			self.backTo = {
				presetId: cruiseObj.presetId
			};
		},

		timeDataFormat: function() {
			var self = this;
			var data = self.options.camera;
			var cruiseObj = data.timeCruise;
			this.presets.empty();

			self.startTime = cruiseObj.presets[0].startTime; //整个时间段巡航的开始时间
			self.endTime = cruiseObj.presets[cruiseObj.presets.length - 1].endTime; //整个时间段巡航的结束时间

			var time = new Date().toTimeString();

			var flag = true; //初始值true, 在某个预置位开始结束时间之间时设为false
			if (self.startTime <= time && time < self.endTime) {
				//检查当前时间处于哪个时间点
				for (var j = 0; j < cruiseObj.presets.length; j++) {

					var interval = '';
					var start = cruiseObj.presets[j].startTime; //当前预置位的开始时间
					var end = cruiseObj.presets[j].endTime; //当前预置位的结束时间
					var nextStart = ''; //下个预置位的开始时间

					if (flag) { //
						if (time >= start && time < end) { //在预置位时间范围之内
							flag = false; //确定了时间下次走else
							if (j === cruiseObj.presets.length - 1) {
								nextStart = this.endTime;
							} else {
								nextStart = cruiseObj.presets[j + 1].startTime;
							}
							interval = this.convertToSecond(nextStart) - this.convertToSecond(time); //时间间隔
							cruiseObj.presets[j].internalTime = interval;
							this.presets.push(cruiseObj.presets[j]);
						} else if (time >= end) { //
							flag = true;
						} else if (time < start) { //在上一个预置位结束时间和下一预置位开始时间之间
							flag = false;
							this.startTime = start;
							cruiseObj.presets[j].waitTime = this.convertToSecond(start) - this.convertToSecond(time); //时间未到,等待时间
							cruiseObj.presets[j].internalTime = this.convertToSecond(end) - this.convertToSecond(start); //时间间隔
							this.presets.push(cruiseObj.presets[j]);
						}
					} else {
						if (j === cruiseObj.presets.length - 1) {
							nextStart = this.endTime;
						} else {
							nextStart = cruiseObj.presets[j + 1].startTime;
						}
						interval = this.convertToSecond(nextStart) - this.convertToSecond(start);
						cruiseObj.presets[j].internalTime = interval;
						this.presets.push(cruiseObj.presets[j]);
					}
				}
				//将回位点放入presets
				self.presets.push({
					presetId: cruiseObj.presetId
				});
			}
		},
		//暂停巡航(巡航启动,点击云台其他操作,巡航停止10s)
		pauseCruise: function(camera) {
			clearTimeout(this.timer);
			this.timer = null;

			if (this.cruiseTimer) {
				clearTimeout(this.cruiseTimer);
				this.cruiseTimer = null;
			}

			this.curIndex = this.options.index === 0 ? (this.presets.length - 1) : (this.options.index - 1); //记住当前的巡航到的位置
			this.isPausing = true;

			var condition = this.options.button.is('.red.stop');

			if (condition && !this.options.button.is('.wait')) {
				this.options.button.addClass('pause');
				return true;
			}
		},

		//10s后重新启动巡航
		reStartCruise: function() {
			var self = this;

			// if (button.is('.pause') && button.is('.start')) {
			if (self.options.button.is('.pause')) {
				self.cruiseTimer = setTimeout(function() {
					self.turn();
					self.options.button.removeClass('pause');
				}, 10 * 1000);
			}
		},

		//将时+分转换成秒
		convertToSecond: function(str) {
			var milli = PTZController.formatDate(str);
			return milli / 1000;
		}
	});
	window.Cruise = Cruise;

	return Cruise;
});
