/**
 * 警力调度
 * @author Songjiang
 * @date   2015-12-30
 * @param  {[type]}   ){} [description]
 * @return {[type]}         [description]
 */
define(['/lbsplat/module/commanddispatch/policeSchedule/js/police-schedule-pack.js'], function(Pack){

	return (function(scope){
		//初始化
		scope.init = function(){
			Pack.init(map);
		};
		//释放警力调度事件
		scope.cancelPoliceSchedule = function(){
			Pack.cancelPoliceSchedule();
		};
		return scope;
	})({});
});