/*global Mplayer:true, permission:true*/
define([
	'/module/viewlibs/details/media/js/player1.js',
	'/module/viewlibs/details/media/js/videoModel.js',
	'/module/viewlibs/details/media/js/summaryPlay.js',
    '/module/imagejudge/resource-process/js/overlayPlayerBar.js',
	'base.self',
	'handlebars',
	'jquery.pagination',
	'scrollbar', 
	'common.cascade',
	'jquery-ui',
	'permission'], function(Mplayer,VideoModel,CommonOnePlayer, overlayPlayBar) {
	var VideoView = function(){};
	VideoView.prototype = {
		incidentInfo: {}, //所属案事件信息
		summaryOverlay: true,
		summaryCut: true,
		urls: {
			GET_VIDEO_INFO: '/service/pvd/get_video_info',
			UPDATAE_VIDEO_INFO: '/service/pvd/update_video_info',
			DELETE_VIDEO_INFO: '/service/pvd/delete_video_info',
			VIDEO_DICTIONARY: '/module/viewlibs/json/video.json',
			SAVE_TO_CLOUND: '/service/pvd/pvd_videoimage_pcm', //已关联案事件
			SAVE_TO_CLOUND_ALT: '/service/pvd/videoimage_pcm', //未关联案事件
			IS_IN_CLOUND: '/service/pvd/imagevideo_exist' //	检测之前是否已保存过
		},
		/**
		 * [initialize 初始化函数]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @return {[]}   []
		 */
		initialize: function(params) {
			//二级高亮
			jQuery("#header .wrapper a").removeClass("active");
			if(localStorage.getItem("activeMenu")){
				var currentLib = JSON.parse(localStorage.getItem("activeMenu")).viewlibs;
				switch (currentLib) {
					case 'workbench':
						jQuery("#header .wrapper a[data-id='14']").addClass("active");break;
					case 'caselib':
						jQuery("#header .wrapper a[data-id='15']").addClass("active");break;
					case 'doubtlib':
						jQuery("#header .wrapper a[data-id='16']").addClass("active");break;
					case 'peoplelib':
						jQuery("#header .wrapper a[data-id='17']").addClass("active");break;
					case 'carlib':
						jQuery("#header .wrapper a[data-id='18']").addClass("active");break;
					default:
						jQuery("#header .wrapper a[data-id='14']").addClass("active");break;
				}
			}			
			this.params = VideoModel.getParams(params);
			this.addHandlebarsHelper();
			var videoData = {};
			var inClound = false;
			this.params.isWorkBench = 0;
			if (this.params.pagetype !== "workbench") {
				this.params.isWorkBench = 1;
			}

			var self = this;
			

			VideoModel.checkXhr(self.params.id,function(res){
				if(res.code === 200){
					inClound = res.data.flag;
				}
			});

			//判断是否显示视频摘要
			//剪切型摘要
			jQuery.ajax({
				url: '/service/pia/getClipSummary',
				data: {
					vid : self.params.id,
					resource : 2
				},
				type: 'GET',
				async: false,
				success: function(res){
					if(res.code == 200){
						if(res.data.videoSummaryShear.timePeriodList.length === 0){
							jQuery("#videosumy").hide();
							self.summaryOverlay = false;
						}else{
							self.params.timePeriodList = res.data.videoSummaryShear.timePeriodList;
						}	
					}else{
						notify.warn('操作异常，请重试');
					}
				},
				error: function(){
					notify.warn('网络异常');
				}
			});

			//叠加型摘要
			jQuery.ajax({
				url: '/service/pia/getOverlaySummary',
				data: {
					color :'',
		            type : '',
		            resource : 2,  //视图库传0
		            vid : self.params.id
				},
				type: 'GET',
				async: false,
				success: function(res){
					if(res.code == 200){
						var data = res.data;
						if (data && data.videoSummaryOverlay.length === 0) {
						 	self.summaryCut = false;
						}else{
							self.params.videoSummaryOverlay = data;
						}
					}else{
						notify.warn('操作异常，请重试');
					}
				},
				error: function(){
					notify.warn('网络异常');
				}
			});

			VideoModel.getVideoInfo(self.params,function(res){
				if (res.code === 200 && !res.data.message) {
					videoData = res.data.video;
					videoData.inClound = inClound;
					// 判断该资源是否关联案事件
					self.isAssociated = videoData.incidentId === null ? false : true;
					self.renderTemplate(videoData, self.params); //渲染模板
					self.params.fileUrl = videoData.path;
					self.name = videoData.name;
					//渲染线索列表内容
					self.listThread(videoData.videoId);
					//权限控制
					(window.permission || permission) && permission.reShow();
				} else if (res.code === 200 && res.data.message) {
					//去掉我的工作台高亮
					jQuery('#header a.item').removeClass('active');
					jQuery("#content").html("<p class='deltext'>该资源在视图库中已被删除</p>");
				} else {
					notify.warn("获取视频信息失败!错误码：" + res1[0].code != 200 ? res1[0].code : res2[0].code);
				}
			},function() {
				notify.warn("网络异常");
			});
		},

		//渲染模板
		/**
		 * [renderTemplate 渲染模板]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[json]}   data   [要渲染在模板上的数据]
		 * @param  {[json]}   params [预留]
		 * @return {[]}          []
		 */
		renderTemplate: function(data, params) {
			var self = this;
			self.passParams = {
				mediaName: data.name,
				incidentId: data.incidentId
			};
			self.params.incidentId = data.incidentId;
			self.params.mediaName = data.name;
			jQuery.when(Toolkit.loadTempl("/module/viewlibs/json/video.json")).done(function(sourceData) {
				if (window.location.href.split("?")[0].indexOf('update') === -1) {
					if(typeof sourceData === "string"){
						self.transData(JSON.parse(sourceData), data); //对视频详情表单翻译		
					}else{
						self.transData(sourceData, data); //对视频详情表单翻译		
					}							
				}

				var source = jQuery('#view-template').html(),
					template = Handlebars.compile(source);

				//渲染视频信息表单
				jQuery('#content .wrapper').html(template(data));
				//
				//保存后不可点击
				if (data.inClound) {
					jQuery(".operate .save-to-clound span").addClass("disable");
					jQuery(".operate .save-to-clound span").html("已保存");
					jQuery(".operate .save-to-clound").prop('disabled', true);
				} else {
					jQuery(".operate .save-to-clound").prop("disabled", false);
				}
				//判断摘要是否存在
				if(!self.summaryOverlay){
					jQuery("#videosumy").hide();
				}
				if(!self.summaryCut){
					jQuery("#videosumyAdd").hide();
				}
				// 检测ocx版本
				if(window.checkPlayer && window.checkPlayer()) {
					return;
				}

				// 案事件不存在时隐藏“所属案事件tab”
				if (!data.incidentId || data.incidentId === '') {
					jQuery('[data-tab=incident]').hide();
					self.breadcrumb();
					logDict.insertMedialog('m4', '查看 ' + self.name + '视频', "", "o4");
				} else {
					VideoModel.getIncidentInfo(self.params,function(res){
						if (res && res.code === 200) {
							//渲染面包屑
							self.incidentInfo = res.data.incident;
							self.breadcrumb(self.incidentInfo.id);
							//给案事件名称赋值
							self.params.incidentName = self.incidentInfo.name;
							logDict.insertMedialog('m4', '查看 ' + self.incidentInfo.name + '案事件的' + self.name + '视频', "", "o4");
						} else {
							notify.error("视频所属案事件请求失败！错误码" + res.code);
						}
					}); //获取视频所属案事件
				}
				//权限控制
				permission.reShow();

				//不显示标志按钮
				if (data.status === 4 || data.status === 2) {
					jQuery(".media .panel .editing").hide();
					jQuery(".media .panel .smartmark").hide();
				}

				//如果是在疑情信息库，则不能操作
				if(self.params.pagetype === "doubtlib"){
					jQuery(".body .operate").hide();
					jQuery(".media .panel .editing").hide();
					jQuery(".media .panel .smartmark").hide();
				}
				//内容区添加滚动条 详情页
				jQuery(".views").tinyscrollbar({
					thumbSize: 36
				});

				//编辑页联动选项
				new CommonCascade({
					firstSelect: '#province',
					secondSelect: '#city',
					thirdSelect: '#country'
				});

				Mplayer.initPlayer({ //播放视频
					"filename": data.path
				});

					
				
				//如果有剪贴型视频
				if(self.params.timePeriodList){
					self.sumyPlay = new CommonOnePlayer({
						container: '.main',
						fileUrl: self.params.fileUrl
					});
					self.sumyPlay.options.enableCutMarkTime = true;
					self.sumyPlay.options.cutMarkTime = params.timePeriodList;
					self.sumyPlay.init();
					jQuery(document).off('click', '.speed-mark').on('click',".speed-mark",function(){
						if (videoView.sumyPlay) {
							videoView.sumyPlay.setOptions({
								cutMarkSpeed: $(this).val()
							});
						};
					});
					// 无目标播放速度
					jQuery(document).off('click', '.speed-nomark').on('click',".speed-nomark",function(){
						if (videoView.sumyPlay) {
							videoView.sumyPlay.setOptions({
								cutNoMarkSpeed: $(this).val()
							});
						};
					});
				}

				if (self.params.videoSummaryOverlay) {
                    var allTime = Mplayer.allTime();
		            overlayPlayBar.init({isNeedMod:false,data: self.params.videoSummaryOverlay.videoSummaryOverlay,shootTime : data.shootTime,
                        playAllTime : allTime});
				};
			});
		},
        transFromShootTime: function (shoottime) {
            var self = this;
            var d = new Date(shoottime);
            var Hours = parseInt(d.getHours()) <10 ? ('0' + d.getHours()) : d.getHours();
            var Data = parseInt(d.getDate()) < 10 ?('0' + d.getDate()) : d.getDate();
            var Minutes = parseInt(d.getMinutes()) < 10 ?('0' + d.getMinutes()) : d.getMinutes();
            var Seconds = parseInt(d.getSeconds()) < 10 ?('0' + d.getSeconds()) : d.getSeconds();
            shoottime = d.getFullYear() + "." + self.getMonth((d.getMonth() + 1))  + "." +Data + " " + Hours + ":" + Minutes + ":" + Seconds;
            return shoottime;
        },
		/**
		 * [setPagination 内容分页]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[int]}   total        [信息总条数]
		 * @param  {[dom]}   selector     [分页所在dom节点]
		 * @param  {[int]}   itemsPerPage [页容量]
		 * @param  {Function} callback     [下一页回调函数]
		 */
		setPagination: function(total, selector, itemsPerPage, callback) {
			jQuery(selector).pagination(total, {
				items_per_page: itemsPerPage,
				num_display_entries: 6,
				num_edge_entries: 0,
				show_cur_all: true,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
				}
			});
		},

		/**
		 * [listThread 获取视频相关的线索列表]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[int/string]}   videoId [当前视频id]
		 * @return {[]}           []
		 */
		listThread: function(videoId) {
			var self = this;
			var orgid = self.params.orgid;
			//获取当前视频线索列表
			jQuery.ajax({
				url: "/service/pvd/clue/video/" + videoId,
				data: {
					id: videoId, //视频id
					orgId: orgid,
					pageNo: 1,
					pageSize: 12
				},
				cacha: false,
				type: 'GET',
				success: function(res) {
					if ((typeof res) === 'string') {
						res = JSON.parse(res);
					}
					if (res.code === 200) {
						// notify.success('获取图片成功');
						self.imageCount = res.data.totalRecords;
						self.setPagination(self.imageCount, '.pagebar.videos', 12, function(nextPage) {
							jQuery.ajax({
								url: "/service/pvd/clue/video/" + videoId,
								type: "get",
								cache: false,
								data: {
									id: videoId,
									orgId: orgid,
									pageNo: nextPage,
									pageSize: 12
								},
								dataType: 'json',
								success: function(res) {
									if (res.code === 200) {
										var data = res.data.records;
										self.showImage(data);
									} else {
										notify.warn("视频线索统计请求失败！错误码：" + res.code);
									}
								}
							});
						});
					} else {
						notify.warn("视频线索统计请求失败！错误码：" + res.code);
					}
				},
				error: function(xhr) {
					notify.warn('网络异常! HTTP STATUS: ' + xhr.status);
				}
			});
		},

		/**
		 * [showImage 渲染图片信息]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[json]}   data [获取的显示数据]
		 * @return {[]}        []
		 */
		showImage: function(data) {
			if (!data) return;
			var items = '';
			var self = this;
			for (var i = 0; i < data.length; i++) {
				// 转化时间格式 
				data[i].std_APPEAR_TIME = Toolkit.mills2datetime(data[i].std_APPEAR_TIME);
				items += "<li data-id='" + data[i].id + "' data-name='" + data[i].name + "'><a class='box'><img src='" + data[i].ctm_THUMBNAIL + "'/></a><p><a>" + VideoModel.trackKeyType(data[i]) + "</a></p><p class='v-address'>" + data[i].location + "</p><p class='v-time'>" + data[i].std_APPEAR_TIME + "</p></li>";
			}
			if (items === '') {
				items = '<span class="picthreadli-span">暂无数据</span>';
			}
			//填充线索列表内容
			jQuery(".overview [data-view='thread'] ul").empty().html(items);
		},

		/**
		 * [breadcrumb 渲染面包屑]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[string]}   incidentId [案事件id]
		 * @return {[]}              []
		 */
		breadcrumb: function(incidentId) {
			var breadA = jQuery('.crumbs > a.first');
			var breadB = jQuery('.crumbs > a.second');
			this.hlight = location.href.split('?')[0].split('/').getLast();
			var currentLib = 'workbench';
			if(localStorage.getItem("activeMenu")){
				currentLib = JSON.parse(localStorage.getItem("activeMenu")).viewlibs;
			}
			if (currentLib === 'workbench') {
				breadA.text('我的工作台');
				breadA.attr('href', '/module/viewlibs/workbench/index.html');
			} else if (currentLib === 'caselib') {
				breadA.text('案事件信息库');
				//不显示标志按钮
				jQuery(".media .panel .editing").hide();
				jQuery(".media .panel .smartmark").hide();
				breadA.attr('href', '/module/viewlibs/caselib/index.html');
			}else if(currentLib === 'carlib'){
				breadA.text('车辆信息库');
			}else if(currentLib === 'peoplelib'){
				breadA.text('人员信息库');
			}
			if (status === 4) {
				if (incidentId) {
					breadA.text('案事件信息库');
					//不显示标志按钮
					jQuery(".media .panel .editing").hide();
					jQuery(".media .panel .smartmark").hide();
					breadA.attr('href', '/viewlibs/caselib/index.html');
				}else{
					breadA.text('疑情信息库');
					//不显示标志按钮
					jQuery(".media .panel .editing").hide();
					jQuery(".media .panel .smartmark").hide();
					breadA.attr('href', '/viewlibs/doubtlib/index.html');
				}
			};
			// 如果从疑情信息过来 面包屑显示为 我的工作台> 视频信息
			if (this.incidentInfo.name) {
				breadB.text(this.incidentInfo.name);

				breadB.attr('href', '/module/viewlibs/details/incident/incident_detail.html?id=' + incidentId + '&pagetype=' + this.params.pagetype + '&orgid=' + this.params.orgid);
			} else {
				breadB.nextAll().hide();
				breadB.text('视频信息').addClass('gray');
				// 将视频上方显示为"结构化信息?条"
				jQuery('.body a.clue > span').text('结构化信息');
			}
		},
		/**
		 * [addHandlebarsHelper 视频详情页助手]
		 * @author limengmeng
		 * @date   2014-10-28
		 */
		addHandlebarsHelper: function() {
			var self = this,
				address = '';

			jQuery.ajax({ //获取地址json
				url: "/module/viewlibs/json/address.json",
				type: "get",
				async: false,
				dataType: "json",
				success: function(data) {
					address = data; //地址在结构化信息切到所属视图信息的时候需要再次用到
				}
			});
			// 控制审核按钮的显隐
			Handlebars.registerHelper('auditBar', function(status, value1, value2, options) {
				if (status === "暂未填写" || status === "") {
					status = 1;
				}
				if (status === value1 || status === value2) {
					return options.fn();
				}

			});

			//判断值不相等
			Handlebars.registerHelper("uneq", function(val1, val2, options) {
				if (val1 !== val2) {
					return options.fn();
				} else {
					return options.inverse();
				}
			});

			Handlebars.registerHelper('textdisabe', function(count) {
				return parseInt(count) === 0 ? "textdisabe" : "";
			});

			// 审核状态 1:未提交；2：待审核；3：未通过；4：已通过；5:再审核
			Handlebars.registerHelper('auditStatus', function(status, value1, options) {
				if (status === "暂未填写" || status === "") {
					status = 1;
				}
				if (status === value1) {
					return options.fn();
				}
			});

			// 非待审核
			Handlebars.registerHelper('unwaitPass', function(status, options) {
				if (status !== 2) {
					return options.fn();
				}
			});
			//待审核
			Handlebars.registerHelper('waitPass', function(status, options) {
				if (status === 2) {
					return options.fn();
				}
			});

			//转化时间格式 时间戳-年月日格式
			Handlebars.registerHelper('datetransfer', function(time, options) {
				var bool = window.location.href.split("?")[0].indexOf("update") === -1;
				if (time && time !== "暂未填写") {
					var date = new Date(time);
					date = date.getFullYear() + '-' + Toolkit.formatLenth(date.getMonth() + 1) + '-' + Toolkit.formatLenth(date.getDate()) + " " + Toolkit.formatLenth(date.getHours()) + ":" + Toolkit.formatLenth(date.getMinutes()) + ":" + Toolkit.formatLenth(date.getSeconds());
					return date;
				} else if (bool) { //详情页翻译为暂未填写
					return "暂未填写";
				}
			});

			//添加选择类名
			Handlebars.registerHelper('selected', function(value1, value2, options) {
				if (value1 === value2) {
					return 'selected';
				}
			});

			//未使用
			Handlebars.registerHelper('translate', function(param1, param2, options) {
				if (param2 === "address") {
					return address[param1] ? address[param1][0] : '';
				}
				return '';
			});

			//转化为数字
			Handlebars.registerHelper('tonum', function(param, options) {
				return param ? param : 0;
			});

			// 将未填写的字段翻译为‘暂未填写’
			Handlebars.registerHelper('null2constant', function(param, options) {
				return param ? param : "暂未填写";
			});

			// 根据当前登录人员判断是否显示编辑和删除按钮
			var userid = jQuery('#userEntry').data('userid');
			Handlebars.registerHelper('isLogUser', function(param1, param2) {
				if (param2 === '暂未填写') {
					param2 = false;
				} else if (!param2) {
					return (userid === param1) ? "show" : "must-hide";
				}
				return ((userid === param1) && param2) ? "show" : "must-hide";
			});

			//为删除按钮助手  是创建者则展示创建者权限，否则为拥有删除权限者
			Handlebars.registerHelper('isOwner', function(param1, param2) {
				if (param2 === 4) {
					return "permission-delete";
				} else {
					return userid === param1 ? "permission-create" : "";
				}
			});
		},

		/**
		 * [switchTab 视频相关信息列表切换]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[json]}   params [该视频相关内容,id,文件类型，orgid等]
		 * @return {[]}          []
		 */
		switchTab: function(params) {
			var self = this;

			jQuery(document).on('click', '.module-head', function() { //展开收拢表单 手风琴效果
				jQuery(this).closest(".module").addClass("active").siblings(".module").removeClass("active");
				jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
					thumbSize: 36
				});
			});

			//获取所属案事件信息
			jQuery(document).on('click', '.tabs li', function() {
				var tab = jQuery(this).data('tab');
				jQuery(this).addClass('active').siblings().removeClass('active');
				jQuery('.views [data-view="' + tab + '"]').addClass('active').siblings().removeClass('active');

				jQuery.when(Toolkit.loadTempl('/module/viewlibs/details/media/inc/track-incident.html'), jQuery.getJSON('/module/viewlibs/json/incident.json')).done(function(source, sourceData) {
					self.transData(sourceData[0], self.incidentInfo);
					source = source instanceof Array ? source[0] : source;
					var template = Handlebars.compile(source);
					jQuery('.media-info .incident').html(template(self.incidentInfo));

					// 点击表单中案事件名称跳转
					jQuery('.common-table tr td a.track-incident').attr('href', '/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/details/incident/incident_detail.html?id=' + self.incidentInfo.id + '&pagetype=' + params.pagetype + '&orgid=' + params.orgid);
				});
			});

			// 跳转到线索页
			jQuery(document).on('click', '[data-view="thread"] ul li p a, [data-view="thread"] ul li .box', function() {
				var id = jQuery(this).parents('li').data('id');
				var name = jQuery(this).parents('li').data('name');
				if (name == "rest") {
					name = "others";
				} else if (name == "moving") {
					name = "move";
				}
				window.location.href = '/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/details/struct/' + name + '.html?origntype=' + name + '&id=' + id + '&incidentname=' + self.incidentInfo.incidentname + '&pagetype=traillist&orgid=' + params.orgid;
			});
		},

		/**
		 * [operate 对该视频删除，保存，标注操作]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[json]}   params [该视频相关内容,id,文件类型，orgid等]
		 * @return {[]}          []
		 */
		operate: function(params) {
			
		},

		/**
		 * [datasJump 跳转到图像处理页面cookie组装]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @return {[]}   []
		 */
		datasJump: function() {
			var passData = {
				pid: id, //视图库中此图片的id
				fileName: name,
				filePath: filepath,
				fileType: "2",
				localPath: localpath,
				source: 'viewlib',
				imageId: that.data('imgid'),
				incidentId: that.data('incidentid') === "暂未填写" ? null : that.data('incidentid'),
				incidentname: self.params.casename ? self.params.casename : null,
				shootTime: that.data('shoottime'),
				notSave: jQuery('.save-to-clound').length === 1 ? true : false //在图片详情页没有保存过云端
			};
			Cookie.write('imagejudgeData', JSON.stringify(passData));
		},
		/**
		 * [makeValueToLib 跳转到人工标注页面cookie组装]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[dom]}   dom [缓存当前视频属性dom]
		 * @return {[]}       []
		 */
		makeValueToLib: function(dom) {
			var self = this;
			var path = jQuery('.media .video').attr('data-path'),
				videoId = jQuery('.media .video').attr('data-videoid'), //国标id
				incidentid = jQuery('.video-block div.panel span.editing').data('incidentid'),
				shootTime = jQuery(dom).data('shoottime');
			shootTime = shootTime ? Toolkit.str2mills(shootTime) : 0;
			var data = {
				id: videoId,
				sourceId: self.params.id, //视频id
				pvdSourceId: self.params.id, //跳转到视图分析区分是否在视图库中
				fileType: "1",
				path: path,
				incidentId: incidentid,
				incidentname: self.incidentInfo.name ? self.incidentInfo.name : null,
				shootTime: shootTime
			};
			Cookie.write("import", JSON.stringify(data));
		},
		/**
		 * [serializeForm 将表单数据转化为json]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[object]}   serverlize [表单数据对象]
		 * @return {[json]}              [表单数据json]
		 */
		serializeForm: function(serverlize) { //表单数据json化
			var json = {};
			for (var i = 0; i < serverlize.length; i++) {
				json[serverlize[i].name] = serverlize[i].value;
			}
			return json;
		},

		/**
		 * [transData 将数据翻译为可读数据显示在页面]
		 * @author limengmeng
		 * @date   2014-10-28
		 * @param  {[object]}   source [需要翻译资源]
		 * @param  {[object]}   data   [翻译后存放数据]
		 * @return {[]}          []
		 */
		transData: function(source, data) { //用于详情页
			for (var item in data) {
				if (data[item] === "" || data[item] === null) { //数据未填写
					if (item === 'incidentId') {
						continue;
					}
					if(data[item] === 0){
						continue;
					}
					data[item] = "暂未填写";
				} else { //有数据时进行翻译比对
					for (var tmp in source[item]) {
						if (tmp == data[item] || parseInt(tmp) === parseInt(data[item])) {
							data[item] = source[item][tmp]; //将code值翻译为对应的文本
							break;
						}
					}
				}
			}
		}
	};
	var videoView = new VideoView();
	return videoView;
});