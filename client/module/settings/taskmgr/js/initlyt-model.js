/*global logDict:true */
/**
 * [电视墙设置页面电视墙布局设置模型类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	'/module/settings/taskmgr/js/tempLyt.js',
	'/module/settings/taskmgr/js/initdev-controller.js',
	'ajaxModel',
	'/module/settings/taskmgr/js/initlyt-view.js',
	'base.self'
], function(tempLyt, initDevController, ajaxModel, initTvlayoutView) {
	var devTree = new initDevController();
	/**
	 * [initTvlayoutModel description]
	 * @type {Class}
	 */
	function initTvlayoutModel() {}
	initTvlayoutModel.prototype = new initTvlayoutView();
	initTvlayoutModel.prototype.urls = {
		//LOADLYTURL: "/service/pow/query_layout" + "?timestamp=" + new Date().getTime(),
		LOADLYTURL: "/service/config/tvwall/layouts",
		REMOVEURL: '/service/config/tvwall/layout/',
		//ADDLYTURL: '/service/pow/add_all'
		ADDLYTURL: '/service/config/tvwall/layout/'
	};
	/**
	 * [loadLytData 请求已有布局]
	 * @type {[type]}
	 */
	initTvlayoutModel.prototype.loadLytData = function() {
		var self = this;
		ajaxModel.getData(self.urls.LOADLYTURL, null, {
			cache: false
		}).then(function(res) {
			lytdata = res;
			if (lytdata.code === 200) {
				//渲染模版显示
				self.loadLytemp(lytdata.data);
			} else {
				notify.error("获取布局数据失败！");
			}
		});
	};

	/**
	 * [initChecked 若无默认布局选中当前最新设备的布局]
	 * @type {[type]}
	 */
	initTvlayoutView.prototype.initChecked = function() {		
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
	};

	/**
	 * [deleteLyt 删除布局]
	 * @type {[type]}
	 */
	initTvlayoutModel.prototype.deleteLyt = function($li) {
		var that = this;
		var lytid = $li.attr("data-id").trim();
		var lyName = $li.attr("data-name");
		ajaxModel.postData(that.urls.REMOVEURL + lytid,{_method:'delete'}).then(function(res) {
			if (res.code === 200) {
				notify.success(res.data.message);
				logDict.insertMedialog("m3", "删除" + lyName + '电视墙布局', "f8", "o3");
				if ($li.hasClass("active")) {
					that.options.currentName = "";
				} else {
					that.options.currentName = $(".tvLyt li").filter(".active").attr("data-name");
				}
				that.loadLytData();
			}
		});
	};
	/**
	 * [setLytDefault 设置默认布局]
	 * @author wumengmeng
	 * @date   2014-12-12
	 */
	initTvlayoutModel.prototype.setLytDefault = function() {
		var activeLytid = jQuery("#major .tvLyt .active").attr("data-id").trim(),
			lytNameCurrent = jQuery("#major .tvLyt .active").attr("data-name").trim();
		ajaxModel.postData('/service/config/tvwall/layout/default/' + activeLytid ).then(function(res) {
			if (res.code === 200) {
				notify.success("设置默认布局成功！");
				logDict.insertMedialog("m3", "设置" + lytNameCurrent + "电视墙布局为默认布局", "f8");
			}
			if (res.code === 500) {
				notify.warn("设置默认布局失败！");
			}
		});
	};

	/**
	 * [setLytAjax 保存布局请求]
	 * @type {[type]}
	 */
	initTvlayoutModel.prototype.setLytAjax = function(currObj) {
		var that = this;
		that.options.currentName = currObj.layouts[0].name;
		var currObjArr = [];		
		var savelyt = JSON.stringify(currObj);
		ajaxModel.postData(that.urls.ADDLYTURL + "?timestamp=" + new Date().getTime(), {
			"savelyt": savelyt
		}, {
			dataType: 'json'
		}).then(function(res) {
			if (res.code === 200) {//保存修改之后的原始布局并且渲染当前点击布局的详细布局
				notify.success(res.data.message);
				//请求后台数据获取当前点击布局的详细布局信息
				that.loadLytData();
				//清除左侧设备树样式
				that.updateLytData();
				//重新设置左侧设备树样式
				devTree.initDevActive();
				tempLyt.addDirLayout();
				// location.href = location.href+"#";
			} else {
				notify.error("保存布局失败！");
			}
		});
	};
	return initTvlayoutModel;
});