define([
	"underscore",
	"jquery",
	"/module/common/js/player2.js",
	"js/pubsub",
	"pubsub",
	"handlebars",
	"/component/base/self/portal.links.js"
], function(_, jQuery, ocxPlayer, spb, Pubsub, Handlebars, PortalLinks) {

	require("mootools");

	var //树对象
		Tree,
		//播放器对象
		player,
		//视频监控控制器对象
		Videowatch,
		//左侧树监听器对象，负责左侧树上事件响应及业务逻辑
		treeSubscribe;

	var VideoMonitor = function() {
		var self = this;
		self.init();
	};

	VideoMonitor.prototype = {
		templCache: {},
		URLS: {
			"GROUP_LIST": "/module/inspect/monitor/inc/group_list.html"
		},
		illegalCharacter: /([?"*'\/\\<>:|？“”‘’^&~]|(?!\s)'\s+|\s+'(?!\s))/ig,
		init: function () {
			var self = this,
				//当前页面的hash对象
				srt = location.hash;
			//初始化播放器对象
			if (!window.gVideoPlayer) {
				player = window.gVideoPlayer = new VideoPlayer();
			} else {
				player = window.gVideoPlayer;
			}
			//添加事件监听
			self.addSubscribe();
			//视频播放栏事件绑定
			require(["js/controlbar"], function(ControlBar) {
				ControlBar.bindEvents(player);
			});
			//初始化视频播放栏和左侧树的监听逻辑,左侧树、我的分组、视频监控控制器对象初始化
			require([
				"/module/inspect/monitor/js/tree-subscribe.js",
				"/module/common/tree/tree-controller.js",
				"js/videowatch-controller",
				"js/mygroups"
			], function(TreeSubscribe, tree, videowatch, mygroups) {
				//初始化左侧树监听逻辑
				treeSubscribe = new TreeSubscribe(player);
				//树的初始化
				window.Tree = Tree = new tree(player, {
					//显示轮巡按钮
					showInspectBtns: true
				});
				//左侧树事件绑定
				self._bindTreeEvent(Tree);
				//初始化我的分组相关逻辑
				new mygroups(player, Tree);
				//视频监控控制器对象初始化
				Videowatch = new videowatch(player, Tree);
				//显示左侧树
				jQuery("#camerasType").trigger("click");
			});
			//事件绑定
			self.bindEvent();
			//判断是否是门户连接过来，如果是，则根据hash值进行跳转，传递默认跳转处理逻辑函数
			var portalFun = PortalLinks.init();
			portalFun(function () {
				if (srt.indexOf("nomenu/inspect") !== -1) {
					jQuery("#sidebar").find(".menus > .patrol").trigger("click");
				} else {
					jQuery("#sidebar").find(".menus > .camera").trigger("click");
				}
			});
			/*---------初始化老胡部分的变量 start---------*/
			window.SelectCamera = {};
			window.SelectCamera.ListData = [];
			for (var i = 0; i <= 15; i++) {
				window.SelectCamera.ListData[i] = {};
			}
			/*---------初始化老胡部分的变量 end---------*/
			window.tabor = self.tabor;
		},
		/**
		 * 绑定左侧树面板相关事件处理程序
		 * @param tree - 树对象
		 * @private
		 */
		_bindTreeEvent: function (tree) {
			var $sideBody = jQuery("#sidebar-body"),
				$videoRes = $sideBody.find("[data-tabor='video-res']"),
				$myGroup = $sideBody.find("[data-tabor='my-group']"),
				inputVideoRes = $videoRes.find(".tree-search-camera"),
				inputMyGroup = $myGroup.find(".tree-search-camera"),
				searchVideoRes = $videoRes.find(".search-camera button.search"),
				searchMyGroup = $myGroup.find(".search-camera button.search"),
				containerVideoRes = $videoRes.find(".tree-panel"),
				containerMyGroup = $myGroup.find(".tree-panel");

			tree.bindSearchEvent(inputVideoRes, "org", containerVideoRes);
			tree.bindSearchEvent(inputMyGroup, "customize", containerMyGroup);
			tree.bindSearchClickEvent(searchVideoRes, inputVideoRes, "org", containerVideoRes);
			tree.bindSearchClickEvent(searchMyGroup, inputMyGroup, "customize", containerMyGroup);
		},
		/**
		 * 监听提供给外部的服务
		 */
		addSubscribe: function () {
			player.addEvent("CANCELCHECK", function (cameraId) {
				/**
				 * bug[46638],由于视频监控模块中，“视频资源”、“监巡分组”、“帧标记”模块的控制是通过隐藏和显示来进行的
				 * 故视频播放状态在tab切换时没有消除，此问题，可以通过摄像机ID来查找系统中存在的节点，移出响应的状态
				 * 以避免播放状态紊乱
				 * modify by zhangyu, 2016.05.05
				 */
				var camera = jQuery("[data-tabor] .node[data-type=camera][data-id=" + cameraId + "] .camera");
				if (player.isOnlyCameraId(cameraId)) {
					camera.closest(".node.activated").removeClass("activated");
					camera.closest(".node").removeClass("selected");
				}
			});
			/*资源树点击“布防设置”按钮*/
			Pubsub.subscribe("Tree-click-defend", function (message, data) {
				treeSubscribe.defend(data.elm);
			});
			/*资源树双击叶子节点按钮*/
			Pubsub.subscribe("Tree-dblclick-leaf", function (message, data) {
				var parentLi = jQuery(data.elm).parents(".node");
				if (parentLi.hasClass("tree-inspecting-node")) {
					notify.warn("当前节点正在轮巡，不允许操作！");
					//jQuery(data.elm).closest(".node").removeClass("selected");
					return;
				}
				treeSubscribe.realStreamPlay(data.elm);
			});
			/*资源树点击“实时预览”按钮*/
			Pubsub.subscribe("Tree-click-play", function (message, data) {
				treeSubscribe.realStreamPlay(data.elm);
			});
			/*资源树点击“历史调阅”按钮*/
			Pubsub.subscribe("Tree-click-history", function (message, data) {
				treeSubscribe.historyStreamPlay(data.elm);
			});
			/*资源树点击“添加到我的分组”按钮*/
			Pubsub.subscribe("Tree-click-appendToGroup", function (message, data) {
				var id = jQuery(data.elm).closest("li").data("id");
				treeSubscribe.appendToGroup(id, jQuery(data.elm));
			});
			/*资源树点击“添加到电视墙”按钮*/
			Pubsub.subscribe("Tree-click-tvwall", function (message, data) {
				treeSubscribe.appendTvwall(data.elm);
			});
		},
		/**
		 * 取模板编译后的函数（该函数和videowatch-view中稍有区别）
		 * @param tempURL 模板URL
		 * @param force 是否强制重新读取
		 * @returns {*} 被handlebar编译后的函数
		 */
		loadTempl: function (tempURL, force) {
			var self = this,
				temp = self.templCache[tempURL];
			if (!temp || force) {
				return jQuery.get(tempURL).then(function (tml) {
					return self.templCache[tempURL] = Handlebars.compile(tml);
				});
			} else {
				return jQuery.Deferred().resolve(temp);
			}
		},
		/**
		 * [隐藏显示控制#sidebar-body中的内容]
		 * @author Mayue
		 * @date   2015-04-08
		 * @param  {[type]}   elm [dom元素或者字符串]
		 * @return {[type]}        [description]
		 */
		tabor: function (elm) {
			//获取点击tab元素的data-tabor属性
			var str = typeOf(elm) === "element" ? jQuery(elm).attr("data-tabor") : elm,
				$majorObj = jQuery("#major"),
				$unLabelMgrContent = $majorObj.children('[data-tabor="un-label-manage"]'),
				$labelMgrContent = $majorObj.children('[data-tabor="label-manage"]');
			//切换左侧面板对应的内容区域显示
			jQuery('#sidebar-body').children('[data-tabor="' + str + '"]').addClass("active").siblings().removeClass("active");//左侧
			//切换右侧面板内容
			if (str === "label-manage") {
				$unLabelMgrContent.css({
					"left": "-2000px",
					"right": "2000px"
				});//右侧
				$labelMgrContent.show();//右侧
			} else {
				$unLabelMgrContent.css({
					"left": "0px",
					"right": "0px"
				});//右侧
				$labelMgrContent.hide();//右侧
			}
		},
		/**
		 * 事件绑定
		 */
		bindEvent: function () {
			var self = this,
				$sideBar = jQuery("#sidebar"),
				$sideBody = jQuery("#sidebar-body");
			//左侧面板导航栏点击事件处理程序，add by wujingwen on 2015.10.24
			jQuery("#sidebar-head").on("click", ".menus li", function () {
				var $this = jQuery(this),
					dataTab = $this.data("tab");
				//切换导航样式
				jQuery(this).addClass("active").siblings().removeClass("active");
				//根据导航切换对应的内容区域
				if (dataTab === "label-manage") {
					require(["/module/framemark/js/frame-mark.js"], function(frameMark) {
						frameMark.frameTagCount();
						jQuery("#listMode").trigger("click");
					});
				}
			});
			//左侧面板触发内容渲染改变的tab及事件处理
			$sideBar.on("click", "[data-tabor]", function () {
				self.tabor(this);
			});
			//点击"视频资源"按钮
			$sideBar.on("click", "#camerasType", function () {
				var $this = jQuery(this),
					taborStr = $this.attr("data-tabor"),
					typeStr = $this.attr("data-type"),
					container = $sideBody.children('[data-tabor="' + taborStr + '"]').children(".tree-panel");
				if (typeStr === "customize") {
					Tree.renderCustomizeTree(false, container);
				} else if (typeStr === "org") {
					//第一个参数代表是否显示checkbox,第三个参数代表二级或下级组织是否显示轮巡按钮
					Tree.renderInspectTree(false, container, true);
				}
				//显示左侧树
				jQuery("#sidebar-body").find(".all-resource").trigger("click");
			});
			//清除组织
			$sideBody.on("click", ".org-res-filter a.close,.org-my-group-filter a.close", function (e) {
				e.stopPropagation();
				var $This = jQuery(this),
				    type = $This.data("type") === "org-close" ? "org" : "customize";
				Tree.clearfilterArray(type);
				var orgFilterPanel = jQuery("#sidebar-body").find(".org-res-filter"),
					cusFilterPanel = jQuery("#sidebar-body").find(".org-my-group-filter");
				if(type === "org"){
					orgFilterPanel.removeClass("active");
				}else{
					cusFilterPanel.removeClass("active");
				}	
				$This.siblings("span").attr("data-orgid","").attr("title","").text("筛选组织...");
			});
			//显示已选组织
			$sideBody.on("click", ".org-res-filter a.expand,.org-my-group-filter a.expand", function (e) {
				e.stopPropagation();
				var $This = jQuery(this),
				    type = $This.data("type") === "org-edit" ? "video-res" : "my-group",
				    orgIds = $This.siblings("span").attr("data-orgid").split(","),
				    orgNames = $This.siblings("span").attr("title").split(","),
					container = $sideBody.children('[data-tabor="' + type + '"]').children(".tree-panel");
					//如果没有过滤的组织，直接返回
					if(!!!orgIds[0]){
						return;
					}
				    if($This.hasClass("expand1")){
				    	$This.removeClass("expand1").addClass("expand2");
				    }else{
				    	$This.removeClass("expand2").addClass("expand1");
				    }
					if(!!orgIds[0]){
						var LiStr = "";
						for(var i=0,Len=orgIds.length; i<Len; i++){
							var name = orgNames[i],
								id = orgIds[i];
							LiStr += '<li data-name='+name+'  data-id='+id+' title='+name+'><span>'+ name +'</span><a class="close" data-type='+type+'></a></li>';
						}
						if(type === "video-res"){
							jQuery("#sidebar-body").find(".select-org-Panel").show();
							jQuery("#sidebar-body").find(".select-org-Panel ul").empty().append(LiStr);
						}else{
							jQuery("#sidebar-body").find(".select-customize-Panel").show();
							jQuery("#sidebar-body").find(".select-customize-Panel ul").empty().append(LiStr);
						}
					}
					if($This.hasClass("expand1")){
						if(type === "video-res"){
							jQuery("#sidebar-body").find(".select-org-Panel").show();
							var panel = jQuery("#sidebar-body").find("[data-tabor='video-res']");
							    panel.find(".search-camera").find(".search").hide();
								panel.find(".video-resource-type").hide();
								panel.find(".tree-panel").css("top","95px");
								Tree.renderInspectTree(false, container, true);
						}else{
							jQuery("#sidebar-body").find(".select-customize-Panel").show();
							var panel = jQuery("#sidebar-body").find("[data-tabor='my-group']");
							    panel.find(".search-camera").find(".search").hide();
								panel.find(".video-resource-type").hide();
								panel.find(".video-resource-detail").hide();
								panel.find(".tree-panel").css("top","90px");
								Tree.renderCustomizeTree(false, container);
						}
					}else{
						if(type === "video-res"){
							jQuery("#sidebar-body").find(".select-org-Panel").hide();
							var panel = jQuery("#sidebar-body").find("[data-tabor='video-res']");
						    panel.find(".search-camera").find(".search").show();
							panel.find(".video-resource-type").show();
							panel.find(".tree-panel").css("top","115px");
							panel.find(".search-camera").find("button.search").trigger("click");
						}else{
							jQuery("#sidebar-body").find(".select-customize-Panel").hide();
							var panel = jQuery("#sidebar-body").find("[data-tabor='my-group']");
						    panel.find(".search-camera").find(".search").show();
							panel.find(".video-resource-type").show();
							panel.find(".video-resource-detail").show();
							panel.find(".tree-panel").css("top","130px");
							panel.find(".search-camera").find("button.search").trigger("click");
						}
					}
			});
			//删除单个组织
			$sideBody.on("click", ".select-org-Panel a.close,.select-customize-Panel a.close", function (e) {
				e.stopPropagation();
				var $This = jQuery(this),
				    type = $This.data("type") === "video-res" ? "org" : "customize",
				    orgid = $This.closest("li").attr("data-id");
				$This.closest("li").remove();
				Tree.deleteSingleOrgId(type,orgid);
				Tree.rePaintFilter(type);
				if(type === "org"){
					var Panel = jQuery("#sidebar-body").find(".select-org-Panel"),
						Lis = Panel.find("ul").children("li");
					if(Lis.length === 0){
						Panel.hide();
						var container = jQuery("#sidebar-body").find("[data-tabor='video-res']");
					    container.find(".search-camera").find(".search").show();
						container.find(".video-resource-type").show();
						container.find(".tree-panel").css("top","115px");
						container.find(".search-camera").find("button.search").trigger("click");
					}
				}else{
					var Panel = jQuery("#sidebar-body").find(".select-customize-Panel"),
						Lis = Panel.find("ul").children("li");
					if(Lis.length === 0){
						Panel.hide();
						var container = jQuery("#sidebar-body").find("[data-tabor='my-group']");
							container.find(".search-camera").find(".search").show();
							container.find(".video-resource-type").show();
							container.find(".video-resource-detail").show();
							container.find(".tree-panel").css("top","130px");
							container.find(".search-camera").find("button.search").trigger("click");
					}
				}
			});
			/*点击"我的分组"按钮*/
			$sideBody.on("click", ".my-own-group", function (e, data) {
				e.stopPropagation();
				var taborStr = jQuery(this).attr("data-tabor");
				self.tabor(this);
				$sideBody.find(".my-own-group").css({
					"background": "#DFEDF8"
				});
				$sideBody.find(".all-resource").css({
					"background": "#F6FBFF"
				});
				//获取全部资源的搜索框值，如果有值则触发查询,add by zhangyu, 2015.10.24
				/*var preSearchValue = jQuery("[data-tabor='video-res']").find(".tree-search-camera").val(),
				 $groupSearchObj = jQuery("[data-tabor='my-group']").find(".tree-search-camera");
				 if (preSearchValue.trim !== "") {
				 $groupSearchObj.val(preSearchValue);
				 window.setTimeout(function() {
				 jQuery("[data-tabor='my-group']").find(".search-camera button.search").trigger("click");
				 });
				 } else {
				 $groupSearchObj.val("");
				 }*/
				var $inspectMask = jQuery(".down-inspect-mask");
				if (window.loop_inspect_obj && window.loop_inspect_obj.resourceType == "video-res") {
					$inspectMask.css({"display": "none"});
				} else {
					$inspectMask.css({"display": "block"});
				}
				//如果已经点击过，则维持状态
				if (self.alreadyClickMyGroupPanel && data == undefined) {
					return;
				}
				var container = $sideBody.children('[data-tabor="' + taborStr + '"]').children(".tree-panel");
				Tree.renderCustomizeTree(false, container, function(){
					$(".customize-pecial ul").sortable({scroll: true, stop: function(event, ui){
						var idStr = "";
						jQuery("div[data-tabor='my-group'] ul.tree").first().find("li.node").each(function (index, domEle) { 
							idStr = idStr + $(domEle).data("id") +",";
						});
						idStr = idStr.substring(0,idStr.length-1);
						jQuery.ajax({
							url: "/service/video_access_copy/change_group_sort",
							data: {
								groups: idStr
							},
							type: 'post',
							success: function (res) {
								if (res && res.code === 200) {
									notify.success('分组排序成功');
								} else {
									notify.error('分组排序失败');
								}
							},
							error: function () {
								notify.error("操作失败");
							}
						});
					}});
				});
				self.alreadyClickMyGroupPanel = true;
				jQuery( "#myGroup" ).sortable();
			});
			/*点击"全部资源"按钮*/
			$sideBody.on("click", ".all-resource", function (e) {
				e.stopPropagation();
				var taborStr = jQuery(this).attr("data-tabor");
				self.tabor(this);
				jQuery("#sidebar-body").find(".all-resource").css({
					"background": "#DFEDF8"
				}).end().find(".my-own-group").css({
					"background": "#F6FBFF"
				});
				//获取全部资源的搜索框值，如果有值则触发查询,add by zhangyu, 2015.10.24
				/*var preSearchValue = jQuery("[data-tabor='my-group']").find(".tree-search-camera").val(),
				 $orgSearchObj = jQuery("[data-tabor='video-res']").find(".tree-search-camera");
				 if (preSearchValue.trim !== "") {
				 $orgSearchObj.val(preSearchValue);
				 window.setTimeout(function() {
				 jQuery("[data-tabor='video-res']").find(".search-camera button.search").trigger("click");
				 });
				 } else {
				 $orgSearchObj.val("");
				 }*/
				var $inspectMask = jQuery(".down-inspect-mask");
				if (window.loop_inspect_obj && window.loop_inspect_obj.resourceType === "my-group") {
					$inspectMask.css({"display": "none"});
				} else {
					$inspectMask.css({"display": "block"});
				}
				//如果已经点击过，则维持状态
				if (self.alreadyClickAllResourcePanel) {
					return;
				}
				var container = $sideBody.children('[data-tabor="' + taborStr + '"]').children(".tree-panel");
				Tree.renderInspectTree(false, container, true);
				self.alreadyClickAllResourcePanel = true;
				//取消等待状态
				$sideBody.find(".tree-panel").removeClass("loading");
			});
			//注册滚动条事件，此处代码请不要删除，今后可能要用
			/*var oldTop = 0;
			 jQuery("#sidebar #sidebar-body .tree-panel").scroll(function(e) {
			 function getElementTop(element) {
			 var actualTop = element.offsetTop;
			 var current = element.offsetParent;
			 while (current !== null) {
			 actualTop += current.offsetTop;
			 current = current.offsetParent;
			 }
			 return actualTop;
			 }
			 var srollTop = jQuery(this).scrollTop();
			 if (jQuery(".down-inspect-mask").length != 0) {
			 // oldTop=jQuery(".down-inspect-mask").offset().top;
			 oldTop = getElementTop(jQuery(".down-inspect-mask")[0]);
			 }
			 console.log("注册滚动条事件", srollTop, oldTop);
			 jQuery(".down-inspect-mask").css("top", oldTop - srollTop);
			 });*/
			//点击发送全部扩展屏
			jQuery("#npplay .sendto").on("click", function (event) {
				if (self.isEmptyData(player.cameraData)) {
					return notify.warn("当前没有播放数据，不可发送扩展屏");
				}
				if (self.isAllHisData(player.cameraData)) {
					return notify.warn("历史视频不支持发送扩展屏功能");
				}
				var realData = self.getRealData(player.cameraData);
				var hasHisData = self.hasHisData(player.cameraData);
				if (hasHisData) {
					new ConfirmDialog({
						title: "提示",
						classes: "",
						width: 580,
						warn: true,
						message: "发送扩展屏功能只将当前窗口中的所有实时视频发送到扩展屏，确认要发送吗？",
						//confirmText: "上传",
						callback: function () {
							var layout = player.getLayout();
							for (var i = 0; i < layout; i++) {
								var tem = player.getVideoInfo(i);
								if (tem !== "" && tem.videoType === 1) {
									player.stop(false, i);
									player.playerObj.Stop(false, i);
									player.setRatio(window.ocxDefaultRatio, i);
									player.refreshWindow(i);
								}
							}
							self.sendToExpend(realData);
						}
					});
				} else {
					player.stopAll();
					var layout = player.getLayout();
					while (layout--) {
						player.setRatio(window.ocxDefaultRatio, layout);
					}
					self.sendToExpend(realData);
				}
				event.preventDefault();
			});
		},
		/**
		 * 发送到扩展屏
		 * @param arr - 数据
		 */
		sendToExpend: function (arr) {
			var data = {
				"layout": player.getLayout(),
				"cameras": Array.clone(arr)
			};
			window.sendExtendScreen(BroadCast, data);
		},
		/**
		 * 格式化实时视频播放数据
		 * @param cameraData - 待格式化的数据
		 */
		getRealData: function (cameraData) {
			var arr = Array.clone(cameraData);
			var i = arr.length;
			var result = [];
			while (i--) {
				if (arr[i] !== -1) {
					var tem = player.getVideoInfo(i);
					if ((tem !== "" && tem.videoType === 1) || (tem === "" && arr[i].isRealorHis === "real")) {
						var tem2 = {
							cId: arr[i].cId,
							cName: arr[i].cName,
							cType: arr[i].cType,
							cCode: arr[i].cCode,
							cStatus: arr[i].cStatus,
							sdChannel: arr[i].sdChannel,
							hdChannel: arr[i].hdChannel
						};
						result.push(tem2);
					}
				}
			}
			return Array.clone(result.reverse());
		},
		/**
		 * [isEmptyData 判断arr是否是一组空数据]
		 * @author Mayue
		 * @date   2015-04-30
		 * @param  {[type]}   arr [description]
		 * @return {Boolean}      [true:是空数据  false:不是空数据]
		 */
		isEmptyData: function (arr) {
			var isEmpty = true;
			var i = arr.length;
			while (i--) {
				if (arr[i] !== -1) {
					isEmpty = false;
					break;
				}
			}
			return isEmpty;
		},
		/**
		 * 判断历史视频是否支持发送到扩展屏
		 * @param arr - 数据
		 * @returns {boolean}
		 */
		isAllHisData: function (arr) {
			var isAllHis = true;
			var i = arr.length;
			while (i--) {
				if (arr[i] !== -1) {
					var tem = player.getVideoInfo(i);
					if (tem === "" && arr[i].isRealorHis === "real") {
						isAllHis = false;
						break;
					}
					if (tem !== "" && tem.videoType === 1) {
						isAllHis = false;
						break;
					}
				}
			}
			return isAllHis;
		},
		/**
		 * 判断是否含有历史视频数据
		 * @param arr - 数据信息
		 * @returns {boolean}
		 */
		hasHisData: function (arr) {
			var has = false;
			var i = arr.length;
			while (i--) {
				if (arr[i] !== -1) {
					var tem = player.getVideoInfo(i);
					if (tem !== "" && tem.videoType === 2) {
						has = true;
						break;
					}
				}
			}
			return has;
		}
	};
	return new VideoMonitor();
});