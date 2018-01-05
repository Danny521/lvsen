/**
 * 
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02 
 * @description  左侧tab切换
 */
define(['./config',"ajaxModel",'pubsub',"base.self"], function(settings,ajaxModel,PubSub){
	var TabPanel = new Class({
		Implements: [Events, Options],
		options: {
			storeHouseMgr: null,
			active: "storehouse"
		},
		initialize: function(options) {
			var self = this;
			self.setOptions(options);
			self.bindTabEvent();
		},
		getActiveTab: function() {
			return this.options.active;
		},
		/*
		 *	tab 点击事件
		 */
		bindTabEvent: function() {
			var self = this;
			var opt = self.options;
			jQuery(".tab-panel  .tabs li").bind("click", function() {
				var el = jQuery(this);
				var panel = el.closest(".tab-panel");
				// 三联动
				el.addClass("active").siblings().removeClass("active");
				panel.children(".tab-header").children("div[data-hview=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				if (el.attr("data-tab") === "storehouse") {
					opt.active = "storehouse";
					opt.storeHouseMgr.listStorehouses(1, '');
				}
			});
		}
		
	});
	return TabPanel ;

});