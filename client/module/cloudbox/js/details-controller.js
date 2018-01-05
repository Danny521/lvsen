define(['ajaxModel',
	'js/ajax-module.js',
	'js/assist-controller.js',
	'js/cloud-module-skip.js',
	'js/details-interaction.js',
	'js/cloud-view.js',
	'js/edit-oper.js',
	'addPlayer',
	'/module/imagejudge/resource-process/js/overlayPlayerBar.js',
	'js/player.js',
	'js/cloud-nav.js'
	],function(Model,AJAXMODULE,ASSIST_CONTROLLER,MODULESKIP,DETAILS_INTERACTION,VIEW,EDIT_OPER,CommonOnePlayer,overlayPlayerBar,Mplayer,cloudNav){
	var bgWrap = jQuery('.bg-wrap');
	var controller = {
		_pagePre:0,
		_pageNext:0,
		_pageCur:0,
		viewPlayer:null,
		init:function(){
			this.loadTpl();
			this.bindEvents();
			this.viewPlayer = Mplayer;
			this.viewPlayer.bindEvents();
		},
		bindEvents:function(){
			var self = this;
			/*1:1*/
			jQuery(document).on('click','.elel',function(){

				/*jQuery('.big-pic').css({
					'width':DETAILS_INTERACTION.bgPicSize.width,
					'height':DETAILS_INTERACTION.bgPicSize.height,
					'top':0,
					'left':0
				});
				if(jQuery(".big-pic").width()>jQuery(".pic-wrap").width()||jQuery(".big-pic").height()>jQuery(".pic-wrap").height()){
					jQuery('.eyes').show();
				}else{
					jQuery('.eyes').hide();
				}*/
			});

			/*删除*/
			/*jQuery(document).on('click','.del',function(){
				var callback = function(){save-to-repository
					setTimeout(function() {
						jQuery('#go_back').trigger('click');
					}, 500);
					if(SCOPE.curListIndex<SCOPE.allListWithNoDir.length-1){
						SCOPE.context = SCOPE.allListWithNoDir[SCOPE.curListIndex+1];
						ASSIST_CONTROLLER.getDetails();
					}else{
						jQuery('.bg-close').trigger('click');
					}
				};
				ASSIST_CONTROLLER.delDialog(callback);
			});*/
			/*切换上一个*/
			jQuery(document).on('click','.left-bar',function(){
				var $bgContent = $(".bg-content"),
					bgContentIndex = $bgContent.attr("data-index"),
					$preDD = $(".content .overview .list-content dd");
				$bgContent.attr({
					"data-flag":"true"
				});
				if((parseInt(bgContentIndex) === 0)){
					if((SCOPE.allListData.length === SCOPE.allListWithNoDir.length)&&(SCOPE.pageNo === 0)){
						notify.info("已经是第一个可查看的资源");
						return;
					}
					self._pageNext = SCOPE.pageNo;
					SCOPE.pageNo -= 1;
					self._pagePre = SCOPE.pageNo;
					SCOPE.sType = '';


					ASSIST_CONTROLLER.makeUpWpage(function(html) {
						VIEW.afterMakeup83(html);
						ASSIST_CONTROLLER.getDetails();
					});
					
					SCOPE.curListIndex = 19;
					SCOPE.detailsIndex = SCOPE.curListIndex;
					$bgContent.attr({
						"data-index":19,
						"data-filetype":SCOPE.context.fileType,
						"data-structureName":$preDD.filter("[data-index='" + 19 + "']").find(".l-name a").attr("data-filename")
					});
				}else{
					if((parseInt(bgContentIndex) === (SCOPE.allListData.length - SCOPE.allListWithNoDir.length))&& (SCOPE.allListData.length !== SCOPE.allListWithNoDir.length)){
						notify.info("已经是第一个可查看的资源");
						return;
					}
					var preInfo;
					//当前20条数据没有文件夹
					if(SCOPE.allListData.length === SCOPE.allListWithNoDir.length){
						preInfo = SCOPE.allListWithNoDir[parseInt(bgContentIndex)-1];
					}else{
						preInfo = SCOPE.allListWithNoDir[parseInt(bgContentIndex)-1-(SCOPE.allListData.length - SCOPE.allListWithNoDir.length)];
					}
					if($bgContent.attr("data-filetype") === $preDD.filter("[data-index='" + (parseInt(bgContentIndex)-1) + "']").attr("data-filetype")){
						$(".eyes").hide();
						$(".outline").css({
							"width":"235px",
							"height":"175px",
							"left":0,
							"top":0
						});
						SCOPE.context = preInfo;
						SCOPE.dContext = SCOPE.context;
						SCOPE.theId = SCOPE.context.id;
						SCOPE.curListIndex = parseInt(bgContentIndex)-1;
						SCOPE.detailsIndex = SCOPE.curListIndex;
						if($bgContent.attr("data-filetype")==="2"){
							self.getImageInfo();
						}else if($bgContent.attr("data-filetype")==="1"){
							self.getOriginalVideoInfos();
						}else if($bgContent.attr("data-filetype")==="3"){
							self.getStructureInfo();
						}
					}else{//前后类型不同时点击下一个要切换模板
						SCOPE.context = preInfo;
						SCOPE.dContext = SCOPE.context;
						SCOPE.theId = SCOPE.context.id;
						SCOPE.curListIndex = (parseInt(bgContentIndex)-1);
						SCOPE.detailsIndex = SCOPE.curListIndex;
						ASSIST_CONTROLLER.getDetails();
					}
					$bgContent.attr({
						"data-index":(parseInt(bgContentIndex)-1),
						"data-filetype":$preDD.filter("[data-index='" + (parseInt(bgContentIndex)-1) + "']").attr("data-filetype"),
						"data-structureName":$preDD.filter("[data-index='" + (parseInt(bgContentIndex)-1) + "']").find(".l-name a").attr("data-filename")
					});
				}
			});
			/*切换下一个*/
			jQuery(document).on('click','.right-bar',function() {
				var $bgContent = jQuery(".bg-content"),
					bgContentIndex = $bgContent.attr("data-index"),
					$nextDD = $(".content .overview .list-content dd");
				$bgContent.attr({
					"data-pre": "false"
				});
				if (self._pageNext > self._pagePre) {
					/*从当前加载左右列表中过滤非文件夹*/
					ASSIST_CONTROLLER.filterAllListData();
					/*每当加载一个i额列表,默认取第一条数据作为列表上下文*/
					if (SCOPE.allListData.length > 0) {
						SCOPE.context = SCOPE.allListData[0];
						SCOPE.theId = SCOPE.context.id;
					}
					self._pagePre = self._pageNext;
				}
				if (parseInt(bgContentIndex) < SCOPE.allListData.length - 1) {
					var nextPicInfo;
					if (SCOPE.allListData.length === SCOPE.allListWithNoDir.length) {
						nextPicInfo = SCOPE.allListWithNoDir[(parseInt(bgContentIndex) + 1)]
					} else {
						nextPicInfo = SCOPE.allListWithNoDir[(parseInt(bgContentIndex) + 1) - (SCOPE.allListData.length - SCOPE.allListWithNoDir.length)]
					}
					if ($bgContent.attr("data-filetype") === $nextDD.filter("[data-index='" + (parseInt(bgContentIndex) + 1) + "']").attr("data-filetype")) {
						$(".eyes").hide();
						$(".outline").css({
							"width": "235px",
							"height": "175px",
							"left": 0,
							"top": 0
						});
						SCOPE.context = nextPicInfo;
						SCOPE.dContext = SCOPE.context;
						SCOPE.theId = SCOPE.context.id;
						SCOPE.curListIndex = parseInt(bgContentIndex) + 1;
						SCOPE.detailsIndex = SCOPE.curListIndex;
						//上一张和下一张都为图片
						if ($bgContent.attr("data-filetype") === "2") {
							self.getImageInfo();
						} else if ($bgContent.attr("data-filetype") === "1") {
							self.getOriginalVideoInfos();
						} else if ($bgContent.attr("data-filetype") === "3") {
							self.getStructureInfo();
						}
						$bgContent.attr({
							"data-index": (parseInt(bgContentIndex) + 1),
							"data-filetype": $nextDD.filter("[data-index='" + (parseInt(bgContentIndex) + 1) + "']").attr("data-filetype"),
							"data-structureName": $nextDD.filter("[data-index='" + (parseInt(bgContentIndex) + 1) + "']").find(".l-name a").attr("data-filename")
						});
					} else {//前后类型不同时点击下一个要切换模板
						SCOPE.context = nextPicInfo;
						SCOPE.dContext = SCOPE.context;
						SCOPE.theId = SCOPE.context.id;
						SCOPE.curListIndex = (parseInt(bgContentIndex) + 1);
						SCOPE.detailsIndex = SCOPE.curListIndex;
						ASSIST_CONTROLLER.getDetails();
					}
				} else {
					if (SCOPE.allPageNo === SCOPE.pageNo + 1) {
						notify.info("已经是最后一个可查看的资源了!");
						return;
					}
					self._pagePre = SCOPE.pageNo;
					SCOPE.pageNo += 1;
					self._pageNext = SCOPE.pageNo;
					SCOPE.sType = '';
					ASSIST_CONTROLLER.makeUpWpage(function (html) {
						VIEW.afterMakeup83(html);
						ASSIST_CONTROLLER.getDetails();
					});
					SCOPE.curListIndex = 0;
					SCOPE.detailsIndex = SCOPE.curListIndex;
					$bgContent.attr({
						"data-index": 0,
						"data-filetype": SCOPE.context.fileType
					});
				}
			});
			/*绑定esc事件*/
			jQuery(document).on('keyup',function(e){
				if(e.which === 27 && bgWrap.css('display') === "block"){
					//bgWrap.fadeOut();
				}
			});
			jQuery(document).on("click",".edit-icon",function(){
				EDIT_OPER.edit();
			});
			jQuery(document).on("click",".cancel-btn",function(){
				EDIT_OPER.cancel();
			});
			jQuery(document).on("click",".save-btn",function(){
				EDIT_OPER.save();
			});
			/**
			 * [点击下一个上一个对结构化信息先只渲染图片，点击视频片段的时候才渲染视频片段]
			 * @param  {[type]}            [description]
			 * @return {[type]}            [description]
			 */
			jQuery(document).on("click",".tab-structed-video",function(){
				var $editInfo = jQuery(".editing-info");
				Model.getData('/service/pcm/get_structured_ext_info', {"id":SCOPE.context.id}).done(function(json) {
					if (json && json.code && json.code === 200 && json.data !== null) {
						if(json.data.filePath){
							self.viewPlayer.options.structInfo = json.data;
							self.viewPlayer.firstPlay=true;
							if (window.checkPlayer && window.checkPlayer()) {
								return;
							}
							self.viewPlayer.initPlayer({
								"filename":json.data.filePath
							})
							//初始化视频并播放
							//ASSIST_CONTROLLER.playCameras(json.data.filePath);
						}else{
							return;
						}
						//重新渲染视频对应的编辑区域的信息
						$editInfo.find(".struct-input-time")[0].value = json.data.appearTime;
						$editInfo.find(".struct-input-remark")[0].value = json.data.remark;
					}
				});
				$(".eyes").hide();
				$(".outline").css({
					"top":0,
					"left":0,
					"width":235+"px",
					"height":175+"px"
				});
				$(".content-controll-bar .elel").hide();
			});
			jQuery(document).on("click",".tab-structed-pic",function(){
				setTimeout(function(){
					$(".content-controll-bar .elel").show();
					self.viewPlayer.close();
				},100)

			});
			jQuery(document).on('click', '.video-abstract', function() {
				ASSIST_CONTROLLER.showCutMarkTime();
				/*剪切摘要*/
				jQuery('.speed-controller').show();
			});
			/*
			 *	视频详情查看原始视频
			 */
			jQuery(document).on('click', '.video-original', function() {
				jQuery('.speed-controller').hide();
			});

			jQuery(document).on('click','.video-multi',function(){
				ASSIST_CONTROLLER.getMultiPlayer();
				/*叠加视频*/
				jQuery('.speed-controller').hide();
			});
			/*
			 * 点击结构化数据跳转结结构化信息列表
			 */
			jQuery(document).on("click", ".bg-content .content-controll-bar .bar-structed-warp", function() {
				var id = jQuery(".bg-content").data("id");
				var name = jQuery(".bg-content").data("structurename");
				window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"cloudbox/index.html?type=4&id=" + id + "&name=" + name);
			});
			/*
			 * 点击图片结果集跳转此图片所在的结果集列表
			 */
			jQuery(document).on("click", ".bg-content .content-controll-bar .handle-nums-info", function() {
				var id = jQuery(".bg-content").data("id");
				var name = jQuery(".bg-content").data("structurename");
				window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"cloudbox/index.html?type=2&title=image&sign=detailToList&id=" + id + "&name=" + name);
			});
			
		},
		loadTpl:function(){
			AJAXMODULE.loadTpl('d-pic');
			AJAXMODULE.loadTpl('d-video');
			AJAXMODULE.loadTpl('d-struc');
		},
		/**
		 * [millsToDate 将毫秒转化为年月日时间]
		 * @param  {[type]} mills [毫秒数]
		 * @return {[type]}       [description]
		 */
		millsToDate:function(mills){
			if(!mills){
				return "暂未填写";
			}
			var date = new Date(mills),
				formatLenth = Toolkit.formatLenth;
			return date.getFullYear() + '-' + formatLenth(date.getMonth() + 1) + '-' + formatLenth(date.getDate()) + ' ' + formatLenth(date.getHours()) + ':' + formatLenth(date.getMinutes()) + ':' + formatLenth(date.getSeconds());
		},
		filesizeChange:function(fileSize){
			if (fileSize < 1024) {
				return fileSize + "B";
			}
			if (fileSize < 1024 * 1024) {
				return (fileSize / 1024).toFixed(2) + "KB";
			}
			if (fileSize < 1024 * 1024 * 1024) {
				return (fileSize / (1024 * 1024)).toFixed(2) + "MB";
			}
			if (fileSize < 1024 * 1024 * 1024 * 1024) {
				return (fileSize / (1024 * 1024 * 1024)).toFixed(2) + "GB";
			}
			if (fileSize < 1024 * 1024 * 1024 * 1024) {
				return (fileSize / (1024 * 1024 * 1024 * 1024)).toFixed(2) + "TB";
			}
		},
		/**
		 * [getImageInfo 获取图片详情]
		 * @return {[type]} [description]
		 */
		getImageInfo:function(){
			var self = this,
				$saveInfo = jQuery(".saved-info"),
				$eyesImage = jQuery(".eyes img"),
				$bigPic = $(".bg-content .big-pic"),
				$editInfo = jQuery(".editing-info");
			Model.getData('/service/pcm/get_image_info',{"id":SCOPE.context.id}).done(function(res){
				if(res && res.code === 200){
					var data = res.data.cloudFile,
						dataJson = {
							data: SCOPE.context.id,
							type: 'info',
							fileType: 2,
							url: SCOPE.pDetails
						};
					pSrc = data.thumbnail;
					//限制图片的大小
					DETAILS_INTERACTION.picReset(pSrc);
					//鹰眼图片变化
					$eyesImage.attr({
						"src":pSrc
					});
					//重新渲染图片
					$bigPic.attr("src",pSrc);
					//获取图片信息，用来控制结构化图片集以及结构化信息数目
					//重新渲染图片对应的信息
					$saveInfo.find(".saved-info-title h4").html(data.fileName);
					$saveInfo.find(".pic-length").html(self.filesizeChange(data.fileSize));
					$saveInfo.find(".pic-format").html(data.fileFormat);
					$saveInfo.find(".pic-create-time").html(self.millsToDate(data.storageTime));
					$saveInfo.find(".pic-shoot-time").html(self.millsToDate(data.adjustTime));
					if(data.remark===null){
						$saveInfo.find(".pic-remark").html("无");
					}else{
						$saveInfo.find(".pic-remark").html(data.remark);
					}
					//重新渲染图片对应的编辑区域的信息
					$editInfo.find(".pic-input-title")[0].value = data.fileName;
					$editInfo.find(".pic-input-shootTime")[0].value = self.millsToDate(data.adjustTime);
					$editInfo.find(".pic-input-remark")[0].value = data.remark;
					if(res.data.handleNum>0){
						$(".picture-content .content-controll-bar .handle-nums-info").show();
						$(".picture-content .content-controll-bar .handle-break-line").show();
						$(".picture-content .content-controll-bar .pic-nums").html(res.data.handleNum);
					}else{
						$(".picture-content .content-controll-bar .handle-nums-info").hide();
						$(".picture-content .content-controll-bar .handle-break-line").hide();
					}
					if(res.data.structuredNum>0){
						$(".picture-content .content-controll-bar .structed-nums-info").show();
						$(".picture-content .content-controll-bar .structed-break-line").show();
						$(".picture-content .content-controll-bar .pic-struct-nums").html(res.data.structuredNum);
					}else{
						$(".picture-content .content-controll-bar .structed-nums-info").hide();
						$(".picture-content .content-controll-bar .structed-break-line").hide();
					}
					dataJson && cloudNav.keepLastTypeSteps(data.fileName, dataJson);
				}
			});
		},
		/**
		 * [getOriginalVideoInfos 获取原始视频]
		 * @return {[type]} [description]
		 */
		getOriginalVideoInfos:function(){
			var self = this,
				$saveInfo = jQuery(".saved-info"),
				$editInfo = jQuery(".editing-info");
			//ASSIST_CONTROLLER.playCameras(Vsrc);
			Model.getData('/service/pcm/get_video_info',{"id":SCOPE.context.id}).done(function(json){
				if(json && json.code === 200){
					var data = json.data.cloudFile,
						dataJson = {
							data: SCOPE.context.id,
							type: 'info',
							fileType: 1,
							url: SCOPE.vDetails
						};
					ASSIST_CONTROLLER.playCameras(data.filePath);
					//如果有结构化信息就显示结构化信息
					if(json.data.structuredNum>0){
						$(".video-content .content-controll-bar .video-structed-infos").show();
						$(".video-content .content-controll-bar .video-break-line").show();
						$(".video-content .content-controll-bar .video-struct-nums").html(json.data.structuredNum);
					}else{
						$(".video-content .content-controll-bar .video-structed-infos").hide();
						$(".video-content .content-controll-bar .video-break-line").hide();
					}
					$saveInfo.find(".saved-info-title h4").html(data.fileName);
					$saveInfo.find(".video-size").html(self.filesizeChange(data.fileSize));
					$saveInfo.find(".pic-format").html(data.fileFormat);
					$saveInfo.find(".video-create-time").html(self.millsToDate(data.storageTime));
					$saveInfo.find(".video-shoot-time").html(self.millsToDate(data.adjustTime));
					if(data.remark===null){
						$saveInfo.find(".video-remark").html("无");
					}else{
						$saveInfo.find(".video-remark").html(data.remark);
					}
					//重新渲染视频对应的编辑区域的信息
					$editInfo.find(".video-input-name")[0].value = data.fileName;
					$editInfo.find(".video-input-shootTime")[0].value = self.millsToDate(data.adjustTime);
					$editInfo.find(".video-input-remark")[0].value = data.remark;
					//判断当前显示tabs键
					ASSIST_CONTROLLER.getVideoKindType(SCOPE.context.id);
					//切换视频时保证当前播放视频是原始视频
					$(".video-content .content-video-original").addClass("active").siblings().removeClass("active");
					$(".tab-title-outer .video-original").addClass("active").siblings().removeClass("active");
					dataJson && cloudNav.keepLastTypeSteps(data.fileName, dataJson);
				}
			});
		},
		/**
		 * [getAbsolutInfo 获取剪切型视频]
		 * @return {[type]} [description]
		 */
		getAbsolutInfo:function(){
			Model.getData('/service/pia/getClipSummary',{"vid":SCOPE.context.id,"resource":1}).then(function(json){
				if(json && json.code===200){
					var shear = json.data.videoSummaryShear;
					if (shear && shear.timePeriodList && shear.timePeriodList.length > 0) {
						/*显示"查看摘要按钮,倍速设置按钮"*/
						self.shear = shear.timePeriodList;
						/*有摘要信息显示摘要选项卡*/
						/*setTimeout(function(){
							jQuery('.video-abstract').css({
								"display":"inline-block"
							});
							jQuery(".video-original").css({
								"display":"inline-block"
							});
						},100)*/
						if($(".content-video-abstract .player-container").length>0){
							var player = new CommonOnePlayer({
								fileUrl:SCOPE.context.filePath
							});
							
							player.init(undefined,function(){
								player.setCutMarkTime(self.shear);
							})
						}else{
							ASSIST_CONTROLLER.initCutPalyer();
						}
					}
				}
			});
		},
		/**
		 * [getMilitInfo 获取叠加型视频]
		 * @return {[type]} [description]
		 */
		getMilitInfo:function(){
			Model.getData('/service/pia/getOverlaySummary',{resource: 1,vid: SCOPE.context.id,type:'',color:''}).then(function(json){
				if (json && json.code && json.code === 200) {
					if (json.data.videoSummaryOverlay && json.data.videoSummaryOverlay.length > 0) {
						setTimeout(function(){
							jQuery('.video-multi').css({
								"display":"inline-block"
							});
							jQuery(".video-original").css({
								"display":"inline-block"
							});
						},100)
						if($(".content-video-multi .player-container").length>0){
							overlayPlayerBar.m_options.data = data.data.videoSummaryOverlay;
						}else{
							overlayPlayerBar.init({
								container:'.content-video-multi .video-wrap',
								overlayTplUrl:'/module/cloudbox/inc/d-milit-video.html',
								data: json.data.videoSummaryOverlay,
								date: ASSIST_CONTROLLER.parseTime2(SCOPE.dContext.shootTime),
								isNeedMod : true,////是否需要加载模板
								uiocx: '#OVERLAY'//OCX对象ID
							});
						}
					}
				}
			})
		},
		/**
		 * [getStructureInfo 获取结构化信息]
		 * @return {[type]} [description]
		 */
		getStructureInfo:function(){
			var self = this,
				$bgContent = $(".bg-content"),
				$saveInfo = jQuery(".saved-info"),
				$eyesImage = jQuery(".eyes img"),
				$bigPic = $(".bg-content .big-pic"),
				$editInfo = jQuery(".editing-info");
			Model.getData('/service/pcm/get_structured_ext_info', {"id":SCOPE.context.id}).done(function(res) {
				var structPic;
				if (res && res.code === 200 ) {
					var data = res.data,
					  	dataJson = {
					  		data: SCOPE.context.id,
							type: 'id',
							fileType: 3,
							url: SCOPE.sDetails
					  	};
					SCOPE.context = SCOPE.dContext = data;
					SCOPE.theId = SCOPE.context.id;
					structPic = data.markPath ? data.markPath : data.thumbnail;
					//限制图片的大小
					DETAILS_INTERACTION.picReset(structPic);
					//鹰眼图片变化
					$eyesImage.attr({
						"src":structPic
					});
					//重新渲染图片
					$bigPic.attr("src",structPic);
					//如果存在视频片段时，视频片段的tab键show
					if (data.sourceType + '' === '1') {
						jQuery(".tab-structed-video").css({
							"display":"inline-block"
						});
						jQuery(".tab-structed-pic").css({
							"display":"inline-block"
						});
						jQuery(".pic-and-video .tab-content-item.content-video").show();
					} else {
						jQuery(".tab-structed-video").css({
							"display":"none"
						});
						jQuery(".tab-structed-pic").css({
							"display":"none"
						});
					}
					//重新渲染结构化信息对应的信息
					$saveInfo.find(".saved-info-title h4").html("结构化信息/线索:"+ $bgContent.attr("data-structureName"));
					$saveInfo.find(".appear-time").html(self.millsToDate(data.appearTime));
					$saveInfo.find(".father-video").html(data.fileExtName);
					if(data.remark===null){
						$saveInfo.find(".struc-remark").html("无");
					}else{
						$saveInfo.find(".struc-remark").html(data.remark);
					}
					//重新渲染视频对应的编辑区域的信息
					$editInfo.find(".struct-input-time")[0].value = self.millsToDate(data.appearTime);
					$editInfo.find(".struct-input-remark")[0].value = data.remark;
					cloudNav.keepLastTypeSteps(VIEW.getSname(true), dataJson);
				}
			});
			$(".main-content.pic-and-video .content-pic").addClass("active").siblings().removeClass("active");
			$(".elel").show();
			$(".tab-title-outer .tab-structed-pic").addClass("active").siblings().removeClass("active");
		}
	};

	jQuery(function(){
		/*初始化*/
		controller.init();
	});

});