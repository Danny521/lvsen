/**
 * 
 * @description  用户权限微调 交通管理组织树
 */

define(["ajaxModel","base.self"], function(ajaxModel){

	var PvdTree = new Class({
		Implements: [Events, Options],
		options: {
			url:"/pvdservice/traffic/tree/subOrgsAndMonitors",  //根据父元素id获取子元素
			rootUrl:"/pvdservice/traffic/tree/root",   //获取根组织
			node:".treePanel",	//容器选择符
			templateUrl:"/module/settings/usermgr/inc/pvd-orgs-tree.html",		//模板路径
			template:null,
			scrollbar:null,
			scrollbarNode:"#aside .scrollbarPanel",
			selectable:true,
			pvdOrgId: -1,
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
			
			jQuery(this.options.node).empty();
			// 加载模板
			this.loadTemplate();
		},
		loadTemplate:function() {
			var self  = this;
			ajaxModel.getTml(self.options.templateUrl).then(function(tmp){
				var tem = self.options;
				// 注册助手
				self.addHelper();
				tem.template = Handlebars.compile(tmp);
				// 初始化加载数据
				self.loadData(null,jQuery(tem.node),true);
			});
			
		},
		addHelper:function(){
			Handlebars.registerHelper('isRoot', function(parentId) {
				if (parentId === "-1") {
					return "root";
				}

				return "tree";
			});
			
			Handlebars.registerHelper('isChecked', function(pvdOrgId, parentId, id) {
				if (pvdOrgId === -1 && parentId === "-1") {
					return "icon1";
				}

				if (id-0 === pvdOrgId) {
					return "icon1";
				}

				return "";
			});

			
		},
		render:function(data){
			return this.options.template(data);
		},
		bindEvent:function(parentNode,initFlag){
			var self = this;
			var target = parentNode.find("ul li.org span");
			if(initFlag){
				target = parentNode.find("ul li span");
			}
			// // 树节点 span单击事件
			// target.on("click",function(event){
			// 	self.addClickEffect(jQuery(this));
			// 	self.processTreeClick(jQuery(this));
			// 	return false;
			// });

			// // 树节点 span双击事件
			// target.on("dblclick",function(event){
			// 	self.processTreeDblClick(jQuery(this));
			// });

			// + 点击事件
			target.closest("li").children("i.fold").click(function(){
				var current = jQuery(this).closest("li");
				if(current.attr("data-havesuborg") === "true"){
					if(!current.attr("data-loaded")){
						self.loadData({"id":current.attr("data-id")},current,false);
					}else{
						self.toggle(current.children("ul"));
					}
				}
				current.toggleClass("active");
				return false;
			});

			// 选择框点击事件
			if(self.options.selectable){
				parentNode.find("li>i.checkbox").click(function(){
					jQuery(self.options.node).find("i.checkbox").removeClass('icon1');
					jQuery(this).toggleClass("icon1");
					return false;
				});
			} 
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
		},
		/*
		 *	向页面中添加html
		 */
		appendHTML:function(receiveData,parentNode,context,init){
			parentNode.attr("data-loaded",1);
			
			parentNode.append(context.render({
				orgs: receiveData,
				init: init,
				pvdOrgId: context.options.pvdOrgId
			}));

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
			// 如果没有查询参数，则默认为请求根节点
			if(!params){
				url =  self.options.rootUrl;
				params = null;
				getRootFlag = true;
			}

			var custom = {
				type:requestType,
				setTimeout:60000,
				beforeSend:function(){
					parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
				},
				complete:function(){
					if(parentNode.children("ul#loading")){
						parentNode.children("ul#loading").remove();
					}
					// 恢复click事件
					parentNode.children("i.fold").on("click",function(event){
						var current = jQuery(this).closest("li");
						if(current.attr("data-havesuborg") === "true"){
							if(!current.attr("data-loaded")){
								self.loadData({"id":current.attr("data-id")},current,false);
							}else{
								self.toggle(current.children("ul"));
							}
						}
						current.toggleClass("active");
						return false;
					});
				}
			};

			ajaxModel.getData(url, params, custom).then(function(res) {
				var receiveData = [];
				if (getRootFlag) {
					if (res && res.code === 200) {
						receiveData = res.data.orgs || [];

						if (receiveData.length === 0) {
							parentNode.attr("data-loaded", 1);
							parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
						} else {
							window.pvdOrgRootId = receiveData[0].id;
							self.appendHTML(receiveData, parentNode, self, initFlag);
						}
					}
				} else {
					if (res && res.code === 200) {
						receiveData = res.data.subOrgs || [];

						if (receiveData.length === 0) {
							parentNode.attr("data-loaded", 1);
							parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
						} else {
							self.appendHTML(receiveData, parentNode, self, initFlag);
						}
					}
				}
			}, function() {
				notify.warn("获取交通管理组织失败，网络或服务器异常！");
			});
		}
	});

	return PvdTree;
});
