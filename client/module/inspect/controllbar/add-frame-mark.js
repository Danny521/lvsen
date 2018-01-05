/**
 * 播放器添加帧标记的js文件 
 * 2016/5/16 by yangll    
 * 确定cotrolbar.js中的frameTagNames  此函数在当前文件中没有被使用到，判断是否要被删除                                            
 */
define([
	"jquery",
	"/module/inspect/controllbar/common-fun.js"
], function(jQuery, CommonFun) {

	return (function(scope, $) {

		var //存储主控制器对象，主要为了方便调用controlbar.js中的公共函数
			_mainCtrl = null,
			//播放器对象
			_player = null,

			//事件处理程序
			_eventHandler = {
				//帧标记添加面板中，标记名输入框获得焦点事件
				"MarkerTitleFocusEvent": function(evt) { 
					_MarkerTitleFocus.call(this);
					evt.stopPropagation();
				},
				//帧标记添加面板中，点击除标记名输入框、标记名输入框下拉列表外的其他位置时，下拉列表要隐藏
				"MarkerPannelClickEvent": function(evt) { 
					var $node = jQuery(evt.target);
					_MarkerPannelClick($node);
					evt.stopPropagation();
				},
				//帧标记添加面板中，选择标记名输入框下拉列表中的某个标记名时的事件
				"selectTagNameEvent": function(evt) {
					var text = jQuery(this).html();
					text = text.replace(/\(\d+\)$/g, "");
					jQuery("#select-frame-mark-title").hide();
					jQuery("#markerTitle").val(text);
					evt.stopPropagation();
				},
				//帧标记添加面板中，等级输入框的相关事件
				"MarkerLevelEvents": function(evt) {
					if (evt.type === "click") {
						_MarkerLevelClick.call(this);
						//释放冒泡，以供标记名面板隐藏，delete by zhangyu, 2016.05.20
						//evt.stopPropagation();
					} else if (evt.type === "keydown") {
						//阻止默认事件
						evt.preventDefault();
						//释放冒泡，以供标记名面板隐藏，delete by zhangyu, 2016.05.20
						evt.stopPropagation();
					}
				},
				//添加帧标记面板中，当帧标记等级使用焦点时，将表示颜色的下拉列表隐藏或收起
				"markerLevelcolorBlurEvent": function(evt) {
					jQuery(this).hide();
					evt.stopPropagation();
				},
				//添加帧标记面板中，点击右上角的叉号进行关闭的事件
				"FrameMarkerCloseEvent": function(evt) {
					jQuery(".frame-mark").removeClass("clicked");
					jQuery(".marker-pannel").removeClass("active");
					jQuery(".frame-marker").removeClass("active");
					jQuery(".markerLevelcolor").remove();
					//关闭时隐藏帧标记选择面板,bug[47630]
					jQuery("#select-frame-mark-title").remove();
					evt.stopPropagation();
				},
				//添加帧标记面板中，保存帧标记的事件
				"SaveFrameEvent": function(evt) {
					_SaveFrame.call(this);
					evt.stopPropagation();
				}
			};
		var
		/**
		 * [_MarkerTitleFocus 帧标记名称获得焦点时的事件]
		 * @return {[type]} [description]
		 */
			_MarkerTitleFocus = function() {
				var $this = jQuery(this),
					x = $this.offset().left,
					y = $this.offset().top,
					css = "border-radius: 3px;cursor:default;border:solid 1px #cccccc;height:110px;background-color: rgb(77, 77, 77);padding:4px;text-align: left;color:#999999;",
					html = ["<div tabindex='0' id='select-frame-mark-title' style='" + css + "'>",
						"<iframe src='about:blank'></iframe>",
						"</div>"
					].join("");
				//$("")[0]的方法可将jQuery DOM对象转换为JS原生DOM
				if (jQuery("#select-frame-mark-title")[0]) { 
					jQuery("#select-frame-mark-title").remove();
				}
				jQuery(document.body).append(html);
				jQuery("#select-frame-mark-title").css({
					left: x,
					top: y + 24,
					width: 200,
					height: 110
				}); //.focus();
				jQuery.ajax({
					url: '/service/frame/frameTagNames',
					dataType: 'json',
					type: 'get',
					cache: false,
					data: {},
					success: function(res) {
						if (res && res.code === 200) {
							var tagNames = res.data.tagNames;
							var html = "";
							tagNames.forEach(function(item) {
								html = html + "<span class='tagName' data-event='click' data-handler='selectTagNameEvent' style='border-radius: 2px;cursor:default;border:solid 1px white;color:white;margin:2px;'>" + item.name + "(" + item.referCount + ")</span>";
							});
							jQuery("#select-frame-mark-title").html(html);
							//由于在_bindEvents进行find的过程中，它还没有渲染到此处的data-handler，而在渲染后已经查找过了，因此，重新绑定下，且绑定到它的父元素
							_bindEvents("#select-frame-mark-title");
						} else {
							notify.warn('获取失败！');
						}
					}
				});
			},
			/**
			 * [_MarkerLevelClick 等级输入框的点击事件]
			 * @return {[type]} [description]
			 */
			_MarkerLevelClick = function() {
				var x = jQuery(this).offset().left,
					y = jQuery(this).offset().top,
					html = [
						"<div class='markerLevelcolor' tabindex='0'  data-event='mouseleave' data-handler='markerLevelcolorBlurEvent'>",
						"<iframe style='z-index:-1;width:100%;height:100%;'></iframe>",
						"<div class='red' level='0'>&nbsp;</div>",
						"<div class='orange' level='1'>&nbsp;</div>",
						"<div class='yellow' level='2'>&nbsp;</div>",
						"<div class='blue' level='3'>&nbsp;</div>",
						"<div class='gray' level='4'>&nbsp;</div>",
						"</div>"
					].join("");
				if (!jQuery(".markerLevelcolor")[0]) {
					jQuery(document.body).append(html);
					_bindEvents(".markerLevelcolor");
				}
				jQuery(".markerLevelcolor").css({
					"position": "absolute",
					"width": 50,
					"height": 90,
					"left": x,
					"top": y + 20,
					"display": "block",
					"border-radius": "3px"
				});
				jQuery(".markerLevelcolor > div").off("click").on("click", function(evt) {
					jQuery(".markerLevelcolor").hide();
					var color = jQuery(this).css("background-color");
					if (!color) {
						var class1 = jQuery(this).attr("class"),
							A = {
								"red": "red",
								"orange": "orange",
								"yellow": "yellow",
								"blue": "#00ccff",
								"gray": "#e1e1e1"
							};
						color = A[class1];
					}
					jQuery("#markerLevel").css("background-color", color);
					var level = jQuery(this).attr("level");
					//jQuery("#markerLevel").val(level);
					jQuery("#markerLevel").attr("level", level);
					//bug[47630]
					evt.stopPropagation();
				});
			},
			/**
			 * [_MarkerPannelClick 帧标记添加面板中，点击除标记名输入框、标记名输入框下拉列表外的其他位置时，下拉列表要隐藏]
			 */
			_MarkerPannelClick = function($node) {
				if ($node.attr("id") == "markerTitle") {
					return;
				}
				if ($node.attr("id") == "select-frame-mark-title") {
					return;
				}
				if ($node.hasClass("tagName")) {
					return;
				}
				jQuery("#select-frame-mark-title").remove();
			},
			/**
			 * [_CanBeSaved 判断帧标记名称和等级是否满足保存的要求，若有一个为空，则不能保存]
			 * 此函数在进行帧标记添加的保存_SaveFrame中使用到
			 * @return {[Boolean]} [true：表示可以保存；false：表示不能保存]
			 */
			_CanBeSaved = function(tagName){
				var canBeSaved = true;
				if (tagName === "") {
					notify.warn("帧标记名称不能为空");
					canBeSaved = false;
				}
				if ((jQuery('#markerLevel').attr("level") - 0) === -1) {
					notify.warn("帧标记等级不能为空");
					canBeSaved = false;
				}
				return canBeSaved;
			},
			/**
			 * [_SaveFrame 保存帧标记]
			 * @return {[type]} [description]
			 */
			_SaveFrame = function() {
				var tagName = jQuery(".frame-marker #markerTitle").val();
				tagName = tagName.replace(/(^\s+|\s+$)/gi, "").replace(/\n/gi, "");
				if (_CanBeSaved(tagName)) {
					var time = window.Toolkit.formatDate(new Date()),
						//type:0手动,1自动
						type = 0,
						index = _player.curChannel - 0,
						imagedata = _player.getPicInfo(index).replace(/[\n\r]/ig, ""),
						cameraId = _player.cameraData[index].cId || _player.cameraData[index].id,
						level = jQuery('#markerLevel').attr("level"),
						description = jQuery('.frame-marker textarea').val();

					description = description.replace(/(^\s+|\s+$)/gi, "").replace(/\n/gi, "");
					//如果播放的是历史的提交的是历史时间
					time = CommonFun.getPlayTime(time, _player, index);
					if (window.SelectCamera) {
						var FrameMark_InHisList = window.SelectCamera.ListData[index].FrameMark_InHisList;
						if (!FrameMark_InHisList) {
							FrameMark_InHisList = [];
						}
					}

		
					//此处是0的原因是：由于当前每个摄像机只有一路通道，因此只能取0。若后续增加了高清、标清等不同通道，则此处需要修改
					//added by yangll
					var channelId = 0; //要定义   为什么是0？哪位大神写的？
					//我写的，胡中传表示抗议
					//var channelId = player.cameraData[index].playingChannel.id;//马越添加

					jQuery.ajax({
						url: '/service/frame/add_frame',
						dataType: 'json',
						type: 'post',
						data: {
							cameraId: cameraId,
							channelId: channelId,
							time: time,
							type: type,
							level: level,
							name: tagName,
							description: description,
							image: imagedata
						},
						success: function(res) {
							if (res && res.code === 200) {
								jQuery('.frame-marker textarea').html('');
								//等级还原
								jQuery('#markerLevel').attr("level", 1);
								jQuery('#markerLevel').css("background-color", "red");
								jQuery('.frame-mark').removeClass('clicked');
								jQuery('.frame-marker').removeClass('active');
								jQuery('.marker-pannel').removeClass('active');
								notify.success('添加帧标记成功！');
								//日志记录，标记XX摄像机实时历史录像,add by wujingwen, 2015.08.11
								//var titleData = $("#upBlockContent").find(".video-title").attr("title");
								var strs = _player.playerObj.GetVideoAttribute(index) + "";
								var	videoTypes = JSON.parse(strs).videoType;
								if (videoTypes === 1) {
									//logDict是全局的函数，在component\base\self\log.js中。
									//insertMedialog: function(mo, description, func, callback)
									//四个参数依次为：mo:主模块,description:日志描述语,func:次模块
									//m1代表的含义可在component\base\self\log.js中查到
									window.logDict.insertMedialog("m1", "标记" + window.SelectCamera.selectName + "摄像机实时视频。");
								} else if (videoTypes === 2) {
									window.logDict.insertMedialog("m1", "标记" + window.SelectCamera.selectName + "摄像机历史视频。");
								}
								//这行代码的云平台的一个小块，目前已经不用
								//jQuery("#ptzCamera .content .view.hisplay.ui.tab .asearch").trigger("click");
								if (!window.SelectCamera) {
									return;
								}
								var ListData = window.SelectCamera.ListData[index],
									hasPlayTime = _player.getPlayTime(index),
									beginTime = ListData.beginTime,
									endTime = ListData.endTime,
									obj = {
										beginTime: beginTime,
										endTime: endTime
									};
								window.PlayerControler.setPos(obj, "playtime", hasPlayTime);
								window.SelectCamera.Channelid = window.SelectCamera.ListData[index].Channelid;
								setTimeout(function() {
									if (jQuery('#downBlockContent .video-type .real').hasClass('active')) {
										_mainCtrl.setPlayerUI(index, "real");
									} else if (jQuery('#downBlockContent .video-type .record').hasClass('active')) {
										_mainCtrl.setPlayerUI(index, "his");
									}
									_player.trigger("enter", [index, 10, 10]);
								}, 100);
								//by:wujingwen on 2015 08 148 废除旧日志
								//logDict.insertLog('m1', 'f1', 'o1', 'b42', tagName); //日志
							} else if (res && res.code === 400) {
								notify.warn(res.data.message);
							} else {
								notify.warn('添加帧标记失败！');
							}
						}
					});
				}
			},
			/**
			 * 事件绑定
			 * @return {[type]} [description]
			 */
			_bindEvents = function(selector) {
				var $curSelector = $(selector);
				//绑定本身元素上的事件
				$curSelector.off($curSelector.data("event")).on($curSelector.data("event"), _eventHandler[$curSelector.data("handler")]);
				//绑定子孙元素上的事件
				$curSelector.find("[data-handler]").map(function() {
					$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
				});
				$("body").on("click", function() {
					$(".marker-pannel").find(".close-frame").trigger("click");
				});
			};

		/**
		 * 播放器上添加帧标记业务逻辑入口
		 * @param  {[type]} Ocxplayer [播放器对象]
		 * @return {[type]}           [description]
		 */
		scope.init = function(ocxPlayer, mainCtrl) {
			//存储主控制器对象，主要为了方便调用controlbar.js中的公共函数
			_mainCtrl = mainCtrl;
			//存储播放器对象
			_player = ocxPlayer;

			//事件绑定
			_bindEvents(".marker-pannel");
		};

		return scope;

	}({}, jQuery));
});