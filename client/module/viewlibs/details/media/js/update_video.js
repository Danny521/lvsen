require(['/require-conf.js'], function(){
	require([
		'domReady',
		'panel',
		'/module/viewlibs/details/media/js/player1.js',
		'js/videoValidate.js',
		'base.self',
		'jquery-ui-1.10.1.custom.min',
		'jquery-ui-timepicker-addon',
		'common.cascade',
		'jquery.pagination',
		'scrollbar',
		'permission',
		'handlebars',
		'jquery-ui'
	], function(domReady, BlankPanel, Mplayer, validate) {

		var incidentInfo = '', //所属案事件信息

			urls = {
				GET_VIDEO_INFO: '/service/pvd/get_video_info',
				UPDATAE_VIDEO_INFO: '/service/pvd/update_video_info',
				DELETE_VIDEO_INFO: '/service/pvd/delete_video_info',
				VIDEO_DICTIONARY: '/module/viewlibs/json/video.json',
				SAVE_TO_CLOUND: '/service/pvd/pvd_videoimage_pcm', //已关联案事件
				SAVE_TO_CLOUND_ALT: '/service/pvd/videoimage_pcm', //未关联案事件
				IS_IN_CLOUND: '/service/pvd/imagevideo_exist' //	检测之前是否已保存过
			};
		/**
		 * [initialize 初始化函数]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @return {[]}   []
		 */
		var initialize = function() {
			addHelper();
			params = getParams();
			getVideoInfo(params);

			bindEvents(params);
		};
		// handlebar助手
		var addHelper = function() {
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
		//
		/**
		 * [getParams 从url取获取当前视频文件类型fileType和id]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @return {[json]}   [当前视频信息josn]
		 */
		var getParams = function() {
			var orgid = Toolkit.paramOfUrl(location.href).orgid;
			return {
				fileType: Toolkit.paramOfUrl(location.href).fileType,
				id: Toolkit.paramOfUrl(location.href).id,
				incidentName: Toolkit.paramOfUrl(location.href).incidentname,
				pagetype: Toolkit.paramOfUrl(location.href).pagetype,
				incidentId: Toolkit.paramOfUrl(location.href).incidentid, //编辑页面存在的incidentid
				orgid: (orgid && orgid !== undefined && orgid !== 'undefined') ? orgid : ''
			};
		};

		/**
		 * [getVideoInfo 获取视频详情信息]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[json]}   params [当前视频的相关参数：id，文件类型，案事件名称、id等]
		 * @return {[]}          []
		 */
		var getVideoInfo = function(params) {
			var rs = 0;
			if (params.pagetype !== "workbench") {
				rs = 1;
			}
			//获取当前视频相关内容
			var getInfoXhr = jQuery.ajax({
				url: urls.GET_VIDEO_INFO,
				data: {
					fileType: params.fileType,
					id: params.id,
					orgId: params.orgid,
					rs: rs
				},
				dataType: "JSON",
				type: 'GET',
				success: function(res) {
					if (res.code == 200) {
						renderTemplate(res.data.video, params);
					} else {
						renderTemplate(res, params);
					}
				},
				error: function() {
					notify.warn('网络异常');
				}
			});
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

		var updateCrumbs = function(data){
			home = Toolkit.paramOfUrl(window.location.href).pagetype,

			jQuery('.crumbs > a.first').text(getCrumbsType()).attr('data-home', home);
			if(!data.incidentId){
				jQuery('.crumbs > a.second').nextAll().hide();
				jQuery('.crumbs > a.second').text('视频信息');
			}
			if(Toolkit.paramOfUrl(window.location.href).pagetype === 'caselib'){
				jQuery('div.ui.menu.atached.nav > a.caselib').addClass('active').siblings().removeClass('active');
			}
		};

		//渲染模板
		/**
		 * [renderTemplate 渲染模板]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[json]}   data   [要渲染在模板上的数据]
		 * @param  {[json]}   params [预留]
		 * @return {[]}          []
		 */
		var renderTemplate = function(data, params) {
			jQuery.when(Toolkit.loadTempl("/module/viewlibs/json/video.json")).done(function(sourceData) {
				var source = jQuery('#view-template').html(),
					template = Handlebars.compile(source);

				//渲染视频信息表单
				jQuery('#content .wrapper').html(template(data));

				// 检测ocx版本
				if(window.checkPlayer && window.checkPlayer()) {
					return;
				}
				//权限控制
				permission.reShow();
				// 更新面包屑
				updateCrumbs(data);
				//不显示标志按钮
				jQuery(".media .panel .editing").hide();
				jQuery(".media .panel .smartmark").hide();
				//对视频编辑表单验证
				validate.validate();

				//编辑页联动选项
				new CommonCascade({
					firstSelect: '#province',
					secondSelect: '#city',
					thirdSelect: '#country'
				});
				if(jQuery(".module.active>.module-body").length>0){
					jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
						thumbSize: 36
					});
				}
				jQuery(document).on('click', '.module-head', function() { //展开收拢表单 手风琴效果
					jQuery(this).closest(".module").addClass("active").siblings(".module").removeClass("active");
					jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
						thumbSize: 36
					});
				});
				Mplayer.initPlayer({ //播放视频
					"filename": data.path
				});
			});
		};
		/**
		 * [operate 对该视频删除，保存，标注操作]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[json]}   params [该视频相关内容,id,文件类型，orgid等]
		 * @return {[]}          []
		 */
		var operate = function(params) {
			//保存
			jQuery(document).on('click', '.submit-wrapper .input-submit', function() {
				var formdata = serializeForm(jQuery("#form").serializeArray());
				var p = jQuery("#province").children("option:selected").val() !== "" ? jQuery("#province").children("option:selected").text() : "";
				var c = jQuery("#city").children("option:selected").val() !== "" ? jQuery("#city").children("option:selected").text() : "";
				var a = jQuery("#country").children("option:selected").val() !== "" ? jQuery("#country").children("option:selected").text() : "";
				var s = jQuery("#streets").val().trim() !== "" ? jQuery("#streets").val().trim() : "";
				s = s !== '请输入街道详细地址' ? s : "";
				formdata = Object.merge({}, formdata, {
					id: params.id,
					fileType: '1',
					incidentId: params.incidentId,
					remark: setRemark.getText(jQuery('#form')),
					location: p + " " + c + " " + a + " " + s
				});

				if (jQuery("#form").valid() && jQuery("#form").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
					jQuery.ajax({
						url: urls.UPDATAE_VIDEO_INFO,
						data: {
							"resoureList": JSON.stringify(formdata)
						},
						dataType: "json",
						type: "post",
						success: function(data) {
							if (data && data.code === 200) {
								notify.success("保存成功！");

								// 视频编辑日志 由于视频编辑后保存接口异常，待测试
								var name = formdata.name,
									type = (parseInt(formdata.fileType, 10) === 2 ? '图片' : '视频'),
									str = incidentInfo.name ? (incidentInfo.name + '案事件的') : '';
								logDict.insertMedialog('m4', '编辑 ' + str + name + ' ' + type + '表单', "", "o2");
								window.location.href = "/module/viewlibs/details/media/video.html?id=" + params.id + "&fileType=1" + "&pagetype=" + params.pagetype;
							}
						}
					});
				} else {
					notify.warn("请正确填写相关信息！");
				}
			});

			//取消
			jQuery(document).on('click', ".submit-wrapper .input-cancel", function() {
				var locationurl = "/module/viewlibs/details/media/video.html?id=" + params.id + "&fileType=1" + "&pagetype=" + params.pagetype;
				if(params.incidentId){
					locationurl = locationurl+"&incidentid=" +params.incidentId;
				}
				window.location.href = locationurl;
			});
		};
		/**
		 * [bindEvents 视频详情页事件绑定]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[json]}   params [该视频相关参数]
		 * @return {[]}          []
		 */
		var bindEvents = function(params) {
			// 选项卡切换
			jQuery(document).on('click', '.tabs li', function() {
				var tab = jQuery(this).data('tab');
				jQuery(this).addClass('active').siblings().removeClass('active');
				jQuery('.views [data-view="' + tab + '"]').addClass('active').siblings().removeClass('active');
			});

			operate(params);

			// 线索、结构化信息跳转
			jQuery(document).on('click', "#videoClue", function() {
				if (parseInt(jQuery(this).find('i').html(), 10) === 0) {
					return false;
				}

				var incidentid = jQuery('#incidentId').attr('data-incidentid');
				var fileid = jQuery('.main .media > .video').data('fileid');
				var filename = jQuery('.main .media > .video').data('videoname');
				if (!incidentid) {
					jQuery(this).attr('href', "/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/workbench/index.html?fileid=" + fileid + "&filename=" + filename + "&filetype=1" + "&home=" + params.pagetype + "&pagetype=structlist" + "&orgid=" + params.orgid);
				} else {
					jQuery(this).attr('href', "/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/workbench/index.html?incidentid=" + incidentid + "&fileid=" + fileid + "&filename=" + filename + "&filetype=1" + "&home=" + params.pagetype + "&pagetype=traillist" + '&orgid=' + params.orgid + '&incidentname=' + params.incidentName + "&clue=2");
				}
			});

			jQuery("#videoClue").on('mouseover', function() {
				if (parseInt(jQuery(this).find('i').html(), 10) === 0) {
					jQuery(this).css({
						'text-decoration': 'none',
						'cursor': 'default'
					});
				}
			});
		};

		/**
		 * [serializeForm 将表单数据转化为json]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[object]}   serverlize [表单数据对象]
		 * @return {[json]}              [表单数据json]
		 */
		var serializeForm = function(serverlize) { //表单数据json化
			var json = {};
			for (var i = 0; i < serverlize.length; i++) {
				if(serverlize[i].name === 'streets'){
					serverlize[i].value = serverlize[i].value==='请输入街道详细地址'?'':serverlize[i].value;
				}
				json[serverlize[i].name] = serverlize[i].value;
			}
			return json;
		};

		initialize();
	});
});
