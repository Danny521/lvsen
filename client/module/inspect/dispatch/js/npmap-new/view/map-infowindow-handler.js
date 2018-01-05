/**
 * Created by Zhangyu on 2015/4/8.
 */
define([
	"js/npmap-new/map-variable",
	"js/npmap-new/controller/map-things-search",
	"/module/ptz-controller/history/vodhistory.js",
	"js/npmap-new/task/path-planning",
	"js/npmap-new/controller/maptool-select-controller"
], function(Variable, MapThingsSearch, vodHistory, PathPlanning) {

	return (function (scope, $) {

		var //当前点位信息数据
			_position = null,
			//事件处理程序
			_eventHandler = {
				//发送到扩展屏
				sendtoextend: function (e) {
					require(["js/npmap-new/map-common-extendscreen"], function (Extendscreen) {
						Extendscreen.sendToExtendScreen();
						//关闭信息窗
						window.infowindow.closeInfoWindow();
					});
					e.stopPropagation();
				},
				//发送到电视墙
				sendtotvwall: function (e) {
					require(["js/npmap-new/map-common-tvwall"], function (TVWall) {
						TVWall.sendToTvwall();
					});
					e.stopPropagation();
				},
				//历史调阅
				history: function (e) {
					var pobj = {
						index: 0,
						data: Variable.currentCameraData,
						player: Variable.videoPlayerSigle,
						resuorce:"form_dispatch"
					};
					//格式化数据
					pobj.data.hdchannel = pobj.data.hdchannel ? pobj.data.hdchannel : pobj.data.hd_channel;
					pobj.data.sdchannel = pobj.data.sdchannel ? pobj.data.sdchannel : pobj.data.sd_channel;
					//调用历史调阅信息窗
					vodHistory.showDialog({
						center: true
					}, pobj);
					//日志记录，查询XX摄像机的历史视频,add by wujingwen, 2015.08.31
					if(location.href.indexOf("dispatch") >= 0){
						logDict.insertMedialog("m1", "查看：" + Variable.currentCameraData.name + "->摄像机历史视频", "f2", "o4", Variable.currentCameraData.name);
					}else{
						logDict.insertMedialog("m1", "查看：" + Variable.currentCameraData.name + "->摄像机历史视频", "f1", "o4", Variable.currentCameraData.name);
					}
					e.stopPropagation();
				},
				//纠错
				recovery: function (e) {
					notify.info("正在完善中");
					e.stopPropagation();
				},
				//手动报警
				manual:function(e){
					require(["/module/inspect/manual-alarm/js/manual-alerm-view.js"], function (manualView) {
						manualView.init(Variable.videoPlayerSigle);
					});
					e.stopPropagation();

				},
				//信息窗关闭
				close: function (e) {
					//关闭信息窗
					window.infowindow.closeInfoWindow();
					e.stopPropagation();
				},
				//到这里去
				originRouteSearch: function(e) {
					var el = $(this),
						data = el.prev().find("input").data();
					if (data.address) {
						var param = {
							el: el,
							data: $.extend({}, data, {
								name: el.prev().find("input").val()
							}),
							position: _position,
							type: "endhere"
						};
						//关闭信息窗
						window.infowindow.closeInfoWindow();
						//搜索路径
						PathPlanning.searchPath(param);
					} else {
						notify.warn("请输入合适的起点！");
					}
					e.stopPropagation();
				},
				//从这里出发
				destRouteSearch: function (e) {
					var el = $(this),
						data = el.prev().find("input").data();
					if (data.address) {
						var param = {
							el: el,
							data: $.extend({}, data, {
								name: el.prev().find("input").val()
							}),
							position: _position,
							type: "fromhere"
						};
						//关闭信息窗
						window.infowindow.closeInfoWindow();
						//搜索路径
						PathPlanning.searchPath(param);
					} else {
						notify.warn("请输入合适的终点！");
					}
					e.stopPropagation();
				},
				//搜索周围摄像机
				cameraSearch: function (e) {
					//搜索附近的摄像机
					MapThingsSearch.triggerSearchInCircle(0, _position);
					e.stopPropagation();
				},
				//搜索周围报警信息
				alarmSearch: function (e) {
					//搜索附近的报警信息
					MapThingsSearch.triggerSearchInCircle(1, _position);
					e.stopPropagation();
				},
				//搜索周围警车
				policeCarSearch: function (e) {
					//搜索附近的警车GPS
					MapThingsSearch.triggerSearchInCircle(2, _position);
					e.stopPropagation();
				},
				//搜索周围警员
				policeSearch: function (e) {
					//搜索附近的警员350M
					MapThingsSearch.triggerSearchInCircle(3, _position);
					e.stopPropagation();
					return false;
				},
				//搜索周围灯杆
				lightbarSearch: function (e) {
					//搜索附近的灯杆
					MapThingsSearch.triggerSearchInCircle(4, _position);
					e.stopPropagation();
				},
				//搜索周围卡口
				bayonetSearch: function (e) {
					//搜索附近的卡口
					MapThingsSearch.triggerSearchInCircle(5, _position);
					e.stopPropagation();
				},
				//输入搜索周围任意资源
				normalSearch: function (e) {
					//搜索附近的normal
					var inputValue = $.trim($(this).prev().children("input").val());
					if(inputValue === ""){
						notify.warn("搜索内容不能为空！");
					} else {
						//判断输入长度
						if(inputValue.length > 30) {
							notify.warn("搜索内容应在30个字符以内！");
							return;
						}
						MapThingsSearch.triggerSearchInCircle(6, _position, inputValue);
					}
					e.stopPropagation();
				}
			};
		/**
		 * 事件绑定
		 */
		scope.bindEvents = function (position) {

			//存储当前点位信息数据
			_position = position;
			//弹出窗顶部事件绑定
			$(".infowindow-title .btns").find("i[data-handler]").map(function () {
				$(this).on("click", _eventHandler[$(this).data("handler")]);
			});
			//绑定选项卡内容
			$(".footer-tabs").tabControl(".footer-tabs-content");
			//绑定footer区事件
			$(".infowindow-footer .footer-tabs-content").find("[data-handler]").map(function () {
				$(this).on("click", _eventHandler[$(this).data("handler")]);
			});
			PathPlanning.init(window.map);
			//监听输入框
			$(".infowindow-footer .footer-tabs-content input.input-search-address").watch({
				wait: 200,
				captureLength: 0,
				//监听的输入长度
				callback: function(key) {
					var Input = $(".infowindow-footer .footer-tabs-content input[name='start-point']");
					PathPlanning.initWin({
						el: $(this.el),
						map: map,
						key: key
					});
				}
			});
		};
		return scope;

	}({}, jQuery));

});