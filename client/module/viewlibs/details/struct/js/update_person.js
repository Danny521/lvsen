/*global serializeForm:true*/
require(['/require-conf.js'], function(){
	require([
		'js/controller.js',
		'base.self'
	], function(MediaLoaderC) {
		var MediaLoader = new MediaLoaderC();
		MediaLoader.initialize(MediaLoader.mediaObj);

		var dataCache = new Hash(),
			loadCache = new Hash();

		var initialize = function() {

			MediaLoader.parseURL(window.location.href); //将地址路径解析为json对象

			//添加事件监听
			addEventsListener();

			MediaLoader.loadResource({
				origntype: "person",
				id: MediaLoader.mediaObj.id,
				url: "/service/pvd/get_person_info", //后台请求地址
				incidentname: MediaLoader.mediaObj.incidentname,
				pagetype: MediaLoader.mediaObj.pagetype,
				translateUrl: "/module/viewlibs/json/person.json",
				translate: false,
				container: jQuery('#content .wrapper')
			});

			checkFormItem();
		};

		var addEventsListener = function() {
			MediaLoader.addEvent('COMPLETEDATA', function() {
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
				//人员表单验证
				jQuery('#form').validate({
					rules: {
						cardtype: {
							maxlength: 50
						},
						cardnumb: {
							maxlength: 50,
							identificationSelect: '#cardtype'
						},
						name: {
							maxlength: 20
						},
						formerName: {
							maxlength: 20
						},
						nickname: {
							maxlength: 20
						},
						ageUpper: {
							digits: true,
							maxlength: 10,
							range: [0, 100]
						},
						ageLower: {
							digits: true,
							maxlength: 10,
							range: [0, 100]
						},
						voice: {
							string: true,
							maxlength: 50
						},
						industryCount: {
							digits: true
						},
						heightUpper: {
							digits: true
						},
						heightLower: {
							digits: true
						},
						bodyFeature: {
							string: true
						},
						surfaceFeature: {
							string: true
						},
						driverLicense: {
							string: true,
							maxlength: 10
						},
						driverStatus: {
							string: true
						},
						foreignerCategory: {
							string: true,
							maxlength: 20
						}

					},
					success: function(label) {
						label.removeClass("error");
					},
					messages: {
						cardtype: {
							maxlength: '证件类型不得超过50个字符！'
						},
						cardnumb: {
							maxlength: '证件号码不得超过50个字符！'
						},
						name: {
							maxlength: '姓名不得超过20个字符！'
						},
						formerName: {
							maxlength: '曾用名不得超过20个字符！'
						},
						nickname: {
							maxlength: '绰号不得超过20个字符！'
						},
						ageUpper: {
							maxlength: '年龄上限不超过10个字符！',
							range: '年龄上限界于0到100之间！'
						},
						ageLower: {
							maxlength: '年龄下限不超过10个字符！',
							range: '年龄下限界于0到100之间！'
						},
						voice: {
							string: '请输入汉字或字符！',
							maxlength: '输入不得超过50个字符！'
						},
						industryCount: {
							digits: '请输入数字！'
						},
						heightUpper: {
							digits: '请输入数字！'
						},
						heightLower: {
							digits: '请输入数字！'
						},
						bodyFeature: {
							string: '请输入汉字或字符！'
						},
						surfaceFeature: {
							string: '请输入汉字或字符！'
						},
						driverLicense: {
							string: '请输入汉字或字符！',
							maxlength: '输入不得超过10个字符！'
						},
						driverStatus: {
							string: '请输入汉字或字符！'
						},
						foreignerCategory: {
							string: '请输入汉字或字符！',
							maxlength: '输入不得超过20个字符！'
						}
					},
					submitHandler: function() {
						if (jQuery("#form").find(".error").length === 0) {
							jQuery("#form")[0].submit();
						} else {
							return;
						}
					}
				});
				linkage();
				loadOptions("nation", "nation"); //民族
				loadOptions("passport_category", "passportCategory"); //护照
				loadOptions("work_category", "workCategory"); //职务
				loadOptions("criminal_skilled", "criminalSkilled"); //犯罪专长
				loadOptions("criminal_mark", "criminalMark"); //体表标记
				loadOptions("criminal_method", "criminalMethod"); //作案手段
				loadOptions("criminal_feature", "criminalFeature"); //作案特点
			});
		};

		var loadOptions = function(id, type) { //加载下拉列表数据项(创建页面)
			var node = jQuery("#" + id),
				url = "/module/viewlibs/json/person.json";
			if (dataCache.has(url)) {
				renderOptions(node, dataCache.get(url), type);
				return;
			}

			jQuery.ajax({
				url: url,
				cache: true,
				async: false,
				success: function(data) {
					if(typeof data === "string"){
						data = JSON.parse(data);
					}
					dataCache.set(url, data);
					renderOptions(node, data, type);
				},
				error: function() {
					notify.error("数据出错！");
				}
			});
		};

		var renderOptions = function(node, data, type) { //下拉列表
			var option = "<option value=''>--请选择--</option>",
				defaultValue = node.data("default") + '';
			if (type) {
				for (var item in data[type]) {
					if (defaultValue == item || parseInt(item) === parseInt(defaultValue)) {
						option += "<option selected value=" + item + ">" + data[type][item] + "</option>";
					} else {
						option += "<option value=" + item + ">" + data[type][item] + "</option>";
					}
				}
			}
			node.append(option);
		};

		var linkage = function() { //联动
			new CommonCascade({
				firstSelect: '#nativeProvince',
				secondSelect: '#nativeCity'
			});

			new CommonCascade({
				firstSelect: '#province',
				secondSelect: '#city',
				thirdSelect: '#country'
			});

			new CommonCascade({
				firstSelect: '#victimCategory',
				secondSelect: '#victimDetail',
				path: '/module/viewlibs/json/victim_category.json'
			});

			new CommonCascade({
				firstSelect: '#profession',
				secondSelect: '#professionDetail',
				path: '/module/viewlibs/json/profession_data.json'
			});
		};

		//勾选复选框启用相应的表单项
		var checkFormItem = function() {
			jQuery(document).on("click", '.module .form-item .input-check', function() {
				jQuery(this).closest(".form-item").next(".enablewrap").find("select,.input-text").attr("disabled", !this.checked);
			});
		};
		initialize();
	});
});
