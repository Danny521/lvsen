/**
 * [ImgInfo 图片详情信息类]
 * @author limengmeng
 * @date   2014-10-31
 */
define([
	'/module/viewlibs/details/media/js/picModel.js',
	'/module/viewlibs/details/media/js/picView.js'
], function(ImgModel, ImgView) {
		function bindEvents(initParams) {
			var self = this;
			self.params = ImgView.params;
			self.skipNum = 0;
			// 选项卡切换
			jQuery(document).on('click', '.tabs li', function() {
				var tab = jQuery(this).data('tab');
				jQuery(this).addClass('active').siblings().removeClass('active');
				jQuery('.views [data-view="' + tab + '"]').addClass('active').siblings().removeClass('active');
			});

			// 人工标注
			jQuery(document).on('click', '#manualMark', function() {
				var id = jQuery(this).data('imgid'), // 国标编码
					parentid = jQuery('.sourceid').data('sourceid'),
					path = jQuery('.main .media.picture > div > img').attr('src'),
					incidentid = jQuery(this).data('caseid') === "暂未填写" ? null : jQuery(this).data('caseid'),
					shootTime = jQuery(this).data('shoottime');
				shootTime = shootTime ? Toolkit.str2mills(shootTime) : 0;
				var incidentname = self.params.casename ? self.params.casename : null;
				var data = {
					id: id,
					sourceId: self.params.id, //图片id,非国标
					pvdSourceId: self.params.id, //跳转到视图分析区分是否在视图库中
					fileType: "2",
					name: self.params.filename,
					parentid: parentid,
					path: path,
					incidentId: incidentid,
					shootTime: shootTime,
					incidentname: incidentname
				};
				Cookie.write("import", JSON.stringify(data));
				var dataDom = jQuery("#imgHandle");
				id = dataDom.data('id'),
					name = dataDom.data('name'),
					filepath = dataDom.data('filepath'),
					filetype = dataDom.data('filetype'),
					localpath = dataDom.data('localpath');
				var passData = {
					pid: id, //视图库中此图片的id
					fileName: name,
					filePath: filepath,
					fileType: "2",
					localPath: localpath,
					source: 'viewlib',
					imageId: dataDom.data('imgid'),
					incidentId: dataDom.data('incidentid') === "暂未填写" ? null : dataDom.data('incidentid'),
					incidentname: self.params.casename ? self.params.casename : null,
					shootTime: dataDom.data('shoottime'),
					notSave: jQuery('.save-to-clound').length === 1 ? true : false //在图片详情页没有保存过云端
				};
				Cookie.write('imagejudgeData', JSON.stringify(passData));
				window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"imagejudge/resource-process/index.html?type=2", "singleAnalyze"+(++self.skipNum));
				return false;
			});

			// 线索\结构化信息跳转
			jQuery(document).on('click', '.header .body .title .clue', function() {
				if (parseInt(jQuery(this).find('i').html(), 10) === 0) {
					return false;
				}
				var incidentid = jQuery(this).data('caseid');
				var fileid = jQuery(this).data('fileid');
				var filename = jQuery(this).data('filename');
				if (incidentid === '暂未填写') {
					// 结构化信息
					//如果是人员信息库和车辆信息库，则跳转到疑情信息库
					var curpagetype = self.params.pagetype;
					if(curpagetype === 'peoplelib' || curpagetype === 'carlib' ){
						curpagetype = 'doubtlib';
					}
					jQuery(this).attr('href', "/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/workbench/?fileid=" + fileid + "&filename=" + filename + "&filetype=2" + "&home=" + curpagetype + "&pagetype=structlist" + "&orgid=" + self.params.orgid);
				} else {
					// 线索
					var curpagetype = self.params.pagetype;
					if(curpagetype === 'peoplelib' || curpagetype === 'carlib' ){
						curpagetype = 'caselib';
					}
					jQuery(this).attr('href', "/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/workbench/?incidentid=" + incidentid + "&fileid=" + fileid + "&filename=" + filename + "&filetype=2" + "&home=" + curpagetype + "&pagetype=traillist" + '&orgid=' + self.params.orgid + '&incidentname=' + self.params.casename + "&clue=2");
				}
			});

			// 跳转到图片编辑
			jQuery(document).on('click', '.operate .edit', function() {
				var paramslist = window.location.href.split('?')[1];
				jQuery(this).attr('href', "/module/viewlibs/details/media/update_picture.html?"+paramslist);
			});

			// 删除图片
			jQuery(document).on('click', '.operate .delete', function() {
				var id = jQuery(this).data('id');
				var name = jQuery(this).data('filename');
				var messageStr = '<h3>您确定要删除"' + name + '"图片吗？</h3>同时将删除此图片生成的结构化信息/线索';
				new ConfirmDialog({
					title: '提示',
					message: messageStr,
					callback: function() {
						ImgModel.deleteMedia(2, id);
					}
				});
				return false;
			});

			// 保存到云端
			jQuery(document).on('click', '.operate .save-to-clound', function() {
				var url = '/service/pvd/pvd_videoimage_pcm';
				if (!this.isAssociated) {
					url = "/service/pvd/videoimage_pcm";
				}
				jQuery.ajax({
					url:url + "/" + jQuery(this).attr("data-id"),
					data: {
						fileType: 2
				    },
					type:'POST',
					async:false,
					beforeSend:function(){
						jQuery(".operate .save-to-clound span").addClass("disable");
						jQuery(".operate .save-to-clound").prop("disabled", true);
						jQuery(".operate .save-to-clound span").html("已保存");
					},
					success:function(res){
						if (res.code === 200) {
							jQuery(".operate .save-to-clound span").addClass("disable");
							jQuery(".operate .save-to-clound").prop("disabled", true);
							notify.info("保存到云端成功");

							// 记录日志
							var msg = "";
							if (self.params.incidentId && self.params.incidentId !== "暂未填写" && self.params.incidentId !== "") {
								msg = "保存“" + Toolkit.paramOfUrl().incidentname + "”案事件的“" + self.params.mediaName + "”图片";
							} else {
								msg = "保存“" + self.params.mediaName + "”图片";
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

			// 点击所属案事件表单中的名称进行跳转
			jQuery(document).on('click', 'table.common-table td a.incident-name', function() {
				var caseid = jQuery('#manualMark').data('caseid');
				jQuery(this).attr("href", "/module/viewlibs/details/incident/incident_detail.html?id=" + caseid + "&pagetype=" + self.params.pagetype + '&incidentname=' + self.params.casename + '&orgid=' + self.params.orgid);
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
				window.location.href = '/module/viewlibs/details/struct/' + name + '.html?origntype=' + name + '&id=' + id + '&incidentname=' + self.params.casename + '&pagetype=traillist&orgid=' + self.params.orgid;
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
						ImgModel.verifyIncident(incidentId, 3); // 3代表打回
					}
				});
			});

			// 点击跳转到图像研判的图像处理模块
			// TODO
			jQuery(document).on('click', '#imgHandle', function(event) {
				var that = jQuery(this),
					id = that.data('id'),
					name = that.data('name'),
					filepath = that.data('filepath'),
					filetype = that.data('filetype'),
					localpath = that.data('localpath');

				var passData = {
					pid: id, //视图库中此图片的id
					fileName: name,
					filePath: filepath,
					fileType: "2",
					localPath: localpath,
					source: 'viewlib',
					imageId: that.data('imgid'),
					incidentId: that.data('incidentid') === "暂未填写" ? null : that.data('incidentid'),
					incidentname: self.params.casename ? self.params.casename : null,
					shootTime: that.data('shoottime'),
					notSave: jQuery('.save-to-clound').length === 1 ? true : false //在图片详情页没有保存过云端
				};
				Cookie.write('imagejudgeData', JSON.stringify(passData));
				window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"imagejudge/resource-process/index.html?type=1", "singlePicProcess"+(++self.skipNum));

				return false;
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
