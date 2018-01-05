/**
 * [电视墙设置页面电视墙布局编辑类调用]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	'/module/common/tvwall/js/controllers/tv-layout-edit.js',
	'/module/common/tvwall/js/views/templteGet.js',
	'base.self'
], function(TvLayoutEdit) {
	/**
	 * [tempLyt description]
	 * @type {TvLayoutEdit}
	 */
	function tempLyt() {}
	tempLyt.prototype = new TvLayoutEdit();
	tempLyt.prototype.$layoutContainer = jQuery(".tvList");
	tempLyt.prototype.template = template;
	tempLyt.prototype.saveFun = function() {};
	tempLyt.prototype.removeItemFun = function($dom) {
		var serverId = $dom.attr("data-pvgid").trim(),
			$treeEle = $("#treePanel .devices[data-id='" + serverId + "'] .childeslist");
		if ($treeEle.length !== 0) {
			for (var i = 0; i < $treeEle.length; i++) {
				if ($dom.attr("data-monitorid").trim() === $treeEle.eq(i).attr("data-monitorid")) {
					$treeEle.eq(i).closest("li").removeClass("load");
				}
			}
		}
		
	};
	return new tempLyt();
});