/**
 * Created by Zhangyu on 2015/4/17.
 */
define(["js/npmap-new/map-const", "handlebars"], function(Constant) {
	var helper = {
		//地图选择（框选、圈选助手）
		mapSelect: function () {
			Handlebars.registerHelper("numToLetter", function (num) {
				return Constant.letters[num];
			});
		},
		//防控圈上的助手
		defenceCircle: function () {
			Handlebars.registerHelper("FilterDistance", function(distance) {
				if (distance) {
					return distance;
				} else {
					return 20;
				}
			});

			Handlebars.registerHelper("FilterColor", function(color) {
				if (!color) {
					return "#0c97d5";
				}
			});
		},
		//我的关注
		myAttention: function() {
			Handlebars.registerHelper("mills2str", function(num) {
				if (num) {
					num = Toolkit.mills2str(num);
					return num;
				}
				return "";
			});
		},
		//警卫路线
		guardRoute: function() {
			Handlebars.registerHelper("formatIndex", function (index) {
				return index + 1;
			})
		}
	}

	//加载助手
	for (var fun in helper) {
		if (helper.hasOwnProperty(fun) && typeof helper[fun] === "function") {
			helper[fun]();
		}
	}
});