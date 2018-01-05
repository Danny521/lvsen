require(['/require-conf.js'], function(){
	require([
		'domReady',
		'base.self',
		'jquery-ui-1.10.1.custom.min',
		'jquery-ui-timepicker-addon',
		'common.cascade',
		'jquery.validate',
		'jquery.pagination',
		'scrollbar',
		'permission',
		'handlebars',
		'menu'
	], function(domReady) {

		var	urls = {
				GET_VIDEO_INFO: '/service/pvd/get_video_info',
				DELETE_MEDIA_INFO: '/service/pvd/delete_video_info',
				UPDATE_MEDIA_INFO: '/service/pvd/update_video_info',
				IMG_DICTIONARY: '/module/viewlibs/json/image.json',
			};

		var	initialize = function(){
				addHelper();
				params = getParams();
				getVideoInfo(params);

				bindEvents();

				jQuery.validator.addMethod("string", function(value, element) {
					return this.optional(element) || /^\s*[\u4E00-\u9FA5\uf900-\ufa2d\w]*\s*$/.test(value);
				}, "请输入字母或汉字");
			};

			// handlebar助手
		var	addHelper = function(){
				//	毫秒转日期
				Handlebars.registerHelper("mills2str", function(num) {
					return Toolkit.mills2datetime(num);
				});

				// 选中下拉选择中匹配的项
				Handlebars.registerHelper("selected", function(value1, value2, options) {
					if (value1 === value2) {
						return "selected";
					}
				});
			};

			// 从url取文件类型fileType和id
		var getParams = function(){
				var orgid = Toolkit.paramOfUrl(location.href).orgid;
				return {
					fileType: Toolkit.paramOfUrl(location.href).fileType,
					id: Toolkit.paramOfUrl(location.href).id,
					casename: Toolkit.paramOfUrl(location.href).incidentname,
					pagetype: Toolkit.paramOfUrl(location.href).pagetype,
					orgid: (orgid && orgid !== 'undefined' && orgid !== undefined) ? orgid : ''
				};
			};

			// 获取视频详情信息
		var	getVideoInfo = function(params){
				var	rs = 0;
				if(params.pagetype !== "workbench"){
					rs = 1;
				}
				jQuery.ajax({
					url: urls.GET_VIDEO_INFO,
					data: {
						orgId: params.orgid,
						fileType: params.fileType,
						id: params.id,
						rs: rs
					},
					cache: false,
					type: 'GET',
					success: function(res){
						if(res.code == 200){
							displayInfo(res.data.image);
						}else{
							displayInfo(res);
						}
					},
					error: function(){
						notify.warn('网络异常');
					}
				});
			};


			// 将图片信息显示
		var	displayInfo = function(data){
				var template = Handlebars.compile(jQuery('#pictureInfo').html());

				jQuery('#content .wrapper').html(template(data));

				new CommonCascade({
					firstSelect: '#province',
					secondSelect: '#city',
					thirdSelect: '#country'

				});

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

				 //内容区添加滚动条
				jQuery(".module-body").tinyscrollbar({
					thumbSize: 36
				});

				jQuery(document).on('click', '.module-head', function() { //展开收拢表单 手风琴效果
					jQuery(this).closest(".module").addClass("active").siblings(".module").removeClass("active");
					jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
						thumbSize: 36
					});
				});

				// 根据角色显示相应按钮
				permission.reShow();

				// 更新面包屑
				updateCrumbs(data);

				// 加载表单验证
				validateForm();

			};

			// 删除视频/图片信息
		var	deleteMedia = function(fileType, id){
				jQuery.ajax({
					url: urls.DELETE_MEDIA_INFO,
					data: {
						fileType: fileType,
						id: id
					},
					type: 'post',
					success: function(res){
						if(res.code === 200){
							notify.success('删除成功');
						}else{
							notify.warn('删除失败');
						}
					},
					error: function(){
						notify.warn('网络异常');
					}
				});
			};

			// 更新面包屑
		var updateCrumbs = function(data){
				home = Toolkit.paramOfUrl(window.location.href).pagetype,

				jQuery('.crumbs > a.first').text(getCrumbsType()).attr('data-home', home)
				if(!data.incidentId){
					jQuery('.crumbs > a.second').nextAll().hide();
					jQuery('.crumbs > a.second').text('图片信息');
				}
				if(Toolkit.paramOfUrl(window.location.href).pagetype === 'caselib'){
					jQuery('div.ui.menu.atached.nav > a.caselib').addClass('active').siblings().removeClass('active');
				}
			};

			// 返回面包屑类型
		var	getCrumbsType = function(){
				var type = Toolkit.paramOfUrl(window.location.href).pagetype;
				// home: 我的工作台 workbench   案事件信息库 caselib
				switch(type){
					case 'workbench':
						return '我的工作台';
					case 'caselib':
						return '案事件信息库';
					default:
						return;
				}
			};

			// 更新保存图片信息
		var	updatePictureInfo = function(data){
				var incidentId = jQuery('.crumbs > a.second').data('caseid');
				data.id = params.id;
				data.fileType = params.fileType;
				data.incidentId = incidentId ? incidentId : null;
				data.location = getLocation();
				data.remark = setRemark.getText(jQuery('#form'));
				var str = JSON.stringify(data);
				jQuery.ajax({
					url: urls.UPDATE_MEDIA_INFO,
					type: 'post',
					async: false,
					data: {
						"resoureList": str
					},
					success: function(res){
						if(res.code == 200){
							var name = data.name,
								type = (parseInt(data.fileType, 10) === 2 ? '图片' : '视频'),
								str = (params.casename !== undefined ? (params.casename + '案事件的') : '');
							logDict.insertMedialog('m4','编辑 ' + str + name + ' ' + type + '表单', "", "o2");
							window.location.href = "/module/viewlibs/details/media/picture.html?id=" + params.id + "&fileType=" + params.fileType + "&pagetype=" + params.pagetype;
						}
					},
					error: function(){
						notify.warn(res.code);
					}
				});
			};

		var	getLocation = function(){
				// 构造地址字符串
				var p = jQuery("#province").children("option:selected").val() !== "" ? jQuery("#province").children("option:selected").text() : "";
				var c = jQuery("#city").children("option:selected").val() !== "" ? jQuery("#city").children("option:selected").text() : "";
				var a = jQuery("#country").children("option:selected").val() !== "" ? jQuery("#country").children("option:selected").text() : "";
				var s = jQuery("#streets").val().trim() !== "" ? jQuery("#streets").val().trim() : "";
				s = s !== '请输入街道详细地址' ? s : "";
				return  p + " " + c + " " + a + " " + s;
			};

		var	validateForm = function(){
				jQuery("#form").validate({
					rules: {
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
		                            incidentId:jQuery('.crumbs > a.second').data('caseid')?jQuery('.crumbs > a.second').data('caseid'):null,
		                            type:2,
		                            id:Toolkit.paramOfUrl(location.href).id
		                        }
		                    }
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
							string: true,
							maxlength: 30
						},
						earmark: {
							string: true,
							maxlength: 30
						},
						subject: {
							string: true,
							maxlength: 30
						},
						keywords: {
							string: true,
							maxlength: 30
						},
						keyman: {
							string: true,
							maxlength: 30
						},
						picker: {
							string: true,
							maxlength: 100
						},
						pickerCompany: {
							string: true,
							maxlength: 100
						}
					},
					success: function(label) {
						label.remove();
					},
					// 对于验证失败的字段都给出相应的提示信息
					messages: {
						fileFormat: {
							required: "请输入案件主类别"
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
							string: "请输入字母或汉字",
							maxlength: "题名补充不得超过30个字符"
						},
						earmark: {
							string: "请输入字母或汉字",
							maxlength: "专项名不得超过30个字符"
						},
						subject: {
							string: "请输入字母或汉字",
							maxlength: "主题词不得超过30个字符"
						},
						keywords: {
							string: "请输入字母或汉字",
							maxlength: "关键词不得超过30个字符"
						},
						keyman: {
							string: "请输入字母或汉字",
							maxlength: "主题人物不得超过30个字符"
						},
						picker: {
							string: "请输入字母或汉字",
							maxlength: "采集人不得超过100个字符"
						},
						pickerCompany: {
							string: "请输入字母或汉字",
							maxlength: "采集单位名称不得超过100个字符"
						}
					}
				});
			};

			// 图片详情页事件绑定
		var	bindEvents = function(){

				// 选项卡切换
				jQuery(document).on('click','.tabs li', function(){
					var tab = jQuery(this).data('tab');
					jQuery(this).addClass('active').siblings().removeClass('active');
					jQuery('.views [data-view="'+ tab +'"]').addClass('active').siblings().removeClass('active');
				});

				// 人工标注
				jQuery(document).on('click', '#manualMark', function(){
					var id = jQuery(this).data('imgid'); // 国标编码
					var parentid = jQuery('.sourceid').data('sourceid');
					var path = jQuery('.main .media.picture > div > img').attr('src');
					var incidentid = jQuery(this).data('caseid');
					var data={id:id, fileType:"2", parentid:parentid, path:path, incidentId:incidentid};
				    Cookie.write("import",JSON.stringify(data));
				    window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"imagejudge/resource-process/index.html?id="+id+"type=2","singleAnalyze");
				    return false;
				});
				// 删除图片
				jQuery(document).on('click', '.operate .delete', function(){
					deleteMedia(2, jQuery(this).data('id'));
					return false;
				});

				// 面包屑点击跳转
				jQuery(document).on('click','.crumbs > a', function(){
					var that = jQuery(this);
					if(that.is('.first')){
						that.attr('href', '/module/viewlibs/' + home + '/index.html');
					}else if(that.is('.second')){
						var caseid = jQuery(this).data('caseid');
						that.attr("href", "/module/viewlibs/details/incident/incident_detail.html?id=" + caseid + "&pagetype=" + params.pagetype + '&orgid=' + params.orgid + '&incidentname=' + params.casename);
					}
				});

				// 保存编辑信息
				jQuery(document).on('click', '.input-submit', function(){
					var data = jQuery('form').serializeArray();
					var json = {};
					jQuery(data).each(function(){
						if(this.name === 'streets'){
							this.value = this.value==='请输入街道详细地址'?'':this.value;
						}
						json[this.name] = this.value;
					});
					if(jQuery('#form').valid()){
						updatePictureInfo(json);
					}else{
						notify.warn('表单信息填写有误，请重新填写');
					}
					return false;
				});

				// 取消按钮
				jQuery(document).on('click', '.input-cancel', function(){
					var caseid = jQuery('.crumbs > a.second').data('caseid');
					window.location.href = "/module/viewlibs/details/media/picture.html?id=" + params.id + "&pagetype=" + params.pagetype + '&orgid=' + params.orgid + '&fileType=2';
				});

			};
			domReady(function(){
				initialize();
			});
	});
});
