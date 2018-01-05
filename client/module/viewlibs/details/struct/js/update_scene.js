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
					weather: {
						minlength: 1,
						maxlength: 50
					},
					description: {
						minlength: 1,
						maxlength: 200
					},
					sceneChart: {
						minlength: 1,
						maxlength: 20
					},
					sceneWind: {
						minlength: 1,
						maxlength: 10
					},
					sceneLight: {
						minlength: 1,
						maxlength: 10
					},
					sceneCondition: {
						minlength: 1,
						maxlength: 10
					},
					sceneTemperature: {
						is_Number: "#scene_temperature",
						minlength: 1,
						maxlength: 5
					},
					sceneHumidity: {
						isNumber: "#scene_humidity",
						minlength: 1,
						maxlength: 60
					},
					stuffDensity: {
						isinteger: "#stuff_density",
						minlength: 1,
						maxlength: 60
					},
					sceneImportant: {
						isinteger: "#scene_important",
						minlength: 1,
						maxlength: 60
					},
					crowdDensity: {
						isNumber: "#crowd_density",
						minlength: 1,
						maxlength: 60
					}
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
					category: {
						//required:"请输入处所分类"
						minlength: "至少为两个字符",
						maxlength: "不得超过10个字符"
					},
					weather: {
						minlength: "至少为一个字符",
						maxlength: "不得超过10个字符"
					},
					sceneChart: {
						minlength: "至少为两个字符",
						maxlength: "不得超过20个字符"
					},
					description: {
						minlength: "至少为两个字符",
						maxlength: "不得超过200字符"
					},
					sceneWind: {
						minlength: "至少为两个字符",
						maxlength: "不得超过10个字符"
					},
					sceneLight: {
						minlength: "至少为两个字符",
						maxlength: "不得超过10个字符"
					},
					sceneCondition: {
						minlength: "至少为两个字符",
						maxlength: "不得超过10个字符"
					},
					sceneTemperature: {
						minlength: "至少为两个字符",
						maxlength: "不得超过60个字符"
					},
					sceneHumidity: {
						minlength: "至少为两个字符",
						maxlength: "不得超过60个字符"
					},
					stuff_density: {
						minlength: "至少为两个字符",
						maxlength: "不得超过60个字符"
					},
					crowdDensity: {
						minlength: "至少为两个字符",
						maxlength: "不得超过60个字符"
					},
					sceneImportant: {
						minlength: "至少为两个字符",
						maxlength: "不得超过60个字符"
					}
				},
				submitHandler: function() {
					if (jQuery("#scene-form").find(".error").length === 0) {
						jQuery("#scene-form")[0].submit();
					} else {
						return;
					}
				}
			});
		};

		var load = function() {

			MediaLoader.parseURL(window.location.href);
			MediaLoader.loadResource({
				origntype: "scene",
				id: MediaLoader.mediaObj.id,
				url: "/service/pvd/get_scene_info", //后台请求地址
				incidentname: MediaLoader.mediaObj.incidentname,
				pagetype: MediaLoader.mediaObj.pagetype,
				translate: false,
				entityType: MediaLoader.mediaObj.type,
				container: jQuery('#content .wrapper'),
				callback: function() {
					validateFun();
					new CommonCascade({
						firstSelect: "#scenetype_title",
						secondSelect: "#scene_title",
						path: '/module/viewlibs/json/scene_u.json'
					});
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
