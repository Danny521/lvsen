/**
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02
 * @description  地图配置左侧资源树  
 */
define(["ajaxModel", "base.self","handlebars"], function(ajaxModel) {
	var CameraTree = new Class({
		Implements: [Events, Options],
		options: {
			url: "/service/video_access_copy/list_cameras", //根据父组织获取子组织
			rootUrl: "/service/video_access_copy/list_cameras", //获取根组织
			searchUrl: "/service/video_access_copy/search_camera", //根据组织名搜索
			searchCameraUrl: "/service/video_access_copy/search_only_camera", //高级搜索 只搜摄像头
			templateUrl: "/module/settings/common/tool/camera.html",
			getParentsUrl: "/service/resource/get_org_path", // 获取父节点路径  [用于自动展开]
			node: ".treePanel",
			template: null,
			queryKey: "",
			isMarked: "", // 已标注[1] or 未标注[0]
			scrollbar: null,
			type: "org",
			orgId: null, // 当前组织id
			orgPathList: [], // 当前组织路径
			selectable: false,
			defaultRootId: 0,
			leafClick: jQuery.noop,
			leafDblClick: jQuery.noop,
			treeClick: jQuery.noop,
			treeDblClick: jQuery.noop,
			thumbSize: 72,
			extraParams: null // 用于存储一些额外的参数 [用于数据过滤]
		},
		initialize: function(options) {
			this.setOptions(options);
			var tem = this.options;
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
			debugger
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
				if (tem.isMarked !== "") {
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
			}
		},
		getOrgPathList: function(currentOrgId) {
			var self = this;
			ajaxModel.getData(self.options.getParentsUrl, {
				orgId: currentOrgId
			}, {
				async: false
			}).then(function(res) {
				if (res.code === 200) {
					self.options.orgPathList = res.data.orgPathList.reverse();
					// 保存当前组织及下属组织id 用于权限判断
					self.orgChilds = res.data.childs ? res.data.childs : [];

				} else {
					notify.warn("网络或服务器异常！");
				}
			});		
		},
		loadTemplate: function() {
			var self = this;
			ajaxModel.getTml(self.options.templateUrl).then(function(tmp){
				var tem = self.options;
				self.addHelper();
				tem.template = Handlebars.compile(tmp);
				self.loadData(null, jQuery(tem.node), true);
			});
		},
		addHelper: function() {
			Handlebars.registerHelper('isTree', function(type, options) {
				if (type === "group") {
					return options.fn();
				}
			});
			Handlebars.registerHelper('isGroup', function(type, code, options) {
				return code !== null && type !== "group" ? "(" + code + ")" : "";
			});
			Handlebars.registerHelper('isMarked', function(lat, lon, type, options) {
				if (type === 1) {
					if (lon !== null || lat !== null) {
						return ' dom-marked';
					}
				} else {
					if (lon !== null || lat !== null) {
						return ' marked';
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
			Handlebars.registerHelper('hasNoRight', function(cameraScore,options) {
				var userScore = $("#userEntry").attr("data-score") - 0;
				return userScore < cameraScore ? "disabled" : "";
			});
		},
		/*
		 *	部门相关操作->更新左侧的树     删除[delete]  新增[create]  修改[edit]
		 */
		updateLiSpan: function(type, params) {
			var self = this;
			var el = jQuery(this.options.node).find("li[data-id=" + params.id + "]");
			if (type === "delete") {
				var parent = el.closest("ul").closest("li");
				parent.removeClass("active").removeAttr("data-loaded");
				parent.children("ul").html("");
				parent.children("i.fold").click();
			} else if (type === "edit") {
				el.attr("data-id", params.id).attr("data-name", params.name).attr("data-departid", params.parentId);
				el.children("span.name").html(params.name);
				el.children("span").attr("title", params.name);
			} else if (type === "create") {
				// 如果当前部门已展开 就重新加载改节点
				if (el.children("i.fold").length !== 0) {
					if (el.attr("data-loaded")) {
						el.children("ul").html("");
						el.removeAttr("data-loaded").removeClass("active");
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
		},
		render: function(data) {
			return this.options.template(data);
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
			parentNode.find("ul li.leaf").on("click", function(event) {
				self.addClickEffect(jQuery(this));
				self.processLeafClick(jQuery(this), event);
				return false;
			});
			// 叶子节双击事件
			parentNode.find("ul li.leaf").on("dblclick", function(event) {
				self.processLeafDblClick(jQuery(this));
				return false;
			});
			// 叶子节点前的图片点击事件
			parentNode.find("ul li.leaf i.leaf").on("click", function(event) {
				// 直接调用span的点击事件
				self.processLeafClick(jQuery(this).closest("li").children("span"));
				return false;
			});
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
			if (self.options.orgPathList && self.options.orgPathList.length > 0) {
				jQuery(self.options.node).find("li").each(function(index, item) {
					var orgId = jQuery(item).attr("data-id");
					if (orgId && orgId.match(/\d+/)[0] == self.options.orgPathList[0]) {

						self.options.orgPathList.shift();
						jQuery(item).children("i.fold").click();
						jQuery(item).children("span").click();

					}
				});
			}
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
			// node.find("li").removeClass("cur");  不改自己点选图标
			node.removeClass("cur").find("li").removeClass("cur");

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
		appendHTML: function(receiveData, parentNode, context, init) {

			parentNode.attr("data-loaded", 1);
			var level = 1;
			if (!init) {
				level = parseInt(parentNode.attr("data-tree-level"),10) + 1;
			}
			
			var selectClass = "";
			if (parentNode.children("i.checkbox").is("i.selected")) {
				selectClass = "selected";
			}

			context.multiInsertDom({
				"context":context,
				"cameras":receiveData,
				"level":level,
				"init": init,
				"selectable": context.options.selectable,
				"selected": selectClass,
				"parentNode":parentNode
			},function(){
				context.bindEvent(parentNode, init);
			});

			// 之前的方案 
			// parentNode.append(context.render({
			// 	"cameras": receiveData,
			// 	"level": level,
			// 	"init": init,
			// 	"selected": selectClass,
			// 	"selectable": context.options.selectable,
			// 	"size": receiveData.length
			// }));
				
			
			
		},

		/*获取视频资源组织树org的已标注数量,未标注数量,保存在localStorage中*/
		markCount:function() {
			debugger
		jQuery.ajax({
			url: "/service/video_access_copy/getCameraLonglatitudeStatistics",
			data: {},
			cache: false,
			type: 'get',
			async: false,
			success: function (res) {
				if (res.code === 200) {
					window.localStorage.setItem('markCount', JSON.stringify(res.data));
				} else {
					//console.log("获取在离线数量失败！");
				}
			},
			error: function(res){
				//console.log("获取在离线数量失败！");
			}
		});
	    },

		getmarkCount:function(id, callback) {
			var str = window.localStorage.getItem('markCount');
			var empty = {
				"havaLonglatitudeCount": 0,
				"noLonglatitudeCount": 0
			};
			if (str !== null) {
				var map = JSON.parse(window.localStorage.getItem('markCount'));
				if (map[id]) {
					callback & callback(map[id]);
				} else {
					callback & callback(empty);
				}
			} else {
				//如果没有存储，则演示500毫秒请求
				// window.setTimeout(function(){
				// 	this.getmarkCount(id, callback);
				// }, 100);
			}
		},

		markCountShow:function(node){
			var self = this;
			var lis = node.find('.tree[data-type="tree"]');
debugger
			jQuery.each(lis, function(index, elm) {
				debugger
				var id = jQuery(elm).data('id');
				self.getmarkCount(id, function(data) {
					var box = jQuery(elm).children('.statistics');
					// box.find('.online-count').text(data.havaLonglatitudeCount);
					// box.find('.offline-count').text(data.noLonglatitudeCount);
					// box.find('.all-count').text(data.totalCount);
					//当选择下拉框之后，再点击树节点
					var markSel = jQuery(".markStatus option:selected").val()
					if(markSel == "0"){
						box.find('.offline-count').text(data.noLonglatitudeCount);
						jQuery('.statistics .offline-statistic').show().siblings().not(".use").hide();
						jQuery('.statistics .offline-statistic').css("display","inline-block");
					}else if(markSel == "1"){
						box.find('.online-count').text(data.havaLonglatitudeCount);
						jQuery('.statistics .online-statistic').show().siblings().not(".use").hide();
					}else{
						box.find('.online-count').text(data.havaLonglatitudeCount);
						box.find('.offline-count').text(data.noLonglatitudeCount);
						box.find('.all-count').text(data.totalCount);
						jQuery('.statistics .online-statistic,.statistics .all-statistic').show();
						jQuery('.statistics .offline-statistic').not(".use").hide();
					}
				});
			});
		},



		/*
		 *	加载数据
		 */
		loadData: function(params, parentNode, initFlag) {
			// 解决click事件 防止重复请求
			parentNode.children("i.fold").unbind("click");
			var self = this,
				url = self.options.url + "?type=" + self.options.type,
				getRootFlag = false,
				requestType = "get";
			if (initFlag) {
				getRootFlag = true;
				url = self.options.rootUrl + "?type=" + self.options.type+ "&isRoot=1";
			}
			if (self.options.queryKey !== "") {
				params.key = self.options.queryKey;
				url = self.options.searchUrl;
				requestType = "get";
				self.options.queryKey = "";
			}
			if (self.options.isMarked !== "") {
				params.queryKey = self.options.queryKey;
				url = self.options.searchCameraUrl;
				requestType = "get";
				self.options.isMarked = "";
				self.advSearchFlag = true;
			}
			//已标注时sign=0，未标注sign=1，全部不变
			var markSel = jQuery(".markStatus option:selected").val()
			if(markSel == "0"){
				params.sign = 1;
			}else if(markSel == "1"){
				params.sign = 0;
			}
			if (self.options.extraParams) {
				url = self.addExtraParams(url);
			}
			if (self.requestObj) {
				ajaxModel.abortAjax(url);
			}
			var custom = {
				type: requestType,
				setTimeout: 60000,
				beforeSend: function(jhr) {
					parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
				},
				complete: function() {
					if (parentNode.children("ul#loading")) {
						parentNode.children("ul#loading").remove();
					}
					// 恢复click事件
					parentNode.children("i.fold").on("click", function(event) {
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
			};

			self.requestObj = ajaxModel.getData(url, params, custom).then(function(res) {
				var receiveData = [];
				debugger
				if (getRootFlag) {
					if (res && res.code === 200 && res.data.cameras) {
						debugger
						receiveData = res.data.cameras;
						self.appendHTML(receiveData, parentNode, self, initFlag);
					} else {
						parentNode.attr("data-loaded", 1);
						parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
					}
				} else {
					debugger
					if (res && res.code === 200 && res.data.cameras.length > 0) {
						receiveData = res.data.cameras;
						self.appendHTML(receiveData, parentNode, self, initFlag);
					} else {
						parentNode.attr("data-loaded", 1);
						parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
					}
				}
				// parentNode.triggerHandler("treeExpandSuccess");
				if (params && receiveData.length >= 50) {
				//if (params && params.key && receiveData.length >= 50) {
					notify.warn("搜索到的结果较多，默认显示50条，请使用更精确的关键字查询其他结果！");
					self.advSearchFlag = false;
				}
			},function(){
				// notify.warn("网络或服务器异常！");
			});
			self.markCount();
			setTimeout(function(){
				self.markCountShow($(".tree-container"));
			},100)
		}
	});
	return CameraTree;
});