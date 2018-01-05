/**
 * Created by Leon.z on 2016/1/27.
 */
define(["require","domReady","mootools","js/globar-varibal.js","jquery-ui-1.10.1.custom.min","base.self","permission"],function(require,domReady,mootools,_g){
    domReady(function(){
        require(["js/view/inspectPlan-view","/module/settings/inspectPlanSet/js/controller/inspectController.js"],function(mainView,inspectCtr){
        	_g.compiler = _g.loadTemplate(_g.templateUrl,function(compiler){
				mainView.init(inspectCtr)
				inspectCtr.init(compiler);
			})
        });
    });
});