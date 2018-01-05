/**
 * Created by Zhangxinyu on 2016/3/31.
 * description 联动规则缓存
 */
define(['jquery', 'handlebars', 'base.self'], function(jQuery){

	'use strict';

	//短信时效(时间段)
	var timeArea = {
		startHour: "00",
		startMinute: "00",
		endHour: "23",
		endMinute: "59"
	};

	var showMobile = false;
	//摄像机数据
	var cameraData = null;
	//电视墙布局数据
	var LayoutData = [];
	//克隆联动数据
	var cloneData = {
		phoneList: [],
		emailList: []
	};
	//有效联动数据
	var submitLinkageData = {
		phoneList: [],//手机号码列表(短信)
		emailList: [],// 邮箱列表
		sendMessage: false,// 是否发生消息通知
		showGIS: false,//是否在地图显示
		showMobile: false,//是否联动移动端
		tvwallList: [],//已选电视墙布局列表
		monitorCameraList: [], //已选监控画面摄像机列表
		PTZCameraList: [] //已选云台联动摄像机列表
	};

    /**
     * [clearCache 清空缓存]
     * @return {[type]} [description]
     */
	function clearCache(obj) {
		if (obj.phoneList.length > 0) {
			obj.phoneList.length = 0;
		}
		if (obj.emailList.length > 0) {
			obj.emailList.length = 0;
		}
		obj.sendMessage = false;
		obj.showMobile = false;
		obj.showGIS = false;
		if (obj.PTZCameraList && obj.PTZCameraList.length > 0) {
			obj.PTZCameraList.length = 0;
		}
		if (obj.monitorCameraList && obj.monitorCameraList.length > 0) {
			obj.monitorCameraList.length = 0;
		}
		if (obj.monitorCameraList && obj.tvwallList.length > 0) {
			obj.tvwallList.length = 0;
		}
	}
    /**
     * [compiler Handlebars预加载模板]
     * @param  {[type]} url [html片段路径]
     * @return {[type]}              [description]
     */
	function compiler(url, renderData, callback){
		jQuery.when(Toolkit.loadTempl(url)).done(function(source) {
			var template = Handlebars.compile(source);
			var html = template(renderData);
			callback && callback(html);
		});
	}

	return{
		timeArea: timeArea,
		cameraData: cameraData,
		LayoutData: LayoutData,
		compiler: compiler,
		clearCache: clearCache,
		cloneData: cloneData,
		submitLinkageData: submitLinkageData
	}
})