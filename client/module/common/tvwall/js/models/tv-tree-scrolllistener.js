define(["base.self"], function() {
	// 刷新边栏高度滚动条
	var ScrollListener = function() {};
	ScrollListener.prototype = {

		timer: null,

		initialize: function() {
			this.treePanel = jQuery('#treePanel');
			this.camerasPanel = jQuery('#camerasPanel');
			this.formPanel = this.treePanel.find('.form-panel');
			this.scrollbar = this.camerasPanel.children('.scrollbar');
			this.viewport = this.camerasPanel.children('.viewport');

			// 初始化容器
			// this.camerasPanel.tinyscrollbar({
			// 	thumbSize: 60
			// });

			this.bindEvents();

			this.start();
		},

		start: function() {
			this.stop();

			var self = this;
			/*self.viewport.css('height', jQuery(document).height() - (36 + 50 + 10 + 36 + 55 + self.formPanel.height()));
			self.camerasPanel.tinyscrollbar_update('relative');
			self.treePanel.toggleClass('overflow', !self.scrollbar.is('.disable'));*/
			this.timer = setInterval(function() {
				var ptzHeight = 0;
				jQuery("#camerasPanel").css('height', jQuery(document).height() - (36 + 50 + 10 + 36 + 55));
				/*self.camerasPanel.tinyscrollbar_update('relative');
				self.treePanel.toggleClass('overflow', !self.scrollbar.is('.disable'));*/
			}, 1000);
		},

		stop: function() {
			clearInterval(this.timer);
		},
		bindEvents: function() {
			// var self = this;
			// // 拖拽滚动条暂停定位
			// this.scrollbar.children('.track').mousedown(function(event) {
			// 	event.preventDefault();//阻止默认事件，防止拖动选中文本
			// 	self.stop();
			// 	// 松开后重启
			// 	jQuery(document).one('mouseup', self.start.bind(self));
			// });
		}

	};
	jQuery(document).resize(function() {
		ScrollListener.start();
	});
	return new ScrollListener();
});