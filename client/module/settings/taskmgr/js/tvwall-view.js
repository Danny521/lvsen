/*global TvLayoutEdit:true */
/**
 * [电视墙设置页面电视墙布局设置入口类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
require(['/require-conf.js'], function() {
	require([
		"domReady",
		'/module/settings/taskmgr/js/initdev-controller.js',
		'/module/settings/taskmgr/js/initlyt-controller.js',
		'/module/settings/taskmgr/js/tempLyt.js',
		'/module/common/tvwall/js/views/autoLayout.js',
		'scrollbar',
		'/module/settings/taskmgr/js/scroll.js',
		'permission'
	], function(domReady, initDev, initTvlayout, tempLyt, AutoLayout) {
		domReady(function() {
			// 高亮二级菜单
			var initLL = new initTvlayout(),
				devTree = new initDev();
				/*if (location.href.indexOf('#') !== -1) {
					template = '';
				}*/
			/**
			 * [不同布局切换效果]
			 * @type {[type]}
			 */
			jQuery(document).on("click", ".tvLyt ul .lytcurr", function(e) {
				x = y = 8;
				var dom = jQuery(this);
				//如果切换之前布局原布局发生变化
				if (tempLyt.isChange) {
					if(jQuery(this).attr("class").indexOf("active") === -1){
						new ConfirmDialog({
							title: '提示信息',
							message: "<div class='dialog-messsage'><h4><p>当前布局发生改变是否要保存布局?</p></h4>",
							callback: function() {//原布局发生变化时先保存原布局
								initLL.saveLayout();
							}
						});
						//切换布局时点击"取消"按钮
						jQuery(".common-dialog footer input[value='取消']").on("click", function() {
							jQuery(".active .lyt-name").text(tempLyt.getCurrentObj().name);
							tempLyt.addDirLayout();
							initLL.renderClicktemplyt(dom);
							initLL.updateLytData();
							devTree.initDevActive();
						});
					}
				} else {//原布局没有发生变化
					//点击布局加载当前布局模版
					initLL.renderClicktemplyt(jQuery(this));
					//清除左侧设备树高亮
					initLL.updateLytData();
					//重新设置左侧设备树样式
					devTree.initDevActive();
				}
			});

			/**
			 * [新增布局]
			 * @type {[type]}
			 */
			jQuery(document).on("click", ".addrr", function() {
				var $li;
				if (template) {
					//新增布局加载模板
					initLL.createTempLyt($(this));
				} else {
					jQuery.get(initLL.options.templateUrl, function(tem, options) {
						template = Handlebars.compile(tem);
						initLL.createTempLyt($(this));
					});
				}
			});

			/**
			 * [lytChangename 双击布局修改名字(注：这里只是完成对布局双击之后焦点的停留位置在input修改框，还未完成修改)]
			 * @type {String}
			 */
			jQuery("#major").on("dblclick", ".tvLyt .lytcurr", function() {
				if ($(this).hasClass("active")) {
					var lytChangename = "";
					if (jQuery(this).find(".lyt-name input").length !== 0) {
						lytChangename = jQuery(this).find(".lyt-name input").val();
					} else if (jQuery(this).find(".lyt-name input").length === 0) {
						lytChangename = $(this).find(".lyt-name").text();
					} else {
						lytChangename = tempLyt.getCurrentObj().name;
					}
					jQuery(this).find(".lyt-name").html("<input type='text' value='" + lytChangename + "' class='modifyname' maxlength='15'/>");
					jQuery(this).find(".modifyname").focus();
				}
			});
			/**
			 * [newname 修改名字(注:此处才完成对名字的修改)]
			 * @type {[type]}
			 */
			jQuery("#major").on("blur", ".tvLyt .lytcurr .modifyname", function() {
				var newname = jQuery(this).val().trim();
				if (newname === "") {
					newname = tempLyt.getCurrentObj().name;
				}
				jQuery(this).closest(".lyt-name").html('').text(newname);
				jQuery(".tvLyt .active").attr("title", newname);
				tempLyt.changeLayoutName(newname);
				//鼠标离开向后端发送请求
				initLL.saveLayout();
			});
			/**
			 * [length 保存布局]
			 * @type {[type]}
			 */
			jQuery(document).on("click", ".addLayout", function() {
				if (jQuery("#lypan .tvLyt li.active").length === 0) {
					notify.warn("未选中任何布局,请选择！");
					return;
				}
				initLL.saveLayout();
			});
			//自动排版
			jQuery(".autoLayout").click(function() {
				AutoLayout.containUl = jQuery(".tvList").find("ul");
				AutoLayout.layoutContainer = jQuery(".tvList");
				AutoLayout.domFunction = function(dom, position) {
					tempLyt.change(dom.attr("data-id"), {
						x: position.left,
						y: position.top,
						width: position.perWidth,
						height: position.peiHeight
					}, "2");
					dom.find(".dis-screen1").css({
						height: position.peiHeight - 31,
						width: position.perWidth - 3
					});
					jQuery(".tvList ul li").each(function(index, ele) {
						jQuery(ele).find(".catorname").width(jQuery(ele).width() - 75);
						if (jQuery(ele).width() > 400 && jQuery(ele).height() > 200) {
							jQuery(ele).find(".downwalled").css({
								"background": "url(/module/common/images/bg/camera1.png) no-repeat scroll center center #444444"
							});
						} else {
							jQuery(ele).find(".downwalled").css({
								"background": "url(/module/common/images/bg/camera4.png) no-repeat scroll center center #444444"
							});
						}
					});
				};
				AutoLayout.autoLayout();
			});

			/**
			 * [length 设置默认布局]
			 * @type {[type]}
			 */
			jQuery("#major").on("click", ".initLayout", function() {
				if (jQuery("#major .tvLyt .active").length === 0) {
					notify.warn("请先设置布局！");
					return false;
				} else if (jQuery("#major .tvLyt .active[data-newlyt=newlyt]").length !== 0) {
					notify.warn("请选择已设布局！");
					return false;
				}
				//设置默认布局
				initLL.setLytDefault();
			});
			/**
			 * [newname 保存布局名]
			 * @type {[type]}
			 */
			jQuery(document).on("click", ".lytconfirm", function() {
				var newname = jQuery("#lytname").val().trim();
				if (newname === "") {
					notify.warn("布局名不能为空!");
					return;
				}
				//保存布局名
				tempLyt.changeLayoutName(newname);
				//保存当前布局
				initLL.saveLayout();
				jQuery(this).closest("#aChnl").hide();
			});
			/**
			 * 保存布局名，取消（回复新布局之前的布局信息并渲染之前布局信息）
			 */
			jQuery(document).on("click", ".lytcancel", function() {
				jQuery(this).closest("#aChnl").hide();
				initLL.loadLytData();
				initLL.updateLytData();
				tempLyt.addDirLayout();
			});
			/**
			 * [node 加载子设备]
			 * @type {[type]}
			 */
			jQuery("#sidebar").on("click", ".deviceMenu .tree .deslist", function() {
				var node = jQuery(this).closest("li");

				jQuery(this).toggleClass("active");
				node.toggleClass("active");
				//加载左侧设备信息树的子设备
				devTree.toggleClassStyle(node, jQuery(this));
			});
			var x = 8,
				y = 8;
			/**
			 * 点击子设备添加到布局
			 */
			jQuery("#sidebar").on("click", ".deviceMenu .tree .childeslist", function() {
				//添加子设备中某一设备到布局信息时调用
				devTree.drapDataTo(jQuery(this), x, y);
				x += 20;
				y += 30;
			});
			document.onselectstart = function() {
				event.returnValue = event.srcElement.type === "text";
			};
		});
	});
});
