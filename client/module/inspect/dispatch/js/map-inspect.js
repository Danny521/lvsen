/**
 * by mayue on 2015/5/10
 * 地图上摄像机轮训播放相关逻辑
 */
define([
	"jquery",
	"/module/inspect/monitor/js/inspect.js",
	'mootools',
	'base.self',
	"js/sidebar/map-video-play-bar",
	'js/npmap-new/map-variable'
], function(jQuery, Inspect, mt, base, OCX, mapVariable) {
	/*window.JudgeExpand()===1;*/

	var inspect;
	var MapInspect = function() {
		// this._bindEvent();
	};
	MapInspect.prototype = {
		checkInspectTimer: null,
		maskStr: '<div id="inspect-mask">' +
			'<div class="inspect-content">' +
			'<i class="running"></i>' +
			'<span class="word">正在轮巡...</span>' +
			'<a class="ui button blue small-head-btn stop-inspect">停止</a>' +
			'</div>' +
			'</div>',
		maskStr2: '<div id="inspect-mask-map">' +
			'</div>',
		start: function() {
			var self = this;
			var cameras = self._getCheckedData();
			var intervalTime = jQuery('#poll-time input').val().trim();
			if (!self._checkIntervalTime(intervalTime)) {
				return;
			}
			if (!cameras.length) {
				return notify.warn('没有勾选摄像机无法进行轮巡，请勾选后重试');
			}
			jQuery('#poll-time .close').trigger('click');
			var inspectData = {
				"cameras": self._handleCamera(cameras),
				"interval": parseInt(intervalTime, 10),
				"startTime": '00:00:00',
				"endTime": '23:59:59',
				// "endTime": '17:48:10',
				"layout": 4
			};
			self._startInspect(inspectData);
			logDict.insertLog('m1', 'f2', 'o8', '', "摄像机批量轮巡播放");
			self._addMask();
			self._bindStopInspect();
			self.alreadCloseInspect = false;
		},
		/**
		 * [_singleScreenInspect 单屏轮巡]
		 * @author Mayue
		 * @date   2015-05-05
		 * @param  {[type]}   data      [description]
		 * @param  {[type]}   ocxplayer [description]
		 * @return {[type]}             [description]
		 */
		_singleScreenInspect: function(data, ocxplayer) {
			var self = this;
			var player;
			/*if (mapVariable.mapVideoBarPlayer) {
				player = mapVariable.mapVideoBarPlayer;
				if (jQuery('#map-video-play-bar .bar-control').hasClass('down')) {
					jQuery('#map-video-play-bar .bar-control').trigger('click');
				}
			}else{
				player = mapVariable.mapVideoBarPlayer = OCX.init();
			}*/
		    self.player = player = mapVariable.mapVideoBarPlayer = OCX.init();
			OCX.toggleClose(); //取消横栏右侧的关闭按钮
			inspect = new Inspect({
				'player': player,
				'events': {
					'autoExit': function() {
						//隐藏工具条遮罩
						if($(".map-toolbar-mask")[0]){
							$(".map-toolbar-mask").hide();
						}
						notify.info('轮巡结束');
					},
					clearScreen: function(index) {
						self._writeTitle('', index);
					},
					//每次进入到下一次的监巡时的事件。data是将要轮巡的摄像机数据
					'inspecting': function(data) {
						self._writeTitles(data);
					}
				}
			});
			data.layout = player.getWindowCount();
			window.ControlBar.updataInspect(inspect);
			inspect.start(data);
		},
		_writeTitles: function(arr) {
			var self = this;
			for (var i = 0; i < arr.length; i++) {
				self._writeTitle(arr[i].cName, i);
			}
		},
		_writeTitle: function(name, index) {
			OCX.writeTitle({
				'index': index,
				'title': name
			});
		},
		/**
		 * [_expandScreenInspect 扩展屏轮巡]
		 * @author Mayue
		 * @date   2015-05-05
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		_expandScreenInspect: function(data) {
			try {
				if (window.expandWinHandle && window.expandWinHandle.window) {
					BroadCast.emit("startExtendSreenInspect", data);
				} else if(window.localStorage.getItem('ExtenmdScreenIsOpen') === "true"){
                    BroadCast.emit("startExtendSreenInspect", data);
				}else {
					window.expandWinHandle = window.openExpandScreen("/module/inspect/monitor/screen.html", "InspectScreen");
					setTimeout(function() {
						BroadCast.emit("startExtendSreenInspect", data);
					}, 3000);
				}
			} catch (e) {
				window.expandWinHandle = window.openExpandScreen("/module/inspect/monitor/screen.html", "InspectScreen");
				setTimeout(function() {
					BroadCast.emit("startExtendSreenInspect", data);
				}, 3000);
			}
			this._checkScreenInspectStop();
		},
		_checkScreenInspectStop: function() {
			var self = this;
			//如果已经有，先清掉
			if (self.checkInspectTimer) {
				clearInterval(self.checkInspectTimer);
			}
			//开启定时器
			self.checkInspectTimer = setInterval(function() {
				try {
					if (!window.expandWinHandle || !window.expandWinHandle.window) {
						if (!self.alreadCloseInspect) {
							require(["/module/inspect/dispatch/js/npmap-new/task/flat-map.js"], function(flatMap) {
								flatMap.platStopFun();
							});
							//隐藏工具条遮罩
							if($(".map-toolbar-mask")[0]){
								$(".map-toolbar-mask").hide();
							}
							notify.info('轮巡结束');
						}
						self._removeMask();
						clearInterval(self.checkInspectTimer);
						self.checkInspectTimer = null;
					}
				} catch (e) {
					self.stopInspectByCloseWindow();
				}

			}, 1000);
		},
		stopInspectByCloseWindow: function() {
			var self = this;
			if (!self.alreadCloseInspect) {
				require(["/module/inspect/dispatch/js/npmap-new/task/flat-map.js"], function(flatMap) {
					flatMap.platStopFun();
				});
				notify.info('轮巡结束');
			}
			self._removeMask();
			clearInterval(self.checkInspectTimer);
			self.checkInspectTimer = null;
		},
		_startInspect: function(data, player) {
			require(["/module/inspect/dispatch/js/npmap-new/task/flat-map.js"], function(flatMap) {
				flatMap.platPlayFun();
			});
			var screenNum = window.JudgeExpand();
			if (screenNum === 1) { //单屏
				this._singleScreenInspect(data);
			} else if (screenNum === 2) { //非单屏
				this._expandScreenInspect(data);
			}
		},
		//获取勾选的check数据
		_getCheckedData: function() {
			var checkedNode = jQuery('.np-roll-play:visible').find('.checkbox.checked');
			var result = [];
			checkedNode.each(function(index, elm) {
				result.push(jQuery(elm).closest('li').data());
			});
			return result;
		},
		//监巡轮巡时间是否有效
		_checkIntervalTime: function(time) {
			if (!(/^\+?[1-9][0-9]*[s秒]?$/.test(time))) {
				if (parseInt(time, 10) === 0 || time === '' || time === "单位:秒") {
					notify.error("请填写有效的间隔时间！");
				} else {
					notify.error("间隔时间必须为正整数！");
				}
				return false;
			}
			if (parseInt(time, 10) < 10) {
				notify.error("时间间隔不能小于10秒！");
				return false;
			}
			return true;
		},
		_addMask: function() {
			jQuery('#sidebar').find('#inspect-mask').remove();
			jQuery('#sidebar').append(this.maskStr);
			jQuery('#gismap').append(this.maskStr2);
			this._setMarginTop();
			jQuery('.blue-button:visible').addClass('inspect-hidden');
		},
		_setMarginTop: function() {
			//根据是否是地图定位播放来设置高度，add by zhangyu on 2015/5/23
			var top = 0;
			if (jQuery('.blue-button:visible').length > 0) {
				top = window.isPointPlay ? jQuery('.blue-button:visible').offset().top : jQuery('.blue-button:visible').offset().top - 96 + 86; //96是头部黑 蓝 白的高度
			}
			jQuery('#inspect-mask .inspect-content').css('marginTop', top);
		},
		_removeMask: function() {
			var self = this;
			jQuery('#sidebar').find('#inspect-mask').remove();
			jQuery('#gismap').find('#inspect-mask-map').remove();
			jQuery('.blue-button.inspect-hidden').removeClass('inspect-hidden');
			/*if(!self.player){
               self.player = OCX.init();
			}
			//设置轮巡结束后切流出现转圈
			for (var j = 0; j < 16; j++) {
				self.player.playerObj.EnableLoadingGif(true, j);
			}*/
		},
		//格式化轮巡数据
		_handleCamera: function(cameras) {
			var result = [];
			for (var i = 0; i < cameras.length; i++) {
				var camera = cameras[i];
				var tem = {
					"cType": camera.cameratype,
					"cId": camera.id,
					"cName": camera.name,
					"cCode": camera.code,
					"cStatus": camera.status,
					"camerascore": camera.score,
					"hdChannel": camera.hdchannel,
					"sdChannel": camera.sdchannel
				};
				result.push(tem);
			}
			return Array.clone(result);
		},
		_bindStopInspect: function() {
			var self = this;
			var screenNum = window.JudgeExpand();
			if (screenNum === 1) { //单屏
				jQuery('#inspect-mask .stop-inspect').click(function() {
					inspect.stop();
					inspect = null;
					var num = mapVariable.mapVideoBarPlayer.getWindowCount();
					for (var i = 0; i < num; i++) {
						self._writeTitle('', i);
					}
					self._removeMask();
					//如果此时有地图播放栏逻辑，则先关闭之
					jQuery('.np-map-play-bar-close').trigger('click');
					//提示
					//隐藏工具条遮罩
					if($(".map-toolbar-mask")[0]){
						$(".map-toolbar-mask").hide();
					}
					notify.info('轮巡结束');
				});
			} else if (screenNum === 2) { //非单屏
				jQuery('#inspect-mask .stop-inspect').click(function() {
					BroadCast.emit("stopExtendSreenInspect");
					self._removeMask();
					//隐藏工具条遮罩
					if($(".map-toolbar-mask")[0]){
						$(".map-toolbar-mask").hide();
					}
					notify.info('轮巡结束');
					self.alreadCloseInspect = true;
				});
			}
		}
	};
	return new MapInspect();
});