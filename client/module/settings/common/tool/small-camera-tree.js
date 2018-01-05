/**
 * 
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02 
 * @description  用户权限微调 资源树
 */

define(["ajaxModel","base.self"], function(ajaxModel){

	var SmallCameraTree = new Class({
		Implements: [Events, Options],
		options: {
			url:"/service/resource/get_camera_orgs_by_parent",  //根据父元素id获取子元素
			rootUrl:"/service/resource/get_root_camera?isRoot=" + window.sysConfig.getResMode(),   //获取根
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
			ajaxModel.getData(self.options.getParentsUrl, {
				orgId: currentOrgId
			}).then(function(res) {
				if (res.code === 200) {
					self.options.orgPathList = res.data.orgPathList.reverse();
				} else {
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

			Handlebars.registerHelper('hasNoRight', function(cameraScore,options) {
				var userScore = $("#userEntry").attr("data-score") - 0;
				return userScore < cameraScore ? "disabled" : "";
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
		/**
		 * 分多次插入dom结构 防止浏览器卡死
		 * @author chencheng
		 * @date   2015-03-23
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		multiInsertDom:function(params,callback){
			var cameras = params.cameras,
				parentNode = params.parentNode,
				pSize = 30,
				curPage = 1,
				pages = Math.ceil(cameras.length / pSize);

				delete params.parentNode;
				delete params.cameras;

			// 如果返回数据中包含组织和摄像机，先处理组织
			if(params.orgs.length > 0){
				parentNode.append(params.context.render(params));
				if(pages === 0){
					callback();		// 只有组织
				}
			}

			delete params.orgs;
			
			(function(){
				var caller = arguments.callee ,
					temArr = cameras.slice((curPage - 1) * pSize, curPage * pSize);

				params.cameras = temArr;
				parentNode.append(params.context.render(params));

				if(curPage <= pages){
					if(curPage ===  pages){
						callback();
						return;
					}
					curPage ++;
					setTimeout(caller,100);
				}
			})();
		},
		/*
		 *	向页面中添加html
		 */
		appendHTML:function(receiveData,receiveData2,parentNode,context,init){
			parentNode.attr("data-loaded",1);
			var level = 1,
				selectClass = "";
			if(!init){
				level = parseInt(parentNode.attr("data-tree-level"),10)+1;
			}

			if(context.options.selectable){
				if(parentNode.children("i.checkbox").is("i.icon0")){
					selectClass = "icon0";
				}else if(parentNode.children("i.checkbox").is("i.icon1")){
					selectClass = "icon1";
				}
			}

			context.multiInsertDom({
				"orgs":receiveData,
				"cameras":receiveData2,
				"level":level,
				"init": init,
				"context":context,
				"selectable": context.options.selectable,
				"selected": selectClass,
				"parentNode":parentNode
			},function(){

				if(context.options.selectable){
					context.selectEl();
				}
				context.updateScrollBar();
				context.bindEvent(parentNode,init);
			});

			
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
				type:requestType,
				setTimeout:60000,
				beforeSend:function(){
					parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
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

	return SmallCameraTree;
});
