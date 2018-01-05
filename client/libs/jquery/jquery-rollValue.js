/*******************************
 ** Date:2015-4-27
 **	Author:Leon
 ** eg:jQuery(obj).rollValue({minValue:-20,maxValue:50,step:5});
 *******************************/
;(function(jQuery) {
	jQuery.fn.rollValue = function(config) {
		jQuery.fn.rollValue.defaults = {
			minValue: 0,
			maxValue: 100,
			step: 2,
			callback: config.callback
		};
		var keypressDateFun = function($inputDate, K) {
	        var val = $inputDate.val() - 0,
	        	min = $inputDate.attr("min") - 0,
	        	max = $inputDate.attr("max") - 0,
	        	step = $inputDate.attr("step") - 0,
	        	value = val + K * step;

	        if (value === (max + 1)) {
	            value = min;
	        }
	        if (value === (min - 1)) {
	            value = max;
	        }

	        value = value < 10 ? "0" + value : value;
	        $inputDate.val(value).trigger("input");
		}

		var opt = jQuery.extend({}, jQuery.fn.rollValue.defaults, config);
		return this.each(function() {
			var _ele = jQuery(this),
				destination;
			_ele
			.on("mousewheel DOMMouseScroll", function(e) {
				var val = jQuery(this).val() - 0;
				if (e.type === "mousewheel") {
					var p = e.originalEvent.wheelDelta / 120;
				} else if (e.type === "DOMMouseScroll") {
					var p = e.originalEvent.detail * (-1) / 3;
				}
				destination = val + opt.step * p;

				if (destination === (opt.maxValue + 1)) {
		            destination = opt.minValue;
		        }
		        if (destination === (opt.minValue - 1)) {
		            destination = opt.maxValue;
		        }

				setTimeout(function(){
					var eleValue = destination,
						eleValue = eleValue < 10 ? "0" + eleValue : eleValue;
					_ele.val(eleValue);
					if (typeof opt.callback === "function") {
						opt.callback();
					}
				},50);
			})
			.on("input",function(){
				jQuery(this).val(this.value.replace(/\D+/g, ""));
				var value = jQuery(this).val()-0,
					max = jQuery(this).attr("max")-0,
					min = jQuery(this).attr("min")-0,
					isYearFlag = false;

				if (jQuery(this).attr("class").indexOf("year") !== -1) { // 年：达到四位数字再比对
					isYearFlag = true;
					if (jQuery(this).val().length < 4) {
						return;
					}
				}
				if (value && value > max) {
					jQuery(this).val(max);
				} else if (value && value < min) {
					jQuery(this).val(min);
				}

				opt.callback();
			})
			.on("keydown", function(event) {
				var e = event || window.event || arguments.callee.caller.arguments[0];
				if (e && e.keyCode === 38) { // 上键
					keypressDateFun(jQuery(this), 1)
				} else if (e && e.keyCode === 40) { // 上键
					keypressDateFun(jQuery(this), -1)
				}
			})

		});
	};
})(jQuery);
