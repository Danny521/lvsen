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
					url = "/service/pvd/save_exhibit_info" + "?timestamp=" + new Date().getTime();
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
					"remark": setRemark.getText(jQuery('#exhibitForm')),
					"incidentId": parent.window.opener.gMessJson.incidentId === "" ? null : parent.window.opener.gMessJson.incidentId,
					"appearTime": appearTime,
					"points": parent.window.opener.gMessJson.imageJson,
					"timeBegin": parent.window.opener.gMessJson.timeBegin,
					"timeEnd": parent.window.opener.gMessJson.timeEnd,
					"picture": parent.window.opener.gMessJson.base64Pic
				}));

				if (jQuery("#exhibitForm").valid() && jQuery("#exhibitForm").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
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
								logDict.insertMedialog('m4', incident + str + name + type + '生成物品结构化信息');
								if (parent.window.opener.gMessJson.originName) {
									logDict.insertMedialog('m4', parent.window.opener.gMessJson.originName + type + '的图像处理结果作为结构化信息入库');
								}
								if (parent.window.opener.gMessJson.source && parent.window.opener.gMessJson.source === "unviewlib") {
									var data = {
										"cloudId": parent.window.opener.gMessJson.cloudId,
										"mediaPath": parent.window.opener.gMessJson.mediaPath,
										"shootTime": parent.window.opener.gMessJson.shootTime,
										"fileType": parent.window.opener.gMessJson.fileType,
										"structType": "3",
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

									//组装弹框内容
									var dialogString = "<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成视图入库操作！</span><br/><span class='detail_word'>",
										orgid = "";

									dialogString = dialogString + "<a href='/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/details/struct/exhibit.html?origntype=exhibit", orgid = "";

									//发送消息给云空间
									broadCast.emit('finishToMedia', {
										pvdId: data.data.id
									});

									if (parent.window.opener.gMessJson.incidentname !== null & parent.window.opener.gMessJson.incidentname !== undefined) {
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