define(["./dynamic.dom.js"], function(DynamicDom){

	//初始化公共动态dom文档逻辑
	var DOMPanel = DynamicDom.init();

	// 遮罩层
	var MaskLayer = {

		element: null,

		getElement: function() {
			if (this.element === null) {
				this.element = jQuery('#maskLayer');
				if (this.element.size() === 0) {
					this.element = jQuery('<div id="maskLayer"><iframe src="javascript:;"></iframe></div>').appendTo(DOMPanel.getPanel());
				}
			}

			return this.element;
		},

		show: function() {
			this.getElement().show();
			parent.showHideMasker && parent.showHideMasker("show");
		},

		hide: function() {
			this.getElement().hide();
			parent.showHideMasker && parent.showHideMasker("hide");
		}
	};
	/**
	 * 定义初始化入口
	 * @type {{init: Function, initGlobal: Function}}
	 */
	return {
		init: function () {
			return MaskLayer;
		},
		initGlobal: function () {
			(function () {
				this.MaskLayer = MaskLayer;
			}).call(window);
		}
	};
});