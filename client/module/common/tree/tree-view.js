/**
 * Created by Mayue on 2014/12/17.
 */
define(['jquery','underscore','handlebars','jquery.watch','pubsub','/module/inspect/monitor/js/resource-inspect.js'],function(jQuery,_,Handlebars,jWatch,PubSub,treeInspect){
	var View = function(pb,player,options) {
		var self = this;
		jQuery.extend(self.options, options);
		internalPubSub = pb;
		self.addHelper();
		self.bindEvent();
		//初始化过滤数组
		self.orgFilterArray = [];
		self.cusFilterArray = [];
		new treeInspect(player);
		self.timmer = null;
	};

	View.prototype = {
		URLS: {
			TREE_TPL: '/module/common/tree/tree.template.html',
			OPERATOR_BTN_TPL:'/module/common/tree/operator.template.html'
		},
		templCache:{},
		ajaxObject:null,
		ajaxAbort:null,
		click_Timer:null,
		options: {
			showInspectBtns: false
		},
		/**
		 * [bindSearchEvent 绑定搜索框的键盘输入事件]
		 * @author Mayue
		 * @date   2015-05-06
		 * @param  {[type]}   node      [description]
		 * @param  {[type]}   type      [description]
		 * @param  {[type]}   container [description]
		 * @return {[type]}             [description]
		 */
		bindSearchEvent:function(node,type,container){
			var self = this;
			node.watch({
				wait: 1000,
				captureLength: 0,
				//监听的输入长度
				callback: function(key) {
					if (key.trim() === '') {
						if (self.ajaxAbort) self.ajaxAbort.abort();
						if (type === 'org') {
							if(self.options.showInspectBtns == true){
                                 self.renderInspectTree(false,container, true);
							}else{
                                 self.renderOrgTree(false,container);
							}
						} else if (type === 'customize') {
							self.renderCustomizeTree(false,container);
						}
						jQuery("#sidebar-body").find(".org-res-filter").removeClass("active");
						jQuery("#sidebar-body").find(".org-my-group-filter").removeClass("active");
						return;
					}
					if (self.ajaxAbort && self.ajaxAbort.status != 200) {
						self.ajaxAbort.abort();
					}
					//不过滤括号（）
				//	key = Toolkit.strRegExp(key);
					self.renderSearchTree(key.trim(),type,container);
				}
			});
		},
		/**
		 * [bindSearchClickEvent 绑定输入框后的搜索按钮的点击事件]
		 * @author Mayue
		 * @date   2015-05-06
		 * @param  {[type]}   srcNode   [description]
		 * @param  {[type]}   inputNode [description]
		 * @param  {[type]}   type      [description]
		 * @param  {[type]}   container [description]
		 * @return {[type]}             [description]
		 */
		bindSearchClickEvent:function(srcNode,inputNode,type,container){
			var self = this;
			srcNode.click({'input':inputNode},function(e){
				var key = e.data.input.val().trim();
				if (key === '') {
					if (type === 'org') {
						if(self.options.showInspectBtns == true){
                             self.renderInspectTree(false,container, true);
						}else{
                             self.renderOrgTree(false,container);
						}
					} else if (type === 'customize') {
						self.renderCustomizeTree(false,container);
					}
					jQuery("#sidebar-body").find(".org-res-filter").removeClass("active");
					jQuery("#sidebar-body").find(".org-my-group-filter").removeClass("active");
					return;
				}else{
					if (self.ajaxAbort) self.ajaxAbort.abort();
					//不过滤括号（）
				//	key = Toolkit.strRegExp(key);
					self.renderSearchTree(key.trim(),type,container);
				}	
			});
		},
		bindSearchEvent2:function(){
			var self = this;
			var j = self.searchEvent.length;
			while(j--){
				(function(i){
					var node = self.searchEvent[i].node;
					var type = self.searchEvent[i].type;
					var container = self.searchEvent[i].container;
					self['ajaxObject'+i] = null;
					//树搜索
					node.watch({
						wait: 200,
						captureLength: 0,
						//监听的输入长度
						callback: function(key) {
							if (key.trim() === '') {
								if (self['ajaxObject'+i]) self['ajaxObject'+i].abort();
								if (type === 'org') {
									self.renderOrgTree(false,container);
								} else if (type === 'customize') {
									self.renderCustomizeTree(false,container);
								}
								return;
							}

							if (self['ajaxObject'+i] && self['ajaxObject'+i].status != 200) {
								self['ajaxObject'+i].abort();
							}
							self.renderSearchTree(key,type,container);
						}
					});
				})(j);
			}
		},
		/**
		 * 初始化事件绑定   该处仅仅只对树的一些基本操作，如果具体业务代码在对应的js中进行事件委托绑定
		 */
		bindEvent: function() {
			var self = this;
			/*我的分组  鼠标滑过时*/
			jQuery(document).on('mouseenter', '[data-tabor="my-group"] .group', function(e) {
				var groupWidth = jQuery(this).width();
				var textOverWidth = jQuery(this).find('.text-over').width();
				var foldWidth = jQuery(this).find('.fold').outerWidth(true);
				var btnWidth = jQuery(this).find('.group-operator').eq(0).outerWidth(true) * 3;
				var deviation = 5;
				if (jQuery(this).closest('.node').hasClass('inspecting-node')) {return;}
				if ((groupWidth - textOverWidth - foldWidth) < (btnWidth+3)) {
					jQuery(this).attr('text-width', textOverWidth);
					jQuery(this).find('.text-over').width(groupWidth - btnWidth - foldWidth - deviation);
				}
				// TreeWatchName.resetWidth();
			});
			/*我的分组  鼠标滑过时离开时*/
			jQuery(document).on('mouseleave ', '[data-tabor="my-group"] .group', function(e) {
				if (jQuery(this).attr('text-width')) {
					if (jQuery(this).closest('.node').hasClass('similar-hover')) {
						return;
					}else{
						jQuery(this).find('.text-over').width(jQuery(this).attr('text-width'));
						jQuery(this).removeAttr('text-width');
					}
				}
			});

			/**
			 * 点击树上一个节点(li)时的事件  一个横条
			 * @author Mayue
			 * @date   2014-12-23
			 * @param  {[type]}   
			 * @return {[type]}      [description]
			 */
			jQuery(document).on('click','.tree-outtest-container .node .group',function(e) {
				e.preventDefault();
				e.stopPropagation();
				var liNode = jQuery(this).closest('.node');
				if(self.timmer){
					window.clearTimeout(self.timmer);
				}
				self.timmer = window.setTimeout(function(){
					if (liNode.hasClass('similar-hover')) {return;}
					liNode.toggleClass('active');//该节点更换样式，该样式会影响下级元素的显示。
					//如果后端请求失败的时，这个loading就得手动移除
					if (!liNode.hasClass('active')) {
						if(liNode.hasClass('tree-inspecting-node')){
	                        jQuery('.down-inspect-mask').css({"display":"none"});
						}
						liNode.find('.loading').remove();
					}else{
						//收起同级的兄弟节点和兄弟节点下的所有展开的节点
						if(liNode.hasClass('tree-inspecting-node')){
	                        jQuery('.down-inspect-mask').css({"display":"block"});
						}else{
							jQuery('.down-inspect-mask').css({"display":"none"});
						}
						liNode.siblings().removeClass('active');
						liNode.siblings().find('.node.active').removeClass('active');
					}
					self.checkChildren(liNode);
				},300);
			});
			/**
			 * 勾选树上的复选框按钮
			 * @author Mayue
			 * @date   2014-12-23
			 * @param  {[type]}   
			 * @return {[type]}      [description]
			 */
			jQuery(document).on('click','.checktree .checkbox', function(e) {
				e.preventDefault();
				e.stopPropagation();
				internalPubSub.publish('checkTree', jQuery(this));
				PubSub.publish('Tree-click-checkbox',{'elm':this,'scope':self});//往外暴露
			});

			jQuery(document).on('click','.route-inspect',function(e){
				e.preventDefault();
				e.stopPropagation();
			});
			//查看当前节点的父组织
			jQuery(document).on("click", ".tree .showPathIcon", function(e){
                e.preventDefault();
				e.stopPropagation();
                var $li = jQuery(this).closest('.node'),
                    id = $li.data("id"),
					param = {
						id: id ,
						type: 2  //1:组织机构  2：摄像机
					};
                if(isNaN(id)){
                	param = {
                		id: id.split("org_")[1],
                		type: 1
                	};
                }
				jQuery.ajax({
					url: '/service/video_access_copy/groupNames',
					type: 'get',
					data: param,
					success: function(res) {
						if (res.code === 200 && res.data) {
							self.renderOrgName(res.data.groupNames);
						} else {
							notify.warn("获取父组织信息失败！");
						}
					},
					error: function() {
						notify.warn("网络错误，请检查服务！");
					}
				});
			});
			// 摄像头展开更多操作
			jQuery(document).on("click",'.tree .more',function(e) {
				e.preventDefault();
				e.stopPropagation();
				var li = jQuery(this).closest('.node');
				var parentLi = li.parents('.node');
				if (window.loop_inspect_obj && window.loop_inspect_obj.alreadyTriggerClickMoreBtn) {
					if (parentLi.hasClass('tree-inspecting-node')) {
						notify.warn("当前节点正在轮巡，不允许操作！");
						return;
					}
				}
				li.toggleClass('opened');
				li.siblings().removeClass("activated");
				li.siblings().removeClass("opened"); //隐藏兄弟节点上的‘操作按钮’
				if (li.children('.operator').size() === 0) {
					self.renderOperator(li);
				}
			});

			// 双击叶子节点 
			jQuery(document).on('dblclick', '.tree-outtest-container .tree .node:not(".checktree") .leaf', function(e) {
				clearTimeout(self.click_Timer);
				e.preventDefault();
				e.stopPropagation();
				var node = jQuery(this).closest(".node");
				var data = node.data();
				jQuery(this).closest('li.node').siblings().removeClass('opened');
				//node.addClass("selected");//勾选节点，不要删，今后可能要放开
				PubSub.publish('Tree-dblclick-leaf',{'elm':this,'scope':self});//往外暴露
				//日志记录，查看XX摄像机实时视频,add by wujingwen, 2015.08.31
				if(location.href.indexOf("monitor") >= 0){
					logDict.insertMedialog("m1", "查看：" + data.name + "->摄像机实时视频", "f1", 'o4', data.name);
				}
			});

			// 双击组织进行通过组织过滤
			jQuery(document).on('dblclick', '.tree-outtest-container .tree .node[data-type=group] .group', function(e) {
				e.preventDefault();
				e.stopPropagation();
				if(self.timmer){
					window.clearTimeout(self.timmer);
				}
				var node;
				if(jQuery(this).hasClass("rootli")){
					return false; 
				}else{
					node = jQuery(this).closest(".node");
				}
				self.collectFatherAndSon(node);
			});

			// 单击叶子节点
			jQuery(document).on('click', '.tree-outtest-container .tree .node:not(".checktree") .leaf', function(e) {
				clearTimeout(self.click_Timer);
                var that=this;
				self.click_Timer = setTimeout(function(){
					e.preventDefault();
					e.stopPropagation();
					var node = jQuery(that).closest(".node");
					var data = node.data();
					jQuery(that).closest('li.node').siblings().removeClass('opened');
				//	node.addClass("selected");//勾选节点
					// node.children(".leaf").children(".camera").addClass("selected");//勾选节点
					PubSub.publish('Tree-click-leaf',{'elm':that,'scope':self});//往外暴露
				},300);

			});
			
			/*点击“实时预览”按钮*/
			jQuery(document).on('click','.tree-outtest-container .operator .play',function(e){
				e.preventDefault();
				e.stopPropagation();				
				var node = jQuery(this).closest(".node");
				var	data = node.data();				
				node.addClass("selected");//勾选节点
				// node.children(".leaf").children(".camera").addClass("selected");//勾选节点
				node.addClass("activated").siblings().removeClass("activated");//展开新的more，收起其他的more 
				PubSub.publish('Tree-click-play',{'elm':this,'scope':self});//往外暴露
				//日志记录，查看XX摄像机实时视频,add by wujingwen, 2015.08.17
				if(location.href.indexOf("monitor") >= 0){
					logDict.insertMedialog("m1", "查看：" + data.name + "->摄像机实时视频", "f1", "o4", data.name);
				}
			});
			
			/*点击“历史调阅”按钮*/
			jQuery(document).on('click','.tree-outtest-container .operator .history',function(e){
				e.preventDefault();
				e.stopPropagation();
				//日志记录，查看XX摄像机历史视频,add by wujingwen, 2015.08.11
				var node = jQuery(this).closest(".node");
				var	data = node.data();	
				if(location.href.indexOf("dispatch") >= 0){
					logDict.insertMedialog("m1", "查看：" + data.name + "->摄像机历史视频", "f2", "o4", data.name);
				}else{
					logDict.insertMedialog("m1", "查看：" + data.name + "->摄像机历史视频", "f1", "o4", data.name);
				}
				PubSub.publish('Tree-click-history',{'elm':this,'scope':self});//往外暴露
			});

			/*点击“布防设置”按钮*/
			jQuery(document).on('click','.tree-outtest-container .operator .defend',function(e){
				e.preventDefault();
				e.stopPropagation();
				PubSub.publish('Tree-click-defend',{'elm':this,'scope':self});
			});

			/*点击“添加到我的分组”按钮*/
			jQuery(document).on('click','.tree-outtest-container .operator .append',function(e){
				e.preventDefault();
				e.stopPropagation();
				PubSub.publish('Tree-click-appendToGroup',{'elm':this,'scope':self});
			});

			/*点击“添加到电视墙”按钮*/
			jQuery(document).on('click','.tree-outtest-container .operator .tvwall',function(e){
				e.preventDefault();
				e.stopPropagation();
				PubSub.publish('Tree-click-tvwall',{'elm':this,'scope':self});
			});
			/*点击“纠错”按钮*/
			jQuery(document).on('click','.tree-outtest-container .operator .correct',function(e){
				e.preventDefault();
				e.stopPropagation();
				notify.warn('正在开发中');
				PubSub.publish('Tree-click-correct',{'elm':this,'scope':self});
				// to do
			});


		},
		removeLoading:function(){
          jQuery(".tree-outtest-container").find(".loading").remove();
		},
		/**
		 * 获取模板编译后的函数（该函数和videowatch-view中稍有区别）
		 * @param url 模板URL
		 * @returns {*} 被handlebar编译后的函数
		 */
		loadTempl: function(tempURL, force) {
			var self = this,
				temp = self.templCache[tempURL];
			if (!temp || force) {
				return jQuery.get(tempURL).then(function(tml) {
					return self.templCache[tempURL] = Handlebars.compile(tml);
				});
			} else {
				return jQuery.Deferred().resolve(temp);
			}
		},
		renderOrgName: function(data){
			if (data) {
				// var self = this,
				//     data = data.split("-"),
    //                 orgData = [];
				// for (var i = 0; i < data.length; i++) {
				// 	orgData.push({
				// 		name: data[i]
				// 	});
				// }
				// jQuery.when(self.loadTempl(self.URLS.OPERATOR_BTN_TPL)).done(function(tpl) {
				// 	var html = tpl({
				// 		'operator': false,
				// 		'orgData': orgData,
				// 	});
				// 	new CommonDialog({
				// 		showFooter: false,
				// 		title: "父组织机构信息",
				// 		close: true,
				// 		message: html
				// 	});
				// });
				new CommonDialog({
					showFooter: false,
					title: "父组织机构信息",
					close: true,
					message: data
				});
			}
		},
		/**
		 * [showOffOnlineCountInRoot 在线统计]
		 * @author Mayue
		 * @date   2015-05-04
		 * @param  {[type]}   container [description]
		 * @return {[type]}             [description]
		 */
		showTextInSingleRoot: function(container) {
			var id = container.data('id');
			window.getOffOnlineCount(id, function(data) {
				var box = container.find('.statistics');
				container.find('.online-count').eq(0).text(data.onlineCnt);
				container.find('.offline-count').eq(0).text(data.offlineCnt);
				container.find('.all-count').eq(0).text(data.onlineCnt + data.offlineCnt);
				container.find('.online-text').eq(0).text('在线:');
				container.find('.offline-text').eq(0).text('离线:');
				container.find('.all-text').eq(0).text('总数:');
			});
		},
		showOffOnlineCount:function(node){
			var self = this;
			var lis = node.find('.node[data-type="group"]');
			if (node.hasClass('tree-outtest-container') && lis.length === 1) {
				self.showTextInSingleRoot(lis);
				return;
			}

			jQuery.each(lis, function(index, elm) {
				var id = jQuery(elm).data('id');
				window.getOffOnlineCount(id, function(data) {
					var box = jQuery(elm).children('a.group').children('.statistics');
					box.find('.online-count').text(data.onlineCnt);
					box.find('.offline-count').text(data.offlineCnt);
					box.find('.all-count').text(data.onlineCnt + data.offlineCnt);
				});
			});
		},
		addHelper:function(){

			// 节点类型 type属性为gruop是父节点  为camera时为叶子节点
			Handlebars.registerHelper('parent', function(options) {
				return this['type'] === 'group' ? options.fn(this) : options.inverse(this);
			});
			Handlebars.registerHelper('cameraCodeShow', function(code,options) {
				if(code){
					return '('+code+')';
				}
			});
			Handlebars.registerHelper('showStatistic', function(type,options) {
				return type === 'org' ? options.fn(this) : options.inverse(this);
			});
			

			/*Handlebars.registerHelper("offline", function(hd, sd, options) {
				var isonline = false;
				hd.each(function(item, index) {
					if (item.channel_status === 0) {
						isonline = true;
					}
				});
				if (!isonline) {
					sd.each(function(item, index) {
						if (item.channel_status === 0) {
							isonline = true;
						}
					});
				}
				return isonline ? '' : 'offline';
			});*/
			Handlebars.registerHelper("offline", function(cameraStatus, options) {
				var status = cameraStatus-0;
				return status ? 'offline' : '';
			});

			Handlebars.registerHelper('isChecked', function(enable,options) {
				return enable ? 'checked' : '';
			});

			Handlebars.registerHelper('isActive', function(enable,options) {
				return enable ? 'active' : '';
			});


			Handlebars.registerHelper('homeicon', function(enable) {
				return enable ? 'home' : '';
			});

			/*
			Handlebars.registerHelper('search', function(options) {
				return !self.options.lookup ? options.fn(this) : options.inverse(this);
			});*/

			Handlebars.registerHelper('cameratype', function(type, options) { //摄像机类型1球机0枪击
				return type ? 'dome' : '';
			});


			Handlebars.registerHelper('state', function(hd, sd, options) { //摄像机状态
				var isonline = false;
				hd.each(function(item, index) {
					if (item.channel_status === 0) {
						isonline = true;
					}
				});
				if (!isonline) {
					sd.each(function(item, index) {
						if (item.channel_status === 0) {
							isonline = true;
						}
					});
				}
				return !isonline ? '' : 'active';
			});
			Handlebars.registerHelper('cstatus', function(hd, sd, options) { //摄像机状态
				var isonline = false;
				hd.each(function(item, index) {
					if (item.channel_status === 0) {
						isonline = true;
					}
				});
				if (!isonline) {
					sd.each(function(item, index) {
						if (item.channel_status === 0) {
							isonline = true;
						}
					});
				}
				return isonline ? 0 : 1;
			});
			Handlebars.registerHelper('translate', function(channel, options) { //将通道对象数组转化为json字符串，以备后期使用
				return channel ? JSON.stringify(channel) : '';
			});
			Handlebars.registerHelper('isMygropup', function(orgName,flag) { //将通道对象数组转化为json字符串，以备后期使用
				if(orgName && flag){
					return orgName+"-";
				}
				return "";
			});
			Handlebars.registerHelper('isHD', function(HDchannel, options) {
				return HDchannel.length > 0 ? '[高] ' : '';
				// return HDchannel.length > 0 ? 'isHD' : '';
			});
			Handlebars.registerHelper('hasHD', function(HDchannel, options) {
				return HDchannel.length > 0 ? 'hasHD' : 'hasSD';
			});
			Handlebars.registerHelper('checktree', function(enable,options) { //有复选框时添加额外类名checktree
				return enable ? 'checktree' : '';
			});
			Handlebars.registerHelper('isSD', function(HDchannel, options) {
				return HDchannel.length > 0 ? '' : 'isSD';
			});
			Handlebars.registerHelper('nodata', function(options) {
				return '暂无结果！';
			});
			Handlebars.registerHelper('hasNoRight', function(cameraScore,options) {
				var userScore = jQuery("#userEntry").attr("data-score") - 0;
				return userScore < cameraScore ? "disabled" : "";
			});
		},
		noData:function(node){
			if (node.children('ul').length===0) {
				if (node.hasClass('tree-outtest-container')) {
					var type = node.data('treetype');
					if (type==='customize') {
						node.children('.no-data').text('暂无结果！');
					}else{
						node.children('.no-data').text('暂无结果！');
					}
				}else{
					node.children('.no-data').text('暂无结果！');
				}
			}
		},
		/**
		 * [渲染org树]
		 * @author Mayue
		 * @date   2015-04-08
		 * @param  {[type]}   enable    [是否显示checkbox]
		 * @param  {[type]}   container [要显示树的容器]
		 * @param  {Function} callback  [回调函数]
		 * @return {[type]}             [description]
		 */
		renderOrgTree: function(enable,container,callback) {
			var self = this;
			var hasCheckBox = arguments[0] ? arguments[0] : false;
			var container = arguments[1] ? arguments[1] : jQuery('#sidebar-body>[data-tabor="video-res"]>.tree-panel');
			var data = {
				'orgType': 'org',
				'orgId': '',
				'checkbox': hasCheckBox,
				'customizeBtn': false,
				'specialBtn': false,
				'checked': false,
				'outermost':true,
				'container': container
			};
			internalPubSub.publish('renderTree', data,function(box){
				callback&&callback();
			});
		},
		 /**
		 * [渲染inspect树]
		 * @author Mayue
		 * @date   2015-04-08
		 * @param  {[type]}   enable    [是否显示checkbox]
		 * @param  {[type]}   container [要显示树的容器]
		 * @param  {type}     flag      [二级组织是否显现轮巡按钮]
		 * @param  {Function} callback  [回调函数]
		 * @return {[type]}             [description]
		 */
		renderInspectTree: function(enable,container, flag, callback) {
			var self = this;
			var hasCheckBox = arguments[0] ? arguments[0] : false;
			var container = arguments[1] ? arguments[1] : jQuery('#sidebar-body>[data-tabor="video-res"]>.tree-panel');
			self.options.showInspectBtns = flag;
			var data = {
				'orgType': 'org',
				'orgId': '',
				'checkbox': hasCheckBox,
				'customizeBtn': self.options.showInspectBtns,
				'specialBtn': false,
				'checked': false,
				'outermost':true,
				'container': container

			};
			internalPubSub.publish('renderTree', data,function(box){
				callback&&callback();
			});
		},
		/**
		 * 渲染customize树
		 * @author Mayue
		 * @date   2014-12-22
		 * @return {[type]}   [description]
		 */
		renderCustomizeTree: function(hasCheckBox,container, fn) {
			var data = {
				'orgType': 'customize',
				'orgId': '',
				'checkbox': hasCheckBox,
				'customizeBtn': hasCheckBox?false:true,
				'specialBtn': hasCheckBox?false:true,
				'checked': false,
				'outermost':true,
				'container': container
			};
			internalPubSub.publish('renderTree', data, fn);
		},
		renderSystemTree: function(enable) {
			//To-do
		},
		renderGuardRouteTree: function(enable) {
			var hasCheckBox = arguments[0] ? arguments[0] : false;
			var data = {
				'orgType': 'org',
				'orgId': '',
				'checkbox': hasCheckBox,
				'customizeBtn': false,
				'checked': false,
				'container': jQuery("#camerasPanel").find(".addCamerasToGuardRoute .treeMenu")
			};
			internalPubSub.publish('renderTree', data);
		},
		showOnlineCount:function(){
			jQuery('.statistics .online-statistic').show().siblings().hide();
		},
		showOfflineCount:function(){
			jQuery('.statistics .offline-statistic').show().siblings().hide();
		},
		showAllStatisticCount:function(){
			jQuery('.statistics .online-statistic,.statistics .all-statistic').show();
			jQuery('.statistics .offline-statistic').hide();
		},
		renderSearchTree: function(keyword,type,container,callback) {
			var self = this;
			var data = {};
			if (self.options.showInspectBtns == true) {
				data = {
					'orgType': type,
			//		'orgId': '',
					'checkbox': false,
					'customizeBtn': true,
					'specialBtn': false,
					'checked': false,
			//		'outermost':true,
					'container': container
				}
			} else {
				data = {
					'orgType': type,
					'homeicon': false,
					'checkbox': false,
					'customizeBtn': false,
					'checked': false,
					'container': container
				}
			}
			internalPubSub.publish('renderSearchTree', data,keyword,type,callback);
		},
		/**
		 * 添加loading效果
		 * @author Mayue
		 * @date   2014-12-23
		 * @param  {[type]}   node  添加loading效果的容器
		 * @return {[type]}        [description]
		 */
		loading:function(node){
			node.append("<div class='loading'></div>");
		},
		/**
		 * 如果该节点的下级组织没有加载过，就ajax请求进行渲染
		 * @author Mayue
		 * @date   2014-12-23
		 * @param  {[type]}   node [description]
		 * @return {[type]}        [description]
		 */
		checkChildren: function(node) {
			var self=this;
			if (node.hasClass('active')) {
			//	jQuery('.down-inspect-mask').remove();
				if (node.find('ul.tree').size() === 0 && node.find('.no-data-heleper').size() === 0) {
					var id = node.attr('data-id'),
						checkBoxNode = node.children().children('.checkbox'),
						hasCheckBox = node.hasClass('checktree'), //是否有checkbox
						isChecked = hasCheckBox ? checkBoxNode.hasClass('checked') : false;
						orgName = node.closest('li').data("name");
					var	data = {
							'orgType': node.closest('.tree-outtest-container').attr('data-treetype'),
							'orgId': id,
							'checkbox': hasCheckBox,
							'customizeBtn': self.options.showInspectBtns,
							'specialBtn': false,
							'checked': isChecked,
							'container': node,
							'more': hasCheckBox,
							"orgName":orgName
						};
						//对警卫路线的特殊处理
					/*if (jQuery('#camerasPanel').attr('data-type')==='newguardroute') {
						data.orgType = 'org';
					}*/
					internalPubSub.publish('renderTree', data);
				}
			}
		},
		/**
		 * 收集该节点的父节点和子节点id
		 * @author Mayue
		 * @date   2014-12-23
		 * @param  {[type]}   liNode [description]
		 * @return {[type]}        [description]
		 */
		collectFatherAndSon: function(liNode){
			var self = this,
				sonNodes = liNode.find("li.node[data-type=group]"),
				fatherNodes = liNode.parents("li.node[data-type=group]:not('.rootli')"),
				relatedNodesArray = [],
				orgType = liNode.closest('.tree-outtest-container').attr('data-treetype'),
				actionType = liNode.closest('.tree-outtest-container').attr('data-actiontype');
			//点击查询出来的组织节点时不需要添加到过滤框中
			if(actionType === "searchCamera"){
				return false;
			}
			jQuery.each(sonNodes,function(index,ele){
                var obj = {
					id: jQuery(ele).data("id"),
					name: jQuery(ele).data("name")	
				};
				relatedNodesArray.push(obj);
			});	
			jQuery.each(fatherNodes,function(index,ele){
                var obj = {
					id: jQuery(ele).data("id"),
					name: jQuery(ele).data("name")	
				};
				relatedNodesArray.push(obj);
			});
			var relatedNodesIds = _.pluck(relatedNodesArray,"id");
			if(orgType === "org"){
				var L = relatedNodesIds.length;
                for (var i = 0; i < L; i++) {
					var id = relatedNodesIds[i];
					for (var j = 0; j < self.orgFilterArray.length; j++) {
						var ele = self.orgFilterArray[j];
						if(ele.id === id){
							self.orgFilterArray.splice(j,1);
							break;
						}
					}		
				}
				var orgIds = _.pluck(self.orgFilterArray,"id");
				if(liNode.length > 0){
					if(!orgIds.contains(liNode.data("id"))){
						self.orgFilterArray.push({
							id: liNode.data("id"),
							name: liNode.data("name")	
						}); 
					}
				}
				var orgIds = _.pluck(self.orgFilterArray,"id"),
					orgNames = _.pluck(self.orgFilterArray,"name");
					if(orgIds.length > 0){
						jQuery("#sidebar-body").find(".org-res-filter").find("span").attr("data-orgid",orgIds.join(",")).attr("title",orgNames.join(",")).text(orgNames.join(","));
					}
					if(jQuery("#sidebar-body").find(".select-org-Panel").is(":visible")){
						var LiStr = "";
						for(var i=0,Len=orgIds.length; i<Len; i++){
							var name = orgNames[i],
								id = orgIds[i];
							LiStr += '<li data-name='+name+'  data-id='+id+' title='+name+'><span>'+ name +'</span><a class="close" data-type="video-res"></a></li>';
						}
						jQuery("#sidebar-body").find(".select-org-Panel ul").empty().append(LiStr);
					}
			}else{
				var L = relatedNodesIds.length;
                for (var i = 0; i < L; i++) {
					var id = relatedNodesIds[i];
					for (var j = 0; j < self.cusFilterArray.length; j++) {
						var ele = self.cusFilterArray[j];
						if(ele.id === id){
							self.cusFilterArray.splice(j,1);
							break;
						}
					}		
				}
				var orgIds = _.pluck(self.cusFilterArray,"id");
				if(liNode.length > 0){
					if(!orgIds.contains(liNode.data("id"))){
						self.cusFilterArray.push({
							id: liNode.data("id"),
							name: liNode.data("name")	
						}); 
					}
				}
				var orgIds = _.pluck(self.cusFilterArray,"id"),
					orgNames = _.pluck(self.cusFilterArray,"name");
				if(orgIds.length > 0){
					jQuery("#sidebar-body").find("[data-tabor=my-group]").find(".org-my-group-filter").find("span").attr("data-orgid",orgIds.join(",")).attr("title",orgNames.join(",")).text(orgNames.join(","));
				}
				if(jQuery("#sidebar-body").find(".select-customize-Panel").is(":visible")){
					var LiStr = "";
					for(var i=0,Len=orgIds.length; i<Len; i++){
						var name = orgNames[i],
							id = orgIds[i];
						LiStr += '<li data-name='+name+'  data-id='+id+' title='+name+'><span>'+ name +'</span><a class="close" data-type="my-group"></a></li>';
					}
					jQuery("#sidebar-body").find(".select-customize-Panel ul").empty().append(LiStr);
				}	
			}
		},
		clearfilterArray :function(type){
			var self = this;
			if(type === "org"){
				self.orgFilterArray = [];
			}else{
				self.cusFilterArray = [];
			}
		},
		deleteSingleOrgId: function(type,orgid){
           var self = this;
			if(type === "org"){
				var orgIds = _.pluck(self.orgFilterArray,"id");
				var index = orgIds.indexOf(orgid);
				self.orgFilterArray.splice(index,1);
			}else{
				var orgIds = _.pluck(self.cusFilterArray,"id");
				var index = orgIds.indexOf(orgid);
				self.cusFilterArray.splice(index,1);
			}
		},
		rePaintFilter: function(type){
			var self = this;
			if(type === "org"){
				var orgIds = _.pluck(self.orgFilterArray,"id"),
					orgNames = _.pluck(self.orgFilterArray,"name");
					if(orgIds.length > 0){
						jQuery("#sidebar-body").find(".org-res-filter").find("span").attr("data-orgid",orgIds.join(",")).attr("title",orgNames.join(",")).text(orgNames.join(","));
					}else{
						jQuery("#sidebar-body").find(".org-res-filter").find("span").attr("data-orgid","").attr("title","").text("筛选组织...");
					}
			}else{
				var orgIds = _.pluck(self.cusFilterArray,"id"),
					orgNames = _.pluck(self.cusFilterArray,"name");
				if(orgIds.length > 0){
					jQuery("#sidebar-body").find("[data-tabor=my-group]").find(".org-my-group-filter").find("span").attr("data-orgid",orgIds.join(",")).attr("title",orgNames.join(",")).text(orgNames.join(","));
				}else{
					jQuery("#sidebar-body").find("[data-tabor=my-group]").find(".org-my-group-filter").find("span").attr("data-orgid","").attr("title","").text("筛选组织...");
				}	
			}
		},
		/**
		 * 渲染操作按钮
		 * @author Mayue
		 * @date   2014-12-23
		 * @return {[type]}   [description]
		 */
		renderOperator:function(node){
			var self = this;
			var treeType = node.closest('.tree-outtest-container').attr('data-treetype');
			var hasDelBtn = treeType==='customize'?true:false;
		    //var hasDelBtn = treeType==='customize'?false:false; //我的分组去掉删除按钮
			jQuery.when(self.loadTempl(self.URLS.OPERATOR_BTN_TPL)).done(function(tpl){
				var html = tpl({
					'operator': true,
					'customize': hasDelBtn
				});
				node.append(html);
				permission.reShow(); //更多按钮下面的权限控制
			});
		}
	};
	return  View;
});