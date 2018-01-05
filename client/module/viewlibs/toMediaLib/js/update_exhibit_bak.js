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
	var ExhibitForm = new new Class({
		Implements: [Options, Events],
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
			//});
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
			//表单验证
			$.validator.addMethod("ltCurrentDate", function(value, element) {
				return this.optional(element) || (Toolkit.str2mills(value) < (new Date().getTime()));
			}, "时间必须小于当前时间");
			jQuery("#exhibitForm").validate({
				ignore: "",
				rules: {
					appearTime: {
						ltCurrentDate: true,
						minlength: 1,
						maxlength: 100
					},
					name: {
						required: true,
						maxlength: 200,
						nameFormat: true
					},
					shape: {
						required: true,
						maxlength: 20

					},
					color: "required",
					size: {
						maxlength: 4,
						sizeFormat: true
					},
					material: {
						maxlength: 200
					},
					feature: {
						maxlength: 200
					},
					toolsType: {
						maxlength: 10
					},
					evidenceType: {
						maxlength: 5
					},
					evidenceForm: {
						maxlength: 2
					}


				},
				success: function(label) {
					// set &nbsp; as text for IE
					label.remove();
				},
				messages: {
					name: {
						required: "请输入物品名称",
						maxlength: "请不要超过200字符",
						nameFormat: "名称不能包含下列任何字符 \\ / : * ? \" \' < > |"
					},
					shape: {
						required: "请输入物品形状",
						maxlength: "请不要超过10字符"
					},
					color: "请选择颜色",
					size: {
						maxlength: "请不要超过4个字符",
						sizeFormat: "请不要输入负数"
					},
					material: {
						maxlength: "请不要超过200个字符"
					},
					feature: {
						maxlength: "请不要超过200个字符"
					},
					toolsType: {
						maxlength: "请不要超过10个字符"
					},
					evidenceType: {
						maxlength: "请不要超过5个字符"
					},
					evidenceForm: {
						maxlength: "请不要超过2个字符"
					}
				},
				submitHandler: function() {
					if (jQuery("#exhibitForm").find(".error").length === 0) {
						jQuery("#exhibitForm")[0].submit();
					} else {
						return;
					}
				}
			});
			this.bindEvents();
			self.linkage();
		},
		linkage: function() { //联动
			//二级联动
			new CommonCascade({
				firstSelect: '#categoryMain',
				secondSelect: '#categorySub',
				path: '/module/viewlibs/caselib/inc/relateexhibit.json'
			});
			new CommonCascade({
				firstSelect: '#weaponTypeMain',
				secondSelect: '#weaponTypeSub',
				path: '/module/viewlibs/caselib/inc/exhibitweapon.json'
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
			if (parent.window.opener.gMessJson.incidentName) {
				parent.window.opener.gMessJson.incidentname = parent.window.opener.gMessJson.incidentName;
			}
			jQuery(document).on('click', "form .input-submit", function(e) {
				e.preventDefault();
				var formdata = self.serializeForm(jQuery("#exhibitForm").serializeArray()),
					id = parent.window.opener.gMessJson.medialibId,
					url = "/service/pvd/tempData" + "?timestamp=" + new Date().getTime();
				formdata = JSON.stringify(Object.merge(formdata, {
					"remark": setRemark.getText(jQuery("#exhibitForm")),
					"points": parent.window.opener.gMessJson.imageJson,
					"picture": parent.window.opener.gMessJson.base64Pic,
					"lable": parent.window.opener.gMessJson.lable,
					"timeBegin": parent.window.opener.gMessJson.timeBegin,
					"timeEnd": parent.window.opener.gMessJson.timeEnd
				}));

				if (jQuery("#exhibitForm").valid() && jQuery("#exhibitForm").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
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
									"path": parent.window.opener.gMessJson.path ? parent.window.opener.gMessJson.path : null,
									"structType": "3",
									"tempFormId": data.data.id //存储到后端临时表单返回的id
								};
								// var data = window.opener.gMessJson.cloudId + "," + window.opener.gMessJson.mediaPath + "," + window.opener.gMessJson.shootTime + "," + window.opener.gMessJson.fileType + "," + window.opener.gMessJson.medialibId + ',3,'; //结构化类型 物品是3
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
