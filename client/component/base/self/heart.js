/**
 * 前端心跳维持逻辑
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-01-15 14:16:33
 * @version $Id$
 */

define(['mootools'],function() {
	//噗通心跳
	var HeartBeat = new Class({
		Implements: [Options, Events],
		heartFlag: null,
		heartCount: 0,
		initialize: function(options) {
			this.setOptions(options);
		},
		start: function() {
			var self = this;
			//只有在没有开启心跳的情况下才会启动心跳，如果已经开启心跳，再启动心跳将维持一组心跳，同时按照最后一次关闭的为准
			if (self.heartCount === 0 && self.heartFlag === null) {
				self.heartFlag = window.setInterval(function() {
					jQuery.get("/service/heart/beat");

				}, 6000);
			}
			self.heartCount++;
		},
		//取消向后端发送防止Session过期的请求
		stop: function() {
			var self = this;
			self.heartCount--;
			if (self.heartCount === 0 && self.heartFlag !== null) {
				window.clearInterval(self.heartFlag);
				self.heartFlag = null;
			}
		}
	});
	/**
	 * 定义初始化入口
	 * @type {{init: Function, initGlobal: Function}}
	 */
	return {
		init: function () {
			return new HeartBeat();
		},
		initGlobal: function () {
			(function () {
				this.HeartBeat = new HeartBeat();
			}).call(window);
		}
	};

})