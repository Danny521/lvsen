/**
 * [电视墙左侧树]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	"domReady",
	"/module/common/tvwall/js/views/tvwall-views.js",
	"ajaxModel",
	"/module/common/tvwall/js/models/tv-layout-detail-model.js",
	'/module/common/tvwall/js/views/tvwall-inspect.js',
	//'/module/inspect/dispatch/js/sidebar/plugin-moveDom.js',
	"/module/common/tvwall/js/models/tvwall-insert.js",
	"base.self",
	'jquery-ui'
], function(domReady, tvwallViews, ajaxModel, tvDetailM, inspection, tvwallInsert ) {
	var tvDM = new tvDetailM();

	function TvWallLyt() {
		this.initialize(this.options);
		player = null;

	}
	TvWallLyt.prototype = {
		/**
		 * [options description]
		 * @type {Object}
		 */
		options: {
			id: '',

			// 分组类型 org|system|customize
			type: 'org',

			// 加载地址
			url: "/service/video_access_copy/list_cameras",

			// 模板路径
			template: '/module/inspect/common/inc/tree.template_bk.html',

			// 操作按钮模板
			operatorTemplate: '/module/inspect/common/inc/operator.template.html',

			// 菜单容器
			container: jQuery(".treeMenu"),

			// 回调
			callback: jQuery.noop,
			//当前分组id
            currentGroupId: -1,
            //当前上墙第一个相机在列表的下标
            cameraIndex: 0,
            //分组相机通道id数据
            channelIdArr: [],
			// 是否切换回树形菜单面板
			activate: true,
			lookup: false
		},
		/**
		 * [initialize description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   options [description]
		 * @return {[type]}           [description]
		 */
		initialize: function(options) {

			var self = this;
			/*self.cameraCache=new Hash();*/

			var camera = jQuery('.menus .camera'),
				navtab = jQuery(".patrol[data-tab='patrol']");
			tvwallViews.treeView();

			Handlebars.registerHelper('enable', function(expect, options) {
				return false; //取消摄像机树选择框
				var bool1 = expect ? !camera.is(".active") : camera.is(".active"),
					bool2 = expect ? navtab.is(".active") : false,
					bool = (bool1 || bool2);
				return bool ? options.fn(this) : options.inverse(this);
			});
			Handlebars.registerHelper('checktree', function(options) { //有复选框时添加额外类名checktree
				var bool = !camera.is(".active");
				return bool ? 'checktree' : '';
			});
			Handlebars.registerHelper('customize', function(options) {
				return self.options.type === 'customize' ? options.fn(this) : options.inverse(this);
			});

			this.bindEvents(options);
		},
		/**
		 * [loadCameras 加载电视墙左侧树]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   params [description]
		 * @return {[type]}          [description]
		 */
		loadCameras: function(params) {
			var options = Object.merge({}, this.options, params);

			// 当前请求是否为根节点
			this.isRoot = !options.id;
			this.options.type = options.type;
			this.options.container = options.container;

			// 是否切换回树形菜单面板
			this.activate = typeof params.activate === 'undefined' ? this.activate : params.activate;

			// 如果是根节点 清空容器
			if (this.isRoot) {
				options.container.empty();
			}

			// 保持单例模式
			/*if (this.ajaxRequest) {
				this.ajaxRequest.abort();
			}*/
			ajaxModel.abortAjax(this.options.url);
			// 开始发送请求
			var self = this;
			this.ajaxRequest = ajaxModel.getData(self.options.url, {
				id: options.id,
				type: options.type,
				isRoot:1
			}, {
				cache: false,
				beforeSend: function() {
					var textMap = {
						org: '视频资源',
						system: '系统分组',
						customize: '我的分组'
					};
					if (self.isRoot) {
						jQuery('#camerasPanel').addClass('loading');
					}
					jQuery('#camerasType').html(textMap[options.type]);
					jQuery('#camerasType').attr("data-type", options.type);

					// 默认激活447树形菜单面板
					if (self.activate) {
						jQuery('.menus .camera').tab('activate');
					}
				},
				complete: function() {
					jQuery('#camerasPanel').removeClass('loading');
				}
			}).then(function(res) {
				if (res.code === 200) {
					/*if(res.data.cameras.length>100){//子节点数目超过100才采用本地存储，以分次渲染
						self.renderTree({'cameras':res.data.cameras.slice(0,100)}, options);
						self.cameraCache.set(options.id,res.data.cameras);//分组数据
					}else{*/
					self.renderTree(res.data, options);


					/*}
					 */
				} else {
					notify.error("获取数据失败！");
				}
			});
		},
		/**
		 * [renderTree description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   data    [description]
		 * @param  {[type]}   options [description]
		 * @return {[type]}           [description]
		 */
		renderTree: function(data, options) {
			var self = this;
			jQuery.when(this.loadTemplate(options.template)).done(function(source) {

				var fragment = $(Handlebars.compile(source)(data)),
					container = options.id ? jQuery(options.container).find('li[data-type="group"][data-id="{0}"]'.format(options.id)) : jQuery(options.container);
				container.children('.loading').remove();
				container.append(fragment);

				//----------------------------过滤高标清
				/*if (data.cameras.length && data.cameras[0].type && data.cameras[0].type === "camera") {
					container.find(".group .text-over").addClass('opened'); //标记已展开
					var groupName = container.find(".group .text-over").html();

					var sd = jQuery("#treePanel #definition .sel-def.sd").is(":checked");
					var hd = jQuery("#treePanel #definition .sel-def.hd").is(":checked");
					var sd_num = container.find(".hasSD").length,
						hd_num = container.find(".hasHD").length,
						all_num = sd_num + hd_num;
					container.find(".group .text-over").attr("sd_num", sd_num);
					container.find(".group .text-over").attr("hd_num", hd_num);
					container.find(".group .text-over").attr("all_num", all_num);
					// console.info("sd_num="+sd_num+",hd_num="+hd_num+",all_num="+all_num);
					if (hd) {
						container.find(".hasHD").closest("li.node").show();
					} else {
						container.find(".hasHD").closest("li.node").hide();
					}
					if (sd) {
						container.find(".hasSD").closest("li.node").show();
					} else {
						container.find(".hasSD").closest("li.node").hide();
					}

					if (hd && sd) {
						container.find(".group .text-over").html(groupName + "(" + all_num + ")");
					} else if (hd) {
						container.find(".group .text-over").html(groupName + "(" + hd_num + ")");
					} else if (sd) {
						container.find(".group .text-over").html(groupName + "(" + sd_num + ")");
					} else {
						container.find(".group .text-over").html(groupName + "(0)");
					}

				}*/

				// alert(container.find(".group .text-over").html());
				// container.find(".group .text-over").html(container.find(".group .text-over").html()+sd_num);
				// console.info(container.find("ul.tree ul.tree").html());

				//------------------------------------

				/**
				 * 在轮巡界面，隐藏全局搜索框  备注：临时修改方案，改方案会有闪烁现象
				 */
				/*-------code start-------*/
				if (jQuery(".menus li[data-tab='inspect']").hasClass('active') || jQuery(".menus li[data-tab='customize']").hasClass('active')) {
					jQuery('.form-panel [data-tab="cameras"]').removeClass('active'); //隐藏全局搜索按钮
				}
				jQuery(".tabular .camera .dropdown").removeClass('active'); //隐藏下拉面板

				/*-------code end-------*/

				fragment.find("li[data-type='camera'] .leaf").draggable({
					helper: "clone",
					zIndex: 1000,
					cursor: "move", //crosshair
					//scope: 'tasks',
					snap:'li',
					appendTo: "body",
					cursorAt: {
						"left": -10
					},
					start: function(event, ui) {
						//参数 0：cameracode 1：id 2：name 3：hdchannel 4：sdchannel
						var cameracode = $(this).closest("li").attr("data-cameracode").trim(),
							id = $(this).closest("li").attr("data-id").trim(),
							name = $(this).closest("li").attr("data-name").trim(),
							hdchannel = $(this).closest("li").attr("data-hdchannel").trim(),
							sdchannel = $(this).closest("li").attr("data-sdchannel").trim();
						if (permission.stopFaultRightById([id - 0])[0] === false) {
							notify.info("暂无权限访问该摄像头");
							return;
						}

						if (window.tvWallIntv) {
							window.clearInterval(window.tvWallIntv);
						}
						window.gTvwallArrayGis = [];
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
											dom.attr('data-cameraid', window.gTvwallArrayGis[1]);
											if (dom.find('.cls').length === 0) {
												dom.append('<i class="cls"></i><i class="real-stream" title="播放视频"></i>');
											}
											notify.success("实时流上墙成功");
											logDict.insertMedialog("m1", "摄像机" + name + "上墙成功！", "", "", name);
											//上墙成功后执行定时器刷新当前布局
											tvwallInsert.rendLoop(jQuery(".changeLyt select option:selected").attr('data-id'));
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



				// container.trigger("renderCamera");

				// 若是根节点且只有唯一分组 自动展开
				// && container.find('.node').length === 1
				if (self.isRoot) {
					var firstGroup = jQuery(container).find('.group:first');
					if (firstGroup.siblings('.loading, .tree').length === 0) {
						firstGroup.trigger('click');
					}
				}
				ScrollListener.start();


				//电视墙-我的分组模块增加轮询按钮
				if (location.href.toString().test(/inspect\/tvwall/g) && jQuery('li[data-type="customize"]').hasClass('active')) {
					var group = jQuery('li[data-type="group"]');
					//缓存模板
					self.insTmp = self.loadTemplate('/module/inspect/tvwall/inc/inspect-set.html');
					if (group.length) {
						if (group.find('i.tv-inspection').length === 0) {
							group.find('a.group').append('<i class="tv-inspection" title="开始轮巡"></i>');
						}
                        if (group.find('i.group-on-tv-down').length === 0) {
							group.find('a.group').append('<i class="group-on-tv-down" title="下一组上墙"></i>');
						}
						if (group.find('i.group-on-tv-up').length === 0) {
							group.find('a.group').append('<i class="group-on-tv-up" title="上一组上墙"></i>');
						}
						//绑定自动巡检,事件
						self.bindInsEvt();
					}
				}

			});
		},
		
		insArr:[],
		insTmp: null,
		camTmpData: null,
		curInspectDom: null,

		/**
		 * [getAllScreenOrgRealTotalSize 获取所有未中断服务的屏幕组成的实际的总尺寸(宽、高)]
		 * @author songxj
		 * @param  {[type]} objArr [对象数组]
		 * @return {[type]}        [description]
		 */
		getAllScreenOrgRealTotalSize: function(objArr) {
			// 过滤掉arrObj中屏幕的服务中断的屏幕
			objArr = objArr.filter(function(item) {
				return (item.isAvailable === true);
			});

			var firstObj =  objArr[0],
				maxX = firstObj.x - 0, // 最大x
				maxXWidth = firstObj.width - 0, // 最大x对象的宽度
				maxY = firstObj.y - 0, // 最大y
				maxYHeight = firstObj.height - 0, // 最大y对象的高度
				maxWidth = firstObj.width - 0, // 最大宽度
				maxWidthX = firstObj.x - 0, // 最大宽度对象的x
				maxHeight = firstObj.height - 0, // 最大高度
				maxHeightY = firstObj.y - 0, // 最大高度对象的y
				realTotalWidth = null, // 实际总宽度
				realTotalHeight = null; // 实际总高度

			for (var i = 1, len = objArr.length; i < len; i++) {
				var curObj = objArr[i],
					x = curObj.x - 0,
					y = curObj.y - 0,
					width = curObj.width - 0,
					height = curObj.height - 0;

				if (x > maxX) {
					maxX = x;
					maxXWidth = width;
				}
				if (y > maxY) {
					maxY = y;
					maxYHeight = height;
				}
				if (width > maxWidth) {
					maxWidth = width;
					maxWidthX = x;
				}
				if (height > maxHeight) {
					maxHeight = height;
					maxHeightY = y;
				}
			}

			var maxXAndWidth = Number(maxX) + Number(maxXWidth),
				maxWidthAndX = Number(maxWidth) + Number(maxWidthX),
				maxYAndHeight = Number(maxY) + Number(maxYHeight),
				maxHeightAndY = Number(maxHeight) + Number(maxHeightY);

			realTotalWidth = maxXAndWidth > maxWidthAndX ? maxXAndWidth : maxWidthAndX;
			realTotalHeight = maxYAndHeight > maxHeightAndY ? maxYAndHeight : maxHeightAndY;

			return {
				width: realTotalWidth,
				height: realTotalHeight
			};
		},
		/**
		 * [setPollingArr 设置轮巡数组的值]
		 * @param  {[type]} $screenBox [轮巡屏幕的dom对象]
		 * @author songxj
		 */
		setPollingArr: function() {
			var self = this;

			self.insArr = [];

			jQuery(".polling-screens").find(".screen-box").each(function() {
				var $screenBox = jQuery(this);

				if ($screenBox.hasClass("selected")) {
					var insObj = { // 当前屏幕是否可用
						serverId: $screenBox.data("serverid"),
						screenId: $screenBox.data("screenid"),
						id: $screenBox.data("id"),
						ip: $screenBox.data("serverip"),
						index: 0
					};
					self.insArr.push(insObj);
				}
			});
		},
		/**
		 * [calculatePollingScreenLayout 计算并设置轮巡屏幕的布局]
		 * @author songxj
		 * @param  {[type]} curMonitorArr [当前所选布局的屏幕数组对象]
		 */
		calculatePollingScreenLayout: function(layId, curMonitorArr) {
			// 获取所有屏幕组成的实际总尺寸
			var self = this,
				screensOrgRealTotalSize = self.getAllScreenOrgRealTotalSize(curMonitorArr),
				screensOrgRealTotalWidth = screensOrgRealTotalSize.width,
				screensOrgRealTotalHeight = screensOrgRealTotalSize.height;

			// 设置每个.screen-box元素的位置、尺寸
			jQuery(".polling-screens").find(".screen-box").each(function() {
				var $screenBox = $(this),
					screenX = $screenBox.data("x"),
					screenY = $screenBox.data("y"),
					screenWidth = $screenBox.data("width"),
					screenHeight = $screenBox.data("height"),
					$allScrrens = jQuery(".polling-screens"),
					allWidth = $allScrrens.width(),
					allHeight = $allScrrens.height(),
					widthScale = allWidth / screensOrgRealTotalWidth,
					heightScale = allHeight / screensOrgRealTotalHeight,
					windowIsFree = $screenBox.data("isfree");

				// 屏幕被占用,设置屏幕被占用的样式
				if (!windowIsFree) {
					$screenBox.removeClass("selected").addClass("occupied");
				}

				// 设置每个屏幕的样式
				$screenBox.css({
					left: widthScale * screenX,
					top: heightScale * screenY,
					width: widthScale * screenWidth,
					height: heightScale * screenHeight
				});
			});
		},
		/**
		 * [getCameraDataAndPollingDom 获取摄像机数据以及设置和轮巡按钮状态有关的DOM元素]
		 * @author songxj
		 * @param  {[type]} $pollingBtn [轮巡按钮]
		 */
		getCameraDataAndPollingDom: function($pollingBtn) {
			var self = this;

			// 获取摄像机数据
			self.getInsCamInfo($pollingBtn.closest('li.node'));

			// 设置和轮巡按钮状态有关的DOM元素
			self.targetLi = $pollingBtn.closest("li.node");
			self.curInspectDom = $pollingBtn.closest("a.group");
		},
		/**
		 * [setScreenUsingStatus 标记服务未中断的所有屏幕是否可用]
		 * @author songxj
		 * @param {[type]} layoutWindowInfo [布局窗口数组]
		 * @param {[type]} curMonitorArr    [渲染轮巡的模版数据]
		 */
		setScreenUsingStatus: function(layoutWindowInfo, curMonitorArr) {
			for (var j = 0, layoutLen = layoutWindowInfo.length; j < layoutLen; j++) {
				if (layoutWindowInfo[j].windowInfo) {
					curMonitorArr[j].isAvailable = true; // 屏幕的服务中断,此时不将这些屏幕在轮巡弹框中显示
					var streamStatus = JSON.parse(layoutWindowInfo[j].streamStatus);
					if (streamStatus.length) { // 屏幕的某些分屏被占用了
						curMonitorArr[j].isFree = false; // 屏幕是否是空闲的 不是,故置灰
					} else {
						curMonitorArr[j].isFree = true; // 屏幕是空闲的,故选中
					}
				}
			}
		},
		/**
		 * [showPollingDialog 显示轮询弹出框]
		 * @author songxj
		 * @param {[type]} curMonitorArr [渲染轮巡的模版数据]
		 */
		showPollingDialog: function(curMonitorArr) {
			var self = this,
				pollingTemplate = Handlebars.compile(self.insTmp), // 编译模版
				resultHtml = pollingTemplate(curMonitorArr); // 渲染数据

			// 显示弹出框
			new ConfirmDialog({
				width: 945,
				title: "轮巡设置",
				classes: "polling-dialog",
				message: resultHtml,
				callback: function() {
					var intervalTime = jQuery('#interval').val();
					var inspectName = jQuery(".common-dialog").attr("data-name");
					if (intervalTime) {
						if (parseInt(intervalTime) >= 10 && /^\d+$/.test(intervalTime)) {
							// 开启轮巡
							self.startIns(intervalTime,inspectName);
						} else {
							notify.warn('轮巡间隔时间格式必须是大于10的数字');
							return false;
						}
					} else {
						notify.warn('请输入轮巡间隔时间');
						return false;
					}
				}
			});
			jQuery('.polling-dialog').find('footer').prepend('<div class="ins-time"><label for="interval">间隔时间：</label><input id="interval" type=text value="10"/></div>');
		},
		/**
		 * [getMonitorObjArrOfCurLayout 获取当前布局的通道数组]
		 * @author songxj
		 * @param  {[type]} layId         [布局id]
		 * @param  {[type]} layoutArr     [包含所有布局的数组]
		 */
		getMonitorObjArrOfCurLayout: function(layId, layoutArr) {
			// 从所有布局数组中筛选出当前布局
			var curLayoutData = layoutArr.filter(function(item) {
				return (item.id === layId);
			});
			curLayoutData = curLayoutData[0];

			// 当前布局的通道数组
			return curLayoutData.monitorLayout; // 当前布局的通道数组
		},
		
		bindInsEvt: function () {
			var self = this;
			// 我的分组-->开始轮询 by songxj 2016/5/20
			jQuery('i.tv-inspection').off('click').on('click', function (e) {
				e.preventDefault();
				e.stopPropagation();
				// 获取摄像机数据以及设置和轮巡按钮状态有关的DOM元素
				self.getCameraDataAndPollingDom(jQuery(this));

				// 获取所有布局的信息,用于渲染轮巡弹出框模版
				ajaxModel.getData("/service/config/tvwall/layouts").then(function(res) {
					if (res.code !== 200) {
						notify.warn("服务异常！");
						return;
					}

					// 获取布局id和数组
					var layId = jQuery(".tvHeader select").find("option:selected").data("id"), // 获取当前所选布局的布局id
						layoutArr = res.data.layouts, // 所有布局数组
						curMonitorArr = []; // 用于渲染轮巡弹框模版的数组

					if (!layoutArr.length) {
						notify.warn("无可用电视墙布局，请先设置！");
						return;
					}

					// 获取当前布局的通道数组
					curMonitorArr = self.getMonitorObjArrOfCurLayout(layId, layoutArr); // 当前布局的通道数组
					if (!curMonitorArr.length) {
						notify.warn("该电视墙布局无通道，请先设置！");
						return;
					}

					ajaxModel.getData("/service/md/layout/screenInfo/" + layId).then(function(res) {
						if (res.code !== 200) {
							notify.warn("服务异常！");
							return;
						}

						// 标记服务未中断的所有屏幕是否可用
						var layoutWindowInfo = res.data.layoutWindowInfo;
						self.setScreenUsingStatus(layoutWindowInfo, curMonitorArr);

						// 渲染模版并显示轮巡弹出框(上面步骤均是为了组织渲染模块的curMonitorArr数据做铺垫)
						self.showPollingDialog(curMonitorArr);

						// 计算并设置通道布局样式
						self.calculatePollingScreenLayout(layId, curMonitorArr);

						// 绑定选中和取消屏幕轮巡事件
						self.bindPollingEvent();
					});
				});
			});
            //个人预案批量上墙上一组
            jQuery('i.group-on-tv-up').off('click').on('click', function (e) {
            	e.preventDefault();
				e.stopPropagation();
            	var that = jQuery(this);
            	self.operatorOnTv("up", that);
            });
            //个人预案批量上墙下一组
            jQuery('i.group-on-tv-down').off('click').on('click', function (e) {
            	e.preventDefault();
				e.stopPropagation();
            	var that = jQuery(this);
            	self.operatorOnTv("down", that);       	
            });
		},
		/**
		 * [operatorOnTv 批量上墙]
		 * @param  {[type]} type [description]
		 * @param  {[type]} that [description]
		 * @return {[type]}      [description]
		 */
		operatorOnTv: function(type, that) {
			var self = this;
			//清除之前分组相机的上墙状态
			jQuery("#camerasPanel .tree").find(".node li").removeClass("selected");
			//切换我的分组
			var currentGroupId = that.closest("li").data("id");
			if (currentGroupId !== self.options.currentGroupId) {
				self.options.cameraIndex = 0;
				self.options.channelIdArr.length = 0;
			}
			self.getTvChannel(function(onTvCameraNum) {
				if (onTvCameraNum > 0) {
					if (self.options.channelIdArr.length === 0) {
						//若分组未展开则先展开
						if (!that.closest("li").hasClass("active")) {
							self.toggleGroup({
								node: that.closest("li")
							});
						}
						self.findChannelId(that);
					}
					var params = self.getTvData(onTvCameraNum, type, that);
					self.setTvWall(params, type, function(type) {
						//上墙失败
						if(type){
                           self.updateCameraIndex(type, onTvCameraNum);
						} else {
							self.showTvWallCamera(params, that);
							self.options.currentGroupId = currentGroupId;
						}
					});
				} else {
					notify.warn("没有可用的通道！");
					return;
				}
			});
		},
		/**
		 * [bindPollingEvent 绑定选中和取消屏幕轮巡事件]
		 * @author songxj
		 */
		bindPollingEvent: function() {
			jQuery(".polling-screens").find(".screen-box:not(.occupied)").off("click").on("click", function() {
				jQuery(this).toggleClass("selected");
			});
		},
		showTvWallCamera: function(data, dom){
			var self = this,
			    $cameras = dom.closest(".active").find(".node");
			$cameras.removeClass("selected");
			for (var i = 0; i < $cameras.length; i++) {
				if ($($cameras[i]).data("hdchannel").length > 2) {
					var hdchannel = $($cameras[i]).data("hdchannel");
					for (var j = 0; j < data.length; j++) {
						if (hdchannel[0].id === data[j]) {
							$($cameras[i]).addClass("selected");
						}
					}
				} else {
					var sdchannel = $($cameras[i]).data("sdchannel");
					for (var k = 0; k < data.length; k++) {
						if (sdchannel[0].id === data[k]) {
							$($cameras[i]).addClass("selected");
						}
					}
				}
			}
		},
		/**
		 * [getTvChannel 获取电视墙布局的通道]
		 * @return {[type]} [description]
		 */
		getTvChannel: function(callback){
			var self = this,
                layId = jQuery(".tvHeader select").find("option:selected").data("id"),
                layName = jQuery(".changeLyt select").val(),
                onTvCameraNum = 0;
            //更改电视墙布局
            if(window.oldName !== layName){
            	window.oldName = layName;
				self.options.cameraIndex = 0;
				self.options.channelIdArr.length = 0;
			}
			ajaxModel.getData("/service/md/layout/screenInfo/" + layId, {
				async: false
			}).then(function(res) {
				if (res.code === 200 && res.data) {
					onTvCameraNum = self.getTvCameraNum(res.data.layoutWindowInfo);
					callback && callback(onTvCameraNum);
				} else {
					notify.warn("获取电视墙布局通道失败！");
				}
			}, function(){
				notify.warn("网络错误,请检查服务！");
			});
		},
		getTvCameraNum: function(data){
            var onTvCameraNum = 0;
            for(var i =0; i<data.length;i++){
            	if(data[i].windowInfo){
            		onTvCameraNum += data[i].windowInfo.split("x")[0] * 1 * data[i].windowInfo.split("x")[1];
            	}
            }
            return onTvCameraNum;
		},
		/**
		 * [findCameraData 获取相机通道id的数据]
		 * @param  {[type]} dom [description]
		 * @return {[type]}     [description]
		 */
        findChannelId: function(dom){
            var $cameras = dom.closest(".active").find(".tree li"),
                self = this;
			for (var i = 0; i < $cameras.length; i++) {
				if ($($cameras[i]).data("hdchannel").length > 2) {
					var hdchannel = $($cameras[i]).data("hdchannel");
					self.options.channelIdArr.push(hdchannel[0].id);
				} else {
					var sdchannel = $($cameras[i]).data("sdchannel");
					self.options.channelIdArr.push(sdchannel[0].id);
				}
			}
        },
        getTvData: function(onTvCameraNum, type){
        	var params = [],
        	    self = this;
			if (type === "up") {
				self.options.cameraIndex -= onTvCameraNum;
			} else {
				self.options.cameraIndex += onTvCameraNum;
			}
			if (self.options.cameraIndex <= 0) {
				self.options.cameraIndex = 0;
				notify.warn("请选择下一组摄像机！");
				return params;
			}
			if (self.options.channelIdArr.length < onTvCameraNum) {
				//只上一次墙
				return self.options.channelIdArr;
			}
			//最后一组 
			if(self.options.cameraIndex - self.options.channelIdArr.length >= onTvCameraNum){
				self.options.cameraIndex = self.options.channelIdArr.length + onTvCameraNum;
				notify.warn("请选择上一组摄像机！");
			    return params;
			}		
			//当前上墙的相机下标
			if (self.options.cameraIndex > 0) {
				var index = self.options.cameraIndex;
				for (var i = index - onTvCameraNum; i < index; i++) {
					if (i > self.options.channelIdArr.length - 1) {
						//标记是最后一组摄像机上墙
						self.options.cameraIndex = self.options.channelIdArr.length + onTvCameraNum;
						return params;
					}
					params.push(self.options.channelIdArr[i]);
				}
			} else {
				for (var i = 0; i < onTvCameraNum; i++) {
					params.push(self.options.channelIdArr[i]);
				}
			}
			return params;
        },
		setTvWall: function(params, type, callback) {
			var self = this;
			if (params.length > 0) {
				var layId = jQuery(".tvHeader select").find("option:selected").data("id");
				//批量上墙
				ajaxModel.postData("/service/md/realstream/batch/open/"+layId, {
					channels: params.join(",")
				}).then(function(res) {
					if (res.code === 200) {
						//高亮左侧分组列表中上墙的相机
						callback && callback();
						notify.success(res.data.message);
					} else {
						callback && callback(type);
						notify.warn("批量上墙失败！");
					}
				}, function() {
					callback && callback(type);
					notify.warn("网络错误，请检查服务！");
				});
			}
		},
		updateCameraIndex: function(type, onTvCameraNum){
			var self = this;
			if (type === "up") {
				self.options.cameraIndex += onTvCameraNum;
			} else {
				self.options.cameraIndex -= onTvCameraNum;
			}
		},
		renderCameraList: function(type, onTvCameraNum, dom) {
			var self = this;
		},
		setBackTvWall: function () {
			jQuery('#wcount').off('change').on('change', function () {
				var self = this,
					screenNo = jQuery(this).val(),
					actDom = {
						screenid: jQuery('.duct li.active').attr('data-duct'),
						id: jQuery('.duct li.active').attr('data-ids'),
						serverid: jQuery('.duct li.active').attr('data-server')
					},
					dom = jQuery("#autoMousewheel .tv[data-screenid='" + actDom.screenid + "'][data-id='" + actDom.id + "'][data-serverid='" + actDom.serverid + "']");

				tvDM.swScreen(screenNo, jQuery(dom));
				tvDM.setLayout(jQuery(dom).closest('li'), function () {
					if (jQuery('.tv-screen td.active').length === parseInt(jQuery('#wcount').val())) {
						jQuery('#checkAll').prop('checked', true);
					} else {
						jQuery('#checkAll').prop('checked', false);
					}
				});
			})
		},
		/**
		 * [getInsCamInfo description 获取摄像机数据]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   url [description]
		 * @return {[type]}       [description]
		 */
		getInsCamInfo: function (dom) {
			var self = this,
				sData = {
					'id': dom.attr('data-id'),
					'type': 'customize'
				};
			ajaxModel.getData(self.options.url, sData).then(function (res) {
				self.camTmpData = res.data.cameras;
			});
		},		
		/**
		 * [regexNo description 将阿拉伯数字转换成大写的汉字]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   url [description]
		 * @return {[type]}       [description]
		 */
		regexNo: function (str) {
			var arr1 = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"],
				//arr2 = ["零","壹","贰","叁","肆","伍","陆","柒","捌","玖"],
				reg = /\d/g;
			return str.replace(reg, function (m) { return arr1[m]; })
		},
		/**
		 * [setPollingScrrenStyleLayout 手动将要轮巡屏幕的布局初始化为1个分屏]
		 * @param {[type]} id [id]
		 */
		setPollingScrrenStyleLayout: function(id) {
			jQuery('#autoMousewheel .tv[data-id]').each(function() {
				if (id === jQuery(this).data("id")) {
					jQuery(this).find(".split-panel").show().find(".layout.split1").trigger("click");
				}
			});
		},
		/**
		 * [startIns description 启动轮询]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   url [description]
		 * @return {[type]}       [description]
		 */
		startIns: function (intervalTime,inspectName) {
			var self = this,
				insData = [];
			// 设置轮巡数组的值
			self.setPollingArr();
			// 设置轮巡按钮样式
			if(!self.targetLi.hasClass("active")){
                 self.curInspectDom.trigger("click");
                 self.targetLi.siblings().removeClass("active");
			}
			jQuery.each(self.insArr,function(i,obj){
				if (obj.id){
					// 手动将要轮巡屏幕的布局初始化为1个分屏
					self.setPollingScrrenStyleLayout(obj.id);

					insData.push({
						screen:obj.screenId,
						serverId:obj.serverId,
						window:0
					})
				}
			});

			if (insData.length === 0){
				notify.warn('启动轮巡失败，无可用屏幕');
				return;
			}

			if (self.camTmpData.length === 0){
				notify.warn('启动轮巡失败，无可用摄像机');
				return;
			}

			// 开始轮巡
			inspection.inspectBusiness(self.camTmpData, insData, intervalTime,inspectName);

			//绑定停止轮巡按钮事件
			self.stopInsEvt(inspectName);
		},


		stopInsEvt: function(inspectName) {
			var self = this;
			jQuery(".poll-tips, .poll-layer").show();
			var playBtnPos = self.curInspectDom.offset();
			jQuery(".poll-tips").css({
				left: playBtnPos.left,
				top: playBtnPos.top - 88 + 86
			}).attr("data-name",inspectName);


			jQuery('.stop-poll').on("click", function(event) {
				jQuery(".poll-tips, .poll-layer").hide();
				var inspectName = jQuery(this).closest('.poll-tips').attr("data-name");
				inspection.stopInspect(inspectName);
			});
		},


		/**
		 * [renderOperator description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   node   [description]
		 * @param  {[type]}   params [description]
		 * @return {[type]}          [description]
		 */
		renderOperator: function(node, params) {
			var options = Object.merge({}, this.options, params);
			this.options.lookup = options.lookup;
			jQuery.when(this.loadTemplate(this.options.operatorTemplate)).done(function(source) {
				var fragment = Handlebars.compile(source)({
					operator: true
				});
				node.append(fragment);
				permission.reShow();
			});
		},
		/**
		 * [loadTemplate description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   url [description]
		 * @return {[type]}       [description]
		 */
		loadTemplate: function(url) {
			return Toolkit.loadTempl(url);
		},
		/**
		 * [toggleGroup description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @param  {[type]}   options [description]
		 * @return {[type]}           [description]
		 */
		toggleGroup: function(options) {
			var node = options.node.toggleClass('active');
			ScrollListener.start();

			// 保持单一展开 并且移除前次loading，保证单例Ajax能够正常请求
			node.siblings().removeClass('active').children(".loading").remove();

			if (node.children('.loading, h2, .tree').length === 0) {
				node.append("<div class='loading'>loading...</div>");
				this.loadCameras({
					id: node.data('id'),
					callback: function() {

					}
				});
			}
		},
		/**
		 * [bindEvents description]
		 * @author wumengmeng
		 * @date   2014-12-11
		 * @return {[type]}   [description]
		 */
		bindEvents: function() {
			var self = this;
			jQuery(document).on('click', '.treeMenu .node .group', function() {
				var node = jQuery(this).closest('.node');
				self.checked = node.children(".group").children(".checkbox").is(".checked");
				self.toggleGroup({
					node: node
				});
			});
		}
	};
	// 刷新边栏高度滚动条
	var ScrollListener = {
		timer: null,

		initialize: function() {
			this.treePanel = jQuery('#treePanel');
			this.camerasPanel = jQuery('#camerasPanel');
			this.formPanel = this.treePanel.find('.form-panel');
			this.scrollbar = this.camerasPanel.children('.scrollbar');
			this.viewport = this.camerasPanel.children('.viewport');

			this.bindEvents();

			this.start();
		},

		start: function() {
			this.stop();
			var self = this;
			this.timer = setInterval(function() {
				if (jQuery('#ptzCamera').length){
					var ptzHeight = jQuery('#ptzCamera').height();
					jQuery("#camerasPanel").css('height', jQuery(document).height() - (40 + 10 + ptzHeight + self.formPanel.height()));
				} else {
					jQuery("#camerasPanel").css('height', jQuery(document).height() - (40 + 10 + self.formPanel.height()));
				}
				
			}, 1000);
		},

		stop: function() {
			clearInterval(this.timer);
		},
		bindEvents: function() {

		}
	};
	ScrollListener.initialize();
	jQuery(document).resize(function() {
		ScrollListener.start();
	});
	return TvWallLyt;
});
