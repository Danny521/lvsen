define([
	'/module/viewlibs/common/js/AutoComplete.js',
	'/module/viewlibs/toMediaLib/js/getFileHWF.js',
	'/module/viewlibs/caselib/js/player.js',
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
], function(AutoComplete, getFileInfo, Mplayer, broadCast) {
	jQuery(function() {

		var jsonData = Cookie.read("data");
		var dataJson = JSON.parse(jsonData);
		//使得视图库我的工作台高亮显示
		parent.jQuery('.workbench[data-id="14"]').addClass("active").siblings().removeClass("active");
		var needIncident = false;
		var createEventId = ''; //创建案事件的id
		setTimeout(function() {
			//调用播放器
			Mplayer.initPlayer({
				filename: dataJson.mediaPath
			});
		}, 500);
		getFileInfo.loadImgValue(dataJson.mediaPath);
		var fileNameType = getFileInfo.getFileFormat(dataJson.mediaPath);
		getFileInfo.fileVideoNameFramet(fileNameType);
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

		if (jQuery(".module.active>.module-body").length) { //编辑页和创建滚动条
			jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
				thumbSize: 36
			});
		}

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

		jQuery(document).on('click', '.module-head', function() { //展开收拢表单
			jQuery(this).closest(".module").addClass("active");
			jQuery(this).closest(".module").siblings().removeClass("active");
			jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
				thumbSize: 36
			});
		});

		jQuery(document).on('click', "form .before_update", function(e) {
			e.preventDefault();
			isSave = true;
			window.history.back();
		});

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

		jQuery(document).on('click', "form .next_update", function(e) {
			e.preventDefault();
			var formdata = serializeForm(jQuery("#form").serializeArray()),
				id = idFalg,
				self = $(this),
				remark = setRemark.getText(jQuery("#form"));
			//组装location
			var p = jQuery("#province").children("option:selected").val() !== "" ? jQuery("#province").children("option:selected").text() : "";
			var c = jQuery("#city").children("option:selected").val() !== "" ? jQuery("#city").children("option:selected").text() : "";
			var a = jQuery("#country").children("option:selected").val() !== "" ? jQuery("#country").children("option:selected").text() : "";
			var s = jQuery("#streets").val() !== "" ? jQuery("#streets").val().trim() : "";
			var location = p + " " + c + " " + a + " " + s;
			if (dataJson.structuredId === undefined) {
				dataJson.structuredId = "";
			}
			formdata = JSON.stringify(Object.merge(formdata, {
				"fileType": "1",
				"id": idFalg,
				"remark": remark,
				"location": location,
				"structuredId": dataJson.structuredId,
				"structuredType": dataJson.structType
			}));
			var incidentCreate = jQuery('#lineToIncident input:radio[name="createincident"]:checked').val();
			if (jQuery("#form").valid() && jQuery("#form").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
				if (needIncident) {
					if (incidentCreate === "createIncident") {
						// 跳转到创建案事件页面
						//缓存所有表单内容，到下一个页面一并提交
						var jsonData = Cookie.read("data");
						Cookie.dispose("createImageForm");
						Cookie.dispose("structuredId");
						Cookie.dispose("structuredType");
						Cookie.dispose("updatetoIncident");
						Cookie.dispose("data");
						Cookie.write("structuredId", dataJson.structuredId);
						Cookie.write("structuredType", dataJson.structType);
						Cookie.write("createImageForm", formdata);
						Cookie.write("updatetoIncident", idFalg);
						Cookie.write("data", jsonData);
						isSave = true;
						window.location.href = "/module/viewlibs/toMediaLib/create_incident.html";
					} else {
						//校验输入的案事件名称
						if (jQuery('#incidentname').attr('data-id') === '' || jQuery('#incidentname').attr('data-id') === undefined) {
							notify.error("请输入案事件名称！");
						} else {
							createEventId = jQuery('#incidentname').attr('data-id');
							var loadFileEventName = jQuery('#incidentname').attr('data-name');
							var json = formdata.substr(0, formdata.length - 1) + ',"incidentId":"' + createEventId + '"}';
							ajaxSaveLoad(json, loadFileEventName, dataJson.structuredId, dataJson.structType);
						}
					}
				} else {
					if ($(this).closest("form").valid()) {
						ajaxSaveLoad(formdata, null, dataJson.structuredId, dataJson.structType);
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
				url: '/service/pvd/storage/video/process' + "?timestamp=" + new Date().getTime(),
				data: {
					"resoureList": formdata,
					"structuredId": structuredId,
					"structuredType": structuredType
				},
				dataType: "json",
				type: "post",
				success: function(data) {
					if (data && data.code === 200) {
						notify.success("视频保存成功！");
						//改变banner 显示完成入库造作为current
						jQuery("#content .libbanner a:eq(2)").removeClass("current").addClass("already");
						jQuery("#content .libbanner span").removeClass("thr").addClass("five");
						jQuery("#content .libbanner a:eq(4)").removeClass("already").addClass("current");
						isSave = true;
						//发送消息给云空间
						broadCast.emit('finishToMedia', {
							pvdId: data.data.id
						});
						var orgid = "";
						var messagestr = "<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成视图入库操作！</span><br/><span class='detail_word'><a href='/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/details/media/video.html?fileType=1&id=";
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
								parent.window.close();
							}
						});

						$(".common-dialog .close").on("click", function() {
							isSave = true;
							parent.window.close();
						});
						//等待5秒关闭
						var timer = setInterval(function() {
							isSave = true;
							parent.window.close();
						}, 5000);
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
					return
				} else {
					if (confirm("如果点击“离开此页”，您未提交或未保存的上传数据将不会被保存")) {} else {
						return false;
					}
				}
			};
		}
		/*起始时间比较*/
		/*jQuery(document).on("blur", ".input-time:gt(1)", function() {
			jQuery(this).triggerHandler("change");
		});

		jQuery(document).on('change', '.input-time:gt(1)', function() { /*起始时间失去焦点时判断*/
		/*var id = jQuery(this).attr("id");
			var compareId = "";
			var msg1 = "";
			var msg2 = "";
			var start = jQuery("#startTime").val().trim();
			var end = jQuery("#endTime").val().trim();
			var errorElem = jQuery(this).closest(".item-box").find("label");
			if (id === 'startTime') {
				compareId = 'endTime';
				msg1 = "起始时间必须早于当前时间";
				msg2 = "起始时间必须早于结束时间";
			} else {
				compareId = 'startTime';
				msg1 = "结束时间必须早于当前时间";
				msg2 = "结束时间必须晚于开始时间";
			}
			if (dateFormat(this)) {
				if (end > start && dateFormat("#" + compareId) && compareNow("#" + compareId) && jQuery("#" + compareId).hasClass("error")) {
					jQuery("#" + compareId).removeClass("error").next("label").removeClass("error").html("");
				} else if (!compareNow(this)) {
					jQuery(this).addClass("error");
					errorElem.addClass("error").html(msg1);
					return false;
				} else if (end !== "") {
					if (end <= start) {
						jQuery(this).addClass("error");
						errorElem.addClass("error").html(msg2);
						return false;
					}
				}
			} else {
				if (jQuery(this).val().trim() !== "") {
					jQuery(this).addClass("error");
					errorElem.addClass("error").html("时间格式不正确");
				} else {
					jQuery(this).addClass("error");
					errorElem.addClass("error").html("请输入时间");
				}
				return false;
			}
			jQuery(this).removeClass("error");
			errorElem.removeClass("error").html("");
		});*/
		// 根据验证框架对表单中的数据进行字段长度和一些必要信息的验证
		jQuery("#form").validate({
			ignore: "",
			rules: {
				incidentname: "isExistIncident",
				incident: "required",
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
				province: "required",
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
				duration: {
					required: true,
					maxlength: 6,
					positiveInteger: true
				},
				enterTime: {
					required: true,
					maxlength: 50,
					datetime: true,
					compareCurrent: true
				},
				startTime: {
					required: true,
					datetime: true,
					timeCompareBig: "#endTime",
					compareCurrent: true
				},
				endTime: {
					required: true,
					datetime: true,
					compareCurrent: true,
					timeCompare: "#startTime"

				},
				width: {
					required: true,
					maxlength: 5,
					positiveInteger: true,
					compareWH: true
				},
				height: {
					required: true,
					maxlength: 5,
					positiveInteger: true,
					compareWH: true
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
				// set &nbsp; as text for IE
				label.remove();
			},
			// 对于验证失败的字段都给出相应的提示信息
			messages: {
				incident: "请输入已有案事件名称",
				fileFormat: {
					required: "请选择文件格式"
				},
				shootTime: {
					required: "请选择拍摄时间",
					datetime: "时间格式不正确",
					compareCurrent: "拍摄时间不能晚于当前时间"
				},
				category: {
					required: "请输入视频分类"
				},
				name: {
					required: "请输入题名",
					minlength: "题名至少为两个字符",
					maxlength: "题名不得超过30字符",
					nameFormat: "名称不能包含下列任何字符 \\ / : * ? \" \' < > |"
				},
				description: {
					required: "请输入视频描述",
					maxlength: "内容描述不得超过200字符"
				},
				province: {
					required: "请选择省份"
				},
				streets: {
					maxlength: "街道地址不得超过200字符"
				},

				longitude: {
					required: "请输入拍摄地点经度",
					maxlength: "拍摄地点经度不得超过12字符",
					longitude: "经度范围为-180~180之间"
				},
				latitude: {
					required: "请输入拍摄地点纬度",
					maxlength: "拍摄地点纬度不得超过12字符",
					latitude: "纬度范围为-90~90之间"
				},
				duration: {
					required: "请输入视频长度",
					maxlength: "视频长度不能超过6字符串",
					positiveInteger: "视频长度必须为正整数"
				},
				enterTime: {
					required: "请选择视频入点",
					datetime: "时间格式不正确",
					compareCurrent: "视频入点不能晚于当前时间"
				},
				startTime: {
					required: "请输入开始绝对时间",
					datetime: "时间格式不正确",
					timeCompareBig: "开始绝对时间必须早于结束绝对时间",
					compareCurrent: "开始绝对时间必须早于当前时间"
				},
				endTime: {
					required: "请输入结束绝对时间",
					datetime: "时间格式不正确",
					compareCurrent: "结束时间必须早于当前时间",
					timeCompare: "结束绝对时间必须晚于开始绝对时间"
				},
				width: {
					required: "请输入宽度",
					maxlength: "宽度不得超过5字符",
					positiveInteger: "所输入的宽度必须为正整数",
					compareWH: "宽度不得超过10000"
				},
				height: {
					required: "请输入高度",
					maxlength: "高度不得超过5字符",
					positiveInteger: "所输入的高度必须为正整数",
					compareWH: "高度不得超过10000"
				},
				device: {
					maxlength: "设备编码不得超过20个字符"
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
			}
		});

		function compareNow(elem) { //与当前时间比较
			var value = jQuery(elem).val().trim();
			var inputTime = new Date(value.substr(0, 4), value.substr(5, 2) - 1, value.substr(8, 2), value.substr(11, 2), value.substr(14, 2), value.substr(17, 2));
			var now = new Date();
			return now > inputTime;
		}

		function dateFormat(elem) {
			var value = jQuery(elem).val().trim(),
				regExp = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
			return regExp.test(value);
		}

		function serializeForm(serverlize) { //表单数据json化
			var json = {};
			for (var i = 0; i < serverlize.length; i++) {
				json[serverlize[i].name] = serverlize[i].value;
			}
			return json;
		}
	});
});