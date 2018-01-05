/**
 *
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-04-25 11:48:45
 * @version $Id$
 */

define(['jquery'], function($) {

	/**
	 * [moveDom 拖拽插件]
	 * @author yuqiu
	 * @date   2015-05-22T15:08:52+0800
	 * @param  {[type]}                 dom [需要拖拽的dom元素]
	 * @return {[type]}                     [无]
	 */
	var moveDom = function(dom) {
		var sign = 0,
			begin = {
				x: 0,
				y: 0
			},
			position = {},
			self = this,
			minWidth = 0,
			release = function(e) {
				jQuery(document).off('mousemove', handler);
				jQuery(document).off('mouseup', release);
				dom.css({
					"cursor": '',
					"z-index": '9999'
				});
			},
			handler = function(event) {
				var left = position.left + event.clientX - begin.x,
					top = position.top + event.clientY - begin.y;
				dom.css({
					left: left,
					top: top
				});
			};
		dom.on('load', function() {
			minWidth = dom.width();
			self.setPosition();
		});
		dom.find('input').mousedown(function(event) {
			event.stopPropagation();
			/* Act on the event */
		});
		dom.mouseover(function(event) {
			dom.css({
				"cursor": 'move',
				"z-index": '9999'
			});
		});
		dom.mousedown(function(event) {
			event.preventDefault();
			sign = 1;
			position = dom.position();
			begin.x = event.clientX;
			begin.y = event.clientY;
			$(document).on('mousemove', handler).on('mouseup', release);
		});
	};

	return moveDom;
})