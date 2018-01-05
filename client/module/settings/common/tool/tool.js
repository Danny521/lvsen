/*  树形列表 (列举摄像头)
	params:
		@url:请求服务的url
		@templateUrl:渲染模板的url
		@node:元素选择符
		@selectable:是否前边带选择框
		@callback：叶子节点的回调函数
	ps:require handlebarTemplate,tree.css jquery
*/






// 布防树 ==================================================================================================

var DefenseCamera = new Class({
		Implements: [Events, Options],
		options: {
			// url:"/service/video_access/list_cameras",	//根据父组织获取子组织
			// rootUrl:"/service/video_access/list_cameras",			//获取根组织
			url:"/service/video_access_copy/list_cameras",	//根据父组织获取子组织
			rootUrl:"/service/video_access_copy/list_cameras",			//获取根组织
			searchUrl:"/service/video_access_copy/search_camera",	//根据组织名搜索
			searchCameraUrl:"/service/video_access_copy/search_only_camera",	//高级搜索 只搜摄像头
			templateUrl:"/inc/settings/defenseCamera.html",
			getParentsUrl:"/service/resource/get_org_path",  // 获取父节点路径
			node:".treePanel",
			template:null,
			queryKey:"",
			isMarked:"",	// 已标注[1] or 未标注[0]
			scrollbar:null,
			type:"org",
			scrollbarNode:"#aside .scrollbarPanel",
			selectable:false,
			defaultRootId:0,
			orgId:null,
			leafClick:jQuery.noop,
			leafDblClick:jQuery.noop,
			treeClick:jQuery.noop,
			treeDblClick:jQuery.noop,
			dropDown:jQuery.noop,
			curOrgLevel:1,	//当前组织在树中的层级
			orgPathList:[],	// 当前组织路径
			thumbSize:72,
			callback:jQuery.noop
		},
		initialize: function(options) {
			this.setOptions(options);
			// scrollbar 默认scroll容器的类名为 scrollbarPanel
			var tem = this.options;
			tem.scrollbar = jQuery(tem.node).html("").closest("div"+ tem.scrollbarNode);
			tem.scrollbar.tinyscrollbar({thumbSize : tem.thumbSize});
			jQuery(this.options.node).html("");
			if(tem.orgId && tem.orgId !== "null"){
				this.getOrgPathList(tem.orgId);
			}
			this.loadTemplate();
		},
		reload:function(options){
			var tem = this.options;
			jQuery(tem.node).html("");
			tem.queryKey ="";
			this.loadData({"parentId":tem.defaultRootId},jQuery(tem.node),true);
		},
		search:function (options) {
			this.setOptions(options);
			var tem = this.options;
			jQuery(tem.node).html("");
			if(tem.queryKey !== ""){
				this.loadData({"key":tem.queryKey,"mark":tem.isMarked,"type":"org","count":50,"offset":0},jQuery(tem.node),false);
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
				if (orgId == childs[i]) {
					result = true;
					break;
				}
			}
			return result;

		},
		// 获取当前组织路径  顶级>上级>当前
		getOrgPathList:function(currentOrgId){
			var self = this;
			jQuery.ajax({
				url: self.options.getParentsUrl,
				type: "get",
				dataType: "json",
				async:false,
				data: {orgId: currentOrgId},
				success:function (res) {
					if(res.code === 200){
						// self.options.orgPathList = self.cutOrgPath(res.data.orgPathList.reverse());
						self.options.orgPathList =res.data.orgPathList.reverse();

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
				self.loadData(null,jQuery(tem.node),true);
			});
		},
		addHelper:function(){
			Handlebars.registerHelper('isTree1', function(type,options) {
				if(type === "group"){return options.fn();	}
			});

			Handlebars.registerHelper('status', function(type,status,options) {
				if(type === 1){
					if(status === 0){
						return 'dom dom-marked';
					}else{
						return 'dom';	
					}
				}else {
					if(status === 0){
						return 'marked';	

					}else{
						return '';
					}
				}
				
			});


			Handlebars.registerHelper('typeNameTransform', function(type,options) {
				if(type === "group"){
					return "tree";	
				}else{
					return "leaf";
				}
			});

			Handlebars.registerHelper('eq', function(value1,value2,options) {
				
				if(value2 === value1 ){
					return options.fn();
				}else{
					return options.inverse();
				}
			});

			Handlebars.registerHelper("mills2str", function(num) {
				// 依赖base.js Toolkit
				return Toolkit.mills2str(num);
			});
			Handlebars.registerHelper("isCode",function(str){
				if(str){
					return "("+ str +")";
				}
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
				parent.children("ul").html("");
				parent.removeClass("active");
				parent.removeAttr("data-loaded");
				parent.children("i.fold").click();
				
			}else if(type ==="edit"){

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
								self.loadData({"id":current.attr("data-id")},current,false);
							}else{
								self.toggle(current.children("ul"));
							}
						}
						current.toggleClass("active");
						return false;
					}).click();
				}
			}
			this.updateScrollBar();
		},
		render:function(data){
			return this.options.template(data);
		},
		updateScrollBar:function(){
			this.options.scrollbar.tinyscrollbar_update('relative');
		},
		dropDown:function(event,ui){
			this.options.dropDown(event,ui);
		},
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
						self.loadData({"id":current.attr("data-id")},current,false);
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
				self.processLeafClick(jQuery(this),event);
				return false;
			});

			// 叶子节双击事件
			parentNode.find("ul li.leaf span").on("dblclick",function(event){
				self.processLeafDblClick(jQuery(this));
				return false;
			});


			// 叶子节点前的图片点击事件
			parentNode.find("ul li.leaf i.leaf").on("click",function(event){
				// 直接调用span的点击事件
				self.processLeafClick(jQuery(this).closest("li").children("span"));
				return false;
			});

			// self.options.callback(target);

			
			//拖动事件

			//parentNode.find("ul li.leaf span").draggable({
			//	cursorAt: { left: 5 },
			//	appendTo:"body",
			//	zIndex: 800,
			//	helper: function(event){
			//		// console.log(jQuery(event.currentTarget));
			//		// var el = jQuery("<div class='drag-helper-icon'></div>")
			//		// return el;

			//		var className = "drag-helper-icon";

			//		var el = jQuery(event.currentTarget).closest("li").children("i.leaf");
			//		if(el.hasClass("dom")){
			//			className = "drag-helper-icon-alt";
			//		}
			//		var helper = jQuery("<div class='"+className+"'></div>");

			//		// TODO 可以追加其他属性
			//		return helper;
			//	},
			//	stop:function(event,ui){
			//		self.dropDown(event,ui);
			//	}

			//});
				
			

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
					if(jQuery(item).attr("data-id") === ("org_"+self.options.orgPathList[0])){
						var el = jQuery(item);
						self.options.orgPathList.shift();
						el.children("i.fold").click();

						if(el.attr("data-id") === ("org_" + self.options.orgId)){
							// self.options.curOrgLevel = el.attr("data-tree-level");
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
			// node.find("li").removeClass("cur");
			// 不改自己点选图标
			node.find("li").removeClass("cur");

		},
		/*
		 *	处理叶子节点点击事件
		 */
		processLeafClick:function(el,event){
			this.options.leafClick(el,event);
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
			this.updateScrollBar();
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
					parentNode.append(context.render({"cameras":receiveData,"level":level,"init":init,"selected":"selected","selectable":context.options.selectable,"size":receiveData.length}));
				}else{
					parentNode.append(context.render({"cameras":receiveData,"level":level,"init":init,"selected":"","selectable":context.options.selectable,"size":receiveData.length}));
				}
			}else{
				parentNode.append(context.render({"cameras":receiveData,"level":level,"init":init,"selectable":context.options.selectable,"size":receiveData.length}));
			}

			context.updateScrollBar();
			context.bindEvent(parentNode,init);
		},
		/*
		 *	加载数据
		 */
		loadData:function(params,parentNode,initFlag){	
			// 解决click事件 防止重复请求
			parentNode.children("i.fold").unbind("click");

			var self = this,
				url = self.options.url+"?type="+self.options.type+"&isRoot="+ window.sysConfig.getResMode(),
				getRootFlag = false,
				requestType = "get"; 

			if(initFlag){
				getRootFlag = true;
				url =  self.options.rootUrl+"?type="+self.options.type+"&isRoot="+ window.sysConfig.getResMode();
			}

			if(self.options.queryKey !== ""){
				params.key = self.options.queryKey;
				url =  self.options.searchUrl;
				requestType = "get";
				self.options.queryKey = "";
			}

			if(self.options.isMarked !== ""){
				params.mark = self.options.isMarked;
				url =  self.options.searchCameraUrl;
				requestType = "get";
				self.options.isMarked = "";
			}
			
			jQuery.ajax({
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
						if(res && res.code === 200 && res.data.cameras){
							receiveData = res.data.cameras;
							self.appendHTML(receiveData,parentNode,self,initFlag);
						}else{
							parentNode.attr("data-loaded",1);
							parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
							self.updateScrollBar();
						}

					}else{
						if(res && res.code === 200 && res.data.cameras.length > 0){
							receiveData = res.data.cameras;
							if(params.key){
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
							self.updateScrollBar();
						}
					}

					
				},
				error:function(){
					notify.warn("网络或服务器异常！");
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

				}
			});
		}
	});



var selectCameraTree = new Class({
		Implements: [Events, Options],
		options: {
			url:"/service/resource/get_camera_orgs_by_parent",  //根据父元素id获取子元素
			rootUrl:"/service/resource/get_root_camera?isRoot="+ window.sysConfig.getResMode(),   //获取根
			getParentsUrl:"/service/resource/get_org_path",  // 获取父节点路径
			node:".treePanel",	//容器选择符
			templateUrl:"/inc/settings/selectCameraTree.html",		//模板路径
			template:null,
			queryKey:"",
			scrollbar:null,
			scrollbarNode:"#aside .scrollbarPanel",
			selectable:false,
			defaultOrgs:[],
			defaultCameras:[],				//编辑默认数据
			defaultRootId:0,
			orgId:null,
			mode:"create",	// "create", "edit" , "detail" 
			leafClick:jQuery.noop,
			leafDblClick:jQuery.noop,
			treeClick:jQuery.noop,
			treeDblClick:jQuery.noop,
			orgPathList:[]
		},
		initialize: function(options) {
			this.setOptions(options);
			// scrollbar 默认scroll容器的类名为 scrollbarPanel
			var tem = this.options;
			tem.scrollbar = jQuery(tem.node).html("").closest("div"+ tem.scrollbarNode);
			tem.scrollbar.tinyscrollbar({thumbSize : 72});

			jQuery(this.options.node).empty();
			this.loadTemplate();
			
			if(tem.orgId){
				this.getOrgPathList(tem.orgId);
			}
			this.updateScrollBar();
		},
		getOrgPathList:function(currentOrgId){
			var self = this;
			jQuery.get(self.options.getParentsUrl+"?orgId="+currentOrgId,function(res){
				if(res.code === 200){
					self.options.orgPathList = res.data.orgPathList;
				}else{
					notify.warn("网络或服务器异常！");
				}
			});
		},
		loadTemplate:function() {
			var self  = this;
			jQuery.get(self.options.templateUrl,function(tmp){
				var tem = self.options;
				self.addHelper();
				tem.template = Handlebars.compile(tmp);

				// if(tem.mode ==="create"){
					self.loadData({"masterOrgId":self.options.defaultRootId},jQuery(tem.node),true);
				// }else if(tem.mode ==="edit"){
				// }
				
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
			Handlebars.registerHelper('isVirtual', function(id,options) {
				// 如果是虚拟组织 则添加自定义属性 data-vid  vorg_id
				var sid = "" + id;
				if(sid.indexOf("vorg_") !== -1){
					return 'data-orgid='+ sid.match(/\d+/)[0] + ' data-vid='+ sid ;
				}
				
			});
		},
		render:function(data){
			return this.options.template(data);
		},
		updateScrollBar:function(){
			this.options.scrollbar.tinyscrollbar_update('relative');
		},
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
						// if(current.attr("data-vid")){
							// self.loadData({"masterOrgId":current.attr("data-id"),"vOrgId":current.attr("data-vid")},current,false);
						// }else{
							self.loadData({"masterOrgId":current.attr("data-id")},current,false);
						// }
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
		autoExpand:function(){
			var self = this;
			
			// 当前部门 暂不展开  length > 0 即可展开
			if(self.options.orgPathList.length > 1){

				jQuery(self.options.node).find("li").each(function(index,item){
					if(parseInt(jQuery(item).attr("data-id"),10) === parseInt(self.options.orgPathList[0],10)){
						self.options.orgPathList.shift();
						jQuery(item).children("i.fold").click();

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
		*	获取改变的数据
		*/	
		getEditData:function(){
			
			var outData = [];
			var self = this;

			(function walk(item){

				// item 为li元素

				var caller = arguments.callee;
				var current = item;

				// console.log(current.attr("data-name"));

				// 当前元素勾选
				if(current.children("i.checkbox").is(".selected")){
					if(!current.attr("data-default")){
						if (current.attr("data-vid")) {
							outData.push({
								"id": current.attr("data-orgid"),
								"resourceType": "2",
								"isResource": "0",
								"isReject": "0",
								"isDelete": "0",
								"vOrgId": current.attr("data-vid")
							});
						} else {
							outData.push({
								"id": current.attr("data-id"),
								"resourceType": "2",
								"isResource": "0",
								"isReject": "0",
								"isDelete": "0"
							});
						}
						// outData.push({
						// 		"id":current.attr("data-id"),
						// 		"resourceType":"2",
						// 		"isResource":"0",
						// 		"isReject":"0",
						// 		"isDelete":"0"
						// 	});
					}

				}else{
					// 当前元素（默认）-> 未勾选
					if(current.attr("data-default")){
						// 判断是否是虚拟组织，如果是虚拟组织的话就传一个区分的vorgid
						if (current.attr("data-vid")) {
							outData.push({
								"id": current.attr("data-orgid"),
								"resourceType": "2",
								"isResource": "0",
								"isReject": "0",
								"isDelete": "1",
								"vOrgId": current.attr("data-vid")
							});
						} else {
							outData.push({
								"id": current.attr("data-id"),
								"resourceType": "2",
								"isResource": "0",
								"isReject": "0",
								"isDelete": "1"
							});
						}
						// 默认勾选被去掉 则 delete掉
						

						// 遍历其子节点
						current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
							var child = jQuery(tem);

							// 查找勾选的
							if(child.is("i.selected")){
								if(child.closest("li").attr("data-res") === "camera"){

									// console.log("摄像机："+child.closest("li").attr("data-name")+"     >>默认非勾选")
									outData.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"1",
										"isReject":"0",
										"isDelete":"0"
									});

								}else{
									// 判断是否是虚拟组织，如果是虚拟组织的话就传一个区分的vorgid
									if (child.closest("li").attr("data-vid")) {

										outData.push({
											"id":child.closest("li").attr("data-orgid"),
											"resourceType": "2",
											"isResource": "0",
											"isReject": "0",
											"isDelete": "0",
											"vOrgId": child.closest("li").attr("data-vid")
										});
									} else {

										outData.push({
											"id": child.closest("li").attr("data-id"),
											"resourceType": "2",
											"isResource": "0",
											"isReject": "0",
											"isDelete": "0"
										});
									}
									// outData.push({
									// 	"id":child.closest("li").attr("data-id"),
									// 	"resourceType":"2",
									// 	"isResource":"0",
									// 	"isReject":"0",
									// 	"isDelete":"0"
									// });
									
								}
								
							}else{
								// 遍历展开过的
								if(child.closest("li").attr("data-loaded")){
									caller(child.closest("li"));
								}
							}
						});

					}else{
						current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
							var child = jQuery(tem);
							
							if(child.is("i.selected")){
								// 摄像机 (筛选没有默认值的)
								if(!child.closest("li").attr("data-default")){

									if(child.closest("li").attr("data-res") === "camera"){
										// console.log("摄像机："+child.closest("li").attr("data-name")+"     >>非默认勾选")
										outData.push({
											"id":child.closest("li").attr("data-id"),
											"resourceType":"2",
											"isResource":"1",
											"isReject":"0",
											"isDelete":"0"
										});

									}else{
										// 组织
										// console.log("组织-|："+child.closest("li").attr("data-name")+"     >>child 非默认勾选")
										
										if(!child.closest("li").attr("data-default")){
											if (child.closest("li").attr("data-vid")) {

												outData.push({
													"id":child.closest("li").attr("data-orgid"),
													"resourceType": "2",
													"isResource": "0",
													"isReject": "0",
													"isDelete": "0",
													"vOrgId": child.closest("li").attr("data-vid")
												});
											} else {

												outData.push({
													"id": child.closest("li").attr("data-id"),
													"resourceType": "2",
													"isResource": "0",
													"isReject": "0",
													"isDelete": "0"
												});
											}
											// outData.push({
											// 	"id":child.closest("li").attr("data-id"),
											// 	"resourceType":"2",
											// 	"isResource":"0",
											// 	"isReject":"0",
											// 	"isDelete":"0"
											// });
										}
										
									}

								}
										
							}else{
								// 子元素也没有勾选
								if(child.closest("li").attr("data-default")){
									// 当前节点是摄像机
									if(child.closest("li").attr("data-res") === "camera"){

										outData.push({
												"id":child.closest("li").attr("data-id"),
												"resourceType":"2",
												"isResource":"1",
												"isReject":"0",
												"isDelete":"1"
											});
									}else{
										// 当前节点是组织
										if(child.closest("li").attr("data-loaded")){
											caller(child.closest("li"));
										}else{
											if (child.closest("li").attr("data-vid")) {

												outData.push({
													"id":child.closest("li").attr("data-orgid"),
													"resourceType": "2",
													"isResource": "0",
													"isReject": "0",
													"isDelete": "1",
													"vOrgId": child.closest("li").attr("data-vid")
												});
											} else {

												outData.push({
													"id": child.closest("li").attr("data-id"),
													"resourceType": "2",
													"isResource": "0",
													"isReject": "0",
													"isDelete": "1"
												});
											}
											// outData.push({
											// 	"id":child.closest("li").attr("data-id"),
											// 	"resourceType":"2",
											// 	"isResource":"0",
											// 	"isReject":"0",
											// 	"isDelete":"1"
											// });
										}
									}

								}else{
									if(child.closest("li").attr("data-loaded")){
										caller(child.closest("li"));
									}
								}
								
							}
						});

					}

				}
				
			})(jQuery(self.options.node).children("ul").children("li"));

			// console.log(outData.length)

			return outData;

		},
		/*
		*	添加摄像机权限
		*/
		getCreateData:function(){
			var outData = [];
			var self = this;

			(function walk(item){

				// item 为li元素

				var caller = arguments.callee;
				var current = item;

				// console.log(current.attr("data-name"));

				// 当前元素勾选
				if(current.children("i.checkbox").is(".selected")){
					if(current.attr("data-vid")){
						outData.push({
							"id":current.attr("data-orgid"),
							"resourceType":"2",
							"isResource":"0",
							"isReject":"0",
							"isDelete":"0",
							"vOrgId":current.attr("data-vid")
						});
					
					}else{
						outData.push({
							"id":current.attr("data-orgid"),
							"resourceType":"2",
							"isResource":"0",
							"isReject":"0",
							"isDelete":"0"
						});
					
					}
					// outData.push({
					// 		"id":current.attr("data-id"),
					// 		"resourceType":"2",
					// 		"isResource":"0",
					// 		"isReject":"0",
					// 		"isDelete":"0"
					// 	});
					
				}else{

					current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);

						if(child.is("i.selected")){
							// 摄像机
							if(child.closest("li").attr("data-res") === "camera"){
								// console.log("摄像机："+child.closest("li").attr("data-name")+"     >>非默认勾选")
								outData.push({
									"id":child.closest("li").attr("data-id"),
									"resourceType":"2",
									"isResource":"1",
									"isReject":"0",
									"isDelete":"0"
								});

							}else{
								// 组织
								// console.log("组织-|："+child.closest("li").attr("data-name")+"     >>child 非默认勾选")
								if(child.closest("li").attr("data-vid")){
									outData.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"0",
										"isReject":"0",
										"isDelete":"0",
										"vOrgId":child.closest("li").attr("data-vid")
									});
								}else{
									outData.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"0",
										"isReject":"0",
										"isDelete":"0"
									});
								}
								// outData.push({
								// 	"id":child.closest("li").attr("data-id"),
								// 	"resourceType":"2",
								// 	"isResource":"0",
								// 	"isReject":"0",
								// 	"isDelete":"0"
								// });
								
								
							}
									
						}else{
							// 只遍历展开过的
							if(child.closest("li").attr("data-loaded")){
								caller(child.closest("li"));
							}
							
						}
					});

				}
				
			})(jQuery(self.options.node).children("ul").children("li"));

			return outData;

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
			this.updateScrollBar();
		},
		/*
		*	输出改变的数据
		*/ 
		getOutPutData:function(){
			if(this.options.mode ==="create"){
				return this.getCreateData();
			}else if(this.options.mode ==="edit"){
				return this.getEditData();
			}else{
				return [];
			}
		},
		/*
		*	初始化默认勾选改部门下的资源
		*/
		selectEl:function(){
			// 默认将当前所在组织勾选
			var self = this;

			if(self.options.mode === "create"){
				// 默认勾选该组织

				if(self.options.orgId){
					jQuery(self.options.node).find("li[data-id='"+self.options.orgId+"']").each(function(index,item){
						var el = jQuery(item);
						if(el.attr("data-res") === "org"){
							var checkbox = el.children("i.checkbox");
							if(!checkbox.hasClass("selected") && !checkbox.attr("data-check")){
								checkbox.addClass("selected");
								checkbox.attr("data-check","1");
							}
						}
					});
				}

			}else{
				// 编辑状态，勾选默认值

				var orgs = self.options.defaultOrgs;
				var cameras = self.options.defaultCameras;

				// 筛选组织
				for(var i = orgs.length-1;i>=0;i--){
					// 默认组织勾选 并添加 data-default 属性
					jQuery(self.options.node).find("li[data-id='"+orgs[i]+"']").each(function(index,item){
						var el = jQuery(item);
						if(el.attr("data-res") === "org"){
							var checkbox = el.children("i.checkbox");
							if(!checkbox.hasClass("selected") && !checkbox.attr("data-check")){
								checkbox.addClass("selected");
								checkbox.attr("data-check","1");
							}
							el.attr("data-default","1");
						}
					});
				}

				//筛选摄像机
				for(var j = cameras.length-1;j>=0;j--){

					// 默认摄像机勾选 并添加 data-default 属性
					jQuery(self.options.node).find("li[data-id='"+cameras[j]+"']").each(function(index,item){
						var el = jQuery(item);
						if(el.attr("data-res") === "camera"){
							var checkbox = el.children("i.checkbox");
							if(!checkbox.hasClass("selected") && !checkbox.attr("data-check")){
								checkbox.addClass("selected");
								checkbox.attr("data-check","1");
							}
							el.attr("data-default","1");
						}
					});
				}
			}

			
			
		},
		/**
		 * 构建url地址  添加额外的参数
		 */
		addExtraParams:function(url,params){
			if(url.indexOf("?") !== -1){
				url = url + "&" + jQuery.param(params);
			}else{
				url = url + "?" + jQuery.param(params);
			}
			return url;
		},
		/*
		 *	向页面中添加html
		 */
		appendHTML:function(receiveData,receiveData2,parentNode,context,init){
			parentNode.attr("data-loaded",1);
			var level = 1;
			if(!init){
				level = parseInt(parentNode.attr("data-tree-level"),10)+1;
			}
			if(context.options.selectable){
				if(parentNode.children("i.checkbox").is("i.selected")){
					parentNode.append(context.render({"orgs":receiveData,"level":level,"cameras":receiveData2,"init":init,"selected":"selected","selectable":context.options.selectable,"size":receiveData.length}));
				}else{
					parentNode.append(context.render({"orgs":receiveData,"level":level,"cameras":receiveData2,"init":init,"selected":"","selectable":context.options.selectable,"size":receiveData.length}));
				}
			}else{
				parentNode.append(context.render({"orgs":receiveData,"level":level,"cameras":receiveData2,"init":init,"selectable":context.options.selectable,"size":receiveData.length}));
			}
			if(this.options.selectable){
				this.selectEl();
			}

			context.updateScrollBar();
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

			if(parseInt(params.masterOrgId,10) === 0){
				url =  self.options.rootUrl;
				params = null;
				getRootFlag = true;
			}
			if(self.options.queryKey !== ""){
				params.name = self.options.queryKey;
				url =  self.options.searchUrl;
				requestType = "post";
			}

			// 如果是虚拟组织
			if(parentNode.attr("data-vid")){
				url = self.addExtraParams(url,{"vOrgId":parentNode.attr("data-vid")});
			}
			
			jQuery.ajax({
				url:url,
				type:requestType,
				data:params,
				dataType:'json', 
				setTimeout:60000,
				beforeSend:function(){
					parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
				},
				success:function(res){
					var receiveData =[],cameras;
					if(getRootFlag){
						if(res && res.code === 200){
							receiveData = res.data.orgList || []; 
							cameras = res.data.cameraList || [];
							if(receiveData.length === 0 && cameras.length ===0){
								parentNode.attr("data-loaded",1);
								parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
								self.updateScrollBar();
							}else{
								self.appendHTML(receiveData,cameras,parentNode,self,initFlag);
							}
						}

					}else{
						if(res && res.code === 200){
							receiveData = res.data.orgList || [];
							cameras = res.data.cameraList || [];
							if(receiveData.length === 0 && cameras.length ===0){
								parentNode.attr("data-loaded",1);
								parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
								self.updateScrollBar();
							}else{
								self.appendHTML(receiveData,cameras,parentNode,self,initFlag);
							}
						}
					}

					
				},
				error:function(){
					notify.warn("网络或服务器异常！");
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
								self.loadData({"masterOrgId":current.attr("data-id")},current,false);
							}else{
								self.toggle(current.children("ul"));
							}
						}
						current.toggleClass("active");
						return false;
					});

				}
			});
		}
	});



/**
 * 邮箱和群组的建议效果  (咱不使用 2014-12-02 )
 */
var AutoComplete = new Class({

	Implements: [Options, Events],

	options: {
		url: '/service/role/get_org_roles',
		delay: 200,
		captureLength: 0,
		selector: 'li',
		enter: true,
		parentSelector: "p",
		top: 0,
		left: 0,
		orgId:1,
		callback:jQuery.noop
	},

	initialize: function(options) {
		this.setOptions(options);

		this.node = jQuery(this.options.node);
		if (this.node.size() === 0) {
			return;
		}
		this.term = this.node.val().trim();
		this.cache = new Hash();
		this.panel = jQuery('<div class="suggest-panel"><ul class="result"></ul></div>').css({
			"top": this.options.top,
			"left": this.options.left,
			"position": "absolute"
		}).addClass(this.options.panelClass);
		this.node.closest(this.options.parentSelector).css("position", "relative").append(this.panel);
		this.bindEvents();
		this.hide();
	},

	getPanel: function() {
		return this.panel;
	},

	postProcessor: function(data) {
		return data.roles;
	},

	loadData: function(text) {
		if (!text || text.trim() === '') {
			return this.getPanel().hide();
		}

		// 查询缓存 如果缓存中有数据直接渲染
		var data = this.cache.get(text);
		if (data !== null) {
			this.assemble(data);
			return ;
			// return this.fireEvent(CommonEvents.SUCCESS, data);
		}

		// 开始请求
		var self = this;
		var entity = {
			roleName: text,
			orgId:self.options.orgId

		};

		if (this.options.c) {
			entity.c = this.options.c;
		}

		this.xmlhttp = jQuery.ajax({
			url: this.options.url,
			data: entity,
			dataType: 'json',
			cache: true,
			beforeSend: function() {
				if (self.xmlhttp) {
					self.xmlhttp.abort();
				}
				// self.xmlhttp && self.xmlhttp.abort();
			},
			success: function(res, status, xhr) {
				if (res && res.code === 200) {
					var data = self.postProcessor(res.data);
					self.cache.set(text, data);

					self.assemble(data);
					// self.fireEvent(CommonEvents.SUCCESS, data);
				}
			}
		});
	},

	// 获取菜单元素
	getItems: function() {
		return this.panel.find(this.options.selector);
	},

	// 装配数据
	renderItem: function(list) {
		var fragment = '',
			templateStr = this.options.c ?
				'<li data-id="{{ id }}" data-name="{{ name }}">{{ name }} {{ id }}</li>' :
				'<li data-id="{{ id }}" data-name="{{ name }}">{{ name }}</li>';
		var template = Handlebars.compile(templateStr);

		Array.from(list).each(function(data) {
			fragment += template(data);
		});
		return fragment;
	},

	// 显示查询结果
	assemble: function(data) {
		var box = this.panel.find('ul.result'),
			datal = Array.from(data);
		if (datal.length === 0) {
			box.html('');
			this.hide();
		} else {
			box.html(this.renderItem(datal));
			this.show();
		}
	},

	show: function() {
		if (this.panel.is(':hidden')) {
			this.panel.show();
			// this.fireEvent(CommonEvents.SHOW);
		}
	},

	hide: function() {
		if (this.panel.is(':visible')) {
			this.panel.hide();
			// this.fireEvent(CommonEvents.HIDE);
		}
	},

	suggest: function(text) {
		this.term = text || this.term;
		if (this.term) {
			this.node.val(this.term.trim());
			this.loadData(this.term);
		}
	},

	changeListener: function(opt) {

		var self = this,
			timer = null,
			node = this.node,
			panel = this.panel;

		// 检查是否需要触发回调
		var checkChange = function(override) {
			var text = node.val().trim();

			if (text.length >= self.options.captureLength && (override || text !== self.term)) {
				self.term = text;
				self.loadData(text);
			}
		};

		// 敲击事件和失焦事件
		node.keyup(function(e) {
			// 特殊键过滤
			if (panel.is(':visible')) {
				if (e.keyCode === 13 && self.options.enter) {
					var name = node.val().trim();

					self.getItems().each(function(index, domEle) {
						var value = jQuery(domEle).attr('data-name');
						if (name === value) {
							jQuery(domEle).addClass('active');
						}
					});

					var item = self.getItems().filter('.active');
					if (item.size() > 0 && !item.is('.invalid')) {
						self.hide();
						node.val(item.attr('data-name'));
						node.attr('data-name', item.attr('data-name'));
						node.attr('data-id', item.attr('data-id'));

						self.term = '';
						// return self.fireEvent(CommonEvents.SELECT, item, item.dataset());
					}
				}
				if (e.keyCode === 40 || e.keyCode === 38) {
					return;
				}
			}

			// 检查是否加载建议信息
			clearTimeout(timer);
			timer = setTimeout(checkChange, self.options.delay);
		});
	},

	directionListener: function() {
		var self = this,
			node = this.node,
			panel = this.panel;

		node.bind('keydown', function(e) {
			var code = e.keyCode;

			if ((code === 40 || code === 38)) {
				if (panel.is(':visible')) {
					var list = self.getItems();

					if (list.length === 0) {
						return;
					}

					var item = null,
						lastItem = list.filter('.active').removeClass('active'),
						lastIndex = list.index(lastItem);

					if (code === 40) {
						var index = lastIndex + 1;
						if (index >= list.length) {
							node.val(self.term);
						} else {
							item = list.eq(index);
						}
					} else if (code === 38) {
						var index1 = lastIndex - 1;
						if (index1 === -1) {
							node.val(self.term);
						} else {
							if (index1 === -2) {
								index1 = list.length - 1;
							} else {
								item = list.eq(index1);
							}
						}
					}

					// 如果是上下选择
					if (item) {
						item.addClass('active');
						node.val(item.attr('data-name'));
					}
				} else if (self.panel.find(self.options.selector).size() > 0) {
					self.show();
				}

				// 这句是因为Chrome下面会移动光标到文本开头
				e.preventDefault();
			}
		});
	},

	bindEvents: function() {

		// HOVER激活状态
		var self = this,
			node = this.node,
			panel = this.panel,
			timer = timer;

		panel.on('mouseenter', this.options.selector, function() {
			jQuery(this).addClass('active').siblings().removeClass('active');
		});
		panel.on('mouseleave', this.options.selector, function() {
			jQuery(this).removeClass('active');
		});
		panel.on('click', this.options.selector, function(e) {
			var item = jQuery(this);
			if (item.is('.invalid')) {
				node.focus();
				return false;
			}

			item.addClass('active').siblings().removeClass('active');

			node.val(item.attr('data-name'));
			node.attr('data-name', item.attr('data-name'));
			node.attr('data-id', item.attr('data-id'));
			node.focus();

			// 根据id获取角色功能列表
			self.options.callback(item.attr('data-id'));

			self.hide();
			self.term = '';
			// self.fireEvent(CommonEvents.SELECT, item, item.dataset());
			return false;
		});

		var hidePanel = this.hide.bind(this);

		panel.on('mouseenter', function() {
			node.unbind('blur', hidePanel);
		});
		panel.on('mouseleave', function() {
			node.bind('blur', hidePanel);
		});

		node.bind('click', Toolkit.cancelBubble);
		jQuery(document).bind('click', hidePanel);

		// 监听文本改变
		this.changeListener();

		// 监听上下选择
		this.directionListener();
	}
});



/**
* 表格树
**/
var GridTree = new Class({
	Implements: [Events, Options],
	options: {
		cameraIndex: 0,
		thUrl: "/service/resource/get_user_camera_operation",//表头
		rootUrl: "/service/resource/get_root_camera?isRoot="+ window.sysConfig.getResMode(),//根节点
		childUrlAdd: "/service/resource/get_camera_for_modify_permission_add",//子节点
		childUrlEdit: "/service/resource/get_camera_for_modify_permission_edit",//子节点
		childUrlDetail: "/service/resource/get_camera_for_modify_permission_get",//子节点
		templateUrl:"/module/settings/common/tool/grid-tree.html",
		treeType: "add",//表格树状态：add/添加；edit/编辑；vide/查看；
		container: '#treeGrid',
		masterOrgId:"0",	//用户当前所在部门的id
		mode: "add",//add:添加，edit:修改，detail:查看
		cameraResourceMedifyList: [],//修改后的监控点权限ID列表
		flag:0,   // 数据为空 [0 未微调  1 已微调 ]
		template:null
	},
	initialize: function(options) {
		var self = this;
		self.setOptions(options);
		self.registerHelper();

		jQuery.get(self.options.templateUrl,function(data){
			self.options.template = Handlebars.compile(data);

			self.setTh();
			self.setRoot();
		});
	},
	//请求封装
	ajaxFun: function(url,params,container){
		var result = null;
		jQuery.ajax({
			url:url,
			type:"post",
			data:params,
			dataType:'json', 
			async:false,
			beforeSend:function(){
				if(container){
					container.append("<div id='loading' class='no-data'><i class='loading-img'/></i>正在加载…</div>");
				}
			},
			success:function(res){
				result = res;
			},
			complete:function(){
				if(container){
					container.find("#loading").remove();
				}
			},
			error:function(){
				notify.warn("网络或服务器异常！");
			}
		});
		return result;
	},
	//获取表头数据
	getThData: function(){
		this.thData = this.ajaxFun(this.options.thUrl,{"masterOrgId":this.options.masterOrgId});
	},
	//设置表头
	setTh: function(){
		this.getThData();
		var ThData = this.thData;
		if(ThData.data.operationList.length>0){
			ThData.data.mode = this.options.mode;
			jQuery(this.options.container).empty().html(this.options.template({"tableHead":ThData.data}));
			jQuery(".treegrid-head .table-head table,.treegrid-body .table-body table,.table-scroll table").width(ThData.data.operationList.length*90+"px");
		
			// 绑定滚动事件
			jQuery(".table-scroll").scroll(function(){
				jQuery(".treegrid-container .treegrid-head .table-head").scrollLeft(this.scrollLeft);
				jQuery(".treegrid-body .treegrid-body-panel .table-body").scrollLeft(this.scrollLeft);				
			});
		}
	},
	//获取根节点数据
	getRootData: function(){
		return this.ajaxFun(this.options.rootUrl,{
			"masterOrgId":this.options.masterOrgId,
			"flag":this.options.flag
		});
	},
	//设置根节点
	setRoot: function(){
		var RootData = this.getRootData();
		var ThData = this.thData;
		if(RootData.data.orgList.length>0){
			for(var i=0,j=RootData.data.orgList.length;i<j;i++){
				RootData.data.orgList[i].level = "0-"+i;
				RootData.data.orgList[i].OperationList = ThData.data.operationList;
				RootData.data.orgList[i].mode = this.options.mode;
			}
			jQuery(".treegrid-body .treegrid-body-panel .tree-body table").empty().html(this.options.template({"treeRoot":RootData.data}));
			this.setGridData(RootData.data);
		}
		this.bindEvent(0);
	},
	//获取子节点数据
	getChildData: function(orgId,container){
		if(this.options.mode === 'add'){
			return this.ajaxFun(this.options.childUrlAdd,{
				"orgId":orgId,
				"masterOrgId":this.options.masterOrgId,
				"flag":this.options.flag
			},container);
		}
		if(this.options.mode === 'edit'){
			return this.ajaxFun(this.options.childUrlEdit,{
				"orgId":orgId,
				"userId":this.options.userId
			},container);
		}
		if(this.options.mode === 'detail'){
			return this.ajaxFun(this.options.childUrlDetail,{
				"orgId":orgId,
				"userId":this.options.userId
			},container);
		}
	},
	//设置子节点
	setChild: function(obj){
		var self = this;
		var parentTr = obj.closest("tr");
		var parentId = parentTr.attr("parent_id"),orgId = parentTr.attr("orgId");
		var url,params,container = parentTr.find("div.tree-item");
		if(this.options.mode === 'add'){
			url = this.options.childUrlAdd;
			params = {
				"orgId":orgId,
				"masterOrgId":this.options.masterOrgId,
				"flag":this.options.flag
			};
		}
		if(this.options.mode === 'edit'){
			url = this.options.childUrlEdit;
			params = {
				"orgId":orgId,
				"userId":this.options.userId
			};		}
		if(this.options.mode === 'detail'){
			url = this.options.childUrlDetail;
			params = {
				"orgId":orgId,
				"userId":this.options.userId
			};
		}
		jQuery.ajax({
			url:url,
			type:"post",
			data:params,
			dataType:'json', 
			beforeSend:function(){
				if(container){
					container.append("<div id='loading' class='no-data'><i class='loading-img'/></i>正在加载…</div>");
				}
			},
			success:function(res){
				var ThData = self.thData;
				var ChildData = res;

				if((parentId+"").split("-").length>7){
					notify.warn("暂时只支持7级及以下");
					return;
				}
				ChildData.data.OperationList = ThData.data.operationList;
				//组织资源列表
				if(ChildData.data.orgList.length>0){
					for(var i=0,j=ChildData.data.orgList.length;i<j;i++){
						ChildData.data.orgList[i].mode = self.options.mode;
						ChildData.data.orgList[i].level = parentId+"-"+(i+1);
					}
				}

				//监控点列表
				if(ChildData.data.cameraList.length>0){
					for(var m=0,n=ChildData.data.cameraList.length;m<n;m++){
						ChildData.data.cameraList[m].level = parentId+"-"+(ChildData.data.orgList.length+m+1);
						ChildData.data.cameraList[m].cameraIndex = self.options.cameraIndex+1;
						ChildData.data.cameraList[m].mode = self.options.mode;
						self.options.cameraIndex++;
					}
				}

				ChildData.data.mode = self.options.mode;
				obj.closest("tr").after(self.options.template({"treeChild":ChildData.data}));
				//设置表格数据
				self.setGridData(ChildData.data,jQuery(".table-body table tr[parent_id="+parentId+"]"));
				self.bindEvent(parentId);
			},
			complete:function(){
				if(container){
					container.find("#loading").remove();
				}
			},
			error:function(){
				notify.warn("网络或服务器异常！");
			}
		});
		
	},
	setGridData: function(data,parentTr){
		var self = this;
		if(parentTr){
			parentTr.after(self.options.template({"treeTable":data}));
		}else{
			jQuery(".table-body table").append(self.options.template({"treeTable":data}));
		}
	},
	getChangedTds: function(){
		return this.options.cameraResourceMedifyList;
	},
	resetCameraResourceMedifyList: function(data){
		var flag = false;
		var cameraList = this.options.cameraResourceMedifyList;
		for(var i=0,j=cameraList.length;i<j;i++){
			if(cameraList[i].cameraId === data.cameraId){
				cameraList.splice(i,1,data);
				flag = true;
				break;
			}
		}
		if(!flag){
			cameraList.push(data);
		}
	},
	//注册Helper
	registerHelper: function(){
		var self = this;
		//根据父亲ID获取当前级别
		Handlebars.registerHelper("data-level", function(parent_id) {
			if(parent_id+""){
				var levelArray = (parent_id+"").split("-");
				return levelArray.length-2;
			}
		});
		//判断当前行的奇偶性
		Handlebars.registerHelper("evenOrOdd", function(cameraIndex){
			if(cameraIndex%2 === 0){
				return "even";
			}
			return "odd";
		});
		//判断是否是某模式
		Handlebars.registerHelper("isXMode", function(mode,value,options){
			if(mode === value){
				return options.fn();
			}
		});
		//添加表头时判断模式
		Handlebars.registerHelper("ModeOnTh", function(mode,value,data,options){
			if(mode === value){
				return options.fn({"operationList":data});
			}
		});
		//添加表格内容时判断模式
		Handlebars.registerHelper("ModeOnTd", function(mode,value,data,options){
			if(mode === value){
				return options.fn({"cameraList":data});
			}
		});
		//编辑时默认选中复选框
		Handlebars.registerHelper("EditCheckedBox", function(operationList,operationIdList,mode,options){
			var optionIds = [];
			if(operationIdList){
				optionIds = operationIdList.split(",");
			}
			var str = "";
			for(var i=0;i<operationList.length;i++){
				var flag = false;
				for(var j=0;j<optionIds.length;j++){
					if(optionIds[j] === operationList[i].id){
						if(mode === 'edit'){
							str += '<td><i class="checkbox checked" operation_id="'+operationList[i].id+'"></i></td>';
						}else{
							str += '<td><i class="checked_detail"></i></td>';
						}
						flag = true;
						break;
					}
				}
				if(!flag){
					if(mode === 'edit'){
						str += '<td><i class="checkbox" operation_id="'+operationList[i].id+'"></i></td>';
					}else{
						str += '<td><i class="no">no</i></td>';
					}
				}
			}
			return str;
		});
	},
	bindEvent: function(parentId){
		var self = this;
		var clickTarget = jQuery(".treegrid-body .treegrid-body-panel .tree-body table tr[parent_id^="+parentId+"-] .tree-item .folder");
		clickTarget.on("click", function(){
			var This = jQuery(this);
			var parentId = This.closest("tr").attr("parent_id");
			//点击效果
			if(This.hasClass("open")){
				jQuery(".tree-body table tr[parent_id^="+parentId+"-]").each(function(){
					jQuery(this).hide();
				});

				jQuery(".table-body table tr[parent_id^="+parentId+"-]").each(function(){
					jQuery(this).hide();
				});
				This.removeClass("open").addClass("close");
				This.parent().find(".icon").removeClass("active");
				jQuery('#loading').remove();
			}else if(This.hasClass("close")){
				jQuery(".tree-body table tr[parent_id^="+parentId+"-]").each(function(){
					jQuery(this).show();
				});
				jQuery(".table-body table tr[parent_id^="+parentId+"-]").each(function(){
					jQuery(this).show();
				});
				This.removeClass("close").addClass("open");
				This.parent().find(".icon").addClass("active");
			}
			//加载子节点
			if(jQuery(this).parent().hasClass(".loaded")){
				return;
			}
			self.setChild(jQuery(this));
			This.parent().addClass(".loaded");
		});
		//点击复选框
		var checkboxClickTarget = jQuery(".treegrid-body .treegrid-body-panel .table-body tr[parent_id^="+parentId+"-] td i.checkbox");
		checkboxClickTarget.on("click",function(){
		var This = jQuery(this);
		if(This.hasClass("checked")){
			This.removeClass("checked");
		}else{
			This.addClass("checked");
		}
		var cameraId = This.closest("tr").attr("camera_id");
		var operationIdList = "";
		This.closest("tr").find("td").each(function(){
			var ThisCheckbox = jQuery(this).find("i");
			if(ThisCheckbox.hasClass("checked")){
				if(operationIdList){
					operationIdList += ","+ThisCheckbox.attr("operation_id");
				}else{
					operationIdList += ThisCheckbox.attr("operation_id");
				}
			}
		});
		var changeResult = '{"cameraId":"'+cameraId+'","operationIdList":"'+operationIdList+'"}';
		//重置监控点权限列表
		self.resetCameraResourceMedifyList(JSON.parse(changeResult));
		});
		//鼠标悬浮效果
		var hoverTreeTarget = jQuery(".treegrid-body .treegrid-body-panel .tree-body table tr.even,.treegrid-body .treegrid-body-panel .tree-body table tr.odd");
		hoverTreeTarget.on("mouseover", function(){
			var cameraIndex = jQuery(this).attr("data_id");
			jQuery(".table-body table tr[data_id="+cameraIndex+"]").css("background-color","#DCE3ED");
			jQuery(this).css("background-color","#DCE3ED");
		});
		hoverTreeTarget.on("mouseout", function(){
			var cameraIndex = jQuery(this).attr("data_id");
			jQuery(".table-body table tr[data_id="+cameraIndex+"]").css("background-color","");
			jQuery(this).css("background-color","");
		});
		var hoverTableTarget = jQuery(".table-body tr.even,.table-body tr.odd");
		hoverTableTarget.on("mouseover", function(){
			var cameraIndex = jQuery(this).attr("data_id");
			jQuery(".tree-body table tr[data_id="+cameraIndex+"]").css("background-color","#DCE3ED");
			jQuery(this).css("background-color","#DCE3ED");
		});
		hoverTableTarget.on("mouseout", function(){
			var cameraIndex = jQuery(this).attr("data_id");
			jQuery(".tree-body table tr[data_id="+cameraIndex+"]").css("background-color","");
			jQuery(this).css("background-color","");
		});
	}
});


// 布防管理组织结构树
var DefenceMgrTree = new Class({
	Implements: [Events, Options],
	options: {
		url:"/service/org/get_child_orgs_by_parent?"+ window.sysConfig.getOrgMode(),	//根据父组织获取子组织
		rootUrl:"/service/org/get_root_org?" + window.sysConfig.getOrgMode(),			//获取根组织
		searchUrl:"/service/org/get_child_orgs_by_name",	//根据组织名搜索
		templateUrl:"/inc/settings/defenceMgrOrg.html",
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
		thumbSize:72
	},
	initialize: function(options) {
		this.setOptions(options);
		// scrollbar 默认scroll容器的类名为 scrollbarPanel
		var tem = this.options;
		tem.scrollbar = jQuery(tem.node).empty().closest("div"+ tem.scrollbarNode);
		tem.scrollbar.tinyscrollbar({thumbSize : tem.thumbSize});
		jQuery(this.options.node).empty();
		if(tem.orgId && tem.orgId !=="null"){
			this.getOrgPathList(tem.orgId);
		}
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
			if (orgId == childs[i]) {
				result = true;
				break;
			}
		}
		return result;

	},
	// 获取当前组织路径  顶级>上级>当前
	getOrgPathList:function(currentOrgId){
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
		/*如果没有设置布防路数，则不显示路数*/
		Handlebars.registerHelper("SetLimit", function(count, options) {
			if(count !== -1){
				return options.fn(this);
			}
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
			parent.children("ul").html("");
			parent.removeClass("active");
			parent.removeAttr("data-loaded");
			parent.children("i.fold").click();

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
		}
		this.updateScrollBar();
	},
	render:function(data){
		return this.options.template(data);
	},
	/*
	 *	判断用户权限	@curOrgId：用户当前组织id	@orgId:操作的组织id
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
	updateScrollBar:function(){
		this.options.scrollbar.tinyscrollbar_update('relative');
	},
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

		// 叶子节点前的图片点击事件
		parentNode.find("ul li.leaf i.leaf").on("click",function(event){
			// 直接调用span的点击事件
			self.processLeafClick(jQuery(this).closest("li").children("span"));
			return false;
		});

		// 自动展开   手动展开暂时去掉 self.options.callback(target);

		// 自动展开当前部门
		self.autoExpand();

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
		this.updateScrollBar();
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
		context.updateScrollBar();
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
			params.source = "defence";

		if(params.parentId === 0){
			url =  self.options.rootUrl;
			params = {};
			params.source = "defence";
			getRootFlag = true;
		}
		if(self.options.queryKey !== ""){
			params.name = self.options.queryKey;
			url =  self.options.searchUrl;
			requestType = "post";
			self.options.queryKey = "";
		}

		jQuery.ajax({
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
						//self.appendHTML(receiveData,parentNode,self,initFlag);
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


			},
			error:function(){
				notify.warn("网络或服务器异常！");
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

			}
		});
	}
});

var RoleTable = new Class({
	Implements: [Events, Options],
	options: {
		getRolesUrl: "/service/role/get_org_roles",
		getRoleFuncUrl:"/service/role/get_role_function",
		getRoleFuncsUrl:"/service/resource/get_function_pemission",
		orgId: 1,
		mode:"role",
		node: "#createRole #roleTable",
		colNumber: 3,
		funcs:null
	},
	initialize: function(options) {
		this.setOptions(options);
		this.loadData();
	},
	/*
	*	初始化加载数据 获取功能列表
	*/	
	loadData: function() {
		var self = this;
		jQuery.ajax({
			url: self.options.getRoleFuncsUrl,
			method: "get",
			dataType: "json",
			data: {},
			success: function(res) {
				if (res.code === 200 && res.data.systemFunctionOrganizationList) {

					jQuery(self.options.node).empty().html(self.assembleTable(res.data.systemFunctionOrganizationList));
					
					// 拿掉云空间前的checkbox
					jQuery(self.options.node).find("input[data-name*='云空间']").before('<i class="role-check"></i>');
					jQuery(self.options.node).find("input[data-name*='云空间']").remove();
					// jQuery(self.options.node).find("input[data-name*='云空间']").css("opacity",0);

					self.bindEvent();

					if(self.options.mode === "roleDetail"){
						// 默认将全部功能置灰
						jQuery(self.options.node).find("td span").css("opacity",0.5);
						jQuery(self.options.node).find("td input").unbind('click').click(function(event) {
							return false;
						});	
					}

					// 暂不使用
					if(self.options.mode === "userDetail"){
						// 默认将全部功能置灰
						jQuery(self.options.node).find("td span").css("opacity",0.5);
						self.updateUserRole();
					}

					// 编辑角色 或者详情页
					if(self.options.roleId){
						self.getRoleFunc(self.options.roleId);
					}

					// 创建角色
					if(self.options.mode === "role"){
						self.getRoles(self.options.orgId);
						// 将不拥有的全部功能权限置灰
						self.setPermission();
					}
					
				} else {
					notify.warn("网络或服务器异常！");
				}
			}
		});
	},
	/**
	 * hasPermission 判断用户的功能权限
	 * @author chencheng
	 * @date   2014-10-27
	 * @param  {string}   type       ["tree" ,"leaf"]
	 * @param  {[string]}   id         node上元素的id属性值
	 * @param  {[object]}   permission 用户拥有的权限信息
	 * @return {Boolean}             
	 */
	hasPermission:function(type,id,permission){
		var orgs = permission.validFunctionOrgList ? permission.validFunctionOrgList:[];
		var funcs = permission.validFunctionResourceList ? permission.validFunctionResourceList: [];

		var flag = false;
		if(type === "tree"){
			for(var i = 0;i<orgs.length;i++){
				if(orgs[i].id == id){
					flag = true;
					break;
				}
			}
		}

		if(type === "leaf"){
			for(var j = 0;j<funcs.length;j++){
				if(funcs[j].id == id){
					flag = true;
					break;
				}
			}
		}

		return flag ;
	
	},
	setPermission:function(){
		var self =  this;
		var p = JSON.parse(window.localStorage.getItem("sPermissionList")).data;

		var modules = jQuery(this.options.node).find("tbody:not(.head)");
		for(var i=0;i<modules.length;i++){
			var module = jQuery(modules[i]);

			module.find("span:not(.diable) input").each(function(index, val) {
				var el = jQuery(val);
				if(!self.hasPermission(el.attr("data-type"),el.attr("data-id"),p)){
					// el.closest('span').addClass('disable');
					el.closest('span').prepend('<i class="role-check"></i>').addClass('disable').find("input").remove();
				}
			});
		}

	},
	//	回显用户拥有的功能权限
	updateUserRole:function(list){

		var obj = {funcs:[],funcOrgs:[]};

		// 遍历第一级节点
		for(var i=0;i<list.length;i++){
			// 第一级节点
			obj.funcOrgs.push({"resourceOrganizationId":list[i].id,name:list[i].name});
			
			if(list[i].systemFunctionOrganizationList && list[i].systemFunctionOrganizationList.length>0){
				var sFuncs = list[i].systemFunctionOrganizationList;

				// 第二级父节点
				for(var k=0;k<sFuncs.length;k++){
					obj.funcOrgs.push({"resourceOrganizationId":sFuncs[k].id,name:sFuncs[k].name});

					// 三级级子功能
					var tfuncs = sFuncs[k].systemFunctionList
					for(var m=0;m<tfuncs.length;m++){
						obj.funcs.push({"resourceId":tfuncs[m].id,name:tfuncs[m].name});
					}
					
				}	

			}

			// 二级子功能
			var funcs = list[i].systemFunctionList
			for(var j=0;j<funcs.length;j++){
				obj.funcs.push({"resourceId":funcs[j].id,name:funcs[j].name});
			}
			
		}

		this.update(obj);
	},
	/*
	*	根据组织id获取该角色列表
	*/
	getRoles:function(orgId){
		var self = this;
		jQuery.getJSON(self.options.getRolesUrl+"?orgId="+orgId+"&userId="+jQuery("#userEntry").attr("data-userid"),function (res) {
			if(res.code === 200 && res.data.roles ){
				var roles = res.data.roles;
				var fregment = "<option value=''>选择角色复制权限</option>";
				for(var i = roles.length-1;i >=0 ;i--){
					fregment += "<option value='"+roles[i].id+"'>"+roles[i].name+"</option>";
				}
				var selectEl = jQuery(self.options.node).find("#selectRole");
				selectEl.html(fregment);

				selectEl.unbind("change");
				selectEl.bind("change",function() {
					var roleId = jQuery(this).find("option:selected").val();
					if(roleId !== ""){
						self.getRoleFunc(roleId);
					} else {
						jQuery("#roleTable input").attr("checked", false);
					}
				});
				
			}else{
				notify.warn("网络或服务器异常！");
			}
		});
	},
	/*
	*	根据角色id获取该角色的功能权限
	*/
	getRoleFunc:function(id){
		var self = this;
		jQuery.ajax({
			url: self.options.getRoleFuncUrl,
			method: "get",
			dataType: "json",
			data: {"id":id},
			success: function(res) {
				if (res.code === 200 && res.data.role.roleResourceAccessRules && res.data.role.roleResourceOrganizationAccessRules) {
					self.update({"funcs":res.data.role.roleResourceAccessRules,"funcOrgs":res.data.role.roleResourceOrganizationAccessRules});
				} else {
					notify.warn("网络或服务器异常！");
				}
			}
		});
	},
	/*
	*	创建表头
	*/ 
	createHead: function() {
		var head = "<tbody class='head'><tr><td><span><input id='checkAll' type='checkbox'/><label for='checkAll'>全选</label></span></td><td></td>";
		head += "<td class='align-right'><select id='selectRole' onselectstart='return false;'></select></td></tr></tbody>";
		return head;
	},
	/*
	*	根据数据组装table
	*/
	assembleTable: function(arr) {
		var self = this;
		var rows1 = arr;

		var tableHtml = "<table>";
		if(self.options.mode === "role"){
			tableHtml += self.createHead();
		}
		// 处理第一级
		for (var i = 0; i < rows1.length; i++) {
			var fregment = "<tbody>";

			// 初始化第一行
			var initFirstTr = false;
			
			var rows2 = rows1[i].systemFunctionOrganizationList ;
			var funcs = rows1[i].systemFunctionList ;

			var rowspan = rows2.length ;

			// 第一列内容
			var td1 = '<td rowspan="'+rowspan+'" class="has-child col1"><span><input data-type="tree" data-name="'+rows1[i].name+'" data-id="'+rows1[i].id+'" id="lvl1_'+rows1[i].id+'" data-parentid="lvl0_'+rows1[i].masterOrgId+'" type="checkbox"/><label data-name="'+rows1[i].name+'" for="lvl1_'+rows1[i].id+'">'+rows1[i].name+'</label></span></td>';

			if (funcs.length > 0) {
				var funcTr = '<tr>';
				// 如果第二级含有功能子节点 那么只占一行
				rowspan ++;
				td1 =  td1 = '<td rowspan="'+rowspan+'" class="has-child col1"><span><input data-name="'+rows1[i].name+'" data-type="tree" data-id="'+rows1[i].id+'" id="lvl1_'+rows1[i].id+'" data-parentid="lvl0_'+rows1[i].masterOrgId+'" type="checkbox"/><label data-name="'+rows1[i].name+'" for="lvl1_'+rows1[i].id+'">'+rows1[i].name+'</label></span></td>';
				if(!initFirstTr){
					funcTr += td1;
					initFirstTr = true;
				}
				funcTr +='<td colspan="2" class="col3">';
				for(var k=0;k<funcs.length;k++){
					funcTr += '<span><input data-name="'+funcs[k].name+'"  type="checkbox" data-type="leaf" data-parentid="lvl1_'+funcs[k].orgId+'" data-id="'+funcs[k].id+'" id="lvl2_'+funcs[k].id+'"/><label data-name="'+funcs[k].name+'" for="lvl2_'+funcs[k].id+'">'+funcs[k].name+'</label></span>'
				}
				funcTr += '</td></tr>';

				fregment +=	funcTr;
			}

			// 当前还有下级节点
			for(var j = 0;j<rows2.length;j++){
				var orgsTr ='<tr>'
				// 第三级 无org节点
				// var row3 = rows1[i][j].systemFunctionOrganizationList.length ;
				if(!initFirstTr){
					orgsTr += td1;
					initFirstTr = true;
				}
				orgsTr += '<td class="has-child col2"><span><input data-name="'+rows2[j].name+'" data-type="tree" type="checkbox" data-parentid="lvl1_'+rows2[j].masterOrgId+'" data-id="'+rows2[j].id+'" id="lvl2_'+rows2[j].id+'"/><label data-name="'+rows2[j].name+'" for="lvl2_'+rows2[j].id+'">'+rows2[j].name+'</label></span></td>';
				var subFuncs = rows2[j].systemFunctionList ;
				
				// 构建第三级数据
				orgsTr +='<td>';
				for(var m=0;m<subFuncs.length;m++){
					orgsTr += '<span><input data-name="'+subFuncs[m]+'" data-type="leaf" type="checkbox" data-parentid="lvl2_'+subFuncs[m].orgId+'"  data-id="'+subFuncs[m].id+'" id="lvl3_'+subFuncs[m].id+'"/><label data-name="'+subFuncs[m]+'" for="lvl3_'+subFuncs[m].id+'">'+subFuncs[m].name+'</label></span>'
				}
				orgsTr += "</td></tr>";	

				fregment +=	orgsTr;
				
			}
			fregment += '</tbody>';
		
			tableHtml += fregment;
		}
		tableHtml+= '</table>'

		return tableHtml;

	},
	// 勾选向上级联动
	linkageUp:function(el,context){
		if(el.length === 0){
			return ;
		}
		var self = context;
		var container = jQuery(self.options.node);
		var checkAll = container.find("#checkAll");

		// 第一级
		if(el.attr("id").indexOf("lvl1_") !== -1 ){
			var sibings = container.find("input[data-parentid='"+el.attr("data-parentid")+"']").filter('[data-type="tree"]');
			var checkFlag = true;
			sibings.each(function(index,item){
				if(!jQuery(item).prop("checked")){
					checkFlag = false;
				}
			});		
			checkAll.prop("checked",checkFlag);

		}

		// 第二级
		if(el.attr("id").indexOf("lvl2_") !== -1 ){
			var sibings = el.closest('tbody').find("input[data-parentid='"+el.attr("data-parentid")+"']");
			var checkFlag = true;
			sibings.each(function(index,item){
				if(!jQuery(item).prop("checked")){
					checkFlag = false;
				}
			});
			var parent = container.find("input[id='"+el.attr("data-parentid")+"']").filter('[data-type="tree"]');
			parent.prop("checked",checkFlag);
			arguments.callee(parent,self);

		}

		// 第三级
		if(el.attr("id").indexOf("lvl3_") !== -1 ){
			var sibings = el.closest('tbody').find("input[data-parentid='"+el.attr("data-parentid")+"']");
			var checkFlag = true;
			sibings.each(function(index,item){
				if(!jQuery(item).prop("checked")){
					checkFlag = false;
				}
			});
			var parent = container.find("input[id='"+el.attr("data-parentid")+"']").filter('[data-type="tree"]');
			parent.prop("checked",checkFlag);
			arguments.callee(parent,self);

		}

		// 由于角色功能继承 云空间没有复选框 对全选复选框勾选有所影响 最后再检测一次
		var allFuncEls = container.find('tbody:not(.head) input');
		var allFlag = true;
		allFuncEls.each(function(index,item){
			if(!jQuery(item).prop("checked")){
				allFlag = false;
			}
		});
		checkAll.prop("checked",allFlag);
		
	},
	/*
	 *	绑定事件
	 */
	bindEvent: function() {
		var self = this,
			container = jQuery(self.options.node),
			checkAll = container.find("#checkAll");
			
		var func1 = jQuery(self.options.node).find("input[id^='lvl1_']");
		var func2 = jQuery(self.options.node).find("input[id^='lvl2_']");
		var func3 = jQuery(self.options.node).find("input[id^='lvl3_']");

		// 第三级功能权限点击事件
		func3.unbind("click");
		func3.bind('click', function(event) {
			var el = jQuery(this);
			self.linkageUp(el,self);
		});

		// 第二级功能权限点击事件
		func2.unbind("click");
		func2.bind('click', function(event) {
			var el = jQuery(this);
			var childs = el.closest('tbody').find("input[data-parentid='"+el.attr("id")+"']");
			childs.each(function(index,item){
				var child = jQuery(item);
				if(el.prop("checked")){
					child.prop("checked",true);
				}else{
					child.prop("checked",false);
				}

				var childrens = container.find("input[data-parentid='"+child.attr("id")+"']");
				childrens.each(function(index,item){
					jQuery(this).prop("checked",el.prop("checked"));
				});
			});
			self.linkageUp(el,self);
		});
		// 第一级功能权限点击事件
		func1.unbind("click");
		func1.bind('click', function(event) {
			var el = jQuery(this);
			// 向下联动
			var childs = el.closest('tbody').find("input[data-parentid='"+el.attr("id")+"']");
			childs.each(function(index,item){
				var child = jQuery(item);
				if(el.prop("checked")){
					child.prop("checked",true);
				}else{
					child.prop("checked",false);
				}

				var childrens = container.find("input[data-parentid='"+child.attr("id")+"']");
				childrens.each(function(index,item){
					jQuery(this).prop("checked",el.prop("checked"));
				});

				// 选择视图库时 图像研判默认选中 201/07/01
	            setTimeout(function(){
	                if(!checkAll.is(":checked")){
	                    var text  = el.siblings("label").text(),
	                        label = $("#roleTable label:contains('图像研判')");
	                    if(text === '视图库'){
	                        if(!label.siblings("input").is(":checked")){
	                            label.siblings("input").trigger("click");
	                        }
	                    }
	                }
	            },100);

			});
			self.linkageUp(el,self);

		});

		// 全选按钮点击事件
		checkAll.unbind("click");
		checkAll.bind("click",function(){
			var all = jQuery(this);

			if(!all.prop("checked")){
				container.find("input").prop("checked",false);
			}else{
				container.find("input").prop("checked",true);
			}
		});

	},
	/*
	*	根据角色 回显功能列表 {funcs:[],funcOrgs:[]}    修改 10.23   [目前只按两级做]
	*/
	update:function(obj){
		var self = this;
		var container = jQuery(this.options.node);
		var checkAll = container.find("#checkAll");
		container.find("input:checkbox").prop("checked",false);

		var funcsArr = obj.funcs;
			funcOrgsArr = obj.funcOrgs;

		for(var i= funcOrgsArr.length-1;i>=0;i--){
			var p = container.find('[data-type="tree"]').filter("input[data-id='"+funcOrgsArr[i].resourceOrganizationId+"']");
			// 勾选 去掉置灰
			p.prop("checked",true).closest('span').css("opacity",1);
			// 若父元素勾选  也将其子元素勾选
			p.each(function(index, item) {
				var org = jQuery(item);
				// 将二级子节点 勾选 去掉置灰
				org.closest("tbody").find("input[data-parentid='lvl1_"+org.attr("data-id")+"']").prop("checked",true).closest('span').css("opacity",1);
			});
				
			
		}

		for(var j= funcsArr.length-1;j>=0;j--){
			var c = container.find('[data-type="leaf"]').filter("input[data-id='"+funcsArr[j].resourceId+"']");
			c.prop("checked",true).closest('span').css("opacity",1);

			if(self.options.mode === "roleDetail"){
				// 显示上级节点   角色详情如果只有某个子元素勾选  那么也勾选父元素[主要用于显示那种]
				c.each(function(index,item){
					var that = jQuery(item);
						that.closest("tbody").find('[data-type="tree"]').filter("input[id='"+that.attr("data-parentid")+"']").prop("checked",true).closest('span').css("opacity",1);
					
				});
			}
		}

		// 如果roleTable 中全部的input都勾选了，那么将全选勾上
		var allFuncEls = container.find('tbody:not(.head) input');
		var allFlag = true;
		allFuncEls.each(function(index,item){
			if(!jQuery(item).prop("checked")){
				allFlag = false;
			}
		});
		checkAll.prop("checked",allFlag);

		// this.updateParentStatus();
	},
	
	/*
	*	输出勾选项的相关数据 [10.23 bak  修改：父元素勾 选传父元素就ok]
	*/
	getArrData1:function(){
		var funcs = [],
			funcParents = [];

		var modules = jQuery(this.options.node).find("tbody:not(.head)");
		for(var i=0;i<modules.length;i++){
			var module = jQuery(modules[i]);

			module.find("input:checked").each(function(index, val) {
				 var el = jQuery(val);
				 if(el.attr("data-type") ==="tree"){
				 	funcParents.push({"functionOrgId":el.attr("data-id")});
				 }else{
				 	funcs.push({"functionId":el.attr("data-id")});
				 }
			});


			// var func1 = module.find("input[id^='lvl1_']").filter("[data-type='tree']");
			// if(func1.prop("checked")){
			// 	funcParents.push({"functionOrgId":func1.attr("data-id")});
			// 	continue;
			// }

			// var func2 = module.find("input[data-parentid='"+func1.attr("id")+"']");
			// func2.each(function(index,item){
			// 	var el = jQuery(item);
			// 	// 第二级 是子节点
			// 	if(el.attr("data-type") ==="leaf" && el.prop("checked")){
			// 		funcs.push({"functionId":el.attr("data-id")});
			// 	}
			// 	// 第二级被勾选
			// 	if(el.attr("data-type") ==="tree" && el.prop("checked")){
			// 		funcParents.push({"functionOrgId":el.attr("data-id")});
			// 	}
			// 	// 第二级被勾选 未被勾选 取第三级数据
			// 	if(el.attr("data-type") ==="tree" && !el.prop("checked")){
			// 		var childs = module.find("input[data-parentid='"+el.attr("id")+"']");

			// 		childs.each(function(index,item){
			// 			var child = jQuery(item);
			// 			if(child.prop("checked")){
			// 				funcs.push({"functionId":child.attr("data-id")});
			// 			}

			// 		});
			// 	}
				
			// });
			
		}

		return {"funcs":funcs,"funcParents":funcParents};
	},
	/*
	*	输出勾选项的相关数据 [10.23  修改：父元素勾 选传父元素就ok]
	*/
	getArrData:function(){
		var funcs = [],
			funcParents = [];

		var modules = jQuery(this.options.node).find("tbody:not(.head)");
		// 按行遍历
		for (var i = 0; i < modules.length; i++) {
			var module = jQuery(modules[i]);
			// 取父节点数据
			var func1 = module.find("input[id^='lvl1_']").filter("[data-type='tree']");
			if(func1.prop("checked")){
				funcParents.push({"functionOrgId":func1.attr("data-id")});
				continue;
			}

			// 取子节点数据
			var func2 = module.find("input[id^='lvl2_']").filter("[data-type='leaf']");
			func2.each(function(index,item){
				var el = jQuery(item);
				if(el.prop("checked")){
					funcs.push({"functionId":el.attr("data-id")});
				}
			});
		}

		return {"funcs":funcs,"funcParents":funcParents};
	}

});

var FuncTree = new Class({
		Implements: [Events, Options],
		options: {
			rootUrl:"/service/resource/get_root_function",
			url:"/service/resource/get_function_orgs_by_parent",
			getAllFuncsUrl:"/service/resource/get_function_pemission",  // 获取所有的功能权限 方便角色功能对比
			templateUrl:"/module/settings/usermgr/inc/function-tree.html",
			node:".treePanel",
			template:null,
			queryKey:"",
			scrollbar:null,
			scrollbarNode:"#aside .scrollbarPanel",
			selectable:false,
			defaultRootId:0,
			leafClick:jQuery.noop,
			leafDblClick:jQuery.noop,
			treeClick:jQuery.noop,
			treeDblClick:jQuery.noop,
			mode:"create",	// "create", "edit" 
			allFuncs:new Hash(),
			defaultFuncs:{formal:new Hash(),temp:new Hash()},   //用户默认的功能权限
			temFuncs:{formal:new Hash(),temp:new Hash()},
			roleFuncs:new Hash()	// 该角色具有的功能权限
		},
		// 解析用户功能权限 
		parseFuncs:function(arr){
			var tem = new Hash();
			for (var i = 0; i < arr.length; i++) {
				if (arr[i].systemFunctionList.length > 0) {
					tem.set(arr[i].id, arr[i].id);
				}
			}
			return tem;
		},
		initialize: function(options) {
			this.setOptions(options);
			// scrollbar 默认scroll容器的类名为 scrollbarPanel
			var tem = this.options;
			// tem.scrollbar = jQuery(tem.node).html("").closest("div"+ tem.scrollbarNode);
			// tem.scrollbar.tinyscrollbar({thumbSize : 72});
			jQuery(tem.node).html("");

			// 编辑的时候默认传一个roleId(用户当前角色id)
			if(tem.roleId){
				// Hash 复制 初始值
				tem.temFuncs.formal.empty();
				tem.temFuncs.temp.empty();

				tem.defaultFuncs.formal.each(function(value,key){
					tem.temFuncs.formal.set(key,value);
				});

				tem.defaultFuncs.temp.each(function(value,key){
					tem.temFuncs.temp.set(key,value);
				});

				// 用户信息中的功能权限信息  用于判断是否包含角色功能
				tem.userFuncs = this.parseFuncs(tem.defaultFuncs.funcsBak);

				this.getRoleFuncs(this.options.roleId);

				// 重构数据 roleFuncs  角色的功能权限
				var temArr = new Hash();
				var org = tem.roleFuncs.org;
				var res = tem.roleFuncs.res;

				for(var i = org.length-1;i>=0;i--){
					temArr.set("t"+org[i].resourceOrganizationId,"1");
				}

				for(var j = res.length-1;j>=0;j--){
					temArr.set(res[j].resourceId,"1");
				}
				tem.roleFuncs = temArr;
			}

			this.loadTemplate();
			this.updateScrollBar();
			this.getAllFuncs();

		},
		getAllFuncs:function(){
			var self = this ;
			var allFuncs = this.options.allFuncs ;
			jQuery.ajax({
				url: self.options.getAllFuncsUrl,
				method: "get",
				dataType: "json",
				data: {},
				success: function(res) {
					if (res.code === 200 && res.data.systemFunctionOrganizationList) {
						var arr = res.data.systemFunctionOrganizationList;
						for(var i = 0;i < arr.length ; i++){
							allFuncs.set(arr[i].id,arr[i].systemFunctionList);
						}
					}else{
						notify.warn(res.data.message);
					}
				}
			});
		},
		/*
		 * 获取该角色的功能权限 {roleId}:角色id
		 */
		getRoleFuncs:function(roleId){
			var self = this;
			jQuery.ajax({
				url:"/service/role/get_role_function",
				method: "get",
				dataType: "json",
				async:false,
				data: {"id":roleId},
				success: function(res) {
					if (res.code === 200 && res.data.role.roleResourceAccessRules) {
						self.options.roleFuncs = {
							"org":res.data.role.roleResourceOrganizationAccessRules,
							"res":res.data.role.roleResourceAccessRules
						};

					} else {
						notify.warn("网络或服务器异常！");
					}
				}
			});
		},
		
		loadTemplate:function() {
			var self  = this;
			jQuery.get(self.options.templateUrl,function(tmp){
				var tem = self.options;
				self.addHelper();
				tem.template = Handlebars.compile(tmp);
				self.loadData({"masterOrgId":self.options.defaultRootId},jQuery(tem.node));
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
			Handlebars.registerHelper("isClound", function(context,options) {
				if(context.name.indexOf("云空间") !== -1){
					return options.fn(context);
				}else{
					return options.inverse(context);
				}
				
			});
		},
	
		/*
		*	初始化勾选
		*/
		selectEl:function(){
			var self = this;
			var temArr = null;
			if(self.options.mode ==="create"){
				temArr = self.options.defaultFuncs;

			}else if(self.options.mode ==="edit"){
				temArr = self.options.defaultFuncs;
				// console.log("默认的功能角色")
				// console.log(temArr)
				if(self.options.sroleId && parseInt(self.options.roleId,10) === parseInt(self.options.sroleId,10)){
					temArr = self.options.temFuncs;
				}
			}
			// console.log(temArr)

			var lis = jQuery(self.options.node).find("li");
			lis.each(function(index,item){
				var el = jQuery(item);    

				// 正式权限
				temArr.formal.each(function(value,key){
					var checkEl = null;
					// 勾选树节点
					if(el.attr("data-type") ==="tree"){

						if(el.attr("data-treeid") === key){
							checkEl = el.children("i.checkbox") ;
							if(!checkEl.hasClass("icon1")){
								checkEl.addClass("icon1");
							}
							checkEl.removeClass("icon0");

							// 设置一个自定义属性 用来区分初始值
							el.attr("data-default","1");
							// 如果树节点展开 那么将子节点全勾选
							if(el.attr("data-loaded")){
								var childFuncs = el.find("li");
								childFuncs.each(function(index, item) {
									var childCheckEl = jQuery(item).children("i.checkbox");
									if(!childCheckEl.hasClass("icon1")){
										childCheckEl.addClass("icon1");
									}
									childCheckEl.removeClass("icon0");
								});
							}
							temArr.formal.erase(key);
						}


					}

					// 勾选叶子节点
					if(el.attr("data-type") ==="leaf"){
						if(el.attr("data-id") === key){
							checkEl = el.children("i.checkbox") ;
							if(!checkEl.hasClass("icon1")){
								checkEl.addClass("icon1");
							}
							checkEl.removeClass("icon0");
							el.attr("data-default","1");
							temArr.formal.erase(key);
						}
					}
				}) ;

				// 临时
				temArr.temp.each(function(value,key){
					var checkEl = null;
					// 勾选树节点
					if(el.attr("data-type") ==="tree"){
						if(el.attr("data-treeid") === key){
							checkEl = el.children("i.checkbox") ;
							if(!checkEl.hasClass("icon0")){
								checkEl.addClass("icon0");
							}
							checkEl.removeClass("icon1");
							// 设置一个自定义属性 用来区分初始值
							el.attr("data-default","0");
							// 如果树节点展开 那么将子节点全勾选
							if(el.attr("data-loaded")){
								var childFuncs = el.find("li");
								childFuncs.each(function(index, item) {
									var childCheckEl = jQuery(item).children("i.checkbox");
									if(!childCheckEl.hasClass("icon0")){
										childCheckEl.addClass("icon0");
									}
									childCheckEl.removeClass("icon1");
								});
							}
							temArr.temp.erase(key);
						}
					}

					// 勾选叶子节点
					if(el.attr("data-type") ==="leaf"){
						if(el.attr("data-id") === key){
							checkEl = el.children("i.checkbox") ;
							if(!checkEl.hasClass("icon0")){
								checkEl.addClass("icon0");
							}
							checkEl.removeClass("icon1");
							el.attr("data-default","0");
							temArr.temp.erase(key);
						}
					}
				}) ;
			});
		},
		/*
		*	解析数据(角色相关的功能权限)
		*/ 
		parseArrs:function(arr,arr2){
			var self = this;
			var temArr = self.options.defaultFuncs;
			temArr.formal.empty();
			temArr.temp.empty();
			
			//清空所有状态 
			var lis = jQuery(self.options.node).find("li");
				lis.each(function(index,item){
					var el = jQuery(item);
					el.removeAttr("data-default");
					el.children("i.checkbox").removeClass("icon0");
					el.children("i.checkbox").removeClass("icon1");
				});

			// 组织
			for(var i = arr.length-1;i>=0;i--){
				temArr.formal.set("t"+arr[i].resourceOrganizationId,"1");
			}

			//子节点 
			for(var j = arr2.length-1;j>=0;j--){
				temArr.formal.set(arr2[j].resourceId,"1");
			}

			// 功能复制Hash 必须在selectEl前面 selectEl()会修改defaultFuncs

			// if(self.options.mode === "create"){
				var roleFuncs = self.options.roleFuncs;
				roleFuncs.empty();
				temArr.formal.each(function(value,key){
					roleFuncs.set(key,value);
				});
			// }

			self.selectEl();
		},
		/*
		*	@orgFuncs 组织  @resFuncs 具体资源
		*	@resourceType"："1,//资源类型 1：功能，2：摄像机 3：视图库
		*	@isReject:1 没有该权限
		*	@isDelete:1 是否删除该资源
		*/
		updateRoleFuncs:function(orgFuncs,resFuncs,sroleId){
			this.options.sroleId = sroleId;
			this.parseArrs(orgFuncs,resFuncs);
		},
		render:function(data){
			return this.options.template(data);
		},
		// 创建 获取数据 -bak
		getCreateData1:function(){
			var self = this;
			var funcs1 = jQuery(self.options.node).children("ul").children("li.tree");
			var outData = {"formal":[],"temp":[]};

			funcs1.each(function(index,item){
				var el = jQuery(item);

				var childs = el.find("li");
				// 初始化父元素勾选
				if(el.attr("data-default")){
					// 原来为正式
					if(el.attr("data-default") === "1"){
						// 第一级被更改
						if(!el.children("i.checkbox").hasClass("icon1")) {
							// 第一级没展开
							if(!el.attr("data-loaded")){		
								outData.formal.push({
										"id":el.attr("data-id"),
										"resourceType":"1",
										"isResource":"0",
										"isReject":"1",
										"isDelete":"0"
									});

							// 第一级已被展开，则寻找下级节点
							}else{
								var fFlag = true;

								childs.each(function(index,tem){
									var child = jQuery(tem);

									// 第二级父节点
									if(!el.children("i.checkbox").hasClass("icon1") && child.hasClass('tree') && !el.attr("data-loaded")){
										if(!el.attr("data-loaded")){

										}

									}

									if(child.hasClass('tree') && child.children("i.checkbox").hasClass("icon1")){
										fFlag = false;
									}
								});



								// 下级节点的勾全被拿掉
								if(fFlag){
									outData.formal.push({
										"id":el.attr("data-id"),
										"resourceType":"1",
										"isResource":"0",
										"isReject":"1",
										"isDelete":"0"
									});

								}else{



								}


								// 开始判断第二级
								childs.each(function(index,tem){
									var child = jQuery(tem);
									// 查找第三级节点
									var childrens = child.find('li');
									// 第二级为父及诶单
									if(child.hasClass('tree')){
										if(!child.attr("data-loaded")){	
											outData.formal.push({
													"id":el.attr("data-id"),
													"resourceType":"1",
													"isResource":"0",
													"isReject":"1",
													"isDelete":"0"
												});
										}
									}
									

									if(!child.children("i.checkbox").hasClass("icon1") && child.attr("data-default")){
										// 判断第二级节点状态 如果下级节点都去掉勾选 则传该节点的值
										var sFlag = true;

										childrens.each(function(index,item){


										});

										outData.formal.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"1",
											"isDelete":"0"
										});

									}
								});

							}
							
						}
					}
				// 初始化父元素无权限
				}else{

					if(el.children("i.checkbox").hasClass("icon0")) {
						// 如果父元素勾选，则传父元素id
						outData.temp.push({
									"id":el.attr("data-id"),
									"resourceType":"1",
									"isResource":"0",
									"isReject":"0",
									"isDelete":"0"
								});

					}else if(el.children("i.checkbox").hasClass("icon1")){
						outData.formal.push({
									"id":el.attr("data-id"),
									"resourceType":"1",
									"isResource":"0",
									"isReject":"0",
									"isDelete":"0"
								});
					}else{
						// 未选择
						if(el.attr("data-loaded")){
							childs.each(function(index,tem){
								var child = jQuery(tem);

								//改变的权限
								if(!child.children("i.checkbox").hasClass("icon1") && child.attr("data-default") === "1"){
										outData.formal.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"1",
											"isDelete":"0"
										});
								}
								
								// 新增的正式权限
								if(!child.attr("data-default") && child.children("i.checkbox").hasClass("icon1")){
									outData.formal.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"0",
											"isDelete":"0"
										});
								}

								// 新增的临时权限
								if(!child.attr("data-default") && child.children("i.checkbox").hasClass("icon0")){
									outData.temp.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"0",
											"isDelete":"0"
										});
								}

							});
						}

					}
				}
			});

			return outData;


		},
		// 创建 获取数据
		getCreateData:function(){
			var self = this;
			var lis = jQuery(self.options.node).find("li.tree");
			var outData = {"formal":[],"temp":[]};

			lis.each(function(index,item){
				var el = jQuery(item);

				var childs = el.find("li");
				// 初始化父元素勾选
				if(el.attr("data-default")){
					// 原来为正式
					if(el.attr("data-default") === "1"){
						// 被更改 
						if(!el.children("i.checkbox").hasClass("icon1")) {
							// 没展开
							if(!el.attr("data-loaded")){		
								outData.formal.push({
										"id":el.attr("data-id"),
										"resourceType":"1",
										"isResource":"0",
										"isReject":"1",
										"isDelete":"0"
									});

							// 已被展开，则寻找下级节点
							}else{
								
								childs.each(function(index,tem){
									var child = jQuery(tem);
									if(!child.children("i.checkbox").hasClass("icon1")){
										
										outData.formal.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"1",
											"isDelete":"0"
										});

									}
								});

							}
							
						}
					}
				// 初始化父元素无权限
				}else{

					if(el.children("i.checkbox").hasClass("icon0")) {
						// 如果父元素勾选，则传父元素id
						outData.temp.push({
									"id":el.attr("data-id"),
									"resourceType":"1",
									"isResource":"0",
									"isReject":"0",
									"isDelete":"0"
								});

					}else if(el.children("i.checkbox").hasClass("icon1")){
						outData.formal.push({
									"id":el.attr("data-id"),
									"resourceType":"1",
									"isResource":"0",
									"isReject":"0",
									"isDelete":"0"
								});
					}else{
						// 未选择
						if(el.attr("data-loaded")){
							childs.each(function(index,tem){
								var child = jQuery(tem);

								//改变的权限  角色的功能权限被修改->无
								if(!child.children("i.checkbox").hasClass("icon1") && child.attr("data-default") === "1"){
										outData.formal.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"1",
											"isDelete":"0"
										});
								}
								
								// 新增的正式权限
								if(!child.attr("data-default") && child.children("i.checkbox").hasClass("icon1")){
									outData.formal.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"0",
											"isDelete":"0"
										});
								}

								// 新增的临时权限
								if(!child.attr("data-default") && child.children("i.checkbox").hasClass("icon0")){
									outData.temp.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"0",
											"isDelete":"0"
										});
								}

							});
						}

					}
				}
			});

			return outData;


		},
		// 创建 获取数据
		getCreateData_alt:function(){
			var self = this;
			var lis = jQuery(self.options.node).find("li.tree");
			var outData = {"formal":[],"temp":[]};

			lis.each(function(index,item){
				var el = jQuery(item);

				var childs = el.find("li");
				// 初始化父元素勾选
				if(el.attr("data-default")){
					// 原来为正式
					if(el.attr("data-default") === "1"){
						// 被更改
						if(!el.children("i.checkbox").hasClass("icon1")) {
							// 没展开
							if(!el.attr("data-loaded")){		
								outData.formal.push({
										"id":el.attr("data-id"),
										"resourceType":"1",
										"isResource":"0",
										"isReject":"1",
										"isDelete":"0"
									});

							// 已被展开，则寻找下级节点
							}else{
								
								childs.each(function(index,tem){
									var child = jQuery(tem);
									if(child.children("i.checkbox").hasClass("icon1") && child.attr("data-default")){
										outData.formal.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"0",
											"isDelete":"0"
										});

									}
								});

							}
							
						}
					}
				// 初始化父元素无权限
				}else{

					if(el.children("i.checkbox").hasClass("icon0")) {
						// 如果父元素勾选，则传父元素id
						outData.temp.push({
									"id":el.attr("data-id"),
									"resourceType":"1",
									"isResource":"0",
									"isReject":"0",
									"isDelete":"0"
								});

					}else if(el.children("i.checkbox").hasClass("icon1")){
						outData.formal.push({
									"id":el.attr("data-id"),
									"resourceType":"1",
									"isResource":"0",
									"isReject":"0",
									"isDelete":"0"
								});
					}else{
						// 未选择
						if(el.attr("data-loaded")){
							childs.each(function(index,tem){
								var child = jQuery(tem);

								//改变的权限
								if(!child.children("i.checkbox").hasClass("icon1") && child.attr("data-default") === "1"){
										outData.formal.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"1",
											"isDelete":"0"
										});
								}
								
								// 新增的正式权限
								if(!child.attr("data-default") && child.children("i.checkbox").hasClass("icon1")){
									outData.formal.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"0",
											"isDelete":"0"
										});
								}

								// 新增的临时权限
								if(!child.attr("data-default") && child.children("i.checkbox").hasClass("icon0")){
									outData.temp.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"0",
											"isDelete":"0"
										});
								}

							});
						}

					}
				}
			});

			return outData;


		},
		/*
		*	是否是当前角色的功能
		*	@el : li元素
		*/
		isInRoleFunc:function(el){
			// return this.isChildOfRole(el);
			var self = this;
			var roleFuncArr = this.options.roleFuncs.getKeys();
			var result = false;

			if(el.attr("data-type") == "tree"){
				var hasOrg = false;
				for(var i =0 ;i<roleFuncArr.length;i++){
					if(el.attr("data-treeid") == roleFuncArr[i]){
						hasOrg = true;
						return true ;
					}
				}
				return hasOrg ;
			}

			if(el.attr("data-type") == "leaf"){
				var hasFunc = false;
				for (var j = 0; j < roleFuncArr.length; j++) {
					if (el.attr("data-id") == roleFuncArr[j]) {
						hasFunc = true;
						return true;
					}
				}
				return hasFunc ;
			}
			return result;
		},
		/**
		 * 点击的时候判断是否是角色的功能权限  角色的功能权限,那么有,那么没有
		 * @author chencheng
		 * @date   2014-10-30
		 * @return {Boolean}  [description]
		 */
		isChildOfRole:function(el){
			// return this.isInRoleFunc(el);
			var self = this;
			var roleFuncArr = this.options.roleFuncs.getKeys();
			var result = false;
			// 父元素
			if(el.attr("data-type") == "tree"){
				var hasOrg = false;
				for(var i =0 ;i<roleFuncArr.length;i++){
					if(el.attr("data-treeid") == roleFuncArr[i]){
						hasOrg = true;
						return true ;
					}
				}
				// 如果父元素不是角色功能 那么判断有没有子元素
				if(!hasOrg){
					return self.checkChildFuncs(el);
				}
			}

			if(el.attr("data-type") == "leaf"){
				var hasFunc = false;
				for (var j = 0; j < roleFuncArr.length; j++) {
					if (el.attr("data-id") == roleFuncArr[j]) {
						hasFunc = true;
						return true;
					}
				}
				// 如果子元素 没初始值 那么 判断父元素
				if(!hasFunc){
					return self.checkParentFunc(el.closest('li.tree'));
				}			
			}
			return result;
		},
		/**
		 * 如果父节点不是组织功能 那么判断角色里有没有其子功能
		 * @author chencheng
		 * @date   2014-10-30
		 * @param  {[type]}   el 点击的li元素
		 * @return {[type]}      [description]
		 */
		checkChildFuncs:function(el){
			var allChildFuncs = this.options.allFuncs.get(el.attr("data-id"));
			var roleFuncArr = this.options.roleFuncs.getKeys();

			var result = false;
			for (var i = 0; i < roleFuncArr.length; i++) {
				for (var j = 0; j < allChildFuncs.length; j++) {
					if(roleFuncArr[i] == allChildFuncs[j].id){
						return true;
					}

				}
			}
			return result ;
		},
		/**
		 * 检测父元素是否是角色的功能权限，如果父元素是 那么子元素不能变成临时权限
		 * @author chencheng
		 * @date   2014-10-30
		 * @return {[type]}   [description]
		 */
		checkParentFunc:function(el){
			
			if(!el || el.length == 0){
				return false;
			}

			var roleFuncArr = this.options.roleFuncs.getKeys();
			var result = false;
			for (var i = 0; i < roleFuncArr.length; i++) {
				if(el.attr("data-treeid") == roleFuncArr[i]){
					result = true;
					return true ;
				}
			}
			return result ;
		},
		
		/*
		*	获取改变的数据 [formal,temp] 默认要删除的数据全部放在正式里
		*/
		getEditData:function(){
			var self = this;
			//  如果更换了角色 获取数据和创建时相同

			if(self.options.sroleId && parseInt(self.options.roleId,10) !== parseInt(self.options.sroleId,10)){
				return self.getCreateData();
			}

			//否则找出改变的值
			var lis = jQuery(self.options.node).find("li.tree");
			var outData = {"formal":[],"temp":[]};
			
			lis.each(function(index,item){
				var el = jQuery(item);
				var childs = null;

				// 初始化父元素勾选
				if(el.attr("data-default")){
					// 父元素为临时权限
					if(el.attr("data-default") === "0"){
						// 父元素(临时) 初始值勾选被更换
						if(!el.children("i.checkbox").hasClass("icon0") ) {

							// 临时 --> 无
							if(!el.children("i.checkbox").hasClass("icon1")){
								// 父元素展开
								if(el.attr("data-loaded")){
									childs = el.find("li");
									
									// 添加要删除的临时权限
									outData.formal.unshift({
											"id":el.attr("data-id"),
											"resourceType":"1",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"1"
										});
									// 找出子节点勾选的数据
									childs.each(function(index,tem){
										var child = jQuery(tem);
										// 临时
										if(child.children("i.checkbox").hasClass("icon0")){
											// todo 收集改变了值
											outData.temp.push({
												"id":child.attr("data-id"),
												"resourceType":"1",
												"isResource":"1",
												"isReject":"0",
												"isDelete":"0"
											});
										}

										if(child.children("i.checkbox").hasClass("icon1")){
											// todo 收集改变了值
											outData.formal.push({
												"id":child.attr("data-id"),
												"resourceType":"1",
												"isResource":"1",
												"isReject":"0",
												"isDelete":"0"
											});
										}
									});

								

								// 父元素没有展开 
								}else{
									
									outData.formal.unshift({
										"id":el.attr("data-id"),
										"resourceType":"1",
										"isResource":"0",
										"isReject":"0",
										"isDelete":"1"
									});

									

								}
							}
							
							// 临时 --> 正式
							if(el.children("i.checkbox").hasClass("icon1")){
								// 父元素展开
								// if(!self.isInRoleFunc(el)){
									
								outData.formal.push({
										"id":el.attr("data-id"),
										"resourceType":"1",
										"isResource":"0",
										"isReject":"0",
										"isDelete":"0"
									});
								// }
							}
							
						}

					}

					// 父元素为正式权限
					if(el.attr("data-default") === "1"){
						// 父元素(临时) 初始值勾选被更换
						if(!el.children("i.checkbox").hasClass("icon1")) {

							// 正式 -> 无
							if(!el.children("i.checkbox").hasClass("icon0")){
								// 父元素展开
								if(el.attr("data-loaded")){
									childs = el.find("li");
									if(!self.isInRoleFunc(el)){
										outData.formal.unshift({
												"id":el.attr("data-id"),
												"resourceType":"1",
												"isResource":"0",
												"isReject":"0",
												"isDelete":"1"
											});
										
										childs.each(function(index,tem){
											var child = jQuery(tem);
											// 临时
											if(child.children("i.checkbox").hasClass("icon0")){
												// todo 收集改变了值
												outData.temp.push({
													"id":child.attr("data-id"),
													"resourceType":"1",
													"isResource":"1",
													"isReject":"0",
													"isDelete":"0"
												});
											}

											if(child.children("i.checkbox").hasClass("icon1")){
												// todo 收集改变了值
												outData.formal.push({
													"id":child.attr("data-id"),
													"resourceType":"1",
													"isResource":"1",
													"isReject":"0",
													"isDelete":"0"
												});
											}
										});

									}else{
										
										childs.each(function(index,tem){
											var child = jQuery(tem);
											if(!child.children("i.checkbox").hasClass("icon1")){
												// 正式权限要么有 要么没有 不可能 正式->临时
												outData.formal.push({
													"id":child.attr("data-id"),
													"resourceType":"1",
													"isResource":"1",
													"isReject":"1",
													"isDelete":"0"
												});

												
											}
										});
									}

								// 父元素没有展开 
								}else{

									if(!self.isInRoleFunc(el)){
										outData.formal.unshift({
												"id":el.attr("data-id"),
												"resourceType":"1",
												"isResource":"0",
												"isReject":"0",
												"isDelete":"1"
											});

									}else{
										
										outData.formal.push({
												"id":el.attr("data-id"),
												"resourceType":"1",
												"isResource":"0",
												"isReject":"1",
												"isDelete":"0"
											});
									}

								}
							}

							// 正式 -> 临时
							if(el.children("i.checkbox").hasClass("icon0")){

								outData.temp.push({
										"id":el.attr("data-id"),
										"resourceType":"1",
										"isResource":"0",
										"isReject":"0",
										"isDelete":"0"
									});
									
							}
	
						}

					}

				// 初始化父元素未勾选
				}else{

					// 无 -> 正式
					if(el.children("i.checkbox").hasClass("icon1")) {
						// 如果父元素勾选，则传父元素id
						if(!self.isInRoleFunc(el)){
							outData.formal.push({
									"id":el.attr("data-id"),
									"resourceType":"1",
									"isResource":"0",
									"isReject":"0",
									"isDelete":"0"
								});

						}else{

							outData.formal.push({
									"id":el.attr("data-id"),
									"resourceType":"1",
									"isResource":"0",
									"isReject":"0",
									"isDelete":"0"
								});	
						}
						
					// 无 -->> 临时
					}else if(el.children("i.checkbox").hasClass("icon0")){
						
						if(!self.isInRoleFunc(el)){
							outData.temp.push({
									"id":el.attr("data-id"),
									"resourceType":"1",
									"isResource":"0",
									"isReject":"0",
									"isDelete":"0"
								});

						}else{

							//不应该是角色的
							//outData.formal.push({
							//		"id":el.attr("data-id"),
							//		"resourceType":"1",
							//		"isResource":"0",
							//		"isReject":"0",
							//		"isDelete":"1"
							//	});	
						}
					
					}else{

						if(el.attr("data-loaded")){

							var flag = false;
							el.find("li").each(function(index,tem){
								var child = jQuery(tem);
								//正式授权被改掉
								if(!child.children("i.checkbox").hasClass("icon1") && child.attr("data-default") === "1"){
									flag = true;	
								}
								//临时授权被改掉
								if(!child.children("i.checkbox").hasClass("icon0") && child.attr("data-default") === "0"){
									flag = true;	
								}
								// 新增的临时权限
								if(child.children("i.checkbox").hasClass("icon0") && !child.attr("data-default")){
									flag = true;
								}
								// 新增的正式权限
								if(child.children("i.checkbox").hasClass("icon1") && !child.attr("data-default")){
									flag = true;
								}
							});

							if(flag){

								//outData.formal.unshift({
								//		"id":el.attr("data-id"),
								//		"resourceType":"1",
								//		"isResource":"0",
								//		"isReject":"0",
								//		"isDelete":"1"
								//	});

								el.find("li").each(function(index,tem){
									var child = jQuery(tem);		
									
									// 新增的临时权限
									if(child.children("i.checkbox").hasClass("icon0") && !child.attr("data-default")){

										outData.temp.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"0",
											"isDelete":"0"
										});
										
									}

									// 新增的正式权限
									if(child.children("i.checkbox").hasClass("icon1") && !child.attr("data-default")){
									
										outData.formal.push({
											"id":child.attr("data-id"),
											"resourceType":"1",
											"isResource":"1",
											"isReject":"0",
											"isDelete":"0"
										});
									}

									// 正式->无
									if(!child.children("i.checkbox").hasClass("icon1") && !child.children("i.checkbox").hasClass("icon0") && child.attr("data-default") === "1"){

										if(!self.isInRoleFunc(child)){

											outData.formal.unshift({
												"id":child.attr("data-id"),
												"resourceType":"1",
												"isResource":"1",
												"isReject":"0",
												"isDelete":"1"
											});

										}else{

											outData.formal.push({
												"id":child.attr("data-id"),
												"resourceType":"1",
												"isResource":"1",
												"isReject":"1",
												"isDelete":"0"
											});
											
										}

										
									}

									// 临时->无
									if(!child.children("i.checkbox").hasClass("icon1") && !child.children("i.checkbox").hasClass("icon0") && child.attr("data-default") === "0"){

										if(!self.isInRoleFunc(child)){
											outData.formal.unshift({
												"id":child.attr("data-id"),
												"resourceType":"1",
												"isResource":"1",
												"isReject":"0",
												"isDelete":"1"
											});

										}else{
											//outData.formal.push({
											//	"id":child.attr("data-id"),
											//	"resourceType":"1",
											//	"isResource":"1",
											//	"isReject":"1",
											//	"isDelete":"0"
											//});
											
										}

										
									}

									// 正式->临时
									if(child.children("i.checkbox").hasClass("icon0") && !child.children("i.checkbox").hasClass("icon1") && child.attr("data-default") === "1"){

										if(!self.isInRoleFunc(child)){
											outData.temp.push({
												"id":child.attr("data-id"),
												"resourceType":"1",
												"isResource":"1",
												"isReject":"0",
												"isDelete":"0"
											});

										}else{
											//outData.formal.push({
											//	"id":child.attr("data-id"),
											//	"resourceType":"1",
											//	"isResource":"1",
											//	"isReject":"1",
											//	"isDelete":"0"
											//});
											
										}

										
									}

									// 临时 -> 正式
									if(child.children("i.checkbox").hasClass("icon1") && !child.children("i.checkbox").hasClass("icon0") && child.attr("data-default") === "0"){

										if(!self.isInRoleFunc(child)){
											outData.formal.push({
												"id":child.attr("data-id"),
												"resourceType":"1",
												"isResource":"1",
												"isReject":"0",
												"isDelete":"0"
											});

										}else{
											//outData.formal.push({
											//	"id":child.attr("data-id"),
											//	"resourceType":"1",
											//	"isResource":"1",
											//	"isReject":"1",
											//	"isDelete":"0"
											//});
											
										}
									}

								});
							}

						}
					}
				}
			});

			return outData;
		},
		/*
		*	输出改变的数据
		*/ 
		getOutPutData:function(){
			if(this.options.mode === "create"){
				return this.getCreateData();
			}else if(this.options.mode === "edit"){
				return this.getEditData();
			}else{
				return [];
			}

		},
		updateScrollBar:function(){
			return ;
			this.options.scrollbar.tinyscrollbar_update('relative');
		},
		getFuncsData:function(){
			var data = {
				orgs:[],
				funcs:[]
			};

			var funcs = JSON.parse(window.localStorage.getItem("sUser")).functionOrgIdList;
			for(var i=0;i<funcs.length;i++){
				var tem = {
					"id":funcs[i].id,
					"name":funcs[i].name,
					"allChild":true
				};
				var subFuncs = funcs[i].systemFunctionList ? funcs[i].systemFunctionList:[];
				if(funcs[i].systemFunctionAllCount > subFuncs.length){
					tem.allChild = false;
				}
				data.orgs.push(tem);

				for(var j=0;j<subFuncs.length;j++){
					data.funcs.push({
						"id":subFuncs[j].id,
						"name":subFuncs[j].name
					});
				}
			}

			return data;


		},
		
		// 将不拥有的功能权限置灰
		hasPermission:function(type,id){
			var permission = this.getFuncsData();
			var orgs = permission.orgs;
			var funcs = permission.funcs;
			
			var flag = false;
			if(type === "tree"){
				for(var i = 0;i<orgs.length;i++){
					if(orgs[i].id == id){
						flag = true;
						break;
					}
				}
			}

			if(type === "leaf"){
				for(var j = 0;j<funcs.length;j++){
					if(funcs[j].id == id){
						flag = true;
						break;
					}
				}
			}

			return flag ;
		
		},
		// 判断一个org 功能是否包含下级的所有功能 若有 可执行勾选  否则不可勾选
		hasAllChilds:function(id){	
			var orgs = this.getFuncsData().orgs;
			for(var i=0;i<orgs.length;i++){
				if(id == orgs[i].id){
					return orgs[i].allChild ;
				}
			}
			return false;
		},
		// 将不拥有的功能权限置灰
		setGrayBackground:function(nodes){
			var self = this;
			for(var i= 0 ;i<nodes.length;i++){
				var el =  jQuery(nodes[i]);
				
				if(el.attr("data-type") === "tree" || el.attr("data-type") === "leaf"){
					if(!self.hasPermission(el.attr("data-type"),el.attr("data-id"))){
						el.attr("data-deny","1");
						el.css("opacity",0.5);
					}
				}

			}
		},
		bindEvent:function(parentNode,initFlag){
			var self = this;
			var target = parentNode.find("ul li span");
			
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

				if(current.attr("data-deny")){
					return false;
				}

				if(current.attr("data-type") === "tree"){
					if(!current.attr("data-loaded")){
						self.loadData({"masterOrgId":current.attr("data-id")},current);
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


			// 叶子节点前的图片点击事件
			parentNode.find("ul li.leaf i.leaf").on("click",function(event){
				// 直接调用span的点击事件
				self.processLeafClick(jQuery(this).closest("li").children("span"));
				return false;
			});

			// 选择框点击事件
			if(self.options.selectable){
				parentNode.find("li>i.checkbox").each(function(index,item){
						
					jQuery(item).click(function(){
						var tem = jQuery(this);
						// 如果没有该角色的功能
						if(tem.closest("li").attr("data-deny")){
							return false;
						}

						if(tem.closest("li").attr("data-type") === "tree" && (!self.hasAllChilds(tem.closest("li").attr("data-id")))){
							return false;
						}

						if(self.isChildOfRole(tem.closest("li"))){
							if(tem.hasClass("icon1")){
								tem.removeClass("icon1").removeClass("icon0");
							}else{
								tem.addClass("icon1").removeClass("icon0");
							}
						}else{
							// 如果该节点是组织
							// if(tem.closest("li").hasClass("tree")){

							// }

							if(tem.hasClass("icon0")){
								tem.removeClass("icon0").addClass("icon1");
							}else if(tem.hasClass("icon1")){
								tem.removeClass("icon1").removeClass("icon0");
							}else{ 
								tem.addClass("icon0");
							}
						}

				
						self.walkUp(tem);
						self.walkDown(tem);

						// console.log(self.getOutPutData());

						return false;
					});

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
				if(!(current.hasClass("icon0") || current.hasClass("icon1"))){
					parent.removeClass("icon0").removeClass("icon1");
					caller(parent);
				}else{
					if(current.hasClass("icon0")){
						var result = true;
						current.closest("li").siblings("li").children("i.checkbox").each(function(index,checkbox){
							if(!jQuery(checkbox).hasClass("icon0")){
								result = false;
							}
						});
						var ckb = item.closest("li").closest("ul").closest("li").children("i.checkbox");
						if(result){
							ckb.addClass("icon0").removeClass("icon1");
						}else{
							ckb.removeClass("icon0").removeClass("icon1");
						}
						caller(parent);

					}

					if(current.hasClass("icon1")){
						var result1 = true;
						current.closest("li").siblings("li").children("i.checkbox").each(function(index,checkbox){
							if(!jQuery(checkbox).hasClass("icon1")){
								result1 = false;
							}
						});
						var ckb1 = item.closest("li").closest("ul").closest("li").children("i.checkbox");
						if(result1){
							ckb1.addClass("icon1").removeClass("icon0");
						}else{
							ckb1.removeClass("icon0").removeClass("icon1");
						}
						caller(parent);

					}
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
				if(!(current.hasClass("icon0") || current.hasClass("icon1"))){
					current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);
							child.removeClass("icon0").removeClass("icon1");
							caller(child);
						});
				}else{

					if(current.hasClass("icon0")){
						current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);
							if(!child.hasClass("icon0")){
								child.addClass("icon0").removeClass("icon1");
							}
							caller(child);
						});
					}

					if(current.hasClass("icon1")){
						current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);
							if(!child.hasClass("icon1")){
								child.addClass("icon1").removeClass("icon0");
							}
							caller(child);
						});
					}

					
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
			this.updateScrollBar();
		},
		/*
		 *	向页面中添加html
		 */
		appendHTML:function(receiveData,parentNode,context){
			parentNode.attr("data-loaded",1);
			var level = 1;
			if(parentNode.attr("data-tree-level")){
				level = parseInt(parentNode.attr("data-tree-level"),10)+1;
			}
			if(context.options.selectable){
				if(parentNode.children("i.checkbox").is("i.icon0")){
					parentNode.append(context.render({"orgs":receiveData.orgs,"funcs":receiveData.funcs,"level":level,"selected":"icon0","selectable":context.options.selectable,"size":receiveData.length}));
				}else if(parentNode.children("i.checkbox").is("i.icon1")){
					parentNode.append(context.render({"orgs":receiveData.orgs,"funcs":receiveData.funcs,"level":level,"selected":"icon1","selectable":context.options.selectable,"size":receiveData.length}));
				}else{
					parentNode.append(context.render({"orgs":receiveData.orgs,"funcs":receiveData.funcs,"level":level,"selected":"","selectable":context.options.selectable,"size":receiveData.length}));
				}
			}else{
				parentNode.append(context.render({"orgs":receiveData.orgs,"funcs":receiveData.funcs,"level":level,"selectable":context.options.selectable,"size":receiveData.length}));
			}
			// 勾选
			if(this.options.selectable){
				this.setGrayBackground(parentNode.find('li'));
				this.selectEl();
			}
			
			context.updateScrollBar();
			context.bindEvent(parentNode);
		},
		/*
		 *	加载数据
		 */
		loadData:function(params,parentNode){	
			// 解决click事件 防止重复请求
			parentNode.children("i.fold").unbind("click");

			var self = this,
				url = self.options.url,
				getRootFlag = false,
				requestType = "get"; 

			if(parseInt(params.masterOrgId,10) === 0){
				url =  self.options.rootUrl;
				params = null;
				getRootFlag = true;
			}
			if(self.options.queryKey !== ""){
				params.name = self.options.queryKey;
				url =  self.options.searchUrl;
				requestType = "post";
			}
			
			jQuery.ajax({
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
						if(res && res.code === 200){
							receiveData ={orgs: res.data.functionOrgsList,funcs:res.data.systemFunctionList};
							self.appendHTML(receiveData,parentNode,self);
						}else{
							parentNode.attr("data-loaded",1);
							parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
							self.updateScrollBar();
						}

					}else{
						if(res && res.code === 200){
							receiveData ={orgs: res.data.functionOrgsList,funcs:res.data.systemFunctionList};
							self.appendHTML(receiveData,parentNode,self);
						}else{
							parentNode.attr("data-loaded",1);
							parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
							self.updateScrollBar();
						}
					}

					
				},
				error:function(){
					notify.warn("网络或服务器异常！");
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
								self.loadData({"masterOrgId":current.attr("data-id")},current);
							}else{
								self.toggle(current.children("ul"));
							}
						}
						current.toggleClass("active");
						return false;
					});

				}
			});
		}
	}); 


/**
 * 	摄像机树(用户权限微调)
 */
var CameraTree = new Class({
		Implements: [Events, Options],
		options: {
			url:"/service/resource/get_camera_orgs_by_parent",  //根据父元素id获取子元素
			rootUrl:"/service/resource/get_root_camera?isRoot="+ window.sysConfig.getResMode(),   //获取根
			getParentsUrl:"/service/resource/get_org_path",  // 获取父节点路径
			node:".treePanel",	//容器选择符
			templateUrl:"/module/settings/usermgr/inc/camera-tree.html",		//模板路径
			template:null,
			queryKey:"",
			scrollbar:null,
			scrollbarNode:"#aside .scrollbarPanel",
			selectable:false,
			defaultOrgs:{"formal":[],"temp":[]},
			defaultCameras:{"formal":[],"temp":[]},			//编辑默认数据
			defaultRootId:0,
			orgId:null,
			mode:"create",	// "create", "edit" , "detail" 
			leafClick:jQuery.noop,
			leafDblClick:jQuery.noop,
			treeClick:jQuery.noop,
			treeDblClick:jQuery.noop,
			orgPathList:[]
		},
		initialize: function(options) {
			this.setOptions(options);
			// scrollbar 默认scroll容器的类名为 scrollbarPanel
			var tem = this.options;
			// tem.scrollbar = jQuery(tem.node).html("").closest("div"+ tem.scrollbarNode);
			// tem.scrollbar.tinyscrollbar({thumbSize : 72});

			jQuery(this.options.node).empty();
			this.loadTemplate();
			
			if(tem.orgId && tem.orgId != "null"){
				this.getOrgPathList(tem.orgId);
			}
			this.updateScrollBar();
		},
		getOrgPathList:function(currentOrgId){
			var self = this;
			jQuery.get(self.options.getParentsUrl+"?orgId="+currentOrgId,function(res){
				if(res.code === 200){
					self.options.orgPathList = res.data.orgPathList.reverse();
				}else{
					notify.warn("网络或服务器异常！");
				}
			});
		},
		loadTemplate:function() {
			var self  = this;
			jQuery.get(self.options.templateUrl,function(tmp){
				var tem = self.options;
				self.addHelper();
				tem.template = Handlebars.compile(tmp);

				// if(tem.mode ==="create"){
					self.loadData({"masterOrgId":self.options.defaultRootId},jQuery(tem.node),true);
				// }else if(tem.mode ==="edit"){
				// }
				
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
			// 如果是虚拟组织  id则为虚拟组织的 strOrgId  (主要用于 编辑回显用)
			Handlebars.registerHelper('changeId', function(id,vid,options) {
				if(vid){
					return vid ;
				}else{
					return id ;
				}
			});

			// 判断是否是虚拟组织 
			Handlebars.registerHelper('isVirtual', function(sid,options) {
				// 如果是虚拟组织 则添加自定义属性 data-vid  vorg_id
				if(!sid){return;}
				if(sid.indexOf("vorg_") !== -1){
					return 'data-orgid='+ sid.match(/\d+/)[0] + ' data-vid='+ sid ;
				}
				
			});

		},
		render:function(data){
			return this.options.template(data);
		},
		updateScrollBar:function(){
			return ;
			this.options.scrollbar.tinyscrollbar_update('relative');
		},
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
						self.loadData({"masterOrgId":current.attr("data-orgid") || current.attr("data-id")},current,false);
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

					if(tem.hasClass("icon0")){
						tem.removeClass("icon0").addClass("icon1");
					}else if(tem.hasClass("icon1")){
						tem.removeClass("icon1").removeClass("icon0");
					}else{ 
						tem.addClass("icon0");
					}

					self.walkUp(tem);
					self.walkDown(tem);

					return false;
				});
			} 

			// 自动展开当前部门
			self.autoExpand();
		},
		autoExpand:function(){
			var self = this;
			
			// 当前部门 暂不展开  length > 0 即可展开
			if(self.options.orgPathList.length > 1){

				jQuery(self.options.node).find("li").each(function(index,item){
					if(parseInt(jQuery(item).attr("data-id"),10) === parseInt(self.options.orgPathList[0],10)){
						self.options.orgPathList.shift();
						jQuery(item).children("i.fold").click();

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
				if(!(current.hasClass("icon0") || current.hasClass("icon1"))){
					parent.removeClass("icon0").removeClass("icon1");
					caller(parent);
				}else{
					if(current.hasClass("icon0")){
						var result = true;
						current.closest("li").siblings("li").children("i.checkbox").each(function(index,checkbox){
							if(!jQuery(checkbox).hasClass("icon0")){
								result = false;
							}
						});
						var ckb = item.closest("li").closest("ul").closest("li").children("i.checkbox");
						if(result){
							ckb.addClass("icon0").removeClass("icon1");
						}else{
							ckb.removeClass("icon0").removeClass("icon1");
						}
						caller(parent);

					}

					if(current.hasClass("icon1")){
						var result1 = true;
						current.closest("li").siblings("li").children("i.checkbox").each(function(index,checkbox){
							if(!jQuery(checkbox).hasClass("icon1")){
								result1 = false;
							}
						});
						var ckb1 = item.closest("li").closest("ul").closest("li").children("i.checkbox");
						if(result1){
							ckb1.addClass("icon1").removeClass("icon0");
						}else{
							ckb1.removeClass("icon0").removeClass("icon1");
						}
						caller(parent);

					}
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
				if(!(current.hasClass("icon0") || current.hasClass("icon1"))){
					current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);
							child.removeClass("icon0").removeClass("icon1");
							caller(child);
						});
				}else{

					if(current.hasClass("icon0")){
						current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);
							if(!child.hasClass("icon0")){
								child.addClass("icon0").removeClass("icon1");
							}
							caller(child);
						});
					}

					if(current.hasClass("icon1")){
						current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);
							if(!child.hasClass("icon1")){
								child.addClass("icon1").removeClass("icon0");
							}
							caller(child);
						});
					}

					
				}
			}
		},
		/*
		*	获取改变的数据(需要删除的放在数组前边 [正式，临时] 默认放在正式里边)
		*/	
		getEditData:function(){
			
			var outData = {"formal":[],"temp":[]};
			var self = this;

			(function walk(item){
				// item 为li元素

				var caller = arguments.callee;
				var current = item;

				if(current.attr("data-default")){
					// 正式 -> 临时
					if(current.attr("data-default") === "1" && current.children("i.checkbox").is(".icon0") && !current.children("i.checkbox").is(".icon1")){
						// 若为 虚拟组织
						if(current.attr("data-vid")){
							outData.temp.push({
								"id":current.attr("data-orgid"),
								"resourceType":"2",
								"isResource":"0",
								"isReject":"0",
								"isDelete":"0",
								"vOrgId":current.attr("data-vid")
							});

						}else{
							outData.temp.push({
								"id":current.attr("data-id"),
								"resourceType":"2",
								"isResource":"0",
								"isReject":"0",
								"isDelete":"0"
							});
						}
						
					}

					// 正式 -> 无
					if(current.attr("data-default") === "1" && !current.children("i.checkbox").is(".icon0")  && !current.children("i.checkbox").is(".icon1")){
						// 删除数据
						if(current.attr("data-vid")){
							outData.formal.unshift({
								"id":current.attr("data-orgid"),
								"resourceType":"2",
								"isResource":"0",
								"isReject":"0",
								"isDelete":"1",
								"vOrgId":current.attr("data-vid")
							});
						}else{
							outData.formal.unshift({
								"id":current.attr("data-id"),
								"resourceType":"2",
								"isResource":"0",
								"isReject":"0",
								"isDelete":"1"
							});
						}
						

						// 遍历其子节点
						current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
							var child = jQuery(tem);

							// 临时
							if(child.is("i.icon0")){
								if(child.closest("li").attr("data-res") === "camera"){

									// console.log("摄像机："+child.closest("li").attr("data-name")+"     临时>>添加")
									outData.temp.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"1",
										"isReject":"0",
										"isDelete":"0"
									});

								}else{

									// 若为虚拟组织
									if(child.closest("li").attr("data-vid")){
										outData.temp.push({
											"id":child.closest("li").attr("data-orgid"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0",
											"vOrgId":child.closest("li").attr("data-vid")
										});
									}else{
										outData.temp.push({
											"id":child.closest("li").attr("data-id"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0"
										});
									}

									
									
								}
							//	正式 
							}else if(child.is("i.icon1")){

								if(child.closest("li").attr("data-res") === "camera"){

									// console.log("摄像机："+child.closest("li").attr("data-name")+"     正式>>添加")
									outData.formal.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"1",
										"isReject":"0",
										"isDelete":"0"
									});

								}else{

									if(child.closest("li").attr("data-vid")){
										outData.formal.push({
											"id":child.closest("li").attr("data-orgid"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0",
											"vOrgId":child.closest("li").attr("data-vid")
										});
									}else{
										outData.formal.push({
											"id":child.closest("li").attr("data-id"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0"
										});
									}									
									
								}
								
							}else{
								// 遍历展开过的
								if(child.closest("li").attr("data-loaded")){
									caller(child.closest("li"));
								}
							}

						});

					}

					// 临时 -> 正式  
					if(current.attr("data-default") === "0" && current.children("i.checkbox").is(".icon1") && !current.children("i.checkbox").is(".icon0")){
						if(current.attr("data-vid")){
							outData.formal.push({
								"id":current.attr("data-orgid"),
								"resourceType":"2",
								"isResource":"0",
								"isReject":"0",
								"isDelete":"0",
								"vOrgId":current.attr("data-vid")
							});
						}else{
							outData.formal.push({
								"id":current.attr("data-id"),
								"resourceType":"2",
								"isResource":"0",
								"isReject":"0",
								"isDelete":"0"
							});
						}
						
					}

					// 临时 -> 无  
					if(current.attr("data-default") === "0" && !current.children("i.checkbox").is(".icon1") && !current.children("i.checkbox").is(".icon0")){
						if(current.attr("data-vid")){
							outData.formal.unshift({
								"id":current.attr("data-orgid"),
								"resourceType":"2",
								"isResource":"0",
								"isReject":"0",
								"isDelete":"1",
								"vOrgId":current.attr("data-vid")
							});
						}else{
							outData.formal.unshift({
								"id":current.attr("data-id"),
								"resourceType":"2",
								"isResource":"0",
								"isReject":"0",
								"isDelete":"1"
							});
						}
						

						// 遍历其子节点
						current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
							var child = jQuery(tem);

							// 临时
							if(child.is("i.icon0")){
								if(child.closest("li").attr("data-res") === "camera"){

									// console.log("摄像机："+child.closest("li").attr("data-name")+"     >>默认非勾选")
									outData.temp.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"1",
										"isReject":"0",
										"isDelete":"0"
									});

								}else{
									// 该组织为虚拟组织
									if(child.closest("li").attr("data-vid")){
										outData.temp.push({
											"id":child.closest("li").attr("data-orgid"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0",
											"vOrgId":child.closest("li").attr("data-vid")
										});
									}else{
										outData.temp.push({
											"id":child.closest("li").attr("data-id"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0"
										});
									}
									
									
								}
							//	正式 
							}else if(child.is("i.icon1")){

								if(child.closest("li").attr("data-res") === "camera"){

									// console.log("摄像机："+child.closest("li").attr("data-name")+"     >>默认非勾选")
									outData.formal.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"1",
										"isReject":"0",
										"isDelete":"0"
									});

								}else{
									if(child.closest("li").attr("data-vid")){
										outData.formal.push({
											"id":child.closest("li").attr("data-orgid"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0",
											"vOrgId":child.closest("li").attr("data-vid")
										});
									}else{
										outData.formal.push({
											"id":child.closest("li").attr("data-id"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0"
										});
									}
									
									
								}
								
							}else{
								// 遍历展开过的
								if(child.closest("li").attr("data-loaded")){
									caller(child.closest("li"));
								}
							}


						});

					}



				}else{
					// 初始未勾选

					// 选为临时
					if(current.children("i.checkbox").is(".icon0")){
						// 虚拟组织
						if(current.attr("data-vid")){
							outData.temp.push({
								"id":current.attr("data-orgid"),
								"resourceType":"2",
								"isResource":"0",
								"isReject":"0",
								"isDelete":"0",
								"vOrgId":current.attr("data-vid")
							});
						}else{
							outData.temp.push({
								"id":current.attr("data-id"),
								"resourceType":"2",
								"isResource":"0",
								"isReject":"0",
								"isDelete":"0"
							});
						}
						

					// 选为正式的
					}else if(current.children("i.checkbox").is(".icon1")){
						if(current.attr("data-vid")){
							outData.formal.push({
								"id":current.attr("data-orgid"),
								"resourceType":"2",
								"isResource":"0",
								"isReject":"0",
								"isDelete":"0",
								"vOrgId":current.attr("data-vid")
							});
						}else{
							outData.formal.push({
								"id":current.attr("data-id"),
								"resourceType":"2",
								"isResource":"0",
								"isReject":"0",
								"isDelete":"0"
							});
						}
						
					}else{

						// 遍历其子节点
						current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
							var child = jQuery(tem);
							var parentLi= child.closest("li"); 

							// 无 -> 临时 
							if(child.is("i.icon0") && !parentLi.attr("data-default")){
								if(child.closest("li").attr("data-res") === "camera"){

									// console.log("摄像机："+child.closest("li").attr("data-name")+"     无>>临时");
									outData.temp.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"1",
										"isReject":"0",
										"isDelete":"0"
									});

								}else{
									// console.log("组织："+child.closest("li").attr("data-name")+"     无>>临时");
									// 虚拟组织
									if(child.closest("li").attr("data-vid")){
										outData.temp.push({
											"id":child.closest("li").attr("data-orgid"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0",
											"vOrgId":child.closest("li").attr("data-vid")
										});
									}else{
										outData.temp.push({
											"id":child.closest("li").attr("data-id"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0"
										});
									}
									
									
								}		
							}

							// 无 -> 正式
							if(child.is("i.icon1") && !parentLi.attr("data-default")){
								if(child.closest("li").attr("data-res") === "camera"){

									// console.log("摄像机："+child.closest("li").attr("data-name")+"     无>>正式")
									outData.formal.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"1",
										"isReject":"0",
										"isDelete":"0"
									});

								}else{
									// console.log("组织："+child.closest("li").attr("data-name")+"     无>>正式")
									if(child.closest("li").attr("data-vid")){
										outData.formal.push({
											"id":child.closest("li").attr("data-orgid"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0",
											"vOrgId":child.closest("li").attr("data-vid")
										});
									}else{
										outData.formal.push({
											"id":child.closest("li").attr("data-id"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0"
										});
									}
									
									
								}		
							}

							// 临时 -> 正式
							if(child.is("i.icon1") && !child.is("i.icon0") && parentLi.attr("data-default") === "0"){

								if(child.closest("li").attr("data-res") === "camera"){

									// console.log("摄像机："+child.closest("li").attr("data-name")+"     >>临时 -->> 正式")
									outData.formal.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"1",
										"isReject":"0",
										"isDelete":"0"
									});

								}else{
									// console.log("组织："+child.closest("li").attr("data-name")+"     >>临时 -->> 正式")

									if(child.closest("li").attr("data-vid")){
										outData.formal.push({
											"id":child.closest("li").attr("data-orgid"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0",
											"vOrgId":child.closest("li").attr("data-vid")

										});
									}else{
										outData.formal.push({
											"id":child.closest("li").attr("data-id"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0"
										});
									}
									
								}
								
							}
							// 临时 -> 无
							if(!child.is("i.icon0") && !child.is("i.icon1") && parentLi.attr("data-default") === "0"){

								if(child.closest("li").attr("data-res") === "camera"){

									// console.log("摄像机："+child.closest("li").attr("data-name")+"     >>临时 - >> 无")
									outData.formal.unshift({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"1",
										"isReject":"0",
										"isDelete":"1"
									});

								}else{
									// console.log("组织："+child.closest("li").attr("data-name")+"     >>临时 - >> 无")
									
									if(child.closest("li").attr("data-vid")){
										outData.formal.unshift({
											"id":child.closest("li").attr("data-orgid"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"1",
											"vOrgId":child.closest("li").attr("data-vid")
										});
									}else{
										outData.formal.unshift({
											"id":child.closest("li").attr("data-id"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"1"
										});
									}
									
									
								}
								
							}

							// 正式 -> 临时 
							if(child.is("i.icon0") && !child.is("i.icon1") && parentLi.attr("data-default") === "1"){

								if(child.closest("li").attr("data-res") === "camera"){

									// console.log("摄像机："+child.closest("li").attr("data-name")+"     >>正式 -->> 临时")
									outData.temp.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"1",
										"isReject":"0",
										"isDelete":"0"
									});

								}else{

								// console.log("组织："+child.closest("li").attr("data-name")+"     >>正式 -->> 临时")
									if(child.closest("li").attr("data-vid")){
										outData.temp.push({
											"id":child.closest("li").attr("data-orgid"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0",
											"vOrgId":child.closest("li").attr("data-vid")
										});
									}else{
										outData.temp.push({
											"id":child.closest("li").attr("data-id"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"0"
										});
									}
									
									
								}
								
							}

							// 正式 -> 无
							if(!child.is("i.icon1") && !child.is("i.icon0") && parentLi.attr("data-default") === "1"){

								if(child.closest("li").attr("data-res") === "camera"){

									// console.log("摄像机："+child.closest("li").attr("data-name")+"     >>正式 -->无")
									outData.formal.unshift({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"1",
										"isReject":"0",
										"isDelete":"1"
									});

								}else{

									// console.log("组织："+child.closest("li").attr("data-name")+"     >>正式 -->无")
									// 虚拟组织
									if(child.closest("li").attr("data-vid")){
										outData.formal.unshift({
											"id":child.closest("li").attr("data-orgid"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"1",
											"vOrgId":child.closest("li").attr("data-vid")
										});
									}else{
										outData.formal.unshift({
											"id":child.closest("li").attr("data-id"),
											"resourceType":"2",
											"isResource":"0",
											"isReject":"0",
											"isDelete":"1"
										});
									}
									
									
								}
								
							}


							if(!child.is("i.icon0") && !child.is("i.icon1")){
								// 遍历展开过的
								if(child.closest("li").attr("data-loaded")){
									caller(child.closest("li"));
								}
							}
						});
					}
				}

				
			})(jQuery(self.options.node).children("ul").children("li"));

			// console.log(outData.length)

			return outData;

		},
		/*
		*	添加摄像机权限
		*/
		getCreateData:function(){
			var outData ={"formal":[],"temp":[]};
			var self = this;
			// 匹配数组id ()
			(function walk(item){
				// item 为li元素
				var caller = arguments.callee;
				var current = item;

				// 当前元素勾选
				if(current.children("i.checkbox").is(".icon0")){
					// 如果是虚拟组织
					if(current.attr("data-vid")){
						outData.temp.push({
							"id":current.attr("data-orgid"),
							"resourceType":"2",
							"isResource":"0",
							"isReject":"0",
							"isDelete":"0",
							"vOrgId":current.attr("data-vid")
						});
						// 非虚拟组织
					}else{
						outData.temp.push({
							"id":current.attr("data-id"),
							"resourceType":"2",
							"isResource":"0",
							"isReject":"0",
							"isDelete":"0"
						});
					}
					
				}else if(current.children("i.checkbox").is(".icon1")){
					// 虚拟组织
					if(current.attr("data-vid")){
						outData.formal.push({
							"id":current.attr("data-orgid"),
							"resourceType":"2",
							"isResource":"0",
							"isReject":"0",
							"isDelete":"0",
							"vOrgId":current.attr("data-vid")
						});
					}else{
						outData.formal.push({
							"id":current.attr("data-id"),
							"resourceType":"2",
							"isResource":"0",
							"isReject":"0",
							"isDelete":"0"
						});
					}
					
				}else{

					current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem);

						if(child.is("i.icon0")){
							// 摄像机
							if(child.closest("li").attr("data-res") === "camera"){
								outData.temp.push({
									"id":child.closest("li").attr("data-id"),
									"resourceType":"2",
									"isResource":"1",
									"isReject":"0",
									"isDelete":"0"
								});

							}else{
								// 组织
								// 虚拟组织
								if(child.closest("li").attr("data-vid")){
									outData.temp.push({
										"id":child.closest("li").attr("data-orgid"),
										"resourceType":"2",
										"isResource":"0",
										"isReject":"0",
										"isDelete":"0",
										"vOrgId":child.closest("li").attr("data-vid")
									});
								}else{
									outData.temp.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"0",
										"isReject":"0",
										"isDelete":"0"
									});
								}

							}
									
						}else if(child.is("i.icon1")){
							// 摄像机
							if(child.closest("li").attr("data-res") === "camera"){
								outData.formal.push({
									"id":child.closest("li").attr("data-id"),
									"resourceType":"2",
									"isResource":"1",
									"isReject":"0",
									"isDelete":"0"
								});

							}else{
								// 组织
								// 虚拟组织
								if(child.closest("li").attr("data-vid")){
									outData.formal.push({
										"id":child.closest("li").attr("data-orgid"),
										"resourceType":"2",
										"isResource":"0",
										"isReject":"0",
										"isDelete":"0",
										"vOrgId":child.closest("li").attr("data-vid")
									});
								}else{
									outData.formal.push({
										"id":child.closest("li").attr("data-id"),
										"resourceType":"2",
										"isResource":"0",
										"isReject":"0",
										"isDelete":"0"
									});
								}
							}
									
						}else{
							// 只遍历展开过的
							if(child.closest("li").attr("data-loaded")){
								caller(child.closest("li"));
							}
							
						}
					});

				}
				
			})(jQuery(self.options.node).children("ul").children("li"));

			return outData;

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
			this.updateScrollBar();
		},
		/*
		*	输出改变的数据
		*/ 
		getOutPutData:function(){
			if(this.options.mode ==="create"){
				return this.getCreateData();
			}else if(this.options.mode ==="edit"){
				return this.getEditData();
			}else{
				return [];
			}
		},
		/*
		*	初始化默认勾选改部门下的资源
		*/
		selectEl:function(){
			// 默认将当前所在组织勾选
			var self = this;

			if(self.options.mode === "create"){
				// 默认勾选该组织
				if(self.options.orgId){
					jQuery(self.options.node).find("li[data-id='"+self.options.orgId+"']").each(function(index,item){
						var el = jQuery(item);
						if(el.attr("data-res") === "org"){
							var checkbox = el.children("i.checkbox");
							if(!checkbox.hasClass("icon1") && !checkbox.attr("data-check")){
								checkbox.addClass("icon1");
								checkbox.attr("data-check","1");
							}
						}
					});
				}

			}else{
				// 编辑状态，勾选默认值

				var orgs = self.options.defaultOrgs;
				var cameras = self.options.defaultCameras;

				// 正式组织
				for(var i = orgs.formal.length-1;i>=0;i--){
					// 默认组织勾选 并添加 data-default 属性
					jQuery(self.options.node).find("li[data-id='"+orgs.formal[i]+"']").each(function(index,item){
						var el = jQuery(item);
						if(el.attr("data-res") === "org"){
							var checkbox = el.children("i.checkbox");
							if(!checkbox.hasClass("icon1") && !checkbox.attr("data-check")){
								checkbox.addClass("icon1").removeClass("icon0");
								checkbox.attr("data-check","1");
							}
							el.attr("data-default","1");
						}
					});
				}

				// 临时组织
				for(var i1 = orgs.temp.length-1;i1>=0;i1--){
					// 默认组织勾选 并添加 data-default 属性
					jQuery(self.options.node).find("li[data-id='"+orgs.temp[i1]+"']").each(function(index,item){
						var el = jQuery(item);
						if(el.attr("data-res") === "org"){
							var checkbox = el.children("i.checkbox");
							if(!checkbox.hasClass("icon0") && !checkbox.attr("data-check")){
								checkbox.addClass("icon0").removeClass("icon1");
								checkbox.attr("data-check","1");
							}
							el.attr("data-default","0");
						}
					});
				}

				//筛选摄像机(正式)

				for(var j = cameras.formal.length-1;j>=0;j--){

					// 默认摄像机勾选 并添加 data-default 属性
					jQuery(self.options.node).find("li[data-id='"+cameras.formal[j]+"']").each(function(index,item){
						var el = jQuery(item);

						if(el.attr("data-res") === "camera"){
							var checkbox = el.children("i.checkbox");
							if(!checkbox.hasClass("icon1") && !checkbox.attr("data-check")){
								checkbox.addClass("icon1").removeClass("icon0");
								checkbox.attr("data-check","1");

							}
							el.attr("data-default","1");
						}
					});
				}
				// 临时 摄像机
				for(var j1 = cameras.temp.length-1;j1>=0;j1--){
					// 默认摄像机勾选 并添加 data-default 属性
					jQuery(self.options.node).find("li[data-id='"+cameras.temp[j1]+"']").each(function(index,item){
						var el = jQuery(item);
						if(el.attr("data-res") === "camera"){
							var checkbox = el.children("i.checkbox");
							if(!checkbox.hasClass("icon0") && !checkbox.attr("data-check")){
								checkbox.addClass("icon0").removeClass("icon1");
								checkbox.attr("data-check","1");
							}
							el.attr("data-default","0");
						}
					});
				}

			}

			
			
		},
		/**
		 * 构建url地址  添加额外的参数
		 */
		addExtraParams:function(url,params){
			if(url.indexOf("?") !== -1){
				url = url + "&" + jQuery.param(params);
			}else{
				url = url + "?" + jQuery.param(params);
			}
			return url;
		},
		/*
		 *	向页面中添加html
		 */
		appendHTML:function(receiveData,receiveData2,parentNode,context,init){
			parentNode.attr("data-loaded",1);
			var level = 1;
			if(!init){
				level = parseInt(parentNode.attr("data-tree-level"),10)+1;
			}
			if(context.options.selectable){
				if(parentNode.children("i.checkbox").is("i.icon0")){
					parentNode.append(context.render({"orgs":receiveData,"level":level,"cameras":receiveData2,"init":init,"selected":"icon0","selectable":context.options.selectable,"size":receiveData.length}));
				}else if(parentNode.children("i.checkbox").is("i.icon1")){
					parentNode.append(context.render({"orgs":receiveData,"level":level,"cameras":receiveData2,"init":init,"selected":"icon1","selectable":context.options.selectable,"size":receiveData.length}));
				}else{
					parentNode.append(context.render({"orgs":receiveData,"level":level,"cameras":receiveData2,"init":init,"selected":"","selectable":context.options.selectable,"size":receiveData.length}));
				}
			}else{
				parentNode.append(context.render({"orgs":receiveData,"level":level,"cameras":receiveData2,"init":init,"selectable":context.options.selectable,"size":receiveData.length}));
			}
			if(this.options.selectable){
				this.selectEl();
			}

			context.updateScrollBar();
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

			if(parseInt(params.masterOrgId,10) === 0){
				url =  self.options.rootUrl;
				params = null;
				getRootFlag = true;
			}
			if(self.options.queryKey !== ""){
				params.name = self.options.queryKey;
				url =  self.options.searchUrl;
				requestType = "post";
			}

			// 如果是虚拟组织
			if(parentNode.attr("data-vid")){
				url = self.addExtraParams(url,{"vOrgId":parentNode.attr("data-vid")});
			}
			
			jQuery.ajax({
				url:url,
				type:requestType,
				data:params,
				dataType:'json', 
				setTimeout:60000,
				beforeSend:function(){
					parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
				},
				success:function(res){
					var receiveData =[],cameras;
					if(getRootFlag){
						if(res && res.code === 200){
							receiveData = res.data.orgList || [];
							cameras = res.data.cameraList || [];

							if(receiveData.length === 0 && cameras.length ===0){
								parentNode.attr("data-loaded",1);
								parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
								self.updateScrollBar();
							}else{
								self.appendHTML(receiveData,cameras,parentNode,self,initFlag);
							}
						}

					}else{
						if(res && res.code === 200){
							receiveData = res.data.orgList || [];
							cameras = res.data.cameraList || [];

							if(receiveData.length === 0 && cameras.length ===0){
								parentNode.attr("data-loaded",1);
								parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
								self.updateScrollBar();
							}else{
								self.appendHTML(receiveData,cameras,parentNode,self,initFlag);
							}
						}
					}
					
				},
				error:function(){
					notify.warn("网络或服务器异常！");
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
								self.loadData({"masterOrgId":current.attr("data-id")},current,false);
							}else{
								self.toggle(current.children("ul"));
							}
						}
						current.toggleClass("active");
						return false;
					});

				}
			});
		}
	});
























