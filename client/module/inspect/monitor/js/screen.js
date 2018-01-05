//扩展屏提示问题
window.isHasTvwall = "isHasTvwall";
define([
	"jquery",
	"broadcast",
	"js/controlbar",
	"js/inspect",
	"/module/common/js/player2.js"
], function (jQuery, BroadCast, controlBar, Inspect) {
	var ExpandScreen = function () {
		this._init();
	};
	ExpandScreen.prototype = {
		player: null,
		inspect: null,
		videoLoop: 0,
		_init: function () {
			//新建播放器class
			window.player = this.player = new VideoPlayer();
			this.player.setLayout(4);
			ControlBar.bindEvents(this.player);
			this._addBroadCast();
			this.addEvents();
			this._initInspect(this.player);
			if (window.name === "screen") {
				window.onunload = function () {
					window.closeExtendScreen();
				};
			}
			window.initBroadCastyjgh = true;
		},
		/**
		 * [_initInspect 初始化监巡轮巡类]
		 * @author Mayue
		 * @date   2015-05-05
		 * @param  {[type]}   player [description]
		 * @return {[type]}          [description]
		 */
		_initInspect: function (player) {
			var self = this;
			self.inspect = new Inspect({
				"player": player,
				"events": {
					//到时间后，自动退出时
					"autoExit": function () {},
					//每次进入到下一次的监巡时的事件。data是将要轮巡的摄像机数据
					"inspecting": function (data) {}
				}
			});
		},
		/**
		 * [_startInspect 开始轮巡]
		 * @author Mayue
		 * @date   2015-05-05
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		_startInspect: function (data) {
			var self = this;
			var layout = self.player.getLayout();
			if (layout !== 4) {
				self.player.setLayout(4);
			}
			ControlBar.updataInspect(this.inspect);
			self.inspect.start(data);
		},
		/**
		 * [_stopInspect 停止轮巡]
		 * @author Mayue
		 * @date   2015-05-05
		 * @return {[type]}   [description]
		 */
		_stopInspect: function () {
			this.inspect.stop();
		},
		/**
		 * 单个摄像机发送到扩展屏上时，自动进行播放
		 * @param data - 待播放的数据
		 * @private
		 */
		_autoPlay: function (data) {
			var self = this;
			var cameras = data.cameras;
			for (var i = 0; i < cameras.length; i++) {
				if (cameras[i] !== -1) {
					var curIndex = self._getCurIndex();
					self.player.playSH(Object.clone(cameras[i]), curIndex);
				}
			}
		},
		/**
		 * 寻找可以播放的窗口
		 * @returns {*} - 可播放窗口索引
		 * @private
		 */
		_getCurIndex: function () {
			var self = this,
				ary = self.player.getIdleWindows(),
				curLayout = self.player.getLayout();

			//找到可用的空闲窗口
			if (ary.length > 0) {
				return ary[0];
			} else {
				//当前窗口全为忙碌状态
				self.player.stop(false, self.videoLoop);
				if (self.videoLoop === curLayout) {
					self.videoLoop = 0;
					return self.videoLoop;
				}
				//检查标志位自增
				return self.videoLoop++;
			}
		},
		/**
		 * 无点位摄像机扩展屏播放
		 * @param data - 待播放的数据
		 * @private
		 */
		_noPointPlay: function (data) {
			var self = this;
			var layout = data.layout;
			var nowLayout = self.player.getLayout();
			var cameras = data.cameras;
			if (layout !== nowLayout) {
				jQuery(".icon.split").css("background-position", "0px " + (Math.sqrt(layout) - 1) * (-34) + "px");//布局切换按钮样式
				self.player.setLayout(layout); //切换布局
			}
			var curIndex = self._getFreeWindow();
			//清除左侧树选中标记（视频播放覆盖时有效）
			self._clearSelectMark(curIndex);
			//存储当前扩展屏上的摄像机id数组，以备关闭时清除左侧树勾选标记使用
			self._saveCurPlayingCameraIds(cameras[0]);
			//播放
			self.player.playSH(Object.clone(cameras[0]), curIndex);
		},
		/**
		 * 无点位摄像机播放的时候，如果出现覆盖播放，则清除左侧树选标记
		 * @param index - 待播放的ocx屏幕索引
		 * @private
		 */
		_clearSelectMark: function (index) {
			var self = this;
			if (self.player && self.player.cameraData[index]) {
				BroadCast.emit("clearSelectMark", self.player.cameraData[index]);
			}
		},
		/**
		 * 每次无点位播放时，记录当前正在播放的摄像机id串
		 * @param data - 待播放数据
		 * @private
		 */
		_saveCurPlayingCameraIds: function (data) {
			var self = this, idsArr = [];
			//遍历当前播放器数据
			for (var i = 0; i < self.player.cameraData.length; i++) {
				var tempData = self.player.cameraData[i];
				if (tempData !== -1) {
					idsArr.push(tempData.cId);
				}
			}
			idsArr.push(data.cId);
			//通知存储
			BroadCast.emit("saveCameraidsOnSreen", idsArr);
		},
		/**
		 * 获取空闲窗口
		 * @returns {*|数字[]}
		 * @private
		 */
		_getFreeWindow: function () {
			return this.player.getFreeIndex();
		},
		/**
		 * 轮巡时关闭按钮隐藏
		 * @private
		 */
		_hideCloseBtn: function () {
			jQuery(".panel > .header > .menu .close").closest(".item").hide();
		},
		/**
		 * 显示关闭按钮
		 * @private
		 */
		_showCloseBtn: function () {
			jQuery(".panel > .header > .menu .close").closest(".item").show();
		},
		/**
		 * [_addBroadCast 添加全站通知  绑定事件]
		 * @author Mayue
		 * @date   2015-05-05
		 */
		_addBroadCast: function () {
			var self = this;
			BroadCast.on("ExtendSreen", function (data) {
				self._autoPlay(data);
				self._showCloseBtn();
			});
			BroadCast.on("startExtendSreenInspect", function (data) {
				self._startInspect(data);
				self._hideCloseBtn();
			});
			BroadCast.on("stopExtendSreenInspect", function (data) {
				self._stopInspect(data);
				self._showCloseBtn();
			});
			BroadCast.on("noPointPlay", function (data) {
				self._noPointPlay(data);
				self._showCloseBtn();
			});
		},
		/**
		 * 添加自定义事件监听
		 */
		addEvents: function () {
			var self = this;
			//添加事件监听关闭视频流事件，单个关闭和全部关闭
			self.player.addEvent("CANCELCHECK", function (cameraId) {
				BroadCast.emit("clearSelectMark", {
					"cId": cameraId
				});
			});
		}
	};
	return new ExpandScreen();
});