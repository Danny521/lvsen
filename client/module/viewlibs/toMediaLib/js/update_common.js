var Updateclass = new Class({

	Implements: [Options, Events],


	initialize: function(options) {

		this.setOptions(options);

	},

	modifyData: function(data, prefix, suffix, name, value) {
		var len = data.length;
		var str = prefix || "{",
			item = '';
		for (var i = 0; i < len; i++) {
			item = data[i];
			str = str + '"' + item.name + '":"' + item.value + '",';
		}
		str = str + '"' + name + '":"' + value + '",';
		str = str.substr(0, str.length - 1);

		str = str + (suffix || "}");

		return str;
	},

	//填充默认信息
	fillPlat: function(data) {
		$.each(data, function(i) {
			$("#" + i).val(data[i]);
		});
	},

	fillCascade: function() {
		//默认籍贯上海市
		if (window.parent) {
			var content = window.parent.document.getElementById("content");
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



		if ($('.input-time').length !== 0) {
			$('.input-time').datetimepicker({ //时间控件
				showSecond: true,
				dateFormat: 'yy-mm-dd',
				timeFormat: 'HH:mm:ss',
				timeText: '',
				hourText: '时',
				minuteText: '分',
				secondText: '秒',
				showAnim: ''
			});
		}



	},

	//创建iframe
	createIframe: function(fileId, path) {

		var iframe = document.createElement("iframe");
		iframe.src = "/medialib/medialibIframe";
		iframe.name = "newfileName";
		iframe.id = "newfileName";

		if (iframe.attachEvent) {
			iframe.attachEvent("onload", function() {
				var cameridArr = window.opener ? window.opener.gTvwallArray : undefined;
				if (typeof cameridArr === "string") {
					rederAjax(cameridArr);
				}
				jQuery(".form-panel .search input").val(cameridArr);
			});
		} else {
			iframe.onload = function() {
				var cameridArr = window.opener ? window.opener.gTvwallArray : undefined;
				if (typeof cameridArr === "string") {
					rederAjax(cameridArr);
				}
				jQuery(".form-panel .search input").val(cameridArr);
			};
		}
	},
	//重新加载数据
	refreshData: function() {
		//轮巡监巡进行中
		if (opener.LoopInspect.isGoing) {

			//非轮巡监巡状态
		} else {
			var openerPlayer = opener.gVideoPlayer, //获取父页面的gVideoPlayer对象
				layout = openerPlayer.getLayout(), //获取父页面的播放器布局数
				cameras = openerPlayer.cameraData.slice(0); //将父页面的channelsObjArray的拷贝拿出来

			// 设置当前窗口布局
			if (this.screenPlayer.getLayout() !== layout) {
				jQuery('.split-panel i.layout[data-layout="' + layout + '"]').trigger('click');
				jQuery('#major .header .split').trigger('click');
			}
			// 关闭父窗口视频
			openerPlayer.stopAll();
			// 自动播放
			this.autoPlay(cameras);
		}
	},

	videoValid: function($dom) {
		$dom.find("#shootTime").on("blur", function() {
			jQuery(this).triggerHandler("change");
		});

		$dom.find("#shootTime").on("change", function() {
			var errorElem = jQuery(this).closest(".item-box").find("label");
			if (dateFormat(this)) {
				if (!compareNow(this) && !jQuery(this).hasClass("error")) {
					jQuery(this).addClass("error");
					errorElem.addClass("error").html("入点时间必须小于当前时间！");
					return false;
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
		});

		function compareNow(elem) { //与当前时间比较
			var value = $dom.find(elem).val().trim();
			var inputTime = new Date(value.substr(0, 4), value.substr(5, 2) - 1, value.substr(8, 2), value.substr(11, 2), value.substr(14, 2), value.substr(17, 2));
			var now = new Date();
			return now >= inputTime;
		}

		function dateFormat(elem) {
			var value = $dom.find(elem).val().trim();
			var dataFor = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
			return dataFor.test(value);
		}


		var str2mills = function(str) {
			return Toolkit.parseDate(str).getTime();
		};

		var mills2str = function(num) {
			var date = new Date(num);
			return date.getFullYear() + '-' + Toolkit.formatLenth(date.getMonth() + 1) + '-' + Toolkit.formatLenth(date.getDate()) + ' ' + Toolkit.formatLenth(date.getHours()) + ':' + Toolkit.formatLenth(date.getMinutes()) + ':' + Toolkit.formatLenth(date.getSeconds());
		};
		$dom.find("#enterTime").on("blur", function() {
			jQuery(this).triggerHandler("change");
		});
		$dom.find("#enterTime").on("change", function() {
			var errorElem = jQuery(this).closest(".item-box").find("label");
			if (dateFormat(this)) {
				if (!compareNow(this) && !jQuery(this).hasClass("error")) {
					jQuery(this).addClass("error");
					errorElem.addClass("error").html("入点时间必须小于当前时间！");
					return false;
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
		});
		/*起始时间比较*/
		$dom.find(".input-time:gt(1)").on("blur", function() {
			jQuery(this).triggerHandler("change");
		});
		$dom.find(".input-time:gt(1)").on("change", function() { /*起始时间失去焦点时判断*/
			// var videoLength = PlayerObj.GetTotalTime(); /*获取视频总时长*/
			// if (videoLength && videoLength !== 0) { /*由于获取总时长有一定延时，所以设置为点击开始时间后填充结束时间*/
			// 	$dom.find('#duration').val(videoLength);
			// 	var start_time = $dom.find("#start_time").val();
			// 	if (start_time) {
			// 		var temp = mills2str(str2mills(start_time) + videoLength * 1000);
			// 		$dom.find('#end_time').val(temp);
			// 	}
			// 	if (!compareNow('#end_time')) {
			// 		$dom.find('#end_time').addClass("error");
			// 		$dom.find('#end_time').closest(".item-box").find("label").addClass("error").html('请正确填写视频绝对开始时间！');
			// 		return false;
			// 	}
			// }

			//TODO
			// if(PlayerObj.GetVideoSize !== undefined){
			// 	var vSize = PlayerObj.GetVideoSize();
			// 	if(vSize !== ''){
			// 		var width = JSON.parse(vSize).width;
			// 			height = JSON.parse(vSize).height;
			// 		jQuery('#width').val(width);
			// 		jQuery('#height').val(height);
			// 	}
			// }
			var id = jQuery(this).attr("id"),
				compareId = "",
				msg1 = "",
				msg2 = "",
				start = $dom.find("#startTime").val().trim(),
				end = $dom.find("#endTime").val().trim(),

				errorElem = jQuery(this).closest(".item-box").find("label");
			$dom.find("#startTime").val(start);
			$dom.find("#endTime").val(end);
			if (start !== '') {
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
						$dom.find("#" + compareId).removeClass("error").next("label").remove();
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
			}
		});

		$dom.validate({
			rules: {
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
					required: true
					// maxlength: 50,
					// datetime: true,
					// compareCurrent: true
				},
				startTime: {
					/*required: true
					,
					maxlength: 50,
					datetime: true,
					timeCompareBig: "#end_time",
					compareCurrent: true*/
				},
				endTime: {
					/*required: true
					,
					maxlength: 50,
					datetime: true,
					compareCurrent: true,
					timeCompare: "#start_time"*/
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
					required: "请选择视频入点"
					// maxlength: "宽度不得超过50字符",
					// datetime:"时间格式不正确",
					// compareCurrent: "视频入点不能晚于当前时间"
				},
				startTime: {

					/*required: "请输入开始绝对时间",
					datetime:"时间格式不正确",
				timeCompareBig:"开始绝对时间必须早于结束绝对时间",
				compareCurrent: "开始绝对时间必须早于当前时间"*/
				},
				endTime: {

					/*required: "请输入结束绝对时间",
					datetime:"时间格式不正确",
				compareCurrent: "结束时间必须早于当前时间",
				timeCompare: "结束绝对时间必须晚于开始绝对时间"*/
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
	},

	imageValid: function($dom) {

		function compareNow(elem) { //与当前时间比较
			var value = $dom.find(elem).val().trim();
			var inputTime = new Date(value.substr(0, 4), value.substr(5, 2) - 1, value.substr(8, 2), value.substr(11, 2), value.substr(14, 2), value.substr(17, 2));
			var now = new Date();
			return now >= inputTime;
		}

		function dateFormat(elem) {
			var value = $dom.find(elem).val().trim();
			var dataFor = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
			return dataFor.test(value);
		}
		/*起始时间比较*/
		$dom.find("#shootTime").on("blur", function() {
			jQuery(this).triggerHandler("change");
		});
		$dom.find("#shootTime").on("change", function() {
			var errorElem = jQuery(this).closest(".item-box").find("label");
			if (dateFormat(this)) {
				if (!compareNow(this) && !jQuery(this).hasClass("error")) {
					jQuery(this).addClass("error");
					errorElem.addClass("error").html("入点时间必须小于当前时间！");
					return false;
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
		});
		$dom.validate({
			rules: {
				incident: "required",
				fileFormat: "required",
				shootTime: {
					required: true,
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
				incident: {
					required: "请输入关联案事件"
				},
				fileFormat: {
					required: "请选择图片格式"
				},
				shootTime: {
					required: "请选择拍摄日期",
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
			}
		});
	},

	//提交表单
	commitFormData: function($dom, name, value) {
		var that = this;
		var data = $dom.serializeArray();
		var json = that.modifyData(data, '{', '}', name, value);

		return json;
	}
});

$(function() {
	window.commonMethod = new Updateclass({});
	commonMethod.fillCascade();
	jQuery("#content").on('click', '.module-head', function() { //展开收拢表单
		jQuery(this).closest(".module").toggleClass("active").siblings(".module").removeClass("active");
		jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
			thumbSize: 60
		});
	});
});