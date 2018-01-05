define(["/lbsplat/module/commanddispatch/MyAttention/MyAttention-list.js"], function(View){
		return (function(scope, $){			
			scope.dealOnLoadMyAttention = function(container,map){
				View.dealOnLoadMyAttention(container,map);
			};
			return scope;
		})({}, jQuery);
});