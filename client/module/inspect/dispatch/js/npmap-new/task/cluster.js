define(['/lbsplat/component/business/clusterlayer/cluster-layer-view.js'], function(Cluster) {
	return (function (scope, $) {
		scope.showOrHideAllResourceLayer = function (flag) {
			Cluster.showOrHideAllResourceLayer(flag);
		};

		return scope;
	})({}, jQuery);
});