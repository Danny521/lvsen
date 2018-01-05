/**
 * [电视墙设置页面电视墙布局滚动条]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define(["domReady", "base.self"], function(domReady) {

	var ScrollListener = {
		timer: null,

		initialize: function() {
			this.treePanel = jQuery('#treePanel');
			this.camerasPanel = jQuery('#camerasPanel');
			this.formPanel = this.treePanel.find('.form-panel');
			this.scrollbar = this.camerasPanel.children('.scrollbar');
			this.viewport = this.camerasPanel.children('.viewport');

			// 初始化容器
			/*this.camerasPanel.tinyscrollbar({
				thumbSize: 60
			});*/

			this.bindEvents();

			this.start();
		},

		start: function() {
			this.stop();

			var self = this;
			this.timer = setInterval(function() {
				self.viewport.css('height', jQuery(document).height() - (36 + 50 + 10 + 36 + 55));
				/*self.camerasPanel.tinyscrollbar_update('relative');
				self.treePanel.toggleClass('overflow', !self.scrollbar.is('.disable'));*/
			}, 1);
		},

		stop: function() {
			clearInterval(this.timer);
		},

		bindEvents: function() {
			var self = this;

			// 拖拽滚动条暂停定位
			this.scrollbar.children('.track').mousedown(function() {
				self.stop();
				// 松开后重启
				jQuery(document).one('mouseup', self.start.bind(self));

			});
		}
	};
	ScrollListener.initialize();


	//横向滚动条


	/**
	 * [axis description]
	 * @type {String}
	 */
	jQuery("#lypan").tinyscrollbar({
		axis: 'x',
		sizethumb: 2
	});
	jQuery("#lypan .scrollbar .thumb").width("30px");
	// return ScrollListener;
});
