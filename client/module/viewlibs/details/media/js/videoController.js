/*global Mplayer:true, permission:true*/
define([
	'panel',
	'/module/viewlibs/details/media/js/videoModel.js',
	'/module/viewlibs/details/media/js/videoView.js',
    'base.self',
	'permission'], function(BlankPanel,VideoModel,VideoView) {
		function bindEvents(initParams) {
			var self = this;
			self.incidentInfo = VideoView.incidentInfo;
			self.skipNum = 0;
			params = VideoView.params;
			// 选项卡切换
			VideoView.switchTab(params);

			//操作区 编辑 删除 保存
			jQuery(document).on('click', '.operate .edit', function() {
				var incidentid = jQuery('#incidentId').attr('data-incidentid'); //详情页的incidentId
				var paramslist = window.location.href.split('?')[1];
				if(incidentid && !paramslist.test('&incidentid=')){
					paramslist = paramslist+'&incidentid=' + incidentid;
				}
				window.location.href = "/module/viewlibs/details/media/update_video.html?"+paramslist;

			});

			//删除
			jQuery(document).on('click', '.operate .delete', function() {
				var videoName = jQuery(this).data("videoname");
				var messageStr = '<div class="dialog-messsage"><h4>您确定要删除"' + videoName + '"视频吗？</h4>同时将删除此视频生成的结构化信息/线索';
				new ConfirmDialog({
					title: '警告',
					warn: true,
					message: messageStr,
					callback: function() {
						VideoModel.deleteVinfo(params.id,function(res){
							notify.success("删除成功！", {
								timeout: 500
							});
							var str = !self.incidentInfo.name ? '' : (self.incidentInfo.name + '案事件的');
							var name = jQuery('#content .wrapper div.header div.title > span').text();
							logDict.insertMedialog('m4', '删除 ' + str + name + ' 视频' + '表单', "", "o3");

							if (!self.incidentInfo.name) {
								window.location.href = "/module/viewlibs/" + params.pagetype + "/index.html";
							} else {
								if (params.pagetype === 'workbench') {
									window.location.href = '/module/viewlibs/workbench/index.html';
								} else if (params.pagetype === 'caselib') {
									window.location.href = '/module/viewlibs/caselib/index.html';
								}
							}
						});
					}
				});
			});

			//保存到云端
			jQuery(document).on('click', '.operate .save-to-clound', function() {
				var url = '/service/pvd/pvd_videoimage_pcm';
				if (!this.isAssociated) {
					url = "/service/pvd/videoimage_pcm";
				}
				jQuery.ajax({
					url:url + "/" + jQuery(this).attr("data-id"),
					data: {
						fileType: 1
				    },
					type:'POST',
					async:false,
					beforeSend:function(){
						jQuery(".operate .save-to-clound span").addClass("disable");
						jQuery(".operate .save-to-clound").prop("disabled", true);
					},
					success:function(res){
						if (res.code === 200) {
							jQuery(".operate .save-to-clound span").addClass("disable");
							jQuery(".operate .save-to-clound").prop("disabled", true);
							jQuery(".operate .save-to-clound span").html("已保存");
							notify.info("保存到云端成功");
							// 记录日志
							var msg = "";
							if (params.incidentId && params.incidentId && params.incidentId !== "") {
								msg = "保存“" + Toolkit.paramOfUrl().incidentname + "”案事件的“" + params.mediaName + "”视频";
							} else {
								msg = "保存“" + params.mediaName + "”视频";
							}

							logDict.insertMedialog('m4', msg);
						} else {
							notify.warn("保存到云端失败");
						}
					},
					error:function(){
						notify.warn('网络异常');
					}
				});
			});

			//保存
			jQuery(document).on('click', '.submit-wrapper .input-submit', function() {
				var formdata = VideoView.serializeForm(jQuery("#form").serializeArray());
				var p = jQuery("#province").children("option:selected").val() !== "" ? jQuery("#province").children("option:selected").text() : "";
				var c = jQuery("#city").children("option:selected").val() !== "" ? jQuery("#city").children("option:selected").text() : "";
				var a = jQuery("#country").children("option:selected").val() !== "" ? jQuery("#country").children("option:selected").text() : "";
				var s = jQuery("#streets").val().trim() !== "" ? jQuery("#streets").val().trim() : "";

				formdata = Object.merge({}, formdata, {
					id: params.id,
					fileType: '1',
					incidentId: params.incidentId,
					remark: setRemark.getText(jQuery('#form')),
					location: p + " " + c + " " + a + " " + s
				});

				if (jQuery("#form").valid() && jQuery("#form").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
					VideoModel.updateVinfo(formdata, function(data){
						if (data && data.code === 200) {
							notify.success("保存成功！");

							// 视频编辑日志 由于视频编辑后保存接口异常，待测试
							var name = formdata.name,
								type = (parseInt(formdata.fileType, 10) === 2 ? '图片' : '视频'),
								str = self.incidentInfo.name ? (self.incidentInfo.name + '案事件的') : '';
							logDict.insertMedialog('m4', '编辑 ' + str + name + ' ' + type + '表单', "", "o2");
							window.location.href = "/module/viewlibs/details/media/video.html?id=" + params.id + "&fileType=1" + "&pagetype=" + params.pagetype;
						}else {
							notify.warn("请正确填写相关信息！");
						}
					});
				}
			});

			//取消
			jQuery(document).on('click', ".submit-wrapper .input-cancel", function() {
				window.location.href = "/module/viewlibs/details/media/video.html?id=" + params.id + "&fileType=1" + "&pagetype=" + params.pagetype;
			});

			//跳到到人工标注
			jQuery(document).on('click', '.entity-preview .editing', function() {
				VideoView.makeValueToLib(jQuery(this));
				var videoId = jQuery('.media .video').attr('data-fileid');
				var name = jQuery('.media .video').attr('data-videoname');
				var filepath = jQuery('.media .video').attr('data-path');
				var passData = {
					pid: videoId, //视图库中此图片的id
					fileName: name,
					filePath: filepath.split("#")[1],
					// filePath: filepath,//加密后的没有办法分割，所以全部传过去  mayue 2015.05.25
					fileType: "1",
					localPath: jQuery('.media .video').attr('data-localpath'),
					source: 'viewlib',
					shootTime: jQuery('.media .video').data('shoottime')
				};
				Cookie.write('imagejudgeData', JSON.stringify(passData));
				// debugger
				window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"imagejudge/resource-process/index.html?type=2", "singleAnalyze"+(++self.skipNum));
				return false;
			});
			//跳到到智能标注
			jQuery(document).on('click', '.entity-preview .smartmark', function() {
				VideoView.makeValueToLib(jQuery(this));
				var videoId = jQuery('.media .video').attr('data-fileid');
				var name = jQuery('.media .video').attr('data-videoname');
				var filepath = jQuery('.media .video').attr('data-path');
				var passData = {
					pid: videoId, //视图库中此图片的id
					fileName: name,
					filePath: filepath.split("#")[1],
					// filePath: filepath,//加密后的没有办法分割，所以全部传过去  mayue 2015.05.25
					fileType: "1",
					localPath: jQuery('.media .video').attr('data-localpath'),
					source: 'viewlib',
					shootTime: jQuery('.media .video').data('shoottime')
				};
				Cookie.write('imagejudgeData', JSON.stringify(passData));
				window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"imagejudge/resource-process/index.html?&type=3", "singleAnalyze"+(++self.skipNum));
				return false;
			});

			// 线索、结构化信息跳转
			jQuery(document).on('click', "#videoClue", function() {
				if (parseInt(jQuery(this).find('i').html(), 10) === 0) {
					return false;
				}

				var incidentid = jQuery('#incidentId').attr('data-incidentid');
				var fileid = jQuery('.main .media > .video').data('fileid');
				var filename = jQuery('.main .media > .video').data('videoname');
				if (!incidentid) {
					//如果是人员信息库和车辆信息库，则跳转到疑情信息库
					var curpagetype = params.pagetype;
					if(curpagetype === 'peoplelib' || curpagetype === 'carlib' ){
						curpagetype = 'doubtlib';
					}
					jQuery(this).attr('href', "/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/workbench/index.html?fileid=" + fileid + "&filename=" + filename + "&filetype=1" + "&home=" + curpagetype + "&pagetype=structlist" + "&orgid=" + params.orgid);
				} else {
					var curpagetype = params.pagetype;
					if(curpagetype === 'peoplelib' || curpagetype === 'carlib' ){
						curpagetype = 'caselib';
					}
					jQuery(this).attr('href', "/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/workbench/index.html?incidentid=" + incidentid + "&fileid=" + fileid + "&filename=" + filename + "&filetype=1" + "&home=" + curpagetype + "&pagetype=traillist" + '&orgid=' + params.orgid + '&incidentname=' + params.incidentName + "&clue=2");
				}
			});

			jQuery("#videoClue").on('mouseover', function() {
				if (parseInt(jQuery(this).find('i').html(), 10) === 0) {
					jQuery(this).css({
						'text-decoration': 'none',
						'cursor': 'default'
					});
				}
			});
			//摘要显示页面
			jQuery(document).off('click', '#checkSummary').on('click',"#checkSummary",function(event){
				//阻止事件冒泡
				event.preventDefault();
				event.stopImmediatePropagation();
				//修改视频摘要下名称
				jQuery('.c-header .s-name').html();
				window.summaryPanel.open();
				jQuery(".droppanel-mask i").removeClass("hidden");
			});



			//切换到剪切视频摘要
			jQuery(document).off('click', '#videosumy').on('click',"#videosumy",function(){
				jQuery(this).addClass("active");
				jQuery("#videoid").removeClass("active");
				jQuery("#videosumyAdd").removeClass("active");
				jQuery("#videoOldId").css("left",'-9999px');
				jQuery("#videoSumyAddId").css("left",'-9999px');
				jQuery("#videoSumyId").css('left','0px');
				jQuery(".seletediv").show();

			});

			//切换到叠加视频摘要
			jQuery(document).off('click', '#videosumyAdd').on('click',"#videosumyAdd",function(){
				jQuery(this).addClass("active");
				jQuery(".seletediv").hide();
				jQuery("#videoid").removeClass("active");
				jQuery("#videosumy").removeClass("active");
				jQuery("#videoOldId").css("left",'-9999px');
				jQuery("#videoSumyId").css("left",'-9999px');
				jQuery("#videoSumyAddId").css('left','0px');
			});

			jQuery(document).off('click', '#videoid').on('click',"#videoid",function(event){
				jQuery(".seletediv").hide();
				jQuery(this).addClass("active");
				jQuery("#videosumyAdd").removeClass("active");
				jQuery("#videosumy").removeClass("active");
				jQuery("#videoSumyId").css("left",'-9999px');
				jQuery("#videoSumyAddId").css("left",'-9999px');
				jQuery("#videoOldId").css('left','0px');
			});

			// 打回案事件
			jQuery(document).on('click', '#reject', function() {
				var incidentId = jQuery(this).data('caseid');
				new ConfirmDialog({
					classes: 'incident reject',
					title: '提示',
					confirmText: '打回',
					message: '<textarea class="audit-info" placeholder="经审核不合格，打回修改！"></textarea><br/><span class="count">0</span>/<span class="total">250</span>',
					callback: function() {
						VideoModel.verifyIncident(incidentId, 3); // 3代表打回
					}
				});
			});
			//审核信息字数统计
			jQuery(document).on('keyup', '.common-dialog.incident section > textarea', function(){
				var text = jQuery(this).val(),
				len = text.length;

				if(len > 250){
					jQuery(this).val(text.substring(0, 249));
					notify.info('超过250个字符，请重新输入！');
					return;
				}
				jQuery('.common-dialog.incident section > .count').text(len);

			});
		}
		return {bindEvents:bindEvents};
	}
);
