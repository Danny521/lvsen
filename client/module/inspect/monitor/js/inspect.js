/*global Toolkit:true, HeartBeat:true, WaterMark:true*/
/**
 * 系统摄像机轮训核心代码
 * rewrite by zhangyu 2016.04.08
 */
define([
	"mootools",
	"underscore"
], function(mt, _) {
	var Inspect = new Class({

		Implements: [Options, Events],

		unlockedChannels: [], //未锁定的通道号（主要是轮巡时使用),如果锁定了一个通道，那就从改数组中删除

		lockedChannelsData: [], //被锁定的通道信息  数据格式：[{"c_index":2,"c_item":{"IP":xx,"path":xxx,....}},"channel":2]

		groups: [], //用来存放数据(监巡分组或者轮巡)

		requestTimmer: {
			num: 0,
			timmer: null
		},   // 存储重复预打开句柄

		maxTime: "00:00:00", //获取最大的时间点,即最晚的结束时间

		minTime: "23:59:59",

		isLoopInspect: false, //是否是轮巡，区别于监巡分组 true是轮巡  false是监巡

		gindex: 0, // 循环时依次指向每个监巡组

		g_index: 0, //暂存gindex

		isRunning: false, //用来标示监巡/轮巡是否正在进行中

		isPausing: false, //用来标示监巡/轮巡是否暂停中中

		cindex: 0, // 循环时依次指向每个摄像头组

		c_index: 0, //暂存cindex

		timer: {
			loop: null, //当前时间不满足，下次检测时间是否满足时使用
			nextLoop: null //如果当前时间不存在满足的监巡组，在启动时给予提示(只提示这一次)
		},

		sameChannels: [], //存放相同摄像头的通道号

		preOpenHandle: [], //预打开视频的句柄

		player: null,
		//对外暴露事件接口，供调用方重写
		events: {
			//第一次启动时，已经在监巡组的最后时间之后的事件
			"after": function () {},
			//到时间后，自动退出时的事件
			"autoExit": function () {},
			//每次等待时的时间（包括第一次启动时的和监巡分组中间过程中的等待）
			"before": function () {},
			//每次进入到下一次的监巡时的事件。data是将要轮巡的摄像机数据
			"inspecting": function (data) {},
			//清屏事件
			"clearScreen": function (index) {}
		},

		isFirst: true,//是否是第一次执行start()函数

		initialize: function (options) {
			var self = this;
			self.knum = 0;
			self.highlightFlag = true;
			self.player = options.player;
			_.extend(self.events, options.events);
		},

		/**
		 * [init 初始化各个参数   groups:如果是监巡，则包含-1，代表空白占位；如果是轮巡，则不包含-1 ]
		 * 轮巡是一个对象   监巡是一个数组，数组的每个元素类似于轮巡的对象
		 * @author Mayue
		 * @date   2015-04-25
		 * @param  {[type]}   groups [description]
		 * @return {[type]}          [description]
		 */
		init: function (groups) {
			if (groups) {
				this.isFirst = true;
				this.cindex = 0;
				this.gindex = 0;
				this.maxTime = "0";
				//格式化数据为数组
				this.groups = this.formatGroup(groups);
				//设置监巡还是轮巡
				this.setInspectType(groups);
				//设置最早和最大的时间点
				this.setMaxMinTime(this.groups);
				//预登录
				this.preLogin(this.groups);
				//关闭当前所有视频
				this.closeAll();
				//激活心跳
				window.HeartBeat.start();
			} else {
				this.isFirst = false;
			}
		},
		/**
		 * [setInspectType 设置当前运行的是监巡还是轮巡]
		 * @author Mayue
		 * @date   2015-04-25
		 * @param  {[type]}   groups [description]
		 */
		setInspectType: function (groups) {
			//轮巡数据是对象，监巡数据是数组
			this.isLoopInspect = (typeOf(groups) !== "array");
			//打印信息
			if(this.isLoopInspect) {
				//初始化unlockedChannels数组(仅仅轮巡时执行)
				this.initLoopInspect();
				console.log("开始轮巡处理");
			} else {
				console.log("开始监巡处理");
			}
		},
		/**
		 * [preLogin OCX预登录处理流程]
		 * @author Mayue
		 * @date   2015-04-25
		 * @param  {[type]}   groups [description]
		 */
		preLogin: function (groups) {
			//判断全局预登录开关
			if(!window.ocxPreLogin) {
				return;
			}
			//进入预登录处理流程
			var arr = Array.clone(groups);
			var i = arr.length;
			if (i) {
				while (i--) {
					//遍历监巡分组的每一个分组
					var cameras = arr[i].cameras;
					var j = cameras.length;
					while (j--) {
						var camera = cameras[j];
						if (camera !== -1) {
							var hdChannel = camera.hdChannel;
							var sdChannel = camera.sdChannel;
							this.preLoginChannel(hdChannel);
							this.preLoginChannel(sdChannel);
						}
					}
				}
			}
		},
		/**
		 * [preLoginChannel 每个通道的预登录]
		 * @author Mayue
		 * @date   2015-04-25
		 * @param  {[type]}   arr [description]
		 * @return {[type]}       [description]
		 */
		preLoginChannel: function (arr) {
			var i = arr.length;
			while (i--) {
				var item = arr[i];
				var tem = {
					"ip": item.ip,
					"passwd": item.password,
					"port": item.port,
					"user": item.username
				};
				this.player.login(tem); //登录
			}
		},
		/**
		 * [getGroup 根据索引值获取当前的对应的group]
		 * @author Mayue
		 * @date   2015-04-26
		 * @return {[type]}   [对应的group]
		 */
		getGroup: function () {
			// 计算索引
			if (this.gindex >= this.groups.length) {
				//如果循环索引位置已经超出了当前分组列表，则重头开始
				this.cindex = 0;
				this.gindex = 0;
				//重新计算滚动条的距离，因此将knum值置为0
				if (this.highlightFlag) {
					this.knum2 = this.knum;
					this.highlightFlag = false;
				}
				this.knum = 0;
			}
			var group = this.groups[this.gindex];
			if (this.cindex >= group.cameras.length) {
				//如果循环索引位置已经超出了当前摄像机列表，则重头开始
				this.cindex = 0;
				this.gindex = this.gindex + 1;
				return this.getGroup();
			}
			return group;
		},
		/**
		 * [getUsableGroup 获取可用的一组group，根据当前时间做判断。]
		 * @author Mayue
		 * @date   2015-04-26
		 * @return {[type]}   [一组可用用的group]
		 */
		getUsableGroup: function () {
			var group = this.getGroup();
			//获取当前时间，例如："17:13:46"
			var ntime = Toolkit.formatDate(new Date()).substring(11);
			// 当前时间点不在当前监巡分组group的时间范围（开始结束时间点）之内
			if (!this.isUsable(ntime, group)) {
				this.cindex = 0;
				//请求下一组
				this.gindex = this.gindex + 1;
				return this.getUsableGroup();
			}
			return group;
		},
		/**
		 * [setMaxMinTime 设置当前监巡或者轮巡数据中的最大时间和最小时间]
		 * @author Mayue
		 * @date   2015-04-25
		 * @param  {[type]}   groups [description]
		 */
		setMaxMinTime: function (groups) {
			for (var i = 0; i < groups.length; i++) {
				if (groups[i].endTime > this.maxTime) {
					this.maxTime = groups[i].endTime;
				}
				if (groups[i].startTime < this.minTime) {
					this.minTime = groups[i].startTime;
				}
			}
		},
		/**
		 * [getCameras 获取当前group中按照布局应该播放的摄像头]
		 * @author Mayue
		 * @date   2015-04-27
		 * @param  {[type]}   group [description]
		 * @return {[type]}         [description]
		 */
		getCameras: function (group) {
			//如果当前巡视的摄像机索引超过了该分组的摄像机长度，则从头开始
			if (this.cindex > group.cameras.length) {
				this.cindex = 0;
			}
			//裁剪摄像机列表数组
			var sindex = this.cindex;
			var eindex = this.cindex = sindex + group.layout;
			var result = group.cameras.slice(sindex, eindex);
			return Array.clone(result);
		},
		/**
		 * [formatGroup 格式化调用处传入的参数，统一压成数组]
		 * @author Mayue
		 * @date   2015-04-25
		 * @param  {[type]}   groups [description]
		 * @return {[type]}          [description]
		 */
		formatGroup: function (groups) {
			if (groups) {
				var oGroups = Array.from(groups);
				return Array.clone(oGroups);
			}
		},
		/**
		 * [pause 暂停 （供监巡使用）]
		 * @author Mayue
		 * @date   2015-04-27
		 * @return {[type]}   [description]
		 */
		pause: function () {
			if (this.timer.loop !== null) {
				this.isPausing = true;
				this.clearTimer("loop");
			}
		},
		/**
		 * [cancelPause 取消暂停 （供监巡使用）]
		 * @author Mayue
		 * @date   2015-04-27
		 * @return {[type]}   [description]
		 */
		cancelPause: function () {
			this.start();
			this.isPausing = false;
		},
		/**
		 * [updateGroups 更新group（供轮巡使用）type为false表示锁定，true表示解锁]
		 * 锁定：将this.groups[0].cameras中对应的cameras[i]置为-1，同时将它的值和对应索引保存在this.lockedChannelsData中
		 * 解锁：锁定的逆操作
		 * @author Mayue
		 * @date   2015-04-26
		 * @param  {[type]}   index [description]
		 * @param  {[type]}   type  [description]
		 * @return {[type]}         [description]
		 */
		updateGroups: function (index, type) {
			var cameraId = this.player.cameraData[index].cId;
			var cameras = this.groups[0].cameras;//特殊说明：因为轮巡时，this.groups数组中只有一个元素，所以可以直接读取第一个元素的值
			//解锁
			if (type) {
				var lockData = this.lockedChannelsData;
				for (var j = 0; j < lockData.length; j++) {
					if (lockData[j].c_item.cId === cameraId) {
						cameras[lockData[j].c_index] = lockData[j].c_item;
						lockData.splice(j, 1);
						break;
					}
				}
				//锁定
			} else {
				for (var i = 0; i < cameras.length; i++) {
					if (cameraId === cameras[i].cId) {
						var tem = {
							"c_item": cameras[i],
							"c_index": i
						};
						this.lockedChannelsData.push(tem);
						cameras[i] = -1;
						break;
					}
				}
			}
		},
		/**
		 * [setUnlockedChannels 更新UnlockedChannels数组 从小到大排序]
		 * @author Mayue
		 * @date   2015-04-27
		 * @param  {[type]}   channel [通道索引]
		 */
		setUnlockedChannels: function (channel) {
			this.unlockedChannels.push(channel);
			this.unlockedChannels.sort();
		},
		/**
		 * [unlock 解锁通道（轮巡时使用）]
		 * @author Mayue
		 * @date   2015-04-27
		 * @return {[type]}   [description]
		 */
		unlock: function () {
			var curChannel = this.player.curChannel - 0;
			if (typeof(curChannel) === "number") {
				if (curChannel !== -1) {
					if (_.indexOf(this.unlockedChannels, curChannel) === -1) {
						this.setUnlockedChannels(curChannel); //往unlockedChannels数组中的添加当前通道（按大小顺序）
						this.updateGroups(curChannel, true); //更新this.group数组
						this.groups[0].layout = this.groups[0].layout + 1; //锁定一个通道对应的layout将要减一  解锁时就要加一
						this.player.setFocusWindow(this.player.curChannel); //正在解锁的当前通道聚焦
						if (this.isPausing) {
							this.cancelPause();
						}
					} else {
						notify.error("重复解锁" + curChannel + "!");
					}
				} else {
					notify.error("非法通道号(-1)！");
				}
			} else {
				notify.error("当前通道号格式错误");
			}
		},
		/**
		 * [lock 锁定通道（轮巡时使用）]
		 * @author Mayue
		 * @date   2015-04-27
		 * @return {[type]}   [description]
		 */
		lock: function () {
			var curChannel = this.player.curChannel - 0;
			if (typeOf(curChannel) === "number") {
				if (curChannel !== -1) {
					if (_.indexOf(this.unlockedChannels, curChannel) !== -1) {
						//删除unlockedChannels数组中的当前通道,mootools的方法
						this.unlockedChannels.erase(curChannel);
						//如果锁定全部，则暂停
						if (this.unlockedChannels.length === 0) {
							this.pause();
						}
						this.updateGroups(curChannel, false); //更新this.group数组
						this.groups[0].layout = this.groups[0].layout - 1; //锁定一个通道对应的layout将要减一
						this.player.setFocusWindow(this.player.curChannel); //正在锁定的当前通道聚焦
					} else {
						notify.error("重复锁定" + curChannel + "！");
					}
				} else {
					notify.error("非法通道号(-1)！");
				}
			} else {
				notify.error("当前通道号格式错误")
			}
		},
		/**
		 * [start 启动轮巡或者监巡的主函数]
		 * @author Mayue
		 * @date   2015-04-25
		 * @param  {[type]}   param) { [详见该文件的末尾，对监巡和轮巡时的参数做了示例展示]
		 * @return {[type]}          [description]
		 */
		start: function (param) {
			var self = this;
			// 初始化参数  获取执行状态 只有在param存在的时候才做初始化
			self.init(param);
			//根据时间做中断处理
			var judgeResult = self.judgeTime();
			switch (judgeResult) {
				case 1:
					//当前时间大于最大执行时间【时间过了】，不等了，直接退出
					self.isRunning = false;
					self.afterInspectTime();
					break;
				case -1:
					//当前时间小于最小执行时间【时间未到】，继续等待
					self.isRunning = true;
					self.beforeInspectTime();
					break;
				case 0:
					//时间符合要求
					self.isRunning = true;
					self.amongInspectTime();
					break;
				default:
					break;
			}
		},
		/**
		 * [afterInspectTime 当前时间在最后一个结束时间之后--“不等了，直接退出]
		 * 分为2种情况，第一种是首次启动时直接就不等了，第二种是监巡运行到指定时间退出
		 * @author Mayue
		 * @date   2015-04-26
		 * @return {[type]}   [description]
		 */
		afterInspectTime: function () {
			if (this.isFirst) {
				this.events.after();
			} else {
				this.events.autoExit();
			}
			this.stop();
		},
		/**
		 * [beforeInspectTime 当前时间在第一个开始时间之前--“继续等待”]
		 * @author Mayue
		 * @date   2015-04-26
		 * @return {[type]}   [description]
		 */
		beforeInspectTime: function () {
			//关闭所有视频画面
			this.closeAll();
			//此处不能用isFirst进行判断，因为监巡分组，一次运行中可能停止好多次
			if (!this.timer.nextLoop) {
				notify.warn("目前不存在满足当前时间的摄像头，请稍后...");
				this.events.before();
			}
			this.timer.nextLoop = setTimeout(this.start.bind(this), 30 * 1000);
		},
		/**
		 * 视频预打开功能处理流程
		 * @author zhangyu
		 * @date   2016-04-15
		 */
		inspectPreOpen: function(group){
			window.setTimeout(function() {
				//判断是否全局预打开开关
				if(!window.ocxPreOpen){
					return;
				}
				console.log("进行预处理");
				//进入预打开流程
				self.preOpenNext();
			}, (group.interval - 3) * 1000);
		},
		/**
		 * [amongInspectTime 当前时间在第一个开始时间和最后一个结束时间之间]
		 * @author Mayue
		 * @date   2015-04-26
		 * @return {[type]}   [description]
		 */
		amongInspectTime: function () {
			var self = this,
				//获取分组
				group = self.getUsableGroup(),
				//获取摄像头  监巡时的返回值中会可能包含-1(代表空闲占位)；轮巡时不存在-1的情况，均为可用摄像头
				cameras = self.getCameras(group);
			//清除掉等待定时器
			self.clearTimer("nextLoop");
			//遍历摄像机处理
			if (cameras.length) {
				//切换布局
				self.switchLayout(group.layout, function () {
					//获取相同id的摄像机通道
					self.setSameChannels(cameras);
					//清除id不一样的通道
					self.clearScreen();
					//预处理将要进行的巡视数据
					self.events.inspecting(cameras);
					//依次展开播放(id不一样的视频)
					self.playDifferentVideo(cameras);
					//关闭空闲通道上的画面
					self.clearIdleScreen();
					//预打开延迟进行，给出3秒时间进行预处理
					self.inspectPreOpen(group);
					//开启定时器，递归调用
					self.timer.loop = setTimeout(self.start.bind(self), group.interval * 1000);
				});
			}
		},
		/**
		 * [clearTimer 清除对应的定时器]
		 * @author Mayue
		 * @date   2015-04-26
		 * @return {[type]}   [description]
		 */
		clearTimer: function (timerName) {
			var self = this;
			if (self.timer[timerName] !== null) {
				clearTimeout(self.timer[timerName]);
				self.timer[timerName] = null;
			}
		},
		/**
		 * 预打开下一组要播放的数据
		 */
		preOpenNext: function () {
			this.c_index = this.cindex;
			this.g_index = this.gindex;
			var nextGroup = this.getGroup();
			if (nextGroup) {
				//默认值应该是小于等于5，也就是说在1屏和4屏是启动预打开，这里暂时关闭
				if (nextGroup.layout < 0) {
					this.preOpen(nextGroup);
				} else {
					this.preOpenHandle = [];
				}
			} else {
				this.preOpenHandle = [];
			}
			this.cindex = this.c_index;
			this.gindex = this.g_index;
		},
		/**
		 * 处理预打开
		 * @param obj - 待处理的数据
		 */
		preOpen: function (obj) {
			var self = this,
				group = Object.clone(obj),
				cameras = this.getCameras(group),
				i = 0;
			//关闭所有隐藏的视频(即预打开且还没有显示出来的视频)
			self.closeAllhide();
			//轮巡
			if (self.isLoopInspect) {
				for (i = 0; i < self.unlockedChannels.length; i++) {
					var channel = self.unlockedChannels[i];
					if (cameras[i] !== undefined) {
						var notSame = true;
						for (var j = 0; j < self.sameChannels.length; j++) {
							if (self.sameChannels[j] === channel) {
								notSame = false;
								break;
							}
						}
						if (notSame) {
							self.hidePlay(cameras[i]);
						}
					}
				}
				//监巡
			} else {
				for (i = 0; i < cameras.length; i++) {
					self.hidePlay(cameras[i]);
				}
			}
		},
		/**
		 * 轮巡切换时高亮左侧树标记
		 * @param oldData - 旧的摄像机信息数据
		 * @param newData - 新的摄像机信息数据
		 * @param type - 处理类型，关闭轮巡监巡时，直接清空即可
		 */
		setTreeMark: function (oldData, newData, type) {
			var self = this;
			var oldCameraId = oldData && oldData.cId,
				newCameraId = newData && newData.cId;

			var inspectDom = jQuery(".tree-outtest-container .tree-inspecting-node");

			if (type && type === "clear") {
				jQuery("li.node.selected[data-id='" + newCameraId + "']").removeClass("selected");
				return;
			}
			//取消旧的高亮
			inspectDom.find("li.node.selected[data-id='" + oldCameraId + "']").removeClass("selected");
			//设置新的高亮
			var newNode = inspectDom.find("li.node[data-id='" + newCameraId + "']").addClass("selected");
			//定义此变量(alreadyTriggerClickMoreBtn)是当轮巡时若摄像机的更多（more）操作是展开的，则trigger一次使其不展开，只需要trigger一次即可
			if (window.loop_inspect_obj) {
				if (!window.loop_inspect_obj.alreadyTriggerClickMoreBtn) {
					newNode.find(".more").trigger("click");
					window.loop_inspect_obj.alreadyTriggerClickMoreBtn = true;
				}
			}
			//正在轮巡时将展开的操作按钮隐藏
			if (newNode.hasClass("opened")) {
				newNode.removeClass("opened");
			}
			if (inspectDom.find("li.node[data-id='" + newCameraId + "']").length != 0) {
				var bottom = inspectDom.find("li.node[data-id='" + newCameraId + "']").offset().top;
				var standard = $(window).height() - 24;    //24为(正在轮巡四个字)每个摄像机所占像素高
				if (bottom > standard) {
					self.knum += 24;
					console.log("最终移动距离" + self.knum);
					jQuery("#sidebar-body").find(".tree-panel").scrollTop(self.knum);
				}
			}
		},
		/**
		 * [playDifferentVideo 依次展开播放(cameraID不一样的视频)]
		 * @author Mayue
		 * @date   2015-04-27
		 * @param  {[type]}   cameras [description]
		 * @return {[type]}           [description]
		 */
		playDifferentVideo: function (cameras) {
			//播放每一组视频时将滚动条距离顶端的距离设置为0
			var $sidebarBody = jQuery("#sidebar-body").find(".tree-panel");
			$sidebarBody.scrollTop(0);
			//轮巡
			if (this.isLoopInspect) {
				//[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].sort()   ==> [0, 1, 10, 11, 2, 3, 4, 5, 6, 7, 8, 9]此种排序不满足要求(bug#43289)
				var arrays = _.difference(this.unlockedChannels, this.sameChannels),
					//排序通道位置
					other = Array.sort(arrays, function (a, b) {
						return a - b;
					});
				//遍历通道
				for (var n = 0; n < other.length; n++) {
					var index = other[n];
					/**
					 * 因为cameras的长度可能小于other.length，所以要加不等于undefined的判断
					 * 不等于"same"的情况是因为camera信息和现在播放的数据时一样的，所以在setSameChannel函数中置为-1，在此好判断  -1是锁定的camera
					 */
					if (cameras[n] !== undefined && cameras[n] !== "same" && cameras[n] !== -1) {
						if (this.preOpenHandle.length) {
							//存在预打开的情况
							if (this.preOpenHandle[n] !== "empty") {
								//切流
								this.showPlay(cameras[n], this.preOpenHandle[n], index);
							}
						} else {
							//初次加载
							this.player.playSH(cameras[n], index);
						}
						//添加水印
						window.WaterMark.setWatermark(this.player, index);
						//高亮左侧树标记
						this.setTreeMark(this.player.cameraData[index], cameras[n]);
					}
				}
				//滚动条移位
				if (other.length === 0) {
					if (this.knum2) {
						$sidebarBody.scrollTop(this.knum2);
					}
				}
			} else {
				//监巡
				for (var i = 0; i < cameras.length; i++) {
					if (cameras[i] !== -1 && cameras[i] !== "same") {
						if (this.preOpenHandle.length) {
							//存在预打开的情况
							if (this.preOpenHandle[i] !== "empty") {
								this.showPlay(cameras[i], this.preOpenHandle[i], i);
								this.preOpenHandle.splice(i, 1, "empty");
							}
						} else {
							this.player.playSH(cameras[i], i);
						}
						//添加水印
						window.WaterMark.setWatermark(this.player, i);
					}
				}
			}
		},
		/**
		 * [judgeTime description]
		 * @author Mayue
		 * @date   2015-04-26
		 * @return {[type]}         [1:当前时间在最后一个结束时间之后--“不等了，直接退出”
		 *                             -1:当前时间在第一个开始时间之前--“继续等待”
		 *                             0:当前时间在第一个开始时间和最后一个结束时间之间
		 *                            ]
		 */
		judgeTime: function () {
			var self = this,
				nTime = Toolkit.formatDate(new Date()).substring(11);
			if (nTime < self.minTime) {
				return -1;
			} else if (nTime >= self.maxTime) {
				return 1;
			} else {
				return self.isNeedWait(nTime) ? -1 : 0;
			}
		},

		/**
		 * [clearScreen 清屏  关闭与下一组将要播的不一样的   “一样”具体指的是同一窗口index打开相同的摄像机id  对应setSameChannels函数]
		 * @author Mayue
		 * @date   2015-04-26
		 * @return {[type]}   [description]
		 */
		clearScreen: function () {
			var self = this;
			//轮巡(如果unlockedChannels的能找到)
			if (self.isLoopInspect) {
				var other = _.difference(this.unlockedChannels, this.sameChannels);
				for (var j = 0; j < other.length; j++) {
					this.player.stop(false, other[j]);
					self.events.clearScreen(other[j]);
				}
				//监巡
			} else {
				for (var i = 0; i < this.player.getWindowCount(); i++) {
					if (_.indexOf(this.sameChannels, i) === -1) {
						if (this.player.cameraData[i] !== -1) {
							this.player.stop(false, i);
							self.events.clearScreen(i);
						}
					}
				}
			}
		},
		/**
		 * [stop 主动关闭监巡]
		 * @author Mayue
		 * @date   2015-04-27
		 * @param  {Function} fn [回调函数]   其实同步接口，用不用这个回调没有意义(马越)
		 * @return {[type]}      [description]
		 */
		stop: function (fn) {
			var self = this;
			this.closeAll(); //关闭所有视频
			//清除this.loopTimer定时器
			this.clearTimer("loop");
			this.clearTimer("nextLoop");
			if (typeOf(fn) === "function") {
				fn();
			}
			if (self.requestTimmer) {
				clearTimeout(self.requestTimmer.timmer);
			}
			window.HeartBeat.stop();
		},
		/**
		 * [setSameChannels 获取相同path的通道（比较：“将要播放的下一组中的每个摄像头的id”与“当前对应序号的通道中存储的id”）重新设置this.sameChannels]
		 *    示例说明：如果下一组视频的1号窗口中的cameraid和当前这组视频中给的1号窗口中的cameraid一样时才认为是一样的
		 * @author Mayue
		 * @date   2015-04-26
		 * @param  {[type]}   cameras [description]
		 * @return {[type]}           [description]
		 */
		setSameChannels: function (cameras) {
			var sameChannel = [];
			//监巡
			if (!this.isLoopInspect) {
				for (var i = 0; i < cameras.length; i++) {
					if (cameras[i] !== -1) {
						if (cameras[i].cId === this.player.cameraData[cameras[i].position].cId) {
							sameChannel.push(cameras[i].position);
							//这里修改cameras[i]的值，是因为playDifferentVideo函数时要用，相同的camera信息，置为same就不再做判断处理
							cameras[i] = "same";
						}
					}
				}
			} else {
				//轮巡
				for (var j = 0; j < this.unlockedChannels.length; j++) {
					var channel = this.unlockedChannels[j];
					if (this.player.cameraData[channel] !== -1) {
						for (var k = 0; k < cameras.length; k++) {
							if (cameras[k].cId === this.player.cameraData[channel].cId) {
								sameChannel.push(channel);
								//这里修改cameras[k]的值，是因为playDifferentVideo函数时要用，相同的camera信息，置为same就不再做判断处理
								cameras[k] = "same";
								break;
							}
						}
					}
				}
			}
			this.sameChannels = Array.clone(sameChannel);
		},
		/**
		 * [switchLayout 切换布局  只对监巡时有效]
		 * @author Mayue
		 * @date   2015-04-26
		 * @param  {[type]}   layout [description]
		 * @param  {[type]}   fn [description]
		 * @return {[type]}      [description]
		 */
		switchLayout: function (layout, fn) {
			var self = this;
			if (!self.isLoopInspect) {
				//监巡
				//记录移走前工具栏位置  yuqiu
				var $videoCtrl = jQuery("#videoControl"),
					leftControlPosition = $videoCtrl.css("left");
				//移出
				$videoCtrl.css("left", 10000);
				//切换布局
				window.setTimeout(function () {
					//获取当前ocx布局
					var nowLayout = self.player.getLayout();
					if (nowLayout !== layout) {
						//切换布局
						self.player.playerObj.SetLayout(layout);
					}
					//清空视频播放
					self.player.stopAll();
					//移回工具栏位置  yuqiu
					$videoCtrl.css("left", leftControlPosition);
					//执行回调
					if (typeof fn === "function") {
						fn();
					}
				}, 50);
			} else {
				//轮巡
				if (typeof fn === "function") {
					fn();
				}
			}
		},
		/**
		 * [initLoopInspect 初始化轮巡的2个数组]
		 * 1.lockedChannelsData 当前锁定的数据
		 * 2.unlockedChannels 当前未锁定的通道窗口
		 * @author Mayue modify by zhangyu 2016.04.15
		 * @date   2015-04-25
		 * @return {[type]}   [description]
		 */
		initLoopInspect: function () {
			if (this.isLoopInspect) {
				this.setUnlockChannels();
				this.lockedChannelsData = [];
			}
		},
		/**
		 * 获取未锁定的通道数组
		 * @returns {Array}
		 */
		getUnlockChannels: function () {
			return this.unlockedChannels;
		},
		/**
		 * [setUnlockChannels 更新unlockedChannels数组]
		 * @author Mayue
		 * @date   2015-04-25
		 */
		setUnlockChannels: function () {
			//add by wujigwen on 2015.09.11 添加勾选轮巡功能，废除以上原来的获取方法，新方法为unlockedChannels是勾选的播放窗口
			var i = 0;
			this.unlockedChannels = [];
			if (this.groups[0].freeWindow) {
				for (i = 0; i < this.groups[0].freeWindow.length; i++) {
					this.unlockedChannels.push(parseInt(this.groups[0].freeWindow[i]));
					//设置轮巡时切流不出现转圈
					this.player.EnableLoadingGif(false, this.groups[0].freeWindow[i] - 0);
				}
			} else {
				var layout = this.player.getWindowCount();
				for (i = 0; i < layout; i++) {
					this.unlockedChannels.push(i);
					//设置轮巡时切流不出现转圈
					this.player.EnableLoadingGif(false, i);
				}
			}
		},
		/**
		 * [isUsable 判断当前时间是否在该组对应的开始时间和结束时间之间（即判断当前监巡组的时间是否可用）]
		 * @author Mayue
		 * @date   2015-04-27
		 * @param  {[type]}   ntime [当前时间 格式"17:13:46"]
		 * @param  {[type]}   group [description]
		 * @return {Boolean}        [true：可用    false：不可用]
		 */
		isUsable: function (ntime, group) {
			var stime = group.startTime,
				etime = group.endTime;//例如："17:13:46"
			return ntime >= stime && ntime <= etime;
		},
		/**
		 * [isNeedWait 是否需要继续等待，该函数仅仅只是在多个监巡分组切换时使用，因为有可能整个监巡分组中在一个时间段上存在空闲状态]
		 * @author Mayue
		 * @date   2015-04-27
		 * @param  {[type]}   nTime [当前时间 格式"17:13:46"]
		 * @return {Boolean}        [true:需要   false:不需要]
		 */
		isNeedWait: function (nTime) {
			var result = false;
			for (var i = 0; i < this.groups.length; i++) {
				var isUsable = this.isUsable(nTime, this.groups[i]);
				if (isUsable) {
					result = true;
					break;
				}
			}
			return !result;
		},
		/**
		 * [clearIdleScreen 刷新空闲通道的画面（上一组视频关闭时遗留的一帧画面   例如上一组的4号窗口关闭，但是当前组的4号窗口时没有视频，那么这个最后一帧就需要刷新掉）]
		 * @author Mayue
		 * @date   2015-04-27
		 * @return {[type]}   [description]
		 */
		clearIdleScreen: function () {
			var i = this.player.getWindowCount();
			while (i--) {
				if (this.player.cameraData[i] === -1) {
					this.player.refreshWindow(i);
				}
			}
		},
		/**
		 * [closeAll 关闭所有窗口，并且刷新]
		 * @author Mayue
		 * @date   2015-04-27
		 * @return {[type]}   [description]
		 */
		closeAll: function () {
			var i = 0;
			this.sameChannels = [];
			// 修改关闭轮巡通道，add by wujingwen on 2015.
			if (this.groups[0].freeWindow) {
				var chanel = this.groups[0].freeWindow;
				for (i = 0; i < chanel.length; i++) {
					this.setTreeMark(null, this.player.cameraData[chanel[i]], "clear");
					this.player.playerObj.Stop(false, chanel[i]);
					this.player.refreshWindow(chanel[i]);
					this.player.playerObj.SetStreamLostByIndex(0, chanel[i]);
					this.player.cameraData[chanel[i]] = -1;

				}
			} else {
				i = this.player.getWindowCount();
				while (i--) {
					this.setTreeMark(null, this.player.cameraData[i], "clear");
					this.player.playerObj.Stop(false, i);
					this.player.refreshWindow(i);
					this.player.playerObj.SetStreamLostByIndex(0, i);
					this.player.cameraData[i] = -1;
				}
			}
			this.closeAllhide();
			this.isRunning = false;
		},
		/**
		 * [getInspectStatus 获取监巡状态  对外暴露 ]
		 * @author Mayue
		 * @date   2015-04-23
		 * @return {[type]}   [返回值参看下面注释]
		 *{
		 *	isGoing : Boolean  (false:监巡或者轮巡未启动,下面2个属性将不存在，true:监巡或者轮巡启动中)
		 * 	type : Boolean  (false:监巡，true:轮巡)
		 *  action : Boolean  (对于监巡：该值代表暂停true或者未暂停false    对于轮巡：该值代表锁定true或者未锁定false)
		 *}
		 */
		getInspectStatus: function (index) {
			var obj = {};
			var self = this;
			obj.isGoing = self.isRunning;
			//正在进行轮巡或者监巡
			if (self.isRunning) {
				//读取轮巡还是监巡
				obj.type = self.isLoopInspect;
				//如果是轮巡
				if (self.isLoopInspect) {
					if (_.indexOf(self.unlockedChannels, index) === -1) {
						//该窗口正在使用
						obj.action = true;
					} else {
						obj.action = false;
					}
				} else {
					obj.action = self.isPausing;
				}
			}
			return Object.clone(obj);
		},
		/**
		 * 关闭所有隐藏的视频(即预打开且还没有显示出来的视频)
		 */
		closeAllhide: function () {
			var i = this.preOpenHandle.length;
			if (i) {
				while (i--) {
					if (this.preOpenHandle[i] !== "empty" && this.preOpenHandle[i] > 0) {
						this.player.preCloseStream(this.preOpenHandle[i]);
					}
				}
			}
			this.preOpenHandle = [];
		},
		/**
		 * 预打开 隐藏打开
		 * @param param - 数据
		 */
		hidePlay: function (param) {
			var self = this;
			var result;
			if (param !== -1) {
				//获取可用通道
				var needChannel = (function () {
					if (param.hdChannel && param.hdChannel.length !== 0) {
						return param.hdChannel[0];
					}
					if (param.sdChannel && param.sdChannel.length !== 0) {
						return param.sdChannel[0];
					}
					return {};
				}());
				//自增一次,记录预加载次数
				self.requestTimmer.num += 1;
				//格式化数据
				var params = {
					"user": needChannel.username,
					"passwd": needChannel.password,
					"ip": needChannel.ip,
					"port": needChannel.port,
					"path": needChannel.av_obj
				};
				//预打开
				result = this.player.preOpenStream(params);
				if (result < 0) {
					//预打开失败重复执行预打开
					self.requestTimmer.timmer = setTimeout(function () {
						if (self.requestTimmer.num > 2) {
							self.requestTimmer.num = 0;
							clearTimeout(self.requestTimmer.timmer);
							return;
						}
						self.hidePlay(param);
					}, 1000);
				}
				console.log("result = " + result);
			} else {
				result = "empty";
			}
			this.preOpenHandle.push(result);
		},
		/**
		 * 预打开的情况下，显示画面
		 * @param cObj - 摄像机数据信息
		 * @param handle - 预打开句柄
		 * @param index - 窗口索引
		 */
		showPlay: function (cObj, handle, index) {
			var obj = Object.clone(cObj);
			if (!obj.cStatus) { //在线
				if (handle > 0) {
					obj.cplayStatus = 0; //正常播放
				} else {
					obj.cplayStatus = 1; //播放异常
				}
			} else { //离线
				obj.cplayStatus = 2; //没有进行播放（离线）
			}
			//有权限
			if (this.player.hasPermission(cObj.cId, index)) {
				this.player.prePlayStream(handle, index);
			} else {
				//无权限，没有进行播放（离线）
				obj.cplayStatus = 5;
				this.player.preCloseStream(handle);
				//保留最后一帧处理
				if (handle < 0) {
					this.player.playerObj.SetStreamLostByIndex(0, index);
				}
			}
			this.player.manualFocusChannel = -1;
			this.player.setDisplayStyle(obj, index);
			this.player.saveCameraData(obj, index);
		}
	});
	return Inspect;
});


/***
请勿删除
start(parm)函数的parm参数：
1.轮巡时的参数示例：
{
	"cameras": [{
		"cType": 0,
		"cId": "1",
		"cName": "市局高清测试17_174_1",
		"cStatus": 0,
		"hdChannel": [],
		"sdChannel": [{
			"id": 1,
			"ip": "192.168.60.106",
			"port": 2100,
			"username": "admin",
			"password": "admin",
			"av_obj": "av/nvr/50101017",
			"channel_status": 0,
			"pvg_group_id": 3
		}],
		"camerascore": 0
	}, {
		"cType": 0,
		"cId": "2",
		"cName": "大华高清测试140_1",
		"cStatus": 0,
		"hdChannel": [],
		"sdChannel": [{
			"id": 2,
			"ip": "192.168.60.106",
			"port": 2100,
			"username": "admin",
			"password": "admin",
			"av_obj": "av/nvr/50101025",
			"channel_status": 0,
			"pvg_group_id": 3
		}],
		"camerascore": 0
	}, {
		"cType": 0,
		"cId": "3",
		"cName": "大华高清测试140_9",
		"cStatus": 0,
		"hdChannel": [],
		"sdChannel": [{
			"id": 3,
			"ip": "192.168.60.106",
			"port": 2100,
			"username": "admin",
			"password": "admin",
			"av_obj": "av/nvr/50101033",
			"channel_status": 0,
			"pvg_group_id": 3
		}],
		"camerascore": 0
	}],
	"interval": 11,
	"startTime": "00:00:00",
	"endTime": "23:59:59",
	"layout": 4,
	"loopType": 0
}
2.监巡时的参数示例：
[{
	"groupName": "123",
	"groupNo": 3,
	"watchId": 1,
	"layout": 4,
	"interval": 12,
	"cameras": [{
		"watchId": 1,
		"cameraId": 3,
		"position": 0,
		"cName": "大华高清测试140_9",
		"cId": 1,
		"cType": 0,
		"cCode": null,
		"cStatus": 0,
		"sdChannel": [{
			"id": 3,
			"ip": "192.168.60.106",
			"port": 2100,
			"username": "admin",
			"password": "admin",
			"av_obj": "av/nvr/50101033",
			"channel_status": 0,
			"pvg_group_id": 3
		}],
		"hdChannel": []
	}, -1, -1, -1],
	"endTime": "17:25:15",
	"startTime": "14:45:14",
	"level": 2,
	"id": 4
}, {
	"groupName": "234",
	"groupNo": 3,
	"watchId": 2,
	"layout": 4,
	"interval": 14,
	"cameras": [{
		"watchId": 2,
		"cameraId": 2,
		"position": 0,
		"cName": "大华高清测试140_1",
		"cId": 2,
		"cType": 0,
		"cCode": null,
		"cStatus": 0,
		"sdChannel": [{
			"id": 2,
			"ip": "192.168.60.106",
			"port": 2100,
			"username": "admin",
			"password": "admin",
			"av_obj": "av/nvr/50101025",
			"channel_status": 0,
			"pvg_group_id": 3
		}],
		"hdChannel": []
	}, -1, -1, -1],
	"endTime": "18:05:02",
	"startTime": "16:55:00",
	"level": 1,
	"id": 2
}]
*/