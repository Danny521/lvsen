define(["/lbsplat/component/business/map-gps-refresh/map-gps-refresh-view.js"], function(View){
		return (function(scope, $){			
			scope.triggerResRefresh = function() {
				View.triggerResRefresh();
			};
			scope.stopResRefresh = function(){
				View.stopResRefresh();
			};
			scope.init = function(map){
				View.init(map);
			};
			return scope;
		})({}, jQuery);
});