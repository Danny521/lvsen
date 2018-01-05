/**
 * [电视墙设置页面电视墙布局设置控制类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	'/module/settings/taskmgr/js/tempLyt.js',
	'/module/settings/taskmgr/js/initdev-controller.js',
	'/module/settings/taskmgr/js/initlyt-model.js',
	'base.self'
], function(tempLyt, initDevController, initTvlayoutModel) {
	var devTree = new initDevController();
	devTree.loadDevices();
	/**
	 * [initTvlayoutController description]
	 * @type {Class}
	 */
	var initTvlayoutController = function() {
		this.initialize(this.options);
	};
	initTvlayoutController.prototype = new initTvlayoutModel();
	initTvlayoutController.prototype.options = {
		containObj: "",
		currentName: ""
	};
	/**
	 * [initialize description]
	 * @type {[type]}
	 */
	initTvlayoutController.prototype.initialize = function(options) {
		//显示电视墙
		// jQuery(".tab-panel .tab-header").show();
		// jQuery(".tab-panel .tabs li").show();
		this.loadLytData(options);
		// jQuery("#treePanel").find(".deviceMenu").css('height', jQuery(document).height() - 140);
	};

	/**
	 * [chooseInitlyt 有默认布局则选中默认布局]
	 * @type {[type]}
	 */
	initTvlayoutController.prototype.chooseInitlyt = function(data) {
		var defaultArr = data.layouts;
		var defaultId = "",
			currentObj = "";
		for (var i = 0; i < defaultArr.length; i++) {
			if (defaultArr[i].status === true) {
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
		var dom = jQuery(".tvList ul li");
		var serverNameMark = jQuery(".server_name");
		var liWidth = dom.width();
		if(serverNameMark.length > 0 ){
		       serverNameMark.each(function(index, ele) {
					//13为一个汉字所占的像素，英文字符所占的像素小于汉字，权且安13计算
					//40为[通道0]所占的像素
					//liWidth为一个通道的长度
					if(jQuery(ele).text().length * 13 + 40 > liWidth){    
						var str =  jQuery(ele).text().substring(0,5);
						jQuery(this).text(str+"...");
					}
			   });
		}
	};
	/**
	 * [spiltScreentemp 卍解分屏]
	 * @type {[type]}
	 */
	initTvlayoutController.prototype.spiltScreentemp = function(currentSplit, dataNum) {
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
	};
	/**
	 * [mathScreen 布局格局显示]
	 * @type {[type]}
	 */
	initTvlayoutController.prototype.mathScreen = function(lytid, currentSplitnum, dataNum) {		
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
			if (num > parseInt(num, 10)) {
				lytInnerele.width(((lytCamera.width() - parseInt(num + 1, 10)) / parseInt(num + 1, 10)));
				lytInnerele.height(((lytCamera.height() - parseInt(num + 1, 10)) / parseInt(num + 1, 10)));
			} else {
				lytInnerele.width(((lytCamera.width() - parseInt(num, 10)) / parseInt(num, 10)));
				lytInnerele.height(((lytCamera.height() - parseInt(num, 10)) / parseInt(num, 10)));
			}
		}
	};
	/**
	 * [getclickLytbyid 获取当前点击布局的数据]
	 * @type {[type]}
	 */
	initTvlayoutController.prototype.getclickLytbyid = function(lytArr, selfid) {		
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
	 * [changeCss 改变当前点击布局样式]
	 * @type {[type]}
	 */
	initTvlayoutController.prototype.changeCss = function(cself) {
		cself.addClass("active");
		cself.siblings().removeClass("active");
	};
	/**
	 * [setLytCurr description]
	 * @type {[type]}
	 */
	initTvlayoutController.prototype.setLytCurr = function() {
		//获取原布局信息
		var currObj = tempLyt.getResultObj();
		//保存修改之后布局(发送请求)
		this.options.setLytAjax(currObj);
	};
	/**
	 * [lytnameDiffCom 对比设置名称与已有名称]
	 * @type {[type]}
	 */
	initTvlayoutController.prototype.lytnameDiffCom = function(names, nameobj) {
		var flag = false;
		for (var i = 0; i < names.length; i++) {
			if (names.eq(i).attr("data-name") === nameobj) {
				return true;
			}

		}
	};
	/**
	 * [renderClicktemplyt 点击布局加载当前布局模版]
	 * @type {[type]}
	 */
	initTvlayoutController.prototype.renderClicktemplyt = function(self) {
		var lytArr = lytdata.data,//存储所有布局信息
			selfid = self.attr("data-id"),//获取当前点击信息的ID			
			obj = this.getclickLytbyid(lytArr, selfid).lyta;//获取当前点击布局对应的详细的布局信息					
		if (self.children().attr("class").indexOf("addrr") === -1) {
			//改变当前点击布局样式
			this.changeCss(self);
		}
		if (!obj) {
			tempLyt.renderInsertMode();
		} else {
			//渲染当前点击布局的详细布局
			tempLyt.renderEditMode(obj);
			
		}
	};	
	/**
	 * [updateLytData 清除左侧设备树高亮]
	 * @type {[type]}
	 */
	initTvlayoutController.prototype.updateLytData = function() {
		jQuery(".viewport .deviceMenu .tree li").filter(".load").removeClass("load");
	};
	/**
	 * [saveLayout 保存布局]
	 * @type {[type]}
	 */
	initTvlayoutController.prototype.saveLayout = function() {
		var objs = tempLyt.getResultObj();//获取原布局数据
		var newname = objs.layouts[0].name;//原布局名称
		if (newname === "") {//不存在布局名称情况下，将布局名称保存到名称模板
			this.addLyttemp("");
			return;
		}
		if (this.lytnameDiffCom(jQuery(".tvLyt .lytcurr").not(jQuery(".tvLyt .active")), newname)) {//判断新布局名称是否已经存在
			notify.warn("该布局名已存在，请重新输入！");
			this.addLyttemp(newname);

			if (localStorage.setItem("changeFlag")) {
				template = "";
			}
			return;
		}
		//保存修改之后布局(发送请求)
		this.setLytAjax(objs);

	};
	return initTvlayoutController;
});