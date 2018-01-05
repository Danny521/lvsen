/*global serializeForm:true*/
require(['/require-conf.js'], function(){
	require([
		'js/controller.js',
		'base.self'
	], function(MediaLoaderC) {
		var MediaLoader = new MediaLoaderC();
		MediaLoader.initialize();
		var addeventer = function() {};
		addeventer.prototype = {
			evt: function() {
				if (this.onEvt) {
					for (i = 0; i < this.onEvt.length; i++) {
						this.onEvt[i](); //逐个调用处理函数
					}
				}
			},
			//添加事件处理函数
			addEvent: function(_eventHandler) {
				if (!this.onEvt)
					this.onEvt = []; //存放事件处理函数
				this.onEvt.push(_eventHandler);
			},
			//删除
			detachOnEvt: function(_eventHandler) {
				this.onEvt.pop(_eventHandler);
			}
		}
		var addeventer = new addeventer();
		addeventer.addEvent(function() {
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
		});
		addeventer.addEvent(function() {
			//验证框架
			jQuery('#car_form').validate({
				rules: {
					licenseType: "required",
					licenseColor: "required",
					licenseNumber: {
						required: true,
						maxlength: 16,
						licenseNumber: true
					},
					carTypeMain: {
						required: true
					},
					carTypeSub: {
						required: true
					},
					carColor: {
						required: true
					},
					transitTime: {
						required: true,
						compareCurrent: true
					},
					driveSpeed: {
						maxlength: 10,
						positiveFloat: true
					},
					appearTime: {
						compareCurrent: true
					},
					useNature: {
						maxlength: 20
					},
					carBrand: {
						maxlength: 20,
						nameFormat: true
					},
					carModel: {
						maxlength: 20,
						nameFormat: true
					},
					carShape: {
						maxlength: 10,
						nameFormat: true
					},
					frontHood: {
						maxlength: 10,
						nameFormat: true
					},
					backHood: {
						maxlength: 10,
						nameFormat: true
					},
					wheel: {
						maxlength: 10,
						nameFormat: true
					},
					wheelTracks: {
						maxlength: 10,
						nameFormat: true
					},
					carWindow: {
						maxlength: 10,
						nameFormat: true
					},
					carRoof: {
						maxlength: 10,
						nameFormat: true
					},
					carChassis: {
						maxlength: 10,
						nameFormat: true
					},
					carFilming: {
						maxlength: 10,
						nameFormat: true
					},
					filmingColor: {
						maxlength: 10,
						nameFormat: true
					},
					transitRoad: {
						maxlength: 50,
						nameFormat: true
					}

				},

				//当没有错误时去掉error样式
				success: function(label) {
					// set &nbsp; as text for IE
					label.removeClass("error");
				},

				messages: {
					licenseType: {
						required: "请选择车辆类型"
					},
					licenseColor: {
						required: "请选择车辆颜色"
					},
					licenseNumber: {
						required: "请输入车牌号码(不能输入空格)",
						maxlength: "不能超过16个字符",
						licenseNumber: "请输入正确格式的车牌号码。例如:浙D124A1或浙D124A学或WJ1111111"
					},
					carTypeMain: {
						required: "请选择车辆类型大类"
					},
					carTypeSub: {
						required: "请选择车辆具体类型"
					},
					carColor: {
						required: "请选择车身颜色"
					},
					transitTime: {
						required: "请选择经过时间",
						compareCurrent: "输入时间大于当前时间,请重新输入"
					},
					driveSpeed: {
						maxlength: "不能超过10个字符",
						positiveFloat: "速度只可以是正整数或小数格式"
					},
					appearTime: {
						compareCurrent: "输入时间大于当前时间,请重新输入"
					},
					useNature: {
						maxlength: "输入长度不能超过20个字符"
					},
					carBrand: {
						maxlength: "输入长度不能超过20个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					carModel: {
						maxlength: "输入长度不能超过20个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					carShape: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					frontHood: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					backHood: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					wheel: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					wheelTracks: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					carWindow: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					carRoof: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					carChassis: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					carFilming: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					filmingColor: {
						maxlength: "输入长度不能超过10个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					},
					transitRoad: {
						maxlength: "输入长度不能超过50个字符",
						nameFormat: "输入字符不可以出现:*,>,<,?,\",\"等特殊符号"
					}
				},
				submitHandler: function() {
					if ((jQuery("#car_form").find(".error").length === 0) && jQuery(".notNull").find("option:selected").val() !== '') {
						notify.success("success");
						//jQuery("#car_form")[0].submit();
					} else {
						notify.warn('车辆类型未选择！');
						return;
					}
				}
			});
		});

		var initialize = function() {
			MediaLoader.parseURL(window.location.href); //将地址路径解析为json对象
			load();
		};

		var load = function() {
			var self = this;
			MediaLoader.loadResource({
				origntype: "car",
				id: MediaLoader.mediaObj.id,
				url: "/service/pvd/get_car_info", //后台请求地址
				incidentname: MediaLoader.mediaObj.incidentname,
				pagetype: MediaLoader.mediaObj.pagetype,
				translateUrl: '/module/viewlibs/json/car.json',
				translate: false,
				entityType: MediaLoader.mediaObj.type,
				container: jQuery('#content .wrapper'),
				callback: function(data) {
					addeventer.evt();
					// 车辆类型级联
					new CommonCascade({
						firstSelect: "#cartype_title",
						secondSelect: "#car_title",
						path: '/module/viewlibs/json/updateCarData.json'
					});
				}
			});
		};
		initialize();
	});
});

/*车辆表单验证*/
//表单校验,当没有错误时提交成功，反则失败
