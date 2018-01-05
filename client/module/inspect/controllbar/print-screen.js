/**
 * 播放器抓图的js文件 
 * 2016/5/17 by yangll 
 * 1. 确定cotrolbar.js中的抓图上传函数uploadImage和处理抓图显示面板函数previewPanel是否被用到，若没有则要删去
 * 2. cotrolbar.js中的变量streamRateTimerGrab有且被“通道拖动”的功能模块用到
 * 3. 当连拍模块也拆完后，可将数组变量_originPic和_uploadedImg也都放到print-screen.js中，将其从cotrolbar.js中删去
 */
define([
	"/module/common/popLayer/js/popImg.js",
	"jquery"
], function(POPIMG, jQuery) {
	return (function(scope, $) {

		var //存储主控制器对象，主要为了方便调用controlbar.js中的公共函数或工作变量
			_mainCtrl = null,
			//播放器对象
			_player = null,
			//抓图时用来保存原图信息
			_originPic = [],
			//抓图时用来保存上传图片的信息
			_uploadedImg = [],
			//最多可以抓取的图片数量
			_PICMAXLENGTH = 10,
			//事件处理程序
			_eventHandler = {
				//向前翻页的事件
				"ForwardEvent": function(evt) {
					_forward.call(this);
					event.stopPropagation();
				},
				//向后翻页的事件
				"AfterwardEvent": function(evt) {
					_afterward.call(this);
					event.stopPropagation();
				},
				//鼠标双击查看大图的事件
				"ViewImageEvent": function(evt) {
					_viewImage.call(this);
					event.stopPropagation();
				},
				//退出时隐藏预览区的事件，即鼠标点击预览区的关闭事件
				"ExitPrintScreenEvent": function(evt) {
					_exitPrintScreen.call(this);
					evt.stopPropagation();
				}
			};
		var
			//显示图片预览区
			_showPicArea = function() {
				if (jQuery("#picbox img").length < _PICMAXLENGTH) {
					var index = _player.curChannel;
					//若是第一次点击抓图按钮,需要清除之前的抓图,非第一次抓图，需要取出点击截图按钮时#picbox的left值
					if (!_player.cameraData[index].picFlag) {
						jQuery(".screenshot-preview").show().addClass("show");
						jQuery("#picbox").css("left", "0");
						//清空上次内容
						//jQuery("#preview_img").html("");
						//清空上次内容
						jQuery("#picbox").html("");
					}
					var pic,
						//stype='1'表示是特殊情况 needupload是否需要上传
						img = jQuery("<img class='viewer-image' stype='1' needupload='true'  data-event='dblclick' data-handler='ViewImageEvent'/>");
						
					pic = _player.grabCompressEx2(index, 320, 0);
					//unshift() 方法可向数组的开头添加一个或更多元素，并返回新的长度
					_originPic.unshift({
						"url": _player.grabOriginalEx(index),
						"status": false
					});
					//抓图标示位，每次只允许一个通道处于抓图状态
					_player.cameraData[index].picFlag = true;
					img.attr("src", "data:image/jpg;base64," + pic);
					//jQuery("#preview_img").attr("data-cid", _player.cameraData[index].cId);
					//jQuery("#preview_img").prepend('<li><img></li>');
					jQuery("#picbox").prepend(img);
					jQuery(".screenshot-preview").attr("screen", index);
					window.logDict.insertMedialog("m1", "抓取" + window.SelectCamera.selectName + "摄像机视频画面");
				} else {
					notify.warn("您已达到抓图上限！您可以点击缩略图预览大图并进行上传！");
				}
			},
			//抓图下方控制条显示
			_showBtn = function() {
				var downWidth = jQuery(".preview-panel").width(),
					//前翻页的按钮宽度
					forwardBtnWidth = $(".preview-panel .forward").outerWidth(true), 
					//退出按钮的宽度
					exitBtnWidth = $(".preview-panel .exit").outerWidth(true),
					//后翻页的按钮宽度 
					afterwardBtnWidth = $(".preview-panel .afterward").outerWidth(true), 
					//每个图片的宽度
					everyPicWidth = $("#picbox img").outerWidth(true), 
					//截图的个数
					picCounts = jQuery(".preview-panel img").size(), 
					//当前所有截图的宽度
					allPicWidth = picCounts * everyPicWidth; 
				//若当前宽度足以显示图片，则前后翻页的按钮隐藏；否则前后翻页的按钮显示
				if ((downWidth - exitBtnWidth) >= allPicWidth) { 
					jQuery(".visual-area").width(allPicWidth).css("left", 0);
					jQuery(".forward,.afterward").hide();
				} else {
					jQuery(".forward,.afterward").show();
					jQuery(".afterward").addClass("disable");
					jQuery(".visual-area").css("left", forwardBtnWidth).width(downWidth - exitBtnWidth - forwardBtnWidth - afterwardBtnWidth);
					//这个地方的宽度为什么是这个？不需要减去前面的上一页么？
				}
			},
			_forward = function() {
				if (jQuery(this).parent().hasClass("disable")) {
					return;
				}
				var visualAreaWidth = jQuery(".visual-area").width(),
					leftStr = jQuery("#picbox").css("left"),
					//这个值最小是0  最大值是所有图片的宽度 但是只能小于
					leftVal = parseInt(leftStr.substring(0, leftStr.length - 2)),
					newLeft = leftVal - visualAreaWidth;
				jQuery("#picbox").css("left", newLeft);
				var 
					//每个图片的宽度
					everyPicWidth = $("#picbox img").outerWidth(true), 
					//截图的个数
					picCounts = jQuery(".preview-panel img").size(), 
					//当前所有截图的宽度
					allPicWidth = picCounts * everyPicWidth, 
					elseWidth = allPicWidth - (-newLeft);
				if (elseWidth < visualAreaWidth) {
					jQuery(".preview-panel .afterward").removeClass("disable");
					jQuery(".preview-panel .forward").addClass("disable");
				}
			},
			_afterward = function() {
				if (jQuery(this).parent().hasClass("disable")) {
					return;
				}
				var visualAreaWidth = jQuery(".visual-area").width();
				var leftStr = jQuery("#picbox").css("left"),
					leftVal = parseInt(leftStr.substring(0, leftStr.length - 2)), 
					newLeft = leftVal + visualAreaWidth > 0 ? 0 : leftVal + visualAreaWidth;
				jQuery("#picbox").css("left", newLeft);

				var everyPicWidth = $("#picbox img").outerWidth(true), 
					picCounts = jQuery(".preview-panel img").size(), 
					allPicWidth = picCounts * everyPicWidth, 
					elseWidth = allPicWidth - (-newLeft);

				if (elseWidth < visualAreaWidth || !newLeft) {
					jQuery(".preview-panel .forward").removeClass("disable");
					jQuery(".preview-panel .afterward").addClass("disable");
				}
			},
			//抓图后的图片双击全屏查看
			_viewImage = function() {
				// 先隐藏掉ocx
				jQuery("#npplay").find(".screen").css({
					"visibility": "hidden"
				});
				var $this = jQuery(this),
					//$this.index()这种方式是什么意思
					index = $this.index(),
					curOrgPath = "data:image/jpg;base64," + _originPic[index].url,
					curCameraName = jQuery("#upBlockContent .video-title").attr("title"),
					curNowTimeStr = window.Toolkit.formatDate(new Date());

				var dataModel = {
					showRightDetailInfo: false,
					baseInfo: {
						filePath: "",
						//图片src
						fileFormat: "jpg"
					},
					operatorOptions: {
						// 旋转
						imgRotateIcon: true, 
						// 水平翻转
						horizontalTurnIcon: true, 
						// 垂直翻转
						verticalTurnIcon: true, 
						imgProcessIcon: false,
						// 保存到云空间
						saveToCloudbox: { 
							fileName: "",
							filePath: ""
						}
					},
					callback: function() {
						jQuery("#npplay").find(".screen").css({
							"visibility": "visible"
						});
					}
				};

				setTimeout(function() {
					//_viewImgEvent();
					//?????如何精简参数呢
					_viewImgEvent(dataModel, curOrgPath, curCameraName, curNowTimeStr, index);
					//_viewImgEvent(dataModel);
				}, 100);
			},
			//抓图后的图片双击全屏查看,调用已封装好的/module/common/popLayer/js/popImg.js中的函数
			_viewImgEvent = function(dataModel, curOrgPath, curCameraName, curNowTimeStr, index) {
				var currentData = Object.clone(dataModel),
					toggleData = Object.clone(dataModel);
				// 给当前图片数据赋值
				currentData.baseInfo.filePath = curOrgPath;
				currentData.operatorOptions.saveToCloudbox.fileName = curCameraName + "(" + curNowTimeStr + ")";
				currentData.operatorOptions.saveToCloudbox.filePath = curOrgPath.replace(/^data\:image\/jpg\;base64\,/gi, "");

				POPIMG.initial(currentData, {
					toggleImg: function(index, callback) {
						var $allImgs = jQuery("#picbox").find(".viewer-image"),
							orgPicPath,
							cameraName = jQuery("#upBlockContent .video-title").attr("title"),
							nowTimeStr = window.Toolkit.formatDate(new Date());

						if (index === -1 || index >= $allImgs.length) {
							return callback(null);
						}

						orgPicPath = "data:image/jpg;base64," + _originPic[index].url;

						if (_originPic[index].url) {
							// 给切换的图片赋值
							toggleData.baseInfo.filePath = orgPicPath;
							toggleData.operatorOptions.saveToCloudbox.fileName = curCameraName + "(" + curNowTimeStr + ")";
							toggleData.operatorOptions.saveToCloudbox.filePath = orgPicPath.replace(/^data\:image\/jpg\;base64\,/gi, "");
							callback(toggleData);
						}

					},
					currentIndex: index
				});
			},
			/**
			 * 点击预览区右上角的叉号时，退出抓图，将缩略图预览区隐藏
			 */
			_exitPrintScreen = function() {
				jQuery("#downBlock").removeClass("printscreen");
				//removeClass("show")和hide()实现的功能一样吧
				var previewPanel = jQuery(".screenshot-preview").removeClass("show");
				previewPanel.hide();
				jQuery(".screenshot-preview").removeAttr("screen");
				(_player.grabIndex !== -1) && (_player.cameraData[_player.grabIndex].picFlag) && (_player.cameraData[_player.grabIndex].picFlag = false);
				//jQuery('#picbox,#preview_img').empty();
				jQuery("#picbox").empty();
				if (_mainCtrl.streamRateTimerGrab) {
					clearInterval(_mainCtrl.streamRateTimerGrab);
					_mainCtrl.streamRateTimerGrab = null;
				}
				setTimeout(function() {
					jQuery(".screenshot-preview").hide();
				}, 200);
				//置空本地原图的索引数组
				_originPic = [];
				//置空已上传的图片索引数组
				_uploadedImg = [];
			},
			/**
			 * 事件绑定
			 * @return {[type]} [description]
			 */
			_bindEvents = function(selector) {
				$(selector).find("[data-handler]").map(function() {
					$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
				});
			};

		/**
		 * 播放器上抓图业务逻辑入口
		 * @param  {[type]} ocxPlayer [播放器对象]
		 * @return {[type]}           [description]
		 */
		scope.init = function(ocxPlayer, mainCtrl) {
			//存储主控制器对象，主要为了方便调用controlbar.js中的公共函数和公共变量
			_mainCtrl = mainCtrl;
			//存储播放器对象
			_player = ocxPlayer;
			//显示图片预览区
			_showPicArea();
			//显示图片预览区上左右翻页的按钮
			_showBtn();
			//事件绑定
			_bindEvents(".screenshot-preview");
		};
		return scope;
	})({}, jQuery);
});