/**
 * 布防任务设置专用组织树
 * @author leon.z
 * @date   2016-1-12
 */
define(['js/preventcontrol-global-var','jquery', 'mootools'], function(global) {
	var DefenseTree = new Class({
		Implements: [Events, Options],
		options: {
			// url:"/service/video_access/list_cameras",	//根据父组织获取子组织
			// rootUrl:"/service/video_access/list_cameras",			//获取根组织
			url: "/service/defence/limits",//"/service/video_access_copy/list_cameras", //根据父组织获取子组织
			rootUrl: "/service/defence/limits",//"/service/video_access_copy/list_cameras", //获取根组织
			searchUrl: "/service/video_access_copy/search_camera", //根据组织名搜索
			searchCameraUrl: "/service/video_access_copy/search_only_camera", //高级搜索 只搜摄像头
			templateUrl: "/module/protection-monitor/preventioncontrolmgr/inc/prevent-control-org-tree.html",
			getParentsUrl: "/service/resource/get_org_path", // 获取父节点路径
			node: ".treePanel",
			template: null,
			queryKey: "",
			isMarked: "", // 已标注[1] or 未标注[0]
			scrollbar: null,
			type: "org",
			scrollbarNode: "#aside .scrollbarPanel",
			selectable: false,
			defaultRootId: 0,
			orgId: null,
			leafClick: jQuery.noop,
			leafDblClick: jQuery.noop,
			treeClick: jQuery.noop,
			treeDblClick: jQuery.noop,
			dropDown: jQuery.noop,
			curOrgLevel: 1, //当前组织在树中的层级
			orgPathList: [], // 当前组织路径
			thumbSize: 72,
			extraParams: "soure=defence",
			callback: jQuery.noop
		},
		requestObj:null,
		initialize: function(options) {
			this.setOptions(options);
			// scrollbar 默认scroll容器的类名为 scrollbarPanel
			var tem = this.options;
			//tem.scrollbar = jQuery(tem.node).html("").closest("div" + tem.scrollbarNode);
			//tem.scrollbar.tinyscrollbar({thumbSize: tem.thumbSize});
			jQuery(this.options.node).html("");
			if (tem.orgId && tem.orgId !== "null") {
				this.getOrgPathList(tem.orgId);
			}
			this.loadTemplate();
		},
		reload: function(options) {
			var tem = this.options;
			jQuery(tem.node).html("");
			tem.queryKey = "";
			this.loadData({
				"parentId": tem.defaultRootId
			}, jQuery(tem.node), true);
		},
		search: function(options) {
			this.setOptions(options);
			var tem = this.options;
			jQuery(tem.node).html("");
			if (tem.queryKey !== "") {
				this.loadData({
					"key": tem.queryKey,
					"mark": tem.isMarked,
					"type": "org",
					"count": 50,
					"offset": 0
				}, jQuery(tem.node), false);
			} else {
				this.reload();
			}
		},
		/*
		 *	权限控制
		 */
		hasAccessPower: function(orgId) {
			return true;
			var result = false;
			// 本部门级下属部门id
			var childs = this.orgChilds;
			// 如果是上级部门
			for (var i = childs.length - 1; i >= 0; i--) {
				if (orgId == childs[i]) {
					result = true;
					break;
				}
			}
			return result;

		},
		// 获取当前组织路径  顶级>上级>当前
		getOrgPathList: function(currentOrgId) {
			var self = this;
			jQuery.ajax({
				url: self.options.getParentsUrl,
				type: "get",
				dataType: "json",
				async: false,
				data: {
					orgId: currentOrgId
				},
				success: function(res) {
					if (res.code === 200) {
						// self.options.orgPathList = self.cutOrgPath(res.data.orgPathList.reverse());
						self.options.orgPathList = res.data.orgPathList.reverse();

						// 保存当前组织及下属组织id 用于权限判断
						self.orgChilds = res.data.childs ? res.data.childs : [];

					} else {
						notify.warn("网络或服务器异常！");
					}
				}
			});

		},
		// 修改org path id [20,70,155]
		cutOrgPath: function(orgPath) {
			var currentOrg = jQuery("#userEntry").attr("data-orgid");
			if (orgPath.length <= 2) {
				return orgPath;
			} else {
				// 从当前组织的上一组织开始显示
				var index = orgPath.indexOf(parseInt(jQuery("#userEntry").attr("data-orgid"))) - 1;
				return orgPath.slice(index);
			}
			return [];
		},
		loadTemplate: function() {
			var self = this;
			jQuery.get(self.options.templateUrl, function(tmp) {
				var tem = self.options;
				self.addHelper();
				tem.template = Handlebars.compile(tmp);
				self.loadData(null, jQuery(tem.node), true);
			});
		},
		addHelper: function() {
			Handlebars.registerHelper('isTree1', function(type, options) {
				if (type === "group") {
					return options.fn();
				}
			});

			Handlebars.registerHelper('status', function(type, status, options) {
				if (type === 1) {
					if (status === 0) {
						return 'dom dom-marked';
					} else {
						return 'dom';
					}
				} else {
					if (status === 0) {
						return 'marked';

					} else {
						return '';
					}
				}

			});
			Handlebars.registerHelper('typeNameTransform', function(type, options) {
				if (type === "group") {
					return "tree";
				} else {
					return "leaf";
				}
			});

			Handlebars.registerHelper('eq', function(value1, value2, options) {

				if (value2 === value1) {
					return options.fn();
				} else {
					return options.inverse();
				}
			});

			Handlebars.registerHelper("mills2str", function(num) {
				// 依赖base.js Toolkit
				return Toolkit.mills2str(num);
			});
			Handlebars.registerHelper("isCode", function(str) {
				if (str) {
					return "(" + str + ")";
				}
			});
			/**
			 * [这个助手是用来影藏摄像机和组织本部的]
			 * @author Wang Xiaojun
			 * @date   2014-11-13
			 * @param  id   [组织id]
			 * @param  type [取到的类型，camera是摄像机，group是组织]
			 */
			Handlebars.registerHelper("isshow", function(id, type) {
				var newid = id + " ";
				if (type === "camera") {
					return "none";
				} else {
					if (newid.indexOf("vorg") !== -1) {
						return "none";
					}
				}
			});

			/*如果没有设置布防路数，则不显示路数*/
			Handlebars.registerHelper("SetLimit", function(count, options) {
				if (count !== -1) {
					return options.fn(this);
				}
			});

			Handlebars.registerHelper('isTree', function(type, options) {
				if (type === "tree") {
					return options.fn();
				}
			});


		},
		/*
		 *	部门相关操作->更新左侧的树
		 */
		// 删除[delete]  新增[create]  修改[edit]
		updateLiSpan: function(type, params) {
			var self = this;
			var el = jQuery(this.options.node).find("li[data-id=" + params.id + "]");
			if (type === "delete") {
				var parent = el.closest("ul").closest("li");
				parent.children("ul").html("");
				parent.removeClass("active");
				parent.removeAttr("data-loaded");
				parent.children("i.fold").click();

			} else if (type === "edit") {

				el.attr("data-id", params.id);
				el.attr("data-name", params.name);
				el.attr("data-departid", params.parentId);
				el.children("span.name").html(params.name);
				el.children("span").attr("title", params.name);

			} else if (type === "create") {

				// 如果当前部门已展开 就重新加载改节点
				if (el.children("i.fold").length !== 0) {
					if (el.attr("data-loaded")) {
						el.children("ul").html("");
						el.removeAttr("data-loaded");
						el.removeClass("active");
						el.children("i.fold").click();
					}
				} else {
					// 在叶子节点下添加子部门
					el.prepend("<i class='fold'></i>");
					el.removeClass("leaf").addClass("tree");
					el.attr("data-type", "tree");
					el.children("i.leaf").addClass("tree").removeClass("leaf");

					el.children("i.fold").click(function() {
						var current = jQuery(this).closest("li");
						if (current.attr("data-type") === "tree") {
							if (!current.attr("data-loaded")) {
								self.loadData({
									"id": current.attr("data-id")
								}, current, false);
							} else {
								self.toggle(current.children("ul"));
							}
						}
						current.toggleClass("active");
						return false;
					}).click();
				}
			}
			//this.updateScrollBar();
		},
		render: function(data) {
			return this.options.template(data);
		},
		updateScrollBar: function() {
			this.options.scrollbar.tinyscrollbar_update('relative');
		},
		dropDown: function(event, ui) {
			this.options.dropDown(event, ui);
		},
		bindEvent: function(parentNode, initFlag) {
			var self = this;
			var target = parentNode.find("ul li.tree span");
			if (initFlag) {
				target = parentNode.find("ul li span");
			}
			// 树节点 span单击事件
			target.on("click", function(event) {
				self.addClickEffect(jQuery(this));
				self.processTreeClick(jQuery(this));
				return false;
			});

			// 树节点 span双击事件
			target.on("dblclick", function(event) {
				self.processTreeDblClick(jQuery(this));
			});

			// + 点击事件
			target.closest("li").children("i.fold").click(function() {
				var current = jQuery(this).closest("li");
				if (current.attr("data-type") === "tree") {
					if (!current.attr("data-loaded")) {
						self.loadData({
							"id": current.attr("data-id")
						}, current, false);
					} else {
						self.toggle(current.children("ul"));
					}
				}
				current.toggleClass("active");

				return false;
			});

			// 叶子节点单击事件
			parentNode.find("ul li.leaf span").on("click", function(event) {
				self.addClickEffect(jQuery(this));
				self.processLeafClick(jQuery(this), event);
				return false;
			});

			// 叶子节双击事件
			parentNode.find("ul li.leaf span").on("dblclick", function(event) {
				self.processLeafDblClick(jQuery(this));
				return false;
			});



			// 叶子节点前的图片点击事件
			parentNode.find("ul li.leaf i.leaf").on("click", function(event) {
				// 直接调用span的点击事件
				self.processLeafClick(jQuery(this).closest("li").children("span"));
				return false;
			});

			self.options.callback(target);

			// 选择框点击事件
			if (self.options.selectable) {
				parentNode.find("li>i.checkbox").click(function() {
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
		autoExpand: function() {

			var self = this;

			// 当前部门 暂不展开  length > 0 即可展开
			if (self.options.orgPathList.length > 0) {
				jQuery(self.options.node).find("li").each(function(index, item) {
					if (jQuery(item).attr("data-id") === ("org_" + self.options.orgPathList[0])) {
						var el = jQuery(item);
						self.options.orgPathList.shift();
						el.children("i.fold").click();

						if (el.attr("data-id") === ("org_" + self.options.orgId)) {
							// self.options.curOrgLevel = el.attr("data-tree-level");
							el.children("span").click();
						}

					}
				});
			}

		},

		// 构建url地址  添加额外的参数
		addExtraParams: function(url) {
			var extraParams = this.options.extraParams;
			if (url.indexOf("?") !== -1) {
				url = url + "&" + jQuery.param(extraParams);
			} else {
				url = url + "?" + jQuery.param(extraParams);
			}
			return url;
		},

		/*
		 *	向上查找
		 */
		walkUp: function(item) {
			var current = item;
			var caller = arguments.callee;
			if (current.closest("li").is("li.root")) {
				return;
			}
			if (current.closest("li").is("li")) {
				var parent = current.closest("li").closest("ul").closest("li").children("i.checkbox");
				if (!current.is(".selected")) {
					parent.removeClass("selected");
					caller(parent);
				} else {
					var result = true;
					current.closest("li").siblings("li").children("i.checkbox").each(function(index, checkbox) {
						if (!jQuery(checkbox).is("i.selected")) {
							result = false;
						}
					});
					if (result) {
						item.closest("li").closest("ul").closest("li").children("i.checkbox").addClass("selected");
					}
					caller(parent);
				}
			}
		},
		/*
		 *	向下查找
		 */
		walkDown: function(item) {
			var caller = arguments.callee;
			var current = item;
			if (current.closest("li").is("li.tree")) {
				if (!current.is(".selected")) {
					current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index, tem) {
						var child = jQuery(tem);
						child.removeClass("selected");
						caller(child);
					});
				} else {
					current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index, tem) {
						var child = jQuery(tem);
						if (!child.is("i.selected")) {
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
		addClickEffect: function(element) {
			var node = element.closest("li");
			(function(el) {
				if (!el.is(".cur")) {
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
		processLeafClick: function(el, event) {
			this.options.leafClick(el, event);
		},
		processLeafDblClick: function(el) {
			this.options.leafDblClick(el);
		},
		processTreeClick: function(el) {
			this.options.treeClick(el);
		},
		processTreeDblClick: function(el) {
			this.options.treeDblClick(el);
		},
		/*
		 *	控制元素的显示/隐藏
		 */
		toggle: function(el) {
			if (el.css("display") === "none") {
				el.css("display", "block");
			} else {
				el.css("display", "none");
			}
			//this.updateScrollBar();
		},
		/*
		 *	向页面中添加html
		 */
		appendHTML: function(receiveData, parentNode, context, init) {
			parentNode.attr("data-loaded", 1);
			var level = 1;
			if (!init) {
				level = parseInt(parentNode.attr("data-tree-level")) + 1;
			}

			if (context.options.selectable) {
				if (parentNode.children("i.checkbox").is("i.selected")) {
					parentNode.append(context.render({
						"cameras": receiveData,
						"level": level,
						"init": init,
						"selected": "selected",
						"selectable": context.options.selectable,
						"size": receiveData.length
					}));
				} else {
					parentNode.append(context.render({
						"cameras": receiveData,
						"level": level,
						"init": init,
						"selected": "",
						"selectable": context.options.selectable,
						"size": receiveData.length
					}));
				}
			} else {
				parentNode.append(context.render({
					"cameras": receiveData,
					"level": level,
					"init": init,
					"selectable": context.options.selectable,
					"size": receiveData.length
				}));
			}

			//context.updateScrollBar();
			context.bindEvent(parentNode, init);
		},
		/*
		 *	加载数据
		 */
		loadData: function(params, parentNode, initFlag) {
			// 解决click事件 防止重复请求
			parentNode.children("i.fold").unbind("click");

			var self = this,
				url = self.options.url + "?type=" + self.options.type + "&isRoot="+ window.sysConfig.getResMode(),
				getRootFlag = false,
				// 增加一个变量在后面请求成功后用于判断到底是那种请求
				isSearch = true,
				requestType = "get";

			if (initFlag) {
				getRootFlag = true;
				isSearch = false;
				url = self.options.rootUrl + "?type=" + self.options.type + "&isRoot="+ window.sysConfig.getResMode();
			}

			if (self.options.queryKey !== "") {

				params.key = self.options.queryKey;
				url = self.options.searchUrl;
				requestType = "get";
				self.options.queryKey = "";
			}

			if (self.options.isMarked !== "") {
				params.mark = self.options.isMarked;
				url = self.options.searchCameraUrl;
				requestType = "get";
				self.options.isMarked = "";
			}

			if(self.requestObj && self.requestObj.status != 200){
				self.requestObj.abort();
			}

			// if(self.options.extraParams){
			// 	url = self.addExtraParams(url);
			// }

			self.requestObj=jQuery.ajax({
				url: url,
				type: requestType,
				data: params,
				dataType: 'json',
				setTimeout: 60000,
				beforeSend: function() {
					parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
				},
				success: function(res) {
					var receiveData = [];
					/**用于过滤最大布防设置**/
					for(var i = 0;i<res.data.length;i++){
						if(res.data[i].orgId==="-1" || res.data[i].orgId===-1){
							global.taskSetOptions.maxSetNum = res.data[i].maxDefenceTaskNumber;
							res.data.splice(i)
						}
					}
					if (getRootFlag) {
						if (res && res.code === 200 && res.data) {
							receiveData = res.data;
							self.appendHTML(receiveData, parentNode, self, initFlag);
						} else {
							parentNode.attr("data-loaded", 1);
							parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
							//self.updateScrollBar();
						}

					} else {
						if (res && res.code === 200 && res.data.length > 0) {
							receiveData = res.data;
							var list = [];
							for(var i = 0;i<receiveData.length;i++){
								if(receiveData[i].camera_type == null){
									list.push(receiveData[i]);
								}
							}
							if(list.length>0){
								if (params.key) {
									if (list.length > 49) {

										notify.warn("搜索到的结果较多，默认显示50条，请使用更精确的关键字查询其他结果！");
									}
									self.appendHTML(list.splice(0, 49), parentNode, self, initFlag);

								} else {
									self.appendHTML(list, parentNode, self, initFlag);
								}
							} else {
								parentNode.attr("data-loaded", 1);
								parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
							}
						} else {
							if (params.key) {
								parentNode.attr("data-loaded", 1);
								parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
							} else {

								/** 这样做就是在防控任务模块的树做成和组织树一样的效果，这个是业务
								 * 需要，这块的这个代码不能注释，注释掉的话，虽然第一次和组织树的
								 * 效果基本一致，但是后面点击的时候会出现bug (by wangxiaojun 2014-11-24)
								 */
								

								//上面的解决方案会后空白格出现，不美观，最后商议将暂无数据改为暂无组织
								parentNode.attr("data-loaded", 1);
								parentNode.append("<ul><li><div class='no-data'>暂无组织！</div></li></ul>");
							}
							//self.updateScrollBar();

						}
					}


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
									"parentId": current.attr("data-id")
								}, current, false);
							} else {
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
	return {
		preventControlOrgTree: DefenseTree
	}
});