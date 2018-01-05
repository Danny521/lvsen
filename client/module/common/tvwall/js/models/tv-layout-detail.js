/*global TvLayoutBase:true */
/**
 * [电视墙具体操作类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	'/module/common/tvwall/js/controllers/tv-layout-base.js',
	'ajaxModel',
	'/module/common/tvwall/js/views/tvwall-views.js',
], function(TvLayoutBase, ajaxModel, tvwallViews) {
	var tvwallViews = new tvwallViews();

	function TvLayoutDetail() {
			this.initialize(this.options);
		}
		/**
		 * [prototype description]
		 * @type {TvLayoutBase}
		 */
	TvLayoutDetail.prototype = new TvLayoutBase();
	/**
	 * [initialize description]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   options [description]
	 * @return {[type]}           [description]
	 */
	TvLayoutDetail.prototype.initialize = function(options) {
			var that = this;
			tvwallViews.detailView();
		}
		/**
		 * [renderDetailMode 加载设备]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   layoutObj [description]
		 * @return {[type]}             [description]
		 */
	TvLayoutDetail.prototype.renderDetailMode = function(layoutObj) {
			var that = this;
			this.beforeRender();
			this.options.layoutObj = layoutObj;
			this.isChange = false;
			this.loadLayout();
		}
		/**
		 * [afterRender 添加样式]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
	TvLayoutDetail.prototype.afterRender = function() {
			var that = this;
			$(this.options.layoutContainer).find("li").each(function() {
				that.addStyle($(this));
				that.bindSplitPanel($(this));
				that.bindDroppable($(this));
				that.bindCloseWall($(this));
				that.bindCloseAllWall($(this));
			});
		}
		/**
		 * [bindDroppable 摄像机操作]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   $dom [description]
		 * @return {[type]}        [description]
		 */
	TvLayoutDetail.prototype.bindDroppable = function($dom) {
			var that = this;
			$dom.find(".smscreen").bind("dblclick", function() {
				if ($("#preview") && $("#preview").length !== 0) {
					if (window.gTvwallArrayGis !== undefined && window.gTvwallArrayGis.length !== 0) {
						//that.onWallBygis($(this), $dom);
						//that.onWallByData($(this), $dom);
						that.onWallByData($(this))
					}
				}
			});
			// $dom.find(".dis-screen1>div").bind("mouseup", function(e) {
			// 	if ($("#preview").length === 0) {
			// 		if (window.gTvwallArrayGis !== undefined && window.gTvwallArrayGis.length !== 0) {
			// 			that.onWallBygis($(this), $dom);
			// 		}
			// 	}
			// });
		}
		/**
		 * [bindCloseWall description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   $dom [description]
		 * @return {[type]}        [description]
		 */
	TvLayoutDetail.prototype.bindCloseWall = function($dom) {
			var that = this;
			$dom.find(".dis-screen1 .close").unbind("click").bind("click", function() {
				that.downWall($(this).closest('div[class^="tvinner"]'), $dom);
			});
		}
		/**
		 * [bindCloseAllWall description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   $dom [description]
		 * @return {[type]}        [description]
		 */
	TvLayoutDetail.prototype.bindCloseAllWall = function($dom) {
			var that = this;
			$dom.find(".tv-channel>.close").unbind("click").bind("click", function() {
				that.downAllWall($dom);
			});
		}
		/**
		 * [changeTvWallST description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   $dom [description]
		 * @param  {[type]}   res  [description]
		 * @return {[type]}        [description]
		 */
	TvLayoutDetail.prototype.changeTvWallST = function($dom, res) {
			var that = this;
			$dom.find(".dis-screen1").html(that.options.template({
				"splitWall": {
					screenno: screenno,
					layoutDetail: res.data
				}
			}));
			that.bindDroppable($dom);
			that.bindCloseWall($dom);
		}
		/**
		 * [splitWall description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   screenno [description]
		 * @param  {[type]}   $dom     [description]
		 * @return {[type]}            [description]
		 */
	TvLayoutDetail.prototype.splitWall = function(screenno, $dom) {
			var that = this;
			var postData = {
				"screenno": screenno,
				"monitorId": $dom.attr("data-monitorid"),
				"universaId": $dom.attr("data-universaId"),
				"monitorLayoutId": $dom.attr("data-id")
			};
			ajaxModel.postData(that.urls.SET_SPLITE_WALL, postData).then(function(res) {
				if (res.code === 200) {
					var currentMonitorLayoutObj = that.options.layoutObj.monitorLayout;
					for (var i = 0; i < currentMonitorLayoutObj.length; i++) {
						if (currentMonitorLayoutObj[i].id === postData.monitorLayoutId) {
							that.isChange = true;
							currentMonitorLayoutObj[i].screenno = postData.screenno;
							currentMonitorLayoutObj[i].layoutDetail = res.data;
							that.changeTvWallST($dom, res);
							break;
						}
					}
					$dom.find(".cel-screen").css("background", "url('/images/bg/clyt-" + screenno + ".png') no-repeat scroll 0 0 rgba(0, 0, 0, 0)");
				} else {
					notify.error("万解分屏失败!");
				}
			});
		}
		/**
		 * [downWallJson description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   obj [description]
		 * @return {[type]}       [description]
		 */
	TvLayoutDetail.prototype.downWallJson = function(obj) {
			var url, postdata;
			var that = this;
			if (obj.type === "1") {
				postdata = {　
					"monitorId": obj.monitorid,
					"universaId": obj.universaId,
					"monitorLayoutId": obj.screenId,
					"sdcode": obj.issd,
					"scrnon": obj.scrnon
				};
				url = that.urls.SET_UOW_DOWN_TVWALL + "?timestamp=" + new Date().getTime();
			} else {
				postdata = {　
					"id": obj.monitorLayoutId,
					"sdcode": obj.issd,
					"monitorId": obj.monitorid,
					"cameraName": obj.cameraName
				};
				url = that.urls.SET_PVG_DOWN_TVWALL + "?timestamp=" + new Date().getTime();
				// url = "/service/pow/operator_wall" + "?timestamp=" + new Date().getTime();
			}
			return {
				"url": url,
				"postdata": postdata
			}
		}
		/**
		 * [downWall description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   $currentSplitWin [description]
		 * @param  {[type]}   $dom             [description]
		 * @return {[type]}                    [description]
		 */
	TvLayoutDetail.prototype.downWall = function($currentSplitWin, $dom) {
			var that = this;
			var $dv = $currentSplitWin.children().first();
			var obj = {　　　　　　　
				"monitorLayoutId": $dom.attr("data-id"),
				"scrnon": Number($dv.attr("data-scrnon")),
				"screenId": $dv.attr("data-id"),
				"type": $dom.attr("data-type"),
				"cameraId": $dom.attr("data-cameraId"),
				"cameraName": $dv.attr("data-cameraName"),
				"monitorid": $dom.attr("data-monitorid"),
				"issd": $dom.attr("data-monissd").trim(),
				"universaId": $dom.attr("data-universaId")
			};
			ajaxModel.postData(that.downWallJson(obj).url, that.downWallJson(obj).postdata).then(function(res) {
				if (res.code === 200) {
					var currentMonitorLayoutObj = that.options.layoutObj.monitorLayout;
					for (var i = 0; i < currentMonitorLayoutObj.length; i++) {
						if (currentMonitorLayoutObj[i].id === obj.monitorLayoutId) {
							var resObj = {
								"cameraId": "",
								"channelStatus": "0",
								"id": obj.screenId,
								"monitorLayoutId": obj.monitorLayoutId,
								"scrnon": obj.scrnon,
								"status": "",
							};
							that.isChange = true;
							currentMonitorLayoutObj[i].layoutDetail.splice(obj.scrnon, 1, resObj);
							$currentSplitWin.html(that.options.template({
								"downWall": resObj
							}));
							that.bindDroppable($dom);
							that.bindCloseWall($dom);
							break;
						}
					}
				} else if (res.code === 300) {
					notify.error("监视器不支持下墙操作！");
				} else {
					notify.error(res.data.message);
				}
			});
		}
		/**
		 * [downAllWall description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   $dom [description]
		 * @return {[type]}        [description]
		 */
	TvLayoutDetail.prototype.downAllWall = function($dom) {
			var that = this;
			var url = that.urls.SET_DOWN_ALLTVWALL + "?timestamp=" + new Date().getTime(),
				postdata = {　
					"monitorId": $dom.attr("data-monitorid"),
					"universaId": $dom.attr("data-universaId"),
					"monitorLayoutId": $dom.attr("data-id")
				};
			ajaxModel.postData(url, postdata).then(function(res) {
				if (res.code === 200) {
					var currentMonitorLayoutObj = that.options.layoutObj.monitorLayout;
					for (var i = 0; i < currentMonitorLayoutObj.length; i++) {
						if (currentMonitorLayoutObj[i].id === postdata.monitorLayoutId) {
							that.isChange = true;
							currentMonitorLayoutObj[i].layoutDetail = res.data;
							that.changeTvWallST($dom, res);
							break;
						}
					}
				} else {
					notify.warn("摄像机与监视器不匹配！");
				}
			});
		}
		/**
		 * [bindEventsForDeatil description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
	TvLayoutDetail.prototype.bindEventsForDeatil = function() {
			var that = this;
			jQuery(".tvList").on("mouseover", ".hover_class_cort", function(e) {
				var $activeDom = jQuery(this).find(".issdContain"),
					$checkIssd = jQuery(this).closest("li").attr("data-monissd").trim(),
					$domFlag = $activeDom.find(".issdflag[data-monissd=" + $checkIssd + "] i");
				$activeDom.toggleClass("active");
				$activeDom.find(".issdflag i").removeClass("heck");
				$domFlag.addClass("heck");
				jQuery(this).find(".issd-select").addClass("issd-select_bak");
			});
			jQuery(".tvList").on("mouseout", ".hover_class_cort", function(e) {
				var $activeDom = jQuery(this).find(".issdContain");
				$activeDom.removeClass("active");
				jQuery(this).find(".issd-select").removeClass("issd-select_bak");
			});
		}
		/**
		 * [changeIssdSH description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   $clickDom [description]
		 * @param  {[type]}   $issd     [description]
		 * @return {[type]}             [description]
		 */
	TvLayoutDetail.prototype.changeIssdSH = function($clickDom, $issd) {
			var iscdcode = "";
			if ($issd === "0") {
				iscdcode = "[标]";
			}
			if ($issd === "1") {
				iscdcode = "[高]";
			}
			$clickDom.closest("li").attr("data-monissd", $issd);
			$clickDom.closest("li").find(".sdcode_sh").text(iscdcode);
			$clickDom.closest(".issdContain").find("i").removeClass("heck");
			$clickDom.find("i").addClass("heck");
			if (iscdcode === "[高]") {
				$clickDom.closest("li").find(".sdcode_sh").addClass("sdcode_gl");
			} else {
				$clickDom.closest("li").find(".sdcode_sh").removeClass("sdcode_gl");
			}
		}
		/**
		 * [completeChangeIssd description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   $clickDom [description]
		 * @param  {[type]}   res       [description]
		 * @return {[type]}             [description]
		 */
	TvLayoutDetail.prototype.completeChangeIssd = function($clickDom, res) {
			var that = this;
			if (res.data.monitorLayoutDetail.channelStatus === "1") {
				var resObj = {
					"cameraId": res.data.monitorLayoutDetail.cameraId,
					"cameraName": res.data.monitorLayoutDetail.cameraName,
					"channelStatus": "1",
					"id": res.data.monitorLayoutDetail.id,
					"monitorLayoutId": res.data.monitorLayoutDetail.monitorLayoutId,
					"scrnon": res.data.monitorLayoutDetail.scrnon,
					"status": "",
					"sdCode": res.data.monitorLayoutDetail.sdCode
				};
				$clickDom.closest("li").find(".dis-screen1 div").html(that.options.template({
					"onWall": resObj
				}));
				that.bindDroppable($clickDom.closest("li"));
				that.bindCloseWall($clickDom.closest("li"));
			} else {
				var resObj = {
					"cameraId": "",
					"channelStatus": "0",
					"id": res.data.monitorLayoutDetail.id,
					"monitorLayoutId": res.data.monitorLayoutDetail.monitorLayoutId,
					"scrnon": res.data.monitorLayoutDetail.scrnon,
					"status": ""
				};
				$clickDom.closest("li").find(".dis-screen1 div").html(that.options.template({
					"downWall": resObj
				}));
			}
		}
		/**
		 * [changeIssd 高标清切换]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   $clickDom [description]
		 * @return {[type]}             [description]
		 */
	TvLayoutDetail.prototype.changeIssd = function($clickDom) {
			var that = this;
			this.bindEventsForDeatil();
			jQuery(".tvList").on("click", ".issdContain a", function() {
				var $clickDom = jQuery(this);
				var $issd = $clickDom.attr("data-monissd").trim(),
					$divDom = $clickDom.closest("li").attr("data-monitorid").trim(),
					shWallUrl = that.urls.CHANGE_SH_WALL + "?timestamp=" + new Date().getTime(),
					shWallParams = {
						"sdcode": $issd,
						"id": $(this).closest("li").attr("data-id").trim(),
						"monitorId": $divDom
					},
					shWallcustom = {
						dataType: "json",
						cache: false
					};
				ajaxModel.getData(shWallUrl, shWallParams, shWallcustom).then(function(res) {
					if (res.code === 200) {
						notify.success("监视器标/高清设置成功！");
						that.changeIssdSH($clickDom, $issd);
						that.completeChangeIssd($clickDom, res);
						if ($clickDom.closest(".issdContain").attr("class").indexOf("active") !== -1) {
							$clickDom.closest(".issdContain").removeClass("active");
						}
					} else {
						notify.error("监视器标/高清设置失败，服务器异常！");
					}
				});
			});
		}
		/**
		 * [bindSplitPanel 分屏]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   $dom [description]
		 * @return {[type]}        [description]
		 */
	TvLayoutDetail.prototype.bindSplitPanel = function($dom) {
			var that = this;
			$dom.find(".dropdown").unbind("click").bind("click", function() {
				var $splitPanel = $dom.find(".split-panel");
				if ($splitPanel.css("display") === "inline-block") {
					$splitPanel.css("display", "none");
				} else {
					$splitPanel.css("display", "inline-block");
				}
				return false;
			});
			$dom.find(".split-panel>a").unbind("click").bind("click", function() {
				var currentSplit = $(this).attr("data-layout");
				//that.splitWall(Number(currentSplit), $dom);
				$dom.find(".split-panel").css("display", "none");
				return false;
			});
		}
		/**
		 * [changeSplitPanel description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   splitNum [description]
		 * @return {[type]}            [description]
		 */
	TvLayoutDetail.prototype.changeSplitPanel = function(splitNum) {
			var $dom = $("#major .tvList .tv .dis-screen1"),
				domWidth = $dom.width(),
				domHeight = $dom.height(),
				num = Math.sqrt(splitNum);
			$("#major .dis-screen1 .tvinner-split").width((domWidth - num) / num);
		}
		/**
		 * [getCameraName description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
	TvLayoutDetail.prototype.getCameraName = function() {
			var cameraName = "";
			if (window.gTvwallArrayGis[0]) {
				if (!/^[\d]+$/.test(window.gTvwallArrayGis[0])) {
					cameraName = window.gTvwallArrayGis[2] + window.gTvwallArrayGis[0];
				} else {
					cameraName = window.gTvwallArrayGis[2] + "(" + window.gTvwallArrayGis[0] + ")";
				}
			} else {
				cameraName = window.gTvwallArrayGis[2];
			}
			return cameraName;
		}
		/**
		 * [matchCameraIsOrMoni description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   postdata [description]
		 * @return {[type]}            [description]
		 */
	TvLayoutDetail.prototype.matchCameraIsOrMoni = function(postdata) {
			var dropData = "";
			if (window.gTvwallArrayGis[3] || window.gTvwallArrayGis[4]) {
				if (window.gTvwallArrayGis[3] && window.gTvwallArrayGis[3] !== "[]") {
					if (window.gTvwallArrayGis[4] && window.gTvwallArrayGis[4] !== "[]") {
						dropData = postdata.sdcode;
					} else {
						dropData = "1";
					}
				} else {
					dropData = window.gTvwallArrayGis[3] === "[]" ? "0" : "1";
				}
				if (postdata.sdcode !== dropData) {
					notify.error("摄像机与监视器不匹配！");
					window.gTvwallArrayGis = [];
					if ($("#preview") && $("#preview").length !== 0) {
						$("#preview").remove();
					}
					return;
				}
			}
		}
		/**
		 * [onWallBygis window.gTvwallArrayGis  参数 0：cameracode 1：id 2：name 3：hdchannel 4：sdchannel]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   $currentSplitWin [description]
		 * @param  {[type]}   $dom             [description]
		 * @return {[type]}                    [description]
		 */
	TvLayoutDetail.prototype.onWallBygis = function($currentSplitWin, $dom) {
		if (window.gTvwallArrayGis !== []) {
			var that = this;
			var $dv = $currentSplitWin.children().first();
			var channelStatus = $dv.attr("data-channelStatus");
			var obj = {
				"cameraId": window.gTvwallArrayGis[1],
				"cameraName": that.getCameraName(),
				"id": "",
				"monitorLayoutId": $dom.attr("data-id"),
				"screenId": $dv.attr("data-id"),
				"scrnon": Number($currentSplitWin.attr("data-scrnon")),
				"status": "",
				"type": $dom.attr("data-type"),
				"monitorid": $dom.attr("data-monitorid"),
				"issd": $dom.attr("data-monissd"),
				"cameraCode": window.gTvwallArrayGis[0],
				"universaId": $dom.attr("data-universaId")
			};
			var url, postdata;
			if (obj.type === "1") {
				postdata = {　
					"monitorId": obj.monitorid,
					"cameraName": obj.cameraName,
					"cameraId": obj.cameraId,
					"universaId": obj.universaId,
					"window": obj.scrnon,
					"sdcode": obj.issd,
					"monitorLayoutId": obj.screenId
				};
				url = that.urls.SET_UOW_ON_TVWALL + "?timestamp=" + new Date().getTime();
			} else {
				postdata = {　
					"id": obj.screenId,
					"monitorId": obj.monitorid,
					"sdcode": obj.issd,
					"cameraName": obj.cameraName,
					"cameraId": obj.cameraId
				};
				url = that.urls.SET_PVG_ON_TVWALL + "?timestamp=" + new Date().getTime();
			}
			that.matchCameraIsOrMoni(postdata);
			ajaxModel.postData(url, postdata).then(function(res) {
				if (res.code === 200) {
					var currentMonitorLayoutObj = that.options.layoutObj.monitorLayout;
					for (var i = 0; i < currentMonitorLayoutObj.length; i++) {
						if (currentMonitorLayoutObj[i].id === obj.monitorLayoutId) {
							var resObj = {
								"cameraId": obj.cameraId,
								"cameraName": obj.cameraName,
								"channelStatus": "1",
								"id": obj.screenId,
								"monitorLayoutId": obj.monitorLayoutId,
								"scrnon": obj.scrnon,
								"status": "",
								"cameraCode": obj.cameraCode
							};
							that.isChange = true;
							currentMonitorLayoutObj[i].layoutDetail.splice(obj.scrnon, 1, resObj);
							$currentSplitWin.html(that.options.template({
								"onWall": resObj
							}));
							that.bindDroppable($dom);
							that.bindCloseWall($dom);
							break;
						}
					}
				} else if (res.code === 500) {
					if (res.data.message.indexOf("-266") !== -1) {
						notify.error("连接设备失败！");
					} else if (res.data.message.indexOf("-270") !== -1) {
						notify.error("服务器连接其它设备或服务器时发生网络断线错误！");
					} else if (res.data.message.indexOf("-84") !== -1) {
						notify.error("没有此用户！");
					} else {
						notify.error(res.data.message);
					}
				} else {
					notify.error(res.data.message);
				}
			});
		} else {
			notify.warn("摄像机上墙信息不全！");
		}
		window.gTvwallArrayGis = [];
		if ($("#preview") && $("#preview").length !== 0) {
			$("#preview").remove();
		}
	}
	return TvLayoutDetail;
});
