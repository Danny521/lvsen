/**
 * [警卫路线]
 * @date   2015-11-30
 */
define(["/lbsplat/module/commanddispatch/guard-route/js/guard-route-view.js",
		"/lbsplat/module/commanddispatch/guard-route/js/guard-route-group-view.js",
		"style!/lbsplat/module/commanddispatch/guard-route/css/guard-route.css"], function(GuardRoute, GuardRouteGroup){

	return (function(scope, $){
		//初始化
		scope.init = function(){
			//初始化
			GuardRouteGroup.init(map, $("#sidebar-body"));
			//获取警卫路线分组
			GuardRouteGroup.getGroups();
		};
		return scope;
	})({}, jQuery);
});