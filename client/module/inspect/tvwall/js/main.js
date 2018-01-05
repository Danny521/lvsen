/*global TvLayoutDetail:true, TvWallLyt:true */
/**
 * [电视墙入口]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
require(['/require-conf.js'], function() {
	require(["domReady",
		'/module/common/tvwall/js/controllers/tv-layout-detail-controller.js',
		'/module/common/tvwall/js/models/tv-layout-detail-model.js',
		'/module/common/tvwall/js/models/tvwall-lyt.js',
		'/module/common/tvwall/js/models/tvwall-insert.js',
		'/module/ptz-controller/history/vodhistory.js',
		"/module/inspect/monitor/js/controlbar.js",
		'/module/common/js/player2.js',		
		'/module/common/tvwall/js/controllers/tvwall-wheel.js',
		"base.self",
		"jquery-ui",
		"jquery.watch"
	], function(domReady, TvLayoutDetail,TvLayoutDetailModel, TvWallLyt, tvwallInsert,vodHistory) {
		var lytdata = "";
		var tempLyt = new TvLayoutDetail();
		var player = null;
		var idx = 0;

		tempLyt.layoutContainer = jQuery(".tvList");
		tempLyt.saveFun = function() {};
		//jQuery("#camerasPanel").css("height", jQuery(document).height() - 10);

		// 高亮导航
		/*jQuery("#header .menu>a.item").eq(0).removeClass("active");
		jQuery("#header .menu>a.item").eq(1).addClass("active");*/
		/**
		 * [tvWallLyt description]
		 * @type {TvWallLyt}
		 */
		var tvWallLyt = new TvWallLyt();
		/**
		 * [activate description]
		 * @type {Boolean}
		 */
		tvWallLyt.loadCameras({
			activate: true,
			container: jQuery("#camerasPanel>.treeMenu"),
			callback: function() {

			}
		});
		jQuery("#lypan .scrollbar .thumb").width("30px");
		jQuery("#major .tree .more").remove();
		/**
		 * [form 重载摄像机列表 && 初始化摄像机列表]
		 * @type {[type]}
		 */
		jQuery(document).on('click', '#sidebar .menus .camera', function() {
			jQuery(".form-panel form:first")[0].reset(); //重置搜索表单
			jQuery(".ui.atached.menu .item.dropdown").show(); //恢复分屏切换
			jQuery('#treePanel').children(".mapping").hide();
			tvWallLyt.lookup = false;
			tvWallLyt.loadCameras({
				activate: true,
				container: jQuery("#camerasPanel>.treeMenu")
			});
		});
		/**
		 * [activate 重载摄像机列表]
		 * @type {Boolean}
		 */
		jQuery(document).on('click', '#startInspect', function() {
			jQuery(".ui.atached.menu .item.dropdown").show(); //恢复分屏切换
			jQuery("#interval,.interval-time").attr("disabled", false);
			tvWallLyt.loadCameras({
				activate: false,
				container: jQuery("#camerasPanel>.treeMenu")
			});
			
		});
		/**
		 * [type 加载我的分组摄像机列表]
		 * @type {String}
		 */
		jQuery(document).on("click", "#customize", function() {
			jQuery(".ui.atached.menu .item.dropdown").show(); //恢复分屏切换
			tvWallLyt.loadCameras({
				type: 'org',
				activate: false,
				container: jQuery("#camerasPanel>.treeMenu")
			});			
			
		});
		/**
		 * [form 切换当前摄像机分组类型]
		 * @type {[type]}
		 */
		jQuery(document).on('click', '.item', function() {
			jQuery(this).addClass('active').siblings().removeClass('active');
			jQuery(".ui.atached.menu .item.dropdown").show(); //恢复分屏切换
			jQuery(".form-panel form:first")[0].reset(); //重置搜索表单
			var self = this;
			jQuery('#treePanel>.treeMenu').show();
			jQuery('#treePanel').children(".mapping").hide();
			jQuery('#treePanel').children().filter('.patrol').hide();
			tvWallLyt.lookup = false;
			tvWallLyt.loadCameras({
				type: jQuery(self).data('type'),
				activate: true,
				container: jQuery("#camerasPanel>.treeMenu")
			});
		});
		window.namePattern = /([?"*'\/\\<>:|？“”‘’^&~]|(?!\s)'\s+|\s+'(?!\s))/gi;
		// 自定义分组重命名 OK
		function editGroup(id, name, origin) {
			var node = jQuery(".node[data-id=" + id + "] .group span");
			if (name === '' || name === origin) {
				node.html(origin);
				node.removeClass("edit");
				return;
			}
			if (name.trim().length > 50) {
				notify.error("组名长度不能超过50字符！");
				node.html(origin);
				node.removeClass("edit");
				return;
			}
			if (window.namePattern.test(name.trim())) {
				notify.error("组名不能包含特殊字符！");
				node.html(origin);
				node.removeClass("edit");
				return;
			}

			jQuery.ajax({
				url: "/service/video_access_copy/verify_group_name",
				data: {
					groupName: name
				},
				type: 'get',
				success: function(res) {
					if (res && res.code === 200) {
						if (res.data.flag) {
							notify.error("该分组名称已经存在");
						} else {
							//发送请求
							jQuery.ajax({
								url: '/service/video_access_copy/rename_group',
								data: {
									rename: name,
									id: id
								},
								type: 'post',
								success: function(res) {
									if (res && res.code === 200) {
										//改变此节点的内容
										notify.success("分组名称修改成功！");
										node.removeClass("edit");
										node.attr("title", name);
										node.html(name);
										logDict.insertLog('m1', 'f1', 'o2', 'b1', name); //日志
									} else {
										notify.error("分组名称修改失败，" + res.data);
										node.html(origin);
										node.removeClass("edit");
									}
								},
								error: function(res) {
									notify.error("请检查网络连接！");
								}
							});
						}
					} else {
						notify.warn('分组名称重名验证请求失败');
					}
				},
				error: function() {
					notify.error("分组名称重名验证请求失败");
				}
			});

		}
		// 自定义分组删除 OK
		function removeGroup(id) {
			jQuery.ajax({
				url: '/service/video_access_copy/remove_group',
				data: {
					id: id
				},
				type: 'post',
				success: function(res) {
					if (res && res.code === 200) {
						notify.success("自定义分组删除成功！");
						/*日志start*/
						var grorpName = jQuery(".treeMenu [data-id=" + id + "] .group .text-over").text();
						logDict.insertLog('m1', 'f1', 'o3', 'b1', grorpName);
						/*日志end*/
						jQuery("[data-id=" + id + "]").remove();
					} else {
						notify.error("删除失败，" + res.data);
					}
				},
				error: function() {
					notify.error("请检查网络连接！");
				}
			});
		}

		// 删除自定义分组 oK
		jQuery('#treePanel').on("click", ".group-operator.remove", function(event) {
			event.preventDefault();
			event.stopPropagation();
			var node = jQuery(this).closest(".node");
			new ConfirmDialog({
				title: "警告",
				message: "删除分组将删除该组下的摄像头，确定要删除该分组吗？",
				callback: function() {
					removeGroup(node.data("id"));
				}
			});
		});

		// 自定义分组重命名  OK
		jQuery('#treePanel').on("click", ".group-operator.edit", function(e) {
			e.preventDefault();
			e.stopPropagation();

			var self = this;
			if (jQuery(self).closest(".group").children(".text-over").is(".edit")) {
				return;
			}
			var node = jQuery(self).closest(".group").children("span"),
				groupName = node.text(),
				editPanel = jQuery("<input type='text' maxlength='15' value=" + groupName + ">"),
				hiddenPanel = jQuery("<input type='hidden' value=" + groupName + ">");
			node.text("");
			node.append(editPanel, hiddenPanel);
			node.addClass("edit");
			editPanel.focus();
			// 保存重命名
			var flag = false;
			editPanel.on("blur", function() {
				var value = jQuery(this).val().trim(),
					hidden = jQuery(this).next("input").val().trim(),
					id = jQuery(this).closest(".node").data("id");
				if (!flag) {
					editGroup(id, value, hidden);
				}
				return false;
			}).on("keydown", function(e) {

				var value = jQuery(this).val().trim(),
					hidden = jQuery(this).next("input").val().trim(),
					id = jQuery(this).closest(".node").data("id");
				if (e.keyCode === 13) {
					flag = true;
					editGroup(id, value, hidden);
					return false;
				}
			}).on("click", function(e) { //编辑时不触发.group的点击事件
				return false;
			});

		});
		/**
		 * [renderResult 搜索]
		 * @type {[type]}
		 */
		(function(ajaxModel) {
			var renderResult = function(data) {
				jQuery.when(Toolkit.loadTempl('/module/inspect/common/inc/tree.template_bk.html')).done(function(source) {
					var template = Handlebars.compile(source);
					jQuery("#camerasPanel>.treeMenu").html(template(data));
					jQuery("#camerasPanel>.treeMenu>.tree>.node[data-type='camera']").addClass("search"); //搜索的独立叶节点单独处理
					jQuery("#camerasPanel>.treeMenu>.tree>.node[data-type='camera'] .leaf").draggable({
						helper: "clone",
						zIndex: 1000,
						cursor: "move", //crosshair
						//scope: 'tasks',
						snap: 'li',
						appendTo: "body",
						cursorAt: {
							"left": -10
						},
						start: function (event, ui) {
							window.gTvwallArrayGis = [];
							//参数 0：cameracode 1：id 2：name 3：hdchannel 4：sdchannel
							var cameracode = $(this).closest("li").attr("data-cameracode").trim(),
								id = $(this).closest("li").attr("data-id").trim(),
								name = $(this).closest("li").attr("data-name").trim(),
								hdchannel = $(this).closest("li").attr("data-hdchannel").trim(),
								sdchannel = $(this).closest("li").attr("data-sdchannel").trim();
							window.gTvwallArrayGis = [cameracode, id, name, hdchannel, sdchannel];

							function getChannelId (hd, sd){
							hd = JSON.parse(hd);
							sd = JSON.parse(sd);
							return ((hd.length !== 0) ? hd[0].id : (sd.length !== 0) ? sd[0].id : 0);
						}

					$('.smscreen').droppable({ // 拖放到某个元素时获取该元素
							drop: function () {
								var dom = $(this);
								var sData = {
									serverId:dom.closest('.tv').attr('data-serverid'),
									channelId: getChannelId(window.gTvwallArrayGis[3], window.gTvwallArrayGis[4]), //摄像机id
									window: parseInt(dom.attr('data-id')) - 1, //显示器序号(从0开始)
									screen: parseInt(dom.closest('.tv').attr('data-screenid'))  //窗口序号(从0开始)
								};
								$.ajax({
									url:'/service/md/realstream/open/'+ sData.serverId,
									data:sData,
									type:'post',
									success: function (res) {

										if (res.code === 200) {
											dom.attr({
												'data-screen': sData.screen,
												'data-server':sData.serverId,
												'data-camid':window.gTvwallArrayGis[1],
												'data-ctype':jQuery('#treePanel .node[data-id='+ window.gTvwallArrayGis[1] +']').attr('data-cameratype')
											}).text(window.gTvwallArrayGis[2]).css('background-image', '');
											if (dom.find('.cls').length === 0) {
												dom.append('<i class="cls"></i>');
											}
											notify.success("实时流上墙成功");
										} else if (res.code === 500) {
											notify.error("实时流上墙失败");
										}
									},
									error: function() {
										notify.error("实时流上墙失败");
									}
								})
							}
						})
							
						}
					});
				});
			};
			/**
			 * [rederAjax description]
			 * @type {[type]}
			 */
			var rederAjax = function(key) {
				jQuery.ajax({
					url: "/service/video_access_copy/search_camera" + "?timestamp=" + new Date().getTime(),
					data: {
						key: key.trim(),
						type: jQuery(".tabular > .item.active").attr("data-type"),
						count: 50000,
						offset: 0
					},
					cache: false,
					beforeSend: function() {
						jQuery('#camerasPanel').addClass('loading');
					},
					success: function (res) {
						if (res.code === 200) {
							tvWallLyt.lookup = true;
							jQuery('#camerasPanel').removeClass('loading');
							renderResult(res.data);
	
							//电视墙-我的分组模块增加轮询按钮
							if (location.href.toString().test(/inspect\/tvwall/g) && jQuery('li[data-type="customize"]').hasClass('active')) {
								var node = jQuery('#camerasPanel').find('li.checktree[data-type="group"]');
								if (node.find('i.tv-inspection').length === 0) {
									node.find('a.group').append('<i class="tv-inspection" title="开始轮巡"></i>');
									tvWallLyt.bindInsEvt();
								}
							}


						}
					}
				});
			};
			/**
			 * [name description]
			 * @type {String}
			 */
			jQuery('#treePanel input[name="q"]').watch({
				wait: 1500,
				captureLength: 0,
				//监听的输入长度
				callback: function(key) {
					if (key.trim() === '') {
						return tvWallLyt.loadCameras({
							activate: true,
							container: jQuery("#camerasPanel>.treeMenu")
						});
					}
					rederAjax(key);

				}
			});


			jQuery("#treePanel #definition a").click(function() {
				jQuery("#treePanel #definition .ul-definition").toggle();
			});
			jQuery("#treePanel #definition .ul-definition").mouseleave(function() {
				jQuery("#treePanel #definition .ul-definition").hide();
			});
			/**
			 * [container description]
			 * @type {[type]}
			 */
			jQuery(".ul-definition .sel-def").click(function(event) {
				if (jQuery(this).is(":checked")) {
					if (jQuery(this).hasClass("hd")) {
						jQuery(".treeMenu .hasHD").closest("li.node").show();
					} else if (jQuery(this).hasClass("sd")) {
						jQuery(".treeMenu .hasSD").closest("li.node").show();
					}
				} else {
					if (jQuery(this).hasClass("hd")) {
						jQuery(".treeMenu .hasHD").closest("li.node").hide();
					} else if (jQuery(this).hasClass("sd")) {
						jQuery(".treeMenu .hasSD").closest("li.node").hide();
					}
				}

				var container = jQuery("li.active li.active li.active");

				var sd = jQuery("#treePanel #definition .sel-def.sd").is(":checked");
				var hd = jQuery("#treePanel #definition .sel-def.hd").is(":checked");
				if (container) {
					var sd_num = container.find(".hasSD").length,
						hd_num = container.find(".hasHD").length,
						all_num = sd_num + hd_num;
					var groupName = container.find(".group .text-over").attr("title");
					if (hd && sd) {
						container.find(".group .text-over").html(groupName + "(" + all_num + ")");
					} else if (hd) {
						container.find(".group .text-over").html(groupName + "(" + hd_num + ")");
					} else if (sd) {
						container.find(".group .text-over").html(groupName + "(" + sd_num + ")");
					} else {
						container.find(".group .text-over").html(groupName + "(0)");
					}

				}
				jQuery(".opened").each(function() {
					var hd_num = jQuery(this).attr("hd_num"),
						sd_num = jQuery(this).attr("sd_num"),
						all_num = jQuery(this).attr("all_num");
					var container = jQuery(this).parent(".group").parent("li");
					var groupName = jQuery(this).attr("title");
					if (hd && sd) {
						container.find(".group .text-over").html(groupName + "(" + all_num + ")");
					} else if (hd) {
						container.find(".group .text-over").html(groupName + "(" + hd_num + ")");
					} else if (sd) {
						container.find(".group .text-over").html(groupName + "(" + sd_num + ")");
					} else {
						container.find(".group .text-over").html(groupName + "(0)");
					}
				});

			});


			/**
			 * [watchId description]
			 * @type {[type]}
			 */
			jQuery("#sidebar").on("click", "#cameraadd", function() {
				var watchId = jQuery("#watchId").val();

				jQuery("#patrol .joint-layer").remove();

				tvWallLyt.loadCameras({
					type: 'org',
					activate: false,
					container: jQuery('#camerasPanel .patrol>.treeMenu')
				});

				jQuery("#patrol .node").prepend('<div class="setting-head"><a href="#" class="back add-video-watch-back" data-id="' + watchId + '"> <i></i></a><a href="#" class="ioc-confirm" id="cameraaddconfirm"  data-id="' + watchId + '">确定</a></div>');

				return false;
			});
			
			
			
		
			
			
			
			

		})();

		document.onselectstart = function() {
			event.returnValue = event.srcElement.type === "text";
		};
		
		jQuery('#sidebar').on('click', '.tv-history', function (e) {
			// 先判断用户的比分权限是否不足
			var cData = jQuery(this).closest("li").data();
			if (permission.stopFaultRightById([cData.id - 0])[0] === false) {
				notify.warn("暂无权限访问该摄像头");
				return;
			}
			
			//如果没有播放对象，则初始化
			if (!player) {
				//播放视频
				player = new VideoPlayer({
					layout: 1,
					uiocx: 'injectocx'
				});
				document.getElementById("injectocx").RefreshForGis(100);
			}
			
			//历史调阅				
			var pobj = {
				index: 0,
				data: cData,
				player: player,
				resuorce: "form_tvwall"
			};
			//格式化数据
			pobj.data.hdchannel = pobj.data.hdchannel ? pobj.data.hdchannel : pobj.data.hd_channel;
			pobj.data.sdchannel = pobj.data.sdchannel ? pobj.data.sdchannel : pobj.data.sd_channel;
			//调用历史调阅信息窗
			vodHistory.showDialog({
				center: true
			}, pobj);
			//日志记录，查询XX摄像机的历史视频,add by wujingwen, 2015.08.31
			if (location.href.indexOf("dispatch") >= 0) {
				logDict.insertMedialog("m1", "查看：" + cData.name + "->摄像机历史视频", "f2", "o4", cData.name);
			} else {
				logDict.insertMedialog("m1", "查看：" + cData.name + "->摄像机历史视频", "f1", "o4", cData.name);
			}
			jQuery('#treePanel').find('li.checktree').removeClass('clicked');
			jQuery(this).closest('li.checktree').addClass('clicked');
			e.stopPropagation();
			
		});

		jQuery('#sidebar').on('mouseover', '.leaf', function (e) {
			//判断有无历史录像查看权限
			if (!permission.klass["view-history"]) {
				return;
			} else {
				jQuery(this).find('.tv-history').show();
			}
		});

		jQuery('#sidebar').on('mouseout', '.leaf', function (e) {
			jQuery(this).find('.tv-history').hide();
		});
		
		jQuery('#treePanel').off().on('dblclick', '.leaf', function (evt) {
			//var cData = jQuery(this).closest("li").data();
			var len = jQuery('.smscreen').length;
			window.gTvwallArrayGis = [];
			//参数 0：cameracode 1：id 2：name 3：hdchannel 4：sdchannel
			var cameracode = $(this).closest("li").attr("data-cameracode").trim(),
				id = $(this).closest("li").attr("data-id").trim(),
				name = $(this).closest("li").attr("data-name").trim(),
				hdchannel = $(this).closest("li").attr("data-hdchannel").trim(),
				sdchannel = $(this).closest("li").attr("data-sdchannel").trim();
			window.gTvwallArrayGis = [cameracode, id, name, hdchannel, sdchannel];

			// 加入比分权限判断
			if (permission.stopFaultRightById([id - 0])[0] === false) {
				notify.info("暂无权限访问该摄像头");
				return;
			}

			if (len === jQuery('.smscreen').find('i.cls').length) {
				if (idx === len) {
					idx = 0;
				}
				var elem = document.querySelectorAll('.smscreen')[idx];
				new TvLayoutDetailModel().onWallByData(jQuery(elem));
				idx++
			} else {
				jQuery('.smscreen').each(function (i, e) {
					if (jQuery(e).find('i.cls').length === 0) {
						new TvLayoutDetailModel().onWallByData(jQuery(e))
						return false;
					}
				})
			}

		});
	
		
	});
});
