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
			//表单验证
			jQuery("#exhibitForm").validate({
				rules: {
					name: {
						required: true,
						maxlength: 200,
						nameFormat: true
					},
					shape: {
						required: true,
						maxlength: 20

					},
					color: "required",
					size: {
						maxlength: 4,
						sizeFormat: true
					},
					material: {
						maxlength: 200
					},
					feature: {
						maxlength: 200
					},
					toolsType: {
						maxlength: 10
					},
					evidenceType: {
						maxlength: 5
					},
					evidenceForm: {
						maxlength: 2
					}


				},
				success: function(label) {
					// set &nbsp; as text for IE
					label.remove();
				},
				messages: {
					name: {
						required: "请输入物品名称",
						maxlength: "请不要超过200字符",
						nameFormat: "名称不能包含下列任何字符 \\ / : * ? \" \' < > |"
					},
					shape: {
						required: "请输入物品形状",
						maxlength: "请不要超过2字符"
					},
					color: "请选择颜色",
					size: {
						maxlength: "请不要超过4个字符",
						sizeFormat: "请不要输入负数"
					},
					material: {
						maxlength: "请不要超过200个字符"
					},
					feature: {
						maxlength: "请不要超过200个字符"
					},
					toolsType: {
						maxlength: "请不要超过10个字符"
					},
					evidenceType: {
						maxlength: "请不要超过5个字符"
					},
					evidenceForm: {
						maxlength: "请不要超过2个字符"
					}
				},
				submitHandler: function() {
					if (jQuery("#exhibitForm").find(".error").length === 0) {
						jQuery("#exhibitForm")[0].submit();
					} else {
						return;
					}
				}
			});
		};

		var initialize = function() {
			MediaLoader.loadResource({
				origntype: "exhibit",
				id: MediaLoader.mediaObj.id,
				url: "/service/pvd/get_exhibit_info", //后台请求地址
				incidentname: MediaLoader.mediaObj.incidentname,
				pagetype: MediaLoader.mediaObj.pagetype,
				translate: false,
				container: jQuery('#content .wrapper'),
				callback: function() {
					linkage();
					validateFun();
				}
			});
		};

		var linkage = function() { //联动
			//二级联动
			new CommonCascade({
				firstSelect: '#categoryMain',
				secondSelect: '#categorySub',
				path: '/module/viewlibs/json/relateexhibit.json'
			});
			new CommonCascade({
				firstSelect: '#weaponTypeMain',
				secondSelect: '#weaponTypeSub',
				path: '/module/viewlibs/json/exhibitweapon.json'
			});
		};
		initialize();
	});
});
