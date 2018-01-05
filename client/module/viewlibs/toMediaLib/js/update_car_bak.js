define([
	'/module/viewlibs/toMediaLib/js/medialib_link.js',
	'base.self',
	'jquery-ui-1.10.1.custom.min',
	'jquery-ui-timepicker-addon',
	'scrollbar',
	'common.cascade',
	'jquery.validate',
	'jquery.pagination',
	'permission'
	], function(medialibLink) {
	var mediaLink = new medialibLink();
	try {
		//使得视图库高亮显示
		setTimeout(function() {
			jQuery("#navigator .wrapper a[data-id='0']").removeClass("active");
			jQuery("#navigator .wrapper a[data-id='3']").addClass("active");
		}, 1000);
		if (parent.window.opener && parent.window.opener.gMessJson && parent.window.opener.gMessJson.length !== 0) {
			if (parent.window.opener.gMessJson.fileType === "2" || parent.window.opener.gMessJson.fileType === 2) {
				jQuery(".display-format ul li[data-tab='ocxbody']").remove();
				//jQuery(".entity-box div[data-tab='ocxbody']").remove();
				jQuery(".display-format ul li[data-tab='picture']").trigger("click");
			}
			//在填写结构化信息页面不显示标注工具栏
			jQuery(".video_tool").remove();
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
		options: {},
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
			//验证框架
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
					url = "/service/pvd/tempData" + "?timestamp=" + new Date().getTime();
				formdata = JSON.stringify(Object.merge(formdata, {
					"remark": setRemark.getText(jQuery("#car_form")),
					"points": parent.window.opener.gMessJson.imageJson,
					"picture": parent.window.opener.gMessJson.base64Pic,
					"lable": parent.window.opener.gMessJson.lable,
					"timeBegin": parent.window.opener.gMessJson.timeBegin,
					"timeEnd": parent.window.opener.gMessJson.timeEnd,
					"isFakeLicense": self.isChecked(jQuery("#isFakeLicense").is(':checked'))
				}));
				if (jQuery("#car_form").valid() && jQuery("#car_form").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
					jQuery.ajax({
						url: url,
						data: {
							"formData": formdata
						},
						dataType: "json",
						type: "post",
						success: function(data) {
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
								var typeUrl = "";
								if (parent.window.opener.gMessJson.fileType === "1" || parent.window.opener.gMessJson.fileType === 1) {
									typeUrl = "video";
								} else if (parent.window.opener.gMessJson.fileType === "2" || parent.window.opener.gMessJson.fileType === 2) {
									typeUrl = "image";
								}
								/*if (window.opener.gMessJson.resourceId) {
									window.opener.gMessJson.cloudId = window.opener.gMessJson.resourceId;
								}*/
								Cookie.dispose('data');
								var data = {
									"resourceId":parent.window.opener.gMessJson.resourceId,
									"cloudId": parent.window.opener.gMessJson.cloudId,
									"mediaPath": parent.window.opener.gMessJson.mediaPath,
									"shootTime": parent.window.opener.gMessJson.shootTime,
									"fileType": parent.window.opener.gMessJson.fileType,
									"medialibId": parent.window.opener.gMessJson.medialibId,
									"incidentname": parent.window.opener.gMessJson.incidentname,
									"pvdSourceId": parent.window.opener.gMessJson.pvdSourceId,
									"structType": "2",
									"path": parent.window.opener.gMessJson.path ? parent.window.opener.gMessJson.path : null,
									"tempFormId": data.data.id //存储到后端临时表单返回的id
								};
								Cookie.write('data', JSON.stringify(data));
								window.location.href = "/module/viewlibs/toMediaLib/update_" + typeUrl + "_bak.html";
								return false;
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
