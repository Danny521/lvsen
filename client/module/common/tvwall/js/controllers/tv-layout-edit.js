/*global logDict:true */
/**
 * [电视墙布局设置、修改布局类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
// (function($) {
define([
	"/module/common/tvwall/js/controllers/tv-layout-base.js",
	"/module/common/tvwall/js/views/tvwall-views.js",
	"jquery-ui"
], function(TvLayoutBase, tvwallViews) {
	function TvLayoutEdit() {
		this.initialize(this.options);
	}
	TvLayoutEdit.prototype = new TvLayoutBase();
	TvLayoutEdit.prototype.removeItemFun = null,
		TvLayoutEdit.prototype.options = {
			layoutContainer: jQuery(".tvList"),
			containUl: jQuery(".tvList").find("ul")
		};
	/**
	 * [initialize 初始化]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   options [description]
	 * @return {[type]}           [description]
	 */
	TvLayoutEdit.prototype.initialize = function(options) {
		var that = this;
		tvwallViews.editView();
	};
	/**
	 * [renderInsertMode 新增布局]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutEdit.prototype.renderInsertMode = function() {
		if (this.beforeRender()) {
			return false;
		}
		var laytout = {
			"id": "",
			"name": "",
			"creatId": "",
			"monitorLayout": []
		};
		this.options.layoutObj = laytout;
		this.resultObj.layouts[0] = jQuery.extend(true, {}, laytout);
		this.isChange = false;
		this.options.layoutObj = laytout;
		this.options.containUl.html("");
	};
	/**
	 * [renderEditMode 渲染当前点击布局的详细布局]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   layoutObj [description]
	 * @return {[type]}             [description]
	 */
	TvLayoutEdit.prototype.renderEditMode = function(layoutObj) {
		if (!layoutObj || this.beforeRender()) {
			return false;
		}
		this.options.layoutObj = layoutObj;//当前点击布局的详细布局信息
		//将layoutObj中信息拷贝深度拷贝到{}中,并赋值给this.resultObj.layouts[0]
		this.resultObj.layouts[0] = jQuery.extend(true, {}, layoutObj);
		this.isChange = false;
		//用最新的布局渲染布局模板
		this.loadLayout();
	};
	/**
	 * [addDirLayout 当前布局]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutEdit.prototype.addDirLayout = function() {
		this.options.layoutObj = null;
		this.isChange = false;
		this.resultObj.layouts = [];
		this.options.containUl.html("");
	};
	/**
	 * [getCurrentObj 获取布局数据]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutEdit.prototype.getCurrentObj = function() {
		return this.options.layoutObj;
	};
	/**
	 * [getResultObj 获取当前布局数据]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutEdit.prototype.getResultObj = function() {		
		return this.resultObj;
	};
	/**
	 * [addItem 添加]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   itemObj [description]
	 */
	TvLayoutEdit.prototype.addItem = function(itemObj) {
		if (!itemObj) {
			return;
		}
		var serverName = itemObj.serverName;
		var screenId = itemObj.screenId;
		var that = this;
		var dom;
		dom = jQuery(template({
			"loadchilLyt": itemObj
		}));
		this.options.containUl.append(dom);
		var id = this.newGuid();
		dom.attr("data-id", id);
		that.afterAddItem(dom,serverName,screenId);
		that.change(id, itemObj, "0");
	};
	
	/**
	 * [beforeRender 改变值]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutEdit.prototype.beforeRender = function() {
		return this.isChange;
	};
	/**
	 * [afterRender description]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutEdit.prototype.afterRender = function() {
		var that = this;
		jQuery(this.options.layoutContainer).find("li").each(function(index, ele) {
			that.addStyle(jQuery(this));
			that.bindDragResize(jQuery(this));
			that.bindClose(jQuery(this));
			jQuery(ele).find(".catorname").width(jQuery(ele).width() - 75);
		});
	};
	/**
	 * [afterAddItem 添加事件]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   dom [description]
	 * @return {[type]}       [description]
	 */
	TvLayoutEdit.prototype.afterAddItem = function(dom,serverName,screenId) {
		this.addStyle(dom);
		this.bindDragResize(dom);
		this.bindClose(dom);
		this.bindServerName(dom,serverName,screenId);
		dom.find(".catorname").width(dom.width() - 75);
	};
	/**
	 * [resizeResult 处理事件]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   dom [description]
	 * @param  {[type]}   ui  [description]
	 * @return {[type]}       [description]
	 */
	TvLayoutEdit.prototype.resizeResult = function(dom, ui) {
		if (ui.size.width > 900) {
			dom.find(".tvinner16").width("24.9%");
		} else {
			dom.find(".tvinner16").width("24.58%");
		}
		dom.find(".catorname").width(ui.size.width - 75);
		if (dom.width() > 400 && dom.height() > 200) {
			dom.find(".downwalled").css({
				"background": "url(/module/common/images/bg/camera1.png) no-repeat scroll center center #444444"
			});
		} else {
			dom.find(".downwalled").css({
				"background": "url(/module/common/images/bg/camera4.png) no-repeat scroll center center #444444"
			});
		}
	};
	/**
	 * [draggResult 处理大小问题]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   dom      [description]
	 * @param  {[type]}   position [description]
	 * @param  {[type]}   ui       [description]
	 * @return {[type]}            [description]
	 */
	TvLayoutEdit.prototype.draggResult = function(dom, position, ui) {
		var isOut = false;
		if (position.x < 8) {
			position.x = 8;
			isOut = true;
		}
		if (position.y < 8) {
			position.y = 8;
			isOut = true;
		}
		if (isOut) {
			dom.css({
				left: position.x,
				top: position.y
			});
		}
	};
	/**
	 * [bindDragResize 添加事件]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   dom [description]
	 * @return {[type]}       [description]
	 */
	TvLayoutEdit.prototype.bindDragResize = function(dom) {
		var that = this;
		dom.resizable({
			alsoResize: dom.find(".dis-screen1"),
			minWidth: 115,
			minHeight: 100,
			zIndex: 1000,
			resize: function(event, ui) {
				that.resizeResult(dom, ui);
			},
			stop: function(event, ui) {
				that.change(ui.helper.attr("data-id"), ui.size, "2");
			}
		}).draggable({
			// containment: this.options.$layoutContainer,
			zIndex: 1000,
			distance: 10,
			snap: true,
			snapTolerance: 10,
			scroll: true,
			scrollSensitivity: 100,
			scrollSpeed: 100,
			stop: function(event, ui) {
				var position = {
					"x": ui.position.left,
					"y": ui.position.top
				};
				that.draggResult(dom, position, ui);
				that.change(ui.helper.attr("data-id"), position, "2");
			}
		});
	};
	/**
	 * [bindClose 绑定事件]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   dom [description]
	 * @return {[type]}       [description]
	 */
	TvLayoutEdit.prototype.bindClose = function(dom) {
		var that = this;
		dom.find(".close").unbind("click").bind("click", function() {
			that.change(dom.attr("data-id"), {}, "1");
			dom.remove();
			if (that.removeItemFun) {
				that.removeItemFun(dom);
			}
			return false;
		});
	};
	/**
	 * [bindServerName title显示server名称]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   dom [description]
	 * @return {[type]}       [description]
	 */
	TvLayoutEdit.prototype.bindServerName = function(dom,serverName,screenId) {
		var that = this;
		dom.find(".catorname").html(serverName+"[通道"+screenId+"]");
	};
	/**
	/**
	 * [searchLog 电视墙日志]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   oldName [description]
	 * @param  {[type]}   name    [description]
	 * @return {[type]}           [description]
	 */
	TvLayoutEdit.prototype.searchLog = function(oldName, name) {
		if (oldName) {
			logDict.insertMedialog("m3", "修改" + oldName + '电视墙布局为' + name + "电视墙布局", "f8", "o2");
		} else {
			logDict.insertMedialog("m3", "新增" + name + '电视墙布局', "f8", "o1");
		}
	};
	/**
	 * [changeLayoutName 修改布局名称]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   name [description]
	 * @return {[type]}        [description]
	 */
	TvLayoutEdit.prototype.changeLayoutName = function(name) {
		//如果修改后的名字和修改之前相同，什么都不做
		if (name === "" || this.resultObj.layouts[0].name === name) {
			return;
		}
		var oldName = this.resultObj.layouts[0].name;
		this.resultObj.layouts[0].name = name;
		this.isChange = true;
		//修改日志记录
		this.searchLog(oldName, name);
	};
	/**
	 * [change changeType: 0 新增,1 删除 ,2 修改]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   monitorId  [description]
	 * @param  {[type]}   changeObj  [description]
	 * @param  {[type]}   changeType [description]
	 * @return {[type]}              [description]
	 */
	TvLayoutEdit.prototype.change = function(monitorId, changeObj, changeType) {
		console.log(monitorId, changeObj, changeType)
		this.isChange = true;
		var monitorLayout = this.resultObj.layouts[0].monitorLayout;
		var currentMonitor;
		for (var i = 0; i < monitorLayout.length; i++) {
			if (monitorLayout[i].id === monitorId) {
				currentMonitor = monitorLayout[i];
				if (currentMonitor.opra === "0") {
					if (changeType === "1") {
						monitorLayout.splice(i, 1);
						return;
					}
					if (changeType === "2") {
						changeType = "0";
					}
				}
				break;
			}
		}
		if (!currentMonitor) {
			currentMonitor = {
				id: monitorId
			};
			monitorLayout.push(currentMonitor);
		}

		$.extend(currentMonitor, changeObj, {
			"opra": changeType
		});
	};
	return TvLayoutEdit;

});