/**
 * [电视墙具体操作类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	'/module/common/tvwall/js/controllers/tv-layout-base.js',
	'ajaxModel'
], function(TvLayoutBase, ajaxModel) {
	var TvLayoutDetailModel = function() {};
	TvLayoutDetailModel.prototype = new TvLayoutBase();
	/**
	 * [splitWall description]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   screenno [description]
	 * @param  {[type]}   $dom     [description]
	 * @return {[type]}            [description]
	 */
	TvLayoutDetailModel.prototype.splitWall = function(screenno, $dom) {
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
						that.changeTvWallST($dom, res, currentMonitorLayoutObj[i].screenno);
						break;
					}
				}
				$dom.find(".cel-screen").css("background", "url('/images/bg/clyt-" + screenno + ".png') no-repeat scroll 0 0 rgba(0, 0, 0, 0)");
			} else {
				notify.error("万解分屏失败!");
			}
		});
	};
	/**
	 * [downWallJson 获取下墙操作时后端所需参数和url]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   obj [description]
	 * @return {[type]}       [description]
	 */
	TvLayoutDetailModel.prototype.downWallJson = function(obj) {
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
		} else {//PVG电视下墙所需参数以及url
			//当前下墙摄像机数据参数
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
		};
	};
	/**
	 * [downWallAfter description]
	 * @author wumengmeng
	 * @date   2014-12-17
	 * @param  {[type]}   $currentSplitWin [description]
	 * @param  {[type]}   $dom             [description]
	 * @param  {[type]}   obj              [description]
	 * @return {[type]}                    [description]
	 */
	TvLayoutDetailModel.prototype.downWallAfter = function($currentSplitWin, $dom, obj) {
		var that = this;
		//存储当前布局的详细信息
		var currentMonitorLayoutObj = that.options.layoutObj.monitorLayout;
		for (var i = 0; i < currentMonitorLayoutObj.length; i++) {
			//当前布局中id与当前摄像机信息id相同的布局
			if (currentMonitorLayoutObj[i].id === obj.monitorLayoutId) {
				var resObj = {
					"cameraId": "",
					"channelStatus": "0",
					"id": obj.screenId,
					"monitorLayoutId": obj.monitorLayoutId,
					"scrnon": obj.scrnon,
					"width": obj.width,
					"height": obj.height,
					"status": "",
				};
				that.isChange = true;
				currentMonitorLayoutObj[i].layoutDetail.splice(obj.scrnon, 1, resObj);
				//用布局信息重新渲染布局模板
				$currentSplitWin.html(template({
					"downWall": resObj
				}));
				that.bindDroppable($dom);
				that.bindCloseWall($dom);
				break;
			}
		}
	};
	/**
	 * [downWall description]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   $currentSplitWin [description]
	 * @param  {[type]}   $dom             [description]
	 * @return {[type]}                    [description]
	 */
	TvLayoutDetailModel.prototype.downWall = function($currentSplitWin, $dom) {
		var that = this;
		var $dv = $currentSplitWin.children().first();
		//存储当前摄像机信息
		var obj = {　　　　　　　
			"monitorLayoutId": $dom.attr("data-id"),
			"scrnon": Number($dv.attr("data-scrnon")),
			"screenId": $dv.attr("data-id"),
			"type": $dom.attr("data-type"),
			"cameraId": $dom.attr("data-cameraId"),
			"cameraName": $dv.attr("data-cameraName"),
			"monitorid": $dom.attr("data-monitorid"),
			"issd": $dom.attr("data-monissd").trim(),
			"width": $dom.attr("data-width"),
			"height": $dom.attr("data-height"),
			"universaId": $dom.attr("data-universaId")
		};
		//根据downWallJson获取当前下墙操作时pvg电视下墙还是卍解下墙
		ajaxModel.postData(that.downWallJson(obj).url, that.downWallJson(obj).postdata).then(function(res) {
			if (res.code === 200) {
				//下墙操作之后，重新渲染布局模板
				that.downWallAfter($currentSplitWin, $dom, obj);
			} else if (res.code === 300) {
				notify.error("监视器不支持下墙操作！");
			} else {
				//notify.error(res.data.message);
			}
		});
	};
	/**
	 * [downAllWall 所有设备下墙请求（针对卍解？？？）]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   $dom [description]
	 * @return {[type]}        [description]
	 */
	TvLayoutDetailModel.prototype.downAllWall = function($dom) {
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
	};

	/**
	 * [completeChangeIssd 高标清切换完成之后布局模板的变化]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   $clickDom [description]
	 * @param  {[type]}   res       [description]
	 * @return {[type]}             [description]
	 */
	TvLayoutDetailModel.prototype.completeChangeIssd = function($clickDom, res) {
		var that = this;
		if (res.data.monitorLayoutDetail.channelStatus === "1") {
			var resObjSd = {
				"cameraId": res.data.monitorLayoutDetail.cameraId,
				"cameraName": res.data.monitorLayoutDetail.cameraName,
				"channelStatus": "1",
				"id": res.data.monitorLayoutDetail.id,
				"monitorLayoutId": res.data.monitorLayoutDetail.monitorLayoutId,
				"scrnon": res.data.monitorLayoutDetail.scrnon,
				"status": "",
				"width": $clickDom.closest("li").attr("data-width"),
				"height": $clickDom.closest("li").attr("data-height"),
				"sdCode": res.data.monitorLayoutDetail.sdCode
			};
			$clickDom.closest("li").find(".dis-screen1 div").html(template({
				"onWall": resObjSd
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
				"width": $clickDom.closest("li").attr("data-width"),
				"height": $clickDom.closest("li").attr("data-height"),
				"status": ""
			};
			$clickDom.closest("li").find(".dis-screen1 div").html(template({
				"downWall": resObj
			}));
		}
	};
	/**
	 * [changeIssd 高标清切换]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   $clickDom [description]
	 * @return {[type]}             [description]
	 */
	TvLayoutDetailModel.prototype.changeIssd = function($clickDom) {
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
					//切换成功后样式变化
					that.changeIssdSH($clickDom, $issd);
					//高标清切换完成之后布局详情模板跟着变化
					that.completeChangeIssd($clickDom, res);
					if ($clickDom.closest(".issdContain").attr("class").indexOf("active") !== -1) {
						$clickDom.closest(".issdContain").removeClass("active");
					}
				} else {
					notify.error("监视器标/高清设置失败，服务器异常！");
				}
			});
		});
	};
	/**
	 * [onWallBygisBeforeDelData 获取卍解和pvg上墙所需要参数以及url]
	 * @author wumengmeng
	 * @date   2014-12-17
	 * @param  {[type]}   obj      [description]
	 * @param  {[type]}   postdata [description]
	 * @param  {[type]}   url      [description]
	 * @return {[type]}            [description]
	 */
	TvLayoutDetailModel.prototype.onWallBygisBeforeDelData = function(obj, postdata, url) {
		var that = this;
		if (obj.type === "1") {//卍解上墙参数以及url
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
		} else {//pvg上墙参数以及url
			postdata = {　
				"id": obj.screenId,
				"monitorId": obj.monitorid,
				"sdcode": obj.issd,
				"cameraName": obj.cameraName,
				"cameraId": obj.cameraId
			};
			url = that.urls.SET_PVG_ON_TVWALL + "?timestamp=" + new Date().getTime();
		}
		return {
			"deldata": {
				"postdata": postdata,
				"url": url
			}
		};
	};
	/**
	 * [bindSplitPanel 设置分屏信息并传给后台]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   $dom [description]
	 * @return {[type]}        [description]
	 */
	TvLayoutDetailModel.prototype.setLayout = function(dom,call) {			
		var self = this,
			//layoutNum = dom.attr('data-layout');
			layoutNum = dom.find('.tv .smscreen:last-child').attr('data-id'),
			sData = {
			serverId: dom.find('.tv').attr('data-serverid'),
			screen:dom.find('.tv').attr('data-screenid'),
			//layout:dom.closest('.tv').attr('data-info')
			layout: (layoutNum === "1")?"1x1": (layoutNum === "4")?"2x2": (layoutNum === "9")?"3x3": (layoutNum === "16")?"4x4": "1x1"
		};
		
		
		// 请求接口	
		var url = "/service/md/layout/"+ sData.serverId +"?timestamp=" + new Date().getTime();
		jQuery.post(url, sData).then(function (res) {
			
			if (res.code === 200) {
				//notify.success('布局设置成功！');
				call && call();
			};
			if (res.code === 500) {
				//notify.error(res.data.message);
			};

		});
	};
	
	/**
	 * [changeSplitPanel description 将单个屏幕拆分成1x1-4x4的小块]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   splitNum [description]
	 * @return {[type]}            [description]	 */

	TvLayoutDetailModel.prototype.swScreen = function (screenno, dom) {
		var self = this;
		var prt = document.createElement('ul');
		dom.attr('data-number', screenno);
		prt.className = 'smul clearfix';
		var transNo = parseInt((screenno === '1x1') ? '1' : (screenno === '2x2') ? '4' : (screenno === '3x3') ? '9' : (screenno === '4x4') ? '16' : screenno);

		for (var i = 0; i < transNo; i++) {
			$(prt).append('<li class="smscreen" data-id=' + (i + 1) + '></li>');
		};
		dom.find('.tvinner1').html(prt);

		var h = dom.find('.tvinner1').height() - 1,
			w = dom.find('.tvinner1').width() - 1,
			x = Math.sqrt(transNo);
		dom.find('.smscreen').height(h / x - 0.1).width(w / x - 1);
		dom.find('.smscreen').css({
			'background-image': 'url(../../../module/common/images/bg/camera1.png)',
			'line-height': h / x / 2 + 'px',
			'background-size':'10%'
		});
				
			
		//self.rendScreenStatus(dom)
		
		dom.off('click').on('click', '.smscreen', function () {
			self.screenJudge($(this));
		})

	};
	/**
	 * [onWallBygisAfter 上墙请求返回成功时用摄像机信息渲染布局模板]
	 * @author wumengmeng
	 * @date   2014-12-17
	 * @param  {[type]}   $currentSplitWin [description]
	 * @param  {[type]}   $dom             [description]
	 * @param  {[type]}   obj              [description]
	 * @return {[type]}                    [description]
	 */
	TvLayoutDetailModel.prototype.onWallBygisAfter = function($currentSplitWin, $dom, obj) {
		var that = this;
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
					"width": obj.width,
					"height": obj.height,
					"cameraCode": obj.cameraCode
				};
				that.isChange = true;
				currentMonitorLayoutObj[i].layoutDetail.splice(obj.scrnon, 1, resObj);
				$currentSplitWin.html(template({
					"onWall": resObj
				}));
				that.bindDroppable($dom);
				that.bindCloseWall($dom);
				break;
			}
		}
	};
	/**
	 * [onWallBygisErrorCode description]
	 * @author wumengmeng
	 * @date   2014-12-17
	 * @param  {[type]}   code [description]
	 * @return {[type]}        [description]
	 */
	TvLayoutDetailModel.prototype.onWallBygisErrorCode = function(code) {
		if (code.indexOf("-266") !== -1) {
			notify.error("连接设备失败！");
		} else if (code.indexOf("-270") !== -1) {
			notify.error("服务器连接其它设备或服务器时发生网络断线错误！");
		} else if (code.indexOf("-84") !== -1) {
			notify.error("没有此用户！");
		} else {
			notify.error(code);
		}
	};
	
	
	
	
	/**
	 * [offWall 新下墙操作 description]
	 * @author xukai
	 * @date   2015-09-21
	 * @param  {[type]}   code [description]
	 * @return {[type]}        [description]
	 */
	TvLayoutDetailModel.prototype.offWall = function () {		
		jQuery(document).off('click').on('click', 'i.cls', function (e) {
			e.stopPropagation();
			e.preventDefault();
			var data = {
					serverId: jQuery(this).closest('.tv').attr('data-serverid'),
					screen: jQuery(this).closest('.tv').attr('data-screenid'),
					window: parseInt(jQuery(this).closest('li').attr('data-id')) - 1
				},
				url = '/service/md/stream/close/' + data.serverId,
				that = jQuery(this);

			ajaxModel.postData(url, data).then(function(res) {
				if (res && res.code === 200) {
					notify.success("下墙成功！");
					var historyBar = window.tvWallHistoryBarObj;
					if(historyBar && historyBar.param){
						if (data.serverId == historyBar.param.serverId && data.screen == historyBar.param.screen && data.window == historyBar.param.window) {
							//关闭历史进度条
							jQuery(".playbar-close").trigger("click");
							if(historyBar.timmer){
								window.clearInterval(historyBar.timmer);
							}
						}
					}
					var $smscreen = that.closest(".smscreen");
					var name = $smscreen.attr("data-title");
					var cameraId = $smscreen.data("cameraid");
					//下墙后取消分组列表对应摄像机播放状态
					jQuery("#camerasPanel .tree").find("li.active li[data-id="+ cameraId +"]").removeClass("selected");
					logDict.insertMedialog("m1", "摄像机" + name + "下墙成功！");
					that.closest('.smscreen').css('background-image', 'url(../../../module/common/images/bg/camera' + that.closest('.tv').find('.smscreen').length + '.png)').text('');
					that.remove();
				} else {
					notify.error(res.data.message);
				};

				if (jQuery("#ptzCamera").length) {
					jQuery("#ptzCamera .content").hide();
					jQuery(".view.ptz.ui.tab").hide();
					jQuery("#ptzCamera").removeClass("active");
				}
			});
		})

	};
	
	
	/**
	 * [onWallByData 新上墙操作 description]
	 * @author xukai
	 * @date   2015-09-21
	 * @param  {[type]}   code [description]
	 * @return {[type]}        [description]
	 */
	
	TvLayoutDetailModel.prototype.onWallByData = function(ele) {
		var self = this;
		if (window.gTvwallArrayGis !== []) {
			//判断是否是历史
			if(window.gTvwallArrayGis[0] === "history"){
				ele.attr('data-his','history');			
				//历史上墙
				var sData = {
					serverId:ele.closest('.tv').attr('data-serverid'), 
					channelId: window.gTvwallArrayGis[2], //摄像机id
					beginTime: window.gTvwallArrayGis[3], //录像开始时间
					endTime: window.gTvwallArrayGis[4], //录像结束时间
					vodType: window.gTvwallArrayGis[5], //录像深度
					screen: ele.closest('.tv').attr('data-screenid'), //显示器序号(从0开始)
					window: parseInt(ele.attr('data-id')) -1  //窗口序号(从0开始)
				};
				$.ajax({
					url: '/service/md/vodstream/open/' + sData.serverId,
					data: sData,
					type: 'post',
					success: function (res) {						
						//$this.attr('data-screen',sData.screen).attr('data-server',sData.serverId).text('历史录像').css('background-image','');
						if (res.code === 200) {
							if (ele.find('.cls').length === 0) {
								ele.append('<i class="cls"></i>');
							}
							var name;
							if (/inspect\/tvwall/g.test(location.href.toString())) {
								name = jQuery('#treePanel').find('li.clicked').attr('data-name');
							} else {
								name = jQuery('#sidebar-body').find('div.active[data-tabor="video-res"] .opened span').attr('title');
							}
							ele.text(name).css('background-image', '');
							logDict.insertMedialog("m1", "发送名为" +name + "的摄像机到电视墙", "f1", '', name);
							notify.success("历史录像上墙成功");
							window.gTvwallArrayGis = [];
						};
						if (res.code === 500) {
							notify.error("历史录像上墙失败");
						};

					},
					error: function () {
						notify.error("历史录像上墙失败");
					}
				})				
			} else {
				function getChannelId (hd, sd){
					hd = JSON.parse(hd);
					sd = JSON.parse(sd);
					return ((hd.length !== 0) ? hd[0].id : (sd.length !== 0) ? sd[0].id : 0);
				}
				//实时流上墙
				var sData = {
					serverId:ele.closest('.tv').attr('data-serverid'),
					channelId: getChannelId(window.gTvwallArrayGis[3], window.gTvwallArrayGis[4]), //摄像机id
					screen: ele.closest('.tv').attr('data-screenid'), //显示器序号(从0开始)
					window: parseInt(ele.attr('data-id')) -1  //窗口序号(从0开始)
				};	
				$.ajax({
					url:'/service/md/realstream/open/'+ sData.serverId,
					data:sData,
					type:'post',
					success: function (res) {
						if (res.code === 200) {
							ele.attr('data-screen', sData.screen).attr('data-server', sData.serverId);
							if (ele.find('.cls').length === 0) {
								ele.append('<i class="cls"></i><i class="real-stream" title="播放视频"></i>');
							}
							ele.attr('data-cameraid', window.gTvwallArrayGis[1]);
							ele.text(window.gTvwallArrayGis[2]).css('background-image', '');
							logDict.insertMedialog("m1", "摄像机" + window.gTvwallArrayGis[2] + "上墙成功！", "", "", window.gTvwallArrayGis[2]);
							notify.success("实时流上墙成功");
							window.gTvwallArrayGis = [];
						}
						if (res.code === 500) {
							notify.error("实时流上墙失败");
						}
					},
					error: function() {
						notify.error("实时流上墙失败");
					}
				})				
			}
			
			} else {
			notify.warn("摄像机上墙信息不全");
		}
		
		if ($("#preview") && $("#preview").length !== 0) {
			$("#preview").remove();
		}
			
	
						
	};
	
	

	/**
	 * [onWallBygis 上墙操作 window.gTvwallArrayGis  参数 0：cameracode 1：id 2：name 3：hdchannel 4：sdchannel]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   $currentSplitWin [description]
	 * @param  {[type]}   $dom             [description]
	 * @return {[type]}                    [description]
	 */
	// TvLayoutDetailModel.prototype.onWallBygis = function($currentSplitWin, $dom) {
		
	// 	//if (window.gTvwallArrayGis !== []) {			
			
	// 		$('.tvList').off('click').on('click', '.smscreen i.cls', function () {
	// 						var data = {
	// 							serverId: $(this).closest('.smscreen').attr('data-server'),
	// 							screen: $(this).closest('.smscreen').attr('data-screen'),
	// 							window: $(this).closest('.smscreen').attr('data-id') -1
	// 						},
	// 							url = '/service/md/stream/close/' + data.serverId,
	// 							that = $(this);

	// 						ajaxModel.postData(url, data, {
	// 							cache: false,
	// 							async: false
	// 						}).then(function (res) {
	// 							if (res.code === 200) {
	// 								notify.success("下墙成功！");
	// 								that.closest('.smscreen').css('background-image', 'url(../../../module/common/images/bg/camera' + that.closest('.monitor-item').attr('data-number') + '.png)').text('');
	// 								that.remove();
	// 							};
	// 							if (res.code === 500) {
	// 								notify.error(res.data.message);
	// 							};
	// 						});


	// 					})
						
	// 	if (window.gTvwallArrayGis !== []) {
	// 		//判断是否是历史
	// 		if(window.gTvwallArrayGis[0] === "history"){
	// 			//历史上墙
	// 			var sData = {
	// 				serverId:self.getCurServerId(), 
	// 				channelId: window.gTvwallArrayGis[2], //摄像机id
	// 				beginTime: window.gTvwallArrayGis[3], //录像开始时间
	// 				endTime: window.gTvwallArrayGis[4], //录像结束时间
	// 				vodType: window.gTvwallArrayGis[5], //录像深度
	// 				screen: $dom.attr('data-monitorid'), //显示器序号(从0开始)
	// 				window: parseInt($this.attr('data-id')) -1  //窗口序号(从0开始)
	// 			};
	// 			$.ajax({
	// 				url:'/service/md/vodstream/open/'+ self.getCurServerId(),
	// 				data:sData,
	// 				type:'post',
	// 				success: function (res) {						
	// 					//$this.attr('data-screen',sData.screen).attr('data-server',sData.serverId).text('历史录像').css('background-image','');
	// 					if (res.code === 200){
	// 					if ($this.find('.cls').length === 0) {
	// 						$this.append('<i class="cls"></i>');
	// 					}
	// 					notify.success("历史录像上墙成功！");
	// 					};
	// 					if (res.code === 500) {
	// 					notify.error(res.data.message);
	// 				};
						
	// 				},
	// 				error: function() {
	// 					notify.error("历史录像上墙失败！");
	// 				}
	// 			})				
	// 		} else {
	// 			function getChannelId (hd, sd){
	// 				hd = JSON.parse(hd);
	// 				sd = JSON.parse(sd);
	// 				return ((hd.length !== 0) ? hd[0].id : (sd.length !== 0) ? sd[0].id : 0);
	// 			}
	// 			//实时流上墙
	// 			var sData = {
	// 				serverId:self.getCurServerId(), 
	// 				channelId: getChannelId(window.gTvwallArrayGis[3], window.gTvwallArrayGis[4]), //摄像机id
	// 				screen: $dom.attr('data-monitorid'), //显示器序号(从0开始)
	// 				window: parseInt($this.attr('data-id')) -1  //窗口序号(从0开始)
	// 			};
	// 			$.ajax({
	// 				url:'/service/md/realstream/open/'+ self.getCurServerId(),
	// 				data:sData,
	// 				type:'post',
	// 				success: function (res) {
	// 					if (res.code === 200) {
	// 						$this.attr('data-screen', sData.screen).attr('data-server', sData.serverId);
	// 						if ($this.find('.cls').length === 0) {
	// 							$this.append('<i class="cls"></i>');
	// 						}
	// 						notify.success("实时流上墙成功！");
	// 					} else if (res.code === 500) {
	// 						notify.error(res.data.message);
	// 					}
	// 				},
	// 				error: function() {
	// 					notify.error("实时流上墙失败！");
	// 				}
	// 			})				
	// 		}
			
			
			
			
			
			
			
			
			
			
			// var that = this;
			// var $dv = $currentSplitWin.children().first();
			// var channelStatus = $dv.attr("data-channelStatus");
			// var obj = {
			// 	"cameraId": window.gTvwallArrayGis[1],
			// 	"cameraName": that.getCameraName(),
			// 	"id": "",
			// 	"monitorLayoutId": $dom.attr("data-id"),
			// 	"screenId": $dv.attr("data-id"),
			// 	"scrnon": Number($currentSplitWin.attr("data-scrnon")),
			// 	"status": "",
			// 	"type": $dom.attr("data-type"),
			// 	"monitorid": $dom.attr("data-monitorid"),
			// 	"issd": $dom.attr("data-monissd"),
			// 	"cameraCode": window.gTvwallArrayGis[0],
			// 	"width": $dom.attr("data-width"),
			// 	"height": $dom.attr("data-height"),
			// 	"universaId": $dom.attr("data-universaId")
			// };
			// var url, postdata;
			// //获取上墙请求需要的参数
			// var deldata = that.onWallBygisBeforeDelData(obj, postdata, url).deldata;
			// postdata = deldata.postdata;
			// console.log(postdata)
			// url = deldata.url;
			// //匹配监视器，如果监视器匹配
			// if (that.matchCameraIsOrMoni(postdata)) {
			// 	//发送上墙请求
			// 	ajaxModel.postData(url, postdata).then(function(res) {
			// 		if (res.code === 200) {
			// 			//请求成功情况下用摄像机信息渲染布局模板
			// 			that.onWallBygisAfter($currentSplitWin, $dom, obj);
			// 		} else if (res.code === 500) {
			// 			//上墙请求失败时处理
			// 			that.onWallBygisErrorCode(res.data.message);
			// 		} else {
			// 			notify.error(res.data.message);
			// 		}
			// 	});
			// }

		
	//};
	return TvLayoutDetailModel;
});