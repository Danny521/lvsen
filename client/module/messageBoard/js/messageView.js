/**
 * 留言板的view模块
 * @author [Leon.z]
 * @dete [2016.5.6]
 */
define([
	'./global-varibale',
	'jquery.watch',
	'handlebars',
], function(globalVar) {
	var MessageView = function() {}
	MessageView.prototype = {
		msgCtr: null,
		init: function(ctr) {
			var self = this;
			self.msgCtr = ctr;
		},
		initView: function() {
			var self = this;
			self.searchList();
			self.addHelper();
		},
		searchList: function() {
			var self = this;
			//搜索(每0.2s去监听输入框中的内容)
			jQuery(".mysearchInput").watch({
				wait: 200,
				captureLength: 0,
				callback: function(key) {
					var sortTypes = jQuery(".boardHeader").find(".nomalTitle.active").data("type") === "timer" ? 1 : 2;
					self.msgCtr.getMessageList({
						sortType: sortTypes,
						key: key
					});
				}
			});
		},
		clearSendPanel: function() {
			var self = this;
			jQuery(".messageDialog").find(".myTitle").val("");
			jQuery(".messageDialog").find(".mytextarea").val("");
		},
		_eventHandler: function() {
			var self = this;
			return {
				"sortList": function(e) {
					e.stopPropagation();
					var type = jQuery(this).data("type"),
						key = jQuery(".mysearchInput").val(),
						sortType = "";
					sortType = type === "timer" ? 1 : 2;
					jQuery(this).addClass('active').siblings('span').removeClass('active');

					self.msgCtr.getMessageList({
						sortType: sortType,
						key: key
					})
				},
				"getReplyList": function(e) {
					e.stopPropagation();
					var id = jQuery(this).data("id"),
						currLe = jQuery(this).find(".replyPanels div").length;
					if (currLe > 0) {
						if (jQuery(this).find(".replyPanels").hasClass("active")) {
							jQuery(this).find(".replyPanels").removeClass("active").hide();
							jQuery(this).siblings().find(".replyPanels").removeClass("active").hide();
						} else {
							jQuery(this).find(".replyPanels").addClass("active").show();
							jQuery(this).siblings().find(".replyPanels").removeClass("active").hide();
						}
					} else {
						self.msgCtr.getReplyList(id, jQuery(this), function(node) {
							node.siblings().find(".replyPanels").removeClass("active").hide();
						});
					}

				},
				"NewMessagePanel": function(e) {
					e.stopPropagation();
					//隐藏导航
            		window.top.showHideNav("hide");
					jQuery("#commonLayer").fadeIn(200, function() {
						jQuery(".messageDialog").show();
						self.clearSendPanel();
					})
				},
				"closeMsgDialog": function(e) {
					e.stopPropagation();
					window.top.showHideNav("show");
					jQuery("#commonLayer").fadeOut(100, function() {
						jQuery(".messageDialog").hide();
					})
				},
				"sendMessage": function(e) {
					e.stopPropagation();
					var node = jQuery(this).closest('.messageDialog'),
						params = {
							"title": node.find(".myTitle").val(),
							"content": node.find(".mytextarea").val()
						};
					if (!self.checkSendData(params, true)) {
						return;
					}
					self.msgCtr.addMessage(params, function() {
						window.top.showHideNav("show");
						jQuery("#commonLayer").fadeOut(100, function() {
							jQuery(".messageDialog").hide();
						});
						jQuery(".boardHeader").find(".nomalTitle[data-type='timer']").trigger("click");

					})
				},
				"clearSendPanel": function(e) {
					e.stopPropagation();
					self.clearSendPanel();
				},
				"replyMessage": function(e) {
					e.stopPropagation();
					var node = jQuery(this);
					self.showReplyPanel(node);
				},
				"addPoint": function(e) {
					e.stopPropagation();
					var node = jQuery(this),
					currCount = node.closest('.messageItem').find(".count").text();
					node.toggleClass('active');

					var currId = node.closest('.messageItem').data("id"),
						isAttention = node.hasClass('active') ? true : false;
					self.msgCtr.addPoint(currId, isAttention, function() {
						console.log(isAttention,currCount)
						if(isAttention){
							currCount++;
						}else{
							currCount--;
						}
						node.closest('.messageItem').find(".count").text(currCount);
						//jQuery(".boardHeader").find(".nomalTitle[data-type='counts']").trigger("click");
					});
				},
				"sendReply": function(e) {
					e.stopPropagation();
					var node = jQuery(this),
						id = node.closest('.messageItem').data("id"),
						content = node.closest('.replyPanel').find(".replyTextarea").val(),
						params = {
							content: content
						};
					if (!self.checkSendData(params, false)) {
						return;
					}
					self.msgCtr.sendReply(id, content, function() {
						node.closest('.messageItem').find(".messageReply").removeClass("active");
						node.closest('.messageItem').find(".replyPanel").hide(0);
						node.closest('.messageItem').find(".icon_arrow").hide(0);
						self.msgCtr.getReplyList(id, node.closest('.messageItem'), function(node) {
							node.siblings().find(".replyPanels").removeClass("active").hide();
						});
					})

				},
				"cancelReply": function(e) {
					e.stopPropagation();
					var node = jQuery(this);
					node.closest('.messageItem').find(".messageReply").removeClass("active");
					node.closest('.messageItem').find(".replyPanel").hide(0);
					node.closest('.messageItem').find(".icon_arrow").hide(0);
				},
				"stopPro": function(e) {
					e.stopPropagation();
					e.preventDefault();
				}
			}
		},
		showReplyPanel: function(node) {
			if (!node.hasClass('active')) {
				node.addClass("active");
				node.closest('.messageItem').find(".replyTextarea").val("");
				node.closest('.messageItem').find(".replyPanel").show(0);
				node.closest('.messageItem').find(".icon_arrow").show(0);
			} else {
				node.removeClass("active");
				node.closest('.messageItem').find(".replyPanel").hide(0);
				node.closest('.messageItem').find(".icon_arrow").hide(0);
			}
		},
		checkSendData: function(data, flag) {
			if (!data) {
				return;
			}
			if (data.title && data.title === "") {
				notify.warn("帖子主题不能为空！");
				return false;
			}
			if (data.content === "") {
				if (!flag) {
					notify.warn("回复内容不能为空！");
					return false;
				}
				notify.warn("帖子内容不能为空！");
				return false;
			}
			if (data.title && data.title.length > 60) {
				notify.warn("帖子主题最多为60个字！");
				return false;
			}
			if (data.content !== "" && data.content.length > 180) {
				notify.warn("内容最多可输入180个字！");
				return false;
			}
			return true;
		},
		addHelper: function() {
			Handlebars.registerHelper('toStingsData', function(time) {
				if (time) {
					return Toolkit.mills2datetime(time);
				}
				return "";
			});
			Handlebars.registerHelper('isPointActive', function(flag) {
				if (flag) {
					return "active";
				}
				return "";
			});
		},
		/**
		 * 绑定事件
		 * @param selector - 选择器，为适应动态绑定
		 * @private
		 */
		_bindEvents: function(selector) {
			var self = this,
				handler = self._eventHandler();
			$(selector).find("[data-handler]").map(function() {
				$(this).off($(this).data("event")).on($(this).data("event"), handler[$(this).data("handler")]);
			});
		}

	}
	return new MessageView();

})