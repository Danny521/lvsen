/**
 * 事件订阅发布
 * author:fanll
 * new 之后使用（非全局事件） new创建实例时，必须传入当前使用的作用域
 */
define(function() {
	var PubSub = function(context) {
		this.context = context;
		this.callbacks = {};
	};
	PubSub.prototype = {
		subscribe: function(ev, callback) {
			var callbacks = this.callbacks;
			if (typeof callback === "function") {
				(callbacks[ev] || (callbacks[ev] = [])).push(callback);
			} else if (Object.prototype.toString.call(callback) === '[object Array]') {
				var singleCb;
				for (var i = 0, l = callback.length; i < l; i++) {
					if (typeof(singleCb = callback[i]) == "function") {
						(callbacks[ev] || (callbacks[ev] = [])).push(singleCb);
					}
				}
			}
		},
		publish: function() {
			var callbacks = this.callbacks;
			var args = Array.prototype.slice.call(arguments, 0),
				ev = args.shift(),
				calls = callbacks[ev];
			if (ev && calls) {
				var l;
				if ((l = calls.length) === 1) {
					return calls[0].apply(this.context, args);
				} else {
					for (var i = 0; i < l; i++) {
						calls[i].apply(this.context, args);
					}
				}
			}
		},
		unsubscribe: function(callback) {
			var callbacks = this.callbacks;
			var cbs;
			if (cbs = callbacks[ev]) {
				for (var i = 0, l = cbs.length; i < l; i++) {
					if (cbs[i] === callback) {
						cbs.slice(i);
					}
				}
			}
		},
		/**
		 * 注册事件集合
		 * @param  {[type]} events [对象]
		 * @return {[type]}        [description]
		 */
		regist: function(events) {
			if (events) {
				for (var ev in events) {
					if (events.hasOwnProperty(ev)) {
						this.subscribe(ev, events[ev]);
					}
				}
			}
			return this;
		}
	};

	return PubSub;
});