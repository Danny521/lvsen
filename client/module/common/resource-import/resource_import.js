define([
    'panel',
    '/module/imagejudge/resource-process/js/cloudResourceTreePanel.js',
    'underscore',
    'jquery-ui-timepicker-addon',
    'base.self',
    'handlebars',
    'plupload',
    'jquery.datetimepicker'
],function(BlankPanel, CloudResourceTreePanel, _){

		var isChrome=function () {
			/*判断谷歌30浏览器 显示进度条*/
			if (window.navigator.userAgent.test('Chrome/30')) {//parseInt(isChrome.split('.')[0])==30){
				$('.progressbar').hide();
			} else {
				$('.progressbar').show();
			}
		};
		// 本地导入
        var LocalImport = new Class({
				Implements: [Options, Events],
				panel: null,
				fileTemplCache: null,
				uploading: false, // 是否正在上传
                fileUploadedErrorNum : 0,//记录文件上传完成后台返回500的次数
                fileUploadedErrorIds : [],//记录文件上传完成后台返回500的文件id
				options: {
					isImageJudge: true,
					browse_button: "chooseLocalFile",
					url: '/service/pia/local_resource',
					delUrl: '/service/pia/remove_local',
					fileTemplUrl: '/module/common/resource-import/resource_import_file.html'
				},
				initialize: function(options) {
					var self = this;
					self.setOptions(options);
					self.createElement();
					self.bindEvent();
				},
				createElement: function() {
					var self = this;
					var source = '&source=' + (self.options.isImageJudge ? '2' : '1');
					self.panel = resourceImportPanel.panel;
					self.btnGroup = self.panel.find(".btn-group-local");
					self.btnImport = self.btnGroup.find(".btn_import");
					self.tabContent = self.panel.find(".ui.tab[data-tab=local]");
					self.resultAdded = self.tabContent.find(".result .added");
					self.resultSuccess = self.tabContent.find(".result .success");
					self.resultFailure = self.tabContent.find(".result .failure");
					self.fileList = self.tabContent.find(".table tbody");

					// 上传控件
					self.upload = new plupload.Uploader({
						"runtimes": "flash,html5,html4",
						"browse_button": self.options.browse_button,
						"multi_selection": true,
						"url": self.options.url + "?_=" + (new Date()).getTime() + source,
						"file_data_name": "file_name",
						"filters": [{
							title: "选择图片",
							//tiff格式图片在网页上显示需要安装插件，系统暂不支持，bug[38928],add by zhangyu 2016.03.31
							extensions: window.uploadImageExtention
						}, {
							title: "选择视频",
							extensions: window.uploadVideoExtention
						}],
						"max_file_size": "9gb",
						"flash_swf_url": "/libs/plupload/plupload.flash.swf",
						"silverlight_xap_url": "/libs/plupload/plupload.silverlight.xap"
					});
					self.upload.init();
				},
				/**
				 * 处理文件上传出错的提示性逻辑
				 * @param code - 错误码
				 */
				showUploadError: function(code) {
					switch (code) {
						case -601:
							notify.warn("系统暂不支持该类型文件的上传，请上传图片或者视频文件");
							break;
						case -600:
							notify.warn("上传的文件大小应保持在9GB以内");
							break;
						default :
							notify.warn("上传出错，请重试");
					}
				},
				/**
				 * 上传插件的事件绑定
				 */
				bindEvent: function() {
					var self = this;
					// 监听是否正在上传
					self.upload.bind('UploadComplete', function(up, files) {
						self.uploading = false;
					});

					// 文件添加后 渲染文件到上传列表
					self.upload.bind('FilesAdded', function(up, files) {
						for (var i = 0; i < files.length; i++) {
							$.when(self.renderFileTemp(files[i])).done(function() {
								self.initValue(this);
							}.bind(files[i]));
						}
					});

					// 处理文件上传进度
					self.upload.bind('UploadProgress', function(up, file) {
						self.uploading = true;

						var fileElm = $("tr[data-id=" + file.id + "]"),
							statusElm = fileElm.find(".status-text");
						self.updateProgress(fileElm, Math.min(file.percent, 99));
						if (file.percent !== 100) {
							self.updateStatus(fileElm, "uploading");
							self.updateBtnStatus(fileElm, "uploading");
						} else {
							if (!self.isFileUploaded) {
								self.updateStatus(fileElm, "stream");
								self.updateBtnStatus(fileElm, "stream");
								self.isFileUploaded = null;
							}
						}
					});

					//上传完成
					self.upload.bind('FileUploaded', function(up, file, res) {
						self.isFileUploaded = true;

						var response = JSON.parse(res.response);
						var fileElm = $("tr[data-id=" + file.id + "]");
						self.updateProgress(fileElm, 100);
						self.updateStatus(fileElm, "success", file);
						self.updateBtnStatus(fileElm, "success");
						self.updateResult(up);
						self.hideInputtime(fileElm);
						self.hideProgressbar(fileElm);
						if (response.code === 200) {
							fileElm.attr('data-fileid', response.id);
							fileElm.attr('data-filename', file.name);
							fileElm.attr('data-filetype', response.fileType);
							fileElm.attr('data-filepath', response.filePath);
							fileElm.attr('data-localpath', response.localPath);
							fileElm.attr('data-parentid', response.parentId);
							var datajson = {
                                "resource_id" : response.resource_id,
								"id": response.id,
								"beginTime": $.trim(fileElm.find(".stime").text()),
								"rapidness": $.trim(fileElm.find(".dtime").text()),
								"parentDirId":$(".local-upload").attr("data-currentid")
							};
							self.calibrateTime(datajson);
						} else {
                            notify.info(response.message);
                            self.fileUploadedErrorNum ++;
                            self.fileUploadedErrorIds.push(file.id);
							self.updateStatus(fileElm, "failed", file);
							self.hideInputtime(fileElm);
							self.hideProgressbar(fileElm);
							self.updateBtnStatus(fileElm, "failed");
							self.updateResult(up);
						};
					});

					//上传错误
					self.upload.bind('Error', function(up, file) {
						var fileElm = $("tr[data-id=" + file.file.id + "]");
						self.updateStatus(fileElm, "failed", file.file);
						self.hideInputtime(fileElm);
						self.hideProgressbar(fileElm);
						self.updateBtnStatus(fileElm, "failed");
						self.updateResult(up);
						//图像研判/云空间，对文件上传错误进行提示，add by zhangyu 2016.03.31
						self.showUploadError(file.code);
					});

					// 文件队列改变后 修改已添加、成功、失败的文件个数
					self.upload.bind('QueueChanged', function(up) {
						if (up.total.queued > 0) {
							self.btnImport.removeClass("hidden");
							self.uploading = true;
						} else {
							self.btnImport.addClass("hidden");
							self.uploading = false;
						}
						self.updateResult(up);
					});

					// 开始导入
					self.btnImport.on('click', function(e) {
						e.preventDefault();
						if (window.navigator.userAgent.test('Chrome/30')) {
							if($('.text-primary'))$('.text-primary').text("导入中");
						}
						if (self.valid()) {
							self.upload.start();
							self.btnImport.addClass("hidden");
							jQuery(".remove-file").addClass("hidden");
							jQuery(".cancel-import").removeClass("hidden");
						}
					});

					//取消导入
					self.tabContent.on('click', '.cancel-import', function(e) {
						e.preventDefault();
						self.upload.stop();
						if (self.upload.total.queued > 0) {
							self.btnImport.removeClass("hidden");
						}
						var fileElm = $(this).closest('tr');
						self.updateProgress(fileElm, 0);
						self.updateStatus(fileElm, "init");
						self.updateBtnStatus(fileElm, "init");
					});

					// 移除未导入的文件
					self.tabContent.on('click', '.remove-file', function(e) {
						e.preventDefault();
						var elm = this;
						var fileId = $(elm).closest('tr').attr('data-id');
                        if(_.indexOf(self.fileUploadedErrorIds, fileId) !== -1){
                            self.fileUploadedErrorNum--;
                            self.fileUploadedErrorIds.splice(_.indexOf(self.fileUploadedErrorIds, fileId), 1);
                        }
						var file = self.upload.getFile(fileId);
						var resId = $(elm).closest('tr').attr('data-fileid');
						var delFileDialog = new ConfirmDialog({
							title: '警告',
							warn: true,
							modal: false,
							message: '<div class="dialog-messsage"><h4>您确定要删除该文件吗？</h4>',
							callback: function() {
								if (resId) {
									// $.ajax({
									// 	type: "post",
									// 	dataType: "json",
									// 	data: {
									// 		'id': resId
									// 	},
									// 	url: self.options.delUrl,
									// 	success: function(res) {
									// 		if (res.code === 200) {
									// 			self.removeFile(elm, file);
									// 		}
									// 	}
									// });
									self.removeFile(elm, file);
								} else {
									self.removeFile(elm, file);
								}
							}
						});
					});

					// 时间控件
					self.tabContent.on('focus', '.input-time', function() {
						$(this).datetimepicker({
							showSecond: true,
							dateFormat: 'yy-mm-dd',
							timeFormat: 'HH:mm:ss',
							timeText: '',
							hourText: ' 时:',
							minuteText: ' 分:',
							secondText: ' 秒:',
							maxDate: new Date()
						});
					});

					//开始时间和时差保持一致
					self.tabContent.on('change', '.start-time', function(e) {
						e.preventDefault();

						var sValue = $(this).val();
						var siblingsElm = $(this).closest('tr').find('.time-diff');
						if (!siblingsElm.val()) {
							siblingsElm.val(sValue);
						}
					});
                    self.btnGetPosition();
				},
                btnGetPosition : function(){
                    setTimeout(function(){
                        var offset = jQuery('#chooseLocalFile').offset();
                        jQuery('.plupload.flash').css({left:offset.left,top:offset.top});
                    },500);
                },
				// 初始化控件的值
				initValue: function(file) {
					var self = this;

					// 初始化滚动条
					var progressbar = self.tabContent.find("tr[data-id=" + file.id + "] .progressbar");
					var progressLabel = self.tabContent.find("tr[data-id=" + file.id + "] .progress-label");
					progressbar.progressbar({
						change: function() {
							progressLabel.text(progressbar.progressbar("value") === 0 ? "" : progressbar.progressbar("value") + "%");
						}
					});

					// 拍摄时间 和 校正时间默认为当前时间
					var currTime = Toolkit.getCurDateTime();
					self.tabContent.find("tr[data-id=" + file.id + "] .start-time").val(currTime);
					self.tabContent.find("tr[data-id=" + file.id + "] .time-diff").val(currTime);
					isChrome();
				},
				// 渲染模板
				renderFileTemp: function(file) {
                    var self = this;

                    //文件超过1.7G限制上传(size单位是b)
//                    if(file.size > 1.7*1024*1024*1024){
//                        notify.success("文件超过最大限制1.7G，导入失败！！！");
//                        self.upload.removeFile(file);
//                        return;
//                    }

					if (!file.type) {
						var fileType = file.name.substring(file.name.lastIndexOf(".") + 1);
						fileType = fileType.toLowerCase();
						if ($.inArray(fileType, ["jpg", "jpeg", "gif", "png", "bmp", "tiff", "pcx", "tga", "exif", "fpx", "svg", "psd", "cdr", "pcd", "dxf", "ufo", "eps", "ai", "raw"]) === -1) {
							file.type = 1;
						} else {
							file.type = 2;
						}
					};
					var dtd = $.Deferred();
					if (self.fileTemplCache) {
						self.fileList.append(Handlebars.compile(self.fileTemplCache)({
							"file": file
						}));
						dtd.resolve();
					} else {

						$.when(Toolkit.loadTempl(self.options.fileTemplUrl)).done(function(tem) {
							self.fileTemplCache = tem;
							self.fileList.append(Handlebars.compile(self.fileTemplCache)({
								"file": file
							}));
							dtd.resolve();
						});
					}

					return dtd.promise();
				},
				// 校正时间
				calibrateTime: function(data) {
					var self = this;
					$.ajax({
						type: "post",
						dataType: "json",
						data: data,
						url: "/service/pia/update_local?_=" + (new Date()).getTime(),
						success: function(res) {
							if (res.code === 200) {}
						}
					});
				},
				// 校验参数
				valid: function() {
					var self = this;

					var valid = true;
					self.tabContent.find("input.input-time").each(function() {
						if (!$.trim($(this).val())) {
							valid = false;
						};
					});

					if (!valid) {
						notify.warn("请填写起始时间或校正时间");
					}

					return valid;
				},
				// 删除文件
				removeFile: function(elem, file) {
					var self = this;
					self.upload.removeFile(file);
					$(elem).closest('tr').remove();
				},
				// 隐藏进度
				hideProgressbar: function(fileElm) {
					fileElm.find(".progressbar").addClass("hidden");
				},
				// 隐藏输入框
				hideInputtime: function(fileElm) {
					fileElm.find(".input-time").addClass("hidden");
					fileElm.find(".stime")
						.text($.trim(fileElm.find(".input-time.start-time").val()))
						.removeClass("hidden");
					fileElm.find(".dtime")
						.text($.trim(fileElm.find(".input-time.time-diff").val()))
						.removeClass("hidden");
				},
				// 更新显示结果
				updateResult: function(up) {
					var self = this;
					self.resultAdded.text(up.files.length);
                    self.resultSuccess.text(up.total.uploaded - self.fileUploadedErrorNum);
                    self.resultFailure.text(up.total.failed + self.fileUploadedErrorNum);
				},
				// 更新进度
				updateProgress: function(fileElm, value) {
					fileElm.find(".progressbar").progressbar("value", value);
				},
				// 更新显示状态
				updateStatus: function(fileElm, state, file) {
                	var self =this;
                	var fileType = file && file.type === 1 ? '视频' : '图片';
					switch (state) {
						case "init":
							fileElm.find(".status-text")
								.removeClass("text-success text-error")
								.addClass('text-primary')
								.text("未开始");
							break;
						case "uploading":
							fileElm.find(".status-text")
								.removeClass("text-success text-error")
								.addClass("text-primary")
								.text("导入中");
							break;
						case "stream":
							fileElm.find(".status-text")
								.removeClass("text-success text-error")
								.addClass("text-primary")
								.text("流化中");
							break;
						case "success":
							fileElm.find(".status-text")
								.removeClass("text-primary text-error")
								.addClass("text-success")
								.text("导入成功");
                        	if(self.options.isImageJudge){
                        		logDict.insertMedialog('m5', '新增 ' + (file.name||'') + fileType,'','o1');
                        	}else{
                        		logDict.insertMedialog('m6', '新增 ' + (file.name||'') + fileType,'','o1');
                        	}
							break;
						case "failed":
							fileElm.find(".status-text")
								.removeClass("text-primary text-success")
								.addClass("text-error")
								.text("导入失败");
                        	if(self.options.isImageJudge){
                           	// 	logDict.insertMedialog('m5', '新增' + (file.name||'') + fileType + '  失败','','o1');
                       		}else{
                       		//	logDict.insertMedialog('m6', '新增' + (file.name||'') + fileType + '  失败','','o1');
                       		}
							break;
						default:
							fileElm.find(".status-text")
								.removeClass("text-success text-error")
								.addClass('text-primary')
								.text("未开始");
					}
				},
				// 更新按钮状态
				updateBtnStatus: function(fileElm, state) {
					switch (state) {
						case "init":
							fileElm.find(".cancel-import").addClass("hidden");
							fileElm.find(".remove-file").removeClass("hidden");
							break;
						case "uploading":
							fileElm.find(".cancel-import").removeClass("hidden");
							fileElm.find(".remove-file").addClass("hidden");
							break;
						case "stream":
							fileElm.find(".cancel-import").removeClass("hidden");
							fileElm.find(".remove-file").addClass("hidden");
							break;
						case "success":
							fileElm.find(".cancel-import").addClass("hidden");
							fileElm.find(".remove-file").removeClass("hidden");
							break;
						case "failed":
							fileElm.find(".cancel-import").addClass("hidden");
							fileElm.find(".remove-file").removeClass("hidden");
							break;
						default:
							fileElm.find(".cancel-import").addClass("hidden");
							fileElm.find(".remove-file").removeClass("hidden");
					}
				}
			}),


			// 云端选择
			CloudSelect = new Class({
				Implements: [Options, Events],
				panel: null,
				crtp: null, // CloudResourceTreePanel 对象
				upload: null,
				fileTemplCache: null,
				uploading: false,
				options: {
					url: '/service/pia/resource_cloud',
					fileTemplUrl: '/module/common/resource-import/resource_import_file.html'
				},
				initialize: function(options) {
					var self = this;
					self.setOptions(options);
					self.createElement();
					self.bindEvent();
				},
				createElement: function() {
					var self = this;
					self.panel = resourceImportPanel.panel;
					self.btnGroup = self.panel.find(".btn-group-cloud");
					self.btnImport = self.btnGroup.find(".btn_import");
					self.btnAdd = self.btnGroup.find(".btn_add");
					self.tabContent = self.panel.find(".ui.tab[data-tab=cloud]");
					self.resultAdded = self.tabContent.find(".result .added");
					self.resultSuccess = self.tabContent.find(".result .success");
					self.resultFailure = self.tabContent.find(".result .failure");
					self.fileList = self.tabContent.find(".table tbody");

					self.upload = new Uploader({
						url: self.options.url
					});
				},

				bindEvent: function() {
					var self = this;

					// 监听是否正在上传
					self.upload.bind('UploadComplete', function(up, files) {
						self.uploading = false;
					});

					// 添加文件
					self.btnAdd.on("click", function() {
						if (self.crtp) {
							self.crtp.show().reload();
						} else {
							self.crtp = new CloudResourceTreePanel({
								selectable: true,
								node: "#cloudTreePanel",
								scrollbarNode: "#cloudTree",
								callback: function(data) {
									var fileData = self.crtp.getSelectedResData();
									self.upload.addFile(fileData);
									self.crtp.hide();
								}
							}).show();
						}
					});


					// 文件添加后 渲染文件到上传列表
					self.upload.bind('FilesAdded', function(up, files) {
						for (var i = 0; i < files.length; i++) {
							$.when(self.renderFileTemp(files[i])).done(function() {
								self.initValue(this);

							}.bind(files[i]));
						}

					});



					// 处理文件上传进度
					self.upload.bind('UploadProgress', function(up, file) {
						self.uploading = true;

						var fileElm = $("tr[data-id=" + file.id + "]"),
							statusElm = fileElm.find(".status-text");

						self.updateProgress(fileElm, file.percent);
						self.updateStatus(fileElm, "uploading");
						self.updateBtnStatus(fileElm, "uploading");
					});

					//上传完成
					self.upload.bind('FileUploaded', function(up, file, res) {

						var fileElm = $("tr[data-id=" + file.id + "]");
						self.updateProgress(fileElm, 100);
						self.updateStatus(fileElm, "success", file);
						self.updateBtnStatus(fileElm, "success");
						self.updateResult(up);
						self.hideInputtime(fileElm);
						self.hideProgressbar(fileElm);

						fileElm.data("fileData", file.data);
					});

					//上传错误
					self.upload.bind('Error', function(up, file) {
						var fileElm = $("tr[data-id=" + file.id + "]");
						self.updateStatus(fileElm, "failed", file);
						self.hideInputtime(fileElm);
						self.hideProgressbar(fileElm);
						self.updateBtnStatus(fileElm, "failed");
						self.updateResult(up);
					});

					// 文件队列改变后 修改已添加、成功、失败的文件个数
					self.upload.bind('QueueChanged', function(up) {
						if (up.total.queued > 0) {
							self.btnImport.removeClass("hidden");
							self.uploading = true;
						} else {
							self.btnImport.addClass("hidden");
							self.uploading = false;
						}
						self.updateResult(up);
					});

					// 开始导入
					self.btnImport.on('click', function(e) {
						e.preventDefault();
						if (self.valid()) {
							self.upload.start();

							self.btnImport.addClass("hidden");
						}
					});

					//取消导入
					self.tabContent.on('click', '.cancel-import', function(e) {
						e.preventDefault();
						self.upload.stop();
						if (self.upload.total.queued > 0) {
							self.btnImport.removeClass("hidden");
						}
						var fileElm = $(this).closest('tr');
						self.updateProgress(fileElm, 0);
						self.updateStatus(fileElm, "init");
						self.updateBtnStatus(fileElm, "init");
					});

					//移除未导入的文件
					self.tabContent.on('click', '.remove-file', function(e) {
						e.preventDefault();
						var elm = this;
						var fileId = $(elm).closest('tr').attr('data-id');
						var file = self.upload.getFile(fileId);
						var fileData = $(elm).closest('tr').data("fileData");
						var delFileDialog = new ConfirmDialog({
							title: '警告',
							warn: true,
							modal: false,
							message: '<div class="dialog-messsage"><h4>您确定要删除该文件吗？</h4>',
							callback: function() {
								if (fileData) {
									self.removeFile(elm, file);
								} else {
									self.removeFile(elm, file);
								}
							}
						});
					});

					// 时间控件
					self.tabContent.on('focus', '.input-time', function() {
						$(this).datetimepicker({
							showSecond: true,
							dateFormat: 'yy-mm-dd',
							timeFormat: 'HH:mm:ss',
							timeText: '',
							hourText: ' 时:',
							minuteText: ' 分:',
							secondText: ' 秒:'
						});
					});

					//开始时间和时差保持一致
					self.tabContent.on('change', '.start-time', function(e) {
						e.preventDefault();

						var sValue = $(this).val();
						var siblingsElm = $(this).closest('tr').find('.time-diff');
						if (!siblingsElm.val()) {
							siblingsElm.val(sValue);
						}
					});

				},
				// 初始化控件的值
				initValue: function(file) {
					var self = this;

					// 初始化滚动条
					var progressbar = self.tabContent.find("tr[data-id=" + file.id + "] .progressbar");
					var progressLabel = self.tabContent.find("tr[data-id=" + file.id + "] .progress-label");
					progressbar.progressbar({
						change: function() {
							progressLabel.text(progressbar.progressbar("value") === 0 ? "" : progressbar.progressbar("value") + "%");
						}
					});

					// 拍摄时间 和 校正时间默认为当前时间
					var storageTimeStr = Toolkit.mills2datetime(parseInt(file.data.storageTime));
					var currTime = Toolkit.getCurDateTime();
					self.tabContent.find("tr[data-id=" + file.id + "] .start-time").val(storageTimeStr);
					self.tabContent.find("tr[data-id=" + file.id + "] .time-diff").val(currTime);
					isChrome();
				},
				// 渲染模板
				renderFileTemp: function(file) {
					var self = this;

					var dtd = $.Deferred();
					if (self.fileTemplCache) {
						self.fileList.append(Handlebars.compile(self.fileTemplCache)({
							"file": file
						}));
						dtd.resolve();
					} else {
						$.when(Toolkit.loadTempl(self.options.fileTemplUrl)).done(function(tem) {
							self.fileTemplCache = tem;
							self.fileList.append(Handlebars.compile(self.fileTemplCache)({
								"file": file
							}));
							dtd.resolve();
						});
					}

					return dtd.promise();
				},
				// 删除文件
				removeFile: function(elem, file) {
					var self = this;
					self.upload.removeFile(file);
					$(elem).closest('tr').remove();
				},
				// 校验参数
				valid: function() {
					var self = this;

					var valid = true;
					self.tabContent.find("input.input-time").each(function() {
						if (!$.trim($(this).val())) {
							valid = false;
						};
					});

					if (!valid) {
						notify.warn("请填写起始时间或校正时间");
					}

					return valid;
				},
				// 隐藏进度
				hideProgressbar: function(fileElm) {
					fileElm.find(".progressbar").addClass("hidden");
				},
				// 隐藏输入框
				hideInputtime: function(fileElm) {
					fileElm.find(".input-time").addClass("hidden");
					fileElm.find(".stime")
						.text($.trim(fileElm.find(".start-time").val()))
						.removeClass("hidden");
					fileElm.find(".dtime")
						.text($.trim(fileElm.find(".time-diff").val()))
						.removeClass("hidden");
				},
				// 更新显示结果
				updateResult: function(up) {
					var self = this;
					self.resultAdded.text(up.files.length);
					self.resultSuccess.text(up.total.uploaded);
					self.resultFailure.text(up.total.failed);
				},
				// 更新进度
				updateProgress: function(fileElm, value) {
					fileElm.find(".progressbar").progressbar("value", value);
				},
				// 更新显示状态
				updateStatus: function(fileElm, state, file) {
                	var fileType = file&&file.type === '1'?'视频':'图片';
					switch (state) {
						case "init":
							fileElm.find(".status-text")
								.removeClass("text-success text-error")
								.addClass('text-primary')
								.text("未开始");
							break;
						case "uploading":
							fileElm.find(".status-text")
								.removeClass("text-success text-error")
								.addClass("text-primary")
								.text("导入中");
							break;
						case "stream":
							fileElm.find(".status-text")
								.removeClass("text-success text-error")
								.addClass("text-primary")
								.text("流化中");
							break;
						case "success":
							fileElm.find(".status-text")
								.removeClass("text-primary text-error")
								.addClass("text-success")
								.text("导入成功");
                        	logDict.insertMedialog('m5', '云端选择' + (file.name||'') + fileType);
							break;
						case "failed":
							fileElm.find(".status-text")
								.removeClass("text-primary text-success")
								.addClass("text-error")
								.text("导入失败");
                        	logDict.insertMedialog('m5', '云端选择' + (file.name||'') + fileType + '  失败');
							break;
						default:
							fileElm.find(".status-text")
								.removeClass("text-success text-error")
								.addClass('text-primary')
								.text("未开始");
					}
				},
				// 更新按钮状态
				updateBtnStatus: function(fileElm, state) {
					switch (state) {
						case "init":
							fileElm.find(".cancel-import").addClass("hidden");
							fileElm.find(".remove-file").removeClass("hidden");
							break;
						case "uploading":
							fileElm.find(".cancel-import").removeClass("hidden");
							fileElm.find(".remove-file").addClass("hidden");
							break;
						case "stream":
							fileElm.find(".cancel-import").removeClass("hidden");
							fileElm.find(".remove-file").addClass("hidden");
							break;
						case "success":
							fileElm.find(".cancel-import").addClass("hidden");
							fileElm.find(".remove-file").removeClass("hidden");
							break;
						case "failed":
							fileElm.find(".cancel-import").addClass("hidden");
							fileElm.find(".remove-file").removeClass("hidden");
							break;
						default:
							fileElm.find(".cancel-import").addClass("hidden");
							fileElm.find(".remove-file").removeClass("hidden");
					}
				}
			}),

			// 上传工具
			Uploader = new Class({
				Implements: [Options, Events],
				files: [],
				total: {
					queued: 0,
					uploaded: 0,
					failed: 0
				},
				options: {
					url: null
				},
				initialize: function(options) {
					this.setOptions(options);
				},
				start: function() {
					var i = 0,
						len = this.files.length,
						file;
					for (; i < len; i++) {
						if (this.files[i].status === 1) {
							continue
						};
						this.sendRequest(this.files[i]);
					};

					this.fireEvent("UploadComplete", this);
				},
				sendRequest: function(file) {
					var self = this;
					self.jqxhr = $.ajax({
						url: self.options.url,
						type: "post",
						data: {
							clouds: JSON.stringify({
								cloud: [{
									id: file.data.id,
									type: file.data.type,
									parentId: file.data.parentId
								}]
							})
						},
						dataType: 'json',
						beforeSend: function(xhr) {
							file.percent = 50;
							self.fireEvent("UploadProgress", [self, file]);
						},
						success: function(res) {
							if (res.code === 200) {
								file.status = 1;
								file.percent = 100;
								self.setTotal();
								self.fireEvent("FileUploaded", [self, file, res]);
							} else {
								file.status = -1;
								self.setTotal();
								self.fireEvent("Error", [self, file]);
							}
						},
						error: function(xhr) {
							file.status = -1;
							self.setTotal();
							self.fireEvent("Error", [self, file]);
						}
					});
				},
				stop: function() {
					if (this.jqxhr && this.jqxhr.readyState != 4) {
						jqxhr.about();
					};
				},
				bind: function(eventName, fn) {
					this.addEvent(eventName, fn);
				},
				addFile: function(addFiles) {
					var i = 0,
						len = addFiles.length,
						transFile, transAddFiles = [];
					for (; i < len; i++) {
						transFile = {
							id: UUID(),
							name: addFiles[i].name,
							size: addFiles[i].size,
							type: addFiles[i].type,
							status: 0,
							percent: 0,
							data: addFiles[i]
						};
						transAddFiles.push(transFile);
					};
					this.files = this.files.concat(transAddFiles);
					this.setTotal();
					this.fireEvent("FilesAdded", [this, transAddFiles]);
					this.fireEvent("QueueChanged", this);
				},
				setTotal: function() {
					var file, i = 0,
						len = this.files.length;

					this.total.queued = 0;
					this.total.uploaded = 0;
					this.total.failed = 0;

					for (; i < len; i++) {
						file = this.files[i];

						// status = [-1 | 0 | 1]
						// -1 : 上传失败
						//  0 : 未上传
						//  1 : 上传成功
						// queued
						if (file.status === 0) {
							this.total.queued++;
						}
						// uploaded
						if (file.status === 1) {
							this.total.uploaded++;
						}
						// failed
						if (file.status === -1) {
							this.total.failed++;
						}
					}
				},
				getFile: function(id) {
					var file, i = 0,
						len = this.files.length;
					for (; i < len; i++) {
						if (id !== this.files[i].id) {
							continue
						};
						file = this.files[i];
					}
					return file;
				},
				removeFile: function(file) {
					var index = $.inArray(file, this.files);
					if (index === -1) {
						return
					};
					this.files.splice(index, 1);
					this.setTotal();
					this.fireEvent("QueueChanged", this);
				}
			}),

			// 生成uuid
			UUID = function() {
				var s = [];
				var hexDigits = "0123456789abcdef";
				for (var i = 0; i < 36; i++) {
					s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
				}
				s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
				s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
				s[8] = s[13] = s[18] = s[23] = "-";

				var uuid = s.join("");
				return uuid;
			},

			// 导入资源面板
			ResourceImportPanel = new Class({
				Extends: BlankPanel,
				panel: null,
				localImport: null, // 本地导入对象
				cloudImport: null, // 云端导入对象
				options: {
					local: true,
					cloud: true,
					localUrl: '/service/pia/local_resource',
					cloudUrl: '/service/pia/resource_cloud',
					panelTemplUrl: "/module/common/resource-import/resource_import_panel.html"
				},
				initialize: function(options) {
					var self = this;
					// 设置选项
					self.setOptions(options);

					// 至少存在一个tab
					if (!self.options.cloud && !self.options.local) {
						self.options.local = true;
					};

					// 调用父类构造方法
					self.parent(self.options.panelTemplUrl);

					// 监听模板加载成功事件
					self.addEvent("tplLoaded", function() {
						permission.reShow();
						self.createTabElement();
						self.bindTabEvent();
						self.initTabContent();
					});

					// 监听加载隐藏
					self.addEvent("loadingHide", function() {
						if (self.localImport) {
							self.localImport.upload.refresh();
						}
					});
					// 监听窗口打开事件
					self.addEvent("open", function() {
						if (self.localImport && self.tabs.filter("[data-tab=local]").hasClass('active')) {
							$("div.plupload[id^=" + self.localImport.upload.id + "]").show();
						}
                        self.btnGetPosition();
					});
					// 监听窗口关闭事件
					self.addEvent("close", function() {
						if (self.localImport) {
							// 隐藏导入组件浏览按钮
							$("div.plupload[id^=" + self.localImport.upload.id + "]").hide();
							//【云空间】关闭上传面板时刷新页面,重新渲染文件列表【bug39227】
							$("#submitBtn").trigger("click");
						}
					});
				},
				createTabElement: function() {
					var self = this;
					self.tabs = self.panel.find(".ui.tabular li");
					self.tabHeader = self.panel.find(".tab-header");
					self.tabContent = self.panel.find(".tab-content");
					self.btnGroup = self.panel.find(".btn-group-local");
					self.btnGroupCloud = self.panel.find(".btn-group-cloud");
					self.tables = self.panel.find(".ui.tab > .table");

					// 原本.panel-import可以不用设置定位，因为框架布局上有问题，影响了导入面板的展现，
					// 所以把导入面板设为fixed定位
					//self.panelContent.find(">.panel-import").css({left: self.options.left});

					if (!self.options.local) {
						self.tabs.filter("[data-tab=local]").remove();
						self.tabs.filter("[data-tab=cloud]").addClass("active");
						self.tabContent.find(".ui.tab[data-tab=local]").remove();
						self.tabContent.find(".ui.tab[data-tab=cloud]").addClass("active");
						self.btnGroup.remove();
						self.btnGroupCloud.removeClass("hidden");
					};
					if (!self.options.cloud) {
						self.tabs.filter("[data-tab=cloud]").remove();
						self.tabs.filter("[data-tab=local]").addClass("active");
						self.tabContent.find(".ui.tab[data-tab=cloud]").remove();
						self.tabContent.find(".ui.tab[data-tab=local]").addClass("active");
						self.btnGroupCloud.remove();
						self.btnGroup.removeClass("hidden");
					};

				},
                btnGetPosition : function(){
                    setTimeout(function(){
                        var offset = jQuery('#chooseLocalFile').offset();
                    	offset&&jQuery('.plupload.flash').css({left:offset.left,top:offset.top});
                    },500);
                },
				bindTabEvent: function() {
					var self = this;

					// 切换本地导入和云端导入按钮
					self.tabs.on("click", function() {
						if ($(this).data("tab") == "local") {
                            self.btnGetPosition();
							self.btnGroup.removeClass("hidden");
							self.btnGroupCloud.addClass("hidden");
							// 显示浏览按钮
							$("div.plupload[id^=" + self.localImport.upload.id + "]").show();
						} else {
							self.btnGroup.addClass("hidden");
							self.btnGroupCloud.removeClass("hidden");
							// 隐藏浏览按钮
							$("div.plupload[id^=" + self.localImport.upload.id + "]").hide();
						};
					});

					// 未上传成功刷新或关闭页面 ，提示用户
					// $(window).on("beforeunload.importpanel", function() {
					// 	if (self.localImport && self.localImport.uploading || self.cloudImport && self.cloudImport.uploading) {
					// 		return "当前正在导入文件，您确定要退出吗？";
					// 	};
					// });

				},
				initTabContent: function() {
					if (this.options.local) {
						this.localImport = new LocalImport({
						url: this.options.localUrl,
                        isImageJudge : this.options.cloud
						});
					};
					if (this.options.cloud) {
						this.cloudImport = new CloudSelect({
							url: this.options.cloudUrl
						});
					};

				},
				autosize: function() {
					var self = this;
					// 执行父类的autosize
					BlankPanel.prototype.autosize.call(this);

					// 计算tabContent的高度
                    self.tabContent&&self.tabContent
						.outerHeight(self.panel.outerHeight(true) - self.tabHeader.outerHeight(true))
						.outerWidth(self.panel.outerWidth(true));
					// 计算表格的高度
                    self.tabContent&&self.tabContent.find(".grid")
						.outerHeight(self.tabContent.outerHeight(true) - self.tabContent.find(".result").outerHeight(true))
						.outerWidth(self.tabContent.outerWidth(true));
				}
			});

		// 注册模板标记
		Handlebars.registerHelper("formatSize", function(size) {
			return plupload.formatSize(size);
		});
		Handlebars.registerHelper("iconType", function(type) {
			return type == 1 ? "video" : "image";
		});
		// 创建资源导入对象
		return resourceImportPanel = new ResourceImportPanel();
});