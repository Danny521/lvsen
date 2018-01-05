/*global MaskLayer:true,Toolkit:true*/
define([
	"jquery",
	"base.self",
	"handlebars"
],function(jQuery){
	/**
	 * 构造函数
	 */
	var manualView = function() {
		this.renderTemp = null;
		this.currPlayer = null;
		this.templateURL = "/module/inspect/manual-alarm/inc/manual.html";
	};
	/**
	 * 原型扩展
	 * @type {{alarmInfo: {img: string, cameraId: string, alarmPlace: string, absTime: string, alarmPerson: string, level: null, alarmReason: string, cameraChannelId: null}, init: Function, initTemp: Function, loadTemplate: Function, showManalInfo: Function, bindEvents: Function}}
	 */
	manualView.prototype = {
		alarmInfo: {
			img: "",
			cameraId: "",
			alarmPlace: "",
			absTime: "",
			alarmPerson: "",
			level: null,
			alarmReason: "",
			cameraChannelId: null
		},
		/**
		 * 初始化
		 * @param player - 播放器
		 */
		init: function(player) {
			this.currPlayer = player;
			this.initTemp();
		},
		/**
		 * 加载模板
		 */
		initTemp: function() {
			var self = this;
			self.loadTemplate(self.templateURL, function (template) {
				//存储模板渲染对象
				self.renderTemp = template;
				self.showManalInfo();
				self.bindEvents();
			}, function () {
				notify.error("模板加载失败!");
			});
		},
		/**
		 * 加载模板通用函数
		 */
		loadTemplate: function(url, callbackSuccess, callbackError) {
			var compiler = null;
			//加载模板
			jQuery.when(Toolkit.loadTempl(url)).done(function (timeTemplate) {
				if (timeTemplate instanceof Array) {
					timeTemplate = timeTemplate[0];
				}
				//模板加载成功
				compiler = Handlebars.compile(timeTemplate);
				//成功的回调函数
				if (callbackSuccess && typeof callbackSuccess === "function") {
					callbackSuccess(compiler);
				}
			}).fail(function () {
				//错误的函数
				if (callbackError && typeof callbackError === "function") {
					callbackError();
				}
			});
		},
		/**
		 * 显示报警信息
		 **/
		showManalInfo:function(){
			var self = this,
				html = self.renderTemp({}),
				index = 0;
			MaskLayer.show();
			jQuery("body").append(html);
			self.alarmInfo.img = self.currPlayer.getPicInfo(index).replace(/[\n\r]/ig, "");
			var imgPath = "data:image/jpg;base64," + self.alarmInfo.img;
			if (navigator.userAgent.indexOf("MSIE 8.0") > 0) {
				jQuery.ajax({
					url: "/service/pvd/upload/base64",
					type: "post",
					data: {
						picture: encodeURI(self.alarmInfo.img.replace(/[\n\r]/ig, ""))
					},
					dataType: "json",
					success: function(res) {
						if (res.code === 200) {
							imgPath = res.data.path;
						} else if (res.code === 500) {
							notify.error(res.data.message);
						} else {
							notify.error("获取当前摄像机画面失败！");
						}
					}
				});
			}
			jQuery("#manual").find(".pic .alarm-pic").attr("src", imgPath);
			self.alarmInfo.cameraId = self.currPlayer.cameraData[index].cId;
			self.alarmInfo.alarmPlace = self.currPlayer.cameraData[index].cName;
			self.alarmInfo.absTime = Toolkit.str2mills(Toolkit.formatDate(new Date()));
			self.alarmInfo.alarmPerson = jQuery("#userEntry").text();
			if (self.currPlayer.cameraData[index].hdChannel && self.currPlayer.cameraData[index].hdChannel.length > 0) {
				self.alarmInfo.cameraChannelId = player.cameraData[index].hdChannel[0].id; //目前只有1个
			} else if (self.currPlayer.cameraData[index].sdChannel && self.currPlayer.cameraData[index].sdChannel.length > 0) {
				for (var i = 0; i < self.currPlayer.cameraData[index].sdChannel.length; i++) {
					if (self.currPlayer.cameraData[index].sdChannel[i].pvg_group_id === 2 || self.currPlayer.cameraData[index].sdChannel[i].pvg_group_id === 3) { //1表示编码器，没有录像；2表示DVR
						self.alarmInfo.cameraChannelId = self.currPlayer.cameraData[index].sdChannel[i].id;
						break;
					}
				}
			}
			jQuery("#manual").show().find('.alarm-cause .item-box.input').hide().end().find('.alarm-cause .item.selectinput').show().end().find('.other').removeClass('input').html('其他');
			jQuery("#time").val(Toolkit.formatDate(new Date()));
			jQuery("#place").val(self.alarmInfo.alarmPlace);
		},	
		bindEvents:function(){
			var self = this;
			jQuery(document).off("click", "#manual .title i").on("click", "#manual .title i",function() {
				MaskLayer.hide();
				jQuery("#manual").remove();
				jQuery(".manual-iframe").remove();
			});
			// 点击其他
			jQuery(document).off("click", "#manual .other").on("click", "#manual .other", function() {
				var $this = $(this),
					$selectInput = jQuery("#manual").find(".selectinput"),
					$reasonDom = jQuery("#season");
				if ($selectInput.is(".ready-down")) {
					$selectInput.removeClass("ready-down");
					$selectInput.siblings("ul").slideUp();
				}
				if ($this.is(".input")) {
					$this.html("其他").removeClass("input");
					$reasonDom.hide().siblings(".selectinput").show();
					return false;
				}
				$this.addClass("input").html("取消");
				$reasonDom.show().siblings(".selectinput").hide();
			});

			jQuery(document).off("keypress", "#manual #time,#manual #place").on("keypress", "#manual #time,#manual #place", function(event) {
				if (event.keyCode === 13) {
					return false;
				}
			});
			// 手动报警界面-点击确定
			jQuery(document).off("click", "#manual .foot .give").on("click", "#manual .foot .give", function() {
				var $alarmPlace = jQuery("#place"),
					$manualAlarmC = jQuery("#manual"),
					$levelSpan = $manualAlarmC.find(".level .selectinput span"),
					$causeReason = jQuery("#cause");
				if ($levelSpan.text() === "一般") {
					self.alarmInfo.level = 1;
				} else if ($levelSpan.text() === "重要") {
					self.alarmInfo.level = 2;
				} else if ($levelSpan.text() === "严重") {
					self.alarmInfo.level = 3;
				}
				self.alarmInfo.alarmPlace = $alarmPlace.val().trim();
				if(self.alarmInfo.alarmPlace === "") {
					notify.warn("报警地点不能为空，请重新输入");
					return;
				}
				if(self.alarmInfo.alarmPlace.length >= 250) {
					notify.warn("地址太长，请重新输入");
					return;
				}

				if ($manualAlarmC.find(".other").is(".input")) {
					var alarmReason = $causeReason.val().trim();
					if (alarmReason === "") {
						notify.warn("报警原因不能为空，请重新输入");
						return;
					}
					if (alarmReason.length > 100) {
						notify.warn("报警原因输入不能超过100个字符！");
						return;
					}
					self.alarmInfo.alarmReason = $causeReason.val();
				} else {
					self.alarmInfo.alarmReason = $levelSpan.text();
				}
				jQuery.ajax({
					url: "/service/defence/manualAlarm",
					type: "post",
					data: self.alarmInfo,
					dataType: "json",
					success: function(res) {
						if (res.code === 200) {
							$alarmPlace.val("");
							$causeReason.val("");
							if ($manualAlarmC.find(".other").is(".input")) {
								jQuery("#season").hide().siblings(".selectinput").show();
								jQuery(this).removeClass("input");
								$manualAlarmC.find(".other").html("其他");
							}
							MaskLayer.hide();
							$manualAlarmC.remove();
							jQuery(".manual-iframe").remove();
							notify.success("手动报警成功！");
						} else if (res.code === 500) {
							notify.error(res.data.message);
						} else {
							notify.warn("服务器或网络异常！");
						}
					}
				});
			});

			// 手动报警界面-点击下拉框
			jQuery(document).off("click", "#manual .selectinput").on("click", "#manual .selectinput", function() {
				var $this = jQuery(this);
				if ($this.is(".ready-down")) {
					$this.removeClass("ready-down").siblings("ul").slideUp();
					return false;
				}
				$this.addClass("ready-down").siblings("ul").slideDown();
			});
			// 手动报警界面-点击菜单选择li
			jQuery(document).off("click", "#manual ul li").on("click", "#manual ul li", function() {
				var $this = jQuery(this),
					$formItem = $this.closest(".form-item"),
					value = $this.text().trim();
				$formItem.find(".selectinput span").html(value);
				$this.addClass("active").siblings("li").removeClass("active");
				$formItem.find(".selectinput").removeClass("ready-down");
				$formItem.find("ul").slideUp();
			});

		}

	};
	return new manualView();
});