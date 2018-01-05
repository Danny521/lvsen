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
			//在填写结构化信息页面不显示标注工具栏
			jQuery(".video_tool").remove()
			if (parent.window.opener.gMessJson.cloud && parent.window.opener.gMessJson.cloud === "cloud") {
				mediaLink.mediaRender("cloud");
			} else {
				mediaLink.mediaRender();
			}
		}
	} catch (err) {}
	mediaLink.closeWindowtitle();
	var CarForm = new new Class({
		Implements: [Options, Events],
		options: {

		},
		initialize: function() {
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

			$.validator.addMethod("ltCurrentDate", function(value, element) {
				return this.optional(element) || (Toolkit.str2mills(value) < (new Date().getTime()));
			}, "时间必须小于当前时间");
			jQuery('#car_form').validate({
				ignore: "",
				rules: {
					appearTime: {
						ltCurrentDate: true,
						minlength: 1,
						maxlength: 100
					},
					licenseType: "required",
					licenseColor: "required",
					licenseNumber: {
						required: true,
						maxlength: 16,
						licenseNumber: true
					},
					carTypeMain: {
						required: true
					},
					carTypeSub: {
						required: true
					},
					carColor: {
						required: true
					},
					transitTime: {
						required: true,
						compareCurrent: true
					},
					driveSpeed: {
						maxlength: 10,
						positiveFloat: true
					},
					appearTime: {
						compareCurrent: true
					},
					useNature: {
						maxlength: 20
					},
					carBrand: {
						maxlength: 20,
						nameFormat: true
					},
					carModel: {
						maxlength: 20,
						nameFormat: true
					},
					carShape: {
						maxlength: 10,
						nameFormat: true
					},
					frontHood: {
						maxlength: 10,
						nameFormat: true
					},
					backHood: {
						maxlength: 10,
						nameFormat: true
					},
					wheel: {
						maxlength: 10,
						nameFormat: true
					},
					wheelTracks: {
						maxlength: 10,
						nameFormat: true
					},
					carWindow: {
						maxlength: 10,
						nameFormat: true
					},
					carRoof: {
						maxlength: 10,
						nameFormat: true
					},
					carChassis: {
						maxlength: 10,
						nameFormat: true
					},
					carFilming: {
						maxlength: 10,
						nameFormat: true
					},
					filmingColor: {
						maxlength: 10,
						nameFormat: true
					},
					transitRoad: {
						maxlength: 50,
						nameFormat: true
					}

				},

				//当没有错误时去掉error样式
				success: function(label) {
					// set &nbsp; as text for IE
					label.removeClass("error");
				},

				messages: {
					licenseType: {
						required: "请选择车辆类型"
					},
					licenseColor: {
						required: "请选择车辆颜色"
					},
					licenseNumber: {
						required: "请输入车牌号码(不能输入空格)",
						maxlength: "不能超过16个字符",
						licenseNumber: "请输入正确格式的车牌号码。例如:浙D124A1或浙D124A学或WJ1111111"
					},
					carTypeMain: {
						required: "请选择车辆类型大类"
					},
					carTypeSub: {
						required: "请选择车辆具体类型"
					},
					carColor: {
						required: "请选择车身颜色"
					},
					transitTime: {
						required: "请选择经过时间",
						compareCurrent: "输入时间大于当前时间,请重新输入"
					},
					driveSpeed: {
						maxlength: "不能超过10个字符",
						positiveFloat: "速度只可以是正整数或小数格式"
					},
					appearTime: {
						compareCurrent: "输入时间大于当前时间,请重新输入"
					},
					useNature: {
						maxlength: "输入长度不能超过20个字符"
					},
					carBrand: {
						maxlength: "输入长度不能超过20个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					carModel: {
						maxlength: "输入长度不能超过20个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					carShape: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					frontHood: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					backHood: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					wheel: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					wheelTracks: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					carWindow: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					carRoof: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					carChassis: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					carFilming: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					filmingColor: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					transitRoad: {
						maxlength: "输入长度不能超过50个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					}
				},
				submitHandler: function() {
					if ((jQuery("#car_form").find(".error").length === 0) && jQuery(".notNull").find("option:selected").val() !== '') {
						notify.success("success");
						//jQuery("#car_form")[0].submit();
					} else {
						notify.warn('车辆类型未选择！');
						return;
					}
				}
			});
			//});
			// 车辆类型级联
			new CommonCascade({
				firstSelect: "#carTypeMain",
				secondSelect: "#carTypeSub",
				path: '/module/viewlibs/caselib/inc/updateCarData.json'
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
				jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
					thumbSize: 36
				});
			}
			//this.load();
			this.bindEvents();
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
			jQuery(document).on('click', "form .input-submit", function(e) {
				e.preventDefault();
				var formdata = self.serializeForm(jQuery("#car_form").serializeArray()),
					id = parent.window.opener.gMessJson.medialibId,
					url = "/service/pvd/save_car_info" + "?timestamp=" + new Date().getTime();
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
					"remark": setRemark.getText(jQuery('#car_form')),
					"incidentId": parent.window.opener.gMessJson.incidentId === "" ? null : parent.window.opener.gMessJson.incidentId,
					"appearTime": appearTime,
					"points": parent.window.opener.gMessJson.imageJson,
					"picture": parent.window.opener.gMessJson.base64Pic,
					"timeBegin": parent.window.opener.gMessJson.timeBegin,
					"timeEnd": parent.window.opener.gMessJson.timeEnd,
					"isFakeLicense": self.isChecked(jQuery("#isFakeLicense").is(':checked'))
				}));
				if (jQuery("#car_form").valid() && jQuery("#car_form").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
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
								logDict.insertMedialog('m4', incident + str + name + type + '生成车辆结构化信息');
								if (parent.window.opener.gMessJson.originName) {
									logDict.insertMedialog('m4', parent.window.opener.gMessJson.originName + type + '的图像处理结果作为结构化信息入库');
								}
								//if是来自非视图库则直接保存，需要填写图片表单,并且没有关联案事件
								if (parent.window.opener.gMessJson.source && parent.window.opener.gMessJson.source === "unviewlib") {
									var data = {
										"cloudId": parent.window.opener.gMessJson.cloudId,
										"mediaPath": parent.window.opener.gMessJson.mediaPath,
										"shootTime": parent.window.opener.gMessJson.shootTime,
										"fileType": parent.window.opener.gMessJson.fileType,
										"structType": "2",
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
									//是来自视图库则直接保存，不填写图片表单
									$("#content .libbanner span").addClass("five");
									$("#content .libbanner span a:lt(4)").removeClass("current").addClass("already");
									$("#content .libbanner span a:eq(4)").removeClass("already").addClass("current");
									//组装弹框内容
									var dialogString = "<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成视图入库操作！</span><br/><span class='detail_word'>",
										orgid = "";
									dialogString = dialogString + "<a href='/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/details/struct/car.html?origntype=car", orgid = "";
									if (parent.window.opener.gMessJson.incidentname !== null & parent.window.opener.gMessJson.incidentname !== undefined) {
										dialogString = dialogString + "&incidentname=" + parent.window.opener.gMessJson.incidentname + "&id=" + data.data.id + "&pagetype=workbench&orgid=" + orgid + "' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close btn btn_ok input-submit' value='关闭本页'></div></div>";
									} else {
										dialogString = dialogString + "&id=" + data.data.id + "&pagetype=workbench&orgid=" + orgid + "' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close btn btn_ok input-submit' value='关闭本页'></div></div>";
									}
									//发送消息给云空间
									broadCast.emit('finishToMedia', {
										pvdId: data.data.id
									});
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
									}, 5000)
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
	/*车辆表单验证*/
	//表单校验,当没有错误时提交成功，反则失败
});