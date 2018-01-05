define(['jquery','underscore','handlebars','jquery.watch',"ajaxModel"],
	function(jQuery,_,Handlebars,jWatch,ajaxModel){

	var View = function(pb,options) {
		var self = this;
		jQuery.extend(self.options, options);
		internalPubSub = pb;
		self.addHelper();
		self.bindEvent();
	};

	View.prototype = {
		URLS: {
			TREE_TPL: '/module/common/roleTree/tree.template.html'
		},
		templCache:{},
		ajaxObject:null,
		ajaxAbort:null,
		click_Timer:null,
		options: {
			showInspectBtns: false,
			showCameraTreeAuto:false,
			orgs : null,
			cameraId:null
		},
		bindEvent: function() {
			var self = this;
			/**
			 * 点击树上一个节点(li)时的事件  一个横条
			 * @author Mayue
			 * @date   2014-12-23
			 * @param  {[type]}   
			 * @return {[type]}      [description]
			 */
			jQuery(document).off('click','.tree-outtest-container .node .group').on('click','.tree-outtest-container .node .group',function(e) {
				e.stopPropagation();
				var liNode = jQuery(this).closest('.node');
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
			});
			/**
			 * 勾选树上的复选框按钮(选择相机)
			 * @author Mayue
			 * @date   2014-12-23
			 * @param  {[type]}   
			 * @return {[type]}      [description]
			 */
			jQuery(document).off('click','.checktree .cameraselect').on('click','.checktree .cameraselect', function(e) {
				e.preventDefault();
				e.stopPropagation();
				internalPubSub.publish('checkCameraSelect', jQuery(this));
			});
			/**
			 * 勾选树上的复选框按钮（选择云台是否可控）
			 * @author Mayue
			 * @date   2014-12-23
			 * @param  {[type]}   
			 * @return {[type]}      [description]
			 */
			jQuery(document).off('click','.checktree .ptzctrl').on('click','.checktree .ptzctrl', function(e) {
				e.preventDefault();
				e.stopPropagation();
				internalPubSub.publish('checkPtzCtrl', jQuery(this));
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
		addHelper:function(){
			// 节点类型 type属性为gruop是父节点  为camera时为叶子节点
			Handlebars.registerHelper('parent', function(options) {
				return this['type'] === 2 ? options.fn(this) : options.inverse(this);
			});
			Handlebars.registerHelper('camera', function(options) {
				return this['resourceType'] === 'camera' ? options.fn(this) : options.inverse(this);
			});
			Handlebars.registerHelper("offline", function(cameraStatus, options) {
				var status = cameraStatus-0;
				return status ? 'offline' : '';
			});
			Handlebars.registerHelper('isChecked', function(parentCheckStatus, status, options) {
				console.log("======",parentCheckStatus, status);
				if(parentCheckStatus === 2){
					return "checked";
				}
				if(status === 2){
                    return "checked";   //全选
				}
				if(status === 1){
                    return "halfChecked";   //半选
				}
				if(status === 0){
                    return "";   //未选
				}
			});
			Handlebars.registerHelper('ptzIsChecked', function(isParentNodeChecked, action, isControlled, options) {
				console.log("++++++",isParentNodeChecked, action, isControlled);
				if(isParentNodeChecked === 1){
					return "checked";
				}
				if(action === "add" && isParentNodeChecked === 2){
					return "";
				}
				if(isControlled === 3){
                    return "NoCheck";   //不可选
				}
				if(isControlled === 1){
                    return "checked";   //全选
				}
				if(isControlled === 0){
                    return "";   //未选
				}
				
			});
			Handlebars.registerHelper('isActive', function(enable,options) {
				return enable ? 'active' : '';
			});
			Handlebars.registerHelper('homeicon', function(enable) {
				return enable ? 'home' : '';
			});
			Handlebars.registerHelper('cameratype', function(type, options) { //摄像机类型1球机0枪击
			//	return type===1 ?'dome':type===2?"Integrated":type===3?"sky":type===4?"cross":"";
				return type ? 'dome' : '';
			});
			Handlebars.registerHelper('state', function(status, options) { //摄像机状态
				return status === 0 ? 'active' : '';
			});
			Handlebars.registerHelper('checktree', function(enable,options) { //有复选框时添加额外类名checktree
				return enable ? 'checktree' : '';
			});
			Handlebars.registerHelper('nodata', function(options) {
				return '暂无资源！';
			});
		},
		noData:function(node){
			if (node.children('ul').length===0) {
				if (node.hasClass('tree-outtest-container')) {
					var type = node.data('treetype');
					if (type==='customize') {
						node.children('.no-data').text('暂无资源！');
					}else{
						node.children('.no-data').text('暂无资源！');
					}
				}else{
					node.children('.no-data').text('暂无资源！');
				}
			}
		},
		/**
		 * [渲染org树]
		 * @author Mayue
		 * @date   2015-04-08
		 * @param  {[type]}   enable    [是否显示checkbox]
		 * @param  {[type]}   container [要显示树的容器]
		 * @return {[type]}             [description]
		 */
		renderOrgTree: function(enable, container) {
			var self = this;
			var hasCheckBox = arguments[0] ? arguments[0] : false;
			var container = arguments[1] ? arguments[1] : jQuery('#sidebar-body>[data-tabor="video-res"]>.tree-panel');
			var	data = {
					'parentOrg': 0,  //默认0为跟组织
					'checkbox': hasCheckBox,
					'checked': false,
					'outermost':true,
					'container': container
				};
			internalPubSub.publish('renderTree', data);
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
				if (node.find('ul.tree').size() === 0 && node.find('.no-data-heleper').size() === 0) {
					debugger
					var id = node.attr('data-id'),
						checkBoxNode = node.children().children('.cameraselect'),
						hasCheckBox = node.hasClass('checktree'), //是否有checkbox
						isChecked = false,
						parentCheckStatus = 0;
					var ptzCtrlCheckBox = node.children().children('.ptzctrl'),
						isParentNodeChecked = 0;
					if(hasCheckBox){
						//判断摄像机是否勾选
						 if(checkBoxNode.hasClass('checked')){
						 	  isChecked = true;
						 	  parentCheckStatus = 2;   //全选
						 }else if(checkBoxNode.hasClass('halfChecked')){
                              isChecked = "halfChecked";
                              parentCheckStatus = 1;   //半选
						 }else{
						 	  isChecked = false;      //不可选
						 }
						 //判断云台可控是否勾选
						 if(ptzCtrlCheckBox.hasClass('checked')){
						 	  isParentNodeChecked = 1;  //全选
						 }else if(ptzCtrlCheckBox.hasClass('NoCheck')){
                              isParentNodeChecked = 3;  //不可选
						 }else{
						 	  isParentNodeChecked = 2;  //可选但是未选
						 }
					}
					var	data = {
							'parentOrg': id,
							'checkbox': hasCheckBox,
							'checked': isChecked,
							'container': node,
							'more': hasCheckBox,
							'parentCheckStatus': parentCheckStatus,
							'isParentNodeChecked': isParentNodeChecked
						};
					node.closest(".cameraselect").show();
					internalPubSub.publish('renderTree', data);
				}
			}
		}
	};
	return  View;
});