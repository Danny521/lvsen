/**
 * [autoLayout 自动排版]
 * @author wumengmeng
 * @date   2014-12-11
 * @return {[type]}   [description]
 */
define([
	'base.self'
], function() {
	/**
	 * [AutoLayout description]
	 * @author wumengmeng
	 * @date   2014-12-18
	 */
	function AutoLayout() {};
	AutoLayout.prototype.containUl = "";
	AutoLayout.prototype.layoutContainer = "";
	AutoLayout.prototype.domFunction = function(dom) {};
	AutoLayout.prototype.autoLayout = function() {
		var items = jQuery(this.containUl).children(),
			length = items.length;
		if (length === 0) {
			return;
		}
		var nxn = Math.ceil(Math.pow(length, 1 / 2)),
			contentWidth = this.layoutContainer.width(),
			contentHeight = this.layoutContainer.height(),
			perWidth = contentWidth / nxn - nxn - 8,
			peiHeight = contentHeight / nxn - nxn - 8;
		var x, y, top, left, dom;
		for (var i = 0; i < length; i++) {
			dom = jQuery(items[i]);
			x = i % nxn;
			y = Math.floor(i / nxn);
			left = perWidth * x + 8;
			top = peiHeight * y + 8;
			dom.css({
				left: left,
				top: top,
				width: perWidth,
				height: peiHeight
			});
			var position = {
				"left": left,
				"top": top,
				"perWidth": perWidth,
				"peiHeight": peiHeight
			};
			this.domFunction(dom, position);
		}
	};
	return new AutoLayout();
});