define([
	'/module/viewlibs/common/js/AutoComplete.js',
	'/module/viewlibs/toMediaLib/js/getFileHWF.js',
	'broadcast',
	'base.self',
	'jquery-ui-1.10.1.custom.min',
	'jquery-ui-timepicker-addon',
	'scrollbar',
	'thickbox',
	'common.cascade',
	'jquery.validate',
	'jquery.pagination',
	'handlebars',
	'permission'
], function(AutoComplete, getFileInfo, broadCast) {
	jQuery(function() {
		//使得视图库我的工作台高亮显示
		parent.jQuery('.workbench[data-id="14"]').addClass("active").siblings().removeClass("active");
		//将要实现的是图像处理后 保存图片的跳转
		var jsonData = Cookie.read("data");
		var dataJson = JSON.parse(jsonData);
		var needIncident = false;
		$(".entity-preview img").attr("src", dataJson.mediaPath);
		getFileInfo.loadImgValue(dataJson.mediaPath);
		var fileNameType = getFileInfo.getFileFormat(dataJson.mediaPath);
		getFileInfo.fileNameFramet(fileNameType);
		var idFalg = "";
		var isSave = false;

		function timeFormat(time) {
			if (time === 0 || time === "") {
				return;
			}
			var d = new Date(time);
			var result = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
			return result;
		}
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

		jQuery(document).on('click', '#content .module-head', function() { //展开收拢表单
			jQuery(this).closest(".module").addClass("active");
			jQuery(this).closest(".module").siblings().removeClass("active");
			jQuery("#content .module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
				thumbSize: 36
			});
		});

		if (jQuery("#content .module.active>.module-body").length) { //编辑页和创建滚动条
			jQuery("#content .module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
				thumbSize: 36
			});
		}
		jQuery("#content .module.active>.module-head").trigger('click');
		//初始化自动匹配输入案事件名称
		var incidentName = new AutoComplete({
			node: "#incidentname",
			url: '/service/pvd/get_incident_menu',
			hasSelect: true,
			hasEnter: true,
			left: "0px",
			top: "24px",
			panelClass: "suggest-panel"
		});
		jQuery("#existingIncident").on('click', function() {
			if (jQuery("#existingIncident").is(':checked')) {
				jQuery("#incidentname").removeAttr('disabled');
				needIncident = true;
				jQuery("#content .libbanner a:eq(3)").addClass("already");
			}
		});
		jQuery("#createIncident").on('click', function() {
			if (jQuery("#createIncident").is(':checked')) {
				jQuery("#incidentname").removeClass('error');
				jQuery("#incidentname").next('label').hide(1);
				jQuery("#incidentname").attr('disabled', true);
				needIncident = true;
				jQuery("#content .libbanner a:gt(2)").removeClass("already");
			}
		});
		jQuery("#unIncident").on('click', function() {
			if (jQuery("#unIncident").is(':checked')) {
				jQuery("#incidentname").removeClass('error');
				jQuery("#incidentname").next('label.error').remove();
				jQuery("#incidentname").attr('disabled', true);
				needIncident = false;
				jQuery("#content .libbanner a:eq(3)").addClass("already");
			}
		});
		//默认籍贯上海市
		var content = jQuery("#content");
		var province = content.attr('data-province');
		var city = content.attr('data-city');
		jQuery('.create #province').attr('data-default', province);
		jQuery('.create #city').attr('data-default', city);


		//省市区三级地址级联
		new CommonCascade({
			firstSelect: "#province",
			secondSelect: "#city",
			thirdSelect: "#country"
		});
		/*根据验证框架对表单中的数据进行字段长度和一些必要信息的验证*/
		jQuery("#imageForm").validate({
			ignore: "",
			rules: {
				incidentname: "isExistIncident",
				fileFormat: "required",
				shootTime: {
					required: true,
					maxlength: 50,
					datetime: true,
					compareCurrent: true
				},
				category: "required",
				name: {
					required: true,
					maxlength: 30,
					nameFormat: true
				},
				description: {
					required: true,
					maxlength: 200
				},
				province: {
					required: true,
					maxlength: 50
				},
				streets: {
					maxlength: 200
				},
				longitude: {
					required: true,
					maxlength: 12,
					longitude: true
				},
				latitude: {
					required: true,
					maxlength: 12,
					latitude: true
				},
				width: {
					required: true,
					maxlength: 5,
					positiveInteger: true
				},
				height: {
					required: true,
					maxlength: 5,
					positiveInteger: true
				},
				sourceId: {
					maxlength: 2
				},
				device: {
					maxlength: 20
				},
				supplement: {
					maxlength: 30
				},
				earmark: {
					maxlength: 30
				},
				subject: {
					maxlength: 30
				},
				keywords: {
					maxlength: 30
				},
				keyman: {
					maxlength: 30
				}
			},
			success: function(label) {
				label.remove();
			},
			// 对于验证失败的字段都给出相应的提示信息
			messages: {
				fileFormat: {
					required: "请输入案件主类别"
				},
				shootTime: {
					required: "请选择拍摄日期",
					datetime: "时间格式不正确",
					compareCurrent: "拍摄日期不能晚于当前时间"
				},
				category: {
					required: "请选择分类"
				},
				name: {
					required: "请输入题名",
					maxlength: "题名信息不得超过30字符",
					nameFormat: "名称不能包含下列任何字符 \\ / : * ? \" \' < > |"
				},
				province: {
					required: "请选择省份"
				},
				streets: {
					maxlength: "街道地址不得超过200字符"
				},
				longitude: {
					required: "请输入拍摄地点经度",
					maxlength: "经度不得超过12字符",
					longitude: "经度范围为-180~180之间"
				},
				latitude: {
					required: "请输入拍摄地点纬度",
					maxlength: "纬度不得超过12字符",
					latitude: "纬度范围为-90~90之间"
				},
				description: {
					required: "请输入内容描述信息",
					maxlength: "案件描述信息不得超过200字符"
				},
				width: {
					required: "请输入宽度",
					positiveInteger: "所输入的高度必须大于0"
				},
				height: {
					required: "请输入高度",
					positiveInteger: "所输入的高度必须大于0"
				},
				device: {
					maxlength: "嫌疑人数量不得超过20个字符"
				},
				supplement: {
					maxlength: "题名补充不得超过30个字符"
				},
				earmark: {
					maxlength: "专项名不得超过230个字符"
				},
				subject: {
					maxlength: "主题词不得超过30个字符"
				},
				keywords: {
					maxlength: "关键词不得超过30个字符"
				},
				keyman: {
					maxlength: "主题人物不得超过30个字符"
				}
			},
			submitHandler: function() {
				if (jQuery("form").find(".error").length === 0) {
					jQuery("#form")[0].submit();
				} else {
					return;
				}
			}
		});

		function serializeForm(serverlize) { //表单数据json化
			var json = {};
			for (var i = 0; i < serverlize.length; i++) {
				json[serverlize[i].name] = serverlize[i].value;
			}
			return json;
		}

		jQuery(document).on('click', "form .save-info", function(e) {
			e.preventDefault();
			var formdata = serializeForm(jQuery("#imageForm").serializeArray()),
				remark = setRemark.getText(jQuery("#imageForm"));
			//组装location
			var p = jQuery("#province").children("option:selected").val() !== "" ? jQuery("#province").children("option:selected").text() : "";
			var c = jQuery("#city").children("option:selected").val() !== "" ? jQuery("#city").children("option:selected").text() : "";
			var a = jQuery("#country").children("option:selected").val() !== "" ? jQuery("#country").children("option:selected").text() : "";
			var s = jQuery("#streets").val() !== "" ? jQuery("#streets").val().trim() : "";
			var location = p + " " + c + " " + a + " " + s;
			formdata = JSON.stringify(Object.merge(formdata, {
				"fileType": "2",
				"id": idFalg.toString(),
				"remark": remark,
				"location": location
			}));
			var incidentCreate = jQuery('#lineToIncident input:radio[name="createincident"]:checked').val();
			if (jQuery("#imageForm").valid() && jQuery("#imageForm").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
				if (dataJson.structuredId === undefined) {
					dataJson.structuredId = "";
				}
				if (needIncident) {
					if (incidentCreate === "createIncident") {
						// 跳转到创建案事件页面
						//缓存所有表单内容，到下一个页面一并提交
						var json = formdata.substr(0, formdata.length - 1) + ',"path":"' + dataJson.mediaPath + '"}';
						Cookie.dispose("createImageForm");
						Cookie.dispose("structuredId");
						Cookie.dispose("structuredType");
						Cookie.write("createImageForm", json);
						Cookie.write("structuredId", dataJson.structuredId);
						Cookie.write("structuredType", dataJson.structType);
						isSave = true;
						window.location.href = "/module/viewlibs/toMediaLib/create_incident.html";
					} else {
						//校验输入的案事件名称
						if (jQuery('#incidentname').attr('data-id') === '' || jQuery('#incidentname').attr('data-id') === undefined) {
							notify.error("请输入案事件名称！");
						} else {
							loadFileEventId = jQuery('#incidentname').attr('data-id');
							var loadFileEventName = jQuery('#incidentname').attr('data-name');
							var json = formdata.substr(0, formdata.length - 1) + ',"incidentId":"' + loadFileEventId + '","path":"' + dataJson.mediaPath + '"}';
							ajaxSaveLoad(json, loadFileEventName, dataJson.structuredId, dataJson.structType);
						}
					}
				} else {
					var json = formdata.substr(0, formdata.length - 1) + ',"path":"' + dataJson.mediaPath + '"}';
					if ($(this).closest("form").valid()) {
						ajaxSaveLoad(json, null, dataJson.structuredId, dataJson.structType);
					} else {
						notify.error("请填写正确信息！");
						return;
					}
				}
			} else {
				notify.warn("请正确填写相关信息！");
			}
		});

		function ajaxSaveLoad(formdata, loadFileEventName, structuredId, structuredType) {
			jQuery.ajax({
				url: '/service/pvd/storage/image/process' + "?timestamp=" + new Date().getTime(),
				data: {
					"resoureList": formdata,
					"structuredId": structuredId,
					"structuredType": structuredType
				},
				dataType: "json",
				type: "post",
				success: function(data) {
					if (data && data.code === 200) {
						notify.success("图片保存成功！");
						if (dataJson.originName) {
							logDict.insertMedialog('m4', dataJson.originName + '图片的图像处理结果作为图片入库');
						} else {
							var name = dataJson.fileName || '';
							logDict.insertMedialog('m4', '图片' + name + '入库');
						}
						//改变banner 显示完成入库造作为current
						jQuery("#content .libbanner a:eq(2)").removeClass("current").addClass("already");
						jQuery("#content .libbanner span").removeClass("thr").addClass("five");
						jQuery("#content .libbanner a:eq(4)").removeClass("already").addClass("current");
						var orgid = "";
						isSave = true;
						//发送消息给云空间
						broadCast.emit('finishToMedia', {
							pvdId: data.data.id
						});
						var messagestr = "<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成视图入库操作！</span><br/><span class='detail_word'><a href='/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/details/media/picture.html?fileType=2&id=";
						if (loadFileEventName !== null) {
							messagestr = messagestr + data.data.id + "&incidentname=" + loadFileEventName + "&pagetype=workbench&orgid=" + orgid + "' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close btn btn_ok input-submit' value='关闭本页'></div></div>";
						} else {
							messagestr = messagestr + data.data.id + "&pagetype=workbench&orgid=" + orgid + "' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close btn btn_ok input-submit' value='关闭本页'></div></div>";
						}
						new ConfirmDialog({
							title: '提示信息',
							message: messagestr,
							showFooter: false,
							callback: function() {
								isSave = true;
								window.opener = null;
								window.open('', '_self', '');
								parent.window.close();
							}
						});
						$(".common-dialog .close").on("click", function() {
							isSave = true;
							window.opener = null;
							window.open('', '_self', '');
							parent.window.close();
						});
						setTimeout(function() {
							isSave = true;
							window.opener = null;
							window.open('', '_self', '');
							parent.window.close();
						}, 5000)
					} else {
						notify.warn("返回出错！");
					}
				},
				error: function() {
					notify.warn("数据出错！");
				}
			});
		}
		if (!JudgeChromeX()) { //window.navigator.userAgent.test('Chrome/30')) {
			document.body.onbeforeunload = function(e) {
				if (isSave) {
					return;
				} else {
					if (confirm("如果点击“离开此页”，您未提交或未保存的上传数据将不会被保存")) {} else {
						return false;
					}
				}
			};
		}
	});
});