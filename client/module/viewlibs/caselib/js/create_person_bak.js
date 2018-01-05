define([
	'/module/viewlibs/caselib/js/medialib_link.js',
	'broadcast',
	'base.self',
	'jquery-ui-1.10.1.custom.min',
	'jquery-ui-timepicker-addon',
	'scrollbar',
	'common.cascade',
	'jquery.validate',
	'jquery.pagination',
	'permission'
], function(medialibLink, broadCast) {
	var mediaLink = new medialibLink();
	//使得视图库我的工作台高亮显示
	parent.jQuery('.workbench[data-id="14"]').addClass("active").siblings().removeClass("active");
	if (parent.window.opener && parent.window.opener.gMessJson) {
		if (parent.window.opener.gMessJson.fileType === "2" || parent.window.opener.gMessJson.fileType === 2) {
			jQuery(".display-format ul li[data-tab='ocxbody']").remove();
			//jQuery(".entity-box div[data-tab='ocxbody']").remove();

			jQuery(".display-format ul li[data-tab='picture']").trigger("click");
		}
		jQuery(".video_tool").remove();
		if (parent.window.opener.gMessJson.cloud && parent.window.opener.gMessJson.cloud === "cloud") {
			mediaLink.mediaRender("cloud");
		} else {
			mediaLink.mediaRender();
		}
	}
	mediaLink.closeWindowtitle();
	var PersonForm = new new Class({

		Implements: [Events, Options],

		initialize: function() {
			var self = this;
			jQuery('.form-item .input-time').datetimepicker({ //时间控件
				showSecond: true,
				dateFormat: 'yy-mm-dd',
				timeFormat: 'HH:mm:ss',
				timeText: '',
				hourText: '时',
				minuteText: '分',
				secondText: '秒',
				showAnim: '',
				maxDate: new Date()
			});
			jQuery(document).on('click', '.module-head', function() { //展开收拢表单
				//jQuery(this).closest(".module").toggleClass("active").siblings(".module").removeClass("active");
				jQuery(this).closest(".module").addClass("active");
				jQuery(this).closest(".module").siblings().removeClass("active");
				jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
					thumbSize: 36
				});
			});

			if (jQuery(".module.active>.module-body").length) { //编辑页和创建滚动条
				self.tinyscrollbarU = jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
					thumbSize: 36
				});
			}
			//人员表单验证
			$.validator.addMethod("ltCurrentDate", function(value, element) {
				return this.optional(element) || (Toolkit.str2mills(value) < (new Date().getTime()));
			}, "时间必须小于当前时间");
			jQuery('#form').validate({
				ignore: "",
				rules: {
					appearTime: {
						ltCurrentDate: true,
						minlength: 1,
						maxlength: 100
					},
					cardtype: {
						maxlength: 50
					},
					cardnumb: {
						maxlength: 50,
						identificationSelect: "#cardtype"
					},
					name: {
						maxlength: 20
					},
					formerName: {
						maxlength: 20
					},
					nickname: {
						maxlength: 20
					},
					ageUpper: {
						digits: true,
						maxlength: 10,
						range: [0, 100]
					},
					ageLower: {
						digits: true,
						maxlength: 10,
						range: [0, 100]
					},
					voice: {
						string: true,
						maxlength: 50
					},
					industryCount: {
						digits: true
					},
					heightUpper: {
						digits: true
					},
					heightLower: {
						digits: true
					},
					bodyFeature: {
						string: true
					},
					surfaceFeature: {
						string: true
					},
					driverLicense: {
						string: true,
						maxlength: 10
					},
					driverStatus: {
						string: true
					},
					foreignerCategory: {
						string: true,
						maxlength: 20
					}

				},
				success: function(label) {
					label.removeClass("error");
				},
				messages: {
					cardtype: {
						maxlength: '证件类型不得超过50个字符！'
					},
					cardnumb: {
						maxlength: '证件号码不得超过50个字符！'
					},
					name: {
						maxlength: '姓名不得超过20个字符！'
					},
					formerName: {
						maxlength: '曾用名不得超过20个字符！'
					},
					nickname: {
						maxlength: '绰号不得超过20个字符！'
					},
					ageUpper: {
						maxlength: '年龄上限不超过10个字符！',
						range: '年龄上限界于0到100之间！'
					},
					ageLower: {
						maxlength: '年龄下限不超过10个字符！',
						range: '年龄下限界于0到100之间！'
					},
					voice: {
						string: '请输入汉字或字符！',
						maxlength: '输入不得超过50个字符！'
					},
					industryCount: {
						digits: '请输入数字！'
					},
					heightUpper: {
						digits: '请输入数字！'
					},
					heightLower: {
						digits: '请输入数字！'
					},
					bodyFeature: {
						string: '请输入汉字或字符！'
					},
					surfaceFeature: {
						string: '请输入汉字或字符！'
					},
					driverLicense: {
						string: '请输入汉字或字符！',
						maxlength: '输入不得超过10个字符！'
					},
					driverStatus: {
						string: '请输入汉字或字符！'
					},
					foreignerCategory: {
						string: '请输入汉字或字符！',
						maxlength: '输入不得超过20个字符！'
					}
				},
				submitHandler: function() {
					if (jQuery("#form").find(".error").length === 0) {
						jQuery("#form")[0].submit();
					} else {
						return;
					}
				}
			});
			self.linkage();
			self.loadOptions("nation", "nation"); //民族
			self.loadOptions("passportCategory", "passportCategory"); //护照
			self.loadOptions("workCategory", "workCategory"); //职务
			self.loadOptions("criminalSkilled", "criminalSkilled"); //犯罪专长
			self.loadOptions("criminalMark", "criminalMark"); //体表标记
			self.loadOptions("criminalMethod", "criminalMethod"); //作案手段
			self.loadOptions("criminalFeature", "criminalFeature"); //作案特点
			this.bindEvents();
		},
		loadOptions: function(id, type) { //加载下拉列表数据项(创建页面)
			var loadCache = new Hash(),
				dataCache = new Hash(),
				self = this,
				node = jQuery("#" + id),
				url = "/module/viewlibs/caselib/inc/medialib/person.json";
			if (!loadCache.has()) {
				jQuery.ajax({
					url: url,
					cache: true,
					beforeSend: function() {
						loadCache.set(url, true);
					},
					success: function(data) {
						if (typeof data === "string") {
							data = JSON.parse(data);
						}
						dataCache.set(url, data);
						self.renderOptions(node, data, type);
					},
					error: function() {
						notify.error("数据出错！");
					}
				});
			} else {
				if (dataCache.has(url)) {
					self.renderOptions(node, dataCache.get(url), type);
				}
			}
		},
		renderOptions: function(node, data, type) { //下拉列表
			var option = "<option value=''>--请选择--</option>",
				defaultValue = node.data("default");
			if (type) {
				for (var item in data[type]) {
					if (defaultValue == item || parseInt(item) === parseInt(defaultValue)) {
						option += "<option value=" + item + ">" + data[type][item] + "</option>";
					} else {
						option += "<option value=" + item + ">" + data[type][item] + "</option>";
					}
				}
			}
			node.append(option);
		},

		linkage: function() { //联动
			new CommonCascade({
				firstSelect: '#nativeMain',
				secondSelect: '#nativeSub'

			});

			new CommonCascade({
				firstSelect: '#residenceProvince',
				secondSelect: '#residenceCity',
				thirdSelect: '#residenceCountry'

			});

			new CommonCascade({
				firstSelect: '#victimCategoryMain',
				secondSelect: '#victimCategorySub',
				path: '/module/viewlibs/caselib/inc/victim_category.json'

			});

			new CommonCascade({
				firstSelect: '#professionMain',
				secondSelect: '#professionSub',
				path: '/module/viewlibs/caselib/inc/profession_data.json'

			});
		},
		serializeForm: function(serverlize) { //表单数据json化
			var json = {};
			for (var i = 0; i < serverlize.length; i++) {
				json[serverlize[i].name] = serverlize[i].value;
			}
			return json;
		},
		isChecked: function(cmd) {
			if (cmd) {
				return 1;
			} else {
				return 0;
			}
		},
		bindEvents: function() {
			var self = this;
			//incidentname统一
			if (parent.window.opener.gMessJson.incidentName) {
				parent.window.opener.gMessJson.incidentname = parent.window.opener.gMessJson.incidentName;
			}
			jQuery(document).on('blur', 'form input', function(e) {
				var error = jQuery(e.target).hasClass('error');
				if (error && self.tinyscrollbarU) {
					self.tinyscrollbarU.tinyscrollbar_update('relative');
				}

				if (jQuery(".entity-form").find(".error").length === 0 && self.tinyscrollbarU) {
					self.tinyscrollbarU.tinyscrollbar_update('relative');
				}
			});
			jQuery(document).on("click", '.module .form-item .input-check', function() { //勾选复选框启用相应的表单项
				jQuery(this).closest(".form-item").next(".enablewrap").find("select,.input-text").attr("disabled", !this.checked);
			});

			jQuery(document).on("change", "#cardtype", function() {
				if (jQuery("#cardtype :selected").index() !== 0) {
					jQuery("input[name=cardnumb]").triggerHandler("blur");
				} else {
					jQuery("input[name=cardnumb]").removeClass("error");
					jQuery("input[name=cardnumb]").val("");
					jQuery("input[name=cardnumb]").closest(".item-box").find("label.error").remove();
				}
			});
			jQuery(document).on('click', "form .input-submit", function(e) { //表单提交
				e.preventDefault();
				var formdata = self.serializeForm(jQuery("#form").serializeArray()),
					videoId = "",
					imageId = "",
					url = "/service/pvd/save_person_info" + "?timestamp=" + new Date().getTime();
				if (parent.window.opener.gMessJson.fileType === "2") {
					videoId = "",
						imageId = parent.window.opener.gMessJson.medialibId
				} else if (parent.window.opener.gMessJson.fileType === "1") {
					videoId = parent.window.opener.gMessJson.medialibId,
						imageId = ""
				}
				var id = parent.window.opener.gMessJson.medialibId;
				var videoId = "",
					imageId = "";
				var appearTime = parent.window.opener.gMessJson.appearTime;
				if (parent.window.opener.gMessJson.fileType === "1") {
					videoId = parent.window.opener.gMessJson.medialibId;
				} else {
					imageId = parent.window.opener.gMessJson.medialibId;
					parent.window.opener.gMessJson.base64Pic = parent.window.opener.gMessJson.mediaPath;
				}
				//组装勾选框的数据
				formdata = JSON.stringify(Object.merge(formdata, {
					"videoId": videoId,
					"imageId": imageId,
					"sourceId": id,
					"remark": setRemark.getText(jQuery("#form")),
					"incidentId": parent.window.opener.gMessJson.incidentId === "" ? null : parent.window.opener.gMessJson.incidentId,
					"appearTime": appearTime,
					"points": parent.window.opener.gMessJson.imageJson,
					"timeBegin": parent.window.opener.gMessJson.timeBegin,
					"timeEnd": parent.window.opener.gMessJson.timeEnd,
					"picture": parent.window.opener.gMessJson.base64Pic,
					"isDriver": self.isChecked(jQuery("#isDriver").is(':checked')),
					"isForeigner": self.isChecked(jQuery("#isForeigner").is(':checked')),
					"isTerrorist": self.isChecked(jQuery("#isTerrorist").is(':checked')),
					"isWorker": self.isChecked(jQuery("#isWorker").is(':checked')),
					"isCriminal": self.isChecked(jQuery("#isCriminal").is(':checked')),
					"isDetain": self.isChecked(jQuery("#isDetain").is(':checked')),
					"isVictim": self.isChecked(jQuery("#isVictim").is(':checked'))
				}));

				if (jQuery("#form").valid() && jQuery("#form").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
					//保存按钮置灰
					jQuery("form .input-submit").attr("disabled", true);

					jQuery.ajax({
						url: url,
						data: {
							"resoureList": formdata,
							"cloudSid": parent.window.opener.gMessJson.cloud ? parent.window.opener.gMessJson.cloudId : null
						},
						dataType: "json",
						type: "post",
						success: function(data) {
							jQuery("form .input-submit").removeAttr("disabled");
							if (data && data.code === 200) {
								mediaLink.isSave = true;
								notify.success("保存成功！");

								var type = (parseInt(parent.window.opener.gMessJson.fileType, 10) === 2 ? '图片' : '视频'),
									name = parent.window.opener.gMessJson.fileName,
									incident = parent.window.opener.gMessJson.incidentname || '',
									str = incident ? '案事件中' : '';
								logDict.insertMedialog('m4', incident + str + name + type + '生成人员结构化信息');
								if (parent.window.opener.gMessJson.originName) {
									logDict.insertMedialog('m4', parent.window.opener.gMessJson.originName + type + '的图像处理结果作为结构化信息入库');
								}
								//if是来自非视图库则保存后，并且需要填写图片表单
								if (parent.window.opener.gMessJson.source && parent.window.opener.gMessJson.source === "unviewlib") {
									var data = {
										"cloudId": parent.window.opener.gMessJson.cloudId,
										"mediaPath": parent.window.opener.gMessJson.mediaPath,
										"shootTime": parent.window.opener.gMessJson.shootTime,
										"fileType": parent.window.opener.gMessJson.fileType,
										"structType": "1",
										"structuredId": data.data.id
									};
									Cookie.dispose('data');
									Cookie.write('data', JSON.stringify(data));
									//if为视频情况，为布放添加的。
									if (parent.window.opener.gMessJson.fileType === "1" || parent.window.opener.gMessJson.fileType === 1) {
										window.location.href = "/module/viewlibs/caselib/create_video_bak.html";
									} else {
										window.location.href = "/module/viewlibs/caselib/create_image_bak.html";
									}
								} else { //是来自视图库则直接保存，不填写图片表单
									$("#content .libbanner span").addClass("five");
									$("#content .libbanner span a:lt(4)").removeClass("current").addClass("already");
									$("#content .libbanner span a:eq(4)").removeClass("already").addClass("current");
									//发送消息给云空间
									broadCast.emit('finishToMedia', {
										pvdId: data.data.id
									});
									///组装弹框内容
									var dialogString = "<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成视图入库操作！</span><br/><span class='detail_word'>",
										orgid = "";
									dialogString = dialogString + "<a href='/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/details/struct/person.html?origntype=person", orgid = "";

									if (parent.window.opener.gMessJson.incidentname !== null && parent.window.opener.gMessJson.incidentname !== undefined) {
										dialogString = dialogString + "&incidentname=" + parent.window.opener.gMessJson.incidentname + "&id=" + data.data.id + "&pagetype=workbench&orgid=" + orgid + "' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close btn btn_ok input-submit' value='关闭本页'></div></div>";
									} else {
										dialogString = dialogString + "&id=" + data.data.id + "&pagetype=workbench&orgid=" + orgid + "' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close btn btn_ok input-submit' value='关闭本页'></div></div>";
									}
									new ConfirmDialog({
										title: '提示信息',
										message: dialogString,
										callback: function() {
											mediaLink.isSave = true;
											window.opener = null;
											window.open('', '_self', '');
											parent.window.close();
										}
									});
									$(".common-dialog .close").on("click", function() {
										mediaLink.isSave = true;
										window.opener = null;
										window.open('', '_self', '');
										parent.window.close();
									});
									setTimeout(function() {
										mediaLink.isSave = true;
										window.opener = null;
										window.open('', '_self', '');
										parent.window.close();
									}, 5000);
								}
							}
						}
					});
				} else {
					notify.warn("请正确填写相关信息！");
				}
			});
		}
	});
});