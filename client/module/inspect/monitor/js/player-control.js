//视频控制条新增功能代码
define(['mootools'],function() {
	window.PlayerControler = new new Class({
		Implements: [Options, Events],
		isOnMouseMove: false,
		initialize: function (options) {
			var self = this;
			self.setOptions(options);
			window.setTimeout(function () {
				self.bindEvents();
			}, 2000);
		},
		/**
		 * [setPos 设置进度条的进度]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[type]}   obj   [json对象 格式{beginTime:beginTime,endTime:endTime}开始时间和结束时间]
		 * @param  {[type]}   stype [字符串类型 取playtime 和ratio两个值]
		 * @param  {[type]}   r     [设置位置传入的参数，表示位置坐标值，可以是像素，也可以是浮点小数 ]
		 */
		setPos: function (obj, stype, r) {
			var b = jQuery(".videoProgress").width();// - 13;
			if (stype === "ratio") {
				var x = b * r;
			}
			if (stype === "playtime") {
				var dis = obj.endTime - obj.beginTime;
				var x = b * r / dis;
			}
			if (x > b) {
				x = b;
			}
			if (x < 0) {
				x = 0;
			}
			jQuery(".ctrlbar").css("left", x + "px");
			jQuery(".played").css("width", x + "px");
		},
		/**
		 * [setDrag 拖动功能封装]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[type]}   options [json对象 示例
		 options={
					container:document,
				 	dragTarget:".ctrlbar",
				 	moveTarget:".ctrlbar",
				 	x:true,
				 	minx:0,
				 	maxx:function(){},
				 	ondragstart:function(x0,y0)
				 	{
				 		
				 	},
				 	ondraging:function(x0,y0,x,y,dx)
				 	{
				 		
				 	},
				 	ondragend:function(x0,y0,x,y,dx)
				 	{

				 	}
			};
		 * ]
		 */
		setDrag: function (options) {
			var self = this;
			var x0 = 0;
			var y0 = 0;
			var left = 0;
			var top = 0;
			var mousedown = false;
			var player = window.gVideoPlayer;
			if (player === undefined) {
				return;
			}

			jQuery(options.container).off("mousedown", options.dragTarget).on("mousedown", options.dragTarget, function (evt) {
				evt.stopPropagation();
				evt.preventDefault();
				self.isOnMouseMove = true;
				var index = player.curChannel;
				if (index === -1) {
					return;
				}
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str === "ERROR") {
					return
				}
				x0 = evt.clientX;
				y0 = evt.clientY;
				left = jQuery(options.moveTarget).css("left");
				top = jQuery(options.moveTarget).css("top");
				left = parseInt(left);
				top = parseInt(top);
				mousedown = true;
				if (options.ondragstart) {
					options.ondragstart(x0, y0, index);
				}
			});

			jQuery(options.container).off("mousemove").on("mousemove", function (evt) {
				if (player === undefined) {
					return;
				}
				var index = player.curChannel;
				if (index === -1) {
					return;
				}
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str === "ERROR") {
					return;
				}
				if (mousedown) {
					var x = evt.clientX;
					var y = evt.clientY;
					if (typeof(options.minx) == "function") {
						options.minx = options.minx();
					}
					if (typeof(options.maxx) == "function") {
						options.maxx = options.maxx();
					}
					if (typeof(options.miny) == "function") {
						options.miny = options.miny();
					}
					if (typeof(options.maxy) == "function") {
						options.maxy = options.maxy();
					}

					if (options && options.x) {
						var xx = left + x - x0;
						if (options.minx && xx < options.minx) {
							xx = options.minx;
						}
						if (options.maxx && xx > options.maxx) {
							xx = options.maxx;
						}
						jQuery(options.moveTarget).css("left", xx);
					}
					if (options && options.y) {
						var yy = top + y - y0;
						if (options.miny && yy < options.miny) {
							yy = options.miny;
						}
						if (options.maxy && yy > options.maxy) {
							yy = options.maxy;
						}
						jQuery(options.moveTarget).css("top", yy);
					}
					if (options.ondraging) {
						options.ondraging(x0, y0, x, y, x - x0);
					}
				}
			});
			var mouseout = "";
			if (options.mouseout) {
				mouseout = " mouseout"
			}
			//
			jQuery(options.container).off("mouseup" + mouseout, options.dragTarget).on("mouseup" + mouseout, options.dragTarget, function (evt) {
				var x = evt.clientX;
				var y = evt.clientY;
				evt.stopPropagation();
				evt.preventDefault();
				self.isOnMouseMove = false;
				if (mousedown && options.ondragend) {
					options.ondragend(x0, y0, x, y, x - x0);
				}
				mousedown = false;
			});
		},
		/**
		 * [givePlayTime 给出一个时间数组,第一个值为两小时之前，第二个值为当前]
		 * @author huzc
		 * @date   2015-03-04
		 * @return {[type]}   [长度为2的时间数组]
		 */
		givePlayTime: function () {
			var D = new Date();
			var b = D.getTime();
			var a = b - 2 * 60 * 60 * 1000;
			var fmt_a = "yyyy-MM-dd hh:mm:ss";
			var fmt_b = "yyyy-MM-dd hh:mm:ss";
			var a = (new Date(a)).format(fmt_a);
			var b = (new Date(b)).format(fmt_b);
			return [a, b];
		},
		/**
		 * [playSomeTimeAgo 播放当前时间指定时间之前的录像]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   n     [数字，毫秒，n分钟之前]
		 * @param  {[数字]}   index [description]
		 * @return {[type]}         [description]
		 */
		playSomeTimeAgo: function (n, player, index) {
			var D = new Date();
			var T = D.getTime() - n * 60 * 1000;
			var ListData = window.SelectCamera.ListData[index];
			var beginTime = ListData.beginTime;
			var endTime = ListData.endTime;
			var dis = endTime - beginTime;
			var seekTime = T - beginTime;
			if (seekTime < 0) {
				seekTime = 0
			}
			if (seekTime >= dis) {
				seekTime = dis
			}
			var N = player.playerObj.SetPlayMode(2, seekTime, index);
			if (N < 0) {
				//notify.warn("定位播放失败:"+player.getErrorCode(N+""));
			}
		},
		/**
		 * [videoInit 时间轴初始化]
		 * @author huzc
		 * @date   2015-03-04
		 * @return {[type]}   [无]
		 */
		videoInit: function () {
			jQuery(".played").css("width", 0);
			jQuery(".ctrlbar").css("left", 0);
		},
		/**
		 * [PlayToPosition 定位某个位置播放录像]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   index [分屏序号]
		 * @param  {[数字]}   x0    [定位的坐标]
		 * @param  {[数字]}   w0    [定位区域的宽度，就是进度条的宽度]
		 */
		PlayToPosition: function (index, x0, w0) {
			var self = this,
				player = window.gVideoPlayer,
				$seekPosObj = jQuery("#winPopup-showframe").find("div"),
				N,
				time;
			//如果播放器为空，则直接返回
			if (player === undefined) {
				notify.warn("定位播放失败！");
				return;
			}
			var beginTime = window.SelectCamera.ListData[index].beginTime;
			var endTime = window.SelectCamera.ListData[index].endTime;
			var obj = {
				beginTime: beginTime,
				endTime: endTime
			};
			//如果有浮动seek标记，则直接读取时间进行播放，不在进行重新计算
			if ($seekPosObj && $seekPosObj.text() !== "") {
				var seekTime = Toolkit.str2mills($seekPosObj.text().trim());
				time = seekTime - beginTime;
			} else {
				var r = x0 / w0;
				var dis = endTime - beginTime;
				time = parseInt(dis * r);
			}
			console.log("seek time:", Toolkit.mills2datetime(time + beginTime), time, "录像开始时间：", Toolkit.mills2datetime(beginTime), "录像结束时间：", Toolkit.mills2datetime(endTime));
			//校时1s钟
			var time = time - 1000;
			//定位播放
			N = player.playerObj.SetPlayMode(2, (time < 0 ? 0 : time), index);
			//信息提示
			if (N < 0) {
				notify.warn("定位播放失败:" + player.getErrorCode(N + ""));
			} else {
				//关闭当前窗口的监听定时器
				if (window.ProgressTimer[index]) {
					clearInterval(window.ProgressTimer[index]);
				}
				//300毫秒后重新读取进度条，由于ocx中更新状态为200毫秒，故需要等ocx写入值之后再进行
				//后续改用SetPlayMode的回调函数进行
				if (self.timer) {
					window.clearTimeout(self.timer);
				}
				self.timer = setTimeout(function () {
					ControlBar.ListenPlayerProgress(player, index, true);
				}, 3000);
				//同步拖动手柄
				self.setPos(obj, "playtime", time);
			}
		},
		/**
		 * [ShowFrameDialog 显示帧标记详情页对话框]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   id [帧标记id]
		 * @param  {Function} fn [无]
		 */
		ShowFrameDialog: function (id, fn) {
			var getTag = jQuery.get("/service/frame/frameTag/" + id);
			var getHTML = jQuery.get("/module/framemark/inc/frame_mark.html");
			jQuery.when(getTag, getHTML).done(function (tagjson, html) {
				var template = Handlebars.compile(html[0]);
				if (!tagjson[0].data || !tagjson[0].data.tag) {
					return
				}
				var Colors = ["red", "orange", "yellow", "#00ccff", "#e1e1e1"];
				var ColorsType = ["red", "orange", "yellow", "blue", "gray"];
				tagjson[0].data.tag.id = id;
				tagjson[0].data.tag.bigurl = "http://" + location.host + "/service/frame/frameTag/image/" + id;
				tagjson[0].data.tag.time = Toolkit.mills2datetime(tagjson[0].data.tag.time);
				tagjson[0].data.tag.modifyTime = Toolkit.mills2datetime(tagjson[0].data.tag.modifyTime);
				var level = tagjson[0].data.tag.level;
				tagjson[0].data.tag.color = Colors[level];
				tagjson[0].data.tag.colorType = ColorsType[level];
				var img = new Image();
				img.src = tagjson[0].data.tag.bigurl;
				var html = template(tagjson[0].data);
				if (jQuery("#dom_Panel")[0]) {
					jQuery("#dom_Panel").remove();
				}
				jQuery(document.body).append(html);
				jQuery(".rightPanel .content .selectPages").hide();
				jQuery("#dom_Panel").data("index", index);
				if ($("#userEntry").text() !== jQuery("#taguserName").text()) {
					jQuery("#dom_Panel .leftPanel .button button.delete").attr("disabled", "true");
					jQuery("#dom_Panel .leftPanel .button button.edit").attr("disabled", "true");
				}
				setTimeout(function () {
					var w = img.width;
					var h = img.height;
					jQuery("#imageSize").html(w + "x" + h);
				}, 1000);
				if (typeof(fn) == "function") {
					fn(id, tagjson[0].data);
				}
			});
		},

		bindEvents: function () {

			Date.prototype.format = function (format) {
				var o =
				{
					"M+": this.getMonth() + 1, //month
					"d+": this.getDate(), //day
					"h+": this.getHours(), //hour
					"m+": this.getMinutes(), //minute
					"s+": this.getSeconds(), //second
					"q+": Math.floor((this.getMonth() + 3) / 3), //quarter
					"S": this.getMilliseconds() //millisecond
				}

				if (/(y+)/.test(format)) {
					format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
				}

				for (var k in o) {
					if (new RegExp("(" + k + ")").test(format)) {
						format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
					}
				}
				return format;
			}
			var player = window.gVideoPlayer;
			if (player === undefined) {
				return;
			}
			var self = this;
			self.setDrag({
				container: document,
				dragTarget: ".ctrlbar",
				moveTarget: ".ctrlbar",
				x: true,
				minx: 0,
				maxx: function () {
					return jQuery(".videoProgress").width() - 13;
				},
				ondragstart: function (x0, y0, index) {
					var w0 = jQuery(".played").css("width");
					w0 = parseInt(w0);
					this.w0 = w0;
					//关闭当前窗口的监听定时器
					if (window.ProgressTimer[index]) {
						clearInterval(window.ProgressTimer[index]);
					}
				},
				ondraging: function (x0, y0, x, y, dx) {
					var w = jQuery(".ctrlbar").css("left");
					jQuery(".played").css("width", w);
				},
				ondragend: function (x0, y0, x, y, dx) {
					var left = parseInt(jQuery(".ctrlbar").css("left"));
					var w = jQuery(".videoProgress").width() - 13;
					var per = left / w;
					var index = player.curChannel;
					var obj = {
						data: [x0, y0, x, y, dx],
						index: index,
						per: per
					};
					self.fireEvent("dragEnd", obj);
				}
			});
			var Ctrl_Bar = jQuery("#downBlockContent .videoProgress .ctrlbar")[0];
			Ctrl_Bar.onselectstart = function () {
				return false;
			};
			Ctrl_Bar.ondragstart = function () {
				return false;
			};

			var winPopup = null;
			player.on("enter", function (index) {
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str === "ERROR") {
					jQuery("#winPopup-showframe").remove();
					jQuery("#showframe-title-img").remove();
				}
			});

			player.on("leave", function () {
				if (jQuery("#winPopup-showframe")[0]) {
					jQuery("#winPopup-showframe").remove();
				}
				if (jQuery("#showframe-title-img")[0]) {
					jQuery("#showframe-title-img").remove();
				}
			});
			jQuery(document).off("mouseenter", "#downBlockContent .videoProgress .ctrlbar").on("mouseenter", "#downBlockContent .videoProgress .ctrlbar", function (evt) {
				var ex = evt.clientX;
				//var ey = evt.clientY;
				if (!showframelevel) {
					return;
				}
				if (jQuery(".screenshot-preview").is(":visible")) {
					return;
				}
				var player = window.gVideoPlayer;
				if (player === undefined) {
					return;
				}
				var y = jQuery(this).offset().top;
				var index = player.curChannel;
				var str = player.playerObj.GetVideoAttribute(index);
				if (str === "ERROR") {
					return;
				}
				var index = player.curChannel,
					beginTime = window.SelectCamera.ListData[index].beginTime,
					curPlayTime = player.getPlayTime(index),
					time = beginTime + curPlayTime;
				var timestr = Toolkit.formatDate(new Date(time));
				var html = [
					"<div id='winPopup-showframe' tabindex='0' style='cursor:default;'>",
					"<iframe src='about:blank'></iframe>",
					"<div style='padding:3px;background-color:#454545;color:white;'>" + timestr + "</div>",
					"</div>"
				].join("");

				var $popupFrame = jQuery("#winPopup-showframe"),
					$frameTitleImg = jQuery("#showframe-title-img");

				if (!$popupFrame[0]) {
					jQuery(document.body).append(html);
				} else {
					jQuery("#winPopup-showframe > div").html(timestr);
				}
				if ($frameTitleImg[0]) {
					$frameTitleImg.remove();
				}
				$popupFrame.css({
					left: ex - 40,
					top: y - 32
				});
				if (!$popupFrame.is(":visible")) {
					$popupFrame.show();
				}
			});

			jQuery(document).off("mouseout", "#downBlockContent .videoProgress").on("mouseout", "#downBlockContent .videoProgress", function (evt) {
				jQuery("#winPopup-showframe").remove();
			});
			//鼠标移入录像播放条显示刻度的处理逻辑
			jQuery(document).off("mousemove", "#downBlockContent .videoProgress").on("mousemove", "#downBlockContent .videoProgress", function (evt) {
				if (jQuery(evt.target).hasClass("ctrlbar") && !self.isOnMouseMove) {
					return;
				}
				var ex = evt.clientX;
				if (!showframelevel) {
					return;
				}
				if (jQuery(".screenshot-preview").is(":visible")) {
					return;
				}
				var player = window.gVideoPlayer;
				if (player === undefined) {
					return;
				}
				var index = player.curChannel;
				var str = player.playerObj.GetVideoAttribute(index);
				if (str === "ERROR") {
					return;
				}
				//showframelevel=true;
				var $this = jQuery(this),
					x = $this.offset().left,
					y = $this.offset().top,
					w = $this.width();// - 13;
				var index = player.curChannel,
					beginTime = window.SelectCamera.ListData[index].beginTime,
					endTime = window.SelectCamera.ListData[index].endTime,
					playRate = (ex - x) / w;
				if (playRate > 0.9) {
					playRate = (ex - x) / (w - 1);
				}
				var time = beginTime + (endTime - beginTime) * playRate;
				time = parseInt(time);
				var timestr = Toolkit.formatDate(new Date(time)),
					html = [
						"<div id='winPopup-showframe' tabindex='0' style='cursor:default;'>",
						"<iframe src='about:blank'></iframe>",
						"<div style='padding:3px;background-color:#454545;color:white;'>" + timestr + "</div>",
						"</div>"
					].join(""),
					$popupFrame = jQuery("#winPopup-showframe"),
					$frameTitleImg = jQuery("#showframe-title-img");

				if (!$popupFrame[0]) {
					jQuery(document.body).append(html);
				} else {
					jQuery("#winPopup-showframe > div").html(timestr);
				}
				if ($frameTitleImg[0]) {
					$frameTitleImg.remove();
				}
				$popupFrame.css({
					left: ex - 40,
					top: y - 32
				});
				if (!$popupFrame.is(":visible")) {
					$popupFrame.show();
				}
			});

			var showframelevel = true;
			jQuery(document).off("blur", "#winPopup-showframe").on("blur", "#winPopup-showframe", function () {
				jQuery("#winPopup-showframe").remove();
			});

			jQuery(document).off("mouseout", "#downBlockContent .videoProgress .framelevel").on("mouseout", "#downBlockContent .videoProgress .framelevel", function (evt) {
				showframelevel = true;
			});

			jQuery(document).off("mouseover", "#downBlockContent .videoProgress .framelevel").on("mouseover", "#downBlockContent .videoProgress .framelevel", function (evt) {
				if (showframelevel) {
					showframelevel = false;
				}
				if (jQuery(".screenshot-preview").is(":visible")) {
					return;
				}
				var player = window.gVideoPlayer;
				if (player === undefined) {
					return;
				}
				var index = player.curChannel;
				var str = player.playerObj.GetVideoAttribute(index);
				if (str === "ERROR") {
					return;
				}
				evt.stopPropagation();
				evt.preventDefault();
				var $this = jQuery(this),
					x = $this.offset().left,
					y = $this.offset().top,
					bgolor = $this.css("background-color"),
					id = $this.attr("framemarkid"),
					title = $this.attr("_title").split("\n"),
					description = $this.attr("description");

				var url = "/service/frame/frameTag/thumbnail/" + id,
					bigurl = "/service/frame/frameTag/image/" + id,
					html = [
						"<div id='showframe-title-img' tabindex='0' framemarkid='" + id + "'>",
						"<iframe src='about:blank'></iframe>",
						"<div style='padding:3px;'>",
						"<div class='showframe-name'>" + title[0] + "</div>",
						"<div class='frametitle-time'>",
						"<span class='frametitle' style='background-color:" + bgolor + ";'>" + title[1] + "</span>&nbsp;&nbsp;",
						"</div>",
						"<div style='cursor:pointer;text-align:right;padding-right:2px;'>",
						"<img description='" + description + "' bigurl='" + bigurl + "' id='smallimage' src='" + url + "'/>",
						"</div>",
						"</div>",
						"</div>"
					].join(""),
					$popupFrame = jQuery("#winPopup-showframe"),
					$frameTitleImg = jQuery("#showframe-title-img");

				$popupFrame.hide();
				if (!$frameTitleImg[0]) {
					jQuery(document.body).append(html);
				}
				$frameTitleImg.css({
					left: x - 80,
					top: (y - 78 - 54) + 2,
					"z-index": 9999
				}).show();
				$frameTitleImg.focus();
			});

			jQuery(document).off("blur", "#showframe-title-img").on("blur", "#showframe-title-img", function () {
				window.setTimeout(function () {
					jQuery("#showframe-title-img").remove();
				}, 100);
			});

			jQuery(document).off("click", "#showframe-title-img #smallimage").on("click", "#showframe-title-img #smallimage", function () {
				var $this = jQuery(this),
					description = $this.attr("description"),
					bigurl = $this.attr("bigurl");
				content = "<img id='framemarkbigimage' class='framemark-bigimage' title='" + description + "' src='" + bigurl + "' style='width:100%;height:370px;'>";
				new ConfirmDialog({
					title: '',
					classes: 'picture-dialog',
					width: 580,
					height: 480,
					warn: true,
					message: content
				});
				jQuery("#showframe-title-img").remove();
				jQuery("#domPanel .picture-dialog .ui.button").remove();
				//var id=jQuery("#showframe-title-img").attr("framemarkid");
				//self.ShowFrameDialog(id);
			});

			//实现点击进度条上下附近位置也能实现定位播放
			jQuery(document).off("click", "#downBlockContent").on("click", "#downBlockContent", function (evt) {
				return false;
				var x = evt.clientX;
				var y = evt.clientY;
				var $frameContent = jQuery(".frameMarkcontent"),
					$videoBtn = jQuery(".video-btn .toggle"),
					rect = $frameContent.offset(),
					w0 = $frameContent.width(),
					y0 = $frameContent.offset().top,
					left = rect.left;
				if (x >= left && x <= left + w0) {
					if ((y < y0 && y >= y0 - 5) || (y >= y0 + 4 && y <= y0 + 9)) {
						var x0 = x - rect.left;
						var index = player.curChannel;
						self.PlayToPosition(index, x0, w0);
						$videoBtn.removeClass("toggle-play");
						$videoBtn.addClass("toggle-pause");
					}
				}
			});

			//点击定位播放
			jQuery(document).off("click", ".frameMarkcontent").on("click", ".frameMarkcontent", function (evt) {
				evt.stopPropagation();
				evt.preventDefault();
				var index = player.curChannel,
					x = evt.clientX,
					y = evt.clientY,
					x0 = evt.offsetX,
					y0 = evt.offsetY,
					w = jQuery(this).width(),
					$videoBtn = jQuery(".video-btn .toggle");

				self.PlayToPosition(index, x0, w);
				$videoBtn.removeClass("toggle-play");
				$videoBtn.addClass("toggle-pause");
			});
		}
	});
});