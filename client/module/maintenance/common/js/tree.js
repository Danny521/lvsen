/**
 * Created by NetPosa on 14-1-23.
 * 组织机构树
 */
define(["jquery","base.self","mootools","handlebars"],function(){
	window.Tree = new Class({
		Implements: [Events, Options],
		options: {
			url:"/service/org/get_child_orgs_by_parent",
			rootUrl:"/service/org/get_root_org?",
			/*url:"/data_makeup/get_camera_orgs_by_parent.json",
			rootUrl:"/data_makeup/get_root_org.json",*/
			searchUrl:"/service/org/get_child_orgs_by_name",
			templateUrl:"/module/maintenance/common/inc/cameraTree.html",
			node:".treePanel",
			template:null,
			queryKey:"",
			scrollbar:null,
			scrollbarNode:".scrollbarPanel",
			selectable:false,
			defaultRootId:0,
			nodeHeight:"400",
			leafClick:jQuery.noop,
			leafDblClick:jQuery.noop,
			treeClick:jQuery.noop,
			treeDblClick:jQuery.noop,
			callback:jQuery.noop
		},
		initialize: function(options) {
			this.setOptions(options);
			// scrollbar 默认scroll容器的类名为 scrollbarPanel
			var tem = this.options;
			jQuery(tem.node).height(Object.prototype.toString.call(tem.nodeHeight) === "[object Function]" ? tem.nodeHeight() : tem.nodeHeight);
			//tem.scrollbar = jQuery(tem.node).html("").closest("div"+ tem.scrollbarNode);
			//tem.scrollbar.tinyscrollbar({sizethumb: 72});

			jQuery(this.options.node).html("");
			this.loadTemplate();
		},
		reload:function(options){
			var tem = this.options;
			jQuery(tem.node).html("");
			tem.queryKey ="";
			this.loadData({"parentId":tem.defaultRootId},jQuery(tem.node),true,false);
		},
		search:function (options) {
			this.setOptions(options);
			var tem = this.options;
			jQuery(tem.node).html("");
			if(tem.queryKey !=""){
				this.loadData({"name":tem.queryKey},jQuery(tem.node),false,true);
			}else{
				this.reload();
			}
		},
		loadTemplate:function() {
			var self  = this;
			jQuery.get(self.options.templateUrl,function(tmp){
				var tem = self.options;
				self.addHelper();
				tem.template = Handlebars.compile(tmp);
				self.loadData({"parentId":self.options.defaultRootId},jQuery(tem.node),true,false);
			});
		},
		addHelper:function(){
			Handlebars.registerHelper('isTree', function(type,options) {
				if(type == "tree"){return options.fn();	}
			});
			Handlebars.registerHelper("mills2str", function(num) {
				// 依赖base.js Toolkit
				return Toolkit.mills2str(num);
			});
	        Handlebars.registerHelper('hasNo', function(number,options) {
	            return number ? "(" + number + ")" : "";
	        });
	        Handlebars.registerHelper('isVirtual', function(strId,options) {
	            if(strId && strId.indexOf("vorg")>0){
	                return "(本部)";
	            }
	        });
		},
		updateLiSpan:function (params) {
			if(params){
				var id = params.id;
				var li = jQuery(this.options.node).find("li[data-id="+id+"]");
				li.attr("data-id",params.level);
				li.attr("data-level",params.level);
				li.attr("data-departid",params.level);
				li.attr("data-exp",params.level);
				li.attr("data-des",params.level);
				li.attr("data-name",params.level);

			}
			var newDepart = {
				parentId: steps[steps.length - 1].id,
				name: jQuery("#createDepart input#name").val().trim(),
				orgCode: jQuery("#createDepart input#number").val().trim(),
				level: jQuery("#createDepart select#rank option:selected").val(),
				dueDate: jQuery("#createDepart input#expireDate").val(),
				description: jQuery("#createDepart #description").val()
			};
		},
		refresh:function(id){
			// var el = jQuery(this.options.node).find("li[data-id='"+id+"']");
			// var parentId = id;
			// var curEl = el;
			// var foldFlag = false;
			// if(el.attr("data-type") == "leaf"){
			// 	parentId = el.closest("ul").closest("li").attr("data-id");
			// 	el.closest("ul").closest("li").children("ul").remove();
			// 	curEl = el.closest("ul").closest("li");
			// 	foldFlag = true;
			// }else{
			// 	el.children("ul").remove();
			// }
			// if(curEl.has(".root")){
			// 	this.reload();
			// }
			// if(foldFlag){
			// 	this.loadData({"parentId":parentId},curEl,false);
			// }
		},
		render:function(data){
			return this.options.template(data);
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
				if(current.attr("data-type") == "tree"){
					if(!current.attr("data-loaded")){
						self.loadData({"parentId":current.attr("data-id")},current,false,false);
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
			//顶级目录加载时候的回调
			self.options.callback(target);

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

		//向上查找


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
		//向下查找


		walkDown:function(item){
			var caller = arguments.callee;
			var current = item;
			if(current.closest("li").is("li.tree")){
				if(! current.is(".selected")){
					current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem)
						child.removeClass("selected");
						caller(child);
					});
				}else{
					current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						var child = jQuery(tem)
						if(!child.is("i.selected")){
							child.addClass("selected");
						}
						caller(child);
					});
				}
			}
		},
		//添加点击样式


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
		//处理叶子节点点击事件


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
		//控制元素的显示/隐藏


		toggle:function(el){
			if(el.css("display") == "none"){
				el.css("display","block");
			}else{
				el.css("display","none");
			}
			//this.updateScrollBar();
		},
		//向页面中添加html


		appendHTML:function(receiveData,parentNode,context,init){
			parentNode.attr("data-loaded",1);
			if(context.options.selectable){
				if(parentNode.children("i.checkbox").is("i.selected")){
					parentNode.append(context.render({"orgs":receiveData,"init":init,"selected":"selected","selectable":context.options.selectable,"size":receiveData.length}));
				}else{
					parentNode.append(context.render({"orgs":receiveData,"init":init,"selected":"","selectable":context.options.selectable,"size":receiveData.length}));
				}
			}else{
				parentNode.append(context.render({"orgs":receiveData,"init":init,"selectable":context.options.selectable,"size":receiveData.length}));
			}
			//context.updateScrollBar();
			context.bindEvent(parentNode,init);
		},
		//加载数据


		loadData:function(params,parentNode,initFlag,searchFlag){
			// 解决click事件 防止重复请求
			parentNode.children("i.fold").unbind("click");

			var self = this,
				url = self.options.url,
				getRootFlag = false,
				requestType = "get";

			if(params.parentId == 0){
				url =  self.options.rootUrl;
				params = null;
				getRootFlag = true;
			}
			if (searchFlag === true) {
				if(self.options.queryKey != ""){
					params.name = self.options.queryKey;
					url =  self.options.searchUrl;
					requestType = "post";
				}
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
					if(getRootFlag){
						if(res && res.code === 200 && res.data.org){
							var receiveData = [res.data.org] || [];
							self.appendHTML(receiveData,parentNode,self,initFlag);
						}else{
							parentNode.attr("data-loaded",1);
							parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
						}

					}else{
						if(res && res.code === 200 && res.data.orgs.length > 0){
							var receiveData = res.data.orgs || [];
							//self.appendHTML(receiveData,parentNode,self,initFlag);
							if(searchFlag && params.name){
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
	                parentNode.trigger("treeExpandSuccess");

				},
				error:function(){
					notify.warn("网络或服务器异常！");
					parentNode.attr("data-loaded",1);
					parentNode.append("<ul><li><div class='error-no-data'><p>网络或服务器异常,</p><p>摄像机列表加载失败！</p></div></li></ul>");
				},
				complete:function(){
					if(parentNode.children("ul#loading")){
						parentNode.children("ul#loading").remove();
					}
					// 回复click事件
					parentNode.children("i.fold").on("click",function(event){
						// self.processTreeClick(jQuery(this));
						var current = jQuery(this).closest("li");
						if(current.attr("data-type") == "tree"){
							if(!current.attr("data-loaded")){
								self.loadData({"parentId":current.attr("data-id")},current,false,false);
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
});
