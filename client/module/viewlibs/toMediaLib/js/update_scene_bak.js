define([
	'/module/viewlibs/toMediaLib/js/medialib_link.js',
	'base.self',
	'jquery-ui-1.10.1.custom.min',
	'jquery-ui-timepicker-addon',
	'scrollbar',
	'common.cascade',
	'jquery.validate',
	'jquery.pagination',
	'nativePlayer',
	'player',
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
			jQuery(".video_tool").remove()
			if (parent.window.opener.gMessJson.cloud && parent.window.opener.gMessJson.cloud === "cloud") {
				//云管理跳转,传值页面显示
				mediaLink.mediaRender("cloud");
			} else {
				//非云管理跳转，传值页面显示
				mediaLink.mediaRender();
			}
		}
	} catch (err) {}

	mediaLink.closeWindowtitle();

	var SceneForm = new new Class({
		Implements: [Events, Options],
		initialize: function() {
			var self = this;
			this.bindEvents();
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
				jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
					thumbSize: 36
				});
			}


			$.validator.addMethod("ltCurrentDate", function(value, element) {
				return this.optional(element) || (Toolkit.str2mills(value) < (new Date().getTime()));
			}, "时间必须小于当前时间");
			jQuery("#scene-form").validate({
				ignore: "",
				rules: {
					appearTime: {
						ltCurrentDate: true,
						minlength: 1,
						maxlength: 100
					},

					categoryMain: {},
					categorySub: {},
					weather: {
						minlength: 1,
						maxlength: 50
					},
					description: {
						minlength: 1,
						maxlength: 200
					},
					sceneChart: {
						minlength: 1,
						maxlength: 20
					},
					sceneWind: {
						minlength: 1,
						maxlength: 10
					},
					sceneLight: {
						minlength: 1,
						maxlength: 10
					},
					sceneCondition: {
						minlength: 1,
						maxlength: 10
					},
					sceneTemperature: {
						is_Number: "#sceneTemperature",
						minlength: 1,
						maxlength: 60
					},
					sceneHumidity: {
						isNumber: "#sceneHumidity",
						minlength: 1,
						maxlength: 60
					},
					stuffDensity: {
						isinteger: "#stuffDensity",
						minlength: 1,
						maxlength: 60
					},
					sceneImportant: {
						isinteger: "#sceneImportant",
						minlength: 1,
						maxlength: 60
					},
					crowdDensity: {
						isNumber: "#crowdDensity",
						minlength: 1,
						maxlength: 60
					}
				},
				success: function(label) {
					// set &nbsp; as text for IE
					label.removeClass("error");
				},
				messages: {
					appearTime: {
						minlength: "至少为两个字符",
						maxlength: "不得超过100字符"
					},
					category: {
						//required:"请输入处所分类"
						minlength: "至少为两个字符",
						maxlength: "不得超过10个字符"
					},
					weather: {
						minlength: "至少为一个字符",
						maxlength: "不得超过10个字符"
					},
					sceneChart: {
						minlength: "至少为两个字符",
						maxlength: "不得超过20个字符"
					},
					description: {
						minlength: "至少为两个字符",
						maxlength: "不得超过200字符"
					},
					sceneWind: {
						minlength: "至少为两个字符",
						maxlength: "不得超过10个字符"
					},
					sceneLight: {
						minlength: "至少为两个字符",
						maxlength: "不得超过10个字符"
					},
					sceneCondition: {
						minlength: "至少为两个字符",
						maxlength: "不得超过10个字符"
					},
					sceneTemperature: {
						minlength: "至少为两个字符",
						maxlength: "不得超过60个字符"
					},
					sceneHumidity: {
						minlength: "至少为两个字符",
						maxlength: "不得超过60个字符"
					},
					stuff_density: {
						minlength: "至少为两个字符",
						maxlength: "不得超过60个字符"
					},
					crowdDensity: {
						minlength: "至少为两个字符",
						maxlength: "不得超过60个字符"
					},
					sceneImportant: {
						minlength: "至少为两个字符",
						maxlength: "不得超过60个字符"
					}
				},
				submitHandler: function() {
					if (jQuery("#scene-form").find(".error").length === 0) {
						jQuery("#scene-form")[0].submit();
					} else {
						return;
					}
				}
			});
			new CommonCascade({
				firstSelect: "#categoryMain",
				secondSelect: "#categorySub",
				path: '/module/viewlibs/caselib/inc/scene.json'
			});
			//this.getVideoInfo();
			if (jQuery(".module.active>.module-body").length) { //编辑页和创建滚动条
				jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
					thumbSize: 36
				});
			}
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
			if (parent.window.opener.gMessJson.incidentName) {
				parent.window.opener.gMessJson.incidentname = parent.window.opener.gMessJson.incidentName;
			}
			jQuery(document).on('click', "form .input-submit", function(e) {
				e.preventDefault();
				var formdata = self.serializeForm(jQuery("#scene-form").serializeArray()),
					id = parent.window.opener.gMessJson.medialibId,
					url = "/service/pvd/tempData" + "?timestamp=" + new Date().getTime();
				formdata = JSON.stringify(Object.merge(formdata, {
					"remark": setRemark.getText(jQuery("#scene-form")),
					"points": parent.window.opener.gMessJson.imageJson,
					"picture": parent.window.opener.gMessJson.base64Pic,
					"lable": parent.window.opener.gMessJson.lable,
					"timeBegin": parent.window.opener.gMessJson.timeBegin,
					"timeEnd": parent.window.opener.gMessJson.timeEnd
				}));
				if (jQuery("#scene-form").valid() && jQuery("#scene-form").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
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
								Cookie.dispose('data');
								/*if (window.opener.gMessJson.resourceId) {
									window.opener.gMessJson.cloudId = window.opener.gMessJson.resourceId;
								}*/
								var data = {
									"resourceId":parent.window.opener.gMessJson.resourceId,
									"cloudId": parent.window.opener.gMessJson.cloudId,
									"mediaPath": parent.window.opener.gMessJson.mediaPath,
									"shootTime": parent.window.opener.gMessJson.shootTime,
									"fileType": parent.window.opener.gMessJson.fileType,
									"medialibId": parent.window.opener.gMessJson.medialibId,
									"incidentname": parent.window.opener.gMessJson.incidentname,
									"pvdSourceId": parent.window.opener.gMessJson.pvdSourceId,
									"structType": "4",
									"path": parent.window.opener.gMessJson.path ? parent.window.opener.gMessJson.path : null,
									"tempFormId": data.data.id //存储到后端临时表单返回的id
								};
								// var data = window.opener.gMessJson.cloudId + "," + window.opener.gMessJson.mediaPath + "," + window.opener.gMessJson.shootTime + "," + window.opener.gMessJson.fileType + "," + window.opener.gMessJson.medialibId + ",4,"; //结构化类型 场景是4
								Cookie.write('data', JSON.stringify(data));
								window.location.href = "/module/viewlibs/toMediaLib/update_" + typeUrl + "_bak.html";
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
