/**
 * Created by Leon.z on 2015/10/14.
 * 布防实时巡检入口
 */
define([
	"js/global-varibale",
	"js/AllDeal",
	"js/mainEvents",
	"base.self"
], function(_g,mainDeal,mainEvents) {
	return {
		init:function(){
			this.loadTemplate();
		},
		loadTemplate:function(){
			_g.compiler = _g.loadTemplate(_g.templateUrl,function(compiler){
				mainEvents.init(mainDeal)
				mainDeal.init(compiler);
			})
			
			
		}


	}
});