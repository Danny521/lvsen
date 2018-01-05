define([
	'/module/common/roleTree/internal-pubsub.js',
	'jquery',
	'/module/common/roleTree/tree-view.js',
	'/module/common/roleTree/tree-module.js',
	'mootools',
	'/module/common/roleTree/tree-watch-name.js'
], function(pb, jQuery, view, Module, Mt,TreeWatchName) {
	var internalPubSub,
		View;
	var Tree = function(options) {
		var self = this;
		jQuery.extend(self.options, options);
		console.log("self.options",self.options);
		self._init();
		internalPubSub.regist({
			'renderTree': self._getTree,
			'checkCameraSelect': self.check,
			'checkPtzCtrl': self.ptzCtrlCheck
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
			node:null,
			showInspectBtns: false,
			mode: "add", // mode 分为：1.add 2.edit
			roleId: 0
		},
		_init: function() {
			var self = this;
			internalPubSub = new pb(this);
			View = new view(internalPubSub,self.options);
		},
		/**
		 *根据参数，获取树参数，并且渲染
		 * @author Mayue
		 * @date   2014-12-19
		 * @param  {[type]}   obj [格式如下]
		 * {
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
			var self = this,
				orgId = obj.parentOrg,//视频监控为展开一级
				roleId = self.options.roleId;
			self._addHomeIco(obj);
			View.removeLoading();
			View.loading(obj.container);
			obj.outermost&&obj.container.addClass('tree-outtest-container');
			jQuery.when(Module.getCameras({
				"id" : orgId,
				"resourceRoleId" : roleId
			}), View.loadTempl(View.URLS.TREE_TPL)).then(function(res, tpl) {
				if (res && res.code === 200) {
					var renderData = {},
						container = obj.container,
						treeDom;
					//组合数据
					obj.action = self.options.mode;
					renderData.option = obj;
					renderData.cameras = res.data;
					treeDom = tpl(renderData);
					//渲染树  因为渲染树用的了定时器分批渲染，所以这块的代码就得用回调来实现
					self._renderTree(container, treeDom).done(function(node){
						self._singleRoot(orgId, container);
						if (typeof callback === 'function') {
							callback(container);
						}						
					});
				}
				if(res && res.code === 500){
                     notify.warn("获取摄像机列表失败");
                     setTimeout(function(){
                          obj.container.find('.loading').remove();
                          obj.container.removeClass('active');
                     },1000);
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
			if (id === 0) {
				//根组织
				var li = container.children('.tree').children('li');
				TreeWatchName.watchContainer();
				if (li.size() === 1) {
					li.addClass('rootli');
					if (!li.hasClass('active')) {
						li.children('.group').trigger('click');
					}
				//	li.find(".checkbox.ptzctrl").remove();
				}else{
					self.deferred.resolve(self.hideTreeBox[0]);
				}
			}else{
				var li = container.children('.tree').children('li');
				$(li).each(function(){
					if($(this).children('a').children('i').first().attr('class').contains('halfChecked')){
						var _currnode = $(this);
						_currnode.children('.group').trigger('click');
						window.tiggerTimer = setTimeout(function(){
							if(_currnode.hasClass("active")){
								_currnode.children("a.group").trigger('click');
							}
							clearTimeout(window.tiggerTimer);
						}, 400);
					} else {
						self.deferred.resolve(self.hideTreeBox[0]);
					}
				})
				self.deferred.resolve(self.hideTreeBox[0]);
			}
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
		_renderTree: function(node, html) {
			var self = this;
			//如果是最外层树容器，需要清空上一次的树
			if (node.hasClass('tree-outtest-container')) {
				node.empty();
			}
			node.find('div.loading').remove();
			self._rendTreeByPiece(node,jQuery(html),function () {
				self._emptyData(node);
				self.renderTreeDefer.resolve(node);
				View.noData(node);
			//	TreeWatchName.resetWidth();
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
		 * 是否显示根组织图标 	homeicon:Boolean  布尔  true显示根组织图标  false不显示根组织图标
		 * @author Mayue
		 * @date   2014-12-19
		 * @param  {[type]}   obj [description]
		 * @return {Boolean}      [description]
		 */
		_addHomeIco: function(obj) {
			obj.homeicon = obj.orgId === 0 ? true : false;
		},
		/**
		 * [ptzCtrlCheck 云台勾选事件]
		 * @author Mayue
		 * @date   2014-12-19
		 * @param  {[type]}   obj [description]
		 * @return {Boolean}      [description]
		 */
		ptzCtrlCheck: function(elm){
			debugger
			var node = (typeof elm === "string") ? jQuery(elm) : elm,
				hasNoCheck = node.hasClass('NoCheck'),
				isChecked = !node.hasClass('checked'); //此处的isChecked代表一个动作。将要做的动作。true代表将要选中，false代表将取消选中
			if(hasNoCheck && isChecked){
				return false;
			}else{
				this._toggleCheckForPtz(node, isChecked);
				this._checkDownForPtz(node, isChecked);
				this._checkUpForPtz(node, isChecked);
				return false;
			}
		},
		/**
		 * [_toggleCheckForPtz description]
		 * @author Mayue
		 * @date   2014-12-23
		 * @param  {[type]}   node   [description]
		 * @param  {[type]}   enable [代表动作，true代表将要选中，false代表将取消选中]
		 * @return {[type]}          [description]
		 */
		_toggleCheckForPtz: function(node, isChecked) {
			debugger
			if (isChecked) {
				node.addClass('checked');
			} else {
				node.removeClass('checked');
			}
		},
		/**
		 * [_checkDownForPtz description]
		 * @author Mayue
		 * @date   2014-12-23
		 * @param  {[type]}   node   [description]
		 * @param  {[type]}   enable [代表动作，true代表将要选中，false代表将取消选中]
		 * @return {[type]}          [description]
		 */
		_checkDownForPtz: function(node, isChecked) {
			var self = this;
			if (node.size() !== 0) {
				var downNodes = node.closest('a.group').siblings('ul.tree').find('i.ptzctrl');
				if(downNodes.length > 0){
					self._toggleCheckForPtz(downNodes, isChecked);
					self._checkDownForPtz(downNodes, isChecked);
				}
			}
		},
		/**
		 * [_checkUpForPtz description]
		 * @author Mayue
		 * @date   2014-12-23
		 * @param  {[type]}   node   [description]
		 * @param  {[type]}   enable [代表动作，true代表将要选中，false代表将取消选中]
		 * @return {[type]}          [description]
		 */
		_checkUpForPtz: function(node, isChecked) {
			debugger
			var allCheck = true;
			var lis = node.closest('ul.tree').children('li'),
			    length = lis.length,
			    noCheckdCount = 0,
			    halfCheckdCount = 0,
			    checkCount = 0;
			var parentCheckBox = node.closest('ul.tree').siblings('a.group').children('i.ptzctrl');
			var parentNodeType = "";
			    if(length < 0){
                    return false;
			    }
			lis.each(function(index, elm) {
				debugger
				var $This = jQuery(elm).children().children('i.ptzctrl'),
				    checked = $This.hasClass('checked');
				    halfChecked = $This.hasClass('halfChecked'),
				    noChecked = !checked && !halfChecked;
			//	allCheck = allCheck && checked;
				if(checked){
                    checkCount ++;
				}
				if(noChecked){
                    noCheckdCount ++;
				}
				if(halfChecked){
					halfCheckdCount ++;
				}
			});
			if(checkCount === length){
                 parentNodeType = "checked"; 
			}
			if(checkCount > 0 && checkCount < length || halfCheckdCount > 0){
                  parentNodeType = "halfChecked";
			}
			if(noCheckdCount === length){
                 parentNodeType = "noChecked";
			}
			if (/*(isChecked && allCheck) || !isChecked*/ length > 0) {
				this._toggleForPtz(parentCheckBox, parentNodeType);
				this._checkUpForPtz(parentCheckBox, isChecked);
			}
		
		},
		_toggleForPtz: function(node, parentNodeType) {
			if(!node.hasClass("NoCheck")){
				if (parentNodeType === "checked") {
					node.addClass('checked');
				} else if(parentNodeType === "halfChecked"){
					node.removeClass('checked');
				}else{
	                 node.removeClass('checked');
				}
			}
		},
		/**
		 * [check 摄像机勾选事件]
		 * @author Mayue
		 * @date   2014-12-19
		 * @param  {[type]}   obj [description]
		 * @return {Boolean}      [description]
		 */
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
		_toggleCheck: function(node, isChecked) {
			if (isChecked) {
				node.addClass('checked');
				node.removeClass('halfChecked');
				node.parent("a").addClass("active");
			} else {
				node.removeClass('checked');
				node.parent("a").removeClass("active");
			}
		},
		_toggle: function(node, parentNodeType) {
			if (parentNodeType === "checked") {
				node.addClass('checked');
				node.removeClass('halfChecked');
				node.parent("a").addClass("active");
			} else if(parentNodeType === "halfChecked"){
				node.removeClass('checked');
			    node.addClass('halfChecked');
				node.parent("a").removeClass("active");
			}else{
                 node.removeClass('checked');
			    node.removeClass('halfChecked');
				node.parent("a").removeClass("active");
			}
		},
		_checkUp: function(node, isChecked) {
			var allCheck = true;
			var lis = node.closest('ul.tree').children('li'),
			    length = lis.length,
			    noCheckdCount = 0,
			    halfCheckdCount = 0,
			    checkCount = 0;
			var parentCheckBox = node.closest('ul.tree').siblings('a.group').children('.checkbox.cameraselect');
			var parentNodeType = "";
			    if(length < 0){
                    return false;
			    }
			lis.each(function(index, elm) {
				var $This = jQuery(elm).children().children('.checkbox.cameraselect'),
				    checked = $This.hasClass('checked');
				    halfChecked = $This.hasClass('halfChecked'),
				    noChecked = !checked && !halfChecked;
			//	allCheck = allCheck && checked;
				if(checked){
                    checkCount ++;
				}
				if(noChecked){
                    noCheckdCount ++;
				}
				if(halfChecked){
					halfCheckdCount ++;
				}
			});
			if(checkCount === length){
                 parentNodeType = "checked"; 
			}
			if(checkCount > 0 && checkCount < length || halfCheckdCount > 0){
                  parentNodeType = "halfChecked";
			}
			if(noCheckdCount === length){
                 parentNodeType = "noChecked";
			}
			if (/*(isChecked && allCheck) || !isChecked*/ length > 0) {
				this._toggle(parentCheckBox, parentNodeType);
				this._checkUp(parentCheckBox, isChecked);
			}
		
		},
		_checkDown: function(node, isChecked) {
			var self = this;
			if (node.size() !== 0) {
				var downNodes = node.closest('a.group').siblings('ul.tree').find('i.checkbox.cameraselect');
				self._toggleCheck(downNodes, isChecked);
			}
		},
		_handleEmptyData:function(){111
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
		renderOrgTree: function(enable, container) {
			var self = this;
			self.options.node = container;
			View.renderOrgTree(enable, container);
		},
        /*
		*	资源角色获取选中结果
		*/
		getData:function(){
			var outData ={
				"orgIds":[],
				"halfCheck":[],
				"cameraIds":[],
				"controlledOrgIds":[],
				"controlledCameraIds":[]
			};
			var self = this;
			// 匹配数组id ()
			(function walk(item){
				// item 为li元素
				var caller = arguments.callee,
				    current = item;
				    debugger
				if(current.hasClass("rootli") && current.children("a").children("i.cameraselect").hasClass("checked")){
					// 如果是根组织被勾选
					outData.orgIds.push(current.attr("data-id") -0);
					//云台可控（组织）
					if(current.children("a").children("i.ptzctrl").hasClass("checked")){
						outData.controlledOrgIds.push(current.attr("data-id") -0);
					}
				}else{
					if(current.hasClass("rootli") && current.children("a").children("i.cameraselect").hasClass("halfChecked")){
                        // 记录跟组织半选状态
					    outData.halfCheck.push(current.attr("data-id") -0);
					}
					current.children("ul").children("li").children("a").children("i.cameraselect").each(function(index,tem){
						debugger
						var child = jQuery(tem);
						if(child.hasClass("checked")){
							var parentLi = child.closest("li");
							if(parentLi.attr("data-type") === "2"){
								// 组织
								outData.orgIds.push(parentLi.attr("data-id") -0);
								//云台可控（组织）
								if(parentLi.children("i.ptzctrl").hasClass("checked")){
									outData.controlledOrgIds.push(parentLi.attr("data-id") -0);
								}
							}else if(parentLi.attr("data-type") === "1"){
								// 相机
							    outData.cameraIds.push(parentLi.attr("data-id") -0);
							    //云台可控（相机）
							    if(parentLi.children("i.ptzctrl").hasClass("checked")){
									outData.controlledCameraIds.push(parentLi.attr("data-id") -0);
								}
							}
						}else{
							if(child.hasClass("halfChecked")){
								var parentLi = child.closest("li");
                                // 记录跟组织半选状态
					    		outData.halfCheck.push(parentLi.attr("data-id") -0);
							}
							// 只遍历展开过的
							/*if(child.closest("li").hasClass("active")){
								caller(child.closest("li"));
							}*/
							if(child.closest("li").length > 0){
								caller(child.closest("li"));
							}
						}
					});
				}
			})(jQuery(self.options.node).children("ul").children("li"));
			return outData;
		},
        /*
		*	云台控制获取选中结果
		*/
		getDataForPtz:function(){
			var outData ={
				"controlledOrgIds":[],
				"controlledCameraIds":[]
			};
			var self = this;
			// 匹配数组id ()
			(function walk(item){
				// item 为li元素
				var caller = arguments.callee,
				    current = item;
				    debugger
				if(current.hasClass("rootli") && current.children("a").children("i.cameraselect").hasClass("checked")){
					//云台可控（组织）
					if(current.children("a").children("i.ptzctrl").hasClass("checked")){
						outData.controlledOrgIds.push(current.attr("data-id") -0);
					}else{
						current.children("ul").children("li").children("a").children("i.cameraselect").each(function(index,tem){
							debugger
							var child = jQuery(tem);
							var parentLi = child.closest("li");
							var siblingsCheckBox = parentLi.children("a").children("i.ptzctrl");
							if(child.hasClass("checked") && siblingsCheckBox.hasClass("checked")){
								
								if(parentLi.attr("data-type") === "2"){
									//云台可控（组织）
									outData.controlledOrgIds.push(parentLi.attr("data-id") -0);
								}else if(parentLi.attr("data-type") === "1"){
								    //云台可控（相机）
									outData.controlledCameraIds.push(parentLi.attr("data-id") -0);
								}
							}else{
								// 只遍历展开过的
								if(child.closest("li").length > 0){
									caller(child.closest("li"));
								}
							}
						});
					}
				}else{
					current.children("ul").children("li").children("a").children("i.cameraselect").each(function(index,tem){
						debugger
						var child = jQuery(tem);
						var parentLi = child.closest("li");
						var siblingsCheckBox = parentLi.children("a").children("i.ptzctrl");
						if(child.hasClass("checked") && siblingsCheckBox.hasClass("checked")){
							
							if(parentLi.attr("data-type") === "2"){
								//云台可控（组织）
								outData.controlledOrgIds.push(parentLi.attr("data-id") -0);
							}else if(parentLi.attr("data-type") === "1"){
							    //云台可控（相机）
								outData.controlledCameraIds.push(parentLi.attr("data-id") -0);
							}
						}else{
							// 只遍历展开过的
							if(child.closest("li").length > 0){
								caller(child.closest("li"));
							}
						}
					});
				}
			})(jQuery(self.options.node).children("ul").children("li"));
			return outData;
		}
	};
	return Tree;
});
