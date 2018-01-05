define([
	"/module/settings/mapconfig/js/visible-area-view.js",
	"/module/settings/mapconfig/js/visible-area-model.js"
], function(View, Model){

	return (function(scope){

		
		scope.init = function() {
			//初始化
			View.init(scope);
		};

		return scope;
	}({}));

});