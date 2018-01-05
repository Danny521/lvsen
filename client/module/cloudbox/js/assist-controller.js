/**/
define(['js/param-parse.js',
	'js/ajax-module.js',
	'js/cloud-view.js',
	'js/cloud-nav.js',
	'/module/imagejudge/resource-process/js/overlayPlayerBar.js',
	'js/mplayer.js',
	'js/ajax-module.js',
	'addPlayer',
	'js/details-interaction.js', 'js/popLayer.js'
], function(PARSE_TOOL, AJAXMODULE, VIEW, cloudNav, overlayPlayerBar, PLAYER, ajaxModule, CommonOnePlayer, DETAILS_INTERACTION) {
	return {
		pageNode: jQuery('.pagination'),
		mPlayer:null,
		cutPlayer:null,
		overlayPlayer:null,
		getELe: function() {
			return {
				barHandleWarp: $(".picture-content .content-controll-bar .bar-handle-warp"),
				barStructedWarp: $(".picture-content .content-controll-bar .bar-structed-warp"),
				picHandleNums: $(".picture-content .content-controll-bar .pic-nums"),
				picStructedNums: $(".picture-content .content-controll-bar .pic-struct-nums"),
				videoBarStructedWarp: $(".video-content .content-controll-bar .bar-structed-warp"),
				videoPicNums: $(".video-content .content-controll-bar .video-struct-nums")
			}
		},
		/*从当前加载左右列表中过滤非文件夹*/
		filterAllListData: function() {
			SCOPE.allListWithNoDir = [];
			$.each(SCOPE.allListData, function(i, n) {
				if (n.fileType !== '0') {
					SCOPE.allListWithNoDir.push(n);
				}
			});
			this.getIndexFromAllList();
		},
		getIndexFromAllList: function() {
			SCOPE.detailsIndex = 0;
			$.each(SCOPE.allListWithNoDir, function(i, n) {
				if (n.id === SCOPE.context.id) {
					SCOPE.detailsIndex = i;
					return;
				}
			});
		},
		makeUp: function(api, callback) {
			var self = this;
			ajaxModule.loadDetails('/service/pcm/' + api).done(function(json) {
				if (json && json.code && json.code === 200 && json.data !== null) {
					if (json.data.sourceType + '' === '1') {
						json.data.hasVideo = true;
					} else {
						json.data.hasVideo = false;
					}
					/*这里需要优化*/
					self.filterAllListData();
					callback && callback(json);
				} else {
					POPLAYER.renderNoData();
				}
			}).fail(function() {
				POPLAYER.renderNoData();
			});
		},
		getPictureDetail: function(id, dataJson) {
			/*调用getPictureDetail之前,必须正确获取到originImageId,如果是从导航点击则从jump2steps里面获取其值*/
			var self = this;
			SCOPE.cedit = SCOPE.iedit;
			if (id) {
				SCOPE.theId = id;
				SCOPE.context.id = id;
			}
			this.makeUp("get_image_info?id=" + SCOPE.context.id, function(res) {
				var data = res.data.image;
				res.data.handleNum && (res.data.image.handleNum = res.data.handleNum);
				res.data.structuredNum && (res.data.image.structuredNum = res.data.structuredNum);
				SCOPE.context = SCOPE.dContext = data; /*记录上下文参数对象 important*/
				SCOPE.contentType = 1; /*0:查看列表,1,查看详情*/
				//因图片加载效果不友好，图片加载完成后先隐藏等回调滚轮初始化完成后在显示图片 by zhangxinyu 2015-10-23
				POPLAYER.renderPicDetails(function() {
					DETAILS_INTERACTION.init();
				});
				if (res.data.handleNum > 0) {
					self.getELe().barHandleWarp.closest("a").show();
					self.getELe().picHandleNums.html(res.data.handleNum);
				} else {
					//console.log($(".picture-content .content-controll-bar .bar-handle-warp"))
					self.getELe().barHandleWarp.closest("a").hide();
				}
				if (res.data.structuredNum > 0) {
					self.getELe().barStructedWarp.show();
					self.getELe().picStructedNums.html(res.data.structuredNum);
				} else {
					self.getELe().barStructedWarp.hide();
				}
				logDict.insertMedialog('m6', '查看 ' + data.fileName + ' 图片','','o4'); // 查看 日志
				dataJson && cloudNav.keepLastTypeSteps(data.fileName, dataJson);
				// 权限(根据是否有对应的模块权限,隐藏图片查看的下方配置按钮) by songxj
				permission.reShow();
			});
		},
		getVideoDetail: function(id, dataJson) {
			/*查看视频的详情*/
			var self = this;
			SCOPE.cedit = SCOPE.vedit;
			if (id) {
				SCOPE.context.id = id;
			}
			this.makeUp("get_video_info?id=" + SCOPE.context.id, function(res) {
				var data = res.data.video;
				if (res.data.handleNum) {
					res.data.video.handleNum = res.data.handleNum;
				}
				if (res.data.structuredNum) {
					res.data.video.structuredNum = res.data.structuredNum;
				}
				SCOPE.context = SCOPE.dContext = data; /*记录上下文参数对象 important*/
				SCOPE.contentType = 1; /*0:查看列表,1,查看详情*/
				POPLAYER.renderVideoDetails();
				DETAILS_INTERACTION.init();
				if (res.data.structuredNum > 0) {
					self.getELe().videoBarStructedWarp.show();
					self.getELe().videoPicNums.html(res.data.structuredNum);
				} else {
					self.getELe().videoBarStructedWarp.hide();
				}
				self.playCameras(data.filePath); /*初始化视频*/
				logDict.insertMedialog('m6', '查看 ' + data.fileName + ' 视频','',data.fileName,'o4'); // 查看 日志
				dataJson && cloudNav.keepLastTypeSteps(data.fileName, dataJson);
				self.getVideoKindType(SCOPE.context.id);
				// 权限(根据是否有对应的模块权限,隐藏视频查看的下方配置按钮) by songxj
				permission.reShow();
				/*获取摘要,判断是否有摘要,显隐摘要按钮*/
				//self.showCutMarkTime();
				/*获取叠加型摘要信息*/
				//self.getMultiPlayer();
			});
		},
		getVideoKindType: function(id) {
			AJAXMODULE.getVideoKindType(id).then(function(res) {
				if (res.code === 200) {
					if (res.data === 2) {
						//有摘要信息显示摘要选项卡
						jQuery('.video-abstract').css({
							"display": "inline-block"
						});
						jQuery(".video-original").css({
							"display": "inline-block"
						});
					} else if (res.data === 3) {
						jQuery('.video-multi').css({
							"display": "inline-block"
						});
						jQuery(".video-original").css({
							"display": "inline-block"
						});
					} else if (res.data === 0) {
						jQuery('.video-multi').css({
							"display": "none"
						});
						jQuery('.video-abstract').css({
							"display": "none"
						});
						jQuery(".video-original").css({
							"display": "none"
						});
					} else if (res.data === 1) {
						jQuery('.video-multi').css({
							"display": "inline-block"
						});
						jQuery('.video-abstract').css({
							"display": "inline-block"
						});
						jQuery(".video-original").css({
							"display": "inline-block"
						});
					}
				}
			})
		},
		/**
		 * [getStructureDetail 获取结构化信息详情]
		 * @param  {[type]}   id       [description]
		 * @param  {[type]}   dataJson [description]
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		getStructureDetail: function(id, structuredName, dataJson, callback) {
			SCOPE.cedit = SCOPE.sedit;
			if (id) {
				SCOPE.theId = id;
				SCOPE.context.id = id;
			}
			this.makeUp("get_structured_ext_info?id=" + SCOPE.context.id, function(res) {
				var data = res.data,
					strtuctureNameType = {
						1: "人员",
						2: "车辆",
						3: "物品",
						4: "场景",
						5: "运动目标",
						6: "其他"
					};
				SCOPE.context = SCOPE.dContext = data; /*记录上下文参数对象 important*/
				SCOPE.contentType = 1; /*0:查看列表,1,查看详情*/
				POPLAYER.renderStrucDetails();
				DETAILS_INTERACTION.init();
				$(".inner-sider.info h4.title").html("结构化信息/线索：" + (structuredName || $(".bg-content").attr("data-structureName") || strtuctureNameType[res.data.structuredType]));
				$(".inner-sider.info h4.title").attr({
					"title": (structuredName || $(".bg-content").attr("data-structureName") || strtuctureNameType[res.data.structuredType])
				});
				/*判断结构化信息有没有视频*/
				/*如果有初始化视频播放*/
				if (SCOPE.context.hasVideo) {
					setTimeout(function() {
						jQuery(".tab-structed-video").css({
							"display": "inline-block"
						});
						jQuery(".tab-structed-pic").css({
							"display": "inline-block"
						});
						jQuery(".pic-and-video .tab-content-item.content-video").show();
					}, 500)
				} else {
					setTimeout(function() {
						jQuery(".tab-structed-video").css({
							"display": "none"
						});
						jQuery(".tab-structed-pic").css({
							"display": "none"
						});
					}, 500)
				}
				if (dataJson) {
					/*从别的模块跳进来,相应数据要赋值*/
					SCOPE.sType = SCOPE.dContext.structuredType - 0;
					SCOPE.context = SCOPE.dContext;
					cloudNav.keepLastTypeSteps(VIEW.getSname(true), dataJson);
					callback && callback();
					logDict.insertMedialog('m6', '查看 ' + VIEW.getSname() + " 结构化信息",'','o4'); // 查看 日志
				}
				// 权限(根据是否有对应的模块权限,隐藏查看结构化信息的下方配置按钮) by songxj
				permission.reShow();
			});
		},
		playCameras: function(path) {
			var self = this;
			/**
			 * 初始化视频播放器，并播放
			 * */
			if (SCOPE.mPlayer === null || self.mPlayer===null) {
				self.mPlayer = SCOPE.mPlayer = PLAYER;
				SCOPE.mPlayer.initPlayer({
					"filename": path
				});
			} else {
				//直接播放
				SCOPE.mPlayer.initPlayer({
					"filename": path
				});
			}
		},
		showCutMarkTime: function() {
			var self = this,
				url = '/service/pia/getClipSummary',
				data = {
					resource: 1,
					vid: SCOPE.context.id
				};
			ajaxModule.getData(url, data).then(function(data) {
				if (data && data.code && data.code === 200) {
					var shear = data.data.videoSummaryShear;
					if (shear && shear.timePeriodList && shear.timePeriodList.length > 0) {
						//显示"查看摘要按钮,倍速设置按钮"
						self.shear = shear.timePeriodList;
						self.initCutPalyer();
					}
				}
			});
		},
		initCutPalyer: function() {
			var self = this;
			if ($(".content-video-abstract .video-wrap .player-container").length === 0) {
				// 初始化剪切型视频组件
				if(self.cutPlayer===null){
					self.cutPlayer = new CommonOnePlayer({
						container: '.content-video-abstract .video-wrap',
						tplUrl: '/module/cloudbox/inc/d-cut-video.html',
						fileUrl: SCOPE.context.filePath,
						enableCutMarkTime: true,
						cutMarkSpeed: jQuery('.speed-mark').val(),
						cutNoMarkSpeed: jQuery('.speed-nomark').val()
					});
				}
				self.cutPlayer.init(undefined, function() {
					//播放器初始化后,标记标注部分,init涉及到模版获取是,是个异步操作
					self.cutPlayer.setCutMarkTime(self.shear);
					
				});
			}
		},
		/*获取叠加型视频信息*/
		getMultiPlayer: function() {
			var self = this;
			jQuery.ajax({
				url: '/service/pia/getOverlaySummary',
				type: 'get',
				data: {
					resource: 1,
					vid: SCOPE.context.id,
					type: '',
					color: ''
				}
			}).then(function(data) {
				if (data && data.code && data.code === 200) {
					if (data.data.videoSummaryOverlay && data.data.videoSummaryOverlay.length > 0) {
						if ($(".content-video-multi .video-wrap .player-container").length === 0) {
							var videoShootTime = $(".video-shoot-time").html();
							if(self.overlayPlayer===null){
								self.overlayPlayer = overlayPlayerBar.OverlayPlayer;

								overlayPlayerBar.init({
									container: '.content-video-multi .video-wrap',
									overlayTplUrl: '/module/cloudbox/inc/d-milit-video.html',
									data: data.data.videoSummaryOverlay,
									date: self.parseTime2(SCOPE.dContext.shootTime),
									isNeedMod: true, ////是否需要加载模板
									inited: false,
									uiocx: '#OVERLAY', //OCX对象ID
									shootTime: self.transFromShootTime(Toolkit.str2mills(videoShootTime)),
									playAllTime: SCOPE.mPlayer.getAllTime()
								});
							}
							
						}
					}
				} else {
					notify.info("获取叠加型视频失败!");
				}
			});
		},
		getMonth: function(month) {
			if (parseInt(month) < 10) {
				month = '0' + month;
			}
			return month
		},
		transFromShootTime: function(shoottime) {
			var self = this;
			var d = new Date(shoottime);
			var Hours = parseInt(d.getHours()) < 10 ? ('0' + d.getHours()) : d.getHours();
			var Data = parseInt(d.getDate()) < 10 ? ('0' + d.getDate()) : d.getDate();
			var Minutes = parseInt(d.getMinutes()) < 10 ? ('0' + d.getMinutes()) : d.getMinutes();
			var Seconds = parseInt(d.getSeconds()) < 10 ? ('0' + d.getSeconds()) : d.getSeconds();
			shoottime = d.getFullYear() + "." + self.getMonth((d.getMonth() + 1)) + "." + Data + " " + Hours + ":" + Minutes + ":" + Seconds;
			return shoottime;

		},
		/*获取视频,图片,结构化的详情*/
		getDetails: function(structuredName) {
			var self = this;
			var type = SCOPE.context.fileType - 0,
				pvdId = SCOPE.context.pvdId,
				fileName = SCOPE.context.fileName,
				structuredType = SCOPE.context.structuredType,
				incidentName = SCOPE.context.incidentname,
				id = SCOPE.context.id;
			var dataItem = {
				data: id,
				type: 'info',
				fileType: 1,
				url: SCOPE.vDetails
			}
			switch (type) {
				case 1:
					self.getVideoDetail(id, dataItem);
					break;
				case 2:
					dataItem.fileType = 2;
					dataItem.url = SCOPE.pDetails;
					self.getPictureDetail(id, dataItem);
					break;
				case 3:
					dataItem.type = 'id';
					dataItem.fileType = 3;
					dataItem.url = SCOPE.sDetails;
					self.getStructureDetail(id, structuredName, dataItem);
					break;
			}
		},
		render: function(name, data) {
			return Handlebars.compile(ajaxModule.tpl[name])(data);
		},
		/*渲染加载列表*/
		makeUpWpage: function(callback) {
			var self = this;
			jQuery('.pagination').html('');
			/*获取要拿取数据的后端接口以及参数*/
			PARSE_TOOL.markParams();

			jQuery.when(ajaxModule.loadData('/service/pcm/' + SCOPE.param, jQuery('.list-content')), ajaxModule.loadTpl(SCOPE.fileList)).done(function(json) {
				if (json && json.code && json.code === 200) {
					var data = json.data;
					SCOPE.totalRecords = data.totalRecords;
					SCOPE.allPageNo = Math.ceil(SCOPE.totalRecords / SCOPE.pageSize);
					//self.findthumbnail(data.records);//获取资源的缩略图
					SCOPE.allListData = data.records;
					/*每当加载一个i额列表,默认取第一条数据作为列表上下文*/
					if (SCOPE.allListData.length > 0) {
						SCOPE.context = SCOPE.allListData[0];
					}
					//在点击上一个时，遇到翻页情况时控制上一个显示的信息
					if ($(".bg-content").attr("data-flag") === "true") {
						SCOPE.context = SCOPE.allListData[SCOPE.allListData.length - 1];
						if (SCOPE.allListData[SCOPE.allListData.length - 1].fileType === "0") {
							notify.info("已经是第一个可查看的资源");
							return;
						}
					}
					SCOPE.contentType = 0; /*查看列表*/
					SCOPE.playStatus = false;
					/*取消掉全选项*/
					VIEW.diableCount();
					/*右上角总数提示*/
					jQuery("#total").html('<b style="color:orange">' + SCOPE.totalRecords + '</b> 个' + VIEW.whichText() + "文件/文件夹");
					var PageCallBack = function(index) {
						SCOPE.pageNo = index;
						self.makeUpWpage(function(html) {
							VIEW.afterMakeup83(html);
							VIEW.tResize();
						});
					};
					/*业务代码*/
					if (callback) {
						callback(self.render(SCOPE.fileList, data));
					}
					/*绘制分页*/
					if (self.pageNode.html() === '') {
						self.pageNode.pagination(SCOPE.totalRecords, {
							'items_per_page': SCOPE.pageSize,
							'current_page': SCOPE.pageNo,
							'first_loading': false,
							'callback': PageCallBack,
							'link_to': "#done"
						});
					}
					/*触发 resize 调整窗口大小*/
					VIEW.tResize();
				} else {
					notify.info("数据返回错误,错误码 : " + json.code);
				}
			}).fail(function() {
				notify.error('获取数据失败！');
			});
		},
		parseTime2: function(mills) {
			var date = new Date(mills),
				formatLenth = Toolkit.formatLenth;
			return date.getFullYear() + '-' + formatLenth(date.getMonth() + 1) + '-' + formatLenth(date.getDate()) + ' ' + formatLenth(date.getHours()) + ':' + formatLenth(date.getMinutes()) + ':' + formatLenth(date.getSeconds());
		},
		// findthumbnail: function(data) {
		// 	for (var i = 0; i < data.length; i++) {
		// 		if (!data[i].thumbnail) {
		// 			jQuery.ajax({
		// 				url: '/service/pia/getOverlaySummary',
		// 				type: 'get',
		// 				async: false,
		// 				data: {
		// 					cid: data[i].id,
		// 					type: "cloudbox"
		// 				}
		// 			}).then(function(data) {
		// 				if (data.code === 200) {
		//                           data[i].thumbnail = data.data.thumbnail;
		// 				}
		// 			})
		// 		}
		// 	}
		// }
	}
})
