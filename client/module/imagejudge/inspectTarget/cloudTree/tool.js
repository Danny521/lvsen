define(['base.self'],function(){
	var RT = new Class({
		Implements: [Events, Options],
		options: {
			url:"/service/pia/resource",
			rootUrl: "/service/pcm/get_tree_list", //获取根
			templateUrl: "/module/imagejudge/inspectTarget/cloudTree/cTree.html", //模板路径
			insertUrl: "",
			source:1,
			type:1,/*资源种类：1,全部 2,案事件 3,视频*/
			node: ".treePanel", //容器选择符
			template: null,
			queryKey: "",
			fileType: "", //资源类型 [1:视频	2:图片	"":all]
			scrollbar: null,
			scrollbarNode: "#aside .scrollbarPanel",
			selectable: false,
			selectType:"radio",// [checkbox:多选   radio:单选]
			defaultRootId: '',
			// leafClick:jQuery.noop,
			// leafDblClick:jQuery.noop,
			// treeClick:jQuery.noop,
			callback: jQuery.noop //	确定按钮的回调事件
		},
		initialize: function(options) {
			this.setOptions(options);
			var tem = this.options;
			// 加载模板
			this.loadTemplate();

			// 关闭云端资源树面板
			jQuery(document).on('click','.cloud-panel a.close-select-panel',function(){
				window.top.showHideMasker("hide"); // 隐藏一二级导航遮罩层 by songxj
				jQuery("div.cloud-panel").hide();
				jQuery(".layer.cloud-panel-mask").hide();
			});

			jQuery(document).on("click",".cloud-panel .select_file_foot a.cancel",function(){
				window.top.showHideMasker("hide"); // 隐藏一二级导航遮罩层 by songxj
				jQuery(".cloud-panel a.close-select-panel").click();
			});

			// 全选暂不使用
			var self = this;
			jQuery(document).on("click",".cloud-panel .select_file_foot #checkAll",function() {
				if (jQuery(this).prop("checked")) {
					self.check(true);
				} else {
					self.check(false);
				}
			});

			// 选择资源
			jQuery(document).on("click",".cloud-panel .select_file_foot a.select",function() {
				var arr = self.getOutPutData();
				if (arr.length === 0) {
					notify.info("请选择资源！");
				} else {
					window.top.showHideMasker("hide"); // 隐藏一二级导航遮罩层 by songxj
					if(jQuery('.sour_name .close').length > 0){
						jQuery('.sour_name').remove();
					}
					self.options.callback(arr);
					self.hide();
					jQuery("#searchValue").focus();
					jQuery("#searchValue").attr("placeholder","请输入关键字,例如“颜色、特征、车牌”等");
				}

			});

			/*类型切换*/
			jQuery(document).on('click','.select_file_type span',function(){
				var $this = jQuery(this);
				var dataCat = jQuery(this).attr('data-cat');

				$this.addClass('active').siblings().removeClass('active');

				if(dataCat === 'all'){
					self.search('all');
				}else if(dataCat === 'video'){
					self.search('video');
				}else{
					self.search('folder');
				}
			});

		},
		// 添加滚动条
		addScrollBar:function(){
			var tem = this.options;
			tem.scrollbar = jQuery(tem.node).html("").closest("div" + tem.scrollbarNode);
			tem.scrollbar.tinyscrollbar({
				thumbSize: 72
			});

			this.updateScrollBar();
		},
		/*
		 *	全选  反选
		 */
		check: function(flag) {
			var self = this;
			if (flag) {
				jQuery(self.options.node).find("li>i.checkbox").addClass("selected");
			} else {
				jQuery(self.options.node).find("li>i.checkbox").removeClass("selected");
			}
		},
		// 获取选中资源的名称(仅仅为了添加日志用)
		getResNames: function() {
			var self = this;
			var images = [],
				videos = [];
			jQuery(self.options.node).find("li.leaf").each(function(index, item) {
				var el = jQuery(item);
				if (el.attr("data-filetype") === "1") {
					videos.push(el.attr("data-name"));
				} else if (el.attr("data-filetype") === "2") {
					images.push(el.attr("data-name"));
				}
			});

			return {
				imageNames: images.join("、"),
				videoNames: videos.join("、")
			};
		},
		// 获取选中文件数据
		getSelectedResData: function() {
			var self = this;
			var data = [];
			jQuery(self.options.node).find("li.leaf > i.selected").each(function(index, item) {
				var el = jQuery(item).closest("li");
				data.push({
					id: el.attr("data-id"),
					name: el.attr("data-name"),
					type: el.attr("data-filetype"),
					size: el.attr("data-filesize"),
					parentId: el.attr("data-parentid"),
					storageTime: el.attr("data-storagetime")
				});
			});
			return data;
		},
		/*
		 *	重新加载数据
		 */
		reload: function() {

			jQuery(this.options.node).empty();
			jQuery(".cloud-panel .select_file_foot #checkAll").prop("checked", false);

			this.loadData({
				"id": this.options.defaultRootId,
				"type": this.options.type,
				"source":this.options.source
			}, jQuery(this.options.node), true);
		},
		/*
		 *	按文件类型搜索 @resourceType ["image"、"vedio"]
		 */
		search: function(resourceType) {

			if (resourceType === "video") {
				//this.options.fileType = 1;
				this.options.type = 3;
			}else if(resourceType === "all"){
				this.options.type = 1;
			}else{
				this.options.type = 2;
			}

			this.reload();
		},
		/*
		 *	显示资源树列表
		 */
		show: function(argument) {
			jQuery(".layer.cloud-panel-mask").show();
			jQuery("div.cloud-panel").show();

			if(this.options.source === 1){
				jQuery('.select_file_type').hide();
			}else{
				jQuery('.select_file_type').show();
			}

			return this;
		},
		/*
		 *	隐藏资源树列表
		 */
		hide: function(argument) {
			jQuery("div.cloud-panel").hide();
			jQuery(".layer.cloud-panel-mask").hide();
			return this;
		},
		loadTemplate: function() {
			var self = this;
			jQuery.get(self.options.templateUrl, function(tmp) {
				var tem = self.options;
				self.addHelper();

				tem.template = Handlebars.compile(tmp);

				if(jQuery('.select_file').length <= 0){
					jQuery('body').append(tem.template({'c_body': true}));
				}

				self.addScrollBar();

				self.loadData({
					"id": self.options.defaultRootId,
					"type": self.options.type,
					"source": self.options.source
				}, jQuery(tem.node));
			});
		},
		addHelper: function() {
			Handlebars.registerHelper('isTree', function(type, options) {
				if (type === "tree") {
					return options.fn();
				}
			});

			Handlebars.registerHelper('isFold', function(type, options) {
				if (type == 0) {
					return 'tree';
				}else{
					return 'leaf';
				}
			});

			Handlebars.registerHelper("mills2str", function(num) {
				// 依赖base.js Toolkit
				return Toolkit.mills2str(num);
			});

			Handlebars.registerHelper("eq", function(val1, val2, options) {
				if (val1 === val2) {
					return options.fn();
				} else {
					return options.inverse();
				}
			});
		},
		render: function(data) {
			return this.options.template(data);
		},
		updateScrollBar: function() {
			this.options.scrollbar.tinyscrollbar_update('relative');
		},
		bindEvent: function(parentNode, initFlag) {
			var self = this;
			var target = parentNode.find("ul li.tree span");
			if (initFlag) {
				target = parentNode.find("ul li span");
			}
			// 树节点 span单击事件
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
			target.closest("li").children("i.fold").click(function() {
				var current = jQuery(this).closest("li");
				if (current.attr("data-type") === "tree") {
					if (!current.attr("data-loaded")) {
						self.loadData({
							"id": current.attr("data-id"),
							"type": 2,
							"source": self.options.source
						}, current);
					} else {
						self.toggle(current.children("ul"));
					}
				}
				current.toggleClass("active");
				return false;
			});


			// // 叶子节点单击事件
			// parentNode.find("ul li.leaf span").on("click",function(event){
			// 	self.addClickEffect(jQuery(this));
			// 	self.processLeafClick(jQuery(this));
			// 	return false;
			// });

			// // 叶子节双击事件
			// parentNode.find("ul li.leaf span").on("dblclick",function(event){
			// 	self.processLeafDblClick(jQuery(this));
			// 	return false;
			// });


			// 叶子节点前的图片[folder]点击事件
			parentNode.find("ul li.tree i.tree,ul li.root i.root").on("click", function(event) {

				var current = jQuery(this).closest("li");

				if (current.attr("data-type") === "tree") {

					if (!current.attr("data-loaded")) {
						self.loadData({
							"id": current.attr("data-id"),
							"type":2,
							"source": self.options.source
						}, current);
					} else {
						self.toggle(current.children("ul"));
					}
				}

				current.toggleClass("active");

				return false;
			});

			// 选择框点击事件
			if (self.options.selectable) {
				parentNode.find("li>i.checkbox").click(function() {
					var tem = jQuery(this);
					tem.toggleClass("selected");

					if(self.options.selectType === "radio"){
						jQuery(self.options.node).find("li i.checkbox").removeClass("selected");
						tem.addClass('selected');
					}else{
						self.walkUp(tem);
						self.walkDown(tem);
					}

					return false;
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
		 *	获取checked数据
		 */
		getOutPutData: function() {
			var outData = [];
			var self = this;

			(function walk(item) {

				// item 为li元素
				var caller = arguments.callee;
				var current = item;

				// 当前元素勾选
				if (current.children("i.checkbox").is(".selected")) {
					outData.push({
						"id": current.attr("data-id"),
						"type": current.attr("data-filetype"),
						"fileName":current.attr("data-name")
						//"parentId": current.attr("data-parentid")
					});

				} else {

					current.children("ul").children("li").children("i.checkbox").each(function(index, tem) {
						var child = jQuery(tem);

						if (child.is("i.selected")) {
							var liEl = child.closest("li");

							outData.push({
								"id": liEl.attr("data-id"),
								"type": liEl.attr("data-filetype"),
								"fileName":liEl.attr("data-name")
								//"parentId": liEl.attr("data-parentid")
							});

						} else {
							// 只遍历展开过的
							if (child.closest("li").attr("data-loaded")) {
								caller(child.closest("li"));
							}

						}
					});

				}

			})(jQuery(self.options.node));

			return outData;

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
			node.find("li").removeClass("cur");
		},
		/*
		 *	处理叶子节点点击事件
		 */
		processLeafClick: function(el) {
			this.options.leafClick(el);
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
			this.updateScrollBar();
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
					parentNode.append(context.render({'c_list':{
						"records": receiveData,
						"level": level,
						"selected": "selected",
						"selectable": context.options.selectable,
						"size": receiveData.length,
						"checkType":context.options.selectType
					}}));
				} else {
					parentNode.append(context.render({'c_list':{
						"records": receiveData,
						"level": level,
						"selected": "",
						"selectable": context.options.selectable,
						"size": receiveData.length,
						"checkType":context.options.selectType
					}}));
				}
			} else {
				parentNode.append(context.render({'c_list':{
					"records": receiveData,
					"level": level,
					"selectable": context.options.selectable,
					"size": receiveData.length,
					"checkType":context.options.selectType
				}}));
			}

			context.updateScrollBar();
			context.bindEvent(parentNode, init);
		},
		/*
		 *	加载数据
		 */
		loadData: function(params, parentNode) {

			// 解决click事件 防止重复请求
			parentNode.children("i.fold").unbind("click");

			var self = this,
				url = self.options.url,
				getRootFlag = false,
				requestType = "get";

			if (self.options.queryKey !== "") {
				params.name = self.options.queryKey;
				url = self.options.searchUrl;
				requestType = "post";
			}

			jQuery.ajax({
				url: url,
				type: requestType,
				data: params,
				dataType: 'json',
				setTimeout: 60000,
				beforeSend: function() {
					parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
				},
				success: function(res) {
					var receiveData = [],
						cameras;
					if (getRootFlag) {
						if (res && res.code === 200) {
							receiveData = res.data.list;
							if (receiveData.length === 0) {
								parentNode.attr("data-loaded", 1);
								parentNode.append("<ul><li><div class='no-data'>暂无资源 !</div></li></ul>");
								self.updateScrollBar();
							} else {
								self.appendHTML(receiveData, parentNode, self);
							}
						}
					} else {
						if (res && res.code === 200) {
							receiveData = res.data.list;
							if (receiveData.length === 0) {
								parentNode.attr("data-loaded", 1);
								parentNode.append("<ul><li><div class='no-data'>暂无资源 !</div></li></ul>");
								self.updateScrollBar();
							} else {
								self.appendHTML(receiveData, parentNode, self);
							}
						}
					}
				},
				error: function() {
					notify.warn("网络异常,无法初始化云空间或视图库资源列表");
				},
				complete: function() {
					var self = this;
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
									"id": current.attr("data-id"),
									"source": self.options.source,
									"type": 2
								}, current);
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
	return RT;
});
