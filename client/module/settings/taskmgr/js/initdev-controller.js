/**
 * [电视墙设置页面左侧树展现控制类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	'/module/settings/taskmgr/js/tempLyt.js',
	'/module/settings/taskmgr/js/initdev-model.js',
	'base.self'
], function(tempLyt, initDevModel) {
	function initDevController() {
			// this.initialize(this.options);
		}
		/**
		 * [prototype 原型链继承]
		 * @type {initDevModel}
		 */
	initDevController.prototype = new initDevModel();
	/**
	 * [options description]
	 * @type {Object}
	 */
	initDevController.prototype.options = {
		rescildren: "",
		rescildrenArr: [],
		num: "0",
		reswjcildren: "",
		reswjcildrenArr: [],
		num1: "0",
		loadDevurl: "/service/pow/show_tree" + "?timestamp=" + new Date().getTime(),
		currentName: "",
		setLyturl: "",
		containObj: jQuery(".deviceMenu")
	};
	/**
	 * [initialize description]
	 * @type {[type]}
	 */
	initDevController.prototype.initialize = function() {
		//获取pvg与卍解树
		this.loadDevices();
	};
	/**
	 * [initDevActive 设置左侧设备信息样式]
	 * @type {[type]}
	 */
	initDevController.prototype.initDevActive = function() {
		var lytArr = lytdata.data,
			selfid = jQuery("#major .tvLyt ul .active").attr("data-id"),
			obj = jQuery("#major .tvList ul li"),
			elems = jQuery("#treePanel .deviceMenu .devices ul li"),
			myObj = this.getcLytbyid(lytArr,selfid);			
			myObj.lyta && myObj.lyta.monitorLayout.each(function(e,i){			
			jQuery(".childeslist[data-sid="+e.serverId+"][title="+e.screenId+"]").closest('.addItem').addClass('load');
			})
		
		//如果左侧设备信息在右侧布局模板中存在，则在左侧设备信息html中添加load,用来表示该设备已经添加到右侧布局中
		// if (obj) {
		// 	for (var i = 0; i < obj.length; i++) {
		// 		for (var j = 0; j < elems.length; j++) {
		// 			if (obj.eq(i).attr("data-monitorid") === elems.eq(j).find(".childeslist").attr("data-monitorid")) {
		// 				elems.eq(j).addClass("load");
		// 			}
		// 		}
		// 	}
		// }
	};
	
		/**
	 * [getclickLytbyid 获取当前点击布局的数据]
	 * @type {[type]}
	 */
	initDevController.prototype.getcLytbyid = function(lytArr, selfid) {		
		var len = lytArr.layouts.length,
			lyta;
		for (var i = 0; i < len; i++) {
			if (parseInt(lytArr.layouts[i].id) === parseInt(selfid)) {
				lyta = lytArr.layouts[i];
			}
		}		
		return {
			"lyta": lyta
		};
	};
	/**
	 * [draggMove 拖动左侧设备到右侧布局模板中]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   node [左侧根节点]
	 * @return {[type]}        [description]
	 */
	initDevController.prototype.draggMove = function(node) {
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
						//左侧每一个设备信息
						var self = jQuery(this).find(".childeslist");
						//左侧设备信息到右侧
						that.drapDataTo(self, x, y);
					}
				});
			}
		});
	};
	/**
	 * [toggleClassStyle 左侧设备信息树的展开合并操作]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   node [description]
	 * @param  {[type]}   self [description]
	 * @return {[type]}        [description]
	 */
	initDevController.prototype.toggleClassStyle = function(node, self) {
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
				//获取并渲染子节点设备信息
				that.loadChildDev(node, self, function() {});
			}
		}
	};
	/**
	 * [cancelChildDev description]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   childdev [description]
	 * @return {[type]}            [description]
	 */
	initDevController.prototype.cancelChildDev = function(childdev) {
		for (var i = 0; i < childdev.length; i++) {
			childdev.eq(i).removeClass("load");
		}
	};
	/**
	 * [cancelDev description]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   eles   [description]
	 * @param  {[type]}   tarele [description]
	 * @param  {[type]}   id     [description]
	 * @return {[type]}          [description]
	 */
	initDevController.prototype.cancelDev = function(eles, tarele, id) {
		for (var i = 0; i < eles.length; i++) {
			var monitorId = eles.eq(i).attr(tarele);
			if (id === monitorId) {
				var ele = eles.eq(i);
				return ele;
			}
		}
	};
	/**
	 * [addDevTolyt description]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   devid       [description]
	 * @param  {[type]}   rescildflag [description]
	 */
	initDevController.prototype.addDevTolyt = function(devid, rescildflag) {
		var currDevlyt = "";
		for (var l = 0; l < rescildflag.length; l++) {
			if (devid === rescildflag[l].monitorId) {
				currDevlyt = rescildflag[l];
			}
		}
		return currDevlyt;
	};
	/**
	 * [addWjDevTolyt description]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   devid       [description]
	 * @param  {[type]}   rescildflag [description]
	 */
	initDevController.prototype.addWjDevTolyt = function(devid, rescildflag) {
		var currDevlyt = "";
		for (var l = 0; l < rescildflag.length; l++) {
			if (devid === rescildflag[l].monitorNo) {
				currDevlyt = rescildflag[l];
			}
		}
		return currDevlyt;
	};
	/**
	 * [drapDataTo 将左侧树中设备拖动到右侧模板布局之后设置其在右侧布局中大小以及位置等]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   self [左侧每一个设备信息]
	 * @param  {[type]}   x    [X位置]
	 * @param  {[type]}   y    [Y位置]
	 * @return {[type]}        [description]
	 */
	initDevController.prototype.drapDataTo = function(self, x, y) {
		var that = this,
			screenId = self.data("monitorid"),
			serverId = self.data("sid"),
			serverName = self.data("servername");
		if (self.closest("li").attr("class").indexOf("load") === -1) {
			if (jQuery("#major .tvLyt .lytcurr").length !== 0 && jQuery("#major .tvLyt .active").length !== 0) {
				var additem = {};
				var addelse = self.closest("li.devices"),
					width = jQuery("#major .tvList").width(),
					height = jQuery("#major .tvList").height();
					//typeFl = addelse.attr("data-type").trim();

				// if (typeFl === "1") {
				// 	var devno = self.attr("data-monitorno").trim();
				// 	additem = this.addWjDevTolyt(devno, that.options.reswjcildrenArr[Number(self.closest(".devices").attr("data-num"))].data);
				// 	additem.screenno = self.attr("data-screenno");
				// 	additem.universaId = self.attr("data-universaId");
				// 	additem.monitorNo = self.attr("data-monitorno");
				// } else {					
					//additem = that.addDevTolyt(devid, that.options.rescildrenArr[Number(self.closest(".devices").attr("data-index"))].data);
					additem.monitorname = additem.name;
					additem.serverId = serverId;
					additem.screenno = "1";
					additem.screenId = screenId;
					additem.universaId = "";
					additem.serverName = serverName;
					
				// }
				//additem.type = typeFl;
				additem.x = x;
				additem.y = y;
				//先固定长宽
				additem.width = 420;
				additem.height = 330;				
				tempLyt.addItem(additem);
				self.closest("li").addClass("load");
			} else {
				notify.warn("未选中任何布局,请选中或添加布局！");
			}

		} else {
			notify.warn("该设备已添加到当前布局中！");

		}
	};

	return initDevController;
});