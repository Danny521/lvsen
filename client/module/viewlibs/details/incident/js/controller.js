define([
	'/module/viewlibs/details/incident/js/model.js',
	'/module/viewlibs/details/incident/js/view.js',
	'/module/viewlibs/common/panel_import.js',
	'broadcast',
	'/module/viewlibs/common/js/uploadIcp.js'
], function(IncidentModel, IncidentView, panelImport, BroadCast, uploadDialog) {
	// 案事件详情页事件绑定
	var bindEvents = function(initParams) {
		IncidentView.initialize(initParams);
		var params = IncidentView.params;
		if (!params.incidentname) {
			params.incidentname = jQuery('#incidentName').data("incidentname");
		}
		// 审核
		jQuery(document).on('click', '.right-main > p a', function() {
			var type = jQuery(this).data('type');
			var el = jQuery(this);
			// 组织id
			var orgId = Toolkit.paramOfUrl().orgid;

			switch (type) {
				case 0:
					var name = jQuery('#incidentName').data("incidentname");
					new ConfirmDialog({
						title: '提示',
						message: '<h3>您确认要删除"' + name + '"案事件吗？</h3>同时将删除此案事件包含的视频、图片、线索',
						callback: function() {
							IncidentModel.deleteIncident(params.id);
						}
					});
					break;
				case 1:
					new ConfirmDialog({
						title: '提示',
						message: '<h3>任务分发 TODO？</h3>',
						callback: function() {
							IncidentModel.verifyIncident(params.id, type);
						}
					});
					break;
				case 2:
					new ConfirmDialog({
						title: '提示',
						message: '<h3>您确认要提交审核吗？</h3>',
						callback: function() {
							IncidentModel.verifyIncident(params.id, type);
						}
					});
					break;
				case 3:
					new ConfirmDialog({
						classes: 'incident reject',
						title: '提示',
						confirmText: '打回',
						message: '<textarea class="audit-info" placeholder="经审核不合格，打回修改！"></textarea><br/><span class="count">0</span>/<span class="total">250</span>',
						callback: function() {
							IncidentModel.verifyIncident(params.id, type);
						}
					});
					break;
				case 4:
					new ConfirmDialog({
						classes: 'incident',
						title: '审核案事件',
						confirmText: '通过',
						message: '<textarea class="audit-info" placeholder="经审核合格，审核通过！"></textarea><br/><span class="count">0</span>/<span class="total">250</span>',
						callback: function() {
							IncidentModel.verifyIncident(params.id, type);
						}
					});
					break;
				case 5:
					IncidentView.saveToClound(params.id, el)
					break;
				case 8:
					new ConfirmDialog({
						title: '提示',
						message: '<h3>您确认要上传吗？</h3>',
						callback: function() {
							IncidentModel.pushIncident({
								id: params.id,
								orgId: orgId
							}, el);
						}
					});
					break;
				case 9:
					new ConfirmDialog({
						title: '提示',
						message: '<h3>您确认要同步吗？</h3>',
						callback: function() {
							IncidentModel.pullIncident({
								id: params.id,
								orgId: orgId
							}, el);
						}
					});
					break;
				case 10:
					new ConfirmDialog({
						title: '提示',
						message: '<h3>您确认要取回该案事件么？</h3>',
						callback: function() {
							IncidentModel.recaptionInc(params.id);
						}
					});
					break;
				case 11: //上传ICP
					new ConfirmDialog({
						title: '提示',
						message: '<h3>您确认要上传ICP吗？</h3>',
						callback: function() {
							setTimeout(function() {
								new uploadDialog({
									uploadData: {
										ids: "'" + params.id + "'"
									},
									callback: function() {
										el
											.text("已上传ICP")
											.removeClass("uploadIcp")
											.data("type", "")
											.addClass("disable");
									}
								});
							}, 100);
						}
					});
					break;
				default:
					break;
			}
			return false;
		});

		// 视频、图片选项卡切换
		jQuery(document).on('click', '.tabs li', function() {
			var tab = jQuery(this).data('tab');
			jQuery(this).addClass('active').siblings().removeClass('active');
			jQuery('.views [data-view="' + tab + '"]').addClass('active').siblings().removeClass('active');
		});

		// 案事件编辑
		jQuery(document).on('click', '.left-main p.edit > a', function() {
			jQuery(this).attr('href', '/module/viewlibs/workbench/update_incident.html?id=' + params.id);
		});

		// 点击封面查看大图
		jQuery(document).on('click', '#caseCover a img', function() {
			return false;
		});

		// 导入视图
		jQuery(document).on('click', '#importMedia', function() {
			var name = jQuery('#incidentName').data("incidentname"),
				data = {};
			data.id = IncidentView.params.id;
			data.incidentname = name;
			data.pagetype = IncidentView.params.pagetype;
			data.orgid = IncidentView.params.orgid;
			Cookie.write('importincdata', JSON.stringify(data));
			BroadCast.on("reload", function() {
				location.reload();
			});
			panelImport.open();
		});

		// 跳转到视频详情
		jQuery(document).on('click', '.videos ul li p a, .videos ul li .box', function() {
			var id = jQuery(this).parents('li').data('id'),
				name = jQuery('#incidentName').data("incidentname");
			window.location.href = '/module/viewlibs/details/media/video.html?fileType=1&id=' + id + '&incidentname=' + name + '&pagetype=' + params.pagetype + '&orgid=' + params.orgid;
		});

		// 跳转到图片详情
		jQuery(document).on('click', '.pictures ul li p a, .pictures ul li .box', function() {
			var id = jQuery(this).parents('li').data('id');
			window.location.href = '/module/viewlibs/details/media/picture.html?fileType=2&id=' + id + '&incidentname=' + params.incidentname + '&pagetype=' + params.pagetype + '&orgid=' + params.orgid;
		});
		// 跳转到线索页
		jQuery(document).on('click', '[data-view="thread"] ul li p a, [data-view="thread"] ul li .box', function() {
			var id = jQuery(this).parents('li').data('id');
			var name = jQuery(this).parents('li').data('name');
			if (name == "rest") {
				name = "others";
			} else if (name == "moving") {
				name = "move";
			}
			window.location.href = '/module/viewlibs/details/struct/' + name + '.html?origntype=' + name + '&id=' + id + '&incidentname=' + params.incidentname + '&pagetype=' + params.pagetype + '&orgid=' + params.orgid;
		});

		// 跳转到结构化信息（结构化信息条数）
		jQuery(document).on('click', '.clue', function() {
			if (parseInt(jQuery(this).find('i').html(), 10) === 0) {
				return false;
			}
			jQuery(this).attr('href', "/module/viewlibs/workbench/index.html?incidentid=" + params.id + "&incidentname=" + params.incidentname + "&home=" + params.pagetype + "&pagetype=traillist" + "&orgid=" + params.orgid + "&clue=2");
		});

		//鼠标滑过线索/结构化信息的展示效果
		jQuery(document).on('mouseover', '.clue', function() {
			if (parseInt(jQuery(this).find('i').html(), 10) === 0) {
				jQuery(this).css({
					'text-decoration': 'none',
					'cursor': 'default'
				});
			}
		});

		// 对二级评论的回复
		jQuery(document).on('click', '.core-reply > ul > li > .core > div > .reply', function() {
			var that = jQuery(this);
			var toUser = jQuery(this).closest('.wrap').siblings('span.user').text();
			//判断评论不能为空
			var toUserStr = toUser.replace(/\s/g, "");
			if (toUser.length == 0 || toUserStr.length == 0) {
				jQuery(this).closest('.wrap').siblings('span.user').val("");
				notify.info('输入内容不能为空或空格，请重新输入！');
				return;
			}
			//判断评论字数不能超过500
			if (toUser.length > 500) {
				jQuery(this).closest('.wrap').siblings('span.user').val(toUser.substring(0, 499));
				notify.info('超过500个字符，请重新输入！');
				return;
			}
			jQuery(this).closest('.core-reply').find('textarea').focus().val('回复' + toUser.trim() + ' : ');
			//jQuery(this).closest('.core-reply').find('textarea').focus().attr("placeholder",'回复' + toUser + '...');
			var commentid = that.closest('li').data('commentid');
			that.closest('.core-reply').find('.wrap-send input.send').data('parent', commentid);
		});

		// 对主评论的回复展开
		jQuery(document).on('click', '#notes > .views .comment > ul > li > div.core > div.wrap > span.reply', function() {
			var that = jQuery(this);
			var commentid = that.closest('li').data('commentid');
			if (!that.hasClass('active')) {
				that.data('count', that.find('i').text());
				that.text('收起');
				// 请求模板
				jQuery.get('/module/viewlibs/caselib/inc/tpl_reply.html', function(source) {
					var template = Handlebars.compile(source);
					IncidentModel.getReplyList(params.id, commentid, function(res) {
						if (res.code === 200) {
							var data = res.data;

							that.closest('div.core').next('.core-reply').find('ul').html(template(data));
							that.closest('div.core').next('.core-reply').stop(10).slideToggle('normal');
						} else {
							notify.error('获取回复列表失败');
						}
					});
				});
			} else {
				that.html('回复(<i>' + that.data('count') + '</i>)');
				that.closest('div.core').next('.core-reply').stop(10).slideToggle('normal');
			}
			that.toggleClass('active');
		});

		// 发表回复 点击“回复发表”按钮
		jQuery(document).on('click', '#notes > .views .comment > ul > li > .core-reply input', function() {
			var that = jQuery(this),
				indirect = jQuery(this).closest('li').data('commentid'),
				content = jQuery(this).siblings('textarea').val();
			var contentStr = content.replace(/\s/g, "");
			if (content.length == 0 || contentStr.length == 0) {
				jQuery(this).siblings('textarea').val("");
				notify.info('输入内容不能为空或空格，请重新输入！');
				return;
			}
			//判断评论字数不能超过500
			if (content.length > 500) {
				jQuery(this).siblings('textarea').val(content.substring(0, 499));
				notify.info('超过500个字符，请重新输入！');
				return;
			}
			var parent = that.data('parent') || indirect,
				$user = jQuery('#userEntry'),
				data = {
					userId: $user.data('userid'),
					incidentId: params.id,
					parent: parent,
					content: content,
					storageTime: '',
					userName: $user.text(),
					indirect: indirect
				};

			IncidentModel.saveCommentReply(data, function(res) {
				// 往dom中增加元素
				IncidentModel.getReplyList(data.incidentId, data.parent, function(result) {
					data = result.data.comments[result.data.comments.length - 1];
					jQuery('#notes > .views .comment > ul > li > div.core > div.wrap > span.reply').data('count', result.data.comments.length);
					var node = jQuery("<li><div class='core'><span class='user'>" + data.userName + "</span><span>:</span><span>" + data.content + "</span><div class='clearfix wrap'><span class='reply'>回复</span><span class='time'>" + Toolkit.mills2datetime(data.storageTime) + "</span></div></div></li>");
					that.closest('.core-reply').find('ul').append(node);
					that.siblings('textarea').val('');
					var msg = jQuery('#incidentName').data("incidentname") + "案事件发表评论";
					logDict.insertMedialog('m4', msg);

				});
			});
		});

		// tab上的'我要评论'按钮
		jQuery(document).off('click', '#toComment').on('click', '#toComment', function(e) {
			jQuery('.views .comment-form').toggleClass('active');
			jQuery('#commentContent').focus();
			jQuery('#notes .tabs > li:first').trigger('click');
		});

		// 发表主评论
		jQuery(document).off('click', '#saveComment').on('click', '#saveComment', function() {
			var $user = jQuery('#userEntry'),
				val = jQuery('#commentContent').val(),
				data = {
					userId: $user.data('userid'),
					incidentId: params.id,
					parent: 0,
					content: val,
					indirect: 0,
					userName: $user.text(),
					storageTime: ''
				};
			if (val === '') {
				notify.warn('请输入评论信息');
				return;
			}

			var valStr = val.replace(/\s/g, "");
			if (val.length == 0 || valStr.length == 0) {
				jQuery('#commentContent').val("");
				notify.info('输入内容不能为空或空格，请重新输入！');
				return;
			}
			//判断评论字数不能超过500
			if (val.length > 500) {
				jQuery('#commentContent').val(val.substring(0, 499));
				notify.info('超过500个字符，请重新输入！');
				return;
			}
			IncidentModel.saveIncidentComment(data, function(res) {
				// var node;
				if (res.code === 200) {
					IncidentView.showComments();
					var msg = jQuery('#incidentName').data("incidentname") + "案事件发表评论";
					logDict.insertMedialog('m4', msg);
					jQuery('#commentContent').val(''); // 将内容清空
					jQuery('#notes > .views .comment .comment-form').removeClass('active'); // 将输入框隐藏
					notify.success('发表评论成功');
				} else {
					notify.error('发表评论失败！');
				}
			});
		});


		//审核信息字数统计
		jQuery(document).on('keyup', '.common-dialog.incident section > textarea', function() {
			var text = jQuery(this).val(),
				len = text.length;

			if (len > 250) {
				jQuery(this).val(text.substring(0, 249));
				notify.info('超过250个字符，请重新输入！');
				return;
			}
			jQuery('.common-dialog.incident section > .count').text(len);

		});
	};
	return {
		bindEvents: bindEvents
	};
});