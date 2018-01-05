define([
	'jquery',
	'jquery.validate',
	'base.self'], function() {	
	/**
	 * [validate 填写表单校验]
	 * @author limengmeng
	 * @date   2014-10-28
	 * @return {[]}   []
	 */
	var validate = function() {
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

		//根据验证框架对表单中的数据进行字段长度和一些必要信息的验证
		jQuery("#form").validate({
			ignore: "",
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
					nameFormat: true,
					remote: {
                        url: "/service/pvd/resourceName/check",
                        type: "post",
                        data: {
                            resourceName: function () {
                                return jQuery("#name").val().trim();
                            },
                            incidentId:Toolkit.paramOfUrl(location.href).incidentid?Toolkit.paramOfUrl(location.href).incidentid:null,
                            type:1,
                            id:Toolkit.paramOfUrl(location.href).id
                        }
                    }
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
					timeCompareBig: "#end_time",
					compareCurrent: true
				},
				endTime: {
					required: true,
					datetime: true,
					compareCurrent: true,
					timeCompare: "#start_time"

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
	};
	return {validate:validate};
});