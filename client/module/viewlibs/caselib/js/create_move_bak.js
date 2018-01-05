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
	try {
		//使得视图库我的工作台高亮显示
		parent.jQuery('.workbench[data-id="14"]').addClass("active").siblings().removeClass("active");
		if (parent.window.opener && parent.window.opener.gMessJson && parent.window.opener.gMessJson.length !== 0) {
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
	} catch (err) {}
	mediaLink.closeWindowtitle();
	var SceneForm = new new Class({
		Implements: [Events, Options],
		initialize: function() {
			var self = this;
			//this.formatData();

			this.bindEvents();
			jQuery('.form-item .input-time').datetimepicker({ //时间控件
				showSecond: true,
				dateFormat: 'yy-mm-dd',
				timeFormat: 'HH:mm:ss',
				timeText: '',
				hourText: '时',
				minuteText: '分',
				secondText: '秒',
				showAnim: ''
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
			jQuery("#moveForm").validate({
				ignore: "",
				rules: {
					appearTime: {
						minlength: 1,
						maxlength: 100
					},
					type: {
						minlength: 1,
						maxlength: 4
					},
					headColor: {
						minlength: 1,
						maxlength: 4
					},
					upperColor: {
						minlength: 1,
						maxlength: 4
					},
					lowerColor: {
						minlength: 1,
						maxlength: 4
					},
					footColor: {
						minlength: 1,
						maxlength: 4
					},
					height: {
						isNumber: "#height",
						minlength: 1,
						maxlength: 4
					},
					color: {
						minlength: 1,
						maxlength: 4
					},
					gray: {
						minlength: 1,
						maxlength: 4
					},
					description: {
						minlength: 2,
						maxlength: 200
					}
				},
				success: function(label) {
					// set &nbsp; as text for IE
					label.removeClass("error");
				},
				messages: {
					appearTime: {
						minlength: "至少为两个字符",
						maxlength: "不超过100个字符"
					},
					type: {
						minlength: "至少为一个字符",
						maxlength: "不超过为四个字符"
					},
					headColor: {
						minlength: "至少为两个字符",
						maxlength: "不超过为四个字符"
					},
					upperColor: {
						minlength: "至少为两个字符",
						maxlength: "不超过为四个字符"
					},
					lowerColor: {
						minlength: "至少为两个字符",
						maxlength: "不超过为四个字符"
					},
					footColor: {
						minlength: "至少为两个字符",
						maxlength: "不超过为四个字符"
					},
					height: {
						minlength: "至少为一个字符",
						maxlength: "不超过为四个字符"
					},
					color: {
						minlength: "至少为两个字符",
						maxlength: "不超过为四个字符"
					},
					gray: {
						minlength: "至少为一个字符",
						maxlength: "不超过为四个字符"
					},
					description: {
						minlength: "至少为两个字符",
						maxlength: "不得超过100字符"
					}
				},
				submitHandler: function() {
					if (jQuery("#moveForm").find(".error").length === 0) {
						jQuery("#moveForm")[0].submit();
					} else {
						return;
					}
				}
			});
		},
		serializeForm: function(serverlize) { //表单数据json化
			var json = {};
			for (var i = 0; i < serverlize.length; i++) {
				json[serverlize[i].name] = serverlize[i].value;
			}
			return json;
		},
		bindEvents: function() {
			var self = this;
			//incidentname统一
			if (parent.window.opener.gMessJson && parent.window.opener.gMessJson.incidentName) {
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
			jQuery(document).on('click', "form .input-submit", function(e) {
				e.preventDefault();
				var formdata = self.serializeForm(jQuery("#moveForm").serializeArray()),
					id = parent.window.opener.gMessJson.medialibId,
					url = "/service/pvd/moving" + "?timestamp=" + new Date().getTime();
				var videoId = "",
					imageId = "";
				var appearTime = parent.window.opener.gMessJson.appearTime;
				if (parent.window.opener.gMessJson.fileType === "1") {
					videoId = parent.window.opener.gMessJson.medialibId;
				} else {
					imageId = parent.window.opener.gMessJson.medialibId;
					parent.window.opener.gMessJson.base64Pic = parent.window.opener.gMessJson.mediaPath;
				}

				formdata = JSON.stringify(Object.merge(formdata, {
					"videoId": videoId,
					"imageId": imageId,
					"sourceId": id,
					"remark": setRemark.getText(jQuery("#moveForm")),
					"incidentId": parent.window.opener.gMessJson.incidentId === "" ? null : parent.window.opener.gMessJson.incidentId,
					"appearTime": appearTime,
					"points": parent.window.opener.gMessJson.imageJson,
					"timeBegin": parent.window.opener.gMessJson.timeBegin,
					"timeEnd": parent.window.opener.gMessJson.timeEnd,
					"picture": parent.window.opener.gMessJson.base64Pic
				}));
				if (jQuery("#moveForm").valid() && jQuery("#moveForm").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
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
								logDict.insertMedialog('m4', incident + str + name + type + '生成运动目标结构化信息');
								if (parent.window.opener.gMessJson.originName) {
									logDict.insertMedialog('m4', parent.window.opener.gMessJson.originName + type + '的图像处理结果作为结构化信息入库');
								}
								if (parent.window.opener.gMessJson.source && parent.window.opener.gMessJson.source === "unviewlib") {
									var data = {
										"cloudId": parent.window.opener.gMessJson.cloudId,
										"mediaPath": parent.window.opener.gMessJson.mediaPath,
										"shootTime": parent.window.opener.gMessJson.shootTime,
										"fileType": parent.window.opener.gMessJson.fileType,
										"structType": "5",
										"structuredId": data.data.id
									};
									Cookie.dispose('data');
									Cookie.write('data', JSON.stringify(data));
									if (parent.window.opener.gMessJson.fileType === "1" || parent.window.opener.gMessJson.fileType === 1) {
										window.location.href = "/module/viewlibs/caselib/create_video_bak.html";
									} else {
										window.location.href = "/module/viewlibs/caselib/create_image_bak.html";
									}
								} else {
									$("#content .libbanner span").addClass("five");
									$("#content .libbanner span a:lt(4)").removeClass("current").addClass("already");
									$("#content .libbanner span a:eq(4)").removeClass("already").addClass("current");
									//发送消息给云空间
									broadCast.emit('finishToMedia', {
										pvdId: data.data.id
									});
									//组装弹框内容
									var dialogString = "<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成视图入库操作！</span><br/><span class='detail_word'>",
										orgid = "";
									dialogString = dialogString + "<a href='/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/details/struct/scene.html?origntype=scene", orgid = "";

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



	function isNumber(value, param) {
		var num = jQuery(param).val();

		if (num.test(/^((0\.)||[1-9](\d)*(\.))?(\d*)$/)) {

			return true;
		}
		return false;
	}

	function is_Number(value, param) { //包含负数
		var num = jQuery(param).val();
		if (num.test(/^-?((0\.)||[1-9](\d)*(\.))?(\d*)$/)) {
			return true;
		}
		return false;
	}

	function isinteger(value, param) {
		var num = jQuery(param).val();
		if (num.test(/^[1-9][0-9]*$/)) {
			return true;
		}
		return false;
	}

	jQuery.validator.addMethod("isNumber", function(value, element, param) {
		return this.optional(element) || isNumber(value, param);
	}, "所填信息必须为正确的整数或者小数!");

	jQuery.validator.addMethod("isinteger", function(value, element, param) {
		return this.optional(element) || isinteger(value, param);
	}, "所填信息必须为正确的整数!");

	jQuery.validator.addMethod("is_Number", function(value, element, param) {
		return this.optional(element) || is_Number(value, param);
	}, "所填信息必须为正确的数值!");
});