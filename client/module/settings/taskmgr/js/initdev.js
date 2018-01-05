define([
	'/module/settings/taskmgr/js/tempLyt.js',
	'ajaxModel',
	'base.self'
], function(tempLyt, ajaxModel) {
	var template = ""; //模版缓存
	var initDev = new Class({
		Implements: [Events, Options],
		options: {
			templateUrl: "/module/common/tvwall/inc/tvwall-template.html",
			containObj: jQuery(".deviceMenu"),
			rescildren: "",
			rescildrenArr: [],
			num: "0",
			reswjcildren: "",
			reswjcildrenArr: [],
			num1: "0",
			template: template,
			loadDevurl: "/service/pow/show_tree" + "?timestamp=" + new Date().getTime(),
			currentName: "",
			setLyturl: ""
		},
		/**
		 * [initialize description]
		 * @type {[type]}
		 */
		initialize: function(options) {
			this.setOptions(options);
			this.loadDevices(options);
			this.loadWjDevices(options);
		},
		/**
		 * [loadDevtemp description]
		 * @type {[type]}
		 */
		loadDevtemp: function(data) {
			var self = this;
			if (template) {
				self.options.containObj.html(template({
					"info": data
				}));
			} else {
				jQuery.get(self.options.templateUrl, function(tem) {
					template = Handlebars.compile(tem);
					self.options.containObj.html(template({
						"info": data
					}));
				});
			}
		},
		/**
		 * [initDevActive description]
		 * @type {[type]}
		 */
		initDevActive: function() {
			var lytArr = lytdata.data,
				selfid = jQuery("#major .tvLyt ul .active").attr("data-id"),
				obj = jQuery("#major .tvList ul li"),
				elems = jQuery("#treePanel .deviceMenu .devices ul li");
			if (obj) {
				for (var i = 0; i < obj.length; i++) {
					for (var j = 0; j < elems.length; j++) {
						if (obj.eq(i).attr("data-monitorid") === elems.eq(j).find(".childeslist").attr("data-monitorid")) {
							elems.eq(j).addClass("load");
						}
					}

				}
			}
		},
		/**
		 * [loadWjChildTemp description]
		 * @type {[type]}
		 */
		loadWjChildTemp: function(self, data) {
			var that = this;
			if (template) {
				self.after(template({
					"sjdst": data
				}));
			} else {
				jQuery.get(that.options.templateUrl, function(tem, options) {
					template = Handlebars.compile(tem);
					self.after(template({
						"sjdst": data
					}));
				});
			}
		},
		/**
		 * [loadDevices description]
		 * @type {[type]}
		 */
		loadDevices: function() {
			var self = this;
			jQuery.ajax({
				url: "/service/pow/show_tree" + "?timestamp=" + new Date().getTime(),
				type: "get",
				cache: false,
				success: function(res) {
					var rescode = res;
					if (rescode.code === 200) {
						jQuery("#camerasPanel").removeClass("loading");
						self.loadDevtemp(rescode.data);

					} else {
						notify.error("获取设备数据失败！");
					}
				}
			});
		},
		/**
		 * [loadWjDevices description]
		 * @type {[type]}
		 */
		loadWjDevices: function() {
			var self = this;
			jQuery.ajax({
				url: "/service/uow/show_tree" + "?timestamp=" + new Date().getTime(),
				type: "get",
				cache: false,
				success: function(res) {
					var rescode = res;
					if (rescode.code === 200) {
						self.loadDevtemp(rescode.data);
					} else {
						notify.error("获取设备数据失败！");
					}

				}
			});
		},
		/**
		 * [draggMove description]
		 * @type {[type]}
		 */
		draggMove: function(node) {
			var that = this;
			node.find("li").each(function() {
				if ($(this).attr("data-type") === "leaf") {
					$(this).draggable({
						helper: "clone",
						zIndex: 1000,
						cursor: "crosshair",
						appendTo: ".tvList",
						stop: function(event, ui) {
							var x = ui.position.left,
								y = ui.position.top;
							if (x < 8) {
								x = 8;
							}
							if (y < 8) {
								y = 8;
							}
							var self = jQuery(this).find(".childeslist");
							that.drapDataTo(self, x, y);
						}
					});
				}
			});
		},
		/**
		 * [loadChildDev description]
		 * @type {[type]}
		 */
		loadChildDev: function(node, self, funevent) {
			var that = this;
			node.attr("data-num", that.options.num);
			that.options.num++;
			if (node.attr("data-pvgid")) {
				var pvgId = node.attr("data-pvgid").trim();
				jQuery.ajax({
					url: "/service/pow/show_monitors?pvgId=" + pvgId,
					type: "get",
					cache: false,
					success: function(res) {
						that.options.rescildren = res;
						that.options.rescildrenArr.push(res);
						if (that.options.rescildren.code === 200) {
							that.loadChildTemp(self, that.options.rescildren);
							that.initDevActive();
						} else {
							notify.error("获取数据失败！");
						}
					},
					complete: function() {
						funevent();
						if (that.options.rescildren && that.options.rescildren.data.length === 0) {
							node.find("ul").append("<div class='loading'>暂无数据！</div>");
							return;
						}
						that.draggMove(node);
					}
				});
			} else {
				var wjId = node.attr("data-wjid").trim();
				node.attr("data-num", that.options.num1);
				that.options.num1++;
				jQuery.ajax({
					url: "/service/uow/show_tree?universaId=" + wjId,
					type: "get",
					cache: false,
					success: function(res) {
						that.options.reswjcildren = res;
						that.options.reswjcildrenArr.push(res);
						if (that.options.reswjcildren.code === 200) {
							that.loadWjChildTemp(self, that.options.reswjcildren);
							that.initDevActive();
						} else {
							notify.error("获取数据失败！");
						}
					},
					complete: function() {
						funevent();
						if (that.options.reswjcildren && that.options.reswjcildren.data.length === 0) {
							node.find("ul").append("<div class='loading'>暂无数据！</div>");
							return;
						}
						that.draggMove(node);
					}
				});

			}
		},
		/**
		 * [loadChildTemp description]
		 * @type {[type]}
		 */
		loadChildTemp: function(self, data) {
			var that = this;
			if (template) {
				self.after(template({
					"dstep": data
				}));
			} else {
				jQuery.get(that.options.templateUrl, function(tem) {
					template = Handlebars.compile(tem);
					self.after(template({
						"dstep": data
					}));
				});
			}
		},
		/**
		 * [toggleClassStyle description]
		 * @type {[type]}
		 */
		toggleClassStyle: function(node, self) {
			var that = this;
			if (node.attr("class").indexOf("active") === -1) {
				node.children().eq(1).hide();
				node.find(".loading").hide();
			} else {
				if (node.children().eq(1).length !== 0) {
					//hide子树
					that.initDevActive();
					node.children().eq(1).show();
					node.find(".loading").show();

				} else {
					that.loadChildDev(node, self, function() {});
				}
			}
		},
		/**
		 * [cancelChildDev description]
		 * @type {[type]}
		 */
		cancelChildDev: function(childdev) {
			for (var i = 0; i < childdev.length; i++) {
				childdev.eq(i).removeClass("load");
			}
		},
		/**
		 * [cancelDev description]
		 * @type {[type]}
		 */
		cancelDev: function(eles, tarele, id) {
			for (var i = 0; i < eles.length; i++) {
				var monitorId = eles.eq(i).attr(tarele);
				if (id === monitorId) {
					var ele = eles.eq(i);
					return ele;
				}
			}
		},
		/**
		 * [addDevTolyt description]
		 * @type {[type]}
		 */
		addDevTolyt: function(devid, rescildflag) {
			var currDevlyt = "";
			for (var l = 0; l < rescildflag.length; l++) {
				if (devid === rescildflag[l].monitorId) {
					currDevlyt = rescildflag[l];
				}
			}
			return currDevlyt;
		},
		/**
		 * [addWjDevTolyt description]
		 * @type {[type]}
		 */
		addWjDevTolyt: function(devid, rescildflag) {
			var currDevlyt = "";
			for (var l = 0; l < rescildflag.length; l++) {

				if (devid === rescildflag[l].monitorNo) {
					currDevlyt = rescildflag[l];
				}

			}
			return currDevlyt;
		},
		/**
		 * [drapDataTo description]
		 * @type {[type]}
		 */
		drapDataTo: function(self, x, y) {
			var devid = self.attr("data-monitorid").trim();
			var that = this;

			if (self.closest("li").attr("class").indexOf("load") === -1) {
				if (jQuery("#major .tvLyt .lytcurr").length !== 0 && jQuery("#major .tvLyt .active").length !== 0) {
					var additem = {};
					var addelse = self.closest("li.devices"),
						width = jQuery("#major .tvList").width(),
						height = jQuery("#major .tvList").height(),
						typeFl = addelse.attr("data-type").trim();

					if (typeFl === "1") {
						var devno = self.attr("data-monitorno").trim();
						additem = this.addWjDevTolyt(devno, that.options.reswjcildrenArr[Number(self.closest(".devices").attr("data-num"))].data);
						additem.screenno = self.attr("data-screenno");
						additem.universaId = self.attr("data-universaId");
						additem.monitorNo = self.attr("data-monitorno");
					} else {
						additem = this.addDevTolyt(devid, that.options.rescildrenArr[Number(self.closest(".devices").attr("data-num"))].data);
						additem.monitorname = additem.name;
						additem.ip = addelse.attr("data-ip").trim();
						additem.screenno = "1";
						additem.universaId = "";
					}
					additem.type = typeFl;
					additem.x = x;
					additem.y = y;
					//先固定长宽
					additem.width = 115;
					additem.height = 100;
					tempLyt.addItem(additem);
					self.closest("li").addClass("load");
				} else {
					notify.warn("未选中任何布局,请选中或添加布局！");
				}

			} else {
				notify.warn("该设备已添加到当前布局中！");

			}
		}

	});
	return initDev;
});