/**
 * 留言板的控制模块
 * @author [Leon.z]
 * @dete [2016.5.6]
 */
define([
	'./global-varibale',
	'./messageModel',
	'./messageView',
	'handlebars',
], function(_g, ajaxModel, msgView) {

	var MessageBord = function() {}
	MessageBord.prototype = {
		compiler: null,
		options: {
			defaultTemplateUrl: "./inc/messageBoardTemplate.html"
		},
		init: function() {
			var self = this;
			msgView.initView();
			msgView._bindEvents(jQuery(".wrapper"));
			self.loadDefaultTemp(function() {
				self.getMessageList({
					sortType: 2
				});
			})
		},
		getMessageList: function(obj) {
			var self = this,
				params = {
					pageSize: 3,
					currentPage: 1,
					sortType: obj.sortType,
					key: obj.key
				},
				listHtml = "";
			ajaxModel.getMessageList("getMessageList", params, {
				beforeSend: function() {
					jQuery(".messageContent").html("<div class='loading'></div>");
				}
			}).then(function(res) {
				if (res.code === 200 && Object.prototype.toString.call(res.data.postInfos.rows) === "[object Array]") {
					listHtml = self.compiler({
						"message": true,
						"messageList": res.data.postInfos.rows
					});
					jQuery(".messageContent").html(listHtml);
					msgView._bindEvents(jQuery(".messageContent"));
					if (res.data.postInfos.rows.length <= 0) {
                        jQuery(".main .pagepart").hide();
                    }
					if(res.data.postInfos.rows.length>0){
						jQuery(".main .pagepart").html(self.compiler({
                            "pagebar": true
                        })).show();
						_g.setPagination(res.data.postInfos.totalCount, ".main .pagination", params.pageSize, params.currentPage - 1, function(nextPage) {
							params.currentPage = nextPage;
							ajaxModel.getMessageList("getMessageList", params, {
								beforeSend: function() {
									jQuery(".messageContent").html("<div class='loading'></div>");
								}
							}).then(function(res) {
								if (res.code === 200 && Object.prototype.toString.call(res.data.postInfos.rows) === "[object Array]") {
									listHtml = self.compiler({
										"message": true,
										"messageList": res.data.postInfos.rows
									});
									jQuery(".messageContent").html(listHtml);
									msgView._bindEvents(jQuery(".messageContent"));
								}
							});
						});
					}
				}
			})
		},
		addMessage: function(obj, callback) {
			ajaxModel.addMessage("addMessage", obj).then(function(res) {
				if (res.code === 200) {
					callback && callback();
				}
			});
		},
		addPoint:function(ID,isAttention,callback){
			if(!ID){
				return;
			}
			ajaxModel.addPoint("addPoint", {
				postId:ID,
				isAttention:isAttention
			}).then(function(res) {
				console.log(res)
				if (res.code === 200) {
					notify.success(res.data.message);
					callback && callback();
					return;
				}
			});
		},
		getReplyList:function(id,node,callback){
			if(!id){
				return;
			}
			var self = this,
			replyHtml = "";
			ajaxModel.getReplyList("getReplyList",id,{
				id:id
			}).then(function(res) {
				if (res.code === 200 &&　Object.prototype.toString.call(res.data.replies) === "[object Array]") {
					replyHtml = self.compiler({
						"replyPanel":true,
						"replyList":res.data.replies
					});
					node.find(".replyPanels").html(replyHtml).addClass("active").show();
					callback && callback(node);
				}
			});
		},
		sendReply:function(id,content,callback){
			if(!id){
				return;
			}
			ajaxModel.sendReply("sendReply", {
				postId: id,
				content:content
			}).then(function(res) {
				console.log(res)
				if (res.code === 200) {
					notify.success("回复成功!");
					callback && callback();
					return;
				}
			});
		},
		/**
		 * [loadDefaultTemp 初始化模板]
		 * @return {[type]} [description]
		 */
		loadDefaultTemp: function(callback) {
			var self = this;
			_g.loadTemplate(self.options.defaultTemplateUrl, function(compiler) {
				self.compiler = compiler;
				_g.messageCompiler = compiler;
				callback && callback();
			});
		},

	}
	return new MessageBord();

});