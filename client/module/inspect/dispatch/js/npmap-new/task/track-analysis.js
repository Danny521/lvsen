define(['/lbsplat/module/commanddispatch/track-analysis/js/track-analysis-pack.js',
	'jquery'], function(Pack){
		return (function(scope, $){
			
			scope.init = function(){
				Pack.init(map);
			};
			return scope;
		})({}, jQuery);
});