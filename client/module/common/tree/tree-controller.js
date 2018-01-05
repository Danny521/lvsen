/**
 * Created by Mayue on 2014/12/17.
 */
define([
	'/module/common/tree/internal-pubsub.js',
	'jquery',
	'/module/common/tree/tree-view.js',
	'/module/common/tree/tree-module.js',
	'mootools',
	'jquery-ui',
	'pubsub',
	'/module/common/tree/tree-watch-name.js'
], function(pb, jQuery, view, Module, Mt,jQueryUI,PubSub,TreeWatchName) {
	var internalPubSub,
		View;
	var Tree = function(player,options) {
		var self = this;
		jQuery.extend(self.options, options);
		self._init(player);
		internalPubSub.regist({
			'renderTree': self._getTree,
			'checkTree': self.check,
			'renderSearchTree': self._getSearchTree
		});
	};
	Tree.prototype = {
		SHType:'all',//'all':全部  'sd'：标清  'hd'：高清
		OffOnlineType:'all',//'all':全部  'offline'：离线  'online'：在线
		deferred : null,//给于秋那边隐藏树的时候用到
		renderTreeDefer:null,//分批渲染树时用到
		hideTreeBox :jQuery('<div class="hide-tree"><div></div></div>'),
		myGroupNum:0,
		options: {
			showInspectBtns: false
		},
		_init: function(player) {
			var self = this;
			internalPubSub = new pb(this);
			View = new view(internalPubSub,player,self.options);
		},
		/**
		 *根据参数，获取树参数，并且渲染
		 * @author Mayue
		 * @date   2014-12-19
		 * @param  {[type]}   obj [格式如下]
		 * {
		 * 	'orgType':'org', 字符串 'org'或者'system'或者'customize'3种类型
		 * 	'orgId':'vorg_1', 字符串 当改为为空''时代表获取的是根节点
		 * 	'checkbox':Boolean, 布尔 true显示复选框  false隐藏复选框
		 * 	'customizeBtn':Boolean,  布尔 true显示‘删除’‘重命名’按钮  false隐藏‘删除’‘重命名’按钮
		 * 	'checked':Boolean,  布尔  true选中复选框  false非选中复选框
		 * 	'outermost':Boolean,  布尔  true代表container是最外层容器，会给container加一个类名tree-outtest-container  false不是最外层容器
		 * 	'container':jQ对象  放置渲染出来的树的容器  jq对象
		 * }
		 * @return {[type]}       [description]
		 */
		_getTree: function(obj, callback) {
			var orgId = obj.orgId,
				orgType = obj.orgType,
				self = this;

			View.removeLoading();
			View.loading(obj.container);
			obj.outermost&&obj.container.addClass('tree-outtest-container');
			if(obj.outermost && orgType == "customize"){
                obj.container.addClass('customize-pecial');
            }
            if( orgType == "customize"){
            	obj.ismygroup = true;
            }
			jQuery.when(Module.getCameras(orgId, orgType), View.loadTempl(View.URLS.TREE_TPL)).then(function(res, tpl) {
				if (res && res.code === 200) {
					var renderData = {},
						container = obj.container,
						treeDom;
					//组合数据
					renderData.option = obj;
					renderData.cameras = res.data.cameras;
					treeDom = tpl(renderData);					
					//渲染树  因为渲染树用的了定时器分批渲染，所以这块的代码就得用回调来实现
					self._renderTree(container, treeDom, orgType, "listCamera").done(function(node){
						self._singleRoot(orgId, container);
						if (typeof callback === 'function') {
							callback(container);
						}						
					});
					if(orgType == 'customize' &&  orgId == ""){
                       self.myGroupNum =res.data.cameras.length;
                       jQuery("#sidebar #sidebar-body .video-resource-detail .group-total-num").html(self.myGroupNum);
					}
				}
				if(res && res.code === 500){
                     notify.warn("获取摄像机列表失败");
                     setTimeout(function(){
                          obj.container.find('.loading').remove();
                          obj.container.removeClass('active');
                     },2000);
				}
			});
		},
		/**
		 * 如果根节点只有一个节点时，展开根节点。
		 * @author Mayue
		 * @date   2014-12-23
		 * @param  {[type]}   id [组织id]
		 * @return {[type]}      [description]
		 */
		_singleRoot: function(id, container) {
			var self = this;
			self.deferred = jQuery.Deferred();
			if (id === '') {
				var li = container.children('.tree').children('li');
				TreeWatchName.watchContainer();
				if (li.size() === 1) {
					li.addClass('rootli');
					if (!li.hasClass('active')) {
						li.children('.group').trigger('click');
					}
				}else{
					self.deferred.resolve(self.hideTreeBox[0]);
				}
			}else{
				self.deferred.resolve(self.hideTreeBox[0]);
			}
			/*if (!flag) {
				console.log('222', + new Date());
				var aaa= jQuery('.hide-tree')[0];
				console.log('111', + new Date());
				 // self.deferred.resolve(aaa);
				self.deferred.resolve(self.hideTreeBox[0]);
				// self.deferred.resolve(self.hideTreeBox.html());
			}*/
		},
		_getSearchTree: function(obj, key, type, callback) {
			var orgType = obj.orgType,
				self = this,
				param = {
					key: key,
					type: type,
					count: 50000, //仅仅只是摄像机个数    不包含组织结构
					offset: 0
				};
			View.loading(obj.container);
			//结合常州现场的问题的修改，合并视频指挥左侧树在线/离线统计实时读取数据。by zhangyu on 2015/6/23
			switch(self.OffOnlineType) {
				case "all":
					param.isOnline = null;
					break;
				case "online":
					param.isOnline = 0;
					break;
				case "offline":
					param.isOnline = 1;
					break;
				default:
					//默认取全部
					param.isOnline = null;
			}
			if(type === "org"){
				var filterPanel = jQuery("#sidebar-body").find(".org-res-filter"),
					orgid = filterPanel.find("span").attr("data-orgid");
					if(!!orgid){
						filterPanel.addClass("active");
					}	
					param.orgid = orgid;
			}else if(type === "customize"){
				var filterPanel = jQuery("#sidebar-body").find(".org-my-group-filter"),
					   orgid = filterPanel.find("span").attr("data-orgid");
					if(!!orgid){
						filterPanel.addClass("active");
					}
					param.orgid = orgid;
			}
			View.ajaxAbort = jQuery.ajax({
				url: '/service/video_access_copy/search_camera',
				type: 'get',
				cache: false,
				data: param,
				success: function(res) {
					if (res && res.code === 200) {
						jQuery.when(View.loadTempl(View.URLS.TREE_TPL)).done(function(tpl){
							var renderData = {},
								container = obj.container,
								treeDom;
							//增加当前节点的父组织机构入口（客户需要查看当前摄像机或组织结构的父组织信息）
							obj.showAllOrg = true;
							//组合数据
							renderData.option = obj;
							renderData.cameras = res.data.cameras;
							treeDom = tpl(renderData);
							//渲染树
							self._renderTree(container, treeDom, orgType, "searchCamera").done(function(){
								if (callback) {
									callback();
								}
							});
						});
					}
					
				}
			});
		},
		/**
		 * [_rendTreeByPiece 分批渲染树节点，防止节点太多页面卡死现象]
		 * @author Mayue
		 * @date   2015-05-07
		 * @param  {[type]}   container  [description]
		 * @param  {[type]}   $insertDom [description]
		 * @param  {Function} callback   [description]
		 * @return {[type]}              [description]
		 */
		_rendTreeByPiece: function(container, $insertDom, callback) {
			var self = this;
			var $ULclone = $insertDom.clone();
			var $UIwrapper = $insertDom.empty();
			var step = 500; //每次渲染的节点数目 默认值:500
			var index = 0;
			var delay = 200; //二次渲染的时间间隔 默认值:200
			var timer = null;
			var $LIS = $ULclone.children('li');
			var liLen = $LIS.length;
			self.renderTreeDefer = jQuery.Deferred();//新建Deferred对象
			// $UIwrapper.append($LIS);
			if (liLen > step) {
				$UIwrapper.append($LIS.slice(index, step));
				container.append($UIwrapper);
				index = step;
				timer = setInterval(function() {
					if (index >= liLen) {
						window.clearInterval(timer); //清除计时器
						if (typeof callback ==='function') {
							callback();
						}
					} else {
						$UIwrapper.append($LIS.slice(index, step+index));
						index = index + step;
					}
				}, delay);

			} else {
				container.append($ULclone);
				if (typeof callback === 'function') {
					callback();
				}
			}
		},
		/**
		 * [_renderTree 渲染树，由于内部是定时器分批渲染，所以用了deferred的方式执行后续代码]
		 * @author Mayue
		 * @date   2015-05-07
		 * @param  {[type]}   node     [description]
		 * @param  {[type]}   html     [description]
		 * @param  {[type]}   type     [description]
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		_renderTree: function(node, html, type, actionType) {
			var self = this;
			//如果是最外层树容器，需要清空上一次的树
			if (node.hasClass('tree-outtest-container')) {
				node.empty();
				node.attr('data-treetype', type); 
				node.attr('data-actiontype', actionType); 
			}
			node.find('div.loading').remove();
			self._rendTreeByPiece(node,jQuery(html),function () {
				self._showBySHType(node);
				self._showByOffOnlineType(node);
				self._emptyData(node);
				self._bindDraggable(node);
				self.renderTreeDefer.resolve(node);
				var count = jQuery(html).children("li").length;
				//判断是关键字搜索时渲染搜索结果条目数
				if(actionType === "searchCamera" && count > 0){					
					if(window.sessionStorage.getItem("currentModule").indexOf("monitor") >-1){
						node.prepend("<span style='float:right;margin:10px 10px 0px 0px'>搜索结果共"+count+"条</span>");
					}else if(window.sessionStorage.getItem("currentModule").indexOf("dispatch") >-1){
						node.prepend("<span style='float:right;margin:16px 0px 5px 0px'>搜索结果共"+count+"条</span>");
					}
				}
				View.noData(node);
				View.showOffOnlineCount(node);
				TreeWatchName.resetWidth();
			});
			return self.renderTreeDefer;
		},
		_emptyData:function(container){
			var $lis = container.children('ul.tree').children('li');
			var isAllHide = true;
			$lis.each(function (index,elm) {
				if (jQuery(elm).attr('class').indexOf('hide-')===-1) {
					isAllHide = false;
					return false;
				}
			});
			if (isAllHide) {
				if (container.children('.no-data').length === 0) {
					container.append('<h2 class="no-data">暂无摄像机！</h2>');
				}
			}
		},
		/**
		 * [_showByOffOnlineType 根据offOnlineType进行高标清的显示]
		 * @author Mayue
		 * @date   2015-05-04
		 * @param  {[type]}   container [description]
		 * @return {[type]}             [description]
		 */
		_showByOffOnlineType:function(container){
			var self = this;
			if (self.OffOnlineType==='all') {
				View.showAllStatisticCount();
			}else if (self.OffOnlineType==='online') {
				container.find('.leaf').parent('li.offline').addClass('hide-offline');
				View.showOnlineCount();
			}else if (self.OffOnlineType==='offline') {
				container.find('.leaf').parent('li:not(".offline")').addClass('hide-online');
				View.showOfflineCount();
			}
		},
		/**
		 * [_showByType 根据SHType进行高标清的显示]
		 * @author Mayue
		 * @date   2015-05-04
		 * @param  {[type]}   container [description]
		 * @return {[type]}             [description]
		 */
		_showBySHType:function(container){
			var self = this;
			if (self.SHType==='all') {

			}else if (self.SHType==='sd') {
				container.find('.leaf > .hasHD').closest('li').addClass('hide-hd');
			}else if (self.SHType==='hd') {
				container.find('.leaf > .hasSD').closest('li').addClass('hide-sd');
			}
		},
		_bindDraggable: function(jObj) {
			jObj.find("li[data-type='camera'] .leaf").draggable({
				helper: "clone",
				zIndex: 1000,
				cursor: "pointer",
				scope: 'tasks',
				appendTo: ".tvList",
				cursorAt: {
					"left": -10
				},
				start: function(event, ui) {
					if ($("#preview") && $("#preview").length !== 0) {
						$("#preview").remove();
					}
					window.gTvwallArrayGis = [];
					//参数 0：cameracode 1：id 2：name 3：hdchannel 4：sdchannel
					var cameracode = jQuery(this).closest("li").attr("data-cameracode").trim(),
						id = jQuery(this).closest("li").attr("data-id").trim(),
						name = jQuery(this).closest("li").attr("data-name").trim(),
						hdchannel = jQuery(this).closest("li").attr("data-hdchannel").trim(),
						sdchannel = jQuery(this).closest("li").attr("data-sdchannel").trim();
					window.gTvwallArrayGis = [cameracode, id, name, hdchannel, sdchannel];
				}
			});
		},
		
		/**
		 * 是否显示根组织图标 	homeicon:Boolean  布尔  true显示根组织图标  false不显示根组织图标
		 * @author Mayue
		 * @date   2014-12-19
		 * @param  {[type]}   obj [description]
		 * @return {Boolean}      [description]
		 */
		_addHomeIco: function(obj) {
			if (obj.orgType === 'org' || obj.orgType === 'system') {
				obj.homeicon = obj.orgId === '' ? true : false;
			} else {
				obj.homeicon = false;
			}

		},
		getGroupNum: function() {
            var self=this; 
			return self.myGroupNum;
		},
		check: function(elm) {
			var node = (typeof elm === "string") ? jQuery(elm) : elm,
				isChecked = !node.hasClass('checked'); //此处的isChecked代表一个动作。将要做的动作。true代表将要选中，false代表将取消选中
			this._toggleCheck(node, isChecked);
			this._checkDown(node, isChecked);
			this._checkUp(node, isChecked);
			return false;
		},
		/**
		 * [_toggleCheck description]
		 * @author Mayue
		 * @date   2014-12-23
		 * @param  {[type]}   node   [description]
		 * @param  {[type]}   enable [代表动作，true代表将要选中，false代表将取消选中]
		 * @return {[type]}          [description]
		 */
		_toggleCheck: function(node, enable) {
			if (enable) {
				node.addClass('checked');
				node.parent("a").addClass("active");
			} else {
				node.removeClass('checked');
				node.parent("a").removeClass("active");
			}
		},
		_checkUp: function(node, isChecked) {
			var allCheck = true;
			var lis = node.closest('ul.tree').children('li');
			var parentCheckBox = node.closest('ul.tree').siblings('a.group').children('.checkbox');
			if (lis.length === 0) {
				return;
			}
			lis.each(function(index, elm) {
				var checkFlag = jQuery(elm).children().children('.checkbox').hasClass('checked');
				allCheck = allCheck && checkFlag;
			});

			if ((isChecked && allCheck) || !isChecked) {
				this._toggleCheck(parentCheckBox, isChecked);
				this._checkUp(parentCheckBox, isChecked);
			}
		},
		_checkDown: function(node, isChecked) {
			var self = this;
			if (node.size() !== 0) {
				var downNodes = node.closest('a.group').siblings('ul.tree').find('i.checkbox');
				self._toggleCheck(downNodes, isChecked);
			}
		},
		_handleEmptyData:function(){
			var tree =jQuery('[data-type="group"]').filter(function (index) {
				return jQuery(this).children('ul.tree').length===1;
			});
			tree.each(function(index,elm){
				var $ul = jQuery(elm).children('ul.tree');
				if ($ul.children(':visible').length===0) {
					if (jQuery(elm).children('.no-data').length === 0) {
						jQuery(elm).append('<h2 class="no-data">暂无摄像机！</h2>');
					}
				}else{
					if (jQuery(elm).children('.no-data').length !== 0) {
						jQuery(elm).children('.no-data').remove();
					}
				}
			});
		},
		/**
		 * [showSHTree description]
		 * 
		 * @author Mayue
		 * @date   2015-05-04
		 * @param  {[type]}   container [树所在的容器]
		 * @param  {[type]}   type    ['hd':高清   'sd':标清   'all':全部]
		 * @return {[type]}             [description]
		 */
		showSHTree:function(container,type){
			this.SHType = type;
			if (type==='sd') {
				container.find('.hide-sd').removeClass('hide-sd');
				container.find('.leaf > .hasHD').closest('li').addClass('hide-hd');
			}else if(type==='hd'){
				container.find('.hide-hd').removeClass('hide-hd');
				container.find('.leaf > .hasSD').closest('li').addClass('hide-sd');
			}else if (type==='all') {
				container.find('.hide-sd').removeClass('hide-sd');
				container.find('.hide-hd').removeClass('hide-hd');
			}
			this._handleEmptyData();
		},
		showOffOnlineTree:function(container,type){
			this.OffOnlineType = type;
			if (type==='online') {
				container.find('.hide-online').removeClass('hide-online');
				container.find('.leaf').parent('li.offline').addClass('hide-offline');
				View.showOnlineCount();
			}else if(type==='offline'){
				container.find('.hide-offline').removeClass('hide-offline');
				container.find('.leaf').parent('li:not(".offline")').addClass('hide-online');
				View.showOfflineCount();
			}else if (type==='all') {
				container.find('.hide-online').removeClass('hide-online');
				container.find('.hide-offline').removeClass('hide-offline');
				View.showAllStatisticCount();
			}
			this._handleEmptyData();
		},
		renderOrgTree: function(enable, container,callback) {
			View.renderOrgTree(enable, container,callback);
		},
		renderInspectTree: function(enable, container,flag,callback) {
			View.renderInspectTree(enable, container,flag,callback);
		},
		renderCustomizeTree: function(enable, container, fn) {
			View.renderCustomizeTree(enable, container, fn);
		},
		renderSystemTree: function(enable) {
			View.renderSystemTree(enable);
		},
		renderSearchTree: function(keyword, type, callback) {
			View.renderSearchTree(keyword, type, callback);
		},
		renderGuardRouteTree: function(enable) {
			View.renderGuardRouteTree(enable);
		},
		bindSearchEvent:function(node,type,container){
			View.bindSearchEvent(node,type,container);
		},
		bindSearchClickEvent:function(srcNode,inputNode,type,container){
			View.bindSearchClickEvent(srcNode,inputNode,type,container);
		},
		/*customize,org*/
		getHideTree:function(hasCheckBox,type,callback){
			var self = this;
			var fn;
			jQuery('.hide-tree').remove();
			jQuery('body').append(self.hideTreeBox);

			var data = {
				'orgType': type,
				'orgId': '',
				'checkbox': hasCheckBox,
				'customizeBtn': false,
				'checked': false,
				'outermost':true,
				'container': jQuery('.hide-tree > div')
			};
			if(type==='org'){
				fn = function(){
					View.showOffOnlineCountInRoot(data.container);
					if (typeof callback==='function') {
						callback();
					}
					
				};
			}else{
				fn = callback;
			}

			self._getTree(data,fn);
			return self.deferred;
		},
		clearfilterArray: function(type){
           View.clearfilterArray(type);
		},
		deleteSingleOrgId: function(type,orgid){
           View.deleteSingleOrgId(type,orgid);
		},
		rePaintFilter: function(type){
			View.rePaintFilter(type);
		}
	};
	return Tree;
});
