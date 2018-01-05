/**
 * 
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02 
 * @description  设备管理摄像机选择树
 */

define(["ajaxModel","base.self"], function(ajaxModel){

	var CameraSelectTree = new Class({
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
			ajaxModel.getData(self.options.getParentsUrl,{"orgId":currentOrgId}).then(function(res){
				if(res.code === 200){
					self.options.orgPathList = res.data.orgPathList;
				}else{
					notify.warn("网络或服务器异常！");
				}
			});
		},
		loadTemplate:function() {
			var self  = this;
			ajaxModel.getTml(self.options.templateUrl).then(function(tmp){
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

			var custom = {
				setTimeout: 60000,
				type: requestType,
				beforeSend: function() {
					parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
				},
				complete: function() {
					if (parentNode.children("ul#loading")) {
						parentNode.children("ul#loading").remove();
					}
					// 回复click事件
					parentNode.children("i.fold").on("click", function(event) {
						// self.processTreeClick(jQuery(this));
						var current = jQuery(this).closest("li");
						if (current.attr("data-type") === "tree") {
							if (!current.attr("data-loaded")) {
								self.loadData({
									"masterOrgId": current.attr("data-id")
								}, current, false);
							} else {
								self.toggle(current.children("ul"));
							}
						}
						current.toggleClass("active");
						return false;
					});
				}
			};

			ajaxModel.getData(url, params, custom).then(function(res) {
				var receiveData = [],
					cameras;
				if (getRootFlag) {
					if (res && res.code === 200) {
						receiveData = res.data.orgList || [];
						cameras = res.data.cameraList || [];
						if (receiveData.length === 0 && cameras.length === 0) {
							parentNode.attr("data-loaded", 1);
							parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
							self.updateScrollBar();
						} else {
							self.appendHTML(receiveData, cameras, parentNode, self, initFlag);
						}
					}

				} else {
					if (res && res.code === 200) {
						receiveData = res.data.orgList || [];
						cameras = res.data.cameraList || [];
						if (receiveData.length === 0 && cameras.length === 0) {
							parentNode.attr("data-loaded", 1);
							parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
							self.updateScrollBar();
						} else {
							self.appendHTML(receiveData, cameras, parentNode, self, initFlag);
						}
					}
				}

			}, function() {
				notify.warn("网络或服务器异常！");
			});
			
		}
	});

	return CameraSelectTree;
});
