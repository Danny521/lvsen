/*global serializeForm:true*/
require(['/require-conf.js'], function(){
	require([
		'js/controller.js',
		'base.self'
	], function(MediaLoaderC) {
		var MediaLoader = new MediaLoaderC();
		MediaLoader.initialize(MediaLoader.mediaObj);
		var validateFun = function() {
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
			jQuery("#move-form").validate({
				rules: {
					appearTime: {
						minlength: 1,
						maxlength: 100
					},
					type: {
						minlength: 1,
						maxlength: 4
					},
					headColor: {
						minlength: 1,
						maxlength: 4
					},
					upperColor: {
						minlength: 1,
						maxlength: 4
					},
					lowerColor: {
						minlength: 1,
						maxlength: 4
					},
					footColor: {
						minlength: 1,
						maxlength: 4
					},
					height: {
						isNumber: "#height",
						minlength: 1,
						maxlength: 4
					},
					color: {
						minlength: 1,
						maxlength: 4
					},
					gray: {
						minlength: 1,
						maxlength: 4
					},
					description: {
						minlength: 1,
						maxlength: 200
					}
				},
				success: function(label) {
					// set &nbsp; as text for IE
					label.removeClass("error");
				},
				messages: {
					appearTime: {
						minlength: "至少为两个字符",
						maxlength: "不超过100个字符"
					},
					type: {
						minlength: "至少为一个字",
						maxlength: "不超过为四个字"
					},
					headColor: {
						minlength: "至少为两个字",
						maxlength: "不超过为四个字"
					},
					upperColor: {
						minlength: "至少为两个字",
						maxlength: "不超过为四个字"
					},
					lowerColor: {
						minlength: "至少为两个字",
						maxlength: "不超过为四个字"
					},
					footColor: {
						minlength: "至少为两个字",
						maxlength: "不超过为四个字"
					},
					height: {
						minlength: "至少为一个字",
						maxlength: "不超过为四个字"
					},
					color: {
						minlength: "至少为两个字",
						maxlength: "不超过为四个字"
					},
					gray: {
						minlength: "至少为两个字",
						maxlength: "不超过为四个字"
					},
					description: {
						minlength: "至少为两个字",
						maxlength: "不得超过100字"
					}
				},
				submitHandler: function() {
					if (jQuery("#move-form").find(".error").length === 0) {
						jQuery("#move-form")[0].submit();
					} else {
						return;
					}
				}
			});
		};

		var load = function() {
			MediaLoader.loadResource({
				origntype: "moving",
				id: MediaLoader.mediaObj.id,
				url: "/service/pvd/moving/" + MediaLoader.mediaObj.id, //后台请求地址
				incidentname: MediaLoader.mediaObj.incidentname,
				pagetype: MediaLoader.mediaObj.pagetype,
				translate: false,
				entityType: MediaLoader.mediaObj.type,
				container: jQuery('#content .wrapper'),
				callback: function() {
					validateFun();
				}
			});
		};

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

		load();
	});
});
