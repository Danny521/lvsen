/**
 * 系统对console.log的扩展
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-01-15 11:01:46
 * @version $Id$
 */

define(["pvaConfig"], function() {
	//解决ie8下console语句未定义
	if (!window.console) {
		var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
			"group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"
		];
		window.console = {};
		for (var i = 0; i < names.length; ++i) {
			window.console[names[i]] = function() {}
		}
	}
});