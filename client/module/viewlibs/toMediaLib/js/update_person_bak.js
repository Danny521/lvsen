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
	//使得视图库高亮显示
	setTimeout(function() {
		jQuery("#navigator .wrapper a[data-id='0']").removeClass("active");
		jQuery("#navigator .wrapper a[data-id='3']").addClass("active");
	}, 1000);
	if (parent.window.opener && parent.window.opener.gMessJson) {
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
				jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
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
						if(typeof data === "string"){
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
			var option = "<option value=''>---请选择--</option>",
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
				path: '/module/viewlibs/caselib/inc/medialib/victim_category.json'

			});

			new CommonCascade({
				firstSelect: '#professionMain',
				secondSelect: '#professionSub',
				path: '/module/viewlibs/caselib/inc/medialib/profession_data.json'

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
					id = parent.window.opener.gMessJson.medialibId,
					videoId = "",
					imageId = "",
					url = "/service/pvd/tempData" + "?timestamp=" + new Date().getTime();

				if (parent.window.opener.gMessJson.fileType === "2") {
					videoId = "",
					imageId = parent.window.opener.gMessJson.medialibId
				} else if (parent.window.opener.gMessJson.fileType === "1") {
					videoId = parent.window.opener.gMessJson.medialibId,
					imageId = ""
				}
				formdata = JSON.stringify(Object.merge(formdata, {
					"remark": setRemark.getText(jQuery("#form")),
					"points": parent.window.opener.gMessJson.imageJson,
					"picture": parent.window.opener.gMessJson.base64Pic,
					"lable": parent.window.opener.gMessJson.lable,
					"timeBegin": parent.window.opener.gMessJson.timeBegin,
					"timeEnd": parent.window.opener.gMessJson.timeEnd,
					"isDriver": self.isChecked(jQuery("#isDriver").is(':checked')),
					"isForeigner": self.isChecked(jQuery("#isForeigner").is(':checked')),
					"isTerrorist": self.isChecked(jQuery("#isTerrorist").is(':checked')),
					"isWorker": self.isChecked(jQuery("#isWorker").is(':checked')),
					"isCriminal": self.isChecked(jQuery("#isCriminal").is(':checked')),
					"isDetain": self.isChecked(jQuery("#isDetain").is(':checked')),
					"isVictim": self.isChecked(jQuery("#isVictim").is(':checked'))
				}));
				if (jQuery("#form").valid() && jQuery("#form").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
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
									"structType": "1",
									"path": parent.window.opener.gMessJson.path ? parent.window.opener.gMessJson.path : null,
									"tempFormId": data.data.id //存储到后端临时表单返回的id
								};
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
});
