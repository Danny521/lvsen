define([
	'/module/viewlibs/details/struct/js/model.js',
	'domReady',
	'ajaxModel',
	'/module/viewlibs/common/js/player.js',
	'/module/popLayer/js/popVideo.js',
	'/module/viewlibs/common/js/AssociateIncidentPanel.js',
	'/module/framemark/js/timeline.js',
	'base.self',
	'scrollbar',
	'handlebars',
	'common.cascade',
	'permission',
	'thickbox',
	'jquery-ui-timepicker-addon',
	'jquery.validate'
], function(MediaLoaderModel, domReady, ajaxModel, Mplayer,MplayerHis, AssociateIncidentPanel) {
	function MediaLoaderController() {};
	/**
	 * [prototype description]
	 * @type {MediaLoaderModel}
	 */
	MediaLoaderController.prototype = new MediaLoaderModel();
	MediaLoaderController.prototype.videoPath = ''; //视频路径
	MediaLoaderController.prototype.picPath = ''; //图片路径
	MediaLoaderController.prototype.incidentInfo = ''; //所属案事件的数据
	MediaLoaderController.prototype.mediaInfo = ''; //所属视图信息
	MediaLoaderController.prototype.clue = 1;
	// mediaObj: null,
	MediaLoaderController.prototype.options = {
		sendAjax: window.location.href.split("?")[0].indexOf("create") === -1, //是否从后台取数据，详情页和编辑页面需要，创建页面不需要
		container: jQuery("#content .main"), //模板容器
		callback: jQuery.noop()
	};
	/**
	 * [fireEvent 触发事件处理函数]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @return {[type]}   [description]
	 */
	MediaLoaderController.prototype.fireEvent = function() {
		if (this.onEvt) {
			for (i = 0; i < this.onEvt.length; i++) {
				// if (typeof this.onEvt[i] !== typeof '') {
					this.onEvt[i](); //逐个调用处理函数
				// }
			}
		}
	};
	/**
	 * [addEvent 添加事件处理函数]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   _eventHandler [description]
	 */
	MediaLoaderController.prototype.addEvent = function(eventName, _eventHandler) {
		if (!this.onEvt)
			this.onEvt = []; //存放事件处理函数
		this.onEvt.push(_eventHandler);
	};
	/**
	 * [detachOnEvt 删除]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   _eventHandler [description]
	 * @return {[type]}                 [description]
	 */
	MediaLoaderController.prototype.detachOnEvt = function(_eventHandler) {
		this.onEvt.pop(_eventHandler);
	};
	/**
	 * [initialize description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   options [description]
	 * @return {[type]}           [description]
	 */
	MediaLoaderController.prototype.initialize = function(params) {
		var params = this.params = this.parseURL(params); //解析当前地址路径,转换成对象this.mediaObj
		this.getEntity(); //获取详情页二级以上菜单的json联动数据
		this.addHandlebarsHelper(); //为结构化信息添加助手
		this.bindEvents(params);
		var flag = window.location.href.split("?")[0].indexOf('update') === -1; //是否是详情
		if (flag) {
			this.loadResource(params);
		}
	};
	/**
	 * [bindEvents description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   params [description]
	 * @return {[type]}          [description]
	 */
	MediaLoaderController.prototype.bindEvents = function(params) {
		var self = this;
		self.switchTab(params); //手风琴效果及选项卡切换
		self.resourceOpt(params); //资源操作区,包括编辑,删除,下载等.
		//结构化信息生成线索
		jQuery(document).on('click', '.tabview a.save-to-thread', function() {
			if (!params.incidentname) {
				params.incidentname = self.incidentInfo.name;
			}
			new ConfirmDialog({
				classes: 'struct',
				title: '提示',
				message: "<div class='dialog-messsage'><h4>您确定将该条结构化信息作为“" + params.incidentname + "案事件”的线索吗？</h4>",
				callback: function() {
					self.structToThread(params.id, params.origntype);
				}
			});
		});
	};
	/**
	 * [renderResult description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   data     [description]
	 * @param  {[type]}   params   [description]
	 * @param  {[type]}   inClound [description]
	 * @return {[type]}            [description]
	 */
	MediaLoaderController.prototype.renderResult = function(data, params, inClound) {
		var self = this;
		var source = jQuery("#view-template").html(),
		    imgsrc ='',
			template = Handlebars.compile(source);
		if (params.translate) { //启用默认翻译 详情页
			jQuery.getJSON(params.translateUrl, function(sourceData) {
				self.transData(sourceData, data[params.origntype]);
				params.container.html(template(data));
				//jQuery(".entity-img").attr('src', data[params.origntype].markPath);
				if (data[params.origntype].sceneImg) {
					imgsrc = data[params.origntype].sceneImg;
				} else {
					imgsrc = params.markPath;
				}

				jQuery(".entity-img").load(function() {
					//params.points得到结构化画图的坐标
					if (params.points) {
						var pointsArr = params.points.split(",")[0];
						var img = new Image();
						img.onload=function(){

							var width =img.width;
							var height =img.height;
							var ratioX = jQuery(".entity-img").width() / width;
							var ratioY = jQuery(".entity-img").height() / height;

							jQuery(".picture").append("<div id='paper' style=' position:absolute; z-index: 1000; top: 0;'></div>");
							jQuery("#paper").css({
								"margin-left": (jQuery(".picture").width()-jQuery(".entity-img").width())/2,
								"margin-top": (jQuery(".picture").height()-jQuery(".entity-img").height())/2,
							    "left": (pointsArr.split(".")[0]) * ratioX,
								"top": (pointsArr.split(".")[1]) * ratioY,
								"width": (pointsArr.split(".")[2] - pointsArr.split(".")[0]) * ratioX,
								"height": (pointsArr.split(".")[3] - pointsArr.split(".")[1]) * ratioY,
								"border": "1px solid #F00"
							});

						}
						img.src = imgsrc;
					}
				});
				permission.reShow(); //获取权限
				self.getMedia(); //获取所属的视图
				//关联案事件后不显示结构化信息状态
				if (params.incidentname) {
					jQuery(".main .markwrap .audit-status span").eq(1).hide();
				}
				//已通过的结构化信息也不显示状态
				if (data[params.origntype].status === 4) {
					jQuery(".main .markwrap .audit-status span").eq(1).hide();
				}
				//如果是线索不显示审核状态
				self.clue = data[params.origntype].clue;
				if (data[params.origntype].clue === 1 || (data[params.origntype].clue === null && params.incidentname === null) || (data[params.origntype].clue === "暂未填写" && params.incidentname === null)) {
					self.clue = 1;
					jQuery(".entity-preview .markwrap .audit-status span").eq(1) && jQuery(".entity-preview .markwrap .audit-status span").eq(1).hide();
				}
				//保存后不可点
				if (inClound) {
					jQuery(".resources .actions .save-to-clound").addClass("disable");
					jQuery(".resources .actions .save-to-clound").prop('disabled', true);
					jQuery(".resources .actions .save-to-clound").html("已保存");
				} else {
					jQuery(".resources .actions .save-to-clound").prop("disabled", false);
				}
				if (jQuery(".resources.tabview>.views").length) { //详情页滚动条
					self.entityScrollbar = jQuery(".resources.tabview>.views");
					self.entityScrollbar.tinyscrollbar({ //内容区添加滚动条
						thumbSize: 36
					});
				}
				if (jQuery(".main .resources div[data-type='video'] a").size() === 0) {
					if (jQuery("#auditSection").is(":hidden")) {
						jQuery(".main .resources div[data-type='video']").show();
					} else {
						jQuery(".main .resources div[data-type='video']").hide();
					}
				}
			});
		} else { //编辑页
			self.editBindEvents(params);
			params.container.html(template(data));
			jQuery(".entity-img").attr('src', data[params.origntype].markPath);
			permission.reShow(); //获取权限
			if (params.callback) {
				params.callback();
			}
			if (jQuery(".module.active>.module-body").length) { //编辑页滚动条
				self.editScrollBar = jQuery(".module.active>.module-body");
				self.editScrollBar.tinyscrollbar({ //内容区添加滚动条
					thumbSize: 36
				});
			}
			self.fireEvent('COMPLETEDATA');
		}
		//self.breadcrumb(data, params);

	};
	/**
	 * [transData description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   source [description]
	 * @param  {[type]}   data   [description]
	 * @return {[type]}          [description]
	 */
	MediaLoaderController.prototype.transData = function(source, data) { //用于详情页
			if (typeof source === 'string') {
				source = JSON.parse(source);
			}
			for (var item in data) {
				if (item === 'incidentId' || item === 'status') { //如果是案事件的id不翻译,为空;如果返回审核状态不翻译
					continue;
				}
				if(item === 'streets'){
					data[item] = data[item]==='请输入街道详细地址'?'':data[item];
					continue;
				}
				if (data[item] === "" || data[item] === null) { //数据未填写
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
	};
	/**
	 * [updateScrollBar 更新滚动条]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   scrollbar [description]
	 * @return {[type]}             [description]
	 */
	MediaLoaderController.prototype.updateScrollBar = function(scrollbar) {
		if (scrollbar) {
			scrollbar.tinyscrollbar_update('relative');
		}
	};
	/**
	 * [switchTab description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   params [description]
	 * @return {[type]}          [description]
	 */
	MediaLoaderController.prototype.switchTab = function(params) {
		var self = this;
		jQuery(document).on('click', '.module-head', function() { //展开收拢表单 手风琴效果
			jQuery(this).closest(".module").addClass("active").siblings(".module").removeClass("active");
			jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
				thumbSize: 36
			});
		});
		jQuery(document).on('click', '.tabular', function() { //选项卡切换时动态加载滚动条
			self.updateScrollBar(self.entityScrollbar);
		});
		//切换到“所属案事件”选项卡
		jQuery(document).on('click', ".resources .header .tabular li[data-tab='incident']", function() {
			if (!self.incidentInfo) {
				return false;
			}
			var incidentId = self.incidentInfo.id;
			jQuery.when(Toolkit.loadTempl("/module/viewlibs/doubtlib/inc/track-incident.html"), jQuery.getJSON("/module/viewlibs/json/incident.json")).done(function(source, sourceData) {
				self.transData(sourceData[0], self.incidentInfo);
				source = source instanceof Array ? source[0] : source;
				jQuery(".resources .overview .view[data-tab=incident]").html(Handlebars.compile(source)(self.incidentInfo));
				jQuery(".common-table .track-incident").attr('href', '/module/iframe/?windowOpen=1&iframeUrl=/module/viewlibs/details/incident/incident_detail.html?id=' + incidentId + '&pagetype=' + params.pagetype + '&orgid=' + params.orgid);
				jQuery(".resources.tabview>.views").tinyscrollbar({ //内容区添加滚动条
					thumbSize: 36
				});
			});
		});
		//切换到“所属视图资源”选项卡
		jQuery(document).on("click", ".resources .header .tabular li[data-tab='video']", function() {
			self.tabSources();
		});
		Handlebars.registerHelper("ishasName", function(name) {
			if (!!name) {
				return name;
			}else{
				return "暂无填写"
			}

		});
		Handlebars.registerHelper("mills2str", function(mills, options) {
			if (!!mills) {
				return Toolkit.formatDate(new Date(mills));
			}else{
				return "暂无填写"
			}

		});
		Handlebars.registerHelper("isPro", function(lat, lon) {
			if(lat!==undefined && lon===undefined){
				return lat+",";
			}
			if(lat===undefined && lon===undefined){
				return "暂无填写"
			}
			if(lat===undefined && lon!==undefined){
				return ","+lon
			}
			if(lat!==undefined && lon!==undefined){
				return lat+","+lon
			}

		});
		jQuery(document).on('click','.tab-title .tab-title-item',function(){
			// 当切换到播放视频时，检测是否卸载ocx播放插件 by songxj
			if (jQuery(this).attr("data-tab") === "ocxbody") {
				if (window.checkPlayer && window.checkPlayer()) {
					return;
				}
			}

			var $this = jQuery(this),
				index = jQuery(this).attr('data-anchor');
			$this.addClass('active').siblings().removeClass('active');
			//console.log(jQuery('.tab-content').find('[data-target='+index+']'))
			jQuery('.tab-content').find('[data-target='+index+']').addClass('active').siblings().removeClass('active');
		});
		//图片与视频的切换
		jQuery(document).on('click', 'li[data-tab=ocxbody]', function() {
			var videoPath = "";
			var info = "";
			if (jQuery(this).hasClass('clicked')) {
				if (jQuery(this).attr("data-info")) {
					notify.info(jQuery(this).attr("data-info"));
				}
				return;
			}
			// var videoPath = MediaLoaderController.videoPath || jQuery(".video[data-tab=ocxbody]").data('videopath');
			// Mplayer.options.structInfo = MediaLoaderModel.structInfo;
			// Mplayer.initPlayer({
			// 	"filename": videoPath
			// });
			if (MediaLoaderModel.structInfo.cameraId) { //实时结构化视频片段调用OCX历史视频接口
				var videoData = {
					fileName: MediaLoaderModel.structInfo.cameraName,
					fileFormat: "smf",
					fileSize: 537409992,
					remark: 'sfsdfs',
					id: 151,
					shootTime: 1436164199000,
					timeLag: null,
					curListIndex: null,
					fileType: 2,
					sourceType: null,
					cameraId: MediaLoaderModel.structInfo.cameraId,
					"beginTime": MediaLoaderModel.structInfo.startTime,
					"endTime": MediaLoaderModel.structInfo.endTime
				};
				var option = {
					pop_tpl_url: '/module/popLayer/inc/d_video.html',
					videoData: videoData,
					isPopBgWrap:false,//用来判断是否以弹出框的形式展示 true 或者不写 此项则默认为 弹出
                    popBgWarp:$('#VideoWarp'),
                    from: "structure"//add by leon.z 判断是否来自实时结构化
				}
                MplayerHis.init(option);

			} else { //调用NPFS视频片段
				videoPath = MediaLoaderController.videoPath || jQuery(".video[data-tab=ocxbody]").data('videopath');
				Mplayer.options.structInfo = MediaLoaderModel.structInfo;
				//初始化ocx控件(ocx与js相互传参Mplayer.options.structInfo)
				Mplayer.initPlayer({
					"filename": videoPath
				});
			}
			jQuery(this).addClass('clicked');
		});
		jQuery(document).on('click', 'li[data-tab=picture]', function() {
			jQuery(window).resize();
		});
	};
	//在谷歌30版本ocx设置left，-9999残留，调用ocx刷新不起作用，处理为页面刷新。
	window.onresize = function(){
        document.body.style.height = document.body.scrollHeight -1 +'px';
        setTimeout(function(){
        	document.body.style.height = document.body.scrollHeight +'px';
        },10);
    };

	/**
	 * [parseURL description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   href [description]
	 * @return {[type]}        [description]
	 */
	MediaLoaderController.prototype.parseURL = function(href) { //把URL解析为json对象
		var tempObj = Toolkit.paramOfUrl(href);
		var thenUrl = "";
		if (tempObj.origntype == "move") {
			thenUrl = "/service/pvd/moving/" + tempObj.id;
			tempObj.origntype = "moving";
		} else if (tempObj.origntype == "others") {
			thenUrl = "/service/pvd/rest/" + tempObj.id;
			tempObj.origntype = "rest";
		} else if (tempObj.origntype == "face") { //获取实时结构化人脸所在摄像头详细信息
			thenUrl = "/service/pvd/realtime/camera";
		} else if (tempObj.origntype == "body") { //获取实时结构化人体所在摄像头详细信息
			thenUrl = "/service/pvd/realtime/camera";
		}
		else if(tempObj.origntype == "car" && tempObj.points){//获取实时结构化车辆所在摄像头详细信息
            thenUrl = "/service/pvd/realtime/camera";
		} else {
			thenUrl = '/service/pvd/get_' + tempObj.origntype + '_info';
		}
		this.mediaObj = Object.merge({}, tempObj, {
			url: thenUrl,
			translateUrl: '/module/viewlibs/json/' + tempObj.origntype + '.json',
			translate: true,
			container: jQuery('#content .main')
		});
		if (tempObj.orgid === 'undefined' || tempObj.orgid === undefined) {
			this.mediaObj.orgid = '';
		}
		return this.mediaObj;
	};
	/**
	 * [resourceOpt description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   params [description]
	 * @return {[type]}          [description]
	 */
	MediaLoaderController.prototype.resourceOpt = function(params) {
			var self = this;
			jQuery(document).on("click", ".resources .actions .action.edit", function() { //编辑
				var id = jQuery(".resources .actions").data("id");
				if (params.origntype == "rest") {
					var temporigntype = "others";
				} else if (params.origntype == "moving") {
					var temporigntype = "move";
				} else {
					var temporigntype = params.origntype;
				}
				var path = "/module/viewlibs/details/struct/update_" + temporigntype + ".html?id=" + id + '&pagetype=' + params.pagetype;
				window.location.href = path;
			});
			jQuery(document).on("click", ".resources .actions .action.remove", function() { //资源删除
				self.deleteVideoInfo(params);
			});
			//保存至云空间
			jQuery(document).on('click', ".resources .actions .action.save-to-clound", function() {
				var el = jQuery(this);
				// var type = '';
				// switch (params.origntype){
				// 	case 'person':
				// 		type = 1;
				// 		break;
				// 	case 'car':
				// 		type = 2;
				// 		break;
				// 	case 'exhibit':
				// 		type = 3;
				// 		break;
				// 	case 'scene':
				// 		type = 4;
				// 		break;
				// }
				self.saveToClound(el.attr("data-id"), params.origntype, el);
				return false;
			});
			//结构化信息'关联案事件'
			jQuery(document).on('click', ".resources .actions .action.relate", function() {
				AssociateIncidentPanel.show();
			});
			//结构化信息'提交审核'
			jQuery(document).on('click', ".resources .actions .action.audit", function() {
				var btn = jQuery(this);
				//未通过事再提交时为待审核，现在已去掉再审核
				var params = {
					id: btn.attr("data-id"),
					type: btn.attr("data-type"),
					//status: btn.attr("data-status") === "3" ? 5 : 2,
					status: 2,
					_method: "put"
				};
				self.commitAudit(params, btn);
			});
			//结构化信息'审核'
			jQuery(document).on('click', "#auditSection a[id != 'reject']", function() {
				var btn = jQuery(this);
				var params = {
					id: btn.closest("div").attr("data-id"),
					type: btn.closest("div").attr("data-type"),
					_method: "put"
				};
				if (btn.attr("class") === "pass") {
					new ConfirmDialog({
						classes: 'struct',
						title: '提示',
						confirmText: '确认',
						message: '<h3>确认通过该结构化信息？</h3>',
						callback: function() {
							//var info = jQuery("#domPanel textarea").val().trim()
							var info = "";
							/*if(Toolkit.countByte(info) > 250){
								notify.info("内容过长");
								return false;
							}*/
							params.audit_info = info;
							params.status = 4;
							self.auditStruct(params, 1);
						}
					});
				} else {
					new ConfirmDialog({
						classes: 'struct reject',
						title: '提示',
						confirmText: '确认',
						message: '<h3>确认打回该结构化信息？</h3>',
						callback: function() {
							//var info = jQuery("#domPanel .reject textarea").val().trim()
							var info = "";
							/*if(Toolkit.countByte(info)>250){
								notify.info("内容过长");
								return false;
							}*/
							params.audit_info = info;
							params.status = 3;
							self.auditStruct(params, 2);
						}
					});
				}
				self.countAuditInfo();
			});
			//线索 --打回相关案事件
			jQuery(document).on('click', "#reject", function() {
				var btn = jQuery(this);
				var params = {
					id: btn.attr("data-incidentid"),
					status: 3
				};
				new ConfirmDialog({
					classes: 'incident reject',
					title: '提示',
					confirmText: '打回',
					message: '<textarea class="audit-info" placeholder="经审核不合格，打回修改！"></textarea><br/><span class="count">0</span>/<span class="total">250</span>',
					callback: function() {
						self.verifyIncident(params.id, 3); // 3代表打回
					}
				});
			});
			//审核信息字数统计
			jQuery(document).on('keyup', '.common-dialog.incident section > textarea', function(){
				var text = jQuery(this).val(),
				len = text.length;

				if(len > 250){
					jQuery(this).val(text.substring(0, 249));
					notify.info('超过250个字符，请重新输入！');
					return;
				}
				jQuery('.common-dialog.incident section > .count').text(len);

			});
			//8大库查询
			jQuery(document).on('click', '.search_lib', function() {
				var nameSize = jQuery(this).siblings('.title').size();
				var type = nameSize ? jQuery(this).siblings('.title').text() : jQuery(this).closest('tr').find('.attr-name').text();
				var id = jQuery(this).text();
				//console.log("type",type)
				if (type.indexOf('车牌号码') !== -1) {
					eightLib.search('car', id);
				} else if (type.indexOf('证件号码') !== -1) {
					eightLib.search('person', id);
				}
			});
	};
	/**
	 * [countAuditInfo 审核信息计数事件]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @return {[type]}   [description]
	 */
	MediaLoaderController.prototype.countAuditInfo = function() {
			jQuery("#domPanel textarea").bind("keyup", function(event) {
				var num = Toolkit.countByte(jQuery(this).val().trim());
				jQuery(this).closest('div').find("span.count").html(num)
			});
	};
	/**
	 * [getTypeName 根据类型id获取名称 资源类型[1:person  2:car  3:exhibit  4:scene]]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   type [description]
	 * @return {[type]}        [description]
	 */
	MediaLoaderController.prototype.getTypeName = function(type) {
		var resTyepName = "";
		switch (type) {
			case 1:
			case "1":
			case "person":
				resTyepName = "人员";
				break;
			case 2:
			case "2":
			case "car":
				resTyepName = "车辆";
				break;
			case 3:
			case "3":
			case "exhibit":
				resTyepName = "物品";
				break;
			case 4:
			case "4":
			case "scene":
				resTyepName = "场景";
				break;
			case 5:
			case "5":
			case "moving":
				resTyepName = "运动目标";
				break;
			case 6:
			case "6":
			case "rest":
				resTyepName = "其他";
				break;
		}
		return resTyepName;
	};
	/**
	 * [getTypeByStr description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   str [description]
	 * @return {[type]}       [description]
	 */
	MediaLoaderController.prototype.getTypeByStr = function(str) {
			var resTyepName = "";
			switch (str) {
				case 'person':
					resTyepName = "人员";
					break;
				case 'car':
					resTyepName = "车辆";
					break;
				case 'exhibit':
					resTyepName = "物品";
					break;
				case 'scene':
					resTyepName = "场景";
					break;
				case 'moving':
					resTyepName = "运动目标";
					break;
				case 'rest':
					resTyepName = "其他";
					break;
			}
			return resTyepName;
	};
	/**
	 * [editBindEvents 编辑页面的绑定事件]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   params [description]
	 * @return {[type]}          [description]
	 */
	MediaLoaderController.prototype.editBindEvents = function(params) {
		var self = this;
		//取消
		if (params.origntype == "rest") {
			var temporigntype = "others";
		} else if (params.origntype == "moving") {
			var temporigntype = "move";
		} else {
			var temporigntype = params.origntype;
		}
		jQuery(document).on('click', ".submit-wrapper .input-cancel", function() {
			var path = '/module/viewlibs/details/struct/' + temporigntype + '.html?id=' + params.id + '&origntype=' + temporigntype + '&pagetype=' + params.pagetype;
			window.location.href = path;
		});
		jQuery(document).on('blur', 'form input', function(e) {
			var error = jQuery(e.target).hasClass('error');
			if (error) {
				self.editScrollBar.tinyscrollbar_update('relative');
			}
			if (jQuery(".entity-form").find(".error").length === 0) {
				self.editScrollBar.tinyscrollbar_update('relative');
			}
		});
		jQuery(document).on('click', ".entity-form .input-submit", function(e) { //表单提交
			e.preventDefault();
			var formdata = self.serializeForm(jQuery(".entity-form").serializeArray()),
				id = jQuery(".entity-preview").data("id");
			formdata = Object.merge(formdata, {
				"id": id,
				"remark": remark
			});
			var remark = self.makeRemark();
			if (params.origntype == "rest" || params.origntype == "moving") {
				var url = "/service/pvd/" + params.origntype + "_u";
			} else {
				var url = "/service/pvd/update_" + params.origntype + "_info";
			}
			if (params.origntype === "person") {
				formdata = Object.merge({}, formdata, {
					"isDriver": self.isChecked(jQuery("input[name=isDriver]").is(':checked')),
					"isForeigner": self.isChecked(jQuery("input[name=isForeigner]").is(':checked')),
					"isTerrorist": self.isChecked(jQuery("input[name=isTerrorist]").is(':checked')),
					"isWorker": self.isChecked(jQuery("input[name=isWorker]").is(':checked')),
					"isCriminal": self.isChecked(jQuery("input[name=isCriminal]").is(':checked')),
					"isDetain": self.isChecked(jQuery("input[name=isDetain]").is(':checked')),
					"isVictim": self.isChecked(jQuery("input[name=isVictim]").is(':checked'))
				});
			}
			if (params.origntype === 'car') {
				formdata = Object.merge({}, formdata, {
					isFakeLicense: self.isChecked(jQuery('input[name=isFakeLicense]').is(':checked'))
				});
			}
			formdata = JSON.stringify(Object.merge(formdata, {
				"id": id,
				"remark": remark
			}));
			if (jQuery(".entity-form").valid() && jQuery(".entity-form").find(".error").length === 0 && jQuery('.notNull').find("option:selected").val() !== "") {
				ajaxModel.postData(url, {
					"resoureList": formdata
				}, {
					dataType: 'json'
				}).then(function(data) {
					if (data && data.code === 200) {
						notify.success("保存成功！");
						id = id ? id : data.data.id;
						if (params.origntype == "rest") {
							var temporigntype = "others";
						} else if (params.origntype == "moving") {
							var temporigntype = "move";
						} else {
							var temporigntype = params.origntype;
						}
						var path = "/module/viewlibs/details/struct/" + temporigntype;
						path += ".html?id=" + id + "&origntype=" + temporigntype + "&pagetype=" + self.mediaObj.pagetype;
						var type = null;
						switch (params.origntype) {
							case 'person':
								type = '人员';
								break;
							case 'car':
								type = '车辆';
								break;
							case 'exhibit':
								type = '物品';
								break;
							case 'scene':
								type = '场景';
								break;
							case 'rest':
								type = '其他';
								break;
							case 'moving':
								type = '运动目标';
								break;
							default:
						}
						if (self.incidentInfo.name) {
							path += "&incidentname=" + self.incidentInfo.name;
							logDict.insertMedialog('m4', '编辑' + self.incidentInfo.name + '案事件的' + type + '线索表单', "", "o2");
						} else {
							logDict.insertMedialog('m4', '编辑' + type + '结构化信息表单', "", "o2");
						}
						if (self.mediaObj.orgid) {
							path += '&orgid=' + self.mediaObj.orgid;
						} else {
							path += '&orgid=' + '';
						}
						window.location.href = path;
					}
				});
			} else {
				notify.warn("请正确填写相关信息！");
			}
		});
	};
	/**
	 * [isChecked description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   cmd [description]
	 * @return {Boolean}      [description]
	 */
	MediaLoaderController.prototype.isChecked = function(cmd) {
			if (cmd) {
				return 1;
			} else {
				return 0;
			}
	};
	/**
	 * [breadcrumb 面包屑]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @return {[type]}   [description]
	 */
	MediaLoaderController.prototype.breadcrumb = function() {
		var self = this;
		var params = this.params;
		var incidentid = self.incidentInfo.id;
		var incidentname = self.incidentInfo.name;
		var cameraName = MediaLoaderModel.structInfo.cameraName;
		var a0 = jQuery(".breadcrumb li:eq(0) a");
		var a1 = jQuery(".breadcrumb li:eq(1) a");
		var a2 = jQuery(".breadcrumb li:eq(2) a");
		var a3 = jQuery(".breadcrumb li:eq(3)");
		//第二个面包屑 案事件的参数
		var arg1 = '?id=' + incidentid + '&pagetype=' + params.pagetype + '&orgid=' + params.orgid;
		//第三个面包屑 线索列表的参数
		var arg2 = '?incidentid=' + incidentid + '&incidentname=' + incidentname + '&pagetype=traillist' + '&home=' + params.pagetype + '&orgid=' + params.orgid;
		self.hrefNum = '3';
		if (params.pagetype === 'workbench') { //工作台
			a0.text('我的工作台');
			a0.attr('href', '/module/viewlibs/workbench/index.html');
			self.hrefNum = '3-5';
		} else if (params.pagetype === 'caselib') { //案事件过来的线索
			a0.text('案事件信息库');
			a0.attr('href', '/module/viewlibs/caselib/index.html');
			self.hrefNum = '3-6';
		} else if (params.pagetype === 'doubtlib') { //疑情过来结构化信息
			a0.text('疑情信息库');
			a0.attr('href', '/module/viewlibs/doubtlib/index.html');
			self.hrefNum = '3-21';
		} else if (params.pagetype === 'peoplelib') {
			a0.text('人员信息库');
			a0.attr('href', '/module/viewlibs/peoplelib/index.html');
			self.hrefNum = '3-22';
		} else if (params.pagetype === 'carlib') {
			a0.text('车辆信息库');
			a0.attr('href', '/module/viewlibs/carlib/index.html');
			self.hrefNum = '3-23';
		}
		//案事件信息库里面点击线索 显示为和二级导航一致
		var currentSedHeight = window.localStorage.getItem('activeMenu');
		currentSedHeight = JSON.parse(currentSedHeight);
		if (currentSedHeight.viewlibs == "caselib") {
			a0.text('案事件信息库');
			a0.attr('href', '/module/viewlibs/caselib/index.html');
			self.hrefNum = '3-6';
		}
		a1.attr('href', '/module/viewlibs/details/incident/incident_detail.html' + arg1);
		a2.attr('href', '/module/viewlibs/workbench/index.html' + arg2);
		if (self.incidentInfo && incidentname) { //线索
			a1.text(incidentname);
			if (self.clue == 2) {
				a2.text("结构化信息列表")
				a2.attr('href', '/module/viewlibs/workbench/index.html'+arg2+'&clue=2');
			}
		} else { //结构化信息
			if (params.cameraChannelId) {//实时视频标注
				a1.attr("href",'/module/viewlibs/doubtlib/index.html?types=realtime');
				a2.text(cameraName);
                a2.attr("href", '/module/viewlibs/doubtlib/index.html?cameraChannelId=' + params.cameraChannelId + '&pageNum=' + params.pageNum + '&dataType=' + params.dataType + '&timeType=' + params.timeType + '&sortType=' + params.sortType + '&key=' + params.key + '&startTime=' + params.startTime + '&endTime=' + params.endTime);
			} else {
				a1.closest('li').hide();
				a2.closest('li').hide();
				a3.text('结构化信息');
			}
		}
	};
	/**
	 * [makeRemark description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @return {[type]}   [description]
	 */
	MediaLoaderController.prototype.makeRemark = function() { //根据填写的表单字段生成remark字段
		var form = jQuery(".resources form"),
			remark = [],
			selectItems = form.find(".input-select"),
			textItems = form.find(".input-text"),
			textareaItems = form.find(".input-area"),
			selectLen = selectItems.length,
			textLen = textItems.length,
			textareaLen = textareaItems.length;
		for (var i = 0; i < selectLen; i++) { //下拉框
			if (jQuery(selectItems[i]).find(":selected").val()) {
				remark.push(jQuery(selectItems[i]).find(":selected").text());
			}
		}
		for (var j = 0; j < textLen; j++) { //输入框input-text
			if (jQuery(textItems[j]).val()) {
				remark.push(jQuery(textItems[j]).val());
			}
		}
		for (var k = 0; k < textareaLen; k++) { //输入框input-area
			if (jQuery(textareaItems[k]).val()) {
				remark.push(jQuery(textareaItems[k]).val());
			}
		}
		return remark.join(",");
	};
	/**
	 * [serializeForm description]
	 * @author wumengmeng
	 * @date   2014-12-12
	 * @param  {[type]}   serverlize [description]
	 * @return {[type]}              [description]
	 */
	MediaLoaderController.prototype.serializeForm = function(serverlize) { //表单数据json化
		var json = {};
		for (var i = 0; i < serverlize.length; i++) {
			json[serverlize[i].name] = serverlize[i].value;
		}
		return json;
	};
	return MediaLoaderController;
});
