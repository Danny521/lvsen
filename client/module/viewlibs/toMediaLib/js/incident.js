define([
	'/module/viewlibs/common/js/UploadTool.js',
	'thickbox',
	'broadcast',
	'base.self',
	'plupload',
	'common.cascade',
	'jquery.validate',
	'jquery-ui-1.10.1.custom.min',
	'jquery-ui-timepicker-addon',
	'scrollbar',
	'jquery.validate',
	'handlebars',
	'permission'
], function(UploadTool, thickbox, broadCast) {
	var IncidentMgr = new Class({

		Implements: [Events, Options],

		options: {

			mode: "create", // [ "create" |  "edit" ]

			createIncidentUrl: "/service/pvd/save_incident_info",

			editIncidentUrl: "/service/pvd/edit_incident_info",

			getIncidentUrl: "/service/pvd/get_incident_info",

			uploadContainerId: null, //弹窗创建案事件 上传插件的container Id

			callback: function(id) { //   案事件创建完成的回调函数
				var param = {
					id: id,
					incidentname: jQuery("#incident_name").val().trim(),
					pagetype: "workbench",
					orgid: ""
				};
				window.location.href = "/module/viewlibs/details/incident/incident_detail.html?" + jQuery.param(param);

			}

		},
		initialize: function(options) {
			this.setOptions(options);
			var self = this;
			self.addHelper();

			if (self.options.mode === "create") {
				self.createIncident();
			} else if (self.options.mode === "edit") {
				var id = parseInt(Toolkit.paramOfUrl(window.location.href).id);
				if (id) {
					self.editIncident(id);
				}
			}
		},
		createIncident: function() {
			var self = this;
			jQuery(".form-panel").html(self.template({
				"incident": {}
			}));
			self.bindEvent();
		},
		editIncident: function(id) {
			var self = this;
			jQuery.ajax({
				url: self.options.getIncidentUrl,
				type: "get",
				dataType: "json",
				cache: false,
				data: {
					"id": id,
					"rs": 0
				},
				success: function(res) {
					if (res.code === 200 && res.data.incident) {
						jQuery(".form-panel").html(self.template({
							"incident": res.data.incident
						}));

						var imageUrl = jQuery.trim(res.data.incident.picture);
						if (imageUrl === "") {
							imageUrl = "/module/common/images/upload.png";
						}

						jQuery("#incident_cover").attr("src", imageUrl);
						jQuery(".cover-box a.thickbox").attr("href", imageUrl);

						self.bindEvent();
					} else {
						notify.warn("获取案事件信息失败！");
					}
				}
			});
		},
		/*
		 *	添加模板助手
		 */
		addHelper: function() {
			Handlebars.registerHelper("selected", function(value1, value2, options) {
				if (value1 === value2) {
					return "selected";
				}
			});

			//	毫秒转日期
			Handlebars.registerHelper("mills2str", function(num) {
				return Toolkit.mills2datetime(num);
			});

			this.template = Handlebars.compile(jQuery("#incidentTemplate").html());
		},

		/* 
		 *	绑定页面的相关事件
		 */
		bindEvent: function() {
			var self = this;
			// 权限控制
			permission.reShow();

			// 地址级联
			new CommonCascade({
				firstSelect: '#incident_province',
				secondSelect: '#incident_city',
				thirdSelect: '#incident_country'

			});

			// 案事件副类别
			new CommonCascade({
				firstSelect: "#incident_classifyPartFirst",
				secondSelect: "#incident_classifyPartSecond",
				path: "/module/viewlibs/toMediaLib/inc/incident_subcategory.json"
			});

			// 初始化上传插件
			new UploadTool({
				"uploadContainerId": self.options.uploadContainerId,
				"fileUploaded": function(file, res) {
					jQuery("#incident_cover").attr("src", res.picture);
					jQuery("#incident_cover").closest("a.thickbox").attr("href", res.picture);
				}
			})

			// 手风琴折叠效果
			jQuery(".accordion").find(".module-head").on("click", function() {
				jQuery(this).closest("div.module").addClass("active");
				jQuery(this).closest("div.module").siblings().removeClass("active");
			});

			// 查看大图
			thickbox();

			// 时间控件
			jQuery(".input-date-time").datetimepicker({
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

			// 案事件创建面板 关闭
			if (jQuery("#incidentPanel").length > 0) {
				jQuery("#incidentPanel .close-panel").click(function(event) {
					jQuery(".incident-panel-group").hide();
				});

			}

			// 提交表单
			self.validateForm(function() {
				var incident = self.getFormData();
				var opt = self.options;
				var url = opt.mode === "create" ? opt.createIncidentUrl : opt.editIncidentUrl;
				var action = self.options.mode === "create" ? "创建" : "编辑";

				jQuery.ajax({
					url: url,
					type: "post",
					data: {
						"incidentInfo": JSON.stringify(incident)
					},
					dataType: "json",
					beforeSend: function() {
						jQuery("#incident_save").attr("disabled", "disabled");
					},
					success: function(res) {
						if (res.code === 200) {
							// notify.success("案事件"+action+"成功！");
							self.options.callback(res.data.id);
						} else {
							notify.info("案事件" + action + "失败！");
						}
					},
					complete: function() {
						jQuery("#incident_save").removeAttr("disabled");
					}
				});

			});


		},
		/*
		 *	表单验证
		 */
		validateForm: function(callback) {
			jQuery.validator.setDefaults({
				invalidHandler: function() {
					return false;
				},
				ignore: "",
				errorPlacement: function(error, element) {
					if (element.is(".select")) {
						error.insertAfter(element);
						error.addClass("for-select");
					} else {
						error.insertAfter(element);
					}
				},
				submitHandler: function() {
					if (jQuery("#incidentForm").valid()) {
						callback();
						return false;
					} else {
						notify.info("请正确填写相关信息！");
					}
					return false;
				}
			});

			jQuery("#incidentForm").validate({
				rules: {
					associateId: {
						maxlength: 50,
						departmentCode: true,
						remote: {
							url: "/service/pvd/is_HasNo",
							type: "post",
							data: {
								associateId: function() {
									return jQuery("#incident_associateId").val().trim();
								}
							}
						}
					},
					name: {
						required: true,
						maxlength: 100
					},
					category: {
						required: true,
						maxlength: 2
					},
					timeUpper: {
						required: true,
						maxlength: 50,
						datetime: true,
						compareCurrent: true,
						timeCompareBig: "#incident_timeLower"
					},
					timeLower: {
						required: true,
						maxlength: 50,
						datetime: true,
						compareCurrent: true,
						timeCompareSmall: "#incident_timeUpper"
					},
					province: {
						required: true,
					},
					streets: {
						maxlength: 200
					},
					description: {
						maxlength: 200
					},
					suspectCount: {
						positiveInteger: true,
						maxlength: 2
					},
					crimeMethod: {
						maxlength: 200
					},
					reporter: {
						maxlength: 20
					},
					reporterCompany: {
						maxlength: 100
					},
					archive: {
						maxlength: 50
					},
					reporterCardnumb: {
						identificationSelect: "#incident_reporterCardtype",
						maxlength: 50
					}
				},
				success: function(label) {
					label.remove();
				},
				// 对于验证失败的字段都给出相应的提示信息
				messages: {
					associateId: {
						maxlength: "不超过50个字符",
						departmentCode: "由字母数字组成"
					},
					name: {
						required: "请输入案事件名",
						maxlength: "不超过100字符",
						nameFormat: "格式不正确"
					},
					category: {
						required: "请输入案事件类别"
					},
					timeUpper: {
						required: "请输入起始时间",
						datetime: "时间格式不正确",
						compareCurrent: "时间大于当前时间",
						timeCompareBig: "大于下限时间"
					},
					timeLower: {
						required: "请输入结束时间",
						datetime: "时间格式不正确",
						compareCurrent: "时间大于当前时间",
						timeCompareSmall: "小于上限时间"
					},
					province: {
						required: "请选择省份"
					},
					streets: {
						maxlength: "不超过200个字符"
					},
					description: {
						required: "请输入案件描述信息",
						maxlength: "不超过200字符"
					},
					suspectCount: {
						positiveInteger: "数量只能为正整数",
						maxlength: "不超过2个字符"
					},
					crimeMethod: {
						maxlength: "不超过200个字符"
					},
					reporter: {
						maxlength: "不超过20个字符"
					},
					reporterCompany: {
						maxlength: "不超过100个字符"
					},
					archive: {
						maxlength: "不超过50个字符"
					},
					reporterCardnumb: {
						identificationSelect: "格式不对",
						maxlength: "不超过50个字符"
					}
				}
			});
		},
		/*
		 *	获取表单数据
		 */
		getFormData: function() {
			var incident = {};
			var arr = jQuery("#incidentForm").serializeArray();
			for (var i = arr.length - 1; i >= 0; i--) {
				incident[arr[i].name] = jQuery.trim(arr[i].value);
			}

			incident.picture = jQuery("#incident_cover").attr("data-default") === jQuery("#incident_cover").attr("src") ? "" : jQuery("#incident_cover").attr("src");
			incident.id = jQuery("#incident_id").val();

			// 构造地址字符串
			var p = jQuery("#incident_province").children("option:selected").val() !== "" ? jQuery("#incident_province").children("option:selected").text() : "";
			var c = jQuery("#incident_city").children("option:selected").val() !== "" ? jQuery("#incident_city").children("option:selected").text() : "";
			var a = jQuery("#incident_country").children("option:selected").val() !== "" ? jQuery("#incident_country").children("option:selected").text() : "";
			var s = jQuery("#incident_streets").val().trim() !== "" ? jQuery("#incident_streets").val().trim() : "";
			incident.location = p + " " + c + " " + a + " " + s;
			incident.remark = this.buidIndexStr();

			return incident;
		},
		/*
		 *	构建检索字符串
		 */
		buidIndexStr: function() {
			var arr = [];
			jQuery("#incidentForm").find('select option:selected').each(function(index, item) {
				if (jQuery(item).val() !== "") {
					arr.push(jQuery(item).text());
				}
			});

			jQuery("#incidentForm").find('input:not(.input-date-time)').each(function(index, item) {
				arr.push(jQuery.trim(jQuery(item).val()));
			});

			return jQuery.trim(arr.slice(0, -2).join(" "));
		}

	});

	function ajaxSaveLoad(formdata) {
		jQuery.ajax({
			url: '/service/pvd/storage/image/process' + "?timestamp=" + new Date().getTime(),
			data: {
				"resoureList": formdata,
				"structuredId": Cookie.read("structuredId"),
				"structuredType": Cookie.read("structuredType")
			},
			dataType: "json",
			type: "post",
			success: function(data) {
				if (data && data.code === 200) {
					notify.success("视图保存成功！");
					//改变banner 显示完成入库造作为current
					jQuery("#content .libbanner a:eq(3)").removeClass("current").addClass("already");
					jQuery("#content .libbanner span").removeClass("four").addClass("five");
					jQuery("#content .libbanner a:eq(4)").removeClass("already").addClass("current");
					var incidentname = jQuery("#incident_name").val().trim();

					//发送消息给云空间
					broadCast.emit('finishToMedia', {
						pvdId: data.data.id
					});

					var dialogString = "<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成视图入库操作！</span><br/><span class='detail_word'><a href='/module/viewlibs/details/media/picture.html?fileType=2",
						orgid = "";
					dialogString = dialogString + "&incidentname=" + incidentname + "&id=" + data.data.id + "&pagetype=workbench&orgid=" + orgid + "' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close btn btn_ok input-submit' value='关闭本页'></div></div>";
					new ConfirmDialog({
						title: '提示信息',
						message: dialogString,
						callback: function() {
							window.opener = null;
							window.open('', '_self', '');
							window.close();
						}
					});
					$(".common-dialog .close").on("click", function() {
						window.opener = null;
						window.open('', '_self', '');
						window.close();
					});
					setTimeout(function() {
						window.opener = null;
						window.open('', '_self', '');
						window.close();
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

	function ajaxSavelibCreateIncident(formdata, updatetoIncident) {
		var yunData = Cookie.read("yunData");
		yunData = yunData.split(',');
		var sid = updatetoIncident == "undefined" || updatetoIncident == undefined ? null : updatetoIncident;
		jQuery.ajax({
			url: '/service/pvd/storage' + "?timestamp=" + new Date().getTime(),
			data: {
				"sid": sid, //结构化临时数据标识
				"stype": yunData[0], //结构化类型（人1车2物3场景4）
				"fid": "", //视图资源临时数据标识
				"ftype": yunData[3], //视图资源类型（视频1图片2）
				"file": formdata, //视图资源表单，新建案件穿空
				"incident": "", //案件表单，不新建案件穿空
				"cloudSid": yunData[1] ? yunData[1] : null, //云空间结构化标识，没有穿空
				"cloudFid": yunData[2] ? yunData[2] : null //云空间视图文件标识，没有穿空
			},
			dataType: "json",
			type: "post",
			success: function(data) {
				if (data && data.code === 200) {
					notify.success("视图保存成功！");
					//改变banner 显示完成入库造作为current
					jQuery("#content .libbanner a:eq(3)").removeClass("current").addClass("already");
					jQuery("#content .libbanner span").removeClass("four").addClass("five");
					jQuery("#content .libbanner a:eq(4)").removeClass("already").addClass("current");
					var incidentname = jQuery("#incident_name").val().trim();
					var dialogString = "<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成视图入库操作！</span><br/><span class='detail_word'>",
						orgid = "";
					if ((yunData[3] + '') === "1") {
						dialogString = dialogString + "<a href='/module/viewlibs/details/media/video.html?fileType=1";
					} else {
						dialogString = dialogString + "<a href='/module/viewlibs/details/media/picture.html?fileType=2";
					}
					//发送消息给云空间
					broadCast.emit('finishToMedia', {
						pvdId: data.data.fileId
					});
					dialogString = dialogString + "&incidentname=" + incidentname + "&id=" + data.data.fileId + "&pagetype=workbench&orgid=" + orgid + "' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close btn btn_ok input-submit' value='关闭本页'></div></div>";
					new ConfirmDialog({
						title: '提示信息',
						message: dialogString,
						callback: function() {
							window.opener = null;
							window.open('', '_self', '');
							window.close();
							window.top && window.top.close();
						}
					});

					$(".common-dialog .close").on("click", function() {
						window.opener = null;
						window.open('', '_self', '');
						window.close();
						window.top && window.top.close();
					});
					//等待5秒关闭
					var timer = setInterval(function() {
						window.opener = null;
						window.open('', '_self', '');
						window.close();
						window.top && window.top.close();
					}, 5000);
				}
			},
			error: function() {
				notify.warn("数据出错！");
			}
		});
	}

	jQuery(function() {
		new IncidentMgr({
			"mode": "create",
			"callback": function(incidentid) {
				loadFileEventId = incidentid;
				var jsonData = Cookie.read("createImageForm");
				var updatetoIncident = Cookie.read("updatetoIncident");
				var json = jsonData.substr(0, jsonData.length - 1) + ',"incidentId":"' + loadFileEventId + '"}';
				if (updatetoIncident) { //从图像研判跳过来的
					ajaxSavelibCreateIncident(json, updatetoIncident);
				} else { //从图像处理保存为图片跳过来的
					ajaxSaveLoad(json);
				}

			}
		});
	});
});