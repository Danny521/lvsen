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
			jQuery("#scene-form").validate({
				rules: {
					appearTime: {
						minlength: 1,
						maxlength: 100
					},

					categoryMain: {},
					categorySub: {},
					name: {
						minlength: 1,
						maxlength: 10
					},
					description: {
						minlength: 1,
						maxlength: 200
					},
				},
				success: function(label) {
					// set &nbsp; as text for IE
					label.removeClass("error");
				},
				messages: {
					appearTime: {
						minlength: "至少为两个字符",
						maxlength: "不得超过100字符"
					},
					description: {
						minlength: "至少为两个字符",
						maxlength: "不得超过200字符"
					},
					name: {
						minlength: "至少为两个字符",
						maxlength: "不得超过20个字符"
					}
				},
				submitHandler: function() {
					if (jQuery("#others-form").find(".error").length === 0) {
						jQuery("#others-form")[0].submit();
					} else {
						return;
					}
				}
			});
		};

		var load = function() {
			MediaLoader.loadResource({
				origntype: "rest",
				id: MediaLoader.mediaObj.id,
				url: "/service/pvd/rest/" + MediaLoader.mediaObj.id, //后台请求地址
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
