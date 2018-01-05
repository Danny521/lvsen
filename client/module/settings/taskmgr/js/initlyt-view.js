/**
 * [电视墙设置页面电视墙布局设置视图类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	'/module/settings/taskmgr/js/tempLyt.js',
	'/module/common/tvwall/js/views/templteGet.js',
	'base.self'
], function(tempLyt) {
	function initTvlayoutView() {}
	initTvlayoutView.prototype.options = {
		currentName: ""
	};
	/**
	 * [createLyt 加载已有布局，显示]
	 * @type {[type]}
	 */
	initTvlayoutView.prototype.createLyt = function(data) {
		var that = this;
		var $lyt, id;
		var $li = jQuery(".tvLyt ul .lyt").closest("li");
		$li.prevAll().remove();
		$lyt = $(template({
			"initLyt": data
		}));
		$li.before($lyt);
		//删除已有布局
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
	};
	/**
	 * [loadLytemp 渲染模版显示]
	 * @type {[type]}
	 */
	initTvlayoutView.prototype.loadLytemp = function(data) {
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
		}
	};
	/**
	 * [addLyttemp 保存布局名称模版]
	 * @type {[type]}
	 */
	initTvlayoutView.prototype.addLyttemp = function(name) {
		var self = this;
		var $aChnl = $("#aChnl");
		if (template) {
			$aChnl.html(template({
				"addLyt": {}
			}));
			$aChnl.show();
			jQuery("#major .lytname").focus();
			jQuery("#major .lytname").val(name);
		}
	};
	/**
	 * [createTempLyt 新增布局加载模版]
	 * @type {[type]}
	 */
	initTvlayoutView.prototype.createTempLyt = function($dom) {
		var that = this;
		var $li;
		$li = $(template({
			"lytst": {}
		}));
		//删除新增布局
		$li.find(".close").click(function() {
			$li.remove();
			jQuery(".viewport .deviceMenu .tree li").filter(".load").removeClass("load");
			if ($li.hasClass("active")) {
				tempLyt.addDirLayout();
			}

			return false;
		});
		$dom.closest("li").before($li);
	};
	return initTvlayoutView;
});