define(["/component/base/self/system.init.config.js",'jquery','mootools'],function(SystemConfig){
SystemConfig.initGlobal();
var Tree = new Class({
		Implements: [Events, Options],
		options: {
			url:"/service/org/get_child_orgs_by_parent?"+ window.sysConfig.getOrgMode(),	//根据父组织获取子组织
			rootUrl:"/service/org/get_root_org?"+ window.sysConfig.getOrgMode(),			//获取根组织
			searchUrl:"/service/org/get_child_orgs_by_name",	//根据组织名搜索
			templateUrl:"/module/maintenance/registrationManage/inc/registrationManage-org-tree.html",
			getParentsUrl:"/service/resource/get_org_path",  // 获取父节点路径
			node:".treePanel",
			template:null,
			queryKey:"",
			scrollbar:null,
			scrollbarNode:"#aside .scrollbarPanel",
			selectable:false,
			defaultRootId:0,
			orgId:null,
			leafClick:jQuery.noop,
			leafDblClick:jQuery.noop,
			treeClick:jQuery.noop,
			treeDblClick:jQuery.noop,
			callback:jQuery.noop,
			curOrgLevel:1,	//当前组织在树中的层级
			orgPathList:[],	// 当前组织路径
			thumbSize:72,
			extraParams:null
		},
		// requestObj:null,
		initialize: function(options) {
			this.setOptions(options);
			// scrollbar 默认scroll容器的类名为 scrollbarPanel
			var tem = this.options;
			//tem.scrollbar = jQuery(tem.node).empty().closest("div"+ tem.scrollbarNode);
			//tem.scrollbar.tinyscrollbar({thumbSize : tem.thumbSize});
			jQuery(this.options.node).empty();
			this.getOrgPathList(tem.orgId);
			// if(tem.orgId && tem.orgId !=="null"){
			// 	this.getOrgPathList(tem.orgId);
			// }
			this.loadTemplate();


		},
		reload:function(options){
			var tem = this.options;
			jQuery(tem.node).empty();
			tem.queryKey ="";
			this.loadData({"parentId":tem.defaultRootId},jQuery(tem.node),true);
		},
		search:function (options) {
			this.setOptions(options);
			var tem = this.options;
			jQuery(tem.node).empty();
			if(tem.queryKey !==""){
				this.loadData({"name":tem.queryKey},jQuery(tem.node),false);
			}else{
				this.reload();
			}
		},
		/*
		 *	权限控制
		 */
		hasAccessPower:function(orgId){
			var result = false;
			// 本部门级下属部门id
			var childs = this.orgChilds;
			// 如果是上级部门
			for (var i = childs.length-1; i >= 0 ; i--) {
				if (orgId === childs[i]) {
					result = true;
					break;
				}
			}
			return result;

		},
		/**
		 * 判断组织树节点下边是否为空 如果为空搜索输入框为空的时候重新加载树 
		 * @author chencheng
		 * @date   2014-10-29
		 * @return {Boolean}  
		 */
		isEmpty: function() {
			var tem = this.options;
			var firstLi = jQuery(tem.node).children('ul').children('li:eq(0)');
			if (firstLi && firstLi.children('div.no-data').length > 0) {
				return true;
			}
			return false;
		},
		// 获取当前组织路径  顶级>上级>当前
		getOrgPathList:function(currentOrgId){
			currentOrgId = currentOrgId==="null"?1:currentOrgId;
			var self = this;
			jQuery.ajax({
				url: self.options.getParentsUrl,
				type: "get",
				dataType: "json",
				async:false,
				data: {orgId: currentOrgId},
				success:function (res) {
					if(res.code === 200){
						self.options.orgPathList = self.cutOrgPath(res.data.orgPathList.reverse());
						// 保存当前组织及下属组织id 用于权限判断
						self.orgChilds = res.data.childs ? res.data.childs : [];

					}else{
						notify.warn("网络或服务器异常！");
					}
				}
			});

		},
		// 修改org path id [20,70,155]
		cutOrgPath:function(orgPath){
			var currentOrg = jQuery("#userEntry").attr("data-orgid");
			if(orgPath.length <= 2){
				return orgPath ;
			}else{
				// 从当前组织的上一组织开始显示
				var index = orgPath.indexOf(parseInt(jQuery("#userEntry").attr("data-orgid"),10)) - 1;
				return orgPath.slice(index);
			}
			return [];
		},
		loadTemplate:function() {
			var self  = this;
			jQuery.get(self.options.templateUrl,function(tmp){
				var tem = self.options;
				self.addHelper();
				tem.template = Handlebars.compile(tmp);
				self.loadData({"parentId":self.options.defaultRootId},jQuery(tem.node),true);
			});
		},
		addHelper:function(){
			Handlebars.registerHelper('isTree', function(type,options) {
				if(type === "tree"){return options.fn();	}
			});
			Handlebars.registerHelper("mills2str", function(num) {
				// 依赖base.js Toolkit
				return Toolkit.mills2str(num);
			});
		},
		/*
		*	部门相关操作->更新左侧的树
		*/
		// 删除[delete]  新增[create]  修改[edit]
		updateLiSpan:function (type,params) {
			var self = this;
			var el = jQuery(this.options.node).find("li[data-id="+params.id+"]");
			if(type === "delete"){
				var parent = el.closest("ul").closest("li");
				if(parent.length > 0){
					parent.children("ul").html("");
					parent.removeClass("active");
					parent.removeAttr("data-loaded");
					parent.children("i.fold").click();
				}else{
					// 针对搜索出来的结果，没有父节点
					var sCount = el.siblings('li').length;
					el.remove();
					if( sCount === 0 ){
						self.reload();
					}
				}
				
				
			}else if(type ==="edit"){

				// "created":1389430230000,
				// "description":"暂未有描述信息",
				// "dueDate":1392307200000,
				// "id":"104",
				// "isChild":"tree",
				// "level":3,
				// "modified":1392354614000,
				// "name":"上海市公安局",
				// "orgCode":"106",
				// "parentId":1,
				// "status":1
				el.attr("data-id",params.id);
				el.attr("data-name",params.name);
				el.attr("data-departid",params.parentId);
				el.children("span.name").html(params.name);
				el.children("span").attr("title",params.name);

			}else if(type === "create"){
				
				// 如果当前部门已展开 就重新加载改节点
				if(el.children("i.fold").length !== 0){
					if(el.attr("data-loaded")){
						el.children("ul").html("");
						el.removeAttr("data-loaded");
						el.removeClass("active");
						el.children("i.fold").click();
					}
				}else{
					// 在叶子节点下添加子部门
					el.prepend("<i class='fold'></i>");
					el.removeClass("leaf").addClass("tree");
					el.attr("data-type","tree");
					el.children("i.leaf").addClass("tree").removeClass("leaf");

					el.children("i.fold").click(function(){
						var current = jQuery(this).closest("li");
						if(current.attr("data-type") === "tree"){
							if(!current.attr("data-loaded")){
								self.loadData({"parentId":current.attr("data-id")},current,false);
							}else{
								self.toggle(current.children("ul"));
							}
						}
						current.toggleClass("active");
						return false;
					}).click();
				}
				// 更新下self.childs 不然新增的下级组织部门 没权访问  
				self.updateChilds();
			}
			//this.updateScrollBar();
		},
		//更新 子组织（this.childs）用于权限控制,创建新的下属部门得更新childs数组
		updateChilds:function(){
			if(jQuery("#userEntry").attr("data-orgid") === "null"){
				return;
			}
			
			var self = this;
			jQuery.ajax({
				url: self.options.getParentsUrl,
				type: "get",
				dataType: "json",
				data: {orgId: self.options.orgId},
				success:function (res) {
					if(res.code === 200){
						// 更新当前组织及下属组织id 用于权限判断
						self.orgChilds = res.data.childs ? res.data.childs : [];
					}else{
						notify.warn("网络或服务器异常！");
					}
				}
			});
		},
		render:function(data){
			return this.options.template(data);
		},
		/*
		*	判断用户权限	@curOrgId：用户当前组织id	@orgId:操作的组织id (暂时不用  [2014.10.9])
		*/
		hasPermission:function(curOrgId,orgId){
			var self = this;
			var selfDepart = jQuery(self.options.node).find("li[data-id='"+curOrgId+"']");
			if(selfDepart.length>0){
				var target = selfDepart.find("li[data-id='"+orgId+"']");
				if(target && target.length>0){
					return true;
				}else{
					return false;
				}

			}else{
				return false;
			}
			return false;
		},
		/*updateScrollBar:function(){
			this.options.scrollbar.tinyscrollbar_update('relative');
		},*/
		bindEvent:function(parentNode,initFlag){
			var self = this;
			var target = parentNode.find("ul li.tree span");
			if(initFlag){
				target = parentNode.find("ul li span");
			}
			// 树节点 span单击事件
			target.on("click",function(event){
				self.addClickEffect(jQuery(this));
				self.processTreeClick(jQuery(this));
				return false;
			});

			// 树节点 span双击事件
			target.on("dblclick",function(event){
				self.processTreeDblClick(jQuery(this));
			});

			// + 点击事件
			target.closest("li").children("i.fold").click(function(){
				var current = jQuery(this).closest("li");
				if(current.attr("data-type") === "tree"){
					if(!current.attr("data-loaded")){
						self.loadData({"parentId":current.attr("data-id")},current,false);
					}else{
						self.toggle(current.children("ul"));
					}
				}
				current.toggleClass("active");

				return false;
			});

			// 叶子节点单击事件
			parentNode.find("ul li.leaf span").on("click",function(event){
				self.addClickEffect(jQuery(this));
				self.processLeafClick(jQuery(this));
				return false;
			});

			// 叶子节双击事件
			parentNode.find("ul li.leaf span").on("dblclick",function(event){
				self.processLeafDblClick(jQuery(this));
				return false;
			});

			self.options.callback(target);
			// 叶子节点前的图片点击事件
			parentNode.find("ul li.leaf i.leaf").on("click",function(event){
				// 直接调用span的点击事件
				self.processLeafClick(jQuery(this).closest("li").children("span"));
				return false;
			});

			// 选择框点击事件
			if(self.options.selectable){
				parentNode.find("li>i.checkbox").click(function(){
					var tem = jQuery(this);
					tem.toggleClass("selected");
					self.walkUp(tem);
					self.walkDown(tem);
					return false;
				});
			} 

			// 自动展开当前部门
			self.autoExpand();


		},

		// 自动展开
		autoExpand:function(){
			var self = this;
			
			// 当前部门 暂不展开  length > 0 即可展开
			if(self.options.orgPathList.length > 0){
				jQuery(self.options.node).find("li").each(function(index,item){

					if(parseInt(jQuery(item).attr("data-id"),10) === parseInt(self.options.orgPathList[0],10)){
						var el = jQuery(item);
						self.options.orgPathList.shift();
						el.children("i.fold").click();

						if(el.attr("data-id") === self.options.orgId){
							self.options.curOrgLevel = el.attr("data-tree-level");
							el.children("span").click();
						}

					}
				});
			}
			
		},


		/*
		 *	向上查找
		 */ 
		walkUp:function(item){
			var current = item;
			var caller = arguments.callee;
			if(current.closest("li").is("li.root") ){
				return;
			}
			if(current.closest("li").is("li") ){
				var parent = current.closest("li").closest("ul").closest("li").children("i.checkbox");
				if(! current.is(".selected")){
					parent.removeClass("selected");
					caller(parent);
				}else{
					var result = true;
					current.closest("li").siblings("li").children("i.checkbox").each(function(index,checkbox){
						if(!jQuery(checkbox).is("i.selected")){
							result = false;
						}
					});
					if(result){
						item.closest("li").closest("ul").closest("li").children("i.checkbox").addClass("selected");
					}
					caller(parent);
				}
			}
		},
		/*
		 *	向下查找
		 */
		walkDown:function(item){
			var caller = arguments.callee;
			var current = item;
			if(current.closest("li").is("li.tree")){
				if(! current.is(".selected")){
					current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);
							child.removeClass("selected");
							caller(child);
						});
				}else{
					current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);
							if(!child.is("i.selected")){
								child.addClass("selected");
							}
							caller(child);
						});
				}
			}
		},
		/*
		 *	添加点击样式
		 */
		addClickEffect:function(element) {
			var node = element.closest("li");
			(function(el) {
				if(!el.is(".cur")){
					el.addClass("cur");
				}
				el.siblings("li").removeClass("cur").find("li").removeClass("cur");
				if (el.closest("ul").closest("li").attr("data-id")) {
					arguments.callee(el.closest("ul").closest("li"));
				}
			})(node);
			node.find("li").removeClass("cur");
		},
		/*
		 *	处理叶子节点点击事件
		 */
		processLeafClick:function(el){
			this.options.leafClick(el);
		},
		processLeafDblClick:function(el){
			this.options.leafDblClick(el);
		},
		processTreeClick:function(el){
			this.options.treeClick(el);

		},
		processTreeDblClick:function(el){
			this.options.treeDblClick(el);
		},
		/*
		 *	控制元素的显示/隐藏
		 */
		toggle:function(el){
			if(el.css("display") === "none"){
				el.css("display","block");
			}else{
				el.css("display","none");
			}
			//this.updateScrollBar();
		},
		// 构建url地址  添加额外的参数
		addExtraParams:function(url){
			var extraParams = this.options.extraParams;
			if(url.indexOf("?") !== -1){
				url = url + "&" + jQuery.param(extraParams);
			}else{
				url = url + "?" + jQuery.param(extraParams);
			}
			return url;
		},
		/*
		 *	向页面中添加html
		 */
		appendHTML:function(receiveData,parentNode,context,init){
			parentNode.attr("data-loaded",1);
			var level = 1;
			if(!init){
				level = parseInt(parentNode.attr("data-tree-level"),10)+1;
			}

			if(context.options.selectable){
				if(parentNode.children("i.checkbox").is("i.selected")){
					parentNode.append(context.render({"orgs":receiveData,"level":level,"init":init,"selected":"selected","selectable":context.options.selectable,"size":receiveData.length}));
				}else{
					parentNode.append(context.render({"orgs":receiveData,"level":level,"init":init,"selected":"","selectable":context.options.selectable,"size":receiveData.length}));
				}
			}else{
				parentNode.append(context.render({"orgs":receiveData,"level":level,"init":init,"selectable":context.options.selectable,"size":receiveData.length}));
			}
			//context.updateScrollBar();
			context.bindEvent(parentNode,init);
		},
		/*
		 *	加载数据
		 */
		loadData:function(params,parentNode,initFlag){	
			// 解决click事件 防止重复请求
			parentNode.children("i.fold").unbind("click");

			var self = this,
				url = self.options.url,
				getRootFlag = false,
				requestType = "get"; 

			if(params.parentId === 0){
				url =  self.options.rootUrl;
				params = null;
				getRootFlag = true;
			}
			if(self.options.queryKey !== ""){
				params.name = self.options.queryKey;
				url =  self.options.searchUrl;
				requestType = "post";
				self.options.queryKey = "";
			}
			
			if(self.options.extraParams){
				url = self.addExtraParams(url);
			}
			
			if(self.requestObj && self.requestObj.status !== 200){
				self.requestObj.abort();
			}

			self.requestObj = jQuery.ajax({
				url:url,
				type:requestType,
				data:params,
				dataType:'json', 
				setTimeout:60000,
				beforeSend:function(){
					parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
				},
				success:function(res){
					var receiveData = [];
					if(getRootFlag){
						if(res && res.code === 200 && res.data.org){
							receiveData = [res.data.org];
							self.appendHTML(receiveData,parentNode,self,initFlag);
						}else{
							parentNode.attr("data-loaded",1);
							parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
						}

					}else{
						if(res && res.code === 200 && res.data.orgs.length > 0){
							receiveData = res.data.orgs;
							if(params.name){
								if(receiveData.length>49) {
									notify.warn("搜索到的结果较多，默认显示50条，请使用更精确的关键字查询其他结果！");
								}
								self.appendHTML(receiveData.splice(0,49), parentNode, self, initFlag);

							}else{
								self.appendHTML(receiveData,parentNode,self,initFlag);
							}
						}else{
							parentNode.attr("data-loaded",1);
							parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
						}
					}

                    // parentNode.triggerHandler("treeExpandSuccess");
				},
				complete:function(){
					if(parentNode.children("ul#loading")){
						parentNode.children("ul#loading").remove();
					}
					// 回复click事件
					parentNode.children("i.fold").on("click",function(event){
						// self.processTreeClick(jQuery(this));
						var current = jQuery(this).closest("li");
						if(current.attr("data-type") === "tree"){
							if(!current.attr("data-loaded")){
								self.loadData({"parentId":current.attr("data-id")},current,false);
							}else{
								self.toggle(current.children("ul"));
							}
						}
						current.toggleClass("active");
						return false;
					});

                    parentNode.triggerHandler("treeExpandComplete");

				}
			});
		}
	});
return {
	registrationManageOrgtree: Tree
};
});