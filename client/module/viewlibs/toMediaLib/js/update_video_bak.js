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
	], function(AutoComplete,getFileInfo,Mplayer,broadCast) {
	jQuery(function() {

		var jsonData = Cookie.read("data");
		var	dataJson = JSON.parse(jsonData);
		var thumbnail="";
		//使得视图库高亮显示
		setTimeout(function(){
			jQuery("#navigator .wrapper a[data-id='0']").removeClass("active");
			jQuery("#navigator .wrapper a[data-id='3']").addClass("active");
		},1000);
		var needIncident = false;
		var createEventId = '';  //创建案事件的id
		Mplayer.initPlayer({
			filename: dataJson.mediaPath
		}, function() {
			//调用播放器
			var cloudVPic = Mplayer.getThumbnailInfo();
			//console.log(cloudVPic);
			base64ToUrl(encodeURI(cloudVPic));
		});

		//getFileInfo.loadImgValue(dataJson.mediaPath);
		var fileNameType = getFileInfo.getFileFormat(dataJson.mediaPath);
		getFileInfo.fileVideoNameFramet(fileNameType);
		//默认籍贯上海市
		if (window.parent) {
			var content = document.getElementById("content");
			var province = content.getAttribute('data-province');
			var city = content.getAttribute('data-city');
			jQuery('.create #province').attr('data-default', province);
			jQuery('.create #city').attr('data-default', city);

		}
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
			showAnim: '',
			maxDate: new Date()
		});
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
		jQuery("#existingIncident").on('click',function(){
			if(jQuery("#existingIncident").is(':checked')){
				jQuery("#incidentname").removeAttr('disabled');
				needIncident = true;
				jQuery("#content .libbanner a:eq(3)").addClass("already");
			}
		});
		jQuery("#createIncident").on('click',function(){
			if(jQuery("#createIncident").is(':checked')){
				jQuery("#incidentname").removeClass('error');
				jQuery("#incidentname").next('label').hide(1);
				jQuery("#incidentname").attr('disabled', true);
				needIncident = true;
				jQuery("#content .libbanner a:gt(2)").removeClass("already");
			}
		});
		jQuery("#unIncident").on('click',function(){
			if(jQuery("#unIncident").is(':checked')){
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
				self = $(this),
				remark = setRemark.getText(jQuery("#form"));
			//组装location
			var p = jQuery("#province").children("option:selected").val() !== "" ? jQuery("#province").children("option:selected").text() : "";
			var c = jQuery("#city").children("option:selected").val() !== "" ? jQuery("#city").children("option:selected").text() : "";
			var a = jQuery("#country").children("option:selected").val() !== "" ? jQuery("#country").children("option:selected").text() : "";
			var s = jQuery("#streets").val() !== "" ? jQuery("#streets").val().trim() : "";
			var location = p + " " + c + " " + a + " " + s;
			formdata = JSON.stringify(Object.merge(formdata, {
				"fileType": "1",
				"remark": remark,
				"location":location,
				"path":dataJson.base64Pic?dataJson.base64Pic:dataJson.path //图片路径
			}));
			if(thumbnail){
				formdata = formdata.substr(0,formdata.length -1) +',"thumbnail":"'+thumbnail+'"}';
			}
			var incidentCreate =jQuery('#lineToIncident input:radio[name="createincident"]:checked').val();
			if (jQuery("#form").valid() && jQuery("#form").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
				if(needIncident){
					if(incidentCreate === "createIncident"){
						// 跳转到创建案事件页面
						//缓存所有表单内容，到下一个页面一并提交
						var jsonData = Cookie.read("data");
						//1表示视图资源类型（视频1图片2）
						var yunData =[dataJson.structType,dataJson.resourceId,dataJson.cloudId,1];
						Cookie.write("createImageForm",formdata);
						Cookie.write("updatetoIncident",dataJson.tempFormId);
						Cookie.write("yunData",yunData);
						Cookie.write("data",jsonData);
						isSave = true;  //创建案事件的时候阻止刷新函数提示
						window.location.href = "/module/viewlibs/toMediaLib/create_incident.html";
					}else{
						//校验输入的案事件名称
						if(jQuery('#incidentname').attr('data-id') === '' || jQuery('#incidentname').attr('data-id') === undefined){
							notify.error("请输入案事件名称！");
						}else{
							createEventId = jQuery('#incidentname').attr('data-id');
							var loadFileEventName = jQuery('#incidentname').attr('data-name');
							var json = formdata.substr(0,formdata.length -1) +',"incidentId":"'+createEventId+'"}';
							dataJson.incidentName=loadFileEventName;
							ajaxSaveLoad(json);
						}
					}
				}else{
					if ($(this).closest("form").valid()) {
						ajaxSaveLoad(formdata);
					} else {
						notify.error("请填写正确信息！");
						return;
					}
				}

			} else {
				notify.warn("请正确填写相关信息！");
			}
		});

		//将base64图片存储转化为图片url
		function base64ToUrl(base64Str) {
			var imagePath;
			var that = this;
			$.ajax({
				url: "/service/pvd/upload/base64",
				type: "post",
				dataType: "json",
				data: {
					"picture": base64Str
				},
				success: function(res) {
					if (res.code === 200) {
						thumbnail= res.data.path;
					} else if (res.code === 500) {
						notify.error(res.data.message);
					} else {
						notify.warn('图片转换异常! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
					}
				},
				error: function(xhr, textStatus, errorThrown) {
					// 如果http状态为200，说明后台返回数据成功，但数据格式错误
					if (xhr.status === 200) {
						notify.warn('图片转换异常! 数据格式错误');
					}
					// 其它状态为HTTP错误状态
					else {
						(xhr.status !== 0) && notify.warn('图片转换异常! HTTP状态码: ' + xhr.status);
					};
				}
			});
		}
		function ajaxSaveLoad(formdata){
			//云空间导入的视频入库的时候抓取的缩略图
			var sid = dataJson.tempFormId =="undefined"|| dataJson.tempFormId == undefined ? null:dataJson.tempFormId;
			jQuery.ajax({
				url: '/service/pvd/storage' + "?timestamp=" + new Date().getTime(),
				data: {
					"sid": sid,   //结构化临时数据标识
					"stype": dataJson.structType,   //结构化类型（人1车2物3场景4）
					"fid":"",      //视图资源临时数据标识
					"ftype":1,     //视图资源类型（视频1图片2）
					"file":formdata,      //视图资源表单，新建案件穿空
					"incident":"",    //案件表单，不新建案件穿空
					"cloudFid":dataJson.resourceId?dataJson.resourceId:null,    //云空间视图文件标识，没有穿空
					"cloudSid":dataJson.cloudId?dataJson.cloudId:null   //云空间结构化标识，没有穿空
				},
				dataType: "json",
				type: "post",
				success: function(data) {
					if (data && data.code === 200) {
						var name = dataJson.fileName || '';
						logDict.insertMedialog('m4', '视频'+name+'入库');
						notify.success("视频保存成功！");
						//改变banner 显示完成入库造作为current
						jQuery("#content .libbanner a:eq(2)").removeClass("current").addClass("already");
						jQuery("#content .libbanner span").removeClass("thr").addClass("five");
						jQuery("#content .libbanner a:eq(4)").removeClass("already").addClass("current");
						isSave = true;
						//发送消息给云空间
						broadCast.emit('finishToMedia',{pvdId:data.data.fileId,structId:data.data.structId});
						//组装弹框内容
						//var dialogString="<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成视图入库操作！</span><br/><span class='detail_word'><a href='/module/viewlibs/details/media/video.html?fileType=1",orgid ="";
						//宋雪洁iframe一二级导航需要更新href参数 by zhangxinyu on 2015-10-14
						var dialogString="<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成视图入库操作！</span><br/><span class='detail_word'><a href='/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/details/media/video.html?fileType=1",orgid ="";
						if(dataJson.incidentname){
							dataJson.incidentName = dataJson.incidentname;
						}
						if(dataJson.incidentName !== null && dataJson.incidentName !== undefined){
							dialogString = dialogString+"&incidentname="+dataJson.incidentName+"&id="+data.data.fileId+"&pagetype=workbench&orgid="+orgid+"' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close btn btn_ok input-submit' value='关闭本页'></div></div>";
						}else{
							dialogString = dialogString+"&id="+data.data.fileId+"&pagetype=workbench&orgid="+orgid+"' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close btn btn_ok input-submit' value='关闭本页'></div></div>";
						}
						new ConfirmDialog({
							title: '提示信息',
							message: dialogString,
							showFooter: false,
							callback: function() {
								isSave = true;
								window.opener = null;
								window.open('','_self','');
								parent.window.close();
							}
						});

						$(".common-dialog .close").on("click", function() {
							isSave = true;
							window.opener = null;
							window.open('','_self','');
							parent.window.close();
						});
						//等待5秒关闭
						var timer = setInterval(function() {
							isSave = true;
							window.opener = null;
							window.open('','_self','');
							parent.window.close();
						}, 5000);
					}
				},
				error: function() {
					notify.warn("数据出错！");
				}
			});
		}
		if(!JudgeChromeX()) {//window.navigator.userAgent.test('Chrome/30')){
			document.body.onbeforeunload = function(e) {
				if (isSave) {
					return
				} else {
					return "如果点击“离开此页”，您未提交或未保存的上传数据将不会被保存";
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
					timeCompareBig:"#endTime",
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
					datetime:"时间格式不正确",
					compareCurrent: "视频入点不能晚于当前时间"
				},
				startTime: {
					required: "请输入开始绝对时间",
					datetime:"时间格式不正确",
					timeCompareBig:"开始绝对时间必须早于结束绝对时间",
					compareCurrent: "开始绝对时间必须早于当前时间"
				},
				endTime: {
					required: "请输入结束绝对时间",
					datetime:"时间格式不正确",
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
