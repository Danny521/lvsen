/**
 * [电视墙设置页面电视墙布局显示类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	'/module/settings/taskmgr/js/tempLyt.js',
	'/module/settings/taskmgr/js/initdev-controller.js',
	'ajaxModel',
	'base.self'
], function(tempLyt, initDevController, ajaxModel) {
	// var initDev = require(['/module/settings/taskmgr/js/initdev.js']);
	var devTree = new initDevController({});
	var template = ""; //模版缓存
	var initTvlayout = new Class({
		Implements: [Events, Options],
		options: {
			templateUrl: "/module/common/tvwall/inc/tvwall-template.html",
			containObj: "",
			template: template,
			currentName: "",
			setLyturl: ""
		},
		/**
		 * [initialize description]
		 * @type {[type]}
		 */
		initialize: function(options) {
			this.setOptions(options);
			this.loadLytData(options);
			// jQuery("#treePanel").find(".deviceMenu").css('height', jQuery(document).height() - 140);
		},
		/**
		 * [createLyt 加载已有布局，显示]
		 * @type {[type]}
		 */
		createLyt: function(data) {
			var that = this;
			var $lyt, id;
			var $li = jQuery(".tvLyt ul .lyt").closest("li");
			$li.prevAll().remove();
			$lyt = $(template({
				"initLyt": data
			}));
			$li.before($lyt);
			$lyt.filter("li").each(function() {
				(function($currentLi) {
					$currentLi.find(".close").click(function() {
						new ConfirmDialog({
							title: '提示信息',
							message: "<div class='dialog-messsage'><h4><p>您确定要删除该布局吗?</p></h4>",
							callback: function() {
								that.deleteLyt($currentLi);
							}
						});
						return false;
					});
				})($(this));
			});
			this.initChecked();
		},

		/**
		 * [loadLytemp 渲染模版显示]
		 * @type {[type]}
		 */
		loadLytemp: function(data) {
			var self = this;
			if (template) {
				self.createLyt(data);
				self.spiltScreentemp(data.layouts, 0);
				if ($("#lypan .tvLyt .lytcurr[data-defaultValue=1]").length !== 0) {
					//有默认布局则选中默认布局
					self.chooseInitlyt(data);
				} else {
					//若无默认布局选中当前最新设备的布局
					self.initChecked();
				}

			} else {
				jQuery.get(self.options.templateUrl, function(tem) {
					template = Handlebars.compile(tem);
					self.createLyt(data);
					self.spiltScreentemp(data.layouts, 0);
					if ($("#lypan .tvLyt .lytcurr[data-defaultValue=1]").length !== 0) {
						self.chooseInitlyt(data);
					} else {
						self.initChecked();
					}
				});
			}
		},
		/**
		 * [chooseInitlyt 有默认布局则选中默认布局]
		 * @type {[type]}
		 */
		chooseInitlyt: function(data) {
			var defaultArr = data.layouts;
			var defaultId = "",
				currentObj = "";
			for (var i = 0; i < defaultArr.length; i++) {
				if (defaultArr[i].defaultValue === "1") {
					defaultId = defaultArr[i].id;
				}
			}

			//选中默认布局
			jQuery("#major .tvLyt .lytcurr").removeClass("active");
			jQuery("#major .tvLyt .lytcurr[data-id=" + defaultId + "]").addClass("active");
			currentObj = this.getclickLytbyid(lytdata.data, defaultId).lyta;
			tempLyt.renderEditMode(currentObj);
			this.updateLytData();
			devTree.initDevActive();
		},
		/**
		 * [spiltScreentemp 卍解分屏]
		 * @type {[type]}
		 */
		spiltScreentemp: function(currentSplit, dataNum) {
			var activeID;
			if (jQuery(".tvLyt .active").length !== 0) {
				activeID = jQuery(".tvLyt .active").attr("data-id").trim();
			}

			if (activeID === "") {
				this.mathScreen(activeID, [], dataNum);
			} else {
				for (var i = 0; i < currentSplit.length; i++) {
					var currentSplitnum = currentSplit[i].monitorLayout;
					var lytid = currentSplit[i].id;
					this.mathScreen(lytid, currentSplitnum, dataNum);
				}
			}
		},
		/**
		 * [mathScreen 布局格局显示]
		 * @type {[type]}
		 */
		mathScreen: function(lytid, currentSplitnum, dataNum) {
			var lytNum = currentSplitnum.length,
				lytCamera = jQuery(".lytcurr[data-id=" + lytid + "] .lyt .lytcamerasp");

			for (var j = 0; j < (lytNum + dataNum); j++) {
				lytCamera.append("<div class='inneryl'></div>");
			}


			var num = Math.sqrt(lytNum + dataNum),
				lytInnerele = jQuery(".lytcurr[data-id=" + lytid + "] .lyt .lytcamerasp .inneryl");

			if (num === 1) {
				lytInnerele.width(lytCamera.width());
				lytInnerele.height(lytCamera.height());
			} else {
				if (num > parseInt(num,10)) {
					lytInnerele.width(((lytCamera.width() - parseInt(num + 1,10)) / parseInt(num + 1,10)));
					lytInnerele.height(((lytCamera.height() - parseInt(num + 1,10)) / parseInt(num + 1,10)));
				} else {
					lytInnerele.width(((lytCamera.width() - parseInt(num,10)) / parseInt(num,10)));
					lytInnerele.height(((lytCamera.height() - parseInt(num,10)) / parseInt(num,10)));
				}
			}
		},
		/**
		 * [initChecked 若无默认布局选中当前最新设备的布局]
		 * @type {[type]}
		 */
		initChecked: function() {
			var $lytLi = $(".tvLyt .lytcurr");
			var id, currentObj;
			var that = this;
			tempLyt.addDirLayout();
			if (that.options.currentName === "") {
				if ($lytLi.length > 0) {
					$lytLi.eq(0).addClass("active");
					id = $lytLi.eq(0).attr("data-id");
					currentObj = that.getclickLytbyid(lytdata.data, id).lyta;
					tempLyt.renderEditMode(currentObj);
				}
			} else {
				$lytLi.each(function() {
					if (that.options.currentName === $(this).attr("data-name")) {
						$(this).addClass("active");
						id = $(this).attr("data-id");
						currentObj = that.getclickLytbyid(lytdata.data, id).lyta;
						tempLyt.renderEditMode(currentObj);
						return false;
					}
				});
			}
		},
		/**
		 * [getclickLytbyid 获取当前点击布局的数据]
		 * @type {[type]}
		 */
		getclickLytbyid: function(lytArr, selfid) {
			var len = lytArr.layouts.length,
				lyta = "";
			for (var i = 0; i < len; i++) {
				if (lytArr.layouts[i].id === selfid) {
					lyta = lytArr.layouts[i];
				}
			}
			return {
				"lyta": lyta
			};
		},
		/**
		 * [changeCss 改变布局样式]
		 * @type {[type]}
		 */
		changeCss: function(cself) {
			cself.addClass("active");
			cself.siblings().removeClass("active");
		},
		/**
		 * [addLyttemp 保存布局名称模版]
		 * @type {[type]}
		 */
		addLyttemp: function(name) {
			var self = this;
			var $aChnl = $("#aChnl");
			if (template) {
				$aChnl.html(template({
					"addLyt": {}
				}));
				$aChnl.show();
				jQuery("#major .lytname").focus();
				jQuery("#major .lytname").val(name);

			} else {
				jQuery.get(self.options.templateUrl, function(tem, options) {
					template = Handlebars.compile(tem);
					$aChnl.html(template({
						"addLyt": {}
					}));
					$aChnl.show();
					jQuery("#major .lytname").focus();
					jQuery("#major .lytname").val(name);

				});
			}
		},
		/**
		 * [setLytCurr description]
		 * @type {[type]}
		 */
		setLytCurr: function() {
			var currObj = tempLyt.getResultObj();
			this.options.setLytAjax(currObj);
		},
		/**
		 * [lytnameDiffCom 对比设置名称与已有名称]
		 * @type {[type]}
		 */
		lytnameDiffCom: function(names, nameobj) {
			var flag = false;
			for (var i = 0; i < names.length; i++) {
				if (names.eq(i).attr("data-name") === nameobj) {
					return true;
				}

			}
		},
		/**
		 * [renderClicktemplyt 点击布局加载当前布局模版]
		 * @type {[type]}
		 */
		renderClicktemplyt: function(self) {
			var lytArr = lytdata.data,
				selfid = self.attr("data-id"),
				obj = this.getclickLytbyid(lytArr, selfid).lyta;
			if (self.children().attr("class").indexOf("addrr") === -1) {
				this.changeCss(self);
			}
			if (obj === "") {
				tempLyt.renderInsertMode();
			} else {
				tempLyt.renderEditMode(obj);
			}
		},
		/**
		 * [createTempLyt 新增布局加载模版]
		 * @type {[type]}
		 */
		createTempLyt: function($dom) {
			var that = this;
			var $li;
			$li = $(template({
				"lytst": {}
			}));
			$li.find(".close").click(function() {
				$li.remove();
				if ($li.hasClass("active")) {
					tempLyt.addDirLayout();
				}

				return false;
			});
			$dom.closest("li").before($li);
		},
		/**
		 * [updateLytData 清除左侧设备树高亮]
		 * @type {[type]}
		 */
		updateLytData: function() {

			jQuery(".viewport .deviceMenu .tree li").filter(".load").removeClass("load");
			// jQuery(".viewport .deviceMenu .tree li").filter(".active").removeClass("active");
			// jQuery(".viewport .devices ul").hide();
		},
		/**
		 * [saveLayout description]
		 * @type {[type]}
		 */
		saveLayout: function() {
			var objs = tempLyt.getResultObj();
			var newname = objs.layouts[0].name;
			if (newname === "") {
				this.addLyttemp("");
				return;
			}
			if (this.lytnameDiffCom(jQuery(".tvLyt .lytcurr").not(jQuery(".tvLyt .active")), newname)) {
				notify.warn("该布局名已存在，请重新输入！");
				this.addLyttemp(newname);
				return;
			}
			this.setLytAjax(objs);
		}
	});
	return initTvlayout;
});