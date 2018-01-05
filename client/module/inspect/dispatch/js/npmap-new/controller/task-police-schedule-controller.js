/**
 * 警力调度控制器
 * @author Li Dan
 * @date   2014-12-19
 */
define(['js/npmap-new/view/task-police-schedule-view', 'js/npmap-new/controller/map-infowindow-controller'], function(PoliceScheduleView, MapInfoWindow){
	return new PoliceScheduleView(MapInfoWindow);
});