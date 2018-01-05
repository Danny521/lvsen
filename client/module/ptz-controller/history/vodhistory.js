
define([
	'/module/common/js/player2.js',
	'localStorage',
	'jquery',
	'mootools',
	'base.self',
	'handlebars'
], function(_player, localStorage) {

	require(["/module/inspect/download-cloud/js/record-download-all.js"]);
	require(["/module/ptz-controller/history/intelligentMark.js"]);
	require(["/component/cascade/common.cascade.js"]);

	if (location.href.match(/history\/index\.html/gi)) {
		//解决兼容性问题【会导致ie6+chrome插件，录像面板报错】
		localStorage.setItem("loginFlag", 1);
	}

	window.SelectCamera = {};

	window.SelectCamera.MenuData = {};

	window.SelectCamera.ListData = [];

	window.setTimeToOut = {};

	for (var i = 0; i <= 15; i++) {
		window.SelectCamera.ListData[i] = {};
	}
	/**
	 * 显示历史查询面板
	 */
	window.showHidedHistoryPanel = function() {
		if (!window.SelectCamera.selectName) {
			return;
		}
		var historyData = window.SelectCamera.MenuData[window.SelectCamera.selectName];
		//如果没有，则表示当前没有播放录像
		if (!historyData.dialogId) {
			return;
		}
		vodHistory.player.playerObj.SetWebDialog(historyData.dialogId, JSON.stringify({
			"show": true //true为显示，false为隐藏
		}));
	};

	var _vodHistory = function() {

		var self = this,
			fromModule,
			player;
		/**
		 * [savePlayData 保存数据，存储在ListData数组里]
		 * @author huzc
		 * @date   2015-04-21
		 * @param  {[type]}   data  [description]
		 * @param  {[type]}   order [description]
		 * @return {[type]}         [description]
		 */
		this.savePlayData = function(data, index, order) {

			var vodType = data.videos[order][2];

			window.SelectCamera.ListData[index].subindex = order;
			window.SelectCamera.ListData[index].beginTime = data.beginTime;
			window.SelectCamera.ListData[index].endTime = data.endTime;
			window.SelectCamera.ListData[index].vodType = vodType;
			window.SelectCamera.ListData[index].searchData = data;
		};
		/**
		 * [showDialog 弹出历史调阅对话框，对外使用]
		 * @author huzc
		 * @date   2015-04-21
		 * @param  {[type]}   obj  [description]
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		this.showDialog = function(obj, pobj) {
			var self = this,
				data = pobj.data;
			//获取ocx播放器对象
			self.player = pobj.player;
			self.fromModule = pobj.resuorce;
			//初始化数据
			window.SelectCamera.selectName = data.name;
			ControlBar.real2history = true;
			//清空旧数据
			if (!window.SelectCamera.MenuData) {
				window.SelectCamera.MenuData = {};
			}
			window.SelectCamera.MenuData[data.name] = data;
			//显示录像网页对话框
			self.showWebDialog(obj, pobj);
			//隐藏时间轴上的iframe叠加图层，已解决bug【33456】add by zhangyu on 2015/5/23
			jQuery("#winPopup-showframe").hide();
		};
		/**
		 * [winclose 关闭webdialog]
		 * @author huzc
		 * @date   2015-05-11
		 * @param  {[type]}   player [description]
		 * @return {[type]}          [description]
		 */
		this.winclose = function(player) {
			player.playerObj.CloseWebDialog(-1);
			var L = player.playerObj.GetLayout();
			for (var i = 0; i <= L - 1; i++) {
		        var cd = window.SelectCamera.ListData[i];
				if (typeof(cd) == "object") {
					var hd = window.SelectCamera.ListData[i].vodHistory;
					if(hd && hd.dialogId > 0){
                        player.playerObj.CloseWebDialog(hd.dialogId);
					}
				}
				delete cd.vodHistory;
			}
		};
		/**
		 * [judueCloseOrMin 判断CS对话框是关闭还是最小化]
		 * @author chenmc
		 * @date   2015-09-22
		 * @param  {[type]}   player [description]
		 * @return {[type]}          [description]
		 */
		this.judueCloseOrMin = function(player, index, cId) {
			var self = this;
			var attrstr = player.playerObj.GetVideoAttribute(index) + "";
			if (attrstr != "ERROR") {
				var jsonobj = JSON.decode(attrstr);
				if (jsonobj.videoType == 1) {
					self.winclose(player);
					return false;
				}
			}
	   //	var cd = player.cameraData[index];
	  //    使用这个window.SelectCamera.ListData[index]判断，player.cameraData[index]用的地方太多了,中间被人改动了，不准确
	        var cd = window.SelectCamera.ListData[index];
			if (typeof(cd) == "object") {
				var hd = cd.vodHistory;
				if (hd !== undefined) {
					if (hd.cId > 0 && hd.cId === cId) {
						return hd.dialogId;
					} else {
						self.winclose(player);
						return false;
					}
				} else {
					self.winclose(player);
					return false;
				}

			} else {
				self.winclose(player);
				return false;
			}
		};
		/**
		 * 录像播放时，动态高亮显示该播放的录像片段
		 * @Author zhangyu
		 * @Date   2015-10-14T13:52:27+0800
		 * @param  {[type]}
		 * @return {[type]}
		 */
		this.highlightPiece = function(hasPlayTime) {
			if (!window.SelectCamera.selectName) {
				return;
			}
			var self = this,
				historyData = window.SelectCamera.MenuData[window.SelectCamera.selectName];
			//如果没有，则表示当前没有播放录像
			if (!historyData.history) {
				return;
			}
			var searchData = historyData.history,
				searchBeginTime = searchData.hisdata.beginTime,
				historyVideos = searchData.hisdata.videos;
			//获取当前正在播放时的毫秒值
			var curPlayTime = searchBeginTime + hasPlayTime,
				curOrder = 0;
			//遍历历史录像片段，获取当前所在的录像片段索引
			historyVideos.each(function(item, index) {
				if (curPlayTime >= item[0] && curPlayTime <= item[1]) {
					curOrder = index;
					return false;
				}
			});
			//高亮录像片段
			self.player.playerObj.ExeScript(historyData.dialogId, "addActive", curOrder);
		};
		/**
		 * [showWebDialog 弹出历史调阅对话框，对外使用]
		 * @author huzc
		 * @date   2015-04-21
		 * @param  {[type]}   obj  [description]
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		this.showWebDialog = function(obj, pobj) {
			var user_login_info = localStorage.getItem("user_login_info");
			user_login_info = JSON.encode(user_login_info);
			user_login_info = escape(user_login_info);
			var self = this;
			var index = pobj.index;
			var data = pobj.data;
			var player = pobj.player;
			var cId = data.cId || data.id;
			var name = data.name || data.cName || data.playingChannel.cName;
			//	self.winclose(player);   //关键代码
			var jsonObj = {
				"show": true //true为显示，false为隐藏
			};
			var jsonStr = JSON.encode(jsonObj);
			var dialog_Flag = self.judueCloseOrMin(player, index, cId);
			//记录当前焦点索引，关键代码
			player.DialogIndex = index;
			if (dialog_Flag) {
				player.playerObj.SetWebDialog(dialog_Flag, jsonStr);
				return;
			}
			jQuery.get("/service/getCookie",{},function(res){
				if(res.code !== 200){
					notify.wran("请求数据失败");
                    return ;
				}
			var brStyle = {
				"url": "http://" + location.host + "/module/ptz-controller/history/index.html#" + res.data.JSESSIONID,
				"center": false,
				"left": 0,
				"top": 1080,
				"width": 440,
				"height": 252,
				"alpha": 0.1,
				"resize": true,
				"border": {
					"width": 2,
					"color": 13421772
				},
				"title": {
					"text": "历史录像-" + name,
					"color": 15987699,
					"height": 34,
					"fontsize": 14
				},
				"closebtn": {
					"normal": 10066329,
					"hover": 14828338
				},
				"modal": false
			};
			brStyle = JSON.encode(brStyle);
			try {
				var N = player.playerObj.ShowWebDialog(brStyle);
				player.cameraData[index].vodHistory = {
					"dialogId": N,
					"cId": cId,
					"index":index
				};
				/**
				 * 在不查看实时流直接查看历史流时player.cameraData[index]等于-1，
				 * 因此需要存在window.SelectCamera.ListData[index]中
				 */
				if(typeof window.SelectCamera.ListData[index] == "object"){
					window.SelectCamera.ListData[index].vodHistory = {
						index: index,
						dialogId: N,
						cId: cId
					};
				}
			} catch (e) {
				notify.warn("请安装最新版本的ocx");
			}
			/**
			 * 取消绑定的事件，add by zhangyu on 2015/5/26
			 * 1、bug【录像概率性下载不了】
			 * 2、bug【下载到云空间、视图库黑屏的问题】
			 */
			player.removeEvents("WebDialogEvent", {
				internal: false
			});
			/**
			 * 监听信息窗上的事件
			 */
			player.addEvent("WebDialogEvent", function(id, eid, data) {
				if (N == id) {
					if (data == "window.close") {
						if (typeof(player.cameraData[player.DialogIndex]) == "object") {
							delete player.cameraData[player.DialogIndex].vodHistory;
							delete window.SelectCamera.ListData[player.DialogIndex].vodHistory;
						}
						return;
					}
					try {
						var data = JSON.decode(data);
					} catch (e) {
						//console.log("JSON格式错误", data);
					}
					//根据消息类型进行响应
					if(data.type === "window.hide"){
						if (!window.SelectCamera.selectName) {
							return;
						}
						var historyData = window.SelectCamera.MenuData[window.SelectCamera.selectName];
						//如果没有，则表示当前没有播放录像
						if (!historyData.dialogId) {
							return;
						}
						//隐藏录像窗口
						player.playerObj.SetWebDialog(historyData.dialogId, JSON.stringify({
							"show": false //true为显示，false为隐藏
						}));
					} else if (data.type == "ConfirmDialog") {
						new ConfirmDialog({
							message: data.message,
							callback: function () {
								player.playerObj.ExeScript(N, "data.callback", data.callbackParam);
							}
						});
					} else if (data.type == "notify.warn") {
						notify.warn(data.message);
					} else if (data.type == "notify.success") {
						notify.success(data.message);
					} else if (data.type == "console.log") {
						//console.log(data.message);
					} else if (data.type == "playVideo") {

						var hisdata = data.hisdata;
						var order = data.order;
						var text = hisdata.name;
						window.SelectCamera.selectName = text;
						window.SelectCamera.MenuData[text] = data.cameradata;
						/*var beginTime = hisdata.videos[order][0];
						var endTime = hisdata.videos[order][1];*/
						//之前视频是分段的，所以传入该段的开始和结束时间，现在视频是一整段，应该传入整段的开始和结束时间
						var beginTime = hisdata.videos[0][0];
						var endTime = hisdata.videos[hisdata.videos.length - 1][1];
						var vodType = hisdata.videos[order][2];

						if (window.SelectCamera.MenuData[text].history) {

							window.SelectCamera.MenuData[text].history.hisdata = hisdata;
							window.SelectCamera.MenuData[text].history.order = order;
							window.SelectCamera.MenuData[text].history.beginTime = beginTime;
							window.SelectCamera.MenuData[text].history.endTime = endTime;
						} else {
							window.SelectCamera.MenuData[text].dialogId = N;
							window.SelectCamera.MenuData[text].history = {};
							window.SelectCamera.MenuData[text].history.hisdata = hisdata;
							window.SelectCamera.MenuData[text].history.order = order;
							window.SelectCamera.MenuData[text].history.beginTime = beginTime;
							window.SelectCamera.MenuData[text].history.endTime = endTime;
						}
						self.savePlayData(jQuery.extend(hisdata, {
							beginTime: data.beginTime,
							endTime: data.endTime
						}), player.DialogIndex, order);

						//判断时间节点是否一样
						function checkTimeRange(data, index) {
							if (!player.cameraData || !player.cameraData[index] || !player.cameraData[index].history) {
								return true;
							}
							var oldHistoryData = player.cameraData[index].history.hisdata;
							if (data.beginTime === oldHistoryData.beginTime && data.endTime === oldHistoryData.endTime) {
								return false;
							} else {
								return true;
							}
						}
						player.cameraData[player.DialogIndex].history = {
							order: order,
							beginTime: beginTime,
							endTime: endTime,
							vodType: vodType,
							hisdata: hisdata,
							isNeedLoadPvg: checkTimeRange(data, player.DialogIndex)
						};

						//记录搜索的开始结束时间（和片段的开始结束时间有区别）
						var searchBeginTime = data.beginTime;
						var searchEndTime = data.endTime;
						window.ControlBar.PlayListPiece(player, data.index, order, searchBeginTime, searchEndTime, function(order) {
							player.playerObj.ExeScript(N, "addActive", order);
						});

					} else if (data.type == "setTimeToOut") { //记录用户第一次调阅历史录像的时间，只限视频监控模块
						window.setTimeToOut.startTime = data.startTime;
						window.setTimeToOut.endTime = data.endTime;

					} else if (data.type == "download-record-cloud") {
						data.player = player;
						HitoryDownLoad.Tocloud(data);
					} else if (data.type == "download-record-local") {
						data.player = player;
						HitoryDownLoad.Tolocal(data);
					} else if (data.type == "download-record-viewlib") {
						// 入新的视图库 by songxj 2016/04/07
						require(["pvbEnterLib"], function(EnterLib) {
							EnterLib.init(data.historyVideoObj);
						});
					}else if (data.type == "intelligentMark") {
						data.player = player;
						markDeal.init(data);
					} else if (data.type == "complete") {
						pobj.data.index = pobj.index;
						pobj.data.fromModule = self.fromModule;
						//将搜索的历史录像的开始及结束时间传入，首次调阅历史录像时默认是当前时间
						if (window.setTimeToOut.startTime && window.setTimeToOut.endTime) {
							pobj.data.setTimeToOut = window.setTimeToOut;
							pobj.data.flag = false;
						}
						pobj.data.klass=window.permission.klass;
						var importData = JSON.encode(pobj.data);
						var M = player.playerObj.ExeScript(N, "importData", importData);
						HitoryDownLoad.addEvents();
					} else if (data.type == "tvWall") {
						//录像上墙
						require([
							'/module/common/tvwall/js/controllers/tvwall-wheel.js',
							'pubsub',
							'/module/common/tvwall/js/models/tvwall-insert.js'
						], function(mouseTip, PubSub, TVWallController) {
							if (location.href.toString().test(/inspect\/tvwall/)) { //不飘入窗口
								new mouseTip().bindEvents();
								return window.gTvwallArrayGis = ["history", data.cId, data.channelid, data.beginTime, data.endTime, data.vodType];
							}
							//触发隐藏地图播放栏
							PubSub.publishSync("closeMapVideoBar");
							//初始化并显示电视墙
							TVWallController.initData();
							jQuery(".major-reset").css({
								'width': '100%',
								'right': 0
							});
							//获取摄像机参数
							window.gTvwallArrayGis = ["history", data.cId, data.channelid, data.beginTime, data.endTime, data.vodType];
							new mouseTip().bindEvents();
						});
					}
				}
			});
            });
		};
	};
	var vodHistory = new _vodHistory();

	require(["pubsub"], function(PubSub) {
		/**
		 * 用户在使用布防时，需要关闭录像查询结果框,bug[33822]
		 * add by zhangyu on 2015/5/27
		 */
		PubSub.subscribe("closeCsDialog", function() {
			try {
				vodHistory.winclose(vodHistory.player);
			} catch (e) {}
		});
		/**
		 * 录像上墙后，电视墙面板关闭时，需要显示录像查询结果框
		 * add by zhangyu on 2015/11/20
		 */
		PubSub.subscribe("showHistoryPanel", function() {
			try {
				window.showHidedHistoryPanel();
			} catch (e) {}
		});
	});
	return vodHistory;
});