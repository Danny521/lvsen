define(function(require, exports, module) {
    var PubSub = function() {
        this.callbacks = {};
    }
    PubSub.prototype = {
        subscribe: function(ev, callback) {
            var callbacks = this.callbacks;
            if (typeof callback == "function") {
                (callbacks[ev] || (callbacks[ev] = [])).push(callback);
            } else if (Object.prototype.toString.call(callback) === '[Object Array]') {
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
                ev = args[0],
                calls = callbacks[ev];
            if (ev && calls) {
                var l;
                if ((l = calls.length) == 1) {
                    return calls[0].apply(null, args);
                } else {
                    for (var i = 0; i < l; i++) {
                        calls[i].apply(null, args);
                    }
                }
            }
        }
    };
    module.exports = PubSub;
});